import * as dotenv from 'dotenv';
import * as path from 'path';

const envName = process.env.ENV || 'dev';

// Env-specific, NON-secret values (BASE_URL, API_BASE_URL) — committed.
dotenv.config({ path: path.resolve(process.cwd(), `.env.${envName}`) });
// Secrets (credentials) — gitignored locally; in CI these arrive already
// set in process.env via GitHub Secrets, so this line finds nothing there
// and does nothing, which is correct (dotenv never overrides an
// already-set process.env value).
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var: ${name}. Expected in .env.${envName} (env-specific) ` +
        `or .env (secrets, gitignored) — or in CI, as a GitHub Secret.`
    );
  }
  return value;
}

export interface EnvConfig {
  env: string;
  baseUrl: string;
  apiBaseUrl: string;
  testUser: {
    email: string;
    password: string;
  };
}

export const config: EnvConfig = {
  env: envName,
  baseUrl: required('BASE_URL'),
  apiBaseUrl: required('API_BASE_URL'),
  testUser: {
    email: required('TEST_USER_EMAIL'),
    password: required('TEST_USER_PASSWORD'),
  },
};