# ATMP Onboarding Portal

Static client onboarding walkthrough for AT Media Partners.

## Deployment

- **Host:** Render (Static Site)
- **Domain:** https://internal.atmediapartners.com
- **Auto-deploys:** on every push to `main`

## Local preview

```bash
# Any static file server will do, e.g.:
npx serve .
```

Then open http://localhost:3000.

## Structure

The site was rebuilt in August 2026. The three-page **v2** flow is served
at the root; the previous seven-step portal is kept under `v1/`.

- `index.html` — Page 1, Welcome
- `page-2-onboarding-call.html` — Page 2, before the onboarding call
- `page-3-launch-call.html` — Page 3, before the launch call
- `style.css` / `support.js` — shared styles and page behaviour
- `assets/` — images, slides and videos, shared by both versions
- `v1/` — the previous seven-step portal, still live at `/v1/`
- `backups/` — dated snapshots of older step pages

## Rolling back to the seven-step portal

The old site stays live at https://internal.atmediapartners.com/v1/, so
the quickest rollback is simply to point people there.

To put it back at the root, revert the commit that promoted v2:

```bash
git log --oneline --grep="Promote onboarding v2"
git revert <that-commit>
git push
```

The `v1-portal` tag marks the last commit where the seven-step portal was
served at the root — `git show v1-portal` always shows that exact state.

## Videos

Videos live in `assets/videos/` and must be **H.264** (not HEVC/H.265,
which only Safari plays), faststart-enabled, and under 100 MB. See
`CLAUDE.md` for the commands to check and fix an existing file.
