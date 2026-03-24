import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// Common free email providers that should NOT be treated as organizations
const FREE_EMAIL_PROVIDERS = new Set([
    "gmail.com",
    "yahoo.com",
    "yahoo.co.in",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "aol.com",
    "icloud.com",
    "mail.com",
    "protonmail.com",
    "zoho.com",
    "yandex.com",
    "rediffmail.com",
]);

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Email already in use" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Detect organization email
        const emailDomain = email.split("@")[1]?.toLowerCase();
        let organizationId: string | undefined = undefined;

        if (emailDomain && !FREE_EMAIL_PROVIDERS.has(emailDomain)) {
            // Find or create organization by domain
            const org = await db.organization.upsert({
                where: { domain: emailDomain },
                update: {},
                create: {
                    domain: emailDomain,
                    name: emailDomain.split(".")[0].charAt(0).toUpperCase() + emailDomain.split(".")[0].slice(1),
                },
            });
            organizationId = org.id;
        }

        const user = await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "STUDENT",
                ...(organizationId && { organizationId }),
            },
        });

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

