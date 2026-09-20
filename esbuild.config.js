import esbuild from "esbuild";

await esbuild.build({
	entryPoints: ["main.ts"],
	bundle: true,
	platform: "node",
	target: "node22",
	format: "esm",
	outfile: "dist/slop-grader.mjs",
	banner: { js: "#!/usr/bin/env node" },
	logLevel: "info",
});
