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
  return String(process.env.OPENAI_BASE_URL || defaultOpenAiBaseUrl).replace(/\/+$/, "");
}

function getOpenAiDefaultModel() {
  return String(process.env.OPENAI_DEFAULT_MODEL || defaultOpenAiModel).trim() || defaultOpenAiModel;
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

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
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

function copyRequestHeaders(request) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(request.headers)) {
    const lowerKey = key.toLowerCase();

    if (lowerKey.startsWith(":") || ["authorization", "origin", "host", "referer"].includes(lowerKey) || hopByHopHeaders.has(lowerKey)) {
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

  headers.set("Authorization", `Bearer ${process.env.OPENAI_API_KEY}`);

  return headers;
}

function isOpenAiProxyRequest(request) {
  return request.url === openAiProxyPrefix || request.url?.startsWith(`${openAiProxyPrefix}/`);
}

function openAiProxyPlugin() {
  return {
    name: "pedagogy-ai-openai-proxy",
    configureServer(server) {
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
              hasApiKey: Boolean(process.env.OPENAI_API_KEY),
            }),
          );
          return;
        }

        if (!isOpenAiProxyRequest(request)) {
          next();
          return;
        }

        if (!process.env.OPENAI_API_KEY) {
          response.statusCode = 500;
          response.setHeader("Content-Type", "application/json");
          response.end(
            JSON.stringify({
              error: "OPENAI_API_KEY_MISSING",
              message: "Missing OPENAI_API_KEY in .env.",
            }),
          );
          return;
        }

        if (request.method === "OPTIONS") {
          response.statusCode = 204;
          response.end();
          return;
        }

        try {
          const requestInit = {
            method: request.method,
            headers: copyRequestHeaders(request),
            redirect: "manual",
          };

          if (request.method !== "GET" && request.method !== "HEAD") {
            requestInit.body = request;
            requestInit.duplex = "half";
          }

          console.log(`${request.method} ${getOpenAiTargetUrl(request.url)}`);
          requestInit.headers.entries().forEach((v) => console.log(`${v[0]}: ${v[1]}`));
          console.log("");
          console.log(requestInit.body.toString());

          const upstreamResponse = await fetch(getOpenAiTargetUrl(request.url), requestInit);

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
          console.error(error);
          response.statusCode = 502;
          response.setHeader("Content-Type", "application/json");
          response.end(
            JSON.stringify({
              error: "OPENAI_PROXY_REQUEST_FAILED",
              message: error instanceof Error ? error.message : "OpenAI proxy request failed.",
            }),
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
