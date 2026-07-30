import { db } from "@/lib/db";

/**
 * The viewer's organization, or null.
 *
 * Re-queried from the DB rather than read off the JWT: session.user.organizationId
 * exists but is not declared in types/next-auth.d.ts (needs @ts-ignore) and goes
 * stale if the user's org changes mid-session. Matches the pattern used by every
 * /api/coordinator route.
 */
export async function viewerOrgId(userId?: string | null): Promise<string | null> {
    if (!userId) return null;
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
    });
    return user?.organizationId ?? null;
}

/**
 * Contest/assessment visibility for a viewer.
 *
 * organizationId null = global (teacher-created, everyone sees it).
 * organizationId set  = only students of that organization.
 *
 * Viewers with no organization (free-email signups) therefore see global rows only.
 * Spread into an existing `where`; callers using this must use findFirst rather than
 * findUnique, since findUnique does not accept OR.
 */
export function visibleContestWhere(orgId: string | null) {
    return orgId
        ? { OR: [{ organizationId: null }, { organizationId: orgId }] }
        : { organizationId: null };
}
