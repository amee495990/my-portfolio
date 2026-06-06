# Amit Bharti — Portfolio

Single-page UX portfolio for **Amit Bharti**, built from the [Figma design](https://www.figma.com/design/9HrYiwrNLL8TwASFiIsDJG/Portfolio?node-id=3-2614).

## Structure

- `index.html` — page sections (hero, education, work experience, contact)
- `styles.css` — layout, typography, yellow badges, zigzag timeline
- `script.js` — smooth scroll and footer year
- `assets/hero-banner.svg` — Figma hero illustration (647×647)
- `assets/` — education section placeholder illustrations

## Local preview

Open `index.html` in a browser, or run a simple server:

```bash
npx serve .
```

## Deploy to Hostinger

1. In hPanel, open **File Manager** (or connect via FTP).
2. Upload all files to `public_html` (or your domain folder).
3. Ensure `index.html` is at the site root.
4. Visit your domain — no build step required.

## Customize

- Update **LinkedIn** and **Behance** URLs in the header (currently generic links).
- Replace work/project **placeholder** boxes with case-study images or screenshots.
- Export extra illustrations from Figma into `assets/` if desired.
