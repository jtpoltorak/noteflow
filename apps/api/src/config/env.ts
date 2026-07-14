/**
 * Startup environment validation.
 *
 * Called once before the server starts. Fails fast with a clear message if the
 * app is misconfigured — most importantly, this prevents ever booting with the
 * placeholder secrets from `.env.example` or with weak/missing JWT secrets.
 */

const MIN_SECRET_LENGTH = 32;

// Known placeholder values that must never reach production.
const PLACEHOLDER_SECRETS = new Set([
  "replace-this-with-a-long-random-string",
  "replace-this-too",
  "replace-this",
  "changeme",
  "secret",
]);

function validateSecret(name: string, value: string | undefined, errors: string[]): void {
  if (!value || value.trim() === "") {
    errors.push(`${name} is not set`);
    return;
  }
  if (PLACEHOLDER_SECRETS.has(value)) {
    errors.push(`${name} is still a placeholder value — generate a real secret`);
    return;
  }
  if (value.length < MIN_SECRET_LENGTH) {
    errors.push(`${name} must be at least ${MIN_SECRET_LENGTH} characters (got ${value.length})`);
  }
}

/** Validate required environment variables. Throws if any are invalid. */
export function validateEnv(): void {
  const errors: string[] = [];

  validateSecret("JWT_SECRET", process.env.JWT_SECRET, errors);
  validateSecret("REFRESH_TOKEN_SECRET", process.env.REFRESH_TOKEN_SECRET, errors);

  if (
    process.env.JWT_SECRET &&
    process.env.REFRESH_TOKEN_SECRET &&
    process.env.JWT_SECRET === process.env.REFRESH_TOKEN_SECRET
  ) {
    errors.push("JWT_SECRET and REFRESH_TOKEN_SECRET must be different values");
  }

  if (errors.length > 0) {
    console.error("\n❌ Invalid environment configuration:\n");
    for (const e of errors) console.error(`   • ${e}`);
    console.error(
      '\nGenerate a strong secret with:\n  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"\n'
    );
    throw new Error("Environment validation failed");
  }
}
