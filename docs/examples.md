# Examples

These complete programs show how Flow handles interactive tasks, branching,
validation, reusable context, and agent work. Each listing is loaded directly
from the repository's `examples` folder, so the documentation always reflects
the current program.

| Example | What it demonstrates |
| --- | --- |
| [Strict execution order](#strict-execution-order) | Pausing for answers, choosing one branch, and stopping at `RETURN` |
| [Treasure Island](#treasure-island) | Nested decisions and state that changes as a workflow progresses |
| [Bug report intake](#bug-report-intake) | Validation, severity triage, reusable context, and structured agent output |
| [Launch planner](#launch-planner) | Defaults, conditional agent work, risk review, and an approval gate |

## Strict execution order

This small diagnostic workflow makes the execution sequence visible. It pauses
at each `ASK`, runs only the reached branch, and finishes with `RETURN`.

<<< ../examples/interactive-order.flow{flow}

## Treasure Island

Flow can also express interactive experiences. This game combines nested
choices with a score that changes as the player explores a path.

<<< ../examples/treasure-game.flow{flow}

## Bug report intake

This practical workflow collects required details in order, rejects invalid
answers, calculates severity, and gives an agent explicit context for producing
a consistent Markdown report.

<<< ../examples/bug-report-intake.flow{flow}

## Launch planner

This larger example combines exact input validation with open-ended agent work.
It selects a schedule, optionally reviews risk, prepares a brief, and waits for
approval before producing the final checklist.

<<< ../examples/interactive-launch-planner.flow{flow}

Ready to write one? Continue with the [quick start](quick-start.md) or keep the
[command reference](commands.md) nearby.
