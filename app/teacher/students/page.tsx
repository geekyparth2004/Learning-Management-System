import StudentsTable from "@/components/teacher/StudentsTable";

export default function TeacherStudentsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Student Directory</h1>
                <p className="text-gray-400 mt-2 text-sm">Search and view every signed-in student’s name and email.</p>
            </div>
            <StudentsTable />
        </div>
    );
}

