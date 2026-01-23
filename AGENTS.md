# MCP Apps Extension - Agent Reference

MCP Apps lets tools render interactive HTML UIs in chat. See [spec](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/draft/apps.mdx) for full details.

## Essential Setup

1. **Tool must have** `_meta.ui.resourceUri` pointing to a `ui://` resource
2. **Resource must return** MIME type `text/html;profile=mcp-app` (not just `text/html`)
3. **VS Code requires** `chat.mcp.apps.enabled: true` + restart

## Common Mistakes

| Wrong | Right |
|-------|-------|
| `mimeType: "text/html"` | `mimeType: "text/html;profile=mcp-app"` |
| Using `server.tool()` | Use `server.registerTool()` to set `_meta` on definition |
| Changing setting without restart | Always restart VS Code after enabling `chat.mcp.apps.enabled` |
| Sending data via template params | Data comes via `ui/notifications/tool-input` notification |

## UI Lifecycle (postMessage JSON-RPC)

```
UI → Host:  ui/initialize (request with id)
Host → UI:  response (same id)
UI → Host:  ui/notifications/initialized
Host → UI:  ui/notifications/tool-input (tool arguments)
Host → UI:  ui/notifications/tool-result (when complete)
```

**Critical**: UI must complete `ui/initialize` handshake before receiving data.

## Architecture

### File Structure

```
src/
  index.ts       # MCP server - tool + resource registration
  ui/*.ts        # HTML template functions (return full HTML strings)
```

### Server Pattern (index.ts)

```typescript
// 1. Register UI resource (static HTML template)
server.resource(
  "greeting-ui",
  "ui://mcp-ui-playground/greeting",           // ui:// scheme required
  { mimeType: "text/html;profile=mcp-app" },   // profile required
  async (uri) => ({
    contents: [{ uri: uri.href, mimeType: "text/html;profile=mcp-app", text: HTML_TEMPLATE() }]
  })
);

// 2. Register tool with _meta.ui linking to resource
server.registerTool("hello_world", {
  inputSchema: { name: z.string() },
  _meta: { ui: { resourceUri: "ui://mcp-ui-playground/greeting" } }
}, async ({ name }) => ({
  content: [{ type: "text", text: `Hello, ${name}!` }],
  structuredContent: { name, greeting: `Hello, ${name}!` }  // Sent to UI via tool-input
}));
```

### UI Template Pattern (ui/*.ts)

Templates are **static** - export a function returning full HTML string. Data arrives via notifications:

```typescript
export function MY_UI(): string {
  return `<!DOCTYPE html>
<html>
<body>
  <div id="content">Loading...</div>
  <script>
    // Handle host messages
    window.addEventListener('message', (e) => {
      const msg = e.data;
      if (msg.method === 'ui/notifications/tool-input') {
        // msg.params.arguments contains tool input
        // msg.params.structuredContent contains tool's structuredContent
      }
    });
    
    // Initialize handshake
    window.parent.postMessage({ jsonrpc: '2.0', id: 1, method: 'ui/initialize', params: {} }, '*');
  </script>
</body>
</html>`;
}
```

### Key Data Flow

1. **Tool call** → Server returns `structuredContent` object
2. **Host** → Fetches UI via `resources/read` on `ui://` URI  
3. **Host** → Sends `ui/notifications/tool-input` with `{ arguments, structuredContent }`
4. **UI** → Renders using received data

## Debugging

Check `/tmp/mcp-ui-playground.log` for:
- `📱 resources/read` → VS Code is fetching UI (setting is working)
- Only `🔧 Tool called` → Setting not enabled or needs restart
