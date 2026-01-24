# MCP Apps Playground

A demo MCP server showcasing interactive UI capabilities using the [MCP Apps Extension (SEP-1865)](https://github.com/modelcontextprotocol/ext-apps).

## Features

- 🔧 **MCP Tools** - `hello_world`, `list_sort`, `flame_graph`, and `feature_flags` tools with Zod schema validation
- 📱 **Apps Extension** - HTML UI via `ui://` resources with `text/html;profile=mcp-app`
- 📦 **structuredContent** - Data passed to UI via `ui/notifications/tool-input`
- 💬 **Bidirectional** - UIs can send messages back to chat via `ui/message`
- 🚀 **Dual Transport** - stdio (default) and HTTP/SSE

## Tools

| Tool | Description | UI Features |
|------|-------------|-------------|
| `hello_world` | Simple greeting demo | Input field, preview, send message to chat |
| `list_sort` | Interactive list reordering | Drag-and-drop, AI-assisted sorting, save order |
| `flame_graph` | Performance profiler visualization | Click-to-zoom call hierarchy, tooltips, analyze hot paths |
| `feature_flags` | Feature flag selector | Multi-select, env tabs (prod/stage/dev), generate SDK code |

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Run with stdio transport (for Claude Desktop, Cursor, VS Code)
npm run dev

# Or run with HTTP transport (for web-based clients)
npm run dev:http

# Test with MCP Inspector
npm run inspector        # stdio
npm run inspector:http   # HTTP (start server first)
```

## Project Structure

```
src/
├── index.ts           # Main server (stdio transport)
├── http-server.ts     # HTTP transport variant
└── ui/
    ├── hello-world.ts # Greeting UI template
    ├── list-sort.ts   # Interactive list sorting UI
    ├── flame-graph.ts # Performance flame graph visualization
    └── feature-flags.ts # Feature flag selector UI
```

## MCP Configuration

### VS Code

Use the included `.vscode/mcp.json`:

```json
{
  "servers": {
    "mcp-apps-playground": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"]
    }
  }
}
```

### Claude Desktop / Cursor

```json
{
  "mcpServers": {
    "mcp-apps-playground": {
      "command": "node",
      "args": ["/path/to/mcp-apps-playground/dist/index.js"]
    }
  }
}
```

## How It Works

### 1. UI Resource Declaration

UI resources are declared with `ui://` scheme and `text/html;profile=mcp-app` MIME type:

```typescript
server.resource(
  "greeting-ui",
  "ui://mcp-apps-playground/greeting",
  {
    description: "Interactive greeting UI panel",
    mimeType: "text/html;profile=mcp-app",
  },
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: "text/html;profile=mcp-app",
      text: HELLO_WORLD_UI(),
    }],
  })
);
```

### 2. Tool with UI Annotation

Tools use `_meta.ui.resourceUri` to link to a UI resource. Data is passed via `structuredContent`:

```typescript
server.registerTool(
  "hello_world",
  {
    description: "Display a Hello World greeting",
    inputSchema: {
      name: z.string().describe("Name to greet"),
    },
    _meta: {
      ui: {
        resourceUri: "ui://mcp-apps-playground/greeting",
        visibility: ["model", "app"],
      },
    },
  },
  async ({ name }) => ({
    content: [{ type: "text", text: `Hello, ${name}!` }],
    structuredContent: { name, greeting: `Hello, ${name}!` },
  })
);
```

### 3. UI Communication

UIs communicate with the MCP host via postMessage JSON-RPC:

```javascript
// Initialize handshake (required)
const result = await sendRequest('ui/initialize', {
  protocolVersion: '2025-06-18',
  capabilities: {},
});
sendNotification('ui/notifications/initialized', {});

// Listen for tool data
window.addEventListener('message', (e) => {
  if (e.data.method === 'ui/notifications/tool-input') {
    const { arguments: args } = e.data.params;
    // Update UI with args
  }
});

// Send message to chat
await sendRequest('ui/message', {
  content: [{ type: 'text', text: 'User selected: ...' }]
});
```

## Resources

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Apps Extension](https://github.com/modelcontextprotocol/ext-apps)
- [MCP Specification](https://spec.modelcontextprotocol.io)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)

## License

MIT
