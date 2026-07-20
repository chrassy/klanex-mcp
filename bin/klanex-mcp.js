#!/usr/bin/env node
// klanex-mcp: stdio shim for the hosted klanex MCP server.
//
// klanex's real MCP server is remote (Streamable HTTP at
// https://api.klanexai.com/mcp) — if your client supports HTTP transports
// with headers, connect directly and skip this package. This shim exists for
// clients that only speak stdio: it forwards tools/list and tools/call to
// the hosted endpoint, authenticated with KLANEX_API_KEY.
//
// Environment:
//   KLANEX_API_KEY   required. klx_live_... or klx_test_... (sandbox).
//   KLANEX_MCP_URL   optional. Defaults by key prefix: klx_test_ keys go to
//                    https://api.sandbox.klanexai.com/mcp, everything else
//                    to https://api.klanexai.com/mcp.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createRequire } from "node:module";

const { version } = createRequire(import.meta.url)("../package.json");

const PROD_URL = "https://api.klanexai.com/mcp";
const SANDBOX_URL = "https://api.sandbox.klanexai.com/mcp";

const apiKey = process.env.KLANEX_API_KEY?.trim();
if (!apiKey) {
  console.error(
    "klanex-mcp: KLANEX_API_KEY is not set.\n" +
      "Sign up at https://klanexai.com — sandbox keys (klx_test_...) are free.",
  );
  process.exit(1);
}

const url =
  process.env.KLANEX_MCP_URL?.trim() ||
  (apiKey.startsWith("klx_test_") ? SANDBOX_URL : PROD_URL);

const remote = new Client({ name: "klanex-mcp-shim", version });
const local = new Server(
  { name: "klanex", version, websiteUrl: "https://klanexai.com" },
  { capabilities: { tools: {} } },
);

local.setRequestHandler(ListToolsRequestSchema, async () => {
  return remote.listTools();
});

local.setRequestHandler(CallToolRequestSchema, async (req) => {
  return remote.callTool(req.params);
});

try {
  await remote.connect(
    new StreamableHTTPClientTransport(new URL(url), {
      requestInit: { headers: { "X-API-Key": apiKey } },
    }),
  );
} catch (err) {
  console.error(`klanex-mcp: could not reach ${url}: ${err.message ?? err}`);
  process.exit(1);
}

// Either side going away should end the process so the client can restart us.
remote.onclose = () => process.exit(0);
local.onclose = () => process.exit(0);

await local.connect(new StdioServerTransport());
