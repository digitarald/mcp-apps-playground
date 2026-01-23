# MCP Apps Advanced Patterns

## Table of Contents

1. [Reference Examples (ext-apps repo)](#reference-examples)
2. [Calling Other Tools](#calling-other-tools)
3. [Resource Metadata](#resource-metadata)

## Reference Examples

The [ext-apps examples](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples) contain production-quality patterns. Fetch these when needed:

| Pattern | Example | Key Files |
|---------|---------|-----------|
| **Vanilla JS starter** | `basic-server-vanillajs` | `mcp-app.html`, `src/mcp-app.ts` |
| **React starter** | `basic-server-react` | `src/mcp-app.tsx` |
| **Debug/event logging** | `debug-server` | Shows all lifecycle events |
| **Chart.js visualization** | `system-monitor-server` | Real-time CPU/memory charts |
| **Scatter/bubble chart** | `customer-segmentation-server` | Interactive data exploration |
| **React + sliders** | `scenario-modeler-server` | Form inputs with Chart.js |
| **Budget sliders** | `budget-allocator-server` | Doughnut chart + sparklines |
| **Interactive graph** | `wiki-explorer-server` | D3-based node graph |
| **3D/map** | `map-server` | CesiumJS globe integration |
| **QR code (Python)** | `qr-server` | Minimal Python MCP App |

### Quick Fetch Pattern

To examine an example:
```
https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/{example-name}
```

Key files to read:
- `server.ts` - Tool + resource registration
- `mcp-app.html` - Entry HTML
- `src/mcp-app.ts` or `src/mcp-app.tsx` - App logic

## Calling Other Tools

UI can invoke other MCP tools:

```javascript
async function callAnotherTool() {
  try {
    const result = await request('tools/call', {
      name: 'other_tool_name',
      arguments: { param1: 'value1' }
    });
    console.log('Tool result:', result);
    // result.content and result.structuredContent available
  } catch (e) {
    console.error('Tool call failed:', e);
  }
}
```

## Resource Metadata

Additional metadata on UI resources:

```typescript
server.resource("my-ui", "ui://my-server/my-tool", { ... }, async (uri) => ({
  contents: [{
    uri: uri.href,
    mimeType: "text/html;profile=mcp-app",
    text: MY_UI_HTML(),
    _meta: {
      ui: {
        // Content Security Policy - domains the UI can access
        csp: {
          "img-src": ["https://example.com"],
          "connect-src": ["https://api.example.com"]
        },
        // Request no host border around iframe
        prefersBorder: false,
        // Preferred initial size
        preferredSize: { width: 400, height: 300 }
      }
    }
  }]
}));
```

Note: Host may ignore preferences based on layout constraints.
