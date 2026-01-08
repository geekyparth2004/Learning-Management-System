"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock, Timer, Hourglass, X, ExternalLink } from "lucide-react";
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
    description?: string;
    // ...other fields
}

// Helper to format date for Google Calendar (YYYYMMDDTHHmmSSZ)
const formatGoogleDate = (dateString: string) => {
    return new Date(dateString).toISOString().replace(/-|:|\.\d\d\d/g, "");
};

// Helper to calculate duration
const getDuration = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffMs = e.getTime() - s.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} hrs ${minutes} mins`;
};

// Start Countdown Hook
const useCountdown = (targetDate: string) => {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft("Started");
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${days} Days ${hours} Hrs ${minutes} Mins ${seconds} Secs`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    return timeLeft;
};

const EventModal = ({ event, onClose }: { event: Event; onClose: () => void }) => {
    const countdown = useCountdown(event.startTime);
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);

    // Google Calendar Link
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatGoogleDate(event.startTime)}/${formatGoogleDate(event.endTime)}&details=${encodeURIComponent(event.description || "Event on Learning Platform")}&location=${encodeURIComponent(event.contestLink || "Online")}`;

    const isExternal = !!event.contestLink;
    const targetLink = event.contestLink || `/contest/${event.id}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#161616] p-6 shadow-2xl animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="mb-4 flex items-start justify-between">
                    <h2 className="text-xl font-bold leading-tight pr-4">{event.title}</h2>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-800 text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4 text-sm text-gray-300">
                    {/* Date */}
                    <div className="flex items-center gap-3">
                        <CalendarIcon size={18} className="text-gray-500" />
                        <span>{startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-3">
                        <Clock size={18} className="text-gray-500" />
                        <span>
                            {startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </span>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-3">
                        <Timer size={18} className="text-gray-500" />
                        <span>{getDuration(event.startTime, event.endTime)}</span>
                    </div>

                    {/* Countdown */}
                    <div className="flex items-center gap-3 font-medium text-blue-400">
                        <Hourglass size={18} className="text-blue-500" />
                        <span>Starts in {countdown}</span>
                    </div>

                    {/* Link */}
                    <div className="flex items-start gap-3 mt-2">
                        <MapPin size={18} className="text-gray-500 mt-0.5" />
                        <div>
                            <Link href={targetLink} target={isExternal ? "_blank" : "_self"} className="text-blue-500 hover:underline break-all">
                                {targetLink}
                            </Link>
                            <p className="text-gray-500 text-xs mt-1">
                                {isExternal ? "External Platform" : "Internal Event"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                    <a
                        href={googleUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-2"
                    >
                        Add to Calendar
                    </a>
                </div>
            </div>
        </div>
    );
};

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
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

    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
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
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(<div key={`empty-${i}`} className="min-h-[100px] border border-gray-800 bg-[#111111]/50" />);
        }

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
                            <button
                                key={ev.id}
                                onClick={() => setSelectedEvent(ev)}
                                className={cn(
                                    "block w-full text-left truncate rounded px-2 py-1 text-xs transition-opacity hover:opacity-80",
                                    ev.category === "HACKATHON"
                                        ? "bg-purple-900/30 text-purple-300 border border-purple-800"
                                        : "bg-orange-900/30 text-orange-300 border border-orange-800"
                                )}
                                title={ev.title}
                            >
                                {ev.title}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }
        return calendarDays;
    };

    const upcomingEvents = filteredEvents
        .filter(e => new Date(e.startTime) >= new Date())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-[#0e0e0e] p-8 text-white relative">
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
                    <Link href="/" className="rounded-lg bg-[#161616] px-4 py-2 text-sm text-gray-400 hover:bg-[#202020] hover:text-white">
                        Back to Dashboard
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                <div className="space-y-6 lg:col-span-1">
                    <h2 className="text-xl font-bold">Upcoming Contests</h2>
                    <div className="space-y-4">
                        {upcomingEvents.length === 0 ? (
                            <p className="text-gray-500 text-sm">No upcoming events found.</p>
                        ) : (
                            upcomingEvents.map(ev => {
                                const start = new Date(ev.startTime);
                                return (
                                    <div key={ev.id} className="rounded-xl border border-gray-800 bg-[#161616] p-4 transition-all hover:border-gray-700 cursor-pointer" onClick={() => setSelectedEvent(ev)}>
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

                                        <div className="mt-2 text-xs text-blue-400 hover:underline flex items-center gap-1">
                                            {ev.category === "HACKATHON" ? "Details" : "View"}
                                            <ChevronRight size={12} />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

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

                    <div className="grid grid-cols-7 mb-2 text-center text-sm font-medium text-gray-500">
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 bg-gray-900/30">
                        {renderCalendarDays()}
                    </div>
                </div>
            </div>

            {selectedEvent && (
                <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
            )}
        </div>
    );
}
