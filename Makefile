HOST ?= 127.0.0.1
PORT ?= 8080

.PHONY: run

run:
	NODE_USE_ENV_PROXY=1 npx --yes vite --host $(HOST) --port $(PORT)
