/**
 * Theme tokens for the shared assessment builder / detail views.
 *
 * Every class is written out as a literal because Tailwind v4 scans source text —
 * an interpolated class like `text-${accent}-400` is never emitted and renders unstyled.
 * Hence the fully-enumerated 2 x 8 accent map rather than string building.
 */

export type BuilderTheme = "dark" | "light";

export type AccentName = "pink" | "blue" | "green" | "orange" | "cyan" | "violet" | "amber" | "teal";

export interface ChromeTokens {
    page: string;
    backLink: string;
    heading: string;
    subheading: string;
    card: string;
    cardTitle: string;
    label: string;
    hint: string;
    input: string;
    /** "[color-scheme:dark]" so native date pickers match a dark surface. */
    dateScheme: string;
    tileInactive: string;
    tileIconInactive: string;
    tileTitle: string;
    tileDesc: string;
    modeInactive: string;
    submit: string;
    /** Emphasised inline value text, e.g. the resolved config values on the detail page. */
    strong: string;
    /** Table chrome for the leaderboard on the detail view. */
    tableWrap: string;
    tableHead: string;
    tableRow: string;
    tableDivide: string;
    mutedCell: string;
    emptyText: string;
}

export const BUILDER_CHROME: Record<BuilderTheme, ChromeTokens> = {
    dark: {
        page: "min-h-screen bg-[#0e0e0e] text-white p-4 md:p-8",
        backLink: "text-gray-400 hover:text-white",
        heading: "text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent",
        subheading: "text-gray-400",
        card: "rounded-xl border border-gray-800 bg-[#161616] p-6",
        cardTitle: "text-lg font-bold text-white",
        label: "text-sm font-medium text-gray-300",
        hint: "text-xs text-gray-500",
        input: "w-full rounded-lg border border-gray-800 bg-[#111111] px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none transition-colors",
        dateScheme: "[color-scheme:dark]",
        tileInactive: "border-gray-800 bg-[#111111] hover:border-gray-600",
        tileIconInactive: "bg-gray-800 text-gray-400",
        tileTitle: "font-bold text-white",
        tileDesc: "text-xs text-gray-400 mt-1",
        modeInactive: "border-gray-800 bg-[#111111] text-gray-400 hover:border-gray-600",
        submit: "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg",
        strong: "text-white font-medium",
        tableWrap: "overflow-x-auto rounded-lg border border-gray-800 bg-[#111111]",
        tableHead: "bg-[#1a1a1a] text-xs uppercase text-gray-400 border-b border-gray-800",
        tableRow: "hover:bg-gray-800/50",
        tableDivide: "divide-y divide-gray-800",
        mutedCell: "text-gray-400",
        emptyText: "text-gray-500 text-sm italic",
    },
    light: {
        // The coordinator layout already supplies bg-gray-50, so no page background here.
        page: "min-h-screen p-4 md:p-8 text-gray-900",
        backLink: "text-gray-500 hover:text-gray-900",
        heading: "text-2xl md:text-3xl font-bold text-gray-900",
        subheading: "text-gray-500",
        card: "rounded-xl border border-gray-200 bg-white p-6 shadow-sm",
        cardTitle: "text-lg font-bold text-gray-900",
        label: "text-sm font-medium text-gray-700",
        hint: "text-xs text-gray-400",
        input: "w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors",
        dateScheme: "",
        tileInactive: "border-gray-200 bg-white hover:border-gray-300",
        tileIconInactive: "bg-gray-100 text-gray-400",
        tileTitle: "font-bold text-gray-900",
        tileDesc: "text-xs text-gray-500 mt-1",
        modeInactive: "border-gray-200 bg-white text-gray-500 hover:border-gray-300",
        submit: "bg-blue-600 hover:bg-blue-700 text-white",
        strong: "text-gray-900 font-semibold",
        tableWrap: "overflow-x-auto rounded-lg border border-gray-200 bg-white",
        tableHead: "bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200",
        tableRow: "hover:bg-gray-50",
        tableDivide: "divide-y divide-gray-100",
        mutedCell: "text-gray-500",
        emptyText: "text-gray-400 text-sm italic",
    },
};

export interface AccentTokens {
    /** Selected round tile: border + tint + glow/ring. */
    tileActive: string;
    tileIconActive: string;
    /** Config panel shell. */
    panel: string;
    panelTitle: string;
    /** Range slider thumb colour (theme-invariant, duplicated for uniformity). */
    range: string;
    /** Inline bold level value. */
    value: string;
    modeActive: string;
    modeIcon: string;
}

export const BUILDER_ACCENTS: Record<BuilderTheme, Record<AccentName, AccentTokens>> = {
    dark: {
        pink: {
            tileActive: "border-pink-500 bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.15)]",
            tileIconActive: "bg-pink-500/20 text-pink-400",
            panel: "border-pink-500/30 bg-pink-500/5",
            panelTitle: "text-pink-400",
            range: "accent-pink-500",
            value: "text-pink-400",
            modeActive: "border-pink-500 bg-pink-500/15 text-pink-300",
            modeIcon: "text-pink-400",
        },
        blue: {
            tileActive: "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]",
            tileIconActive: "bg-blue-500/20 text-blue-400",
            panel: "border-blue-500/30 bg-blue-500/5",
            panelTitle: "text-blue-400",
            range: "accent-blue-500",
            value: "text-blue-400",
            modeActive: "border-blue-500 bg-blue-500/15 text-blue-300",
            modeIcon: "text-blue-400",
        },
        green: {
            tileActive: "border-green-500 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.15)]",
            tileIconActive: "bg-green-500/20 text-green-400",
            panel: "border-green-500/30 bg-green-500/5",
            panelTitle: "text-green-400",
            range: "accent-green-500",
            value: "text-green-400",
            modeActive: "border-green-500 bg-green-500/15 text-green-300",
            modeIcon: "text-green-400",
        },
        orange: {
            tileActive: "border-orange-500 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.15)]",
            tileIconActive: "bg-orange-500/20 text-orange-400",
            panel: "border-orange-500/30 bg-orange-500/5",
            panelTitle: "text-orange-400",
            range: "accent-orange-500",
            value: "text-orange-400",
            modeActive: "border-orange-500 bg-orange-500/15 text-orange-300",
            modeIcon: "text-orange-400",
        },
        cyan: {
            tileActive: "border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]",
            tileIconActive: "bg-cyan-500/20 text-cyan-400",
            panel: "border-cyan-500/30 bg-cyan-500/5",
            panelTitle: "text-cyan-400",
            range: "accent-cyan-500",
            value: "text-cyan-400",
            modeActive: "border-cyan-500 bg-cyan-500/15 text-cyan-300",
            modeIcon: "text-cyan-400",
        },
        violet: {
            tileActive: "border-violet-500 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.15)]",
            tileIconActive: "bg-violet-500/20 text-violet-400",
            panel: "border-violet-500/30 bg-violet-500/5",
            panelTitle: "text-violet-400",
            range: "accent-violet-500",
            value: "text-violet-400",
            modeActive: "border-violet-500 bg-violet-500/15 text-violet-300",
            modeIcon: "text-violet-400",
        },
        amber: {
            tileActive: "border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]",
            tileIconActive: "bg-amber-500/20 text-amber-400",
            panel: "border-amber-500/30 bg-amber-500/5",
            panelTitle: "text-amber-400",
            range: "accent-amber-500",
            value: "text-amber-400",
            modeActive: "border-amber-500 bg-amber-500/15 text-amber-300",
            modeIcon: "text-amber-400",
        },
        teal: {
            tileActive: "border-teal-500 bg-teal-500/10 shadow-[0_0_20px_rgba(20,184,166,0.15)]",
            tileIconActive: "bg-teal-500/20 text-teal-400",
            panel: "border-teal-500/30 bg-teal-500/5",
            panelTitle: "text-teal-400",
            range: "accent-teal-500",
            value: "text-teal-400",
            modeActive: "border-teal-500 bg-teal-500/15 text-teal-300",
            modeIcon: "text-teal-400",
        },
    },
    light: {
        pink: {
            tileActive: "border-pink-500 bg-pink-50 shadow-[0_0_0_3px_rgba(236,72,153,0.10)]",
            tileIconActive: "bg-pink-100 text-pink-600",
            panel: "border-pink-200 bg-pink-50/60",
            panelTitle: "text-pink-600",
            range: "accent-pink-500",
            value: "text-pink-600",
            modeActive: "border-pink-500 bg-pink-50 text-pink-700",
            modeIcon: "text-pink-600",
        },
        blue: {
            tileActive: "border-blue-500 bg-blue-50 shadow-[0_0_0_3px_rgba(59,130,246,0.10)]",
            tileIconActive: "bg-blue-100 text-blue-600",
            panel: "border-blue-200 bg-blue-50/60",
            panelTitle: "text-blue-600",
            range: "accent-blue-500",
            value: "text-blue-600",
            modeActive: "border-blue-500 bg-blue-50 text-blue-700",
            modeIcon: "text-blue-600",
        },
        green: {
            tileActive: "border-green-500 bg-green-50 shadow-[0_0_0_3px_rgba(34,197,94,0.10)]",
            tileIconActive: "bg-green-100 text-green-700",
            panel: "border-green-200 bg-green-50/60",
            panelTitle: "text-green-700",
            range: "accent-green-500",
            value: "text-green-700",
            modeActive: "border-green-500 bg-green-50 text-green-800",
            modeIcon: "text-green-700",
        },
        orange: {
            tileActive: "border-orange-500 bg-orange-50 shadow-[0_0_0_3px_rgba(249,115,22,0.10)]",
            tileIconActive: "bg-orange-100 text-orange-600",
            panel: "border-orange-200 bg-orange-50/60",
            panelTitle: "text-orange-600",
            range: "accent-orange-500",
            value: "text-orange-600",
            modeActive: "border-orange-500 bg-orange-50 text-orange-700",
            modeIcon: "text-orange-600",
        },
        cyan: {
            tileActive: "border-cyan-500 bg-cyan-50 shadow-[0_0_0_3px_rgba(6,182,212,0.10)]",
            tileIconActive: "bg-cyan-100 text-cyan-700",
            panel: "border-cyan-200 bg-cyan-50/60",
            panelTitle: "text-cyan-700",
            range: "accent-cyan-500",
            value: "text-cyan-700",
            modeActive: "border-cyan-500 bg-cyan-50 text-cyan-800",
            modeIcon: "text-cyan-700",
        },
        violet: {
            tileActive: "border-violet-500 bg-violet-50 shadow-[0_0_0_3px_rgba(139,92,246,0.10)]",
            tileIconActive: "bg-violet-100 text-violet-600",
            panel: "border-violet-200 bg-violet-50/60",
            panelTitle: "text-violet-600",
            range: "accent-violet-500",
            value: "text-violet-600",
            modeActive: "border-violet-500 bg-violet-50 text-violet-700",
            modeIcon: "text-violet-600",
        },
        amber: {
            tileActive: "border-amber-500 bg-amber-50 shadow-[0_0_0_3px_rgba(245,158,11,0.10)]",
            tileIconActive: "bg-amber-100 text-amber-700",
            panel: "border-amber-200 bg-amber-50/60",
            panelTitle: "text-amber-700",
            range: "accent-amber-500",
            value: "text-amber-700",
            modeActive: "border-amber-500 bg-amber-50 text-amber-800",
            modeIcon: "text-amber-700",
        },
        teal: {
            tileActive: "border-teal-500 bg-teal-50 shadow-[0_0_0_3px_rgba(20,184,166,0.10)]",
            tileIconActive: "bg-teal-100 text-teal-700",
            panel: "border-teal-200 bg-teal-50/60",
            panelTitle: "text-teal-700",
            range: "accent-teal-500",
            value: "text-teal-700",
            modeActive: "border-teal-500 bg-teal-50 text-teal-800",
            modeIcon: "text-teal-700",
        },
    },
};
