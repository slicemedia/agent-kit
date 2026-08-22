#!/usr/bin/env node
import { resolve } from "node:path";

import {
  ADAPTER_TARGETS,
  generateAdapters,
  type AdapterProfile,
  type AdapterTarget,
} from "./lib/generate.js";
import {
  deleteUserProfile,
  inspectUserProfile,
  saveUserProfile,
  USER_PROFILE_MAX_BYTES,
  USER_PROFILE_SCHEMA,
  type UserProfile,
  type UserProfileReceipt,
} from "./lib/user-profile.js";
import { validateAdapters } from "./lib/validate.js";

const HELP = `Slice Media Agent Kit

Usage:
  slicemedia-agent-kit generate --root <dir> --profile <project|workspace> --targets <list> [--force] [--json]
  slicemedia-agent-kit validate --root <dir> [--json]
  slicemedia-agent-kit targets [--json]
  slicemedia-agent-kit profile status --root <dir> [--json]
  slicemedia-agent-kit profile save --root <dir> --stdin [--replace] [--json]
  slicemedia-agent-kit profile delete --root <dir> --yes [--json]

Targets: codex, claude, cursor, copilot, webflow
Use --targets none to generate only the neutral project guide for a project profile.

User profile schema: schemaVersion=1; preferredLanguage=BCP-47-style tag such as de or de-DE;
knowledge levels=new|working|advanced; explanation depth=concise|balanced|detailed;
collaboration style=guided|collaborative|autonomous-with-checkpoints.
`;

type ProfileAction = "status" | "save" | "delete";

interface ParsedArguments {
  command: string;
  profileAction: ProfileAction | undefined;
  root: string;
  profile: AdapterProfile;
  targets: AdapterTarget[] | undefined;
  force: boolean;
  stdin: boolean;
  replace: boolean;
  yes: boolean;
  json: boolean;
  help: boolean;
}

function optionValue(args: string[], name: string): string | undefined {
  return optionValues(args, name).at(-1);
}

function optionValues(args: string[], name: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!;
    if (argument.startsWith(`${name}=`)) {
      const value = argument.slice(name.length + 1);
      if (!value) throw new Error(`${name} requires a value`);
      values.push(value);
    } else if (argument === name) {
      const value = args[index + 1];
      if (!value || value.startsWith("--"))
        throw new Error(`${name} requires a value`);
      values.push(value);
      index += 1;
    }
  }
  return values;
}

function parseTargets(raw: string[]): AdapterTarget[] | undefined {
  if (raw.length === 0) return undefined;
  const values = [
    ...new Set(
      raw
        .flatMap((group) => group.split(","))
        .map((target) => target.trim())
        .filter(Boolean),
    ),
  ];
  if (values.length === 0)
    throw new Error("--targets requires at least one target or none");
  if (values.includes("none")) {
    if (values.length !== 1)
      throw new Error("--targets none cannot be combined with other targets");
    return [];
  }
  for (const value of values) {
    if (!ADAPTER_TARGETS.includes(value as AdapterTarget)) {
      throw new Error(`Unsupported adapter target: ${value}`);
    }
  }
  return values as AdapterTarget[];
}

function validateArgumentShape(
  argv: string[],
  command: string,
  profileAction: ProfileAction | undefined,
): void {
  const valueOptions = new Set<string>();
  const booleanOptions = new Set(["--json", "--help", "-h"]);
  if (command === "generate") {
    for (const option of ["--root", "--profile", "--targets"])
      valueOptions.add(option);
    booleanOptions.add("--force");
  } else if (command === "validate") {
    valueOptions.add("--root");
  } else if (command === "profile") {
    valueOptions.add("--root");
    if (profileAction === "save") {
      booleanOptions.add("--stdin");
      booleanOptions.add("--replace");
    } else if (profileAction === "delete") {
      booleanOptions.add("--yes");
    }
  }

  const optionStart = command === "profile" && profileAction ? 2 : 1;

  for (let index = optionStart; index < argv.length; index += 1) {
    const argument = argv[index]!;
    if (argument.startsWith("--") && argument.includes("=")) {
      const name = argument.slice(0, argument.indexOf("="));
      if (!valueOptions.has(name)) throw new Error(`Unknown option: ${name}`);
      continue;
    }
    if (valueOptions.has(argument)) {
      const value = argv[index + 1];
      if (!value || value.startsWith("-"))
        throw new Error(`${argument} requires a value`);
      index += 1;
      continue;
    }
    if (booleanOptions.has(argument)) continue;
    if (argument.startsWith("-"))
      throw new Error(`Unknown option: ${argument}`);
    if (command === "profile")
      throw new Error("Unexpected positional argument for profile command");
    throw new Error(`Unexpected positional argument: ${argument}`);
  }

  for (const name of ["--root", "--profile"]) {
    if (optionValues(argv, name).length > 1)
      throw new Error(`${name} may be provided only once`);
  }
}

function parseArguments(argv: string[]): ParsedArguments {
  const rawCommand = argv[0] ?? "help";
  const command =
    rawCommand === "--help" || rawCommand === "-h" ? "help" : rawCommand;
  if (
    !["generate", "validate", "targets", "profile", "help"].includes(command)
  ) {
    throw new Error(`Unknown command: ${command}`);
  }
  const rawProfileAction =
    command === "profile" && argv[1] && !argv[1].startsWith("-")
      ? argv[1]
      : undefined;
  if (
    rawProfileAction !== undefined &&
    !["status", "save", "delete"].includes(rawProfileAction)
  ) {
    throw new Error("Unsupported profile action");
  }
  const profileAction = rawProfileAction as ProfileAction | undefined;
  validateArgumentShape(argv, command, profileAction);
  const profileValue = optionValue(argv, "--profile") ?? "project";
  if (profileValue !== "project" && profileValue !== "workspace") {
    throw new Error(`Unsupported profile: ${profileValue}`);
  }
  const help =
    argv.includes("--help") || argv.includes("-h") || command === "help";
  if (command === "profile" && profileAction === undefined && !help) {
    throw new Error("profile requires status, save, or delete");
  }
  if (
    command === "profile" &&
    profileAction === "save" &&
    !argv.includes("--stdin") &&
    !help
  ) {
    throw new Error("profile save requires --stdin");
  }
  if (
    command === "profile" &&
    profileAction === "delete" &&
    !argv.includes("--yes") &&
    !help
  ) {
    throw new Error("profile delete requires --yes");
  }
  const targets = parseTargets(optionValues(argv, "--targets"));
  if (
    command === "generate" &&
    profileValue === "project" &&
    targets === undefined &&
    !help
  ) {
    throw new Error(
      "Project generation requires explicit --targets <list> or --targets none",
    );
  }
  return {
    command,
    profileAction,
    root: resolve(optionValue(argv, "--root") ?? process.cwd()),
    profile: profileValue,
    targets,
    force: argv.includes("--force"),
    stdin: argv.includes("--stdin"),
    replace: argv.includes("--replace"),
    yes: argv.includes("--yes"),
    json: argv.includes("--json"),
    help,
  };
}

async function readProfileInput(): Promise<unknown> {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of process.stdin) {
    const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    length += value.length;
    if (length > USER_PROFILE_MAX_BYTES) {
      throw new Error("Profile stdin exceeds the 16 KiB limit");
    }
    chunks.push(value);
  }
  const source = Buffer.concat(chunks).toString("utf8");
  if (source.trim() === "") throw new Error("Profile stdin must contain JSON");
  try {
    return JSON.parse(source) as unknown;
  } catch {
    throw new Error("Profile stdin must contain valid JSON");
  }
}

function profileMessage(receipt: UserProfileReceipt): string {
  const git =
    receipt.gitVerification === "verified"
      ? `ignored=${String(receipt.ignored)}, tracked=${String(receipt.tracked)}, reachable-history=${String(receipt.historyContainsPath)}`
      : "Git verification unavailable";
  const ignoreRule = receipt.ignoreRuleAdded
    ? "project .gitignore rule added"
    : `project .gitignore rule present=${String(receipt.ignoreRulePresent)}`;
  return `User profile ${receipt.action} at ${receipt.path}; exists=${String(receipt.exists)}, valid=${String(receipt.valid)}; ${ignoreRule}; ${git}.`;
}

async function main(): Promise<void> {
  const args = parseArguments(process.argv.slice(2));
  if (args.help || args.command === "help") {
    console.info(HELP);
    return;
  }

  if (args.command === "targets") {
    console.info(
      args.json
        ? JSON.stringify({ targets: ADAPTER_TARGETS })
        : ADAPTER_TARGETS.join("\n"),
    );
    return;
  }

  if (args.command === "generate") {
    const manifest = await generateAdapters(args.root, {
      profile: args.profile,
      ...(args.targets ? { targets: args.targets } : {}),
      force: args.force,
    });
    console.info(
      args.json
        ? JSON.stringify(manifest)
        : `Generated ${manifest.adapters.length} adapter targets and ${manifest.files.length} files in ${args.root}.`,
    );
    return;
  }

  if (args.command === "profile") {
    if (args.profileAction === "status") {
      const receipt = await inspectUserProfile(args.root);
      console.info(
        args.json
          ? JSON.stringify({ ...receipt, supportedSchema: USER_PROFILE_SCHEMA })
          : profileMessage(receipt),
      );
      return;
    }
    if (args.profileAction === "save") {
      if (!args.stdin) throw new Error("profile save requires --stdin");
      const input = await readProfileInput();
      const receipt = await saveUserProfile(args.root, input as UserProfile, {
        replace: args.replace,
      });
      console.info(
        args.json ? JSON.stringify(receipt) : profileMessage(receipt),
      );
      return;
    }
    if (args.profileAction === "delete") {
      if (!args.yes) throw new Error("profile delete requires --yes");
      const receipt = await deleteUserProfile(args.root, { confirmed: true });
      console.info(
        args.json ? JSON.stringify(receipt) : profileMessage(receipt),
      );
      return;
    }
    throw new Error("profile requires status, save, or delete");
  }

  if (args.command === "validate") {
    const result = await validateAdapters(args.root);
    console.info(
      args.json
        ? JSON.stringify(result)
        : result.ok
          ? `Validated ${result.checkedSkills} skills across ${result.checkedFiles} files.`
          : result.errors.join("\n"),
    );
    if (!result.ok) process.exitCode = 1;
    return;
  }

  throw new Error(`Unknown command: ${args.command}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    process.argv.includes("--json")
      ? JSON.stringify({ ok: false, error: message, exitCode: 2 })
      : message,
  );
  process.exitCode = 2;
});
