import { Effect } from "effect";
import { historyIOLayer, reportHistoryValidation } from "./validation";

process.exitCode = await Effect.runPromise(
  reportHistoryValidation().pipe(
    Effect.provide(
      historyIOLayer({
        readText: (path) => Bun.file(path).text(),
        write: (stream, line) => {
          if (stream === "stdout") console.log(line);
          else console.error(line);
        },
      }),
    ),
    // A broken output stream also fails the command. Do not retry its writes.
    Effect.orElseSucceed(() => 1 as const),
  ),
);
