# Civora News — Editorial Voice and Publication Standard

**Adopted November 10, 2026. Applies to all new articles and substantial revisions.**

## The voice

Civora should sound like a thoughtful, direct young publisher who respects readers enough to explain the evidence. Be confident without overclaiming, specific without sounding like a textbook, and professional without the empty newsroom jargon.

- **Open with what happened and why it matters.** Start with a concrete consequence, conflict, question or verified fact. Skip generic introductions and dramatic filler.
- **Say the point plainly.** Prefer "The claim is unsupported" over "Some may argue that it could be misleading." Use clear sentences with varied rhythm, natural transitions and familiar words.
- **Challenge the weak interpretation.** Identify the part of a headline, claim or corporate statement that needs context. Explain what evidence does and does not establish.
- **Keep the author's judgment grounded.** Analysis is welcome when supported; inventions, insinuations, partisan cheerleading and faux neutrality are not. Attribute allegations. Distinguish proposed, pending, completed and effective.
- **Make complex news understandable.** Tell readers what a number measures, what its baseline is and what is missing. Do not mistake estimates, visualizations, simulations, illustrations or reported losses for direct observations.
- **Finish with the useful implication.** The conclusion should tell a reader what changes, what remains unknown or what to verify next. No hollow "only time will tell" endings.
- **Sound human, not informal.** Conversational phrasing is fine; slang, profanity, clickbait, invented first-person witnessing and gimmicky rhetorical questions are not the voice for published reports.

## Structure

1. A specific, truthful headline that does not promise more than the story can prove.
2. A sharp summary stating the key finding and why it matters.
3. Roughly 6–11 substantive paragraphs for a standard article; adjust length to the evidence, not a quota.
4. Early attribution for sourced numbers or statements; source list at the end, ideally two or more reliable independent sources when available.
5. A real explanation of the competing interpretation, limitations or unresolved issue.
6. Reporting note making the work's method clear. If no original interviews or observations occurred, say so.
7. If an image is used, include an image note with original photographer/creator, license or permission, and whether the art is illustrative or a documentary photograph.

## Editorial guardrails

- **News:** evidence first, label allegations and legal case status correctly. Do not add an opinion without identifying it as analysis.
- **Explainer:** show the mechanism and boundaries of what is known. Do not overstate scientific certainty.
- **Fact check:** quote or characterize a precise checkable claim, present a supported verdict and explain the reasoning.
- **Opinion and review:** unmistakably label the format; genuine bylines and viewpoints only, not invented first-person experience.
- **Images (mandatory for publication):** every published article must include a real, properly sourced photograph, authenticated archival image, official non-AI data visualization, or other genuinely human-created source artwork. **Do not use AI-generated images.** Verify the creator, file description, source page and public-domain or Creative Commons licensing; give the photographer or agency credit, state the license and indicate crops. Label archival, illustrative and scientific data imagery clearly. Do not imply an illustrative photo documents a current event, and do not invent visual evidence to fill an image slot.
- **Attribution and authorship:** preserve original bylines and publication dates on rewrites. AI assistance is disclosed in Civora's editorial standards; it does not count as original reporting.
- **Corrections:** material errors deserve clear corrections rather than quiet swaps. Include update details in the article when they change substantive facts.
- **Sources:** cite primary records where possible, then independent coverage or expert context. Check dates and source status before publishing.

## The actual workflow

**Civora Studio -> Supabase `public.civora_articles` -> `scripts/sync-supabase.mjs` -> GitHub Pages.** Supabase is the published article source of truth. The sync produces `content/articles.json` and static pages; hand-editing only generated HTML will be overwritten. New reports must pass editorial review before the staff editor marks them published.

`tests/editorial-voice.test.mjs` checks objective essentials: a meaningful body, multiple sources, a reporting note, and image attribution where there is a cover image. It cannot determine factual truth or reproduce a person's writing style; those require editorial judgment.

**Default rewrite prompt for future Civora editing:** "Rewrite in Civora's editorial voice: direct, clear, curious, evidence-first and professional. Lead with verified news and concrete consequences, explain the missing context, distinguish fact from inference, avoid generic filler, preserve citations and byline, and end with what readers should understand next. Do not invent reporting, quotes, photos or sources."
