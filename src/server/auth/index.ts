import NextAuth, { type NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Nodemailer from "next-auth/providers/nodemailer";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import {
  env,
  isGoogleConfigured,
  isGitHubConfigured,
  isEmailConfigured,
} from "@/env";
import { getMongoClientPromise } from "@/server/db/mongoClient";

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  if (isGoogleConfigured) {
    providers.push(
      Google({
        clientId: env.AUTH_GOOGLE_ID,
        clientSecret: env.AUTH_GOOGLE_SECRET,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }

  if (isGitHubConfigured) {
    providers.push(
      GitHub({
        clientId: env.AUTH_GITHUB_ID,
        clientSecret: env.AUTH_GITHUB_SECRET,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }

  // Email magic-link requires a database adapter to store verification tokens.
  if (isEmailConfigured && getMongoClientPromise()) {
    providers.push(
      Nodemailer({
        server: env.EMAIL_SERVER,
        from: env.EMAIL_FROM,
      }),
    );
  }

  return providers;
}

const mongoClientPromise = getMongoClientPromise();

/**
 * In development we fall back to a fixed, insecure secret so the app runs with
 * zero configuration. Production requires a real AUTH_SECRET (`npx auth secret`).
 */
const authSecret =
  env.AUTH_SECRET ??
  (env.NODE_ENV === "development"
    ? "dev-insecure-secret-do-not-use-in-production"
    : undefined);

export const authConfig: NextAuthConfig = {
  adapter: mongoClientPromise
    ? MongoDBAdapter(mongoClientPromise, { databaseName: env.MONGODB_DB })
    : undefined,
  providers: buildProviders(),
  secret: authSecret,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
