# Hostahack

A hackathon operating system run by Grok and live X search, built by [Satellite Labs](https://satellitelabs.xyz) to host hackathons on behalf of clients.

**Live demo:** https://satellitelabs.xyz/hostahack (worked example: a hackathon designed for Caligra)

## What it does

1. **Design.** An operator pastes a client brief. Grok designs the event: theme, tracks, a weighted judging rubric, schedule, rules and prizes. Live X search finds what builders are posting about the theme and who is worth inviting, with links to real posts.
2. **Build.** One click publishes a branded public hackathon page with registration.
3. **Run.** Builders register with their X handle. Grok reads their public posts to build a profile and suggests balanced teams, with a reason for each match. Teams submit on the same site. Grok pre-scores each submission against the rubric, and judges adjust and confirm in a jury view.
4. **After.** Results are published and follow-ups are drafted so the community stays active.

One system replaces the usual mix of Discord, Google Forms, Devpost and spreadsheets, and handles team matching and first-pass judging that organisers usually do by hand.

## Stack

- Next.js App Router (React, Tailwind, shadcn/ui primitives)
- xAI Responses API with the `x_search` tool (`src/lib/hostbot/grok.ts`)
- Supabase Postgres for hackathons, participants, teams and submissions

## Layout

| Path | What's there |
|------|--------------|
| `src/app/hostahack` | Landing page, operator console, and per-hackathon pages (overview, register, teams, submit, jury, results) |
| `src/app/api/hostahack` | Create, and per-hackathon actions |
| `src/lib/hostahack` | Data access, Grok flows, types, and the Caligra example brief |
| `src/components/hostahack` | UI for the console, registration, feed, submissions and jury |
| `supabase/migrations/20261022220000_hostahack.sql` | Database tables (RLS on, server-only access) |
| `scripts/seed-hostahack-caligra.mjs` | Seeds the Caligra example through the live flow |

This code was extracted from the Satellite Labs Next.js app. To run it, drop `src/` into a Next.js 15 project with Tailwind and shadcn/ui, install `@supabase/supabase-js`, `@supabase/ssr`, `openai`, `zod`, `clsx` and `tailwind-merge`, copy `.env.example` to `.env.local`, and apply the migration with `supabase db push`.

## Licence

MIT. See [LICENSE](LICENSE).
