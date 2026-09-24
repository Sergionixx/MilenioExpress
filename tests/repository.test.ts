import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { AppError } from "../supabase/functions/server/domain.ts";
import { createSupabaseRepository } from "../supabase/functions/server/repository.ts";

const ownerId = "11111111-1111-4111-8111-111111111111";
const profile = { id: ownerId, email: "owner@example.test", display_name: "Ana", role: "USER" };
const input = { ownerId, recipient: "Ana", address: "Reforma 123", city: "CDMX", description: "Documentos" };
const shipment = {
  id: "shipment-1", guide: "ME-2026-00000001", owner_id: ownerId,
  recipient: input.recipient, address: input.address, city: input.city,
  description: input.description, status: "Registrado", created_at: "2026-09-24T12:00:00.000Z",
};

function repository(respond: (request: Request) => Response | Promise<Response>) {
  const db = createClient("https://supabase.example.test", "server-only-test-key", {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: async (input, init) => respond(new Request(input, init)) },
  });
  return createSupabaseRepository(db);
}

test("repository sends each JWT to Supabase Auth for verification", async () => {
  const repo = repository((request) => {
    assert.equal(new URL(request.url).pathname, "/auth/v1/user");
    assert.equal(request.headers.get("Authorization"), "Bearer session-token");
    return Response.json({ id: ownerId, email: profile.email, user_metadata: { role: "ADMIN" } });
  });
  // Editable metadata is discarded; the service reads the role from profiles.
  assert.deepEqual(await repo.verifyToken("session-token"), { id: ownerId, email: profile.email });
  const noEmail = repository(() => Response.json({ id: ownerId }));
  assert.deepEqual(await noEmail.verifyToken("session-token"), { id: ownerId, email: "" });
});

test("verification rejects invalid/expired JWTs and preserves service outages", async () => {
  for (const status of [400, 401, 403]) {
    const repo = repository(() => Response.json({ msg: "invalid JWT", code: "bad_jwt" }, { status }));
    assert.equal(await repo.verifyToken("invalid-token"), null);
  }
  const outage = repository(() => Response.json({ msg: "provider unavailable" }, { status: 500 }));
  await assert.rejects(outage.verifyToken("session-token"));
  const noUser = createSupabaseRepository({
    auth: { getUser: async () => ({ data: { user: null }, error: null }) },
  } as unknown as Parameters<typeof createSupabaseRepository>[0]);
  assert.equal(await noUser.verifyToken("session-token"), null);
  const unspecifiedError = createSupabaseRepository({
    auth: { getUser: async () => ({ data: { user: null }, error: new Error("network unavailable") }) },
  } as unknown as Parameters<typeof createSupabaseRepository>[0]);
  await assert.rejects(unspecifiedError.verifyToken("session-token"));
});

test("profile lookup scopes by verified id and handles missing/error rows", async () => {
  const repo = repository((request) => {
    const url = new URL(request.url);
    assert.equal(url.pathname, "/rest/v1/profiles");
    assert.equal(url.searchParams.get("id"), `eq.${ownerId}`);
    assert.equal(url.searchParams.get("select"), "id,email,display_name,role");
    return Response.json([profile]);
  });
  assert.deepEqual(await repo.getProfile(ownerId), profile);
  assert.equal(await repository(() => Response.json([])).getProfile(ownerId), null);
  await assert.rejects(repository(() => Response.json({ message: "db unavailable" }, { status: 500 })).getProfile(ownerId));
});

test("owner listing retrieves every page in stable name/id order", async () => {
  const offsets: string[] = [];
  const repo = repository((request) => {
    const url = new URL(request.url);
    assert.equal(url.searchParams.get("order"), "display_name.asc,id.asc");
    assert.equal(url.searchParams.get("limit"), "500");
    const offset = url.searchParams.get("offset")!;
    offsets.push(offset);
    return Response.json(offset === "0" ? Array.from({ length: 500 }, (_, i) => ({ ...profile, id: `owner-${i}` })) : [profile]);
  });
  assert.equal((await repo.listProfiles()).length, 501);
  assert.deepEqual(offsets, ["0", "500"]);
  assert.deepEqual(await repository(() => Response.json(null)).listProfiles(), []);
  await assert.rejects(repository(() => Response.json({ message: "db unavailable" }, { status: 500 })).listProfiles());
});

test("shipment listing pages consistently and keeps USER scope on every page", async () => {
  const offsets: string[] = [];
  const repo = repository((request) => {
    const url = new URL(request.url);
    assert.equal(url.searchParams.get("owner_id"), `eq.${ownerId}`);
    assert.equal(url.searchParams.get("order"), "created_at.desc,id.desc");
    assert.equal(url.searchParams.get("limit"), "500");
    const offset = url.searchParams.get("offset")!;
    offsets.push(offset);
    return Response.json(offset === "0" ? Array.from({ length: 500 }, (_, i) => ({ ...shipment, id: `shipment-${i}` })) : [shipment]);
  });
  assert.equal((await repo.listShipments(ownerId)).length, 501);
  assert.deepEqual(offsets, ["0", "500"]);
  const admin = repository((request) => {
    assert.equal(new URL(request.url).searchParams.get("owner_id"), null);
    return Response.json([shipment]);
  });
  assert.deepEqual(await admin.listShipments(), [shipment]);
  assert.deepEqual(await repository(() => Response.json(null)).listShipments(ownerId), []);
  await assert.rejects(repository(() => Response.json({ message: "db unavailable" }, { status: 500 })).listShipments(ownerId));
});

test("guide lookup uses an equality filter and preserves storage errors", async () => {
  const repo = repository((request) => {
    assert.equal(new URL(request.url).searchParams.get("guide"), `eq.${shipment.guide}`);
    return Response.json([shipment]);
  });
  assert.deepEqual(await repo.getShipment(shipment.guide), shipment);
  assert.equal(await repository(() => Response.json([])).getShipment(shipment.guide), null);
  await assert.rejects(repository(() => Response.json({ message: "db unavailable" }, { status: 500 })).getShipment(shipment.guide));
});

test("registration writes only validated details and reads the database-generated guide", async () => {
  const repo = repository(async (request) => {
    assert.equal(request.method, "POST");
    assert.equal(new URL(request.url).pathname, "/rest/v1/shipments");
    assert.deepEqual(await request.json(), {
      owner_id: ownerId, recipient: input.recipient, address: input.address, city: input.city, description: input.description,
    });
    return Response.json(shipment, { status: 201 });
  });
  assert.deepEqual(await repo.createShipment(input), shipment);
});

test("registration maps unique/FK conflicts and propagates unexpected database errors", async () => {
  for (const [dbCode, status, code] of [["23505", 409, "GUIDE_CONFLICT"], ["23503", 400, "OWNER_NOT_FOUND"]] as const) {
    const repo = repository(() => Response.json({ code: dbCode, message: "private schema detail" }, { status: 409 }));
    await assert.rejects(repo.createShipment(input), (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.status, status);
      assert.equal(error.code, code);
      assert.doesNotMatch(error.message, /private schema detail/);
      return true;
    });
  }
  await assert.rejects(repository(() => Response.json({ code: "unexpected", message: "db unavailable" }, { status: 500 })).createShipment(input));
});
