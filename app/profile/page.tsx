import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserBadges, PROBLEM_BADGE_DEFINITIONS, STREAK_BADGE_DEFINITIONS, COURSE_BADGE_DEFINITIONS, ProblemBadgeType, StreakBadgeType, CourseBadgeType } from "@/lib/badges";
import Link from "next/link";
import { ArrowLeft, Award, Calendar, Mail, Flame, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
            currentStreak: true,
            walletBalance: true
        }
    });

    if (!user) {
        redirect("/login");
    }

    const badges = await getUserBadges(session.user.id);

    // Get problem stats
    const passedProblems = await db.submission.groupBy({
        by: ['problemId'],
        where: {
            userId: session.user.id,
            status: "PASSED"
        }
    });

    const totalSolved = passedProblems.length;

    // All possible badges for display
    const problemBadges: ProblemBadgeType[] = ["PROBLEMS_50", "PROBLEMS_100", "PROBLEMS_150", "PROBLEMS_200", "PROBLEMS_300", "PROBLEMS_500", "PROBLEMS_750", "PROBLEMS_1000", "PROBLEMS_1500", "PROBLEMS_2000"];
    const streakBadges: StreakBadgeType[] = ["STREAK_25", "STREAK_50", "STREAK_100", "STREAK_200", "STREAK_365"];
    const courseBadges: CourseBadgeType[] = ["HTML_COMPLETION"];

    const earnedBadgeTypes = new Set(badges.map((b: { id: string }) => b?.id).filter(Boolean));
    console.log("SERVER LOG:", badges);
    console.log("DB BADGES:", await db.userBadge.findMany({ where: { userId: session.user.id } }));

    return (
        <div className="min-h-screen bg-[#0e0e0e] p-8 text-white">
            <div className="mx-auto max-w-4xl">
                {/* Back Button */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                {/* Profile Header */}
                <div className="bg-gradient-to-r from-[#161616] to-[#1a1a1a] rounded-2xl p-8 mb-8 border border-gray-800">
                    <div className="flex items-center gap-6">
                        <div className="h-24 w-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold">
                            {user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">{user.name || "Student"}</h1>
                            <div className="flex items-center gap-2 text-gray-400 mt-1">
                                <Mail className="h-4 w-4" />
                                <span>{user.email}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-2 text-orange-500">
                                    <span className="text-2xl">🔥</span>
                                    <span className="font-bold">{user.currentStreak} day streak</span>
                                </div>
                                <div className="flex items-center gap-2 text-green-500">
                                    <span className="text-2xl">💰</span>
                                    <span className="font-bold">{user.walletBalance} coins</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#161616] rounded-xl p-6 border border-gray-800 text-center">
                        <div className="text-4xl font-bold text-blue-400">{totalSolved}</div>
                        <div className="text-gray-400 mt-1">Problems Solved</div>
                    </div>
                    <div className="bg-[#161616] rounded-xl p-6 border border-gray-800 text-center">
                        <div className="text-4xl font-bold text-purple-400">{badges.length}</div>
                        <div className="text-gray-400 mt-1">Badges Earned</div>
                    </div>
                    <div className="bg-[#161616] rounded-xl p-6 border border-gray-800 text-center">
                        <div className="text-4xl font-bold text-orange-400">{user.currentStreak}</div>
                        <div className="text-gray-400 mt-1">Day Streak</div>
                    </div>
                </div>

                {/* Course Badges Section */}
                <div className="bg-[#161616] rounded-2xl p-8 border border-gray-800 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <BookOpen className="h-6 w-6 text-blue-500" />
                        <h2 className="text-2xl font-bold">Course Badges</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {courseBadges.map((badgeType) => {
                            const badge = COURSE_BADGE_DEFINITIONS[badgeType];
                            const isEarned = earnedBadgeTypes.has(badgeType);
                            const earnedBadge = badges.find((b: { id: string }) => b.id === badgeType);

                            return (
                                <div
                                    key={badgeType}
                                    className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${isEarned
                                        ? "border-blue-500/50 bg-blue-500/5"
                                        : "border-gray-700 bg-gray-800/30 opacity-50 grayscale"
                                        }`}
                                >
                                    <img
                                        src={badge.image}
                                        alt={badge.title}
                                        className={`w-28 h-28 object-contain ${isEarned ? "drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]" : ""}`}
                                    />
                                    <div className="text-center">
                                        <h3 className="font-bold text-sm">{badge.title}</h3>
                                        <p className="text-xs text-gray-400 mt-1">{badge.description}</p>
                                        {isEarned && earnedBadge?.earnedAt && (
                                            <p className="text-xs text-blue-500 mt-2 flex items-center justify-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(earnedBadge.earnedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    {!isEarned && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                                            <span className="text-gray-400 text-sm">🔒 Locked</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Problem Badges Section */}
                <div className="bg-[#161616] rounded-2xl p-8 border border-gray-800 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Award className="h-6 w-6 text-yellow-500" />
                        <h2 className="text-2xl font-bold">Problem Badges</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {problemBadges.map((badgeType) => {
                            const badge = PROBLEM_BADGE_DEFINITIONS[badgeType];
                            const isEarned = earnedBadgeTypes.has(badgeType);
                            const earnedBadge = badges.find((b: { id: string }) => b.id === badgeType);

                            return (
                                <div
                                    key={badgeType}
                                    className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${isEarned
                                        ? "border-yellow-500/50 bg-yellow-500/5"
                                        : "border-gray-700 bg-gray-800/30 opacity-50 grayscale"
                                        }`}
                                >
                                    <img
                                        src={badge.image}
                                        alt={badge.title}
                                        className={`w-24 h-24 object-contain ${isEarned
                                            ? badgeType === "PROBLEMS_2000"
                                                ? "animate-badge-godlike"
                                                : badgeType === "PROBLEMS_1500"
                                                    ? "animate-badge-legendary"
                                                    : "drop-shadow-[0_0_20px_rgba(255,165,0,0.3)]"
                                            : ""
                                            }`}
                                    />
                                    <div className="text-center">
                                        <h3 className="font-bold text-sm">{badge.title}</h3>
                                        <p className="text-xs text-gray-400 mt-1">{badge.description}</p>
                                        {isEarned && earnedBadge?.earnedAt && (
                                            <p className="text-xs text-yellow-500 mt-2 flex items-center justify-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(earnedBadge.earnedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    {!isEarned && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                                            <span className="text-gray-400 text-sm">🔒 Locked</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Progress to next problem badge */}
                    {totalSolved < 2000 && (
                        <div className="mt-8 p-4 bg-gray-800/30 rounded-xl">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">Progress to next badge</span>
                                <span className="text-white font-bold">
                                    {totalSolved} / {
                                        totalSolved < 50 ? 50 :
                                            totalSolved < 100 ? 100 :
                                                totalSolved < 150 ? 150 :
                                                    totalSolved < 200 ? 200 :
                                                        totalSolved < 300 ? 300 :
                                                            totalSolved < 500 ? 500 :
                                                                totalSolved < 750 ? 750 :
                                                                    totalSolved < 1000 ? 1000 :
                                                                        totalSolved < 1500 ? 1500 : 2000
                                    }
                                </span>
                            </div>
                            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all"
                                    style={{
                                        width: `${(totalSolved / (
                                            totalSolved < 50 ? 50 :
                                                totalSolved < 100 ? 100 :
                                                    totalSolved < 150 ? 150 :
                                                        totalSolved < 200 ? 200 :
                                                            totalSolved < 300 ? 300 :
                                                                totalSolved < 500 ? 500 :
                                                                    totalSolved < 750 ? 750 :
                                                                        totalSolved < 1000 ? 1000 :
                                                                            totalSolved < 1500 ? 1500 : 2000
                                        )) * 100}%`
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Streak Badges Section */}
                <div className="bg-[#161616] rounded-2xl p-8 border border-gray-800">
                    <div className="flex items-center gap-3 mb-6">
                        <Flame className="h-6 w-6 text-orange-500" />
                        <h2 className="text-2xl font-bold">Punctuality Badges</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {streakBadges.map((badgeType) => {
                            const badge = STREAK_BADGE_DEFINITIONS[badgeType];
                            const isEarned = earnedBadgeTypes.has(badgeType);
                            const earnedBadge = badges.find((b: { id: string }) => b.id === badgeType);

                            return (
                                <div
                                    key={badgeType}
                                    className={`relative flex flex-col items-center gap-3 p-3 rounded-xl border transition-all ${isEarned
                                        ? "border-orange-500/50 bg-orange-500/5"
                                        : "border-gray-700 bg-gray-800/30 opacity-50 grayscale"
                                        }`}
                                >
                                    <img
                                        src={badge.image}
                                        alt={badge.title}
                                        className={`w-16 h-16 object-contain ${isEarned ? "drop-shadow-[0_0_20px_rgba(255,100,0,0.4)]" : ""}`}
                                    />
                                    <div className="text-center">
                                        <h3 className="font-bold text-xs">{badge.title}</h3>
                                        <p className="text-[10px] text-gray-400 mt-1">{badge.threshold} days</p>
                                        {isEarned && earnedBadge?.earnedAt && (
                                            <p className="text-[10px] text-orange-500 mt-1">
                                                {new Date(earnedBadge.earnedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    {!isEarned && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                                            <span className="text-gray-400 text-xs">🔒</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Progress to next streak badge */}
                    {user.currentStreak < 365 && (
                        <div className="mt-8 p-4 bg-gray-800/30 rounded-xl">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">Progress to next streak badge</span>
                                <span className="text-white font-bold">
                                    {user.currentStreak} / {
                                        user.currentStreak < 25 ? 25 :
                                            user.currentStreak < 50 ? 50 :
                                                user.currentStreak < 100 ? 100 :
                                                    user.currentStreak < 200 ? 200 : 365
                                    } days
                                </span>
                            </div>
                            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
                                    style={{
                                        width: `${(user.currentStreak / (
                                            user.currentStreak < 25 ? 25 :
                                                user.currentStreak < 50 ? 50 :
                                                    user.currentStreak < 100 ? 100 :
                                                        user.currentStreak < 200 ? 200 : 365
                                        )) * 100}%`
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
