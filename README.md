# klanex MCP server

[![npm](https://img.shields.io/npm/v/klanex-mcp)](https://www.npmjs.com/package/klanex-mcp)

Reliable execution for agent tool calls, as an [MCP](https://modelcontextprotocol.io) server.

[klanex](https://klanexai.com) is an async execution layer between an agent's tool-use intents and real third-party APIs: it schema-gates hallucinated payloads before anything runs, absorbs rate limits and outages with retries/backoff/circuit breakers, encrypts credentials, keeps an audit trail, and reports back via signed webhooks. With this MCP server, an agent submits a call once — klanex makes sure it lands.

Failures come back written *for the model*: every error carries an `llm_hint` telling the agent exactly what to fix (or that klanex is already handling it), so agents self-correct instead of guessing.

## Connect (hosted, recommended)

klanex's MCP server is hosted — no install needed if your client supports HTTP transports:

| Endpoint | Environment | Keys |
|---|---|---|
| `https://api.klanexai.com/mcp` | production | `klx_live_…` |
| `https://api.sandbox.klanexai.com/mcp` | sandbox (free to try) | `klx_test_…` |

Get an API key at [klanexai.com](https://klanexai.com) — sandbox keys are free.

**Claude Code**

```bash
claude mcp add --transport http klanex https://api.klanexai.com/mcp \
  --header "X-API-Key: klx_live_..."
```

**Cursor / Windsurf / VS Code** (`mcp.json`)

```json
{
  "mcpServers": {
    "klanex": {
      "url": "https://api.klanexai.com/mcp",
      "headers": { "X-API-Key": "klx_live_..." }
    }
  }
}
```

`Authorization: Bearer klx_...` works too, for clients that can only set that header.

## Connect (stdio shim)

For clients that only speak stdio (e.g. Claude Desktop), this package proxies stdio to the hosted endpoint:

```json
{
  "mcpServers": {
    "klanex": {
      "command": "npx",
      "args": ["-y", "klanex-mcp"],
      "env": { "KLANEX_API_KEY": "klx_live_..." }
    }
  }
}
```

The shim routes by key prefix — `klx_test_…` keys go to the sandbox automatically. Set `KLANEX_MCP_URL` to override.

## Tools

| Tool | What it does |
|---|---|
| `execute` | Submit an HTTP call for reliable async execution: optional JSON Schema gate, retries/backoff/circuit breakers, idempotency keys, human approval gates, encrypted credentials. `wait_seconds` blocks up to 55s for the terminal result. |
| `get_execution` | Current status, attempts, target response, or classified error for an execution. |
| `list_executions` | The account's executions, filterable by status/time, paginated. |
| `replay_execution` | Re-run a terminal execution byte-exact — outage recovery without re-prompting the LLM. |
| `get_usage` | Plan and current-month usage/quota. |
| `list_connections` | Stored credential connections (token vault) to reference via `connection_id` — so secrets never pass through model context. |

## Why this beats calling APIs directly

- **Hallucinated payloads are rejected before they execute** — pass `payload_schema` and mismatches return synchronously with a correction hint.
- **Transient failures are not the agent's problem** — 429s, timeouts, and 5xxs are retried with backoff behind a circuit breaker; the agent does nothing.
- **A network blip can never double-execute a refund** — `idempotency_key` makes submits safe to retry.
- **Destructive actions can wait for a human** — `requires_approval` pauses execution for an approve/reject decision (API, dashboard, or Slack buttons).
- **Credentials stay out of model context** — store them once as a connection; klanex injects them at execution time.

Full API docs: [api.klanexai.com/docs](https://api.klanexai.com/docs)

## License

MIT
