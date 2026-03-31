from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional, Tuple

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas


@dataclass(frozen=True)
class Style:
    font: str
    font_bold: str
    size: int
    size_small: int
    size_h1: int
    size_h2: int
    leading: int
    leading_small: int


STYLE = Style(
    font="Helvetica",
    font_bold="Helvetica-Bold",
    size=9,
    size_small=8,
    size_h1=16,
    size_h2=11,
    leading=11,
    leading_small=10,
)


def wrap_lines(text: str, font_name: str, font_size: int, max_width: float) -> List[str]:
    words = text.split()
    if not words:
        return [""]

    lines: List[str] = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        if pdfmetrics.stringWidth(candidate, font_name, font_size) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def draw_heading(
    c: canvas.Canvas,
    x: float,
    y: float,
    text: str,
    *,
    font_name: str,
    font_size: int,
) -> float:
    c.setFont(font_name, font_size)
    c.drawString(x, y, text)
    return y - (font_size + 6)


def draw_paragraph(
    c: canvas.Canvas,
    x: float,
    y: float,
    text: str,
    *,
    font_name: str,
    font_size: int,
    max_width: float,
    leading: int,
) -> float:
    c.setFont(font_name, font_size)
    for line in wrap_lines(text, font_name, font_size, max_width):
        c.drawString(x, y, line)
        y -= leading
    return y


def draw_bullets(
    c: canvas.Canvas,
    x: float,
    y: float,
    bullets: Iterable[str],
    *,
    max_width: float,
    font_name: str,
    font_size: int,
    leading: int,
    bullet_indent: float = 10,
    bullet_glyph: str = "-",
) -> float:
    c.setFont(font_name, font_size)
    for b in bullets:
        lines = wrap_lines(b, font_name, font_size, max_width - bullet_indent)
        c.drawString(x, y, bullet_glyph)
        c.drawString(x + bullet_indent, y, lines[0])
        y -= leading
        for cont in lines[1:]:
            c.drawString(x + bullet_indent, y, cont)
            y -= leading
    return y


def generate_pdf(output_path: Path) -> None:
    page_w, page_h = A4
    margin = 0.55 * inch
    gutter = 0.25 * inch
    col_w = (page_w - 2 * margin - gutter) / 2

    # Column anchors
    left_x = margin
    right_x = margin + col_w + gutter
    top_y = page_h - margin

    c = canvas.Canvas(str(output_path), pagesize=A4)

    # Title
    y = top_y
    c.setTitle("Learning Platform - One Page Summary")
    c.setFont(STYLE.font_bold, STYLE.size_h1)
    c.drawString(left_x, y, "Learning Platform (Learning Management System)")
    c.setFont(STYLE.font, STYLE.size_small)
    c.drawRightString(page_w - margin, y, "Repo-based one-page summary")
    y -= 22

    # ----- LEFT COLUMN -----
    ly = y
    ly = draw_heading(c, left_x, ly, "What it is", font_name=STYLE.font_bold, font_size=STYLE.size_h2)
    ly = draw_paragraph(
        c,
        left_x,
        ly,
        "A Next.js-based learning platform that combines structured courses with hands-on coding practice, assignments, and competitive events.",
        font_name=STYLE.font,
        font_size=STYLE.size,
        max_width=col_w,
        leading=STYLE.leading,
    )
    ly -= 6

    ly = draw_heading(c, left_x, ly, "Who it's for", font_name=STYLE.font_bold, font_size=STYLE.size_h2)
    ly = draw_paragraph(
        c,
        left_x,
        ly,
        "Primary persona: a student practicing DSA, completing course modules/assignments, tracking progress, and joining contests/hackathons.",
        font_name=STYLE.font,
        font_size=STYLE.size,
        max_width=col_w,
        leading=STYLE.leading,
    )
    ly -= 6

    ly = draw_heading(c, left_x, ly, "What it does (key features)", font_name=STYLE.font_bold, font_size=STYLE.size_h2)
    ly = draw_bullets(
        c,
        left_x,
        ly,
        [
            "Dashboard: progress widgets, streak, and quick links.",
            "Courses player: modules/items with locking; item types include VIDEO, ASSIGNMENT, TEST, AI_INTERVIEW, WEB_DEV, DOCUMENT, LEETCODE.",
            "Practice Arena: DSA problems with editor + terminal + tests (incl. hidden) + timed hints + optional AI help.",
            "Assignments workspace: problem + editor/terminal + hints + AI help (focus mode).",
            "Contests/Hackathons: live/upcoming/past; internal player or external link-out.",
            "Support + career: Ask a Doubt (teacher replies), jobs, and placement tools for organization users.",
        ],
        max_width=col_w,
        font_name=STYLE.font,
        font_size=STYLE.size,
        leading=STYLE.leading_small,
    )

    # ----- RIGHT COLUMN -----
    ry = y
    ry = draw_heading(c, right_x, ry, "How it works (repo evidence)", font_name=STYLE.font_bold, font_size=STYLE.size_h2)
    ry = draw_bullets(
        c,
        right_x,
        ry,
        [
            "UI: Next.js App Router pages under app/ (e.g., /practice, /courses, /contest, /placement).",
            "Server: route handlers under app/api/* for app actions (courses/modules/items, submissions, uploads, payments, etc.).",
            "Auth: NextAuth (GitHub OAuth + email/password credentials) with Prisma adapter (auth.ts).",
            "Data: Prisma schema targets PostgreSQL via DATABASE_URL (prisma/schema.prisma).",
            "Caching: Upstash Redis helper with TTL presets; disabled when credentials missing (lib/redis.ts).",
            "Storage: S3-compatible uploads via presigned URLs (Cloudflare R2 or AWS/Backblaze endpoint) (app/api/upload/presigned-url/route.ts).",
            "AI: OpenAI chat for coding help (app/api/ask-ai/route.ts) and Whisper transcription (app/api/transcribe/route.ts).",
            "Payments: Razorpay endpoints exist for orders/verification and feature checkouts (app/api/razorpay/*, app/api/resume/*, app/api/mentorship/*).",
        ],
        max_width=col_w,
        font_name=STYLE.font,
        font_size=STYLE.size,
        leading=STYLE.leading_small,
    )
    ry -= 6

    ry = draw_heading(c, right_x, ry, "How to run (minimal)", font_name=STYLE.font_bold, font_size=STYLE.size_h2)
    ry = draw_bullets(
        c,
        right_x,
        ry,
        [
            "Install deps: npm install",
            "Configure env: set at least DATABASE_URL and AUTH_SECRET (names found in env files); others vary by enabled features.",
            "Prepare DB: Not found in repo (exact migration command). Evidence: prisma/schema.prisma + migrations folder.",
            "Start dev server: npm run dev (Next.js default).",
            "Open: http://localhost:3000",
        ],
        max_width=col_w,
        font_name=STYLE.font,
        font_size=STYLE.size,
        leading=STYLE.leading_small,
    )

    # Footer
    c.setFont(STYLE.font, 8)
    c.drawString(
        margin,
        margin - 10,
        "Notes: This page is generated from visible repo files. Missing/undocumented setup is marked as 'Not found in repo.'",
    )

    c.showPage()
    c.save()


def main() -> None:
    output = Path("output/pdf/learning-platform-one-page-summary.pdf")
    output.parent.mkdir(parents=True, exist_ok=True)
    generate_pdf(output)
    print(str(output.resolve()))


if __name__ == "__main__":
    main()
