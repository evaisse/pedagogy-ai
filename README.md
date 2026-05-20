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
  throttle-debounce/en/         # English throttle/debounce demo
  llm-token-caching/fr/         # French LLM token caching explainer
  agent-protocols/fr/           # French ACP/AHP explainer
docs/prd/                       # Planning documents
```

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
- Prefer small, focused interactions that teach a concrete mechanism.
- Verify pages on desktop and mobile widths before committing.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
