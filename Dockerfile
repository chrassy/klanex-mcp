# Container image for MCP registries (e.g. Glama) that introspect a server by
# starting it and issuing initialize + tools/list. Those calls need no
# credentials on klanex — only actual tool *calls* do — so a placeholder
# sandbox key is enough to start and pass introspection. Provide a real
# KLANEX_API_KEY at runtime to make live calls.
FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY bin ./bin

# klx_test_ prefix routes to the sandbox endpoint; overridable at runtime.
ENV KLANEX_API_KEY=klx_test_placeholder

ENTRYPOINT ["node", "bin/klanex-mcp.js"]
