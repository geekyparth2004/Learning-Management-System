
import React from "react";
import { Briefcase, MapPin, Building2, ExternalLink, Tag } from "lucide-react";

interface JobProps {
    job: {
        id: string;
        title: string;
        company: string;
        location: string;
        salary?: string | null;
        type?: string;
        description?: string | null;
        link: string;
        platform: string;
        postedAt: string | Date;
    }
}

const typeColors: Record<string, string> = {
    FULL_TIME: "bg-emerald-900/40 text-emerald-400",
    INTERNSHIP: "bg-blue-900/40 text-blue-400",
    CONTRACT: "bg-orange-900/40 text-orange-400",
    PART_TIME: "bg-purple-900/40 text-purple-400",
};

const typeLabels: Record<string, string> = {
    FULL_TIME: "Full Time",
    INTERNSHIP: "Internship",
    CONTRACT: "Contract",
    PART_TIME: "Part Time",
};

export default function JobCard({ job }: JobProps) {
    return (
        <div className="group flex flex-col gap-3 rounded-xl border border-gray-800 bg-[#1a1a1a] p-4 transition-all hover:border-blue-500/50 hover:bg-[#222]">
            <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-gray-200 group-hover:text-blue-400 truncate" title={job.title}>
                        {job.title}
                    </h4>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                        <Building2 size={12} />
                        <span>{job.company}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                    {job.type && (
                        <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider ${typeColors[job.type] || 'bg-gray-800 text-gray-400'}`}>
                            {typeLabels[job.type] || job.type}
                        </span>
                    )}
                    <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider ${job.platform === 'LinkedIn' ? 'bg-blue-900/40 text-blue-400' :
                        job.platform === 'Naukri' ? 'bg-yellow-900/30 text-yellow-500' :
                            'bg-gray-800 text-gray-400'
                        }`}>
                        {job.platform}
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                    <MapPin size={12} /> {job.location}
                </span>
                {job.salary && (
                    <span className="flex items-center gap-1 text-green-400">
                        ₹ {job.salary}
                    </span>
                )}
            </div>

            {job.description && (
                <p className="text-xs text-gray-500 line-clamp-2">{job.description}</p>
            )}

            <a
                href={job.link}
                target="_blank"
                rel="noreferrer"
                className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600/10 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-600 hover:text-white"
            >
                Apply Now <ExternalLink size={14} />
            </a>
        </div>
    );
}
