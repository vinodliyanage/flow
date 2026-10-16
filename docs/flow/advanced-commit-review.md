# Review three proposed commit subjects

Use the language and interpreter prompt in [flow-language.md](flow-language.md).
Ask for three proposed commit subjects, check each using JavaScript, and count
how many pass. The validator is [check-commit-subject.js](check-commit-subject.js),
kept beside this Markdown file. No repository or external service is modified.

## Sample policy

This exercise uses its own policy, not a repository's actual conventions:

- Allowed types: `feat`, `fix`, `docs`, `refactor`, `test`, and `chore`.
- Optional scope: lowercase letters, digits, or hyphens inside parentheses.
- Optional breaking-change marker: `!` before the colon.
- A colon and one space separate the prefix from a nonempty summary.
- The summary has no leading or trailing whitespace.
- The whole subject is one line and at most 72 Unicode code points.

Node.js must already be available as `node`. Each process has the language's
30-second timeout. To cancel at any prompt, answer exactly `cancel`.

## Flow: Review three commit subjects

```flow
SHELL `node --version` AS runtime
SET reviewed = 0
SET accepted = 0
SET max_length = 72

REPEAT 3 TIMES:
    ASK "Enter a commit subject, or type cancel to stop:" AS message

    IF message == "cancel":
        STOP "Commit review cancelled."

    CHECK message is not empty

    RUN "check-commit-subject.js" using Node.js AS validation

    SET review = JSON(stdout of validation)
    SET reviewed = reviewed + 1

    IF review is valid:
        SET accepted = accepted + 1
        DO Print "Accepted." in the terminal.
    ELSE:
        DO Print reason of review in the terminal.
        THINK AS advice:
            Using message, reason of review, and the sample policy, suggest how to improve the subject.
            Keep the suggestion brief and do not invent details about the change.
        DO Print advice in the terminal.

CHECK reviewed == 3

IF accepted == 3:
    DO Print "All three subjects passed." in the terminal.
ELSE:
    DO Print "Some subjects need revision." in the terminal.

PRINT with reviewed and accepted counts.
```

## Try these inputs

1. `feat(auth): add password reset` — accepted.
2. `fixed login` — rejected; execution continues because rejection is data from a successful checker process.
3. `docs: explain local setup` — accepted.

Expected final counts: `reviewed = 3`, `accepted = 2`. Answering `cancel` stops
the entire program. An empty answer fails CHECK and also stops. A failed Node.js
process stops execution immediately; it does not enter the ELSE branch.

For a rejected subject, THINK produces a short improvement suggestion. This
advice does not change the original validation result or accepted count.

To run, ask the agent to execute this program using the interpreter prompt and
answer its three prompts. Creating this file does not execute the program.
