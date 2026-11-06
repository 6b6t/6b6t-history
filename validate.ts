import { Result, SchemaIssue } from "effect";
import { decodeHistoryDocument } from "./schema";

const result = decodeHistoryDocument(await Bun.file("community-history.json").json());
if (Result.isFailure(result)) {
  const { issues } = SchemaIssue.makeFormatterStandardSchemaV1()(result.failure.issue);
  for (const issue of issues) console.error(`${issue.path?.join(".") ?? ""}: ${issue.message}`);
  process.exit(1);
}
console.log(`Validated ${result.success.events.length} history events.`);
