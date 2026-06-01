import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "COORDINATOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const coordinator = await db.user.findUnique({
            where: { id: session.user.id },
            select: { organizationId: true },
        });

        if (!coordinator?.organizationId) {
            return NextResponse.json({ error: "No organization" }, { status: 403 });
        }

        const { id: studentId } = await params;

        // Fetch the student with all related data
        const student = await db.user.findUnique({
            where: { id: studentId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
                role: true,
                organizationId: true,
                leetcodeUsername: true,
                codeforcesUsername: true,
                gfgUsername: true,
                codolioUsername: true,
                externalRatings: true,
                codolioBaseline: true,
                currentStreak: true,
                walletBalance: true,
                lastActivityDate: true,
                createdAt: true,
                placementProfile: true,
                placementApplications: {
                    include: {
                        drive: {
                            select: {
                                id: true,
                                company: true,
                                role: true,
                                status: true,
                                driveDate: true,
                                type: true,
                            },
                        },
                    },
                    orderBy: { appliedAt: "desc" },
                },
                enrollments: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                                modules: {
                                    select: {
                                        id: true,
                                        items: { select: { id: true } },
                                    },
                                },
                            },
                        },
                    },
                },
                contestRegistrations: {
                    include: {
                        contest: {
                            select: {
                                id: true,
                                title: true,
                                category: true,
                                startTime: true,
                                endTime: true,
                            },
                        },
                    },
                    orderBy: { joinedAt: "desc" },
                },
            },
        });

        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        // Verify student belongs to same organization
        if (student.organizationId !== coordinator.organizationId) {
            return NextResponse.json({ error: "Student not in your organization" }, { status: 403 });
        }

        // --- Learning Hours ---
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);

        const completedItems = await db.moduleItemProgress.findMany({
            where: { userId: studentId, isCompleted: true },
            include: {
                moduleItem: {
                    select: { duration: true, type: true, assignmentId: true },
                },
            },
        });

        let totalLearningSeconds = 0;
        let todayLearningSeconds = 0;

        for (const progress of completedItems) {
            const itemDuration = progress.moduleItem.duration || progress.duration || 0;
            totalLearningSeconds += itemDuration;

            // Check if completed today
            if (progress.completedAt) {
                const completedDate = new Date(progress.completedAt);
                if (completedDate >= todayStart && completedDate <= todayEnd) {
                    todayLearningSeconds += itemDuration;
                }
            }
        }

        const totalLearningHours = Math.round((totalLearningSeconds / 3600) * 10) / 10;
        const todayLearningHours = Math.round((todayLearningSeconds / 3600) * 10) / 10;

        // --- Problems Solved ---
        const solvedCount = await db.submission.groupBy({
            by: ["problemId"],
            where: { userId: studentId, status: "PASSED" },
        });
        const problemsSolved = solvedCount.length;

        // External problems (differential tracking)
        let externalProblems = 0;
        if (student.externalRatings && student.codolioBaseline !== null) {
            const stats = student.externalRatings as Record<string, unknown>;
            const currentTotal = (stats.totalQuestions as number) || 0;
            const baseline = student.codolioBaseline || 0;
            externalProblems = Math.max(0, currentTotal - baseline);
        }

        // --- Contests & Hackathons ---
        const contests = student.contestRegistrations.filter(
            (r) => r.contest.category === "CONTEST"
        );
        const hackathons = student.contestRegistrations.filter(
            (r) => r.contest.category === "HACKATHON"
        );

        // --- Course Enrollments with completion % ---
        const courseEnrollments = await Promise.all(
            student.enrollments.map(async (enrollment) => {
                const totalItems = enrollment.course.modules.reduce(
                    (sum, mod) => sum + mod.items.length,
                    0
                );
                const completedItemCount = totalItems > 0
                    ? await db.moduleItemProgress.count({
                          where: {
                              userId: studentId,
                              isCompleted: true,
                              moduleItem: {
                                  module: { courseId: enrollment.course.id },
                              },
                          },
                      })
                    : 0;
                const completionPercentage = totalItems > 0
                    ? Math.round((completedItemCount / totalItems) * 100)
                    : 0;
                return {
                    courseId: enrollment.course.id,
                    courseTitle: enrollment.course.title,
                    status: enrollment.status,
                    enrolledAt: enrollment.enrolledAt,
                    totalItems,
                    completedItems: completedItemCount,
                    completionPercentage,
                };
            })
        );

        // --- Placement Applications Summary ---
        const placementApplications = student.placementApplications.map((app) => ({
            id: app.id,
            company: app.drive.company,
            role: app.drive.role,
            driveStatus: app.drive.status,
            driveDate: app.drive.driveDate,
            driveType: app.drive.type,
            applicationStatus: app.status,
            stage: app.stage,
            stageNumber: app.stageNumber,
            totalStages: app.totalStages,
            appliedAt: app.appliedAt,
        }));

        // Unique companies applied
        const companiesApplied = [
            ...new Set(student.placementApplications.map((app) => app.drive.company)),
        ];

        // --- Today's Activity ---
        const todaySubmissions = await db.submission.count({
            where: {
                userId: studentId,
                createdAt: { gte: todayStart, lte: todayEnd },
            },
        });

        const todayCompletedItems = completedItems.filter((item) => {
            if (!item.completedAt) return false;
            const d = new Date(item.completedAt);
            return d >= todayStart && d <= todayEnd;
        }).length;

        return NextResponse.json({
            student: {
                id: student.id,
                name: student.name,
                email: student.email,
                phone: student.phone,
                image: student.image,
                createdAt: student.createdAt,
                profile: student.placementProfile
                    ? {
                          cgpa: student.placementProfile.cgpa,
                          batch: student.placementProfile.batch,
                          department: student.placementProfile.department,
                          degree: student.placementProfile.degree,
                          fatherName: student.placementProfile.fatherName,
                          ugPercentage: student.placementProfile.ugPercentage,
                          pgPercentage: student.placementProfile.pgPercentage,
                          skills: student.placementProfile.skills,
                          resumeUrl: student.placementProfile.resumeUrl,
                          resumeName: student.placementProfile.resumeName,
                      }
                    : null,
                stats: {
                    totalLearningHours,
                    todayLearningHours,
                    problemsSolved: problemsSolved + externalProblems,
                    internalProblemsSolved: problemsSolved,
                    externalProblemsSolved: externalProblems,
                    contestsParticipated: contests.length,
                    hackathonsParticipated: hackathons.length,
                    currentStreak: student.currentStreak,
                    walletBalance: student.walletBalance,
                    todaySubmissions,
                    todayCompletedItems,
                    coursesEnrolled: courseEnrollments.length,
                    companiesApplied: companiesApplied.length,
                },
                externalPlatforms: {
                    leetcode: student.leetcodeUsername,
                    codeforces: student.codeforcesUsername,
                    gfg: student.gfgUsername,
                    codolio: student.codolioUsername,
                    externalRatings: student.externalRatings,
                },
                placementApplications,
                companiesApplied,
                courseEnrollments,
                contests: contests.map((r) => ({
                    title: r.contest.title,
                    startTime: r.contest.startTime,
                    endTime: r.contest.endTime,
                    score: r.score,
                    joinedAt: r.joinedAt,
                })),
                hackathons: hackathons.map((r) => ({
                    title: r.contest.title,
                    startTime: r.contest.startTime,
                    endTime: r.contest.endTime,
                    score: r.score,
                    joinedAt: r.joinedAt,
                })),
            },
        });
    } catch (error) {
        console.error("Student detail API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
