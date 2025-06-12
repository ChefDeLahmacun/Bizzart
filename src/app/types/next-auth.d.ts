import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

// Extend the User type
declare module "next-auth" {
  interface User extends DefaultUser {
    language?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      language?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    language?: string;
  }
} 