const vars = JSON.parse(process.env.FLOW_VARS);
const subject = vars.message;
const length = Array.from(subject).length;
const format = /^(feat|fix|docs|refactor|test|chore)(\([a-z0-9-]+\))?!?: \S(?:.*\S)?$/;

let reason = "Accepted.";
if (/[\r\n]/.test(subject)) {
  reason = "Use a single line.";
} else if (length > vars.max_length) {
  reason = `Use at most ${vars.max_length} characters; received ${length}.`;
} else if (!format.test(subject)) {
  reason = "Use an allowed type, optional scope/!, colon, space, and summary without surrounding whitespace.";
}

console.log(JSON.stringify({ valid: reason === "Accepted.", reason, length }));
