/**
 * Satellite Labs tone of voice. Shared by every AI feature that writes words a
 * client or reader will see; the same rules live in `.cursor/rules/tone-of-voice.mdc`.
 */
export const VOICE_RULES = `Satellite Labs tone of voice:
- Use British English.
- Say what something is, directly. Never define it by first saying what it isn't.
- Banned framing, in any wording: "It's not X, it's Y", "This isn't about X. It's about Y", "X is not simply A. It is B", "not just X, but Y", "less X, more Y", "X, not Y" as a punchline, or a "Not X." fragment followed by the real point.
- If something is genuinely out of scope or excluded, state that as its own plain fact ("Dialogue with characters is excluded from the first release.") rather than as a set-up for a reveal.
- Prefer concrete nouns, numbers and verbs over abstract contrasts. Cut throat-clearing and rhetorical build-ups.`;

export function withVoice(system: string): string {
  return `${system}\n\n${VOICE_RULES}`;
}

/** Sentence patterns that usually signal "not X, but Y" framing. Used to flag copy for review. */
export const CONTRAST_FRAMING_PATTERNS: RegExp[] = [
  /\b(it|this|that)\s*(?:'s|’s| is| was)\s+not\b[^.!?]{0,120}[.,;—–-]\s*(it|this|that)\s*(?:'s|’s| is| was)\b/i,
  /\b(?:isn't|isn’t|is not|wasn't|wasn’t|was not|aren't|aren’t|are not)\s+(?:simply|just|only|merely|about)\b/i,
  /\bnot\s+(?:simply|just|only|merely)\b[^.!?]{0,120}\b(?:but|it is|it's|it’s)\b/i,
  /\b(?:is|are)\s+not\s+to\b[^.!?]{0,160}[.!?]\s*(?:it|they)\s+(?:is|are)\s+to\b/i,
  /\bless\s+like\b[^.!?]{0,80}\bmore\s+like\b/i,
  /\bless\s+\w+[^.!?]{0,40}\band\s+more\s+\w+/i,
  /,\s+not\s+(?:a|an|the|just)\b[^.!?]{0,60}[.!?]/i,
  /(?:^|[.!?]\s+)Not\s+[^.!?]{1,60}\.\s/m,
];

export function findContrastFraming(text: string): string[] {
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z“"])/);
  const hits: string[] = [];
  for (let i = 0; i < sentences.length; i++) {
    const pair = `${sentences[i]} ${sentences[i + 1] ?? ""}`;
    if (CONTRAST_FRAMING_PATTERNS.some((re) => re.test(sentences[i]) || re.test(pair))) hits.push(sentences[i].trim());
  }
  return hits;
}
