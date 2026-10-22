-- Hostahack: Grok-run hackathons that Satellite designs, builds and runs for clients.
CREATE TABLE IF NOT EXISTS public.hostahack_hackathons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  client_name text NOT NULL,
  client_brief text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'judging', 'results')),
  design jsonb NOT NULL,
  research jsonb,
  feed jsonb,
  after jsonb,
  jury_key text NOT NULL,
  sandbox boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  finalised_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.hostahack_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id uuid NOT NULL REFERENCES public.hostahack_hackathons(id) ON DELETE CASCADE,
  name text NOT NULL,
  track_id text,
  rationale text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hostahack_teams_hackathon_idx ON public.hostahack_teams (hackathon_id);

CREATE TABLE IF NOT EXISTS public.hostahack_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id uuid NOT NULL REFERENCES public.hostahack_hackathons(id) ON DELETE CASCADE,
  x_handle text NOT NULL,
  display_name text NOT NULL,
  skills text[] NOT NULL DEFAULT '{}',
  interests text,
  profile jsonb,
  suggestion jsonb,
  team_id uuid REFERENCES public.hostahack_teams(id) ON DELETE SET NULL,
  seeded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS hostahack_participants_handle_idx
  ON public.hostahack_participants (hackathon_id, lower(x_handle));
CREATE INDEX IF NOT EXISTS hostahack_participants_team_idx ON public.hostahack_participants (team_id);

CREATE TABLE IF NOT EXISTS public.hostahack_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id uuid NOT NULL REFERENCES public.hostahack_hackathons(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.hostahack_teams(id) ON DELETE CASCADE,
  title text NOT NULL,
  link text,
  description text NOT NULL,
  track_id text,
  ai_review jsonb,
  judge_scores jsonb,
  judge_note text,
  final_score numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS hostahack_submissions_team_idx ON public.hostahack_submissions (team_id);
CREATE INDEX IF NOT EXISTS hostahack_submissions_hackathon_idx ON public.hostahack_submissions (hackathon_id);

-- Every Grok call is logged so public endpoints can be budgeted per hour.
CREATE TABLE IF NOT EXISTS public.hostahack_calls (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hackathon_id uuid,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hostahack_calls_action_idx ON public.hostahack_calls (action, created_at DESC);

ALTER TABLE public.hostahack_hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostahack_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostahack_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostahack_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostahack_calls ENABLE ROW LEVEL SECURITY;
