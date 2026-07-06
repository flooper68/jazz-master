import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const codebaseRoot = process.cwd();
const repoRoot = path.resolve(codebaseRoot, "..");
const workRoot = path.join(repoRoot, "work");

const severityRank = new Map([
  ["blocker", 0],
  ["major", 1],
  ["minor", 2],
]);

const terminalStatuses = new Set(["done", "fixed", "wontfix", "rejected"]);
const expectedTopLevelPaths = new Set([
  ".codex/",
  ".gitignore",
  "AGENTS.md",
  "CLAUDE.md",
  "architecture/",
  "artifacts/",
  "codebase/",
  "notes/",
  "processes/",
  "research/",
  "strategy/",
  "wiki/",
  "work/",
]);

function git(args, options = {}) {
  try {
    return execFileSync("git", ["-C", repoRoot, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    }).trim();
  } catch {
    return "";
  }
}

function readMarkdownItems(directoryName) {
  const directory = path.join(workRoot, directoryName);
  return readdirSync(directory)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const fullPath = path.join(directory, file);
      const content = readFileSync(fullPath, "utf8");
      return {
        ...parseFrontmatter(content),
        file: path.relative(repoRoot, fullPath),
        directory: directoryName,
      };
    })
    .filter((item) => /^[A-Z]+-\d+$/.test(item.id ?? ""))
    .sort(compareById);
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return {};
  }

  const fields = {};
  for (const rawLine of match[1].split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = stripInlineComment(line.slice(separator + 1).trim());
    fields[key] = parseFrontmatterValue(value);
  }

  return fields;
}

function stripInlineComment(value) {
  const commentAt = value.indexOf(" #");
  return commentAt === -1 ? value : value.slice(0, commentAt).trim();
}

function parseFrontmatterValue(value) {
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    return inner ? inner.split(",").map((item) => item.trim()) : [];
  }

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}

function compareById(left, right) {
  return String(left.id ?? "").localeCompare(String(right.id ?? ""), undefined, { numeric: true });
}

function formatItem(item) {
  const id = item.id ? ` (${item.id})` : "";
  return `${item.title ?? item.file}${id}`;
}

function formatStatus(item) {
  const details = [];
  if (item.status) {
    details.push(`status: ${item.status}`);
  }
  if (item.gated_until) {
    details.push(`gated until: ${item.gated_until}`);
  }
  if (item.revisit_when) {
    details.push(`revisit: ${item.revisit_when}`);
  }
  if (item.blocked_reason) {
    details.push(`blocked: ${item.blocked_reason}`);
  }
  return details.join("; ");
}

function countBy(items, field) {
  return items.reduce((counts, item) => {
    const key = item[field] || "(missing)";
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map());
}

function renderCounts(counts) {
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([status, count]) => `  - ${status}: ${count}`)
    .join("\n");
}

function taskDependenciesAreDone(task, taskById) {
  const dependencies = Array.isArray(task.depends_on) ? task.depends_on : [];
  return dependencies.every((id) => taskById.get(id)?.status === "done");
}

function latestCommitTouching(pathspec) {
  return git(["log", "-1", "--format=%H", "--", pathspec]);
}

function commitsSince(ref) {
  const range = ref ? `${ref}..HEAD` : "HEAD";
  const output = git(["log", "--format=%H%x09%s", range]);
  return output
    ? output.split("\n").map((line) => {
        const [hash, subject] = line.split("\t");
        return { hash, subject };
      })
    : [];
}

function shippedItems(commits) {
  return commits
    .map((commit) => {
      const match = commit.subject.match(/^((?:TASK|ISSUE)-\d+):\s*(.+)$/);
      return match ? { id: match[1], subject: match[2], hash: commit.hash } : null;
    })
    .filter(Boolean);
}

function touchedPathsSince(ref) {
  const range = ref ? `${ref}..HEAD` : "HEAD";
  const output = git(["diff", "--name-only", range]);
  return output ? output.split("\n").filter(Boolean) : [];
}

function statusLines() {
  const output = git(["status", "--porcelain=v1"]);
  return output ? output.split("\n").filter(Boolean) : [];
}

function localCommitsAhead() {
  const output = git(["log", "--oneline", "origin/main..HEAD"]);
  return output ? output.split("\n").filter(Boolean) : [];
}

function isExpectedUntrackedPath(filePath) {
  return [...expectedTopLevelPaths].some((expectedPath) => filePath === expectedPath || filePath.startsWith(expectedPath));
}

function latestHeartbeatDate() {
  const heartbeatPath = path.join(workRoot, "HEARTBEAT.md");
  if (!existsSync(heartbeatPath)) {
    return "none";
  }
  const content = readFileSync(heartbeatPath, "utf8");
  const matches = [...content.matchAll(/^## (\d{4}-\d{2}-\d{2})$/gm)];
  return matches.length ? matches.at(-1)[1] : "none";
}

function latestExamGrillDate(notes) {
  const exams = notes.filter((note) => note.source_type === "grill-session" && note.exam === "true");
  return exams.at(-1)?.created ?? "none";
}

function daysSince(dateString) {
  if (!dateString || dateString === "none") {
    return null;
  }
  const then = new Date(`${dateString}T00:00:00Z`);
  if (Number.isNaN(then.valueOf())) {
    return null;
  }
  const now = new Date();
  return Math.floor((now.valueOf() - then.valueOf()) / 86_400_000);
}

const tasks = readMarkdownItems("tasks");
const issues = readMarkdownItems("issues");
const insights = readMarkdownItems("insights");
const epics = readMarkdownItems("epics");
const notes = readMarkdownItems("../notes");
const taskById = new Map(tasks.map((task) => [task.id, task]));
const heartbeatCommit = latestCommitTouching("work/HEARTBEAT.md");
const reviewCommit = latestCommitTouching("work/reviews");
const knowledgeCommit = latestCommitTouching("work/tasks/TASK-030-knowledge-maintenance-sweep.md");
const commitsAfterHeartbeat = commitsSince(heartbeatCommit);
const commitsAfterReview = commitsSince(reviewCommit);
const commitsAfterKnowledge = commitsSince(knowledgeCommit);
const shippedSinceHeartbeat = shippedItems(commitsAfterHeartbeat);
const shippedSinceReview = shippedItems(commitsAfterReview);
const shippedSinceKnowledge = shippedItems(commitsAfterKnowledge).filter((item) => item.id.startsWith("TASK-"));
const inFlight = [...tasks, ...issues, ...epics].filter((item) => ["in-progress", "blocked", "proposed"].includes(item.status));
const openIssues = issues.filter((issue) => !terminalStatuses.has(issue.status));
const readyBacklog = tasks.filter((task) => task.status === "backlog" && taskDependenciesAreDone(task, taskById));
const unprocessedNotes = notes.filter((note) => note.processed !== "true");
const dirtyLines = statusLines();
const untrackedLines = dirtyLines.filter((line) => line.startsWith("?? "));
const strayUntracked = untrackedLines
  .map((line) => line.slice(3))
  .filter((filePath) => !isExpectedUntrackedPath(filePath));
const aheadCommits = localCommitsAhead();
const securityTouchedPaths = touchedPathsSince(heartbeatCommit).filter((filePath) =>
  /(^|\/)(package\.json|bun\.lock|storage|server|auth|import|export)/.test(filePath),
);
const proposedHygiene = tasks.filter((task) => task.status === "proposed" && /maintenance|guardrails|review/i.test(task.title ?? ""));
const examDays = daysSince(latestExamGrillDate(notes));

const taskRollupsByEpic = tasks.reduce((rollups, task) => {
  const epic = task.epic || "standalone";
  const rollup = rollups.get(epic) ?? { done: 0, total: 0 };
  rollup.total += 1;
  if (task.status === "done") {
    rollup.done += 1;
  }
  rollups.set(epic, rollup);
  return rollups;
}, new Map());

const readyByEpic = readyBacklog.reduce((groups, task) => {
  const epic = task.epic || "standalone";
  const group = groups.get(epic) ?? [];
  group.push(task);
  groups.set(epic, group);
  return groups;
}, new Map());

const report = [];

report.push("# Work Status Facts");
report.push("");
report.push(`Generated: ${new Date().toISOString()}`);
report.push(`Last heartbeat ledger entry: ${latestHeartbeatDate()}`);

report.push("");
report.push("## Active, Blocked, Proposed");
report.push(inFlight.length ? inFlight.map((item) => `- ${formatItem(item)} — ${formatStatus(item)}`).join("\n") : "- None");

report.push("");
report.push("## Inbox Counts");
report.push("Insights:");
report.push(renderCounts(countBy(insights, "status")));
report.push("Issues:");
report.push(renderCounts(countBy(issues, "status")));
report.push(`Unprocessed notes: ${unprocessedNotes.length}`);

report.push("");
report.push("## Open Issues");
report.push(
  openIssues.length
    ? openIssues
        .sort((left, right) => (severityRank.get(left.severity) ?? 99) - (severityRank.get(right.severity) ?? 99) || compareById(left, right))
        .map((issue) => `- ${formatItem(issue)} — severity: ${issue.severity || "unset"}; status: ${issue.status}`)
        .join("\n")
    : "- None",
);

report.push("");
report.push("## Dependency-Ready Backlog");
if (readyByEpic.size) {
  for (const [epic, epicTasks] of [...readyByEpic.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const rollup = taskRollupsByEpic.get(epic);
    report.push(`- ${epic} — ${rollup.done}/${rollup.total} tasks done`);
    for (const task of epicTasks.sort(compareById)) {
      report.push(`  - ${formatItem(task)}`);
    }
  }
} else {
  report.push("- None");
}

report.push("");
report.push("## Shipped Since Last Heartbeat");
report.push(
  shippedSinceHeartbeat.length
    ? shippedSinceHeartbeat.map((item) => `- ${item.subject} (${item.id})`).join("\n")
    : "- None",
);

report.push("");
report.push("## Cadence Flags");
report.push(`- Heartbeat: ${shippedSinceHeartbeat.length || unprocessedNotes.length ? "due for owner-triggered consolidation" : "not due from shipped-work facts"}`);
report.push(
  `- QA/product review: ${
    shippedSinceReview.length >= 5
      ? `due; ${shippedSinceReview.length} task/issue commits since last review`
      : `not due; ${shippedSinceReview.length} task/issue commits since last review`
  }`,
);
report.push(
  `- Knowledge maintenance: ${
    proposedHygiene.some((task) => task.id === "TASK-030")
      ? "already proposed as Run knowledge maintenance sweep (TASK-030)"
      : shippedSinceKnowledge.length >= 10 || unprocessedNotes.length
        ? `due; ${shippedSinceKnowledge.length} task commits since last sweep baseline and ${unprocessedNotes.length} unprocessed notes`
        : `not due; ${shippedSinceKnowledge.length} task commits since last sweep baseline`
  }`,
);
report.push(`- Security review: ${securityTouchedPaths.length ? `review touched paths: ${securityTouchedPaths.join(", ")}` : "not indicated by path heuristics since last heartbeat"}`);
report.push(`- Exam grill: ${examDays !== null && examDays >= 30 ? `due; last exam was ${examDays} days ago` : "not due"}`);

report.push("");
report.push("## Repo Hygiene");
report.push(`- Working tree: ${dirtyLines.length ? `dirty (${dirtyLines.length} status entries)` : "clean"}`);
report.push(`- Unpushed local commits: ${aheadCommits.length ? aheadCommits.length : "none"}`);
report.push(`- Untracked files: ${untrackedLines.length ? untrackedLines.map((line) => line.slice(3)).join(", ") : "none"}`);
report.push(`- Stray untracked files outside expected project directories: ${strayUntracked.length ? strayUntracked.join(", ") : "none"}`);

console.log(report.join("\n"));
