---
name: book-study
description: >
  Reading coach: guides users through books systematically with knowledge compilation,
  mastery testing, spaced repetition, and knowledge querying.
  Triggers on "read this book", "book study", "start studying", "/book-study".
allowed-tools: Read Bash
---

# Book Study — Reading Coach

Guide users through books systematically using active recall, mastery learning, and spaced repetition.

## Mastery Scale (4-Criterion Rubric)

| Level             | Criteria  | Description                                               |
| ----------------- | --------- | --------------------------------------------------------- |
| **Accurate**      | Truth     | Does it match what the book actually says?                |
| **Explained**     | Reasoning | Can the user articulate _why_, not just _what_?           |
| **Applied**       | Utility   | Can the user apply it to a novel, real-world scenario?    |
| **Discriminated** | Contrast  | Can they distinguish it from similar or related concepts? |

**Mastery Threshold**: >= 3/4 per question AND >= 80% overall for the chapter.

---

## Usage

```
/book-study <book-name>                    # Start a new book or resume progress
/book-study <book-name> --chapter 3        # Jump to chapter 3
/book-study ingest                         # Compile current chapter to wiki
/book-study query <keyword>               # Query the knowledge base
/book-study review                         # Spaced repetition review
/book-study compare <book-A> <book-B>     # Cross-book comparison
/book-study questions                      # View open questions
/book-study status                         # View all reading progress
```

---

## Data Structure

Wiki defaults to `book-wiki/` under the current project root.

```
book-wiki/
├── index.md                    # Global index: all books + cross-book concepts
├── log.md                      # Append-only operation log
├── <book-slug>/                # One directory per book
│   ├── meta.md                 # Book metadata (title, author, reading status)
│   ├── study-plan.md           # Reading plan + progress tracking
│   ├── mastery-map.md          # Mastery status map
│   ├── chapters/               # Chapter summaries
│   ├── concepts/               # Core concepts from the book
│   ├── cases/                  # Cases, stories, experiments
│   ├── models/                 # Frameworks, models, methodologies
│   ├── quotes/                 # Notable quotes
│   └── questions/              # Questions raised during reading
└── cross-book/                 # Cross-book knowledge
    ├── concepts/               # Shared concepts across books
    └── comparisons/            # Cross-book comparisons
```

**File naming**: All lowercase, hyphen-separated. Book slug: book title in pinyin or English abbreviation (e.g. `thinking-fast-and-slow`).

**Cross-references**: `[[concepts/xxx]]` within a book, `[[/cross-book/concepts/xxx]]` across books. Obsidian-compatible.

---

## Learning Flow

### Phase 0: Open a Book

On first `/book-study <book-name>`:

1. Check if `book-wiki/<book-slug>/` exists
   - Yes → read `study-plan.md`, restore progress (see "State Restoration")
   - No → initialize new book

2. **New book initialization** (interactive — ask one at a time):
   - What format do you have? (physical / ebook / PDF)
   - Why are you reading this book? What problem are you trying to solve?
   - How familiar are you with this domain? (beginner / some background / experienced)
   - Rough timeline to finish?

3. Generate `meta.md`:

```markdown
# <Book Title>

- **Author**: XXX
- **Category**: Psychology / Economics / Tech / ...
- **Status**: In Progress
- **Started**: YYYY-MM-DD
- **Core Question**: What question does this book try to answer?
- **One-line Review**: (fill after finishing)
```

4. Generate `study-plan.md`:

```markdown
# <Book Title> Study Plan

## Info

- **Title**: XXX
- **Author**: XXX
- **Total Chapters**: XX
- **Goal**: user's problem to solve
- **Timeline**: X weeks
- **Started**: YYYY-MM-DD

## Chapter Plan

| #   | Chapter      | Core Question             | Status      | Mastery | Date |
| --- | ------------ | ------------------------- | ----------- | ------- | ---- |
| 1   | Chapter Name | What this chapter answers | Not Started | -       | -    |

### Status Legend

- Not Started
- Guided (pre-reading done, ready to read)
- Reading
- Ingested (compiled, pending test)
- Mastered (test passed)
- Needs Review (test failed)

## Current Position

- **Current Chapter**: Chapter X
- **Next Action**: guide / read / ingest / test / review
```

5. Generate `mastery-map.md`:

```markdown
# <Book Title> Mastery Map

## Concepts

| Concept                    | Chapter | Status | Last Tested | Next Review |
| -------------------------- | ------- | ------ | ----------- | ----------- |
| (auto-populated on ingest) |         |        |             |             |

## Models

| Model | Chapter | Status | Last Tested | Next Review |
| ----- | ------- | ------ | ----------- | ----------- |

## Stats

- Total knowledge points: X
- Mastered: X (X%)
- Due for review: X
- Untested: X
```

### Phase 1: Pre-Reading Guide (before each chapter)

Purpose: activate prior knowledge, set reading questions.

1. Read `study-plan.md`, confirm current chapter
2. Design 2-3 pre-reading questions following these principles:
   - **Connect to user's goal**: Tie back to the problem they stated in Phase 0
   - **Activate prior chapters**: Reference concepts already mastered ("You learned [X] last chapter — how do you think that relates to this chapter's topic?")
   - **Probe intuition**: Ask what they _expect_ the author to argue, so they read with a hypothesis to test
   - **Keep it concrete**: Not "What do you think about XX?" but "If you had to solve [specific scenario], what would you do right now?"
3. Present questions and send user off to read
4. Update `study-plan.md` status to "Guided"

> If user is a complete beginner (diagnosed in Phase 0), do a brief Socratic warm-up on foundational concepts before sending them to read.

### Phase 2: Read + Compile (Ingest)

When user comes back after reading a chapter:

1. Accept user input (notes, verbal summary, highlights, raw text)
2. Execute ingest (see "Knowledge Compilation" section below)
3. Update `study-plan.md` status to "Ingested"

## Extended content

This repository enforces a short root `SKILL.md`. Continue with **`references/skill-body-continuation.md`** for the rest of the original skill body.
