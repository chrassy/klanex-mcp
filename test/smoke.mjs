// End-to-end smoke test: spawns the shim over stdio (the way a real MCP
// client would) and drives it against the live klanex endpoint selected by
// KLANEX_API_KEY. Requires KLANEX_API_KEY in the environment.
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

if (!process.env.KLANEX_API_KEY) {
  console.error("smoke: set KLANEX_API_KEY (a klx_test_... sandbox key)");
  process.exit(1);
}

const client = new Client({ name: "smoke", version: "0.0.1" });
await client.connect(
  new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL("../bin/klanex-mcp.js", import.meta.url))],
    env: { ...process.env },
  }),
);

const { tools } = await client.listTools();
const names = tools.map((t) => t.name).sort();
console.log("tools:", names.join(", "));
const expected = [
  "execute",
  "get_execution",
  "get_usage",
  "list_connections",
  "list_executions",
  "replay_execution",
];
if (JSON.stringify(names) !== JSON.stringify(expected)) {
  console.error("smoke: unexpected tool list");
  process.exit(1);
}

const usage = await client.callTool({ name: "get_usage", arguments: {} });
if (usage.isError) {
  console.error("smoke: get_usage failed:", usage.content?.[0]?.text);
  process.exit(1);
}
console.log("get_usage:", usage.content[0].text.trim());

await client.close();
console.log("smoke: OK");
process.exit(0);
