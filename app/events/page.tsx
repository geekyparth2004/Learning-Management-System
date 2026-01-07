"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Event {
    id: string;
    title: string;
    type: string; // "INTERNAL" | "EXTERNAL"
    category: "CONTEST" | "HACKATHON"; // "CONTEST" | "HACKATHON"
    startTime: string;
    endTime: string;
    contestLink?: string;
    // ...other fields
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch user-relevant (or all) events
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // Fetch broad range or all. For now fetching all future might be heavy, 
                // but let's assume reasonable count or fetch by month range if needed.
                // Simpler: Fetch all for MVP or a wide window.
                const res = await fetch("/api/events");
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data);
                }
            } catch (e) {
                console.error("Failed to fetch events", e);
            }
        };
        fetchEvents();
    }, []);

    // Filter Logic
    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calendar Helpers
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const renderCalendarDays = () => {
        const calendarDays = [];
        // Empty slots for start of month
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(<div key={`empty-${i}`} className="min-h-[100px] border border-gray-800 bg-[#111111]/50" />);
        }

        // Days
        for (let i = 1; i <= days; i++) {
            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const dayEvents = filteredEvents.filter(e => {
                const eDate = new Date(e.startTime);
                return isSameDay(eDate, dayDate);
            });

            const isToday = isSameDay(new Date(), dayDate);

            calendarDays.push(
                <div key={i} className={cn(
                    "min-h-[100px] border border-gray-800 p-2 transition-colors hover:bg-[#1a1a1a]",
                    isToday ? "bg-blue-900/10 border-blue-500/50" : "bg-[#111111]"
                )}>
                    <div className={cn("mb-2 text-sm font-medium", isToday ? "text-blue-400" : "text-gray-400")}>
                        {i}
                    </div>
                    <div className="space-y-1">
                        {dayEvents.map(ev => (
                            <Link
                                key={ev.id}
                                href={ev.contestLink || `/contest/${ev.id}`} // Internal or External
                                target={ev.contestLink ? "_blank" : "_self"}
                                className={cn(
                                    "block truncate rounded px-2 py-1 text-xs",
                                    ev.category === "HACKATHON"
                                        ? "bg-purple-900/30 text-purple-300 border border-purple-800"
                                        : "bg-orange-900/30 text-orange-300 border border-orange-800"
                                )}
                                title={ev.title}
                            >
                                {ev.title}
                            </Link>
                        ))}
                    </div>
                </div>
            );
        }
        return calendarDays;
    };

    // Sidebar: Upcoming Events (Next 5)
    // Filter events after now, sort by time
    const upcomingEvents = filteredEvents
        .filter(e => new Date(e.startTime) >= new Date())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-[#0e0e0e] p-8 text-white">
            {/* Header */}
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-3xl font-bold">Event Calendar</h1>
                    <p className="text-gray-400">Track upcoming contests and hackathons</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search Events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="rounded-lg border border-gray-800 bg-[#161616] px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <Link href="/dashboard" className="rounded-lg bg-[#161616] px-4 py-2 text-sm text-gray-400 hover:bg-[#202020] hover:text-white">
                        Back to Dashboard
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                {/* Sidebar: Upcoming */}
                <div className="space-y-6 lg:col-span-1">
                    <h2 className="text-xl font-bold">Upcoming Contests</h2>
                    <div className="space-y-4">
                        {upcomingEvents.length === 0 ? (
                            <p className="text-gray-500 text-sm">No upcoming events found.</p>
                        ) : (
                            upcomingEvents.map(ev => {
                                const start = new Date(ev.startTime);
                                const end = new Date(ev.endTime);
                                return (
                                    <div key={ev.id} className="rounded-xl border border-gray-800 bg-[#161616] p-4 transition-all hover:border-gray-700">
                                        <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                                            <span className={cn(
                                                "h-2 w-2 rounded-full",
                                                ev.category === "HACKATHON" ? "bg-purple-500" : "bg-orange-500"
                                            )} />
                                            {start.toLocaleDateString()}
                                            <span className="mx-1">•</span>
                                            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <h3 className="mb-2 font-bold line-clamp-2 md:text-sm">{ev.title}</h3>

                                        <Link
                                            href={ev.contestLink || `/contest/${ev.id}`}
                                            target={ev.contestLink ? "_blank" : "_self"}
                                            className="mt-2 text-xs text-blue-400 hover:underline flex items-center gap-1"
                                        >
                                            {ev.category === "HACKATHON" ? "Register" : "Add or View"}
                                            <ChevronRight size={12} />
                                        </Link>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Main Calendar */}
                <div className="rounded-xl border border-gray-800 bg-[#161616] p-6 lg:col-span-3">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-2xl font-bold">{monthName} {year}</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => changeMonth(-1)}
                                className="rounded p-2 hover:bg-[#252525] text-gray-400 hover:text-white"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={() => changeMonth(1)}
                                className="rounded p-2 hover:bg-[#252525] text-gray-400 hover:text-white"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Days Header */}
                    <div className="grid grid-cols-7 mb-2 text-center text-sm font-medium text-gray-500">
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1 bg-gray-900/30">
                        {renderCalendarDays()}
                    </div>
                </div>
            </div>
        </div>
    );
}
