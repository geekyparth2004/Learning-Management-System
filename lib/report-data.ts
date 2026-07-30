import { db } from "@/lib/db";

/**
 * Aggregates the complete data set behind a student's downloadable report.
 *
 * Enforces the same org boundary as the coordinator student API: returns null when the
 * student does not exist or belongs to a different organization than the coordinator.
 */

export interface SolvedProblem {
    problemId: string;
    title: string;
    difficulty: string | null;
    type: string | null;
    language: string;
    solvedAt: string;   // first PASSED submission time
    code: string;       // the passing solution
}

export interface RecentCode {
    problemTitle: string;
    language: string;
    status: string;     // "PASSED" | "FAILED"
    submittedAt: string;
    code: string;       // the exact code the student wrote
}

export interface AttendedEvent {
    title: string;
    category: string;
    startTime: string;
    joinedAt: string;
    startedAt: string | null;
    completedAt: string | null;
    score: number;
}

export interface AssessmentRecord {
    title: string;
    startTime: string;
    endTime: string;
    joinedAt: string;
    completedAt: string | null;
    score: number;
    /** Fully-parsed rounds array from ContestRegistration.results, or [] if absent/invalid. */
    rounds: any[];
    warningCount: number | null;
    autoSubmitted: boolean;
}

export interface CourseRecord {
    title: string;
    status: string;
    totalItems: number;
    completedItems: number;
    completionPercentage: number;
}

export interface StudentReportData {
    generatedAt: string;
    organizationName: string;
    student: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        joinedAt: string;
    };
    profile: {
        cgpa: number | null;
        batch: string | null;
        department: string | null;
        degree: string | null;
        fatherName: string | null;
        ugPercentage: number | null;
        pgPercentage: number | null;
        skills: string | null;
        resumeUrl: string | null;
    } | null;
    stats: {
        totalLearningHours: number;
        internalProblemsSolved: number;
        externalProblemsSolved: number;
        totalProblemsSolved: number;
        currentStreak: number;
        walletBalance: number;
        contestsParticipated: number;
        hackathonsParticipated: number;
        assessmentsTaken: number;
        coursesEnrolled: number;
    };
    externalPlatforms: {
        leetcode: string | null;
        codolio: string | null;
        externalRatings: Record<string, unknown> | null;
    };
    solvedProblems: SolvedProblem[];
    solvedProblemsTruncated: boolean;
    recentCodes: RecentCode[];
    contests: AttendedEvent[];
    hackathons: AttendedEvent[];
    assessments: AssessmentRecord[];
    courses: CourseRecord[];
}

const MAX_SOLVED_PROBLEMS = 150;

export async function gatherStudentReportData(
    studentId: string,
    coordinatorOrgId: string
): Promise<StudentReportData | null> {
    const student = await db.user.findUnique({
        where: { id: studentId },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            organizationId: true,
            leetcodeUsername: true,
            codolioUsername: true,
            externalRatings: true,
            codolioBaseline: true,
            currentStreak: true,
            walletBalance: true,
            createdAt: true,
            organization: { select: { name: true } },
            placementProfile: true,
            enrollments: {
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                            modules: { select: { id: true, items: { select: { id: true } } } },
                        },
                    },
                },
            },
            contestRegistrations: {
                include: {
                    contest: {
                        select: { id: true, title: true, category: true, startTime: true, endTime: true },
                    },
                },
                orderBy: { joinedAt: "desc" },
            },
        },
    });

    if (!student) return null;
    // Same-organization guard.
    if (student.organizationId !== coordinatorOrgId) return null;

    // ── Learning hours (mirrors the coordinator student API) ──
    const completedItems = await db.moduleItemProgress.findMany({
        where: { userId: studentId, isCompleted: true },
        include: { moduleItem: { select: { duration: true } } },
    });
    let totalLearningSeconds = 0;
    for (const p of completedItems) {
        totalLearningSeconds += p.moduleItem.duration || p.duration || 0;
    }
    const totalLearningHours = Math.round((totalLearningSeconds / 3600) * 10) / 10;

    // ── Problems solved: distinct problems, first-solve time + passing code ──
    const passed = await db.submission.findMany({
        where: { userId: studentId, status: "PASSED" },
        select: {
            code: true,
            language: true,
            createdAt: true,
            problem: { select: { id: true, title: true, difficulty: true, type: true } },
        },
        orderBy: { createdAt: "asc" },
    });

    const firstSolveByProblem = new Map<string, SolvedProblem>();
    for (const s of passed) {
        if (!s.problem) continue;
        // Earliest PASSED wins (list is ascending), so only set once per problem.
        if (!firstSolveByProblem.has(s.problem.id)) {
            firstSolveByProblem.set(s.problem.id, {
                problemId: s.problem.id,
                title: s.problem.title,
                difficulty: s.problem.difficulty,
                type: s.problem.type,
                language: s.language,
                solvedAt: s.createdAt.toISOString(),
                code: s.code,
            });
        }
    }
    const allSolved = Array.from(firstSolveByProblem.values()).sort(
        (a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime()
    );
    const internalProblemsSolved = allSolved.length;
    const solvedProblems = allSolved.slice(0, MAX_SOLVED_PROBLEMS);

    // ── Last 10 codes the student actually wrote, newest first ──
    // Exclude empty/manual completions (some submissions are logged with no source code).
    const recentSubmissions = await db.submission.findMany({
        where: { userId: studentId, code: { not: "" } },
        select: {
            code: true,
            language: true,
            status: true,
            createdAt: true,
            problem: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 25,
    });
    const recentCodes: RecentCode[] = recentSubmissions
        .filter((s) => s.code.trim().length > 0)
        .slice(0, 10)
        .map((s) => ({
            problemTitle: s.problem?.title || "Untitled problem",
            language: s.language,
            status: s.status,
            submittedAt: s.createdAt.toISOString(),
            code: s.code,
        }));

    // External problems (differential vs codolio baseline)
    let externalProblemsSolved = 0;
    if (student.externalRatings && student.codolioBaseline !== null) {
        const stats = student.externalRatings as Record<string, unknown>;
        const currentTotal = (stats.totalQuestions as number) || 0;
        externalProblemsSolved = Math.max(0, currentTotal - (student.codolioBaseline || 0));
    }

    // ── Contests / hackathons / assessments ──
    const toEvent = (r: (typeof student.contestRegistrations)[number]): AttendedEvent => ({
        title: r.contest.title,
        category: r.contest.category,
        startTime: r.contest.startTime.toISOString(),
        joinedAt: r.joinedAt.toISOString(),
        startedAt: r.startedAt?.toISOString() ?? null,
        completedAt: r.completedAt?.toISOString() ?? null,
        score: r.score,
    });

    const contests = student.contestRegistrations.filter((r) => r.contest.category === "CONTEST").map(toEvent);
    const hackathons = student.contestRegistrations.filter((r) => r.contest.category === "HACKATHON").map(toEvent);

    const assessments: AssessmentRecord[] = student.contestRegistrations
        .filter((r) => r.contest.category === "ASSESSMENT")
        .map((r) => {
            let rounds: any[] = [];
            let warningCount: number | null = null;
            let autoSubmitted = false;
            try {
                const parsed = r.results ? JSON.parse(r.results) : null;
                if (Array.isArray(parsed?.rounds)) rounds = parsed.rounds;
                if (typeof parsed?.warningCount === "number") warningCount = parsed.warningCount;
                autoSubmitted = !!parsed?.autoSubmitted;
            } catch {
                // malformed results -> empty rounds
            }
            return {
                title: r.contest.title,
                startTime: r.contest.startTime.toISOString(),
                endTime: r.contest.endTime.toISOString(),
                joinedAt: r.joinedAt.toISOString(),
                completedAt: r.completedAt?.toISOString() ?? null,
                score: r.score,
                rounds,
                warningCount,
                autoSubmitted,
            };
        });

    // ── Courses with completion % ──
    const courses: CourseRecord[] = await Promise.all(
        student.enrollments.map(async (enrollment) => {
            const totalItems = enrollment.course.modules.reduce((sum, m) => sum + m.items.length, 0);
            const done =
                totalItems > 0
                    ? await db.moduleItemProgress.count({
                          where: {
                              userId: studentId,
                              isCompleted: true,
                              moduleItem: { module: { courseId: enrollment.course.id } },
                          },
                      })
                    : 0;
            return {
                title: enrollment.course.title,
                status: enrollment.status,
                totalItems,
                completedItems: done,
                completionPercentage: totalItems > 0 ? Math.round((done / totalItems) * 100) : 0,
            };
        })
    );

    return {
        generatedAt: new Date().toISOString(),
        organizationName: student.organization?.name || "Organization",
        student: {
            id: student.id,
            name: student.name || student.email.split("@")[0],
            email: student.email,
            phone: student.phone,
            joinedAt: student.createdAt.toISOString(),
        },
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
              }
            : null,
        stats: {
            totalLearningHours,
            internalProblemsSolved,
            externalProblemsSolved,
            totalProblemsSolved: internalProblemsSolved + externalProblemsSolved,
            currentStreak: student.currentStreak,
            walletBalance: student.walletBalance,
            contestsParticipated: contests.length,
            hackathonsParticipated: hackathons.length,
            assessmentsTaken: assessments.length,
            coursesEnrolled: courses.length,
        },
        externalPlatforms: {
            leetcode: student.leetcodeUsername,
            codolio: student.codolioUsername,
            externalRatings: (student.externalRatings as Record<string, unknown> | null) ?? null,
        },
        solvedProblems,
        solvedProblemsTruncated: internalProblemsSolved > solvedProblems.length,
        recentCodes,
        contests,
        hackathons,
        assessments,
        courses,
    };
}
