---
name: pedagogy-web-components
description: "Create or update reusable vanilla Web Components for this static pedagogy-ai repository. Use when Codex needs to extract shared visualization UI into public/_components, add a component folder with separate JS/HTML/CSS, integrate a component into a mini-site, update the component kitchen sink, or explain the repository convention for framework-free component reuse."
---

# Pedagogy Web Components

## Purpose

Use this skill to mutualize repeated frontend visualization code in `public/_components/` while keeping mini-sites plain HTML, CSS, and JavaScript.

Prefer a shared Web Component when the same UI pattern appears in more than one mini-site, when a visualization has a clear standalone API, or when a page-specific block is likely to be reused later.

Keep one-off narrative layout, page-specific copy, and section choreography inside the mini-site.

## Repository Convention

Create one folder per component:

```text
public/_components/<component-name>/
  <component-name>.js
  <component-name>.html
  <component-name>.css
  assets/
```

Use `assets/` only when the component owns local images, icons, data files, or other static files.

Use kebab-case for component folders and custom element names:

```html
<source-list></source-list>
<token-flow></token-flow>
```

Every custom element name must contain a dash.

## Component Entrypoint

Use the JavaScript module as the only import required by pages:

```html
<script type="module" src="../../_components/source-list/source-list.js"></script>
<source-list></source-list>
```

Do not depend on a build step, package manager, framework runtime, JSX transform, or non-standard HTML imports.

The module should load sibling HTML and CSS using `import.meta.url`:

```js
const componentUrl = new URL(".", import.meta.url);
const templateUrl = new URL("./source-list.html", componentUrl);
const stylesheetUrl = new URL("./source-list.css", componentUrl);
```

Use top-level `await` in component modules when fetching the template and stylesheet. This repository serves files over HTTP, so relative `fetch()` calls are acceptable.

## Styling

Use Shadow DOM for isolation and `adoptedStyleSheets` for scoped CSS:

```js
const stylesheet = new CSSStyleSheet();
await stylesheet.replace(stylesheetText);

const shadow = this.attachShadow({ mode: "open" });
shadow.adoptedStyleSheets = [stylesheet];
```

Expose theme hooks through CSS custom properties on `:host`:

```css
:host {
  --source-list-accent: #00856f;
}
```

Avoid leaking component internals into page CSS. Page CSS may set host-level layout only:

```css
source-list {
  display: block;
  max-width: 1100px;
}
```

If useful, add `part` attributes for stable styling hooks, but prefer CSS variables for simple theming.

## HTML and Fallbacks

Keep component markup in `<component-name>.html`.

Prefer declarative light DOM when content should remain readable without JavaScript:

```html
<source-list title="Sources consulted">
  <a href="https://example.com" data-source-description="Primary reference.">Example</a>
</source-list>
```

The component can read the light DOM and render an enhanced Shadow DOM view. This keeps source content visible if the module fails.

For purely generated visualizations, expose a property-based API instead:

```js
flow.data = {
  tokens: [{ label: "Instructions", state: "cached", meta: "cache hit" }],
};
```

## API Design

Use attributes for short string configuration:

```html
<token-flow kicker="Agent turn" title="Warm cache"></token-flow>
```

Use JavaScript properties for structured data:

```js
sourceList.sources = [
  {
    href: "https://example.com",
    label: "Example source",
    description: "Reference used by the explanation.",
    meta: "Official docs",
  },
];
```

Use `CustomEvent` for outgoing interactions:

```js
this.dispatchEvent(
  new CustomEvent("token-flow-select", {
    bubbles: true,
    composed: true,
    detail: { index, token },
  }),
);
```

Events should be named `<component-name>-<action>`.

## Implementation Workflow

1. Inspect the target mini-site and identify the smallest reusable UI behavior.
2. Create the component folder under `public/_components/<component-name>/`.
3. Write the HTML template, then the scoped CSS, then the module entrypoint.
4. Keep visible localized copy in the consuming page when practical.
5. Add a kitchen sink example in `public/_components/index.html`.
6. Update `public/_components/index.js` only if the example needs interactive setup.
7. Integrate the component in the mini-site with a `type="module"` script in the page `<head>`.
8. Keep a no-JavaScript fallback when the content is important.

## Verification

Run syntax checks for changed modules:

```bash
node --input-type=module --check < public/_components/<component-name>/<component-name>.js
node --input-type=module --check < public/_components/index.js
```

Serve `public/` over HTTP before testing component templates and styles:

```bash
python3 -m http.server 4173 --directory public
```

Check:

- The component assets load over HTTP.
- The custom element creates a Shadow DOM.
- The kitchen sink example renders.
- The consuming mini-site renders the component.
- The browser console has no component errors.
- Keyboard focus remains visible for interactive controls.
- Mobile width does not introduce horizontal overflow.

## Do Not

- Do not introduce React, Vue, Lit, Stencil, Svelte, bundlers, or npm dependencies for shared components.
- Do not use obsolete HTML Imports or non-standard `<script type="component">` patterns.
- Do not put reusable component styles in page-level CSS except host layout and fallback styles.
- Do not encode localized page copy permanently inside a component if the component will be reused across locales.
- Do not move page-specific storytelling structure into a shared component just to reduce file size.
