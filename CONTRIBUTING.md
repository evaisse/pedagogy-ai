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

## Adding or Updating Shared Components

Place reusable visualization components under:

```text
public/_components/<component-name>/
```

Use this baseline shape:

```text
<component-name>.js
<component-name>.html
<component-name>.css
assets/
```

Component files should stay framework-free and use standard browser APIs:

- Load the component from pages with `<script type="module" src="../../_components/<component-name>/<component-name>.js"></script>`.
- Use a custom element name that contains a dash, for example `<token-flow>`.
- Use Shadow DOM for component isolation.
- Use `adoptedStyleSheets` for scoped CSS when browser support is acceptable.
- Use attributes for small string configuration.
- Use JavaScript properties for richer structured data.
- Use `CustomEvent` for outgoing interactions.
- Add or update examples in `public/_components/index.html`.

## Quality Checklist

Before committing:

- Run a syntax check for changed JavaScript files:

```bash
node --check public/<topic-slug>/<locale>/script.js
```

For component modules, also check the module entrypoint:

```bash
node --input-type=module --check < public/_components/<component-name>/<component-name>.js
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
