# Community history editing

Share **`community-history.json`** with the history team. It is the complete editable history file; nobody needs to edit React or supply iframe code. Its `editingGuide` also travels with the file. After deployment, a copy is available at `/community-history.json`.

## Writing stories

- Keep `version` at `1` and set `lastUpdated` to `YYYY-MM-DD`.
- Each object in `events` is a story. Copy an existing object to add one. File order is display order, including approximate dates and ongoing stories.
- Keep existing `id` values stable so shared links continue working. New IDs must be unique lowercase words separated by hyphens.
- `date` is a readable date or range; `year` is a four-digit year or `Ongoing`.
- `description` is an array of paragraphs. The first paragraph is the preview; further paragraphs appear under “Read the full story.” There is no need to write HTML or escape markup.
- `tags` contains at least one category, such as `Builds`, `Community`, `Events`, `Milestones`, or `Updates`. New tags appear in the filter automatically. Use consistent spelling and capitalization.
- `images` contains objects with `url`, `alt`, and an optional `caption`. Use a stable public HTTPS image link (gallery links work), or an existing `/assets/...` path. The image must already be hosted; a JSON file cannot carry an unpublished image file. Include credits in the caption and describe the image in `alt`.
- `videos` contains ordinary YouTube links, including watch, youtu.be, shorts, or live links. They appear as embedded players directly on the story, without expanding it. Other video hosts and raw embed HTML are not accepted. Embedding availability still depends on the video owner's YouTube settings.
- `sources` contains HTTPS links to supporting posts or documentation. Use empty arrays for media or sources that are not available. Do not invent historical details or use unrelated media to fill a field.

Example media fields (replace the image URL with the real hosted image):

```json
{
  "description": ["A short introduction.", "A longer account of what happened.", "More context, participants and the result."],
  "images": [{"url": "https://example.org/history/photo.jpg", "alt": "Describe the actual image", "caption": "Image credit and context"}],
  "videos": ["https://youtu.be/XSL6s1TKKpc"],
  "sources": []
}
```

## Weekly import (run in the website repository)

```sh
bun run history:fetch
bun run ci
```

The import validates the entire file before replacing the checked-in copy. Invalid YouTube links, missing alt text, duplicate IDs, invalid dates, unknown fields, and malformed JSON fail with field-specific errors. Review the content diff, then commit and deploy through the normal workflow. Importing does not publish anything by itself.

`bun run history:check` validates the current file; it also runs in CI. Existing historical prose has been migrated, not independently researched. The community team can now expand every event and supply its archival images and videos. Community story text remains as authored; the surrounding controls use the website's translation pipeline.
