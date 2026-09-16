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

## Local validation

Install Bun, then run:

```sh
bun install --frozen-lockfile
bun run check
```

## Publish to the website

Merging here approves the content; it does not deploy the website. Weekly, a website maintainer runs these commands in `6b6t-website`:

```sh
bun run history:fetch
bun run ci
```

Review the downloaded content diff, commit, and deploy through the normal website workflow. The importer validates the complete download before replacing the website's checked-in copy. The website continues serving its last imported content if this repository is unavailable.

`schema.ts` mirrors the website's history validation contract. Keep both schemas aligned when changing the file format; contributors normally only edit the JSON file.
