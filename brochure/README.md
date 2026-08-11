# Felican AI bifold brochure

Print-ready bifold pamphlet. **US Letter portrait (8.5 × 11in)**, folded down the
middle into two 4.25 × 11in panels, printed as two sheets:

| Sheet | Left half | Right half |
|---|---|---|
| Outside | Back panel — "Sound familiar?" checklist | Front cover — 10 ways AI can benefit your business |
| Inside | Services | Process + Book a call |

## Editing

Most copy lives in **`src/content.json`**. `src/brochure.template.html` is
layout; `src/render.mjs` assembles the two together.

**The ten benefit statements are the exception.** They are read straight out of
the `WAYS` array in the site's `index.html`, so the site is the single source of
truth and the two cannot drift. Edit them there, not here. The build fails if
that array cannot be found or parsed, and it also checks the number in
`benefitsTitle` against the number of entries — a heading reading "10 ways" over
thirteen items has happened before.

```bash
node serve.mjs     # live preview on http://localhost:5175, refreshes as you edit
node build.mjs     # writes dist/felican-bifold.{html,pdf} + proof PNGs
```

## Build checks

`build.mjs` fails rather than shipping a broken sheet. Each of these caught a
real defect during the original build:

- **fit** — content stays inside 8.5 × 11in. Overflow is silently clipped by
  `overflow: hidden`, and a too-tall panel drags its neighbour's bottom-anchored
  footer off the page too.
- **containment** — nothing is wider than its container. A fixed-width child next
  to an unbreakable string (the QR beside the email) spills over borders.
- **fold** — both panels are exactly half the sheet. A bare `1fr` grid track is
  `minmax(auto, 1fr)` and can be pushed past 50% by content that will not shrink,
  which moves the printed fold off the paper centre.
- **safe area** — no text, logo or QR sits within 0.25in of the paper edge, where
  a consumer printer cannot print.

The QR is a pre-generated SVG and cannot follow a URL change on its own, so
`assets/qr.json` records what it actually encodes and the build fails if that
drifts from `bookingUrl` in `content.json`. To change the target: regenerate
`assets/qr.svg` and update `assets/qr.json` to match.

## Fonts, and why they are static

`assets/fonts-embedded.css` holds Libre Franklin and IBM Plex Mono as **static,
per-weight** WOFF files, base64-inlined.

They must stay static. Chrome cannot embed a *variable* font instance into a PDF
— it falls back to **Type 3** fonts, which are per-glyph drawing programs rather
than real typefaces. The PDF still looks correct and text still extracts, but
Canva and other editors cannot map Type 3 to an editable font, so every headline
imports as vector shapes. Static faces embed as CID TrueType and stay editable.

For the same reason, every weight used in the design must actually be embedded.
A weight the browser has to synthesise (faux bold) also comes out as Type 3.

## Assets

- `assets/aws.png` — reconstructed from a screenshot: background flood-filled to
  transparent, a Google Lens button removed by mirroring the cloud's opposite
  corner, anti-alias fringe stripped. Raster, unlike the other four badges.
  Replace with AWS's official SVG if you can get it.
- `assets/home-hero.jpg`, `assets/home-team.jpg` — the site photos, re-encoded to
  ~306dpi at panel width. The originals in `public/` are sized for a full-width
  web hero and roughly double the PDF.
- Other badges are read from `public/badges/` — a badge `file` containing a slash
  is brochure-local, a bare name comes from the site's set.

## reference/

`original-from-drive.dc.html` is the untouched design file this started from.
Nothing builds from it; it is kept for comparison only.
