# Pedagogy AI

Static pedagogical mini-sites about software engineering and AI concepts.

The repository intentionally keeps the runtime simple: each mini-site is plain HTML, CSS, and JavaScript under `public/`. There is no build step, package manager, or framework requirement for the current pages.

## Available Mini-Sites

- `/throttle-debounce/en/` — interactive demo explaining throttle and debounce event flows.
- `/llm-token-caching/fr/` — French vertical explainer about LLM prompt caching for coding agents.
- `/agent-protocols/fr/` — French vertical explainer comparing Agent Client Protocol, Agent Host Protocol, and agent-to-agent ACP.

The public index is available at `/` when serving the `public/` directory.

## Project Structure

```text
public/
  index.html                    # Mini-site index
  reset.css                     # Shared baseline CSS
  _components/                  # Reusable vanilla Web Components
  throttle-debounce/en/         # English throttle/debounce demo
  llm-token-caching/fr/         # French LLM token caching explainer
  agent-protocols/fr/           # French ACP/AHP explainer
docs/prd/                       # Planning documents
```

## Reusable Components

Shared visualization components live under `public/_components/`. They are plain Web Components loaded with standard
module scripts, with no build step:

```html
<script type="module" src="../../_components/token-flow/token-flow.js"></script>
<token-flow></token-flow>
```

Each component should keep its files in one folder:

```text
public/_components/<component-name>/
  <component-name>.js
  <component-name>.html
  <component-name>.css
  assets/
```

Use `public/_components/index.html` as the component kitchen sink when adding or changing shared components.

## Run Locally

Serve the `public/` directory with any static file server. For example:

```bash
python3 -m http.server 8080 --directory public
```

Then open:

```text
http://127.0.0.1:8080/
```

## Development Notes

- Keep mini-sites framework-free unless the concept clearly requires a library.
- Use `public/reset.css` before page-specific styles.
- Keep visible page copy localized for the target audience.
- Keep code, comments, and repository documentation in English.
- Prefer reusable Web Components in `public/_components/` for shared visualizations.
- Prefer small, focused interactions that teach a concrete mechanism.
- Verify pages on desktop and mobile widths before committing.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
