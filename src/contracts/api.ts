/** KAN-11: proposed wire contract; not runtime validation or authorization. */
export type AppRole = "ADMIN" | "USER";

/** Constructed only after the server verifies the session and trusted role. */
export interface AuthenticatedUser {
  id: string;
  role: AppRole;
}

export interface CreatePackageRequest {
  ownerId: string;
  recipient: string;
  address: string;
  city: string;
  description: string;
}

export interface PackageDto extends CreatePackageRequest {
  id: string;
  guide: string;
  createdAt: string;
}

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: Partial<Record<keyof CreatePackageRequest | "guide", string>>;
  };
}

export interface PackageResponse {
  data: PackageDto;
}
