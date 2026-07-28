// Shared level logic for adaptive assessment rounds.
// A round starts at level 1; a correct answer raises the difficulty, a wrong one lowers it.

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10;

export const LEVEL_LABELS: Record<number, string> = {
    1: "Beginner", 2: "Beginner+", 3: "Elementary", 4: "Elementary+", 5: "Intermediate",
    6: "Intermediate+", 7: "Advanced", 8: "Advanced+", 9: "Expert", 10: "Master",
};

export function levelLabel(level: number): string {
    return LEVEL_LABELS[level] || "Intermediate";
}

export function nextLevel(current: number, wasCorrect: boolean): number {
    const target = wasCorrect ? current + 1 : current - 1;
    return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, target));
}
