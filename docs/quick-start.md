---
description: Load the Flow interpreter and run your first program, with questions that wait for your answers and conditions written in English.
---

# Your first program

This tutorial uses a short conversation to show how Flow asks, waits, chooses a
branch, and displays a result. You need an agent that can read local files and
continue a conversation after your reply.

## 1. Install Flow

With Node.js and npm available, run:

```sh
npx skills add vinodliyanage/flow --skill flow --global
```

Choose your coding agent when prompted. `--global` makes the skill available
across projects; omit it to install only in your current project. You can also
name the agents explicitly, for example:

```sh
npx skills add vinodliyanage/flow --skill flow --global --agent codex cursor
```

The skill includes the interpreter and authoring guidance. Your agent loads
the complete current interpreter when you ask it to work with Flow. If Flow
is already installed, continue with the program below.

The editor extension is optional; its installation is covered in
[editor setup](editor-setup.md). The [Skills CLI](https://github.com/vercel-labs/skills)
documents installation options and other supported agents.

## 2. Save a program

Create `hello.flow` in your workspace:

```flow
ASK "What is your name?" AS name
IF @name is an empty string
    RETURN "A name is required."

PRINT "Hello:" @name

ASK "Would you like another greeting? Type yes or no." AS answer
IF @answer is exactly "yes"
    PRINT "Welcome to Flow."
ELSE
    PRINT "Goodbye."
```

`ASK` stores your reply as text. `IF` reads that text and chooses a branch.
Its condition can be an ordinary English sentence, including an exact text check.
`PRINT "Hello:" @name` displays the text and your answer in one message,
separated by a space. `RETURN` exits early with a message; reaching the end
of the file also finishes the program.

When you want the agent to compose the wording, `PRINT` also accepts an
instruction:

```flow
PRINT Say hello to @name.
```

That is an alternative to the exact greeting line, not another step required
in `hello.flow`. It generates a greeting using the saved name.

## 3. Ask the agent to execute it

Open the workspace containing `hello.flow`, then send this request to your agent:

```text
Use the Flow skill to execute hello.flow in this workspace.
Read its complete current interpreter before starting.
```

The agent should read and validate `hello.flow`, ask “What is your name?”, and
wait. It should display no later greeting or question before you answer.

## 4. Follow one path

Reply `Ana`. The agent should display `Hello: Ana`, then ask whether you
want another greeting. Reply `yes` to see `Welcome to Flow.` The file then ends.

This is an expected interaction, not a transcript from an executed test:

```text
Agent: What is your name?
You:   Ana
Agent: Hello: Ana
       Would you like another greeting? Type yes or no.
You:   yes
Agent: Welcome to Flow.
```

In a new run, an empty first answer should display `A name is required.` and
exit before the second question. Any second answer other than exactly `yes`
selects the `ELSE` branch. Flow does not trim or change the case of an `ASK`
answer automatically.

## 5. Read and write more

Learn [syntax and values](syntax.md), or use [prompt conversion](prompt-to-flow.md)
to turn one of your own procedures into a program. The
[command reference](commands.md) lists all available commands.

Reading, creating, or opening a program does not start it. Execution begins
when you explicitly ask the agent to run it. If execution stops with an error,
use the reported file and instruction to understand where it stopped; the
agent must not silently retry or replay work.
