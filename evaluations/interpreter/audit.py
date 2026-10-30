#!/usr/bin/env python3
"""Audit public benchmark messages and actual tool events, excluding private reasoning.

Materialize: python3 audit.py --materialize /private/tmp/flow-eval
Audit: python3 audit.py --sessions SESSION_DIRECTORY --parent PARENT_THREAD_ID --output results.json
"""

import argparse
import hashlib
import json
from pathlib import Path
import re


HERE = Path(__file__).resolve().parent
CASES = json.loads((HERE / "cases.json").read_text())
CASE_IDS = {case["id"] for case in CASES}
WORKER = re.compile(r"/root/(baseline|candidate|baseline_final|candidate_final)_(luna|sol|astra)$")
CASE_PATH = re.compile(r"/(?:luna|sol|astra)/(?:baseline|candidate|baseline_final|candidate_final)/(\d\d-[a-z-]+)")


def events(path):
    for line in path.read_text().splitlines():
        yield json.loads(line)


def text_content(payload):
    return "".join(part.get("text", "") for part in payload.get("content", [])
                   if part.get("type") == "output_text")


def normalize(text):
    # Message framing varies by model. Do not claim byte-exact terminal-newline coverage.
    return text.rstrip("\n")


def audit(path, parent):
    stream = events(path)
    meta = next((e["payload"] for e in stream if e["type"] == "session_meta"), {})
    source = meta.get("source", {})
    if not isinstance(source, dict):
        return None
    spawn = source.get("subagent", {}).get("thread_spawn", {})
    worker = WORKER.fullmatch(spawn.get("agent_path", ""))
    if not worker or spawn.get("parent_thread_id") != parent:
        return None
    records = list(stream)
    arm, label = worker.groups()
    model = next((e["payload"].get("model") for e in records
                  if e["type"] == "turn_context"), None)
    effort = next((e["payload"].get("effort") for e in records
                   if e["type"] == "turn_context"), None)
    cases = {cid: {"messages": [], "tools": [], "reads": 0} for cid in CASE_IDS}
    current = None
    pending_tools = {}
    for event in records:
        if event["type"] != "response_item":
            continue
        payload = event["payload"]
        kind = payload.get("type")
        if kind == "custom_tool_call":
            source = payload.get("input", "")
            # Source reads set case boundaries; evaluator records do not.
            if re.search(r"cat\s+(?:[^\n]*?program\.flow)", source):
                matches = CASE_PATH.findall(source)
                if matches and matches[-1] in cases:
                    current = matches[-1]
                    cases[current]["reads"] += 1
                    cases[current].setdefault("first_read_at", event["timestamp"])
            if current:
                entry = {"at": event["timestamp"], "name": payload.get("name"),
                         "input": source}
                cases[current]["tools"].append(entry)
                pending_tools[payload.get("call_id")] = entry
        elif kind == "custom_tool_call_output":
            entry = pending_tools.get(payload.get("call_id"))
            if entry is not None:
                # Capture only actual program process results, not loaded source or bookkeeping.
                source = entry["input"]
                if "python3" in source and "results.json" not in source and "exec_command" in source:
                    entry["output"] = payload.get("output")
        elif kind == "message" and payload.get("role") == "assistant" and current:
            text = text_content(payload)
            phase = payload.get("phase")
            # The outer evaluator is authorized to return a results link after the last program.
            if phase == "final_answer" and "results.json" in text and current == "12-question":
                break
            cases[current]["messages"].append({"at": event["timestamp"], "phase": phase,
                                                "text": text})

    scored = []
    for expected in CASES:
        cid = expected["id"]
        observed = cases[cid]
        # Error reports are permitted output, not a program print.
        errors = [m for m in observed["messages"] if re.search(r"program\.flow:\d+", m["text"])]
        outputs = [m for m in observed["messages"] if m not in errors]
        actual = [normalize(m["text"]) for m in outputs]
        wanted = [normalize(s) for s in expected["expected_outputs"]]
        reasons = []
        if actual != wanted:
            reasons.append("output sequence or message count differs")
        if expected["expected_status"] == "error":
            line = expected["expected_error_line"]
            if not any(re.search(rf"program\.flow:{line}(?:\D|$)", m["text"]) for m in errors):
                reasons.append("expected source-located failure report missing")
        elif expected["scored"] and errors:
            reasons.append("unexpected execution error")
        if cid == "12-question":
            questions = [m for m in outputs if normalize(m["text"]) == "Type yes to continue."]
            if len(questions) != 1 or questions[0]["phase"] != "final_answer":
                reasons.append("question did not pause the turn exactly once")
            prints = [m for m in outputs if m not in questions]
        else:
            prints = outputs
        if expected["scored"] and any(m["phase"] != "commentary" for m in prints):
            reasons.append("print was not an intermediate message")
        # Tools remain in the evidence file for independent process/ordering review.
        scored.append({"id": cid, "scored": expected["scored"],
                       "pass": not reasons if expected["scored"] else None,
                       "reasons": reasons, "expected_outputs": wanted,
                       "observed_outputs": actual, **observed})
    return {"arm": arm, "label": label, "model": model, "effort": effort,
            "session_id": meta.get("id"), "trace_file": str(path),
            "trace_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "passed": sum(c["pass"] is True for c in scored),
            "scored_cases": sum(c["scored"] for c in scored), "cases": scored}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sessions", type=Path)
    parser.add_argument("--parent")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--materialize", type=Path)
    args = parser.parse_args()
    if args.materialize:
        for model in ["luna", "sol", "astra"]:
            for arm in ["baseline", "candidate", "baseline_final", "candidate_final"]:
                for case in CASES:
                    directory = args.materialize / model / arm / case["id"]
                    directory.mkdir(parents=True, exist_ok=True)
                    (directory / "program.flow").write_text(case["source"])
                    for name, source in case["files"].items():
                        (directory / name).write_text(source)
        return
    if not all([args.sessions, args.parent, args.output]):
        parser.error("provide --materialize or --sessions, --parent, and --output")
    runs = []
    for path in sorted(args.sessions.glob("*.jsonl")):
        result = audit(path, args.parent)
        if result:
            runs.append(result)
    args.output.write_text(json.dumps({"runs": runs}, indent=2) + "\n")
    for run in runs:
        failed = [c["id"] for c in run["cases"] if c["pass"] is False]
        print(run["model"], run["arm"], f'{run["passed"]}/{run["scored_cases"]}', failed)


if __name__ == "__main__":
    main()
