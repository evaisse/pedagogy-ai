HOST ?= 127.0.0.1
PORT ?= 8080

.PHONY: run

run:
	npx --yes vite --host $(HOST) --port $(PORT)
