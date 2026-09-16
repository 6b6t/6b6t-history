import { z } from "zod";

export function youtubeEmbedUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      return null;
    const host = url.hostname.toLowerCase();
    const parts = url.pathname.split("/").filter(Boolean);
    const id =
      host === "youtu.be" && parts.length === 1
        ? parts[0]
        : ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)
          ? url.pathname === "/watch"
            ? url.searchParams.get("v")
            : ["embed", "shorts", "live"].includes(parts[0]) &&
                parts.length === 2
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

const text = z.string().trim().min(1);
const httpsUrl = z.url().refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}, "Use a public HTTPS URL");
const imageUrl = z.union([
  httpsUrl,
  z
    .string()
    .regex(
      /^\/(?!\/)[^\s\\]+$/,
      "Use a site-relative path or public HTTPS image URL",
    ),
]);

export const historyDocumentSchema = z
  .object({
    version: z.literal(1),
    lastUpdated: z.iso.date(),
    editingGuide: z.array(text).optional(),
    events: z
      .array(
        z
          .object({
            id: z
              .string()
              .regex(
                /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                "Use a unique lowercase ID with hyphens",
              ),
            year: z.string().regex(/^(?:\d{4}|Ongoing)$/),
            date: text,
            title: text,
            tags: z
              .array(text)
              .min(1)
              .refine(
                (tags) =>
                  new Set(tags.map((tag) => tag.toLowerCase())).size ===
                  tags.length,
                "Tags must be unique",
              ),
            description: z.array(text).min(1),
            images: z.array(
              z
                .object({ url: imageUrl, alt: text, caption: text.optional() })
                .strict(),
            ),
            videos: z.array(
              z
                .string()
                .refine(
                  (url) => youtubeEmbedUrl(url) !== null,
                  "Use a YouTube watch, share, shorts, or live video link",
                ),
            ),
            sources: z.array(httpsUrl),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
  .superRefine((document, context) => {
    const ids = new Set<string>();
    document.events.forEach((event, index) => {
      if (ids.has(event.id))
        context.addIssue({
          code: "custom",
          path: ["events", index, "id"],
          message: "Event IDs must be unique",
        });
      ids.add(event.id);
    });
  });

export type HistoryEvent = z.infer<
  typeof historyDocumentSchema
>["events"][number];

export function filterHistory(
  events: HistoryEvent[],
  tags: string[],
): HistoryEvent[] {
  return tags.length
    ? events.filter((event) => tags.some((tag) => event.tags.includes(tag)))
    : events;
}
