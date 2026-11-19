import { expect, test } from "bun:test";

import { Result } from "effect";

import document from "./community-history.json";
import { decodeHistoryDocument } from "./schema";

function firstEvent<T>(events: T[]): T {
  const [event] = events;
  if (event === undefined) throw new Error("community-history.json has no events");
  return event;
}

test("the published history validates and trims text", () => {
  const input = structuredClone(document);
  firstEvent(input.events).title = "  Test title  ";
  const result = decodeHistoryDocument(input);
  expect(Result.isSuccess(result)).toBe(true);
  if (Result.isSuccess(result)) expect(result.success.events[0]?.title).toBe("Test title");
});

test("rejects duplicate IDs and case-insensitive duplicate tags", () => {
  const duplicate = structuredClone(document);
  duplicate.events.push(firstEvent(duplicate.events));
  expect(Result.isFailure(decodeHistoryDocument(duplicate))).toBe(true);
  const tags = structuredClone(document);
  firstEvent(tags.events).tags = ["Builds", "builds"];
  expect(Result.isFailure(decodeHistoryDocument(tags))).toBe(true);
});

test("rejects unknown fields at every object boundary", () => {
  for (const input of [
    { ...document, unexpected: true },
    { ...document, events: [{ ...document.events[0], unexpected: true }] },
    {
      ...document,
      events: [
        { ...document.events[0], images: [{ url: "/image.png", alt: "Image", unexpected: true }] },
      ],
    },
  ])
    expect(Result.isFailure(decodeHistoryDocument(input))).toBe(true);
});

test("rejects unsafe URLs and invalid calendar dates", () => {
  for (const url of [
    // oxlint-disable-next-line eslint/no-script-url -- Exercise rejection of a script URL.
    "javascript:alert(1)",
    "//evil.test/image.png",
    "https://user:pass@example.com/image.png",
  ]) {
    const input = {
      ...document,
      events: [{ ...document.events[0], images: [{ url, alt: "Image" }] }],
    };
    expect(Result.isFailure(decodeHistoryDocument(input))).toBe(true);
  }
  expect(Result.isFailure(decodeHistoryDocument({ ...document, lastUpdated: "2026-02-30" }))).toBe(
    true,
  );
});
