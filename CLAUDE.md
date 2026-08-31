# CLAUDE.md — context for Claude Code working in this repo

This is the **ATMP internal client onboarding portal**
(`internal.atmediapartners.com`). Plain static HTML/CSS/JS — **no build
step, no framework, no backend**. Hosted on Render as a Static Site,
auto-deploys on every push to `main` (~2–3 minute rebuild).

The editor is **CreativeElisha**, a non-developer. She works on copy,
page structure, screenshots and videos.

## What's here

The site was rebuilt in August 2026. The **three-page v2 flow is now the
live site at the root**, and the old seven-step portal is kept intact
under `v1/`.

```
index.html                    Page 1 — Welcome
page-2-onboarding-call.html   Page 2 — Before your onboarding call
page-3-launch-call.html       Page 3 — Before your launch call
style.css                     shared styles for the three pages
support.js                    progress tracking, accordions, video toggles
assets/                       images, slides, videos — shared by BOTH versions
v1/                           the previous seven-step portal (still live)
backups/                      dated snapshots of older step pages
```

`v1/` is a **complete working copy** of the old site, reachable at
`internal.atmediapartners.com/v1/`. It is there so Aaron can compare, and
so a rollback is quick. Don't delete it without asking Bryan.

## Rolling back to the old portal

If Aaron asks for the old seven-step site back at the root, there are two
options depending on how permanent it needs to be.

**Quick, no code change** — send people to
`internal.atmediapartners.com/v1/`. It's already live and always current.

**Proper swap back** — revert the commit that promoted v2:

```bash
git log --oneline --grep="Promote onboarding v2"   # find the commit
git revert <that-commit>
git push
```

The tag `v1-portal` marks the last commit where the old portal was served
at the root, so `git show v1-portal` always shows that exact state.

## Working on the pages

Normal edits — copy, headings, steps, screenshots, reordering — are fine
to make directly. Read the page first, make the change, check it renders,
commit and push.

**Preview locally before pushing** (there's no build, so this is just a
file server):

```bash
python3 -m http.server 8899
```

Then open `http://localhost:8899/` (v2) or `http://localhost:8899/v1/`.

Relative paths matter: pages at the root use `assets/…`, pages inside
`v1/` use `../assets/…`. If you move a page between those levels, fix its
asset paths or every image and video 404s.

## Videos — read this before adding any

Videos live in `assets/videos/` and are referenced with a plain
`<video>` tag. Three things are non-negotiable:

1. **H.264, never HEVC/H.265.** Mac screen recordings default to HEVC,
   which **only Safari plays** — Chrome on Windows and Firefox show a
   black box. Most clients are on Chrome. Check before committing:

   ```bash
   ffprobe -v error -select_streams v:0 -show_entries stream=codec_name \
     -of default=nw=1:nk=1 assets/videos/yourfile.mp4
   ```

   It must print `h264`. If it prints `hevc`, re-export it.

2. **Faststart** — the `moov` atom must sit before `mdat`, or the browser
   downloads the whole file before the first frame appears. To fix an
   existing file without re-encoding:

   ```bash
   ffmpeg -i in.mov -c copy -movflags +faststart -f mp4 out.mp4
   ```

3. **Under 100 MB per file.** GitHub hard-rejects anything larger, and
   warns above 50 MB. Aim for 15–25 MB — screen recordings compress well.
   Git stores every version of a binary forever, so a re-uploaded video
   adds its full size to the repo permanently rather than replacing the
   old bytes.

## Placeholders still open

Three video slots are stubbed and waiting on footage:

- `page-3` · CRM 101 — *Tagging lost reasons (and why it matters)*
- `page-3` · CRM 101 — *Adding notes and follow-up tasks*
- `page-3` · `[PERFORMANCE DASHBOARD VIDEO]`

The first two currently show placeholder Loom embeds rather than a
"coming soon" card, so they look filled but aren't.

## The phone/desktop toggle

Some training topics offer a 📱 Phone / 🖥️ Desktop switch. The element
carries `data-phone` and `data-desktop` attributes and `support.js` swaps
the source between them. It handles both Loom iframes and local `<video>`
elements — note that a `<video>` needs `load()` called after its `src`
changes, and seeks with `#t=12` where Loom uses `?t=12s`. If you add a
topic with only one recording, set `data-desktop` alone.

## Check with Bryan first

- Deleting `v1/` or `backups/`
- Anything that changes how the site deploys
- Adding a dependency or a build step — this site is deliberately plain
  static files, and Render is configured to serve them as-is
- Large binary additions beyond the videos described above

## Who's who

- **Bryan (Tech VA, `gummatron1007`)** — repo owner, full access.
- **CreativeElisha** — the editor. Collaborator with Write access.
- **Render service** — `atmp-onboarding-portal`, serving
  `internal.atmediapartners.com` from `main`.
