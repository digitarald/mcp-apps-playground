# MCP Apps Advanced Patterns

## Table of Contents

1. [Awaiting User Input (Blocking Pattern)](#awaiting-user-input-blocking-pattern)
2. [Reference Examples (ext-apps repo)](#reference-examples)
3. [Calling Other Tools](#calling-other-tools)
4. [Resource Metadata](#resource-metadata)

## Awaiting User Input (Blocking Pattern)

The UI is shown **immediately when the tool call starts**, before the tool returns. The server can keep the response pending while waiting for user interaction.

### How It Works

1. Register an app-only callback tool with `visibility: ["app"]` (hidden from agent, callable by UI)
2. Main tool starts, UI is displayed, tool handler awaits a Promise
3. User interacts with UI, UI calls the callback tool via `tools/call`
4. Callback tool resolves the Promise, main tool returns with user's selection

### Server Implementation

```typescript
// Pending responses waiting for UI callback
const pendingCallbacks = new Map<string, (result: any) => void>();

// App-only callback tool (hidden from agent)
server.registerTool("submit_selection", {
  inputSchema: { sessionId: z.string(), selection: z.any() },
  _meta: { ui: { visibility: ["app"] } }  // Only callable by UI
}, async ({ sessionId, selection }) => {
  const resolve = pendingCallbacks.get(sessionId);
  if (resolve) {
    resolve(selection);
    pendingCallbacks.delete(sessionId);
  }
  return { content: [{ type: "text", text: "Selection received" }] };
});

// Main tool that waits for UI input
server.registerTool("select_items", {
  inputSchema: { items: z.array(z.string()) },
  _meta: { ui: { resourceUri: "ui://my-server/selector" } }
}, async ({ items }) => {
  const sessionId = crypto.randomUUID();
  
  // Wait for callback from UI
  const selection = await new Promise((resolve) => {
    pendingCallbacks.set(sessionId, resolve);
  });
  
  return {
    content: [{ type: "text", text: `Selected: ${selection.join(", ")}` }],
    structuredContent: { sessionId, items, selection }
  };
});
```

### UI Implementation

```javascript
// When user clicks submit
async function submitSelection(selectedItems) {
  const sessionId = /* from tool-input structuredContent */;
  await request('tools/call', {
    name: 'submit_selection',
    arguments: { sessionId, selection: selectedItems }
  });
}
```

**Important considerations**:
- The `sessionId` must be passed via `structuredContent` to correlate the callback with the pending request
- Implement timeouts to avoid hanging indefinitely if user closes the UI
- Tools with `visibility: ["app"]` are hidden from the agent's tool list but remain callable by the UI

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
