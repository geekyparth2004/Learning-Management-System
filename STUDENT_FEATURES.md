# Student Features (Student-Only)

## Quick Route Map (What to click)

After you sign in, your dashboard shows your daily progress and quick links. From there, you can jump to each student feature area below:

### Home / Dashboard
- `GET /` (`app/page.tsx`)
  - Student view shows: your progress widgets (hours, activity, practice/contests/hackathons stats), streak indicator, and links to learning + competitions + profile.
  - Navigation links include:
    - `Practice Arena` → `/practice`
    - `Explore Courses` → `/courses`
    - `Contests` → `/contest`
    - `Hackathons` → `/hackathon`
    - `Placement` vs `Jobs`
      - If your account belongs to an organization → `/placement`
      - Otherwise → `/jobs`
    - `Profile` → `/profile`

### Premium Access (if you are locked)
- `/locked` (`app/locked/page.tsx`)
  - Shown when your subscription is `FREE` or your `TRIAL` is missing/expired.
  - Offers:
    - Apply a teacher referral code to start a short trial
    - Buy lifetime subscription

### Learning: Practice Arena
- `GET /practice` (`app/practice/page.tsx`)
  - List of practice problems (DSA) with difficulty and “Solved” status.
- `GET /practice/[id]` (`app/practice/[id]/page.tsx`)
  - Full practice player (editor + terminal + tests + hints + AI help).

### Learning: Courses (modules & items)
- `GET /courses` (`app/courses/page.tsx`)
  - List of available courses.
- `GET /courses/[id]` (`app/courses/[id]/page.tsx`)
  - Course player for enrolled students:
    - Modules and items (video, assignments, tests, AI interviews, documents, web-dev, etc.)
    - Lock/unlock based on progress
    - “Ask a Doubt” button for course items

### Learning: Assignments (student workspace)
- `GET /assignment/[id]` (`app/assignment/[id]/page.tsx`)
  - The assignment workspace opened from course modules/items that contain assignments.
  - Includes editor + terminal/results + hints + AI help (and focus mode).

### Competitions: Contests (and contest leaderboards)
- `GET /contest` (`app/contest/page.tsx`)
  - Lists contests in 3 sections:
    - Live / Active
    - Upcoming
    - Past
- `GET /contest/[id]` (`app/contest/[id]/page.tsx`)
  - Contest lobby and contest player for internal contests.
  - For external contests, it shows a “Go to Contest” link.

### Competitions: Hackathons & Events
- `GET /hackathon` (`app/hackathon/page.tsx`)
  - Lists hackathons/events from the same contest system (category = `HACKATHON`).
  - Join / start / mark completed is handled via the same contest action buttons used for contests.

### Support + Guidance
- “Ask a Doubt” (inside course player)
  - UI component: `components/AskDoubtButton.tsx`
  - For a specific course item (identified by `moduleItemId`).
  - Submits student questions and shows pending/teacher reply.

### Progress + Achievements
- `GET /profile` (`app/profile/page.tsx`)
  - Shows:
    - Problems solved count
    - Badges (problem badges, course badges, streak/punctuality badges)
    - Current streak + progress to next badge tiers

### Career Tools: Jobs + Placement
- `GET /jobs` (`app/jobs/page.tsx`)
  - Recommended jobs page for students without organization placement setup.
- `GET /placement` (`app/placement/page.tsx`)
  - Placement dashboard (only if your account has `organizationId`).
  - Shows recruitment drives, applications, tracking, and active groups.
- Placement sub-pages (under `app/placement/layout.tsx`):
  - `/placement/profile` (`app/placement/profile/page.tsx`)
    - Academic details (degree/department/batch/CGPA) + resume info
  - `/placement/opportunities` (`app/placement/opportunities/page.tsx`)
    - Recruitment drives list for your organization
  - `/placement/applications` (`app/placement/applications/page.tsx`)
    - Your application history
  - `/placement/groups` (`app/placement/groups/page.tsx`)
    - Group chat + file sharing (members only)

### Services inside the dashboard (career + mentorship)
- Mentorship:
  - `components/MentorshipStrip.tsx` (Book a 30-minute 1-on-1 mentorship session)
- Resume drafting:
  - `components/ResumeStrip.tsx` (Pay to get an ATS-friendly resume draft)

## Next sections

The rest of this document explains what you can do inside each feature area (courses/assignments/practice, contests/hackathons, doubts/AI help, profile badges, and premium access).

## Learning Track (Courses, Assignments, Practice)

### Practice Arena (`/practice`)
`/practice` is where you solve DSA practice problems.

What you can do:
- Browse problems (with difficulty + “Solved” status).
- Open a problem:
  - `GET /practice/[id]` shows the practice player with:
    - Code editor (choose language: Java/Python/C++)
    - Terminal (run code + provide custom input)
    - Test Results panel (see passed/failed per case, including hidden cases)
    - Hints that unlock over time
    - “Ask AI” for help after the AI timer unlocks
    - Focus Mode (full-screen) to reduce distractions
- Submit when you pass all checks:
  - The UI posts your result to the practice submit endpoint and sends you back to `/practice`.

### Courses (`/courses` and `/courses/[id]`)
Courses are your structured learning paths with modules and items.

What you can do:
- Browse available courses on `GET /courses`.
- Enter a course player on `GET /courses/[id]`:
  - If you are not enrolled, you’ll see an `Enroll Now` button.
  - Once enrolled, you get a module sidebar:
    - `LOCKED`: cannot start yet
    - `IN_PROGRESS`: you can keep working
    - `COMPLETED`: finished
  - Clicking an item opens it (or shows a “Module Locked” message when locked).

Locking/unlocking (how your progress moves forward):
- Module items track completion in the system.
- Completing an item (watching a video, finishing a test/assignment/interview, marking a document read, etc.) updates progress and unlocks the next steps.

#### Course item types you can work on
In the course player, items can be one of these types:

1. `VIDEO`
   - You watch learning content (supports YouTube embeds and secure/signed videos for protected URLs).
   - Your watch progress is saved automatically:
     - when you pause
     - and periodically while playing
   - You also get a `Practice Mode` toggle while the video view is open.
   - When you finish, you can mark the item as completed.

2. `ASSIGNMENT` (and `FILE_UPLOAD`)
   - The course player either:
     - links you to the assignment workspace (`/assignment/[assignmentId]`), or
     - if it’s a LeetCode-based step, you’ll see a LeetCode “Solve” + “Mark as Completed” flow in the course player.

3. `TEST`
   - You get a timed coding test.
   - The test opens in a full-screen “test environment” with:
     - code editor + run + test cases
     - progressive hints
     - “Ask AI” help after the AI timer unlocks
   - Completing a passing test marks the item complete.

4. `AI_INTERVIEW`
   - The course player opens an AI interview round.
   - You answer by recording audio with the mic.
   - When you finish, you enter a teacher-review state:
     - `PENDING`: “Thank you” message while the teacher authenticates
     - `REJECTED`: you can try again
     - `APPROVED`: interview passed, then you return to modules

5. `WEB_DEV`
   - You work in a web-project editor with multiple files (HTML/CSS/JS).
   - You see a live preview and can submit your project to complete the item.

6. `LEETCODE`
   - You solve on LeetCode in the external tab.
   - Afterward, you mark the item as completed inside KodeCraft.

7. `DOCUMENT`
   - You read provided content (and optionally download an attached resource file).
   - You can mark it as “Read” / completed (optional).

#### Practice Mode (inside `VIDEO`)
When you click `Practice Mode`, the video item view splits into:
- A coding editor + language selector (DSA mode)
- A terminal to run your code with custom input
- A submit/save flow that stores your practice code (includes a GitHub sync option for some modes)

#### The “Ask a Doubt” button (inside course items)
While you’re in the course player, students can open an “Ask a Doubt” modal for the current course item.

What it does:
- You submit your doubt text.
- The teacher receives a notification.
- You can see pending doubts and teacher replies (pending vs answered).

### Assignment Workspace (`/assignment/[id]`)
The assignment workspace is where you complete assignment-style problems (usually launched from course items).

Inside an assignment, you will see:
- A left panel with:
  - Problem description
  - Hints (locked/unlocked over time)
  - Test cases (where applicable)
  - Complexity analysis (AI-style insights that update while typing)
- A right panel with tabs:
  - `Editor`: write code
  - `Terminal`: run + view output/errors
  - `Test Results`: run and inspect case-by-case results
  - `Ask AI`: request help (guidance / solution)
- A timer for elapsed time (used for your submission duration)
- Focus Mode:
  - Enter full-screen to start a session and reduce distractions.

Run/test/submit:
- `Run`: executes your code with the chosen input.
- `Test`: checks your code against all test cases.
- `Submit`: sends your result to the system for completion (once the UI conditions are satisfied).

Ask AI in assignments:
- “Ask AI” is locked initially.
- After the AI timer unlocks (the UI shows a countdown), you can:
  - request guidance (the system is instructed not to give the full solution immediately)
  - optionally reveal the full solution if you’re still stuck

Note about LeetCode-based assignment steps:
- LeetCode-based steps display an external LeetCode link.
- The “Mark as Completed” button is presented in the UI; the project also contains a LeetCode verification endpoint, but the button flow is currently implemented as a completion action in the UI.

## Competitions (Contests & Hackathons)

### Contest Alerts (so you don’t miss new events)
- `NewContestBanner` (on the dashboard `GET /`)
  - Shows a banner for a newly added contest/hackathon (recently created and not dismissed).
  - Clicking it takes you to the relevant `/contest/[id]` or `/hackathon` screen.
- `NotificationBell` (top-right on the student dashboard)
  - Shows recent contest/hackathon notifications and how many are “new” since your last check.
  - Clicking a notification navigates you to the contest/hackathon.

### Contests (`/contest` and `/contest/[id]`)
1. Browse contests:
   - `GET /contest` splits contests into:
     - Live (active now)
     - Upcoming
     - Past
2. Register / start:
   - If you haven’t registered, you can click `Register`.
   - If you’re registered and it is live, you can click `Start Contest`.
   - The contest player runs full-screen with a countdown timer.
3. Enter the contest:
   - `GET /contest/[id]` decides what you see:
     - External contest (`type = EXTERNAL`): you get a “Go to Contest” link.
     - Internal contest: you get the full contest player UI.

Inside the contest player, you can:
- Switch between problems using next/previous controls.
- Select a programming language.
- Run your code:
  - It runs against the problem’s test cases and shows a “Test Results” summary.
  - You also see expected input/output for each test case.
- Use AI help:
  - The “Ask AI” tab is available only after the AI timer unlocks.
  - You can ask for guidance (and, in some cases, request a full solution).
- Submit/finish:
  - Use `Submit Contest` to end your session.
  - If time runs out, the UI triggers an auto-finish flow.

### Hackathons (`/hackathon`)
- `GET /hackathon` lists hackathons/events (category `HACKATHON`) as Live / Upcoming / Past.
- Join/start/complete:
  - For internal hackathons, the action buttons will take you into the same contest player (`/contest/[id]`), so the gameplay experience is the same.
  - For external hackathons, you’ll see a “Go to Contest Link” action and (afterward) you can mark the event as completed.

## Support (Doubts + AI Interview) and Achievements

### Ask a Doubt (student questions to your teacher)
While you’re in the course player, you’ll see an `Ask a Doubt` button for the current course item.

What you can do:
- Open the modal for the current `moduleItemId`
- Type your doubt and submit
- View previous doubts for that item
  - `PENDING`: awaiting teacher response
  - `ANSWERED`: shows the teacher’s reply

### AI Interview (audio-based, teacher-reviewed)
Some course items are `AI_INTERVIEW`.

What you can do:
- Start the interview round (you are asked a set number of questions about a topic)
- Answer by recording audio using the mic
- After you finish the question set, the interview goes into teacher review:
  - `PENDING`: you’ll see a “Thank you” screen while the teacher authenticates your answer
  - `REJECTED`: you can try again
  - `APPROVED`: interview passed, and you can return to course modules

### Achievements: Profile, Badges, and Streaks
Open `GET /profile` to see your progress and rewards.

You can view:
- Total problems solved
- Badge collections:
  - Problem badges (based on solving milestones)
  - Course badges (example: course completion milestones)
  - Streak (“punctuality”) badges
- Your current day streak and a progress bar toward the next streak badge tier

There is also a “celebration” animation on login when new badges are earned.

## Careers (Jobs + Placement + Group Chat + Services)

### Jobs (`/jobs`)
If you don’t have an organization placement profile, you’ll be routed to `/jobs`.
This page shows curated/recommended jobs for you to explore.

### Placement (`/placement`)
If your account has an organization (`organizationId`), you can use `/placement`.

You can do here:
- Browse recruitment drives for your organization
- Track your applications and see their current status/stage
- View application history
- Join/track active placement groups

### Placement profile (`/placement/profile`)
You can edit your placement profile details:
- degree, department, batch, CGPA
- resume URL and resume display name

### Opportunities (`/placement/opportunities`) and Applications (`/placement/applications`)
- Opportunities lists the recruitment drives available for your organization.
- Applications shows your application history (sorted by most recent).

### Group chat + file sharing (`/placement/groups`)
If you join a group:
- You can chat in the group thread
- You can upload/share files in the chat (as attachments)
- You can only message/upload if you’re a member of that group.

### Services inside the dashboard
Two paid/student services are displayed on the student dashboard:
- `MentorshipStrip`: book a 30-minute 1-on-1 mentorship session
- `ResumeStrip`: request an ATS-friendly resume draft after payment

## Premium Access (Locked / Referral / Subscription)

Some learning features are premium-gated. If you are not eligible, the app redirects you to the locked page.

### How the app decides if you’re allowed
- `components/SubscriptionGuard.tsx`
  - Checks your access on every “protected” page.
  - It calls `GET /api/user/subscription` to fetch:
    - your `role`
    - your `subscriptionStatus` (`FREE`, `TRIAL`, or `PAID`)
    - your `trialExpiresAt` (if on trial)
  - Teachers / Admins / Coordinators bypass the lock.
  - If you are a student:
    - `FREE` → you are redirected to `/locked`
    - `TRIAL`:
      - if `trialExpiresAt` is missing or the trial is expired → you are redirected to `/locked`
    - otherwise → you can continue normally

### Locked page (`/locked`)
If you reach `/locked`, you’ll see:
- “Platform Access Locked” message (you need an active subscription or a valid teacher referral code)
- Two ways to unlock:
  1. Apply referral code (trial)
     - `POST /api/student/apply-referral`
     - Works only if you are not already `PAID` and you don’t have an active trial.
     - On success, your account becomes `TRIAL` for 4 days.
     - Referral codes are single-use (the code is deleted after successful use).
  2. Buy lifetime premium (payment)
     - Checkout flow uses Razorpay:
       - `POST /api/razorpay/create-order`
       - `POST /api/razorpay/verify` (signature verification)
     - On successful verification, your account becomes `PAID` (trial info is cleared).

Notes:
- While the subscription check is running, protected pages may briefly show a loading state to prevent content “flash” before redirect.

### Referral code rules (what happens in the backend)
- `POST /api/student/apply-referral`:
  - Rejects if you already have `PAID` access, or if you already have an active `TRIAL`.
  - For a valid referral code:
    - your status becomes `TRIAL`
    - `trialExpiresAt` is set to 4 days from now
    - the referral code record is deleted (single-use)
  - There is also a special hardcoded code (`KHUSHBOO6398`) that can activate `PAID` immediately.

### Lifetime pricing + discount codes
On the `/locked` page, the lifetime subscription uses a base price (shown in INR) and applies discount codes if you enter them:
- `OZI50` or `KPM012` → `2499`
- `KPM024` → `3499`
- `KPM036` → `1999`
- `IITMADRAS` → `24999`
- default → `4999`

The checkout itself is completed via Razorpay order creation + signature verification, and after successful verification your account becomes `PAID`.

## Quick Checklist (Where to go)
- Dashboard + daily progress + contest notifications: `/`
- Practice problems: `/practice`
- Practice player (solve + submit): `/practice/[id]`
- Courses list: `/courses`
- Course player (modules/items + progress unlocking): `/courses/[id]`
- Assignment workspace: `/assignment/[id]`
- Contests list (live/upcoming/past): `/contest`
- Contest player: `/contest/[id]`
- Hackathons list: `/hackathon`
- Profile + badges + streak: `/profile`
- Jobs (when you don’t have an org profile): `/jobs`
- Placement (when you have `organizationId`): `/placement`
- Placement sub-pages:
  - `/placement/profile`
  - `/placement/opportunities`
  - `/placement/applications`
  - `/placement/groups`
- Premium locked page: `/locked`

## Notes (things to be aware of)
- LeetCode “completion” buttons in the course/assignment flows currently use a UI completion flow, and the full verification endpoint exists in the backend (`/api/leetcode/verify`) but is not directly called by the button flow in the pages we inspected.
- AI interview audio: the UI records/upload audio, but transcription text is not currently used; your interview is submitted using a placeholder response content and the uploaded audio.
- Discussion chat: there is a discussion/chat UI implemented (`components/DiscussionPanel.tsx` + `components/DiscussionButton.tsx`), but I did not find it referenced in the main student pages I checked—so you may not see it by default even though it exists in the codebase.

