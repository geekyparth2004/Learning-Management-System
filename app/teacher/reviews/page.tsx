import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ReviewList from "@/components/ReviewList";

export default async function ReviewsPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== "TEACHER") {
        return redirect("/");
    }

    const teacherId = session.user.id;

    // Fetch pending reviews for courses taught by this teacher
    const pendingReviews = await db.moduleItemProgress.findMany({
        where: {
            reviewStatus: "PENDING",
            moduleItem: {
                module: {
                    course: {
                        teacherId: teacherId
                    }
                }
            }
        },
        include: {
            user: {
                select: { name: true, email: true, image: true }
            },
            moduleItem: {
                select: {
                    title: true,
                    aiInterviewTopic: true,
                    aiDifficulty: true,
                    module: {
                        include: {
                            course: {
                                select: { title: true }
                            }
                        }
                    }
                }
            }
        },
        orderBy: {
            completedAt: 'desc' // Using completedAt as updated time roughly
        }
    });

    // Transform data for client component
    const reviews = pendingReviews.map(review => ({
        id: review.id,
        studentName: review.user.name || "Unknown Student",
        studentEmail: review.user.email,
        courseName: review.moduleItem.module.course.title,
        itemName: review.moduleItem.title,
        topic: review.moduleItem.aiInterviewTopic || "General",
        difficulty: review.moduleItem.aiDifficulty || "Medium",
        submission: review.aiSubmission,
    }));

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Pending Reviews</h1>
            <ReviewList initialReviews={reviews} />
        </div>
    );
}
