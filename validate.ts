import { Effect } from "effect";

import { historyIOLayer, reportHistoryValidation } from "./validation";

process.exitCode = await Effect.runPromise(
  reportHistoryValidation().pipe(
    Effect.provide(
      historyIOLayer({
        readText: (path) => Bun.file(path).text(),
        write: (stream, line) => {
          // oxlint-disable-next-line effecttsgo/global-console -- Keep the synchronous stdout callback and exact CLI output.
          if (stream === "stdout") console.log(line);
          // oxlint-disable-next-line effecttsgo/global-console -- Keep the synchronous stderr callback and exact CLI output.
          else console.error(line);
        },
      }),
    ),
    // A broken output stream also fails the command. Do not retry its writes.
    Effect.orElseSucceed(() => 1 as const),
  ),
);
