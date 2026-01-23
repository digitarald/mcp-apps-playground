# MCP UI Playground

A hello world MCP server demonstrating UI capabilities using the [MCP Apps Extension (SEP-1865)](https://github.com/modelcontextprotocol/ext-apps).

## Features

- 🔧 **MCP Tools** - `hello_world` tool with Zod schema validation
- 📱 **Apps Extension** - HTML UI via `ui://` resources with `text/html;profile=mcp-app`
- 📦 **structuredContent** - Data passed to UI templates
- 🚀 **Dual Transport** - stdio (default) and HTTP/SSE

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
    └── hello-world.ts # HTML UI template
```

## MCP Configuration

### VS Code

Use the included `.vscode/mcp.json`:

```json
{
  "servers": {
    "mcp-ui-playground": {
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
    "mcp-ui-playground": {
      "command": "node",
      "args": ["/path/to/mcp-ui-playground/dist/index.js"]
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
  "ui://mcp-ui-playground/greeting.html",
  {
    description: "Interactive greeting UI panel",
    mimeType: "text/html;profile=mcp-app",
  },
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: "text/html;profile=mcp-app",
      text: HELLO_WORLD_UI(name),
    }],
  })
);
```

### 2. Tool with UI Annotation

Tools return `structuredContent` and `_meta.outputTemplate` to link to UI:

```typescript
server.tool("hello_world", "Greeting tool", schema, async ({ name }) => ({
  content: [
    { type: "text", text: `Hello, ${name}!` },
    {
      type: "resource",
      resource: {
        uri: "ui://mcp-ui-playground/greeting.html",
        mimeType: "text/html;profile=mcp-app",
        text: htmlContent,
      },
    },
  ],
  structuredContent: { name, greeting },
  _meta: { outputTemplate: "ui://mcp-ui-playground/greeting.html" },
}));
```

### 3. UI Communication

UIs communicate with the MCP host via postMessage:

```javascript
// Call a tool from the UI
window.parent.postMessage({
  jsonrpc: '2.0',
  id: 'request-1',
  method: 'tools/call',
  params: { name: 'hello_world', arguments: { name: 'World' } }
}, '*');
```

## Resources

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Apps Extension](https://github.com/modelcontextprotocol/ext-apps)
- [MCP Specification](https://spec.modelcontextprotocol.io)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)

## License

MIT
