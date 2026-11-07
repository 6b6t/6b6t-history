import { expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Cause, Effect, Exit, Result } from "effect";
import document from "./community-history.json";
import {
  HistoryJsonError,
  HistoryReadError,
  HistoryReportError,
  historyIOLayer,
  reportHistoryValidation,
  validateHistory,
} from "./validation";

const serializedHistory = JSON.stringify(document);

function validationHost(readText: (path: string) => PromiseLike<string>) {
  const output: { stream: "stdout" | "stderr"; line: string }[] = [];
  return {
    output,
    layer: historyIOLayer({
      readText,
      write: (stream, line) => { output.push({ stream, line }); },
    }),
  };
}

test("validates the published history and reports its complete event count", async () => {
  const host = validationHost(async (file) => {
    expect(file).toBe("community-history.json");
    return serializedHistory;
  });
  const code = await Effect.runPromise(reportHistoryValidation().pipe(Effect.provide(host.layer)));
  expect(code).toBe(0);
  expect(host.output).toEqual([
    { stream: "stdout", line: `Validated ${document.events.length} history events.` },
  ]);
});

test("unreadable files retain a typed cause without exposing it in command output", async () => {
  const denied = Object.assign(new Error("private filesystem details"), { code: "EACCES" });
  const host = validationHost(async () => { throw denied; });
  const result = await Effect.runPromise(validateHistory("private.json").pipe(
    Effect.result,
    Effect.provide(host.layer),
  ));
  expect(Result.isFailure(result)).toBe(true);
  if (Result.isFailure(result)) {
    expect(result.failure).toBeInstanceOf(HistoryReadError);
    expect(result.failure.cause).toBe(denied);
  }
  expect(await Effect.runPromise(reportHistoryValidation("private.json").pipe(
    Effect.provide(host.layer),
  ))).toBe(1);
  expect(host.output).toEqual([{ stream: "stderr", line: "Could not read history file: private.json" }]);
});

test("malformed JSON has a different typed failure from file access and schema errors", async () => {
  const host = validationHost(async () => "{");
  const result = await Effect.runPromise(validateHistory("broken.json").pipe(
    Effect.result,
    Effect.provide(host.layer),
  ));
  expect(Result.isFailure(result)).toBe(true);
  if (Result.isFailure(result)) expect(result.failure).toBeInstanceOf(HistoryJsonError);
  expect(await Effect.runPromise(reportHistoryValidation("broken.json").pipe(
    Effect.provide(host.layer),
  ))).toBe(1);
  expect(host.output).toEqual([{ stream: "stderr", line: "Invalid JSON in history file: broken.json" }]);
});

test("schema diagnostics retain all field paths and reject excess properties", async () => {
  const host = validationHost(async () => JSON.stringify({ ...document, version: 2, unexpected: true }));
  expect(await Effect.runPromise(reportHistoryValidation().pipe(Effect.provide(host.layer)))).toBe(1);
  expect(host.output).toEqual([
    { stream: "stderr", line: "unexpected: Expected no excess property" },
    { stream: "stderr", line: "version: Expected 1" },
  ]);
});

test("failed reporting is typed and does not retry a write or print a success", async () => {
  let writes = 0;
  const result = await Effect.runPromise(reportHistoryValidation().pipe(
    Effect.provide(historyIOLayer({
      readText: async () => serializedHistory,
      write: () => { writes++; throw new Error("closed output"); },
    })),
    Effect.result,
  ));
  expect(Result.isFailure(result)).toBe(true);
  if (Result.isFailure(result)) {
    expect(result.failure).toBeInstanceOf(HistoryReportError);
    expect(result.failure.stream).toBe("stdout");
  }
  expect(writes).toBe(1);
});

test("cancellation waits for a submitted read and never reports a stale result", async () => {
  let start!: () => void;
  let finish!: (text: string) => void;
  const started = new Promise<void>((resolve) => { start = resolve; });
  const pending = new Promise<string>((resolve) => { finish = resolve; });
  const host = validationHost(() => { start(); return pending; });
  const controller = new AbortController();
  let settled = false;
  const result = Effect.runPromiseExit(reportHistoryValidation().pipe(Effect.provide(host.layer)), {
    signal: controller.signal,
  }).then((exit) => { settled = true; return exit; });
  await started;
  controller.abort();
  await Promise.resolve();
  expect(settled).toBe(false);
  finish(serializedHistory);
  const exit = await result;
  expect(Exit.isFailure(exit) && Cause.hasInterrupts(exit.cause)).toBe(true);
  expect(host.output).toEqual([]);
});

test("the CLI returns the documented output and status for success and every input failure", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "history-validation-"));
  const entry = path.join(import.meta.dir, "validate.ts");
  const file = path.join(directory, "community-history.json");
  const run = async () => {
    const child = Bun.spawn([process.execPath, entry], {
      cwd: directory,
      stdout: "pipe",
      stderr: "pipe",
    });
    const [code, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ]);
    return { code, stdout, stderr };
  };
  try {
    expect(await run()).toEqual({
      code: 1,
      stdout: "",
      stderr: "Could not read history file: community-history.json\n",
    });
    await writeFile(file, "{");
    expect(await run()).toEqual({
      code: 1,
      stdout: "",
      stderr: "Invalid JSON in history file: community-history.json\n",
    });
    await writeFile(file, JSON.stringify({ ...document, version: 2 }));
    expect(await run()).toEqual({ code: 1, stdout: "", stderr: "version: Expected 1\n" });
    await writeFile(file, JSON.stringify({ ...document, events: [document.events[0]] }));
    expect(await run()).toEqual({ code: 0, stdout: "Validated 1 history events.\n", stderr: "" });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
