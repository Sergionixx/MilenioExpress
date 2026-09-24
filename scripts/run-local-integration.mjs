import { execFileSync, spawn } from 'node:child_process';
import { openSync, closeSync, mkdirSync } from 'node:fs';

// Read only the isolated CLI environment. Never print its private values.
const raw = execFileSync('supabase', ['status', '-o', 'env'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const variables = Object.fromEntries(raw.split('\n').filter(line => /^[A-Z_]+=/.test(line)).map(line => {
  const index = line.indexOf('=');
  return [line.slice(0,index), line.slice(index+1).replace(/^"|"$/g, '')];
}));
const env = {
  ...process.env,
  SUPABASE_URL: variables.API_URL,
  SUPABASE_ANON_KEY: variables.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: variables.SERVICE_ROLE_KEY,
  SUPABASE_JWT_SECRET: variables.JWT_SECRET,
};
for (const key of ['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_JWT_SECRET']) {
  if (!env[key]) throw new Error(`Supabase local no entregó ${key}`);
}
mkdirSync('reportes/integracion', {recursive:true});
const log = openSync(process.env.RUNNER_TEMP ? `${process.env.RUNNER_TEMP}/milenio-edge.log` : '/tmp/milenio-edge.log', 'w');
const server = spawn('supabase', ['functions', 'serve', 'make-server-845b49a4', '--no-verify-jwt'], { stdio: ['ignore', log, log] });
let ready = false;
try {
  for (let attempt=0; attempt<90; attempt++) {
    try {
      const response = await fetch(`${env.SUPABASE_URL}/functions/v1/make-server-845b49a4/health`, {signal:AbortSignal.timeout(2000)});
      if (response.ok && (await response.json()).status === 'ok') { ready=true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve,1000));
  }
  if (!ready) throw new Error('La función local no estuvo disponible tras 90 intentos');
  const child=spawn(process.execPath,['scripts/integration-supabase.mjs'],{env,stdio:'inherit'});
  process.exitCode=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>resolve(code??1));});
} finally { server.kill('SIGTERM'); closeSync(log); }
