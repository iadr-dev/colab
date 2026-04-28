# Scope Guard — Edge Cases

## The Core Rule
Not in the request and not in the plan → log it, don't fix it.

## "While I'm in this file anyway..."
You're in auth.ts fixing a bug. You notice password validation has a security issue.
→ Log to notepad.md: "## Noticed: auth.ts:84 — password validation allows empty string"
→ Finish the bug fix. Don't touch validation.
→ After finishing: tell the user what you noticed and ask if they want to address it.

## "This refactor would make my task easier"
→ Ask: "To implement X cleanly, refactoring Y would help. Should I?"
→ If yes: make that a separate commit with separate success criteria.
→ If no: implement in existing structure even if awkward.

## "The test is wrong, not the code"
→ Do NOT silently change the test.
→ Show both: "Test expects X, but [evidence] suggests Y is correct. Which changes?"

## "This code is never called"
→ Log it. Do not remove without being asked.
→ Exception: if YOU made it unreachable by your changes — then you may remove it.

## "I need to add a utility function"
→ If only used by your code: add near your code, not in shared utils.
→ If should be shared: note it in the plan. Add as an explicit task.
