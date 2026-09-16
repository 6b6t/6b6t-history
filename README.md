# 6b6t Community History

Help document the events, builds, updates, and people that shaped 6b6t.

**Edit [community-history.json](community-history.json)** and open a pull request. This single file contains all stories, paragraphs, tags, image links, YouTube links, and sources. Its editing guide travels with it when downloaded or shared.

## Contribute

1. Fork this repository and edit `community-history.json` using GitHub's editor or a text editor.
2. Expand an existing story or copy an event to add a new one. Keep existing IDs stable.
3. Add accurate descriptions and supporting sources. Include image credits and alt text. Use hosted HTTPS image URLs and ordinary YouTube links, never iframe code.
4. Update `lastUpdated`, then submit a pull request describing the changes and evidence.

Validation runs automatically on pull requests. Maintainers review historical accuracy, media permissions, and links before merging. Do not include private information or unverified accusations. Only submit text and media you have permission to share.

See [CONTRIBUTING.md](CONTRIBUTING.md) for field descriptions and examples. Existing text was migrated from the website and has not been independently researched.

## Upload images using GitHub

You do not need a separate image host. Upload pictures to your fork and include them in the same pull request as your story:

1. Open your fork on GitHub. Open the `images/` folder, then choose **Add file → Upload files**.
2. If `images/` does not exist yet, choose **Add file → Create new file**, name it `images/README.md`, add a short description, and commit it. You can then open that folder and upload your pictures.
3. Use descriptive filenames such as `christmas-base-2024.jpg`. Prefer lowercase names with hyphens and no spaces. Compress large screenshots before uploading; JPG, PNG, and WebP are suitable formats.
4. Edit your story's `images` array in `community-history.json`, using the example below. Replace the filename, description, and credits with your own.
5. Submit **the uploaded images and JSON edits together in one pull request** to this repository.

```json
"images": [
  {
    "url": "https://raw.githubusercontent.com/6b6t/6b6t-history/main/images/christmas-base-2024.jpg",
    "alt": "A snow-covered Christmas base with a decorated tree",
    "caption": "Built by PlayerName. Screenshot by PhotographerName."
  }
]
```

Use the official `6b6t/6b6t-history/main` URL shown above, even while editing your fork. It will start working **after your pull request is merged**. The image will appear on the website after its next automatic update. Filenames and capitalization must match exactly. A GitHub file-view link containing `/blob/` is not a direct image URL; use `raw.githubusercontent.com` as shown.

For multiple images, add more objects to the array, separated by commas. `alt` should describe what is visible; use `caption` for context and credits. Only upload images you have permission to share, and remove private information from screenshots first. Existing public HTTPS image links also work. Videos should remain ordinary YouTube links in the `videos` array; do not upload video files here.

## Local validation

Install Bun, then run:

```sh
bun install --frozen-lockfile
bun run check
```

## Publish to the website

The website automatically fetches approved content from `main` every Monday at 03:17 UTC (09:17 Bangladesh time), and on every normal production deployment. GitHub may delay scheduled runs. Validation must pass before deployment; a failed fetch or validation leaves the running website unchanged. Maintainers can also import locally:

```sh
bun run history:fetch
bun run ci
```

Review the downloaded content diff, commit, and deploy through the normal website workflow. The importer validates the complete download before replacing the website's checked-in copy. The website continues serving its last imported content if this repository is unavailable.

`schema.ts` mirrors the website's history validation contract. Keep both schemas aligned when changing the file format; contributors normally only edit the JSON file.
