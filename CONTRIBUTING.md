# Contributing

Thanks for contributing to Pedagogy AI. This repository is optimized for small, self-contained pedagogical mini-sites.

## Contribution Principles

- Write code, comments, and repository documentation in English.
- Localize visible page copy when the mini-site targets a specific locale.
- Prefer conventions over configuration.
- Keep pages static by default: HTML, CSS, and JavaScript in `public/`.
- Use conventional commits, for example `feat: add caching explainer` or `fix: improve mobile layout`.

## Adding or Updating a Mini-Site

Place each mini-site under:

```text
public/<topic-slug>/<locale>/
```

Use this baseline shape unless there is a clear reason not to:

```text
index.html
styles.css
script.js
```

When adding a new mini-site:

- Link `../../reset.css` before page-specific styles.
- Add or update the card in `public/index.html`.
- Keep assets lightweight and local when possible.
- Make the first screen the actual learning experience, not a marketing page.
- Build interactions that explain state changes, comparisons, sequences, or tradeoffs.
- Respect `prefers-reduced-motion` when using animation.

## Quality Checklist

Before committing:

- Run a syntax check for changed JavaScript files:

```bash
node --check public/<topic-slug>/<locale>/script.js
```

- Serve the site locally:

```bash
python3 -m http.server 8080 --directory public
```

- Check the affected page in a browser at desktop and mobile widths.
- Confirm there is no horizontal overflow.
- Confirm the browser console has no errors.
- Confirm keyboard focus states remain visible for interactive controls.

## Design Guidelines

- Use clear visual roles for state: cached, fresh, warning, neutral, and active.
- Avoid decorative motion that does not teach the concept.
- Keep repeated controls stable in size so interactions do not shift layout.
- Avoid nested cards unless the inner card is a real repeated item or control surface.
- Keep headings and labels concise enough to fit on mobile.

## Git Workflow

- Keep commits focused on one logical change.
- Use conventional commits for every commit.
- Do not commit local OS files, browser artifacts, screenshots, or generated cache files.
- Review `git status` before staging so unrelated work is not included.
