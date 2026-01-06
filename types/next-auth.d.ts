import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  // Extend the Session object (client-side)
  interface Session {
    user: {
      id: string;
      position: string;
      role: string;
    } & DefaultSession["user"];
  }

  // Extend the User object (database)
  interface User {
    id: string;
    position: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  // Extend the JWT token
  interface JWT {
    id: string;
    position: string;
    role: string;
  }
}