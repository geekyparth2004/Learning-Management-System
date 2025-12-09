import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    className?: string;
    link?: {
        text: string;
        href: string;
    };
}

export default function StatCard({ title, value, subtitle, className = "", link }: StatCardProps) {
    return (
        <div className={`flex flex-col justify-between rounded-xl border border-gray-800 bg-[#161616] p-6 ${className}`}>
            <div>
                <h3 className="text-sm font-medium text-gray-400">{title}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{value}</span>
                    {subtitle && <span className="text-lg text-gray-500">{subtitle}</span>}
                </div>
            </div>
            {link && (
                <div className="mt-4 flex justify-end">
                    <Link
                        href={link.href}
                        className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300"
                    >
                        {link.text} <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            )}
        </div>
    );
}
