import { expect, test } from "bun:test";
import { Result } from "effect";
import document from "./community-history.json";
import { decodeHistoryDocument } from "./schema";

test("the published history validates and trims text", () => {
  const input = structuredClone(document);
  input.events[0].title = "  Test title  ";
  const result = decodeHistoryDocument(input);
  expect(Result.isSuccess(result)).toBe(true);
  if (Result.isSuccess(result)) expect(result.success.events[0].title).toBe("Test title");
});

test("rejects duplicate IDs and case-insensitive duplicate tags", () => {
  const duplicate = structuredClone(document);
  duplicate.events.push(duplicate.events[0]);
  expect(Result.isFailure(decodeHistoryDocument(duplicate))).toBe(true);
  const tags = structuredClone(document);
  tags.events[0].tags = ["Builds", "builds"];
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
