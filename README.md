# Pedagogy AI

Static pedagogical mini-sites about software engineering and AI concepts.

The repository intentionally keeps the runtime simple: each mini-site is plain HTML, CSS, and JavaScript under `public/`. There is no build step, package manager, or framework requirement for the current pages.
Local development tasks are exposed through `make` and use `npx` for the Vite dev server.

## Available Mini-Sites

- `/throttle-debounce/en/` — interactive demo explaining throttle and debounce event flows.
- `/llm-token-caching/fr/` — French vertical explainer about LLM prompt caching for coding agents.
- `/agent-harness/fr/` — French vertical explainer about coding-agent harnesses.
- `/agent-protocols/fr/` — French vertical explainer comparing Agent Client Protocol, Agent Host Protocol, and agent-to-agent ACP.
- `/a2ui/fr/` — French vertical explainer about A2UI with a local A2UI renderer and OpenAI-compatible live demo.

The public index is available at `/` when serving the `public/` directory.

## Project Structure

```text
public/
  index.html                    # Mini-site index
  reset.css                     # Shared baseline CSS
  _components/                  # Reusable vanilla Web Components
  throttle-debounce/en/         # English throttle/debounce demo
  llm-token-caching/fr/         # French LLM token caching explainer
  agent-harness/fr/             # French coding-agent harness explainer
  agent-protocols/fr/           # French ACP/AHP explainer
  a2ui/fr/                      # French A2UI explainer and live renderer demo
docs/prd/                       # Planning documents
skills/                         # Repository-local Codex skills
Makefile                        # Local development tasks
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

## Repository Skills

Repository-local Codex skills live under `skills/`. Use `skills/pedagogy-web-components/SKILL.md` when adding or
updating reusable vanilla Web Components for the static mini-sites.

## Run Locally

Copy `.env.dist` to `.env`, or create a local `.env` file when you want to use the OpenAI-backed demos:

```bash
AZURE_OPENAI_API_KEY=sk-...
AZURE_OPENAI_API_ENDPOINT_COMPATIBLE=https://your-openai-compatible-endpoint.example/api/v1
AZURE_OPENAI_API_VERSION=2024-10-21
OPENAI_DEFAULT_MODEL=gpt-5.5
```

Then serve the `public/` directory over HTTP:

```bash
make run
```

Open:

```text
http://127.0.0.1:8080/
```

The port can be overridden per command:

```bash
make run PORT=8081
```

### Proxy OpenAI

The Vite dev server includes a same-origin OpenAI proxy:

```text
/api/v1/<path> -> $AZURE_OPENAI_API_ENDPOINT_COMPATIBLE/<path>
```

For example:

```text
/api/v1/chat/completions
```

forwards to the configured base URL. With `AZURE_OPENAI_API_ENDPOINT_COMPATIBLE=https://api.openai.com/v1`, it resolves to:

```text
https://api.openai.com/v1/chat/completions
```

The browser calls localhost without an API key. The dev server reads `.env`, injects
`Authorization: Bearer $AZURE_OPENAI_API_KEY`, and exposes only the non-secret endpoint metadata to the browser through
`/__openai-settings`.

For Azure OpenAI endpoints, the dev server detects `*.openai.azure.com` or `/openai/deployments/` in
`AZURE_OPENAI_API_ENDPOINT_COMPATIBLE`, sends the key as `api-key: $AZURE_OPENAI_API_KEY` instead of a bearer token, and
adds `api-version=$AZURE_OPENAI_API_VERSION` when the endpoint uses `/openai/deployments/...`.

Keep the proxy bound to `127.0.0.1`; it is a development tool, not an internet-facing proxy.

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
