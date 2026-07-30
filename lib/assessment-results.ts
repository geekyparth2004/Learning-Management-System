/**
 * Helpers for reading the per-round results JSON stored on ContestRegistration.results.
 * Shape written by AssessmentPlayer: { rounds: [...], warningCount, autoSubmitted }.
 */

export interface AdaptiveLevel {
    type: string;
    highestLevel: number;
}

/** Peak difficulty a student reached in each adaptive round. Returns [] for malformed/absent results. */
export function parseAdaptiveLevels(results: string | null | undefined): AdaptiveLevel[] {
    if (!results) return [];
    try {
        const parsed = JSON.parse(results);
        if (!Array.isArray(parsed?.rounds)) return [];
        return parsed.rounds
            .filter((r: any) => r.adaptive && typeof r.highestLevel === "number")
            .map((r: any) => ({ type: r.type, highestLevel: r.highestLevel }));
    } catch {
        return [];
    }
}
