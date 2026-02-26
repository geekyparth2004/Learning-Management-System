"use client";

import { useEffect, useState } from "react";
import BadgeCelebration from "./BadgeCelebration";
import { BadgeType } from "@/lib/badges";

/**
 * Component that checks for pending badges on login/page load.
 * Shows celebration animation if new badges are earned.
 */
export default function BadgeCheckOnLogin() {
    const [celebrateBadge, setCelebrateBadge] = useState<BadgeType | null>(null);
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        // Only check once per session
        const sessionKey = 'badge_check_done';
        // if (sessionStorage.getItem(sessionKey)) {
        //     return;
        // }

        async function checkBadges() {
            try {
                const res = await fetch("/api/user/badges/check", { method: "POST" });
                if (res.ok) {
                    const data = await res.json();
                    if (data.celebrateBadge) {
                        setCelebrateBadge(data.celebrateBadge);
                    }
                }
            } catch (error) {
                console.error("Error checking badges:", error);
            } finally {
                sessionStorage.setItem(sessionKey, 'true');
                setHasChecked(true);
            }
        }

        checkBadges();
    }, []);

    if (!celebrateBadge) {
        return null;
    }

    return (
        <BadgeCelebration
            badgeType={celebrateBadge}
            onComplete={() => setCelebrateBadge(null)}
        />
    );
}
