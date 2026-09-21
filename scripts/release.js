import { execSync } from "node:child_process";
import * as timers from "node:timers/promises";

const BUMP_TYPES = ["patch", "minor", "major"];

const bump = process.argv[2];
if (!BUMP_TYPES.includes(bump)) {
	console.error(`Usage: node scripts/release.js <${BUMP_TYPES.join("|")}>`);
	process.exit(1);
}

function run(cmd, options = {}) {
	console.log(`$ ${cmd}`);
	return execSync(cmd, { stdio: "ignore", ...options });
}

function capture(cmd) {
	return execSync(cmd, { encoding: "utf-8" }).trim();
}

function abort(message) {
	console.error(`\nError: ${message}`);
	process.exit(1);
}

// 1. Pre-flight checks
console.log("→ Pre-flight: checking working tree status...");
const status = capture("git status --porcelain");
if (status.length > 0) {
	abort(
		"Working directory is not clean. Commit or stash changes before releasing.",
	);
}

const branch = capture("git branch --show-current");
if (branch !== "main") {
	abort(`Releases must be run from 'main' branch (currently on '${branch}').`);
}

console.log("→ Pre-flight: verifying sync with origin/main...");
run("git fetch origin main", { stdio: "ignore" });
const localHead = capture("git rev-parse HEAD");
const remoteHead = capture("git rev-parse origin/main");
if (localHead !== remoteHead) {
	abort(
		"Local 'main' is not in sync with 'origin/main'. Push local commits or pull remote changes first.",
	);
}

console.log("→ Pre-flight: running verify...");
try {
	run("npm run verify");
} catch {
	abort("Verification failed (typecheck or lint errors).");
}

// 2. Dispatch GitHub Actions workflow
console.log(`→ Dispatching GitHub Actions release (${bump})...`);
try {
	run(`gh workflow run publish.yml -f bump=${bump}`);
	await timers.setTimeout(2000);
} catch {
	abort("Failed to trigger GitHub Actions workflow.");
}

console.log("→ Watching release workflow run...");
try {
	run("gh run watch --exit-status");
} catch {
	abort("GitHub Actions release workflow failed or was cancelled.");
}

// 3. Pull the release commit
console.log("→ Post-release: pulling release commit...");
try {
	run("git pull --ff-only --tags");
} catch {
	console.error("\nFailed to pull release commit from origin/main.");
	process.exit(1);
}

// 4. Update changelog with agy, then commit and push
console.log("→ Post-release: updating changelog with agy...");
const currentTag = capture("git describe --tags --abbrev=0");
const previousTag = capture(`git describe --tags --abbrev=0 ${currentTag}^`);
const changelogPrompt = `Add all items between tag ${previousTag} and ${currentTag} to docs/CHANGELOG.md. Follow the existing format (1 line per change, grouped by features and bugfixes, source is the commit log between ${previousTag}..${currentTag}, skip minor changes).`;

try {
	run(`agy -p ${JSON.stringify(changelogPrompt)}`);
} catch {
	abort("Failed to update changelog via agy.");
}

const changelogStatus = capture("git status --porcelain docs/CHANGELOG.md");
if (changelogStatus.length > 0) {
	console.log("→ Post-release: committing and pushing changelog...");
	try {
		run("git add docs/CHANGELOG.md");
		run(`git commit -m "docs(changelog): update for ${currentTag} [skip ci]"`);
		run("git push origin main");
	} catch {
		abort("Failed to commit or push updated changelog.");
	}
}

console.log(`\n✓ Successfully released ${bump} and synced local repository.`);
