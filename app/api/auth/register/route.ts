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
        const { name, email, password, phone: rawPhone } = await req.json();
        const normalizedEmail = String(email ?? "").trim().toLowerCase();

        if (!name || !normalizedEmail || !password || !rawPhone) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const normalizePhone = (input: string) => {
            // Remove common separators/spaces; keep leading + if present
            const trimmed = String(input).trim();
            const cleaned = trimmed.replace(/[ \-\(\)]/g, "");

            if (/^\d{10}$/.test(cleaned)) {
                return `+91${cleaned}`;
            }
            if (/^\+91\d{10}$/.test(cleaned)) {
                return cleaned;
            }
            return null;
        };

        const phone = normalizePhone(rawPhone);
        if (!phone) {
            return NextResponse.json(
                { error: "Invalid phone number. Use 10 digits (XXXXXXXXXX) or +91 followed by 10 digits (+91XXXXXXXXXX)." },
                { status: 400 }
            );
        }

        const existingUser = await db.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Email already in use" },
                { status: 400 }
            );
        }

        const existingPhone = await db.user.findUnique({
            where: { phone },
        });

        if (existingPhone) {
            return NextResponse.json(
                { error: "Phone number already in use" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Detect organization email
        const emailDomain = normalizedEmail.split("@")[1]?.toLowerCase();
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
                email: normalizedEmail,
                phone,
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

