import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

import { PrismaAdapter } from "@auth/prisma-adapter";

export const { auth, signIn, signOut, handlers } = NextAuth({
    adapter: PrismaAdapter(db),
    session: { strategy: "jwt" },
    ...authConfig,
    trustHost: true,
    providers: [
        GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
            authorization: {
                params: {
                    scope: "read:user user:email repo",
                },
            },
        }),
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(4) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await db.user.findUnique({ where: { email } });
                    if (!user || !user.password) return null;
                    const passwordsMatch = await bcrypt.compare(password, user.password);

                    if (passwordsMatch) return user;
                }

                console.log("Invalid credentials");
                return null;
            },
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user, account, profile }) {
            if (account?.provider === "github" && account.access_token) {
                try {
                    // Update user with GitHub access token
                    // We need to find the user by email first because they might be logging in with GitHub for the first time
                    // but already have an account (if emails match).
                    // Or if they are already logged in and connecting.

                    if (user.email) {
                        const existingUser = await db.user.findUnique({ where: { email: user.email } });
                        if (existingUser) {
                            await db.user.update({
                                where: { email: user.email },
                                data: { githubAccessToken: account.access_token },
                            });
                            return true;
                        }
                    }
                } catch (error) {
                    console.error("Error saving GitHub token:", error);
                }
            }
            return true;
        },
        async jwt({ token, user, account }) {
            if (account?.provider === "github" && account.access_token) {
                token.accessToken = account.access_token;
            }
            if (user) {
                // @ts-ignore
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            if (token.role && session.user) {
                // @ts-ignore
                session.user.role = token.role;
            }
            if (token.accessToken && session.user) {
                // @ts-ignore
                session.user.githubAccessToken = token.accessToken as string;
            }
            return session;
        }
    },
});
