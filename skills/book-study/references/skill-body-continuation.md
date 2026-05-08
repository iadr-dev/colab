# book-study — body continuation

_Lines 181–372 of the original `SKILL.md` (split for CI line limits)._

4. Update `mastery-map.md` with new knowledge points (status: Untested)
5. Report compilation results, ask if ready for testing

### Phase 3: Mastery Test

Test chapter mastery using Socratic questioning.

1. Pull knowledge point list from `mastery-map.md` for this chapter
2. Test 1-2 questions per round:
   - Concepts: Can you explain in your own words? Can you give an example?
   - Models: Can you list the steps? Can you identify when to use it?
   - Cases: Can you state the conclusion? Can you analyze limitations?
3. **Never give answers directly** — guide the user to think
4. **Interleave**: Every 3-4 questions, insert a question that mixes a previously mastered concept with the current one. Don't announce it as review — weave it in naturally.
5. Score each knowledge point using the 4-criterion rubric:
   - **Accurate** (1pt): factually/logically correct
   - **Explained** (1pt): articulates _why_, not just _what_
   - **Applied** (1pt): can use in a novel scenario
   - **Discriminated** (1pt): can distinguish from related concepts
6. **Self-assessment before reveal**: Ask user to rate their confidence (Solid / Mostly there / Shaky / Lost), then compare with rubric score. Flag fluency illusion if self-assessment is high but rubric is low.
7. **Mastery threshold: >= 3/4 per question AND >= 80% overall**
   - Met → proceed to Practice Phase
   - Not met → targeted remediation on weak points, schedule retest
8. Update `mastery-map.md`

→ Load [references/pedagogy.md](references/pedagogy.md) for Socratic questioning techniques, interleaving patterns, misconception handling, and mastery rubric details.

### Phase 3b: Practice Phase (REQUIRED before marking mastered)

Understanding ≠ ability. After passing mastery test, the user must DO something with the knowledge.

Practice task types for books:

- "Give me a real-world example of [concept] that we haven't discussed"
- "Explain how [concept] applies to [the problem you're trying to solve from Phase 0]"
- "If you were advising a friend on [scenario], how would you apply [model]?"
- "Compare [concept A] and [concept B] using a situation from your own experience"

Keep tasks small (2-5 minutes). Pass/fail:

- **Pass** → mark as Mastered, set `Last Tested` to today, `Next Review` to +1 day, advance
- **Fail** → diagnose gap (conceptual vs application), give a simpler practice task or cycle back to Phase 3

### Phase 4: Spaced Repetition

When user returns to `/book-study <book-name>`:

1. Check `mastery-map.md` for knowledge points due for review
2. If any are due → **review first, then advance**
3. Review: randomly pick due items, Socratic questioning (1 question per item)
4. Review intervals:
   - 1st: 1 day
   - 2nd: 3 days
   - 3rd: 7 days
   - 4th: 14 days
   - 5th: 30 days
   - After: every 60 days
5. Pass → extend interval; Fail → reset to 1 day

### Phase 5: Book Complete

When all chapters are Mastered:

1. Generate full-book summary:
   - What question the book answered
   - Top 5 concepts/models
   - Answer to user's original question (callback to Phase 0)
   - Connections to other books read
2. Update `meta.md` status to "Completed"
3. Ask user: want to write a book review?

### State Restoration

Every `/book-study <book-name>` session:

1. Read `study-plan.md` → know where we left off
2. Read `mastery-map.md` → know what's mastered, what's due for review
3. Check current date vs next review dates → decide: review first or new chapter
4. Output current state and suggested next step

---

## Knowledge Compilation (Ingest)

### Input Modes

1. **Pasted text**: chapter content, reading notes, highlights
2. **File path**: PDF, txt, md
3. **Verbal summary**: user's own words, AI helps structure
4. **Mixed**: original text + user annotations

### Entity Extraction

Extract from input:

- **Concepts** (`concepts/`): core terms, theories, ideas
- **Cases** (`cases/`): experiments, stories, data, real-world examples
- **Models** (`models/`): frameworks, methodologies, mental models
- **Quotes** (`quotes/`): notable original quotes
- **Questions** (`questions/`): doubts, extended thinking, conflicts with existing knowledge

→ Load [references/page-templates.md](references/page-templates.md) for all page templates.

### Cross-Reference Update

After each ingest:

- Check if new concepts appeared in other books' wikis
- If shared across books → create/update aggregation page in `cross-book/concepts/`
- Update all related pages' "Related" sections

### Post-Ingest Bookkeeping

1. Update `book-wiki/index.md`
2. Append to `book-wiki/log.md`:

```markdown
## YYYY-MM-DD: Ingest <Book Title> Chapter X

**Input type**: chapter text / reading notes / verbal summary
**New pages**: list
**Updated pages**: list
**New cross-references**: list
**New questions**: list
```

3. Report: new pages, updated pages, new cross-references, new questions

---

## Knowledge Query

### Concept Lookup (default)

Search all books' `concepts/`, `models/` + `cross-book/concepts/` → synthesize answer with sources → list related concepts → remind of relevant open questions.

### Cross-Book Comparison

Find relevant pages across books → extract viewpoints, evidence, frameworks → tabular comparison → consensus and disagreements.

### Topic Summary

Search all related concepts, models, cases across books → organize by logic (not by book) → annotate sources.

### Question Tracking

Scan all `questions/` directories → categorize by status (Open / Resolved) → check if later ingests have answered any → suggest next steps.

### Reading Status Overview

Read `book-wiki/index.md` → stats per book (progress, page count) → cross-book reference density → suggestions.

### Search Priority

1. Exact match: page title
2. Concept match: one-line definition
3. Full-text search: detail sections
4. Associative search: cross-references
5. Cross-book search: `cross-book/`

### Response Principles

- Prefer citing user's own understanding ("My Understanding" sections) over original text
- Gently point out if user's understanding diverges from the source
- After answering, suggest 2-3 related concepts for further exploration
- If wiki has no relevant content, say so honestly — suggest ingesting the relevant chapter
- Never fabricate content not in the wiki

---

## Guidelines

### Learning Flow

- **Mastery Over Speed**: Don't skip the pre-reading guide — it's critical for activating prior knowledge.
- **Rigorous Testing**: "I get it" doesn't count. Push for examples, applications, and contrast.
- **Spaced Repetition**: The core mechanism for long-term memory. Always check for due items on return.
- **Adapt to Curiosity**: If the user is deeply curious about a specific concept, prioritize exploration over rigid progression.

### Knowledge Compilation

- **Feynman Principle**: Definitions must be in the user's own words.
- **Questions are Soul**: No questions = passive reading. Encourage and track every doubt or conflict.
- **Wiki Integrity**: Check `book-wiki/` first to avoid duplicate pages. Preserve original text for quotes.

---

## References

- [Page Templates](/colab/skills/book-study/references/page-templates.md) — Standardized wiki formats for concepts, cases, models, and chapters.
- [Pedagogy Guide](/colab/skills/book-study/references/pedagogy.md) — Deep-dive on Socratic questioning, mastery learning, and interleaving.

