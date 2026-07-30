import React from "react";
import AssessmentBuilderForm from "@/components/assessment/AssessmentBuilderForm";

export default function CreateAssessmentPage() {
    return (
        <AssessmentBuilderForm
            theme="dark"
            endpoint="/api/contest"
            successRedirect="/teacher/assessment"
            backHref="/teacher/assessment"
            extraPayload={{ type: "INTERNAL", category: "ASSESSMENT" }}
        />
    );
}
