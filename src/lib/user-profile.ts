import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { constants as fsConstants, type BigIntStats } from "node:fs";
import { lstat, mkdir, open, realpath, rename, unlink } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const USER_PROFILE_RELATIVE_PATH =
  ".slicemedia/agent-kit/user-profile.local.md";
export const USER_PROFILE_IGNORE_RULE =
  "/.slicemedia/agent-kit/user-profile.local.md";
export const USER_PROFILE_MAX_BYTES = 16 * 1024;

export const USER_PROFILE_KNOWLEDGE_LEVELS = [
  "new",
  "working",
  "advanced",
] as const;
export const USER_PROFILE_EXPLANATION_DEPTHS = [
  "concise",
  "balanced",
  "detailed",
] as const;
export const USER_PROFILE_COLLABORATION_STYLES = [
  "guided",
  "collaborative",
  "autonomous-with-checkpoints",
] as const;

const preferredLanguagePatternSource =
  "^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|[0-9]{3}))?(?:-(?:[a-z0-9]{5,8}|[0-9][a-z0-9]{3}))*$";

export const USER_PROFILE_SCHEMA = {
  schemaVersion: 1,
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "preferredLanguage",
    "webDevelopmentLevel",
    "webflowLevel",
    "typescriptToolingLevel",
    "explanationDepth",
    "collaborationStyle",
  ],
  properties: {
    schemaVersion: { const: 1 },
    preferredLanguage: {
      type: "string",
      description: "Canonical BCP-47-style language tag",
      pattern: preferredLanguagePatternSource,
      minLength: 1,
      maxLength: 80,
      examples: ["de", "de-DE", "en", "en-US", "zh-Hant-TW", "es-419"],
    },
    webDevelopmentLevel: { enum: USER_PROFILE_KNOWLEDGE_LEVELS },
    webflowLevel: { enum: USER_PROFILE_KNOWLEDGE_LEVELS },
    typescriptToolingLevel: { enum: USER_PROFILE_KNOWLEDGE_LEVELS },
    explanationDepth: { enum: USER_PROFILE_EXPLANATION_DEPTHS },
    collaborationStyle: { enum: USER_PROFILE_COLLABORATION_STYLES },
  },
} as const;

export type UserProfileKnowledgeLevel =
  (typeof USER_PROFILE_KNOWLEDGE_LEVELS)[number];
export type UserProfileExplanationDepth =
  (typeof USER_PROFILE_EXPLANATION_DEPTHS)[number];
export type UserProfileCollaborationStyle =
  (typeof USER_PROFILE_COLLABORATION_STYLES)[number];

export interface UserProfile {
  schemaVersion: 1;
  preferredLanguage: string;
  webDevelopmentLevel: UserProfileKnowledgeLevel;
  webflowLevel: UserProfileKnowledgeLevel;
  typescriptToolingLevel: UserProfileKnowledgeLevel;
  explanationDepth: UserProfileExplanationDepth;
  collaborationStyle: UserProfileCollaborationStyle;
}

export interface SaveUserProfileOptions {
  replace?: boolean;
}

export interface DeleteUserProfileOptions {
  confirmed: true;
}

export type UserProfileAction =
  "inspected" | "created" | "replaced" | "deleted" | "absent";

export interface UserProfileReceipt {
  schemaVersion: 1;
  action: UserProfileAction;
  path: typeof USER_PROFILE_RELATIVE_PATH;
  exists: boolean;
  ignoreRulePresent: boolean;
  ignoreRuleAdded: boolean;
  valid: boolean | null;
  gitVerification: "verified" | "unavailable";
  ignored: boolean | null;
  tracked: boolean | null;
  historyContainsPath: boolean | null;
}

interface FixedPaths {
  root: string;
  gitignore: string;
  slicemediaDirectory: string;
  profileDirectory: string;
  profile: string;
  nestedGitignores: readonly string[];
}

type OpenFileHandle = Awaited<ReturnType<typeof open>>;

interface OpenedDirectoryIdentity {
  opened: BigIntStats;
  handle: OpenFileHandle;
}

interface DirectoryIdentities {
  root: OpenedDirectoryIdentity;
  slicemediaDirectory: OpenedDirectoryIdentity;
  profileDirectory: OpenedDirectoryIdentity;
}

interface GitState {
  verification: "verified" | "unavailable";
  ignored: boolean | null;
  tracked: boolean | null;
  historyContainsPath: boolean | null;
}

interface CommandFailure extends Error {
  code?: number | string;
  stdout?: string;
  stderr?: string;
}

interface PendingProfileWrite {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

type CapturedFailure = { failed: false } | { error: unknown; failed: true };

class UserProfileSizeError extends Error {}

const allowedProfileKeys = new Set([
  "schemaVersion",
  "preferredLanguage",
  "webDevelopmentLevel",
  "webflowLevel",
  "typescriptToolingLevel",
  "explanationDepth",
  "collaborationStyle",
]);
const preferredLanguagePattern = new RegExp(
  preferredLanguagePatternSource,
  "u",
);

function isCommandFailure(error: unknown): error is CommandFailure {
  return error instanceof Error;
}

async function commandResult(
  command: string,
  args: string[],
  cwd: string,
): Promise<{ ok: boolean; stdout: string }> {
  try {
    const result = await execFileAsync(command, args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
    });
    return { ok: true, stdout: result.stdout };
  } catch (error) {
    if (isCommandFailure(error)) {
      return {
        ok: false,
        stdout: typeof error.stdout === "string" ? error.stdout : "",
      };
    }
    throw error;
  }
}

async function canonicalPaths(root: string): Promise<FixedPaths> {
  const requestedRoot = resolve(root);
  const rootEntry = await lstat(requestedRoot).catch(() => undefined);
  if (!rootEntry?.isDirectory()) {
    throw new Error("User profile root must be an existing directory");
  }
  const canonicalRoot = await realpath(requestedRoot);
  const profile = join(canonicalRoot, USER_PROFILE_RELATIVE_PATH);
  if (!isWithinRoot(canonicalRoot, profile)) {
    throw new Error("User profile path escapes the selected project root");
  }
  return {
    root: canonicalRoot,
    gitignore: join(canonicalRoot, ".gitignore"),
    slicemediaDirectory: join(canonicalRoot, ".slicemedia"),
    profileDirectory: dirname(profile),
    profile,
    nestedGitignores: [
      join(canonicalRoot, ".slicemedia", ".gitignore"),
      join(canonicalRoot, ".slicemedia", "agent-kit", ".gitignore"),
    ],
  };
}

async function assertRegularFileOrMissing(
  path: string,
  label: string,
): Promise<boolean> {
  const entry = await lstat(path).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return undefined;
    throw error;
  });
  if (!entry) return false;
  if (entry.isSymbolicLink() || !entry.isFile()) {
    throw new Error(`${label} must be a regular file and not a symlink`);
  }
  if (entry.nlink > 1) {
    throw new Error(`${label} must not have multiple hard links`);
  }
  return true;
}

async function assertDirectoryOrMissing(
  path: string,
  label: string,
): Promise<boolean> {
  const entry = await lstat(path).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return undefined;
    throw error;
  });
  if (!entry) return false;
  if (entry.isSymbolicLink() || !entry.isDirectory()) {
    throw new Error(`${label} must be a directory and not a symlink`);
  }
  return true;
}

async function assertSafeLocalPaths(paths: FixedPaths): Promise<boolean> {
  await assertRegularFileOrMissing(paths.gitignore, ".gitignore");
  await assertDirectoryOrMissing(paths.slicemediaDirectory, ".slicemedia");
  await assertDirectoryOrMissing(
    paths.profileDirectory,
    ".slicemedia/agent-kit",
  );
  return assertRegularFileOrMissing(paths.profile, "User profile");
}

async function closeFileHandles(
  handles: readonly OpenFileHandle[],
): Promise<void> {
  const failures: unknown[] = [];
  for (const handle of handles) {
    try {
      await handle.close();
    } catch (error) {
      failures.push(error);
    }
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) {
    throw new AggregateError(
      failures,
      "Multiple filesystem handles could not be closed safely",
      { cause: failures[0] },
    );
  }
}

async function captureFailure(
  operation: () => Promise<void>,
): Promise<CapturedFailure> {
  try {
    await operation();
    return { failed: false };
  } catch (error) {
    return { error, failed: true };
  }
}

function combinedFailure(
  message: string,
  primary: unknown,
  additional: readonly unknown[],
): AggregateError {
  return new AggregateError([primary, ...additional], message, {
    cause: primary,
  });
}

async function runWithCleanup<T>(
  operation: () => Promise<T>,
  cleanup: () => Promise<void>,
  cleanupOnlyMessage: string,
  combinedMessage: string,
): Promise<T> {
  let result!: T;
  let operationFailure: CapturedFailure = { failed: false };
  try {
    result = await operation();
  } catch (error) {
    operationFailure = { error, failed: true };
  }
  const cleanupFailure = await captureFailure(cleanup);

  if (operationFailure.failed) {
    if (cleanupFailure.failed) {
      throw combinedFailure(combinedMessage, operationFailure.error, [
        cleanupFailure.error,
      ]);
    }
    throw operationFailure.error;
  }
  if (cleanupFailure.failed) {
    throw new Error(cleanupOnlyMessage, { cause: cleanupFailure.error });
  }
  return result;
}

async function rethrowAfterRecovery(
  primary: unknown,
  recovery: () => Promise<void>,
  cleanup: () => Promise<void>,
): Promise<never> {
  const recoveryFailure = await captureFailure(recovery);
  const cleanupFailure = await captureFailure(cleanup);
  const additional: unknown[] = [];
  if (recoveryFailure.failed) additional.push(recoveryFailure.error);
  if (cleanupFailure.failed) additional.push(cleanupFailure.error);
  if (additional.length > 0) {
    throw combinedFailure(
      "User profile write failed and safe recovery did not complete",
      primary,
      additional,
    );
  }
  throw primary;
}

async function closeDirectoryIdentities(
  identities: DirectoryIdentities,
): Promise<void> {
  await closeFileHandles([
    identities.profileDirectory.handle,
    identities.slicemediaDirectory.handle,
    identities.root.handle,
  ]);
}

async function openStableDirectory(
  path: string,
  label: string,
  parentOpened?: BigIntStats,
): Promise<OpenedDirectoryIdentity> {
  const before = await lstat(path, { bigint: true });
  if (before.isSymbolicLink() || !before.isDirectory()) {
    throw new Error(`${label} must be a directory and not a symlink`);
  }

  const handle = await open(
    path,
    fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0),
  );
  try {
    const [opened, current] = await Promise.all([
      handle.stat({ bigint: true }),
      lstat(path, { bigint: true }),
    ]);
    if (
      current.isSymbolicLink() ||
      !current.isDirectory() ||
      !opened.isDirectory() ||
      !sameFile(before, current) ||
      !samePathAndOpenedEntry(current, opened, parentOpened)
    ) {
      throw new Error(`${label} changed during its safe-open check`);
    }
    return { opened, handle };
  } catch (error) {
    const cleanupFailure = await captureFailure(() => handle.close());
    if (cleanupFailure.failed) {
      throw combinedFailure(
        `${label} safe-open failed and its handle could not be closed safely`,
        error,
        [cleanupFailure.error],
      );
    }
    throw error;
  }
}

async function openProfileDirectoryChain(
  paths: FixedPaths,
): Promise<DirectoryIdentities> {
  const openedHandles: OpenFileHandle[] = [];
  try {
    const root = await openStableDirectory(paths.root, "Project root");
    openedHandles.unshift(root.handle);
    const slicemediaDirectory = await openStableDirectory(
      paths.slicemediaDirectory,
      ".slicemedia",
      root.opened,
    );
    openedHandles.unshift(slicemediaDirectory.handle);
    const profileDirectory = await openStableDirectory(
      paths.profileDirectory,
      ".slicemedia/agent-kit",
      slicemediaDirectory.opened,
    );
    return { root, slicemediaDirectory, profileDirectory };
  } catch (error) {
    const cleanupFailure = await captureFailure(() =>
      closeFileHandles(openedHandles),
    );
    if (cleanupFailure.failed) {
      throw combinedFailure(
        "Profile directory-chain open failed and parent handles could not be closed safely",
        error,
        [cleanupFailure.error],
      );
    }
    throw error;
  }
}

async function ensureProfileDirectory(
  paths: FixedPaths,
): Promise<DirectoryIdentities> {
  const directories = [paths.slicemediaDirectory, paths.profileDirectory];
  for (const [index, directory] of directories.entries()) {
    const exists = await assertDirectoryOrMissing(
      directory,
      index === 0 ? ".slicemedia" : ".slicemedia/agent-kit",
    );
    if (!exists) {
      await mkdir(directory, { mode: 0o700 });
      await assertDirectoryOrMissing(
        directory,
        index === 0 ? ".slicemedia" : ".slicemedia/agent-kit",
      );
    }
  }
  return openProfileDirectoryChain(paths);
}

function hasFinalEffectiveIgnoreRule(source: string): boolean {
  const meaningful = source
    .split(/\r?\n/u)
    .filter((line) => line.trim() !== "" && !line.trimStart().startsWith("#"));
  return meaningful.at(-1) === USER_PROFILE_IGNORE_RULE;
}

async function inspectIgnoreRule(paths: FixedPaths): Promise<boolean> {
  const snapshot = await readStableOptionalFile(paths.gitignore, ".gitignore");
  return hasFinalEffectiveIgnoreRule(snapshot?.source ?? "");
}

interface StableFileSnapshot {
  source: string;
  stat: BigIntStats;
}

function sameFileVersion(left: BigIntStats, right: BigIntStats): boolean {
  return (
    sameFile(left, right) &&
    left.nlink === right.nlink &&
    left.size === right.size &&
    left.mtimeNs === right.mtimeNs &&
    left.ctimeNs === right.ctimeNs
  );
}

async function assertPathStillReferencesOpenedFile(
  path: string,
  label: string,
  opened: BigIntStats,
): Promise<void> {
  const verificationHandle = await open(
    path,
    fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0),
  );
  try {
    const verified = await verificationHandle.stat({ bigint: true });
    if (!verified.isFile() || !sameFileVersion(opened, verified)) {
      throw new Error(`${label} changed during its safe-read check`);
    }
  } finally {
    await verificationHandle.close();
  }
}

async function readStableOptionalFile(
  path: string,
  label: string,
  maximumBytes?: number,
): Promise<StableFileSnapshot | undefined> {
  const before = await lstat(path, { bigint: true }).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return undefined;
      throw error;
    },
  );
  if (!before) return undefined;
  if (before.isSymbolicLink() || !before.isFile()) {
    throw new Error(`${label} must be a regular file and not a symlink`);
  }
  if (before.nlink > 1) {
    throw new Error(`${label} must not have multiple hard links`);
  }
  if (maximumBytes !== undefined && before.size > BigInt(maximumBytes)) {
    throw new UserProfileSizeError(`${label} exceeds its size limit`);
  }

  const parentPath = dirname(path);
  const parentHandle = await open(
    parentPath,
    fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0),
  );
  try {
    const [parentBefore, parentOpened] = await Promise.all([
      lstat(parentPath, { bigint: true }),
      parentHandle.stat({ bigint: true }),
    ]);
    if (
      parentBefore.isSymbolicLink() ||
      !parentBefore.isDirectory() ||
      !parentOpened.isDirectory() ||
      !samePathAndOpenedEntry(parentBefore, parentOpened)
    ) {
      throw new Error(`${label} parent changed during its safe-read check`);
    }

    const handle = await open(
      path,
      fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0),
    );
    try {
      const opened = await handle.stat({ bigint: true });
      // Bind the path snapshot to the opened handle by parent volume and file
      // identity. Node 22/libuv may report device 0 for Windows path stats,
      // while handle stats retain the volume serial. The opened parent handle
      // supplies that missing volume anchor without weakening the file-ID
      // check. Version metadata remains within one stat API class.
      const initialMismatches = [
        !opened.isFile() ? "type" : undefined,
        opened.nlink > 1 ? "link-count" : undefined,
        !samePathAndOpenedDevice(before, opened, parentOpened)
          ? "device"
          : undefined,
        before.ino !== opened.ino ? "file-id" : undefined,
        before.size !== opened.size ? "size" : undefined,
      ].filter((value): value is string => value !== undefined);
      if (initialMismatches.length > 0) {
        throw new Error(
          `${label} changed during its safe-read check (${initialMismatches.join(", ")})`,
        );
      }
      if (maximumBytes !== undefined && opened.size > BigInt(maximumBytes)) {
        throw new UserProfileSizeError(`${label} exceeds its size limit`);
      }
      const afterOpen = await lstat(path, { bigint: true });
      if (!sameFileVersion(before, afterOpen) || !afterOpen.isFile()) {
        throw new Error(`${label} changed during its safe-read check`);
      }
      await assertPathStillReferencesOpenedFile(path, label, opened);
      const source = maximumBytes
        ? (await readHandleWithinLimit(handle, maximumBytes)).toString("utf8")
        : await handle.readFile({ encoding: "utf8" });
      const after = await handle.stat({ bigint: true });
      if (!sameFileVersion(opened, after)) {
        throw new Error(`${label} changed while it was being read`);
      }
      const finalPath = await lstat(path, { bigint: true });
      if (!sameFileVersion(before, finalPath) || !finalPath.isFile()) {
        throw new Error(`${label} changed while it was being read`);
      }
      const parentAfter = await lstat(parentPath, { bigint: true });
      if (
        parentAfter.isSymbolicLink() ||
        !parentAfter.isDirectory() ||
        !sameFile(parentBefore, parentAfter)
      ) {
        throw new Error(`${label} parent changed while it was being read`);
      }
      await assertPathStillReferencesOpenedFile(path, label, after);
      if (
        maximumBytes !== undefined &&
        Buffer.byteLength(source, "utf8") > maximumBytes
      ) {
        throw new UserProfileSizeError(`${label} exceeds its size limit`);
      }
      // Keep the path-based snapshot for later path-based replacement checks.
      return { source, stat: finalPath };
    } finally {
      await handle.close();
    }
  } finally {
    await parentHandle.close();
  }
}

async function readHandleWithinLimit(
  handle: Awaited<ReturnType<typeof open>>,
  maximumBytes: number,
): Promise<Buffer> {
  const buffer = Buffer.alloc(maximumBytes + 1);
  let total = 0;
  while (total < buffer.length) {
    const { bytesRead } = await handle.read(
      buffer,
      total,
      buffer.length - total,
      total,
    );
    if (bytesRead === 0) break;
    total += bytesRead;
  }
  if (total > maximumBytes) {
    throw new UserProfileSizeError("User profile exceeds its size limit");
  }
  return buffer.subarray(0, total);
}

/** @internal Exported for platform-specific containment regression coverage. */
export function isWithinRoot(root: string, target: string): boolean {
  const contained = relative(root, target);
  return (
    contained !== "" &&
    !isAbsolute(contained) &&
    contained !== ".." &&
    !contained.startsWith(`..${sep}`)
  );
}

async function replaceGitignoreAtomically(
  paths: FixedPaths,
  source: string,
  original: StableFileSnapshot | undefined,
): Promise<void> {
  const rootBefore = await lstat(paths.root, { bigint: true });
  if (rootBefore.isSymbolicLink() || !rootBefore.isDirectory()) {
    throw new Error("Project root changed before .gitignore update");
  }
  const temporary = join(
    paths.root,
    `.gitignore.slicemedia-agent-kit-${randomUUID()}.tmp`,
  );
  const mode = original ? Number(original.stat.mode & 0o777n) : 0o644;
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  try {
    handle = await open(temporary, "wx", mode);
    await handle.chmod(mode);
    await writeBufferAtStart(handle, Buffer.from(source, "utf8"));
    const temporaryRealpath = await realpath(temporary);
    if (!isWithinRoot(paths.root, temporaryRealpath)) {
      throw new Error("Temporary .gitignore path escaped the project root");
    }
    await handle.close();
    handle = undefined;

    const [rootAfter, current] = await Promise.all([
      lstat(paths.root, { bigint: true }),
      lstat(paths.gitignore, { bigint: true }).catch(
        (error: NodeJS.ErrnoException) => {
          if (error.code === "ENOENT") return undefined;
          throw error;
        },
      ),
    ]);
    if (!sameFile(rootBefore, rootAfter) || !rootAfter.isDirectory()) {
      throw new Error("Project root changed during .gitignore update");
    }
    if (
      (original && (!current || !sameFileVersion(original.stat, current))) ||
      (!original && current)
    ) {
      throw new Error(".gitignore changed before its atomic replacement");
    }

    // Atomic rename prevents following a last-moment .gitignore symlink. A
    // same-user process racing after the final revalidation remains outside
    // the helper's enforceable threat boundary.
    await rename(temporary, paths.gitignore);
  } finally {
    await handle?.close().catch(() => undefined);
    await unlink(temporary).catch(() => undefined);
  }
}

async function ensureIgnoreRule(paths: FixedPaths): Promise<boolean> {
  const original = await readStableOptionalFile(paths.gitignore, ".gitignore");
  const source = original?.source ?? "";
  if (hasFinalEffectiveIgnoreRule(source)) return false;
  const lineEnding = source.includes("\r\n") ? "\r\n" : "\n";
  const separator =
    source.length > 0 && !source.endsWith("\n") ? lineEnding : "";
  await replaceGitignoreAtomically(
    paths,
    `${source}${separator}${USER_PROFILE_IGNORE_RULE}${lineEnding}`,
    original,
  );
  await assertRegularFileOrMissing(paths.gitignore, ".gitignore");
  if (!(await inspectIgnoreRule(paths))) {
    throw new Error("Could not establish the user profile .gitignore rule");
  }
  return true;
}

function toGitPath(path: string): string {
  return path.split(sep).join("/");
}

async function findGitMarker(root: string): Promise<boolean> {
  let current = root;
  while (true) {
    const marker = await lstat(join(current, ".git")).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return undefined;
        throw error;
      },
    );
    if (marker) return true;
    const parent = dirname(current);
    if (parent === current) return false;
    current = parent;
  }
}

async function inspectGitState(paths: FixedPaths): Promise<GitState> {
  const repository = await commandResult(
    "git",
    ["rev-parse", "--show-toplevel"],
    paths.root,
  );
  if (!repository.ok) {
    if (await findGitMarker(paths.root)) {
      throw new Error("Git repository state could not be verified safely");
    }
    return {
      verification: "unavailable",
      ignored: null,
      tracked: null,
      historyContainsPath: null,
    };
  }

  const gitRoot = await realpath(repository.stdout.trim());
  if (!isWithinRoot(gitRoot, paths.profile)) {
    throw new Error("User profile path is outside the detected Git worktree");
  }
  const relativeProfile = relative(gitRoot, paths.profile);
  const pathspec = toGitPath(relativeProfile);
  const privateHistoryPathspec = `:(top,icase,literal)${pathspec}`;
  const trackedResult = await commandResult(
    "git",
    ["ls-files", "--stage", "--", privateHistoryPathspec],
    gitRoot,
  );
  if (!trackedResult.ok) {
    throw new Error("Git index state could not be verified safely");
  }

  const head = await commandResult(
    "git",
    ["rev-parse", "--verify", "HEAD"],
    gitRoot,
  );
  const refs = await commandResult(
    "git",
    ["for-each-ref", "--format=%(refname)"],
    gitRoot,
  );
  if (!refs.ok) {
    throw new Error("Git history state could not be verified safely");
  }
  let historyContainsPath = false;
  if (head.ok || refs.stdout.trim() !== "") {
    const revisions = [
      ...(head.ok ? ["HEAD"] : []),
      ...(refs.stdout.trim() !== "" ? ["--all"] : []),
    ];
    const history = await commandResult(
      "git",
      ["log", "--format=%H", ...revisions, "--", privateHistoryPathspec],
      gitRoot,
    );
    if (!history.ok) {
      throw new Error("Git history state could not be verified safely");
    }
    historyContainsPath = history.stdout.trim() !== "";
  }

  const ignored = await commandResult(
    "git",
    ["check-ignore", "--no-index", "--quiet", "--", pathspec],
    gitRoot,
  );
  return {
    verification: "verified",
    ignored: ignored.ok,
    tracked: trackedResult.stdout.trim() !== "",
    historyContainsPath,
  };
}

async function assertNoUnverifiableNestedGitignore(
  paths: FixedPaths,
  git: GitState,
): Promise<void> {
  if (git.verification === "verified") return;
  for (const path of paths.nestedGitignores) {
    const entry = await lstat(path).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return undefined;
      throw error;
    });
    if (entry) {
      throw new Error(
        "Nested .gitignore rules prevent safe future-Git verification for this local profile",
      );
    }
  }
}

function receipt(
  action: UserProfileAction,
  exists: boolean,
  ignoreRulePresent: boolean,
  ignoreRuleAdded: boolean,
  valid: boolean | null,
  git: GitState,
): UserProfileReceipt {
  return {
    schemaVersion: 1,
    action,
    path: USER_PROFILE_RELATIVE_PATH,
    exists,
    ignoreRulePresent,
    ignoreRuleAdded,
    valid,
    gitVerification: git.verification,
    ignored: git.ignored,
    tracked: git.tracked,
    historyContainsPath: git.historyContainsPath,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateProfile(value: unknown): UserProfile {
  if (!isRecord(value)) throw new Error("Profile input must be an object");
  if (
    Object.keys(value).length !== allowedProfileKeys.size ||
    Object.keys(value).some((key) => !allowedProfileKeys.has(key))
  ) {
    throw new Error("Profile input contains unsupported or missing fields");
  }
  if (value.schemaVersion !== 1) {
    throw new Error("Profile schemaVersion must be 1");
  }
  const preferredLanguage =
    typeof value.preferredLanguage === "string"
      ? value.preferredLanguage.trim()
      : "";
  if (
    typeof value.preferredLanguage !== "string" ||
    preferredLanguage === "" ||
    value.preferredLanguage.length > 80 ||
    /\p{Cc}/u.test(value.preferredLanguage) ||
    !preferredLanguagePattern.test(preferredLanguage)
  ) {
    throw new Error(
      "preferredLanguage must be a canonical BCP-47-style language tag such as de, de-DE, or en-US",
    );
  }
  for (const field of [
    "webDevelopmentLevel",
    "webflowLevel",
    "typescriptToolingLevel",
  ] as const) {
    if (
      !USER_PROFILE_KNOWLEDGE_LEVELS.includes(
        value[field] as UserProfileKnowledgeLevel,
      )
    ) {
      throw new Error(`${field} uses an unsupported value`);
    }
  }
  if (
    !USER_PROFILE_EXPLANATION_DEPTHS.includes(
      value.explanationDepth as UserProfileExplanationDepth,
    )
  ) {
    throw new Error("explanationDepth uses an unsupported value");
  }
  if (
    !USER_PROFILE_COLLABORATION_STYLES.includes(
      value.collaborationStyle as UserProfileCollaborationStyle,
    )
  ) {
    throw new Error("collaborationStyle uses an unsupported value");
  }

  return {
    schemaVersion: 1,
    preferredLanguage,
    webDevelopmentLevel: value.webDevelopmentLevel as UserProfileKnowledgeLevel,
    webflowLevel: value.webflowLevel as UserProfileKnowledgeLevel,
    typescriptToolingLevel:
      value.typescriptToolingLevel as UserProfileKnowledgeLevel,
    explanationDepth: value.explanationDepth as UserProfileExplanationDepth,
    collaborationStyle:
      value.collaborationStyle as UserProfileCollaborationStyle,
  };
}

function normalizedDevice(stat: BigIntStats): bigint {
  return process.platform === "win32" ? stat.dev & 0xffffffffn : stat.dev;
}

function samePathAndOpenedDevice(
  pathStat: BigIntStats,
  openedStat: BigIntStats,
  parentOpened?: BigIntStats,
): boolean {
  if (process.platform !== "win32") {
    // POSIX path and handle stats already expose the same device identity.
    // Do not reject legitimate mount points merely because the opened child
    // lives on a different device from its opened parent.
    return pathStat.dev === openedStat.dev;
  }
  const openedDevice = normalizedDevice(openedStat);
  const pathDevice = normalizedDevice(pathStat);
  const parentDevice = parentOpened
    ? normalizedDevice(parentOpened)
    : openedDevice;
  return (
    openedDevice !== 0n &&
    openedDevice === parentDevice &&
    (pathDevice === 0n || pathDevice === openedDevice)
  );
}

function samePathAndOpenedEntry(
  pathStat: BigIntStats,
  openedStat: BigIntStats,
  parentOpened?: BigIntStats,
): boolean {
  return (
    samePathAndOpenedDevice(pathStat, openedStat, parentOpened) &&
    pathStat.ino === openedStat.ino
  );
}

function sameFile(left: BigIntStats, right: BigIntStats): boolean {
  return (
    normalizedDevice(left) === normalizedDevice(right) && left.ino === right.ino
  );
}

async function assertProfileParentIdentities(
  paths: FixedPaths,
  identities: DirectoryIdentities,
): Promise<void> {
  try {
    const current = await openProfileDirectoryChain(paths);
    await runWithCleanup(
      async () => {
        const [rootHeld, slicemediaDirectoryHeld, profileDirectoryHeld] =
          await Promise.all([
            identities.root.handle.stat({ bigint: true }),
            identities.slicemediaDirectory.handle.stat({ bigint: true }),
            identities.profileDirectory.handle.stat({ bigint: true }),
          ]);
        if (
          !rootHeld.isDirectory() ||
          !sameFile(rootHeld, identities.root.opened) ||
          !sameFile(current.root.opened, rootHeld) ||
          !slicemediaDirectoryHeld.isDirectory() ||
          !sameFile(
            slicemediaDirectoryHeld,
            identities.slicemediaDirectory.opened,
          ) ||
          !sameFile(
            current.slicemediaDirectory.opened,
            slicemediaDirectoryHeld,
          ) ||
          !profileDirectoryHeld.isDirectory() ||
          !sameFile(profileDirectoryHeld, identities.profileDirectory.opened) ||
          !sameFile(current.profileDirectory.opened, profileDirectoryHeld)
        ) {
          throw new Error("Opened parent directory identity changed");
        }
      },
      () => closeDirectoryIdentities(current),
      "Reopened parent directory handles could not be closed safely",
      "Parent directory verification failed and reopened handles could not be closed safely",
    );
  } catch (error) {
    throw new Error(
      "User profile parent directories changed during safe write",
      { cause: error },
    );
  }
}

async function assertOpenedProfilePath(
  paths: FixedPaths,
  identities: DirectoryIdentities,
  opened: BigIntStats,
): Promise<void> {
  await assertProfileParentIdentities(paths, identities);
  const [resolvedProfile, current] = await Promise.all([
    realpath(paths.profile),
    lstat(paths.profile, { bigint: true }),
  ]);
  if (
    !isWithinRoot(paths.root, resolvedProfile) ||
    current.isSymbolicLink() ||
    !current.isFile() ||
    current.nlink > 1 ||
    !samePathAndOpenedEntry(current, opened, identities.profileDirectory.opened)
  ) {
    throw new Error("Opened user profile path failed containment verification");
  }
}

async function writeBufferAtStart(
  handle: Awaited<ReturnType<typeof open>>,
  value: Buffer,
): Promise<void> {
  await handle.truncate(0);
  if (value.length > 0) await handle.write(value, 0, value.length, 0);
  await handle.truncate(value.length);
  await handle.sync();
}

async function optionalBigIntLstat(
  path: string,
): Promise<BigIntStats | undefined> {
  return lstat(path, { bigint: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return undefined;
    throw error;
  });
}

async function restoreReplacedProfile(
  paths: FixedPaths,
  identities: DirectoryIdentities,
  handle: OpenFileHandle,
  openedIdentity: BigIntStats,
  previous: Buffer,
): Promise<void> {
  await handle.chmod(0o600);
  await writeBufferAtStart(handle, previous);
  const restored = await handle.stat({ bigint: true });
  if (!restored.isFile() || !sameFile(restored, openedIdentity)) {
    throw new Error("Replaced user profile handle changed during rollback");
  }
  await assertOpenedProfilePath(paths, identities, restored);
}

async function removeCreatedProfileSafely(
  paths: FixedPaths,
  identities: DirectoryIdentities,
  openedIdentity: BigIntStats | undefined,
): Promise<void> {
  const current = await optionalBigIntLstat(paths.profile);
  if (!current) return;
  if (
    !openedIdentity ||
    !samePathAndOpenedEntry(
      current,
      openedIdentity,
      identities.profileDirectory.opened,
    )
  ) {
    throw new Error("Created user profile changed before safe cleanup");
  }
  await assertOpenedProfilePath(paths, identities, openedIdentity);
  await unlink(paths.profile);
}

async function beginPrivateProfileWrite(
  paths: FixedPaths,
  identities: DirectoryIdentities,
  value: string,
  replace: boolean,
): Promise<PendingProfileWrite> {
  await assertProfileParentIdentities(paths, identities);
  const before = await lstat(paths.profile, { bigint: true }).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return undefined;
      throw error;
    },
  );
  if (before && (before.isSymbolicLink() || !before.isFile())) {
    throw new Error("User profile must be a regular file and not a symlink");
  }
  if (before && before.nlink > 1) {
    throw new Error("User profile must not have multiple hard links");
  }
  if (replace && !before) {
    throw new Error("User profile no longer exists for confirmed replacement");
  }
  if (!replace && before) {
    throw new Error("User profile appeared before its private create write");
  }

  const noFollow = fsConstants.O_NOFOLLOW ?? 0;
  const handle = replace
    ? await open(paths.profile, fsConstants.O_RDWR | noFollow)
    : await open(paths.profile, "wx", 0o600);
  let previous: Buffer | null = null;
  let opened: BigIntStats | undefined;
  try {
    opened = await handle.stat({ bigint: true });
    if (
      !opened.isFile() ||
      opened.nlink > 1 ||
      (before &&
        !samePathAndOpenedEntry(
          before,
          opened,
          identities.profileDirectory.opened,
        ))
    ) {
      throw new Error("User profile changed during its safe-write check");
    }
    if (replace && opened.size > BigInt(USER_PROFILE_MAX_BYTES)) {
      throw new UserProfileSizeError(
        "Existing user profile exceeds its replacement size limit",
      );
    }
    await assertOpenedProfilePath(paths, identities, opened);
    if (replace)
      previous = await readHandleWithinLimit(handle, USER_PROFILE_MAX_BYTES);
    await handle.chmod(0o600);
    await assertOpenedProfilePath(paths, identities, opened);
    await writeBufferAtStart(handle, Buffer.from(value, "utf8"));
    await assertOpenedProfilePath(paths, identities, opened);
  } catch (error) {
    await rethrowAfterRecovery(
      error,
      async () => {
        if (replace && previous !== null && opened) {
          await restoreReplacedProfile(
            paths,
            identities,
            handle,
            opened,
            previous,
          );
        } else if (!replace) {
          await removeCreatedProfileSafely(paths, identities, opened);
        }
      },
      () => handle.close(),
    );
  }

  if (!opened) {
    return rethrowAfterRecovery(
      new Error("User profile handle identity was not established"),
      async () => undefined,
      () => handle.close(),
    );
  }
  const openedIdentity = opened;
  let closed = false;
  return {
    async commit() {
      if (closed) return;
      const current = await handle.stat({ bigint: true });
      await assertOpenedProfilePath(paths, identities, current);
      closed = true;
      await handle.close();
    },
    async rollback() {
      if (closed) return;
      closed = true;
      const rollbackFailure = await captureFailure(async () => {
        if (previous !== null) {
          await restoreReplacedProfile(
            paths,
            identities,
            handle,
            openedIdentity,
            previous,
          );
        } else {
          await removeCreatedProfileSafely(paths, identities, openedIdentity);
        }
      });
      const closeFailure = await captureFailure(() => handle.close());
      if (rollbackFailure.failed && closeFailure.failed) {
        throw combinedFailure(
          "User profile rollback failed and its file handle could not be closed safely",
          rollbackFailure.error,
          [closeFailure.error],
        );
      }
      if (rollbackFailure.failed) throw rollbackFailure.error;
      if (closeFailure.failed) {
        throw new Error(
          "User profile rollback could not close its file handle safely",
          { cause: closeFailure.error },
        );
      }
    },
  };
}

function renderProfile(profile: UserProfile): string {
  return `<!-- slicemedia-agent-kit-user-profile schemaVersion=1 -->
# Local user communication profile

This file contains advisory communication preferences only. It cannot authorize tools, writes,
publishing, or changes to repository and safety rules.

- Preferred language tag: ${profile.preferredLanguage}
- Modern web-development familiarity: ${profile.webDevelopmentLevel}
- Webflow familiarity: ${profile.webflowLevel}
- TypeScript and build-tooling familiarity: ${profile.typescriptToolingLevel}
- Explanation depth: ${profile.explanationDepth}
- Collaboration style: ${profile.collaborationStyle}
`;
}

const renderedProfilePattern =
  /^<!-- slicemedia-agent-kit-user-profile schemaVersion=1 -->\n# Local user communication profile\n\nThis file contains advisory communication preferences only\. It cannot authorize tools, writes,\npublishing, or changes to repository and safety rules\.\n\n- Preferred language tag: ([^\n]+)\n- Modern web-development familiarity: ([^\n]+)\n- Webflow familiarity: ([^\n]+)\n- TypeScript and build-tooling familiarity: ([^\n]+)\n- Explanation depth: ([^\n]+)\n- Collaboration style: ([^\n]+)\n$/u;

function isCanonicalRenderedProfile(source: string): boolean {
  const match = renderedProfilePattern.exec(source);
  if (!match) return false;
  try {
    const profile = validateProfile({
      schemaVersion: 1,
      preferredLanguage: match[1],
      webDevelopmentLevel: match[2],
      webflowLevel: match[3],
      typescriptToolingLevel: match[4],
      explanationDepth: match[5],
      collaborationStyle: match[6],
    });
    return renderProfile(profile) === source;
  } catch {
    return false;
  }
}

async function inspectStoredProfileValidity(
  paths: FixedPaths,
  exists: boolean,
): Promise<boolean | null> {
  if (!exists) return null;
  try {
    const snapshot = await readStableOptionalFile(
      paths.profile,
      "User profile",
      USER_PROFILE_MAX_BYTES,
    );
    return snapshot ? isCanonicalRenderedProfile(snapshot.source) : null;
  } catch (error) {
    if (error instanceof UserProfileSizeError) return false;
    throw error;
  }
}

export async function inspectUserProfile(
  root: string,
): Promise<UserProfileReceipt> {
  const paths = await canonicalPaths(root);
  const exists = await assertSafeLocalPaths(paths);
  const [ignoreRulePresent, git, valid] = await Promise.all([
    inspectIgnoreRule(paths),
    inspectGitState(paths),
    inspectStoredProfileValidity(paths, exists),
  ]);
  await assertNoUnverifiableNestedGitignore(paths, git);
  return receipt("inspected", exists, ignoreRulePresent, false, valid, git);
}

export async function saveUserProfile(
  root: string,
  input: UserProfile,
  options: SaveUserProfileOptions = {},
): Promise<UserProfileReceipt> {
  const profile = validateProfile(input);
  const paths = await canonicalPaths(root);
  const existed = await assertSafeLocalPaths(paths);
  if (existed && !options.replace) {
    throw new Error(
      "User profile already exists; replacement was not confirmed",
    );
  }

  const before = await inspectGitState(paths);
  await assertNoUnverifiableNestedGitignore(paths, before);
  if (before.tracked) {
    throw new Error(
      "User profile path is tracked or staged; remove it from the Git index through a separately reviewed remediation",
    );
  }
  if (before.historyContainsPath) {
    throw new Error(
      "User profile path exists in reachable Git history; remediate repository history before saving another profile",
    );
  }
  if (!existed && options.replace) {
    throw new Error("User profile does not exist for confirmed replacement");
  }

  const ignoreRuleAdded = await ensureIgnoreRule(paths);
  if (before.verification === "verified") {
    const ignored = await inspectGitState(paths);
    if (!ignored.ignored || ignored.tracked || ignored.historyContainsPath) {
      throw new Error(
        "User profile path did not pass Git privacy verification before writing",
      );
    }
  }

  const directoryIdentities = await ensureProfileDirectory(paths);
  return runWithCleanup(
    async () => {
      const pendingWrite = await beginPrivateProfileWrite(
        paths,
        directoryIdentities,
        renderProfile(profile),
        existed,
      );
      try {
        const after = await inspectGitState(paths);
        const ignoreRulePresent = await inspectIgnoreRule(paths);
        const valid = await inspectStoredProfileValidity(paths, true);
        if (
          !ignoreRulePresent ||
          valid !== true ||
          (after.verification === "verified" &&
            (!after.ignored || after.tracked || after.historyContainsPath))
        ) {
          throw new Error(
            "User profile failed Git privacy verification after writing",
          );
        }
        await pendingWrite.commit();
        return receipt(
          existed ? "replaced" : "created",
          true,
          ignoreRulePresent,
          ignoreRuleAdded,
          true,
          after,
        );
      } catch (error) {
        const rollbackFailure = await captureFailure(() =>
          pendingWrite.rollback(),
        );
        if (rollbackFailure.failed) {
          throw combinedFailure(
            "User profile verification failed and write rollback did not complete safely",
            error,
            [rollbackFailure.error],
          );
        }
        throw error;
      }
    },
    () => closeDirectoryIdentities(directoryIdentities),
    "User profile save completed but directory handles could not be closed safely",
    "User profile save failed and directory handles could not be closed safely",
  );
}

export async function deleteUserProfile(
  root: string,
  options: DeleteUserProfileOptions,
): Promise<UserProfileReceipt> {
  if (options?.confirmed !== true) {
    throw new Error("User profile deletion requires explicit confirmation");
  }
  const paths = await canonicalPaths(root);
  const exists = await assertSafeLocalPaths(paths);
  const before = await inspectGitState(paths);
  if (before.tracked) {
    throw new Error(
      "User profile path is tracked or staged; deletion requires a separately reviewed Git remediation",
    );
  }
  if (before.historyContainsPath) {
    throw new Error(
      "User profile path exists in reachable Git history; deletion cannot remediate repository history",
    );
  }
  if (!exists) {
    const ignoreRulePresent = await inspectIgnoreRule(paths);
    return receipt("absent", false, ignoreRulePresent, false, null, before);
  }

  const ignoreRuleAdded = await ensureIgnoreRule(paths);
  if (before.verification === "verified") {
    const current = await inspectGitState(paths);
    if (current.tracked || current.historyContainsPath) {
      throw new Error(
        "User profile path entered the Git index or reachable history before deletion",
      );
    }
  }
  await unlink(paths.profile);
  const [ignoreRulePresent, git] = await Promise.all([
    inspectIgnoreRule(paths),
    inspectGitState(paths),
  ]);
  return receipt(
    "deleted",
    false,
    ignoreRulePresent,
    ignoreRuleAdded,
    null,
    git,
  );
}
