import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import CourseList from "@/components/CourseList";

export default async function TeacherCoursesPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== "TEACHER") {
        redirect("/");
    }

    const courses = await db.course.findMany({
        where: {
            teacherId: session.user.id,
        },
        include: {
            modules: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return <CourseList courses={courses} />;
}
