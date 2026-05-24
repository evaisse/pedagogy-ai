import fs from "node:fs";
import { Readable } from "node:stream";

const root = "public";
const openAiProxyPrefix = "/api/v1";
const openAiSettingsPath = "/__openai-settings";
const defaultOpenAiBaseUrl = "https://api.openai.com/v1";
const defaultOpenAiModel = "gpt-5.5";
const hopByHopHeaders = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

loadLocalEnv();

function getServerPort() {
  return Number(process.env.VITE_PORT || process.env.PORT || 8080);
}

function getOpenAiBaseUrl() {
  return String(process.env.AZURE_OPENAI_API_ENDPOINT_COMPATIBLE || defaultOpenAiBaseUrl).replace(/\/+$/, "");
}

function getOpenAiDefaultModel() {
  return String(process.env.OPENAI_DEFAULT_MODEL || defaultOpenAiModel).trim() || defaultOpenAiModel;
}

function getOpenAiApiKey() {
  return process.env.AZURE_OPENAI_API_KEY || "";
}

function shouldUseAzureApiKeyHeader() {
  try {
    const baseUrl = new URL(getOpenAiBaseUrl());

    return baseUrl.hostname.endsWith(".openai.azure.com") || baseUrl.pathname.includes("/openai/deployments/");
  } catch {
    return false;
  }
}

function loadLocalEnv(envFile = ".env") {

  if (!fs.existsSync(envFile)) return;

  for (const rawLine of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    const separatorIndex = line.indexOf("=");

    if (!line || line.startsWith("#") || separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = parseEnvValue(line.slice(separatorIndex + 1).trim());
  }
}

function parseEnvValue(value) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value.replace(/\s+#.*$/, "");
}

function getOpenAiTargetUrl(requestUrl) {
  const url = new URL(requestUrl, "http://localhost");
  const upstreamPath = url.pathname.slice(openAiProxyPrefix.length);

  return new URL(`${getOpenAiBaseUrl()}${upstreamPath}${url.search}`);
}

function formatDuration(startedAt) {
  const elapsedMs = performance.now() - startedAt;

  return `${Math.round(elapsedMs)}ms`;
}

function formatErrorMessage(error) {
  return error instanceof Error ? error.message : "OpenAI proxy request failed.";
}

function formatUrlForLog(url) {
  const loggedUrl = new URL(url);

  for (const key of loggedUrl.searchParams.keys()) {
    const lowerKey = key.toLowerCase();

    if (lowerKey.includes("key") || lowerKey.includes("token") || lowerKey.includes("secret")) {
      loggedUrl.searchParams.set(key, "<redacted>");
    }
  }

  return loggedUrl.toString();
}

function copyRequestHeaders(request) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(request.headers)) {
    const lowerKey = key.toLowerCase();

    if (
      lowerKey.startsWith(":") ||
      ["api-key", "authorization", "origin", "host", "referer"].includes(lowerKey) ||
      hopByHopHeaders.has(lowerKey)
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      headers.set(key, value.join(", "));
      continue;
    }

    if (typeof value === "string") {
      headers.set(key, value);
    }
  }

  if (shouldUseAzureApiKeyHeader()) {
    headers.set("api-key", getOpenAiApiKey());
  } else {
    headers.set("Authorization", `Bearer ${getOpenAiApiKey()}`);
  }

  return headers;
}

function isOpenAiProxyRequest(request) {
  return request.url === openAiProxyPrefix || request.url?.startsWith(`${openAiProxyPrefix}/`);
}

function openAiProxyPlugin() {
  return {
    name: "pedagogy-ai-openai-proxy",
    configureServer(server) {
      const logger = server.config.logger;

      server.middlewares.use(async (request, response, next) => {
        if (request.url === openAiSettingsPath) {
          response.statusCode = 200;
          response.setHeader("Content-Type", "application/json");
          response.setHeader("Cache-Control", "no-store");
          response.end(
            JSON.stringify({
              endpoint: openAiProxyPrefix,
              baseUrl: getOpenAiBaseUrl(),
              model: getOpenAiDefaultModel(),
              hasApiKey: Boolean(getOpenAiApiKey()),
              authHeader: shouldUseAzureApiKeyHeader() ? "api-key" : "Authorization",
            }),
          );
          return;
        }

        if (!isOpenAiProxyRequest(request)) {
          next();
          return;
        }

        const startedAt = performance.now();
        const method = request.method || "GET";
        const requestUrl = request.url || openAiProxyPrefix;

        if (!getOpenAiApiKey()) {
          response.statusCode = 500;
          response.setHeader("Content-Type", "application/json");
          response.end(
            JSON.stringify({
              error: "AZURE_OPENAI_API_KEY_MISSING",
              message: "Missing AZURE_OPENAI_API_KEY in .env.",
            }),
          );
          logger.warn(
            `[openai-proxy] ${method} ${requestUrl} <- 500 AZURE_OPENAI_API_KEY_MISSING ` +
              `(${formatDuration(startedAt)})`,
          );
          return;
        }

        if (method === "OPTIONS") {
          response.statusCode = 204;
          response.end();
          logger.info(
            `[openai-proxy] ${method} ${requestUrl} <- 204 preflight (${formatDuration(startedAt)})`,
          );
          return;
        }

        try {
          const targetUrl = getOpenAiTargetUrl(requestUrl);
          logger.info(`[openai-proxy] ${method} ${requestUrl} -> ${formatUrlForLog(targetUrl)}`);

          const requestInit = {
            method,
            headers: copyRequestHeaders(request),
            redirect: "manual",
          };

          if (method !== "GET" && method !== "HEAD") {
            requestInit.body = request;
            requestInit.duplex = "half";
          }

          const upstreamResponse = await fetch(targetUrl, requestInit);
          logger.info(
            `[openai-proxy] ${method} ${requestUrl} <- ${upstreamResponse.status} ` +
              `${upstreamResponse.statusText} (${formatDuration(startedAt)})`,
          );

          response.statusCode = upstreamResponse.status;
          response.statusMessage = upstreamResponse.statusText;

          upstreamResponse.headers.forEach((value, key) => {
            if (!hopByHopHeaders.has(key.toLowerCase())) {
              response.setHeader(key, value);
            }
          });

          if (!upstreamResponse.body) {
            response.end();
            return;
          }

          Readable.fromWeb(upstreamResponse.body).pipe(response);
        } catch (error) {
          response.statusCode = 502;
          response.setHeader("Content-Type", "application/json");
          response.end(
            JSON.stringify({
              error: "OPENAI_PROXY_REQUEST_FAILED",
              message: error instanceof Error ? error.message : "OpenAI proxy request failed.",
            }),
          );
          logger.error(
            `[openai-proxy] ${method} ${requestUrl} <- 502 ${formatErrorMessage(error)} ` +
              `(${formatDuration(startedAt)})`,
          );
        }
      });
    },
  };
}

export default {
  root,
  publicDir: false,
  plugins: [openAiProxyPlugin()],
  server: {
    host: process.env.VITE_HOST || "127.0.0.1",
    port: getServerPort(),
    strictPort: true,
  },
};
