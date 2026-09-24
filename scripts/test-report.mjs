import { mkdirSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const directory = 'reportes/pruebas-unitarias';
mkdirSync(directory, { recursive: true });
const sources = [
  'src/lib/http.ts', 'src/lib/session.ts', 'src/lib/authErrors.ts',
  'supabase/functions/server/domain.ts', 'supabase/functions/server/service.ts',
  'supabase/functions/server/handler.ts', 'supabase/functions/server/repository.ts',
];
const result = spawnSync(process.execPath, [
  '--experimental-strip-types', '--test', '--experimental-test-coverage',
  ...sources.map(file => `--test-coverage-include=${file}`),
  '--test-coverage-lines=80', '--test-coverage-branches=80', '--test-coverage-functions=80',
  '--test-reporter=spec', '--test-reporter-destination=stdout',
  '--test-reporter=tap', `--test-reporter-destination=${directory}/coverage.tap`,
  '--test-reporter=lcov', `--test-reporter-destination=${directory}/lcov.info`,
  ...readdirSync('tests').filter(file => file.endsWith('.test.ts')).map(file => `tests/${file}`),
], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
