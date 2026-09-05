# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

LeaveEasy (🔧 ระบบขอลาออนไลน์) is a coursework prototype for ADT-RAISE Non-Degree Batch 2, Module 2 (weeks 6–9). It's an online leave-request app: employees submit leave requests, managers approve/reject them, HR manages leave types. Plain HTML/CSS/JS — **no framework, no build step, no custom backend server**. The frontend talks directly to Firestore.

**`leaveeasy-spec.md` is the authoritative spec** — read it before making functional changes. It explicitly forbids adding unspecified features or implementing a later week's scope early (see its sections 8–9): the course is deliberately staged, and pulling forward next week's work (auth, security rules, CRUD on leave types, AI classification, attachments, dashboards with real data, search/filter/sort, pagination, etc.) is treated as out of scope until asked for, even if it looks like an obvious improvement. If the spec seems incomplete for a task, say so and propose a spec edit rather than silently building past it.

## Commands

```bash
npm run dev   # serve -l 3000 .   (static file server, http://localhost:3000)
```

There is no build, lint, or test command — the project has none configured (automated testing is explicitly out of scope until week 9).

## Architecture

- **No bundler, no modules.** Each `.html` page is one screen and pulls in plain `<script>` tags (Firebase compat SDK from CDN, then `js/firebase-config.js`, then shared helpers, then the page's own script). Pages can be opened directly or served via `npm run dev`.
- **`js/firebase-config.js`** initializes the Firebase app and exposes a global `db` (Firestore instance, compat API — `db.collection(...).doc(...).get()/set()/update()/add()`). Every page script relies on this global.
- **`js/util.js`** — shared helpers used by every page: `esc()` (HTML-escape before inserting into innerHTML), `ป้ายสถานะ()` (renders the colored status badge), `เวลาตอนนี้()` (current timestamp in `YYYY-MM-DD HH:mm`, stored as a string), `ค่าจากURL()` (read a query-string param).
- **`js/nav.js`** — renders the shared top nav into `<div id="nav"></div>` on every page; edit the menu list here, not per-page.
- **One script per page**, each an IIFE: `js/leave-requests.js`, `js/new-leave-request.js`, `js/leave-request-detail.js`, `js/leave-types.js`.
- **Identifiers are intentionally Thai** — function/variable names throughout the JS (e.g. `ป้ายสถานะ`, `เวลาตอนนี้`, `ใบลาทั้งหมด`) and CSS badge classes (`badge-รอพิจารณา`) are Thai words, not placeholders. Match this style in any code you add to these files instead of renaming to English.

### Data model (Firestore)

Collections (4 total): `users`, `leaveTypes`, `leaveRequests`, and `approvals` — a subcollection nested under each document in `leaveRequests` (i.e. `leaveRequests/{id}/approvals`), not a top-level collection. Full field list and rationale are in `leaveeasy-spec.md` §5. Key points to keep in mind when touching data code:

- Field names are camelCase and **case-sensitive site-wide** — `status` vs `Status` would silently break things.
- Name fields are denormalized on purpose (`requesterName`, `approverName`, `leaveTypeName`, `authorName` alongside their `*Id` foreign keys) because Firestore has no JOIN. When creating/updating a record, always write both the id and the matching name.
- `leaveRequests.status` has exactly three valid values: `รอพิจารณา` (pending) → `อนุมัติ` (approved) or `ไม่อนุมัติ` (rejected). The transition is one-way — once approved/rejected it cannot change again, and the UI must not offer to change it.
- `js/data.js` (`window.LEAVE_DATA`) is fake/seed data whose field names mirror Firestore exactly. `seed.html` + `js/seed.js` push it into Firestore once — a manual, one-time setup action, not something the app relies on at runtime.

### Secrets / what never gets pushed

**Never add a Firebase API key, service-account key, or any other credential/secret to a file that gets committed and pushed to GitHub.** Note the current repo state: [js/firebase-config.js](js/firebase-config.js) already contains a Firebase web API key and is already tracked in git — this is the spec's known, deliberate state for weeks 6–7 (Firebase web API keys aren't secret the way a server key is; real protection comes from Firestore Security Rules, which are week 8 scope per `leaveeasy-spec.md` §8) and [.gitignore](.gitignore) says so explicitly ("การกันไฟล์ที่มีคีย์ คุณจะได้เพิ่มเองในสัปดาห์ที่ 7"). Do not "fix" this unprompted by rewriting history or gitignoring it early — that's pulled-forward week 7 scope. But going forward, never introduce a *new* secret (a different API key, a service-account JSON, an OpenRouter/AI key for week 8, etc.) into any tracked file — before adding one, check whether it should go in `.gitignore` first, and flag it to the user rather than committing it silently.

### Current implementation state

There is no login yet (Firebase Authentication is week 7 scope) — writes currently hardcode a stand-in user (e.g. new requests are attributed to `u001`, comments to `u002`). `leave-types.js` still operates on an in-memory copy of `window.LEAVE_DATA` rather than Firestore — treat "wire leave types to Firestore" as real, spec-scoped work rather than an oversight to silently fix, since login/permissions land in the same week per the spec's growth plan (§8).
