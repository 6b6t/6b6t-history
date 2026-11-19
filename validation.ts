import { Context, Effect, Layer, Result, Schema, SchemaIssue } from "effect";

import { historyDocumentSchema } from "./schema";

const DEFAULT_PATH = "community-history.json";
const decodeJson = Schema.decodeUnknownEffect(Schema.fromJsonString(Schema.Unknown));

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a class factory.
export class HistoryReadError extends Schema.TaggedError<
  HistoryReadError,
  { readonly brand: unique symbol }
>()("HistoryReadError", { path: Schema.String, cause: Schema.Unknown }) {
  override get message() {
    return `Could not read history file: ${this.path}`;
  }
}

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a class factory.
export class HistoryJsonError extends Schema.TaggedError<
  HistoryJsonError,
  { readonly brand: unique symbol }
>()("HistoryJsonError", { path: Schema.String, cause: Schema.Unknown }) {
  override get message() {
    return `Invalid JSON in history file: ${this.path}`;
  }
}

// oxlint-disable-next-line unicorn/throw-new-error -- Schema.TaggedError is a class factory.
export class HistoryReportError extends Schema.TaggedError<
  HistoryReportError,
  { readonly brand: unique symbol }
>()("HistoryReportError", {
  stream: Schema.Literals(["stdout", "stderr"]),
  cause: Schema.Unknown,
}) {}

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
        try: () => {
          host.write(stream, line);
        },
        catch: (cause) => new HistoryReportError({ stream, cause }),
      }),
  });
}

export const validateHistory = Effect.fn("History.validate")(function* (path: string) {
  const io = yield* HistoryIO;
  const text = yield* io.readText(path);
  const input = yield* decodeJson(text).pipe(
    Effect.mapError((cause) => new HistoryJsonError({ path, cause })),
  );
  return yield* Schema.decodeUnknownEffect(historyDocumentSchema, {
    onExcessProperty: "error",
    errors: "all",
  })(input);
});

export const reportHistoryValidation = Effect.fn("History.reportValidation")(function* (
  path: string = DEFAULT_PATH,
) {
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
      const issuePath =
        issue.path
          ?.map((segment) => String(typeof segment === "object" ? segment.key : segment))
          .join(".") ?? "";
      yield* io.write("stderr", `${issuePath}: ${issue.message}`);
    }
  } else {
    yield* io.write("stderr", failure.message);
  }
  return 1 as const;
});
