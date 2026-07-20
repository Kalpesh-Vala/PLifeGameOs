import { z } from "zod";

/**
 * Centralized, validated environment configuration.
 * Server-only values must never be imported into client components.
 *
 * Most values are optional so the app can boot for local UI work before
 * external services (MongoDB, OAuth, GitHub Models) are configured. Features
 * that require a given value fail loudly at the point of use instead.
 */
const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Database
  // Not `.url()`: the standard (non-SRV) connection string lists multiple
  // comma-separated hosts, which is not a valid WHATWG URL. Mongoose validates
  // the actual connection string format at connect time.
  MONGODB_URI: z.string().min(1).optional(),
  MONGODB_DB: z.string().default("life_os"),

  // Auth.js
  AUTH_SECRET: z.string().min(1).optional(),
  AUTH_URL: z.string().url().optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),

  // Email (magic link) — optional
  EMAIL_SERVER: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // GitHub Models (AI) — PAT with `Models: read`
  GITHUB_MODELS_TOKEN: z.string().optional(),
  GITHUB_MODELS_BASE_URL: z
    .string()
    .url()
    .default("https://models.github.ai/inference"),
});

/**
 * Normalize raw env values before validation:
 * - trims whitespace
 * - treats empty strings as "not set" (undefined)
 * - treats unfilled `<placeholder>` values from .env.example as "not set"
 *
 * This lets a freshly-copied .env.example boot the app instead of crashing,
 * while any real value the user fills in is still validated normally.
 */
function cleanEnv(source: NodeJS.ProcessEnv): Record<string, string> {
  const keys = Object.keys(serverSchema.shape);
  const result: Record<string, string> = {};

  for (const key of keys) {
    const raw = source[key];
    if (raw === undefined) continue;

    const value = raw.trim();
    const isPlaceholder = value.includes("<") && value.includes(">");
    if (value === "" || isPlaceholder) continue;

    result[key] = value;
  }

  return result;
}

const parsed = serverSchema.safeParse(cleanEnv(process.env));

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
  );
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;

export const isDbConfigured = Boolean(env.MONGODB_URI);
export const isGoogleConfigured = Boolean(
  env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET,
);
export const isGitHubConfigured = Boolean(
  env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET,
);
export const isEmailConfigured = Boolean(env.EMAIL_SERVER && env.EMAIL_FROM);
export const isAiConfigured = Boolean(env.GITHUB_MODELS_TOKEN);
