import { Schema } from "effect";

export function youtubeEmbedUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    const parts = url.pathname.split("/").filter(Boolean);
    const id =
      host === "youtu.be" && parts.length === 1
        ? parts[0]
        : ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)
          ? url.pathname === "/watch"
            ? url.searchParams.get("v")
            : ["embed", "shorts", "live"].includes(parts[0]) && parts.length === 2
              ? parts[1]
              : null
          : null;
    return id && /^[A-Za-z0-9_-]{11}$/.test(id)
      ? `https://www.youtube-nocookie.com/embed/${id}?rel=0`
      : null;
  } catch {
    return null;
  }
}

const text = Schema.Trim.check(Schema.isMinLength(1));
const httpsUrl = Schema.String.check(
  Schema.makeFilter((value) => {
    try {
      const url = new URL(value);
      return (
        (url.protocol === "https:" && !url.username && !url.password) || "Use a public HTTPS URL"
      );
    } catch {
      return "Use a public HTTPS URL";
    }
  }),
);
const imageUrl = Schema.Union([
  httpsUrl,
  Schema.String.check(
    Schema.isPattern(/^\/(?!\/)[^\s\\]+$/, {
      message: "Use a site-relative path or public HTTPS image URL",
    }),
  ),
]);
const calendarDate = Schema.String.check(
  Schema.makeFilter((value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Use a valid calendar date";
    const date = new Date(`${value}T00:00:00Z`);
    return (
      (!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value) ||
      "Use a valid calendar date"
    );
  }),
);

export const historyDocumentSchema = Schema.Struct({
  version: Schema.Literal(1),
  lastUpdated: calendarDate,
  editingGuide: Schema.optional(Schema.mutable(Schema.Array(text))),
  events: Schema.mutable(
    Schema.Array(
      Schema.Struct({
        id: Schema.String.check(
          Schema.isPattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
            message: "Use a unique lowercase ID with hyphens",
          }),
        ),
        year: Schema.String.check(Schema.isPattern(/^(?:\d{4}|Ongoing)$/)),
        date: text,
        title: text,
        tags: Schema.mutable(Schema.Array(text)).check(
          Schema.isMinLength(1),
          Schema.makeFilter(
            (tags) =>
              new Set(tags.map((tag) => tag.toLowerCase())).size === tags.length ||
              "Tags must be unique",
          ),
        ),
        description: Schema.mutable(Schema.Array(text)).check(Schema.isMinLength(1)),
        images: Schema.mutable(
          Schema.Array(Schema.Struct({ url: imageUrl, alt: text, caption: Schema.optional(text) })),
        ),
        videos: Schema.mutable(
          Schema.Array(
            Schema.String.check(
              Schema.makeFilter(
                (url) =>
                  youtubeEmbedUrl(url) !== null ||
                  "Use a YouTube watch, share, shorts, or live video link",
              ),
            ),
          ),
        ),
        sources: Schema.mutable(Schema.Array(httpsUrl)),
      }),
    ),
  ).check(Schema.isMinLength(1)),
}).check(
  Schema.makeFilter((document) => {
    const ids = new Set<string>();
    const issues: Schema.FilterIssue[] = [];
    document.events.forEach((event, index) => {
      if (ids.has(event.id))
        issues.push({ path: ["events", index, "id"], issue: "Event IDs must be unique" });
      ids.add(event.id);
    });
    return issues;
  }),
);

export const decodeHistoryDocument = Schema.decodeUnknownResult(historyDocumentSchema, {
  onExcessProperty: "error",
  errors: "all",
});

export type HistoryEvent = (typeof historyDocumentSchema.Type)["events"][number];

export function filterHistory(events: HistoryEvent[], tags: string[]): HistoryEvent[] {
  return tags.length
    ? events.filter((event) => tags.some((tag) => event.tags.includes(tag)))
    : events;
}
