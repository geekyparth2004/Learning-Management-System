/**
 * Removes comments that give away a planted bug from debug-challenge code.
 *
 * The AI is instructed not to write them, but it does anyway (e.g. "// Should be num > 0"),
 * which hands the student the answer. This is the enforcement layer: prompt is the request,
 * this is the guarantee.
 *
 * Only *comments* are inspected — code is never altered, and comments that merely describe
 * what the program does ("# Read input") are kept.
 */

/** Phrases that mean a comment is pointing at the bug or naming the correction. */
const GIVEAWAY = new RegExp(
    [
        "should\\s*(be|been|have|has|not|use|used|return|check|print|start|stop|include|contain)",
        "shouldn'?t",
        "supposed\\s+to",
        "needs?\\s+to\\s+be",
        "ought\\s+to",
        "must\\s+be",
        "\\bbugs?\\b",
        "\\bbuggy\\b",
        "\\bdebug\\b",
        "fix\\s*me",
        "\\bfix(es|ed|ing)?\\b",
        "\\berror\\b",
        "\\bwrong\\b",
        "\\bincorrect(ly)?\\b",
        "\\bmistake\\b",
        "\\btypo\\b",
        "\\btodo\\b",
        "\\bmissing\\b",
        "\\bforgot(ten)?\\b",
        "instead\\s+of",
        "change\\s+(this|that|it|to)",
        "replace\\s+(this|that|it|with)",
        "\\bcorrect(ed|ion|ly)?\\b",
        "\\bhint\\b",
        "off[-\\s]?by[-\\s]?one",
        "problem\\s+(is|here)",
        "issue\\s+(is|here)",
        "here\\s+is\\s+the",
        "\\bnote\\s*:",
        "\\bintentional",
        "\\bdeliberate",
        "\\bfaulty\\b",
        "\\bbroken\\b",
        "\\binvalid\\b",
        "\\bswapped?\\b",
        "\\bmisspell",
        "\\bshould'?ve",
    ].join("|"),
    "i"
);

/** Bare pointer markers a model uses to indicate a line, e.g. "// <---" or "// ^^^". */
const POINTER = /^[\s<>^~*\-=!?.]+$/;

function isGiveaway(commentText: string): boolean {
    const text = commentText.trim();
    if (!text) return false;
    if (POINTER.test(text)) return true;
    return GIVEAWAY.test(text);
}

type CommentSyntax = { line: string[]; block: [string, string] | null };

function syntaxFor(language: string): CommentSyntax {
    if (language === "python") return { line: ["#"], block: null };
    // Java / C++ share C-style comments. Keep "#" out so preprocessor lines survive.
    return { line: ["//"], block: ["/*", "*/"] };
}

/**
 * Scans a line outside of string literals and returns the index at which a line comment
 * starts, or -1. Quote and escape aware so `print("# not a comment")` is left alone.
 */
function findLineCommentStart(line: string, markers: string[]): number {
    let quote: string | null = null;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];

        if (quote) {
            if (ch === "\\") { i++; continue; }
            if (ch === quote) quote = null;
            continue;
        }

        if (ch === '"' || ch === "'" || ch === "`") {
            quote = ch;
            continue;
        }

        for (const m of markers) {
            if (line.startsWith(m, i)) return i;
        }
    }
    return -1;
}

export function stripRevealingComments(code: string, language = "python"): string {
    if (!code) return code;

    const { line: lineMarkers, block } = syntaxFor(language);
    const lines = code.split("\n");
    const out: string[] = [];
    let inBlock = false;
    let blockBuf: string[] = [];
    let blockIndent = "";

    for (const raw of lines) {
        // ── inside a /* ... */ block ──
        if (inBlock && block) {
            const endIdx = raw.indexOf(block[1]);
            if (endIdx === -1) {
                blockBuf.push(raw);
                continue;
            }
            blockBuf.push(raw.slice(0, endIdx));
            const after = raw.slice(endIdx + block[1].length);
            const body = blockBuf.join("\n");
            inBlock = false;
            blockBuf = [];
            if (!isGiveaway(body)) {
                out.push(`${blockIndent}${block[0]}${body}${block[1]}${after}`);
            } else if (after.trim()) {
                out.push(`${blockIndent}${after.trimStart()}`);
            }
            continue;
        }

        // ── a /* ... */ block opening on this line ──
        if (block) {
            const openIdx = raw.indexOf(block[0]);
            if (openIdx !== -1 && findLineCommentStart(raw, lineMarkers) === -1) {
                const before = raw.slice(0, openIdx);
                const rest = raw.slice(openIdx + block[0].length);
                const closeIdx = rest.indexOf(block[1]);
                if (closeIdx === -1) {
                    inBlock = true;
                    blockIndent = before;
                    blockBuf = [rest];
                    continue;
                }
                const body = rest.slice(0, closeIdx);
                const after = rest.slice(closeIdx + block[1].length);
                if (isGiveaway(body)) {
                    const kept = `${before}${after}`;
                    if (kept.trim()) out.push(kept.replace(/\s+$/, ""));
                } else {
                    out.push(raw);
                }
                continue;
            }
        }

        // ── line comment ──
        const idx = findLineCommentStart(raw, lineMarkers);
        if (idx === -1) {
            out.push(raw);
            continue;
        }

        const codePart = raw.slice(0, idx);
        const marker = lineMarkers.find((m) => raw.startsWith(m, idx))!;
        const commentText = raw.slice(idx + marker.length);

        if (!isGiveaway(commentText)) {
            out.push(raw);
            continue;
        }

        // Drop the comment. If it was the whole line, drop the line too.
        if (codePart.trim() === "") continue;
        out.push(codePart.replace(/\s+$/, ""));
    }

    // An unterminated block comment: keep the original rather than truncate the program.
    if (inBlock) return code;

    return out.join("\n");
}
