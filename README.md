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

- `index.html` — landing page with step overview
- `step-1.html` … `step-6.html` — onboarding steps
- `style.css` — shared styles
- `assets/slides/` — slide imagery (WebP + PNG variations)
- `*.mp4` — video assets embedded throughout the steps
