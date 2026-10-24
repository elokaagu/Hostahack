export type HackStatus = "draft" | "published" | "judging" | "results";

export type HackTrack = {
  id: string;
  name: string;
  brief: string;
  host: string;
  prize: string;
};

export type HackCriterion = {
  id: string;
  name: string;
  weight: number;
  description: string;
};

export type HackScheduleItem = { time: string; item: string };

export type HackDesign = {
  title: string;
  tagline: string;
  theme: string;
  hashtag: string;
  date: string;
  venue: string;
  format: string;
  capacity: number;
  tracks: HackTrack[];
  rubric: HackCriterion[];
  schedule: HackScheduleItem[];
  rules: string[];
  prizes: { name: string; value: string }[];
  mentorNeeds: { role: string; why: string }[];
  successMetrics: { measure: string; target: string }[];
  audience: string;
};

export type XPost = { handle: string; text: string; url: string };

export type HackResearch = {
  live: boolean;
  hook: string;
  themes: { theme: string; summary: string; posts: XPost[] }[];
  invite: { handle: string; name: string; why: string; kind: "builder" | "mentor" }[];
  citations: string[];
  postsFetched: number | null;
  note?: string;
};

export type HackFeed = {
  live: boolean;
  posts: XPost[];
  summary: string;
  fetchedAt: string;
  postsFetched: number | null;
  note?: string;
};

export type ParticipantProfile = {
  headline: string;
  skills: string[];
  interests: string[];
  builds: string[];
  strengths: string;
  preferredTrackId: string | null;
  evidence: XPost[];
  source: "x" | "self" | "seed";
};

export type TeamSuggestion = {
  teamId: string | null;
  teamName: string | null;
  why: string;
  role: string;
  teammates: { participantId: string; why: string }[];
};

export type AiCriterionScore = { criterionId: string; score: number; reason: string };

export type AiReview = {
  scores: AiCriterionScore[];
  total: number;
  summary: string;
  strengths: string[];
  questions: string[];
  engine: string;
  reviewedAt: string;
};

export type HackAfter = {
  followUps: { participantId: string; message: string; why: string }[];
  champions: { participantId: string; reason: string }[];
  nextEvents: { title: string; when: string; why: string }[];
  scorecard: { measure: string; status: string }[];
  generatedAt: string;
};

export type Hackathon = {
  id: string;
  slug: string;
  client_name: string;
  client_brief: string;
  status: HackStatus;
  design: HackDesign;
  research: HackResearch | null;
  feed: HackFeed | null;
  after: HackAfter | null;
  jury_key: string;
  sandbox: boolean;
  created_at: string;
  published_at: string | null;
  finalised_at: string | null;
};

export type HackTeam = {
  id: string;
  hackathon_id: string;
  name: string;
  track_id: string | null;
  rationale: string | null;
  created_at: string;
};

export type HackParticipant = {
  id: string;
  hackathon_id: string;
  x_handle: string;
  display_name: string;
  skills: string[];
  interests: string | null;
  profile: ParticipantProfile | null;
  suggestion: TeamSuggestion | null;
  team_id: string | null;
  seeded: boolean;
  created_at: string;
};

export type HackSubmission = {
  id: string;
  hackathon_id: string;
  team_id: string;
  title: string;
  link: string | null;
  description: string;
  track_id: string | null;
  ai_review: AiReview | null;
  judge_scores: Record<string, number> | null;
  judge_note: string | null;
  final_score: number | null;
  created_at: string;
};

/** Public view of a hackathon: never exposes the jury key. */
export type PublicHackathon = Omit<Hackathon, "jury_key">;
