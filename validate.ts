import { historyDocumentSchema } from "./schema";

const result = historyDocumentSchema.safeParse(await Bun.file("community-history.json").json());
if (!result.success) {
  for (const issue of result.error.issues) console.error(`${issue.path.join(".")}: ${issue.message}`);
  process.exit(1);
}
console.log(`Validated ${result.data.events.length} history events.`);
