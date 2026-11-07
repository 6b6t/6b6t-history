import { Context, Data, Effect, Layer, Result, Schema, SchemaIssue } from "effect";
import { historyDocumentSchema } from "./schema";

export class HistoryReadError extends Data.TaggedError("HistoryReadError")<{
  readonly path: string;
  readonly cause: unknown;
}> {
  override get message() {
    return `Could not read history file: ${this.path}`;
  }
}

export class HistoryJsonError extends Data.TaggedError("HistoryJsonError")<{
  readonly path: string;
  readonly cause: unknown;
}> {
  override get message() {
    return `Invalid JSON in history file: ${this.path}`;
  }
}

export class HistoryReportError extends Data.TaggedError("HistoryReportError")<{
  readonly stream: "stdout" | "stderr";
  readonly cause: unknown;
}> {}

export class HistoryIO extends Context.Service<
  HistoryIO,
  {
    readonly readText: (path: string) => Effect.Effect<string, HistoryReadError>;
    readonly write: (
      stream: "stdout" | "stderr",
      line: string,
    ) => Effect.Effect<void, HistoryReportError>;
  }
>()("history/HistoryIO") {}

export function historyIOLayer(host: {
  readText: (path: string) => PromiseLike<string>;
  write: (stream: "stdout" | "stderr", line: string) => void;
}) {
  return Layer.succeed(HistoryIO, {
    // Bun owns the file handle. Wait for a submitted read before cancellation returns.
    readText: (path) =>
      Effect.tryPromise({
        try: async () => host.readText(path),
        catch: (cause) => new HistoryReadError({ path, cause }),
      }).pipe(Effect.uninterruptible),
    write: (stream, line) =>
      Effect.try({
        try: () => host.write(stream, line),
        catch: (cause) => new HistoryReportError({ stream, cause }),
      }),
  });
}

export const validateHistory = Effect.fn("History.validate")(function* (path: string) {
  const io = yield* HistoryIO;
  const text = yield* io.readText(path);
  const input: unknown = yield* Effect.try({
    try: () => JSON.parse(text),
    catch: (cause) => new HistoryJsonError({ path, cause }),
  });
  return yield* Schema.decodeUnknownEffect(historyDocumentSchema, {
    onExcessProperty: "error",
    errors: "all",
  })(input);
});

export const reportHistoryValidation = Effect.fn("History.reportValidation")(
  function* (path = "community-history.json") {
    const io = yield* HistoryIO;
    const result = yield* Effect.result(validateHistory(path));
    if (Result.isSuccess(result)) {
      yield* io.write("stdout", `Validated ${result.success.events.length} history events.`);
      return 0 as const;
    }

    const failure = result.failure;
    if (failure instanceof Schema.SchemaError) {
      const { issues } = SchemaIssue.makeFormatterStandardSchemaV1()(failure.issue);
      for (const issue of issues) {
        yield* io.write("stderr", `${issue.path?.join(".") ?? ""}: ${issue.message}`);
      }
    } else {
      yield* io.write("stderr", failure.message);
    }
    return 1 as const;
  },
);
