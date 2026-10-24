# Host

Host is the event infrastructure [Satellite Labs](https://satellitelabs.xyz) runs on Grok and live X search. It plans dinners, salons, meetups, panels and hackathons from a brief, finds guests, drafts invites, publishes a public event page with RSVPs, and writes intros and follow-ups.

This repository holds Host's hackathon module, which Satellite uses to design, build and run hackathons for clients.

**Live:** https://satellitelabs.xyz/host (plan your own event from a blank brief, or watch the hackathon walkthrough at /host/video)

Host was previously called Hostahack. Old links to github.com/elokaagu/Hostahack and satellitelabs.xyz/hostahack redirect here.

## What the hackathon module does

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
| `src/app/host` | Landing page, operator console, and per-hackathon pages (overview, register, teams, submit, jury, results) |
| `src/app/api/host` | Create, and per-hackathon actions |
| `src/lib/host` | Data access, Grok flows and types |
| `src/components/host` | UI for the console, registration, feed, submissions and jury |
| `supabase/migrations` | Database tables (RLS on, server-only access). The second migration renames the original `hostahack_*` tables to `host_*`. |
| `scripts/seed-host-example.mjs` | Seeds the walkthrough example through the live flow |

This code was extracted from the Satellite Labs Next.js app. To run it, drop `src/` into a Next.js 15 project with Tailwind and shadcn/ui, install `@supabase/supabase-js`, `@supabase/ssr`, `openai`, `zod`, `clsx` and `tailwind-merge`, copy `.env.example` to `.env.local`, and apply the migrations with `supabase db push`.

### Upgrading from Hostahack

Run `supabase db push` to apply the rename migration, and rename `HOSTAHACK_OPERATOR_EMAILS` to `HOST_OPERATOR_EMAILS` (the old name is still read as a fallback).

## Licence

MIT. See [LICENSE](LICENSE).
