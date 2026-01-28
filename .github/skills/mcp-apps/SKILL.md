---
name: mcp-apps
description: 'Build MCP Apps - interactive HTML UIs rendered in chat via the MCP Apps Extension (SEP-1865). Use when creating MCP tools that need rich UI beyond text, adding interactive forms/visualizations to MCP servers, configuring structuredContent for UI data passing, or debugging MCP UI rendering issues. Keywords: MCP Apps, SEP-1865, ui://, text/html;profile=mcp-app, structuredContent, postMessage, registerTool _meta.'
---

# MCP Apps Development

MCP Apps let MCP tools render interactive HTML UIs in chat. The UI runs in a sandboxed iframe and communicates via JSON-RPC postMessage.

## External References

- **Spec**: https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/draft/apps.mdx
- **Blog**: https://blog.modelcontextprotocol.io/posts/2025-11-21-mcp-apps/
- **VS Code impl**: https://github.com/microsoft/vscode (search `chatMcpAppModel.ts`)

## Quick Start

### 1. Register UI Resource

```typescript
server.resource(
  "my-ui",
  "ui://my-server/my-tool",                    // ui:// scheme required
  { mimeType: "text/html;profile=mcp-app" },   // profile required
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: "text/html;profile=mcp-app",   // must match
      text: MY_UI_HTML()
    }]
  })
);
```

### 2. Register Tool with UI Link

```typescript
server.registerTool("my_tool", {
  inputSchema: { query: z.string() },
  _meta: { ui: { resourceUri: "ui://my-server/my-tool" } }
}, async ({ query }) => ({
  content: [{ type: "text", text: `Result: ${query}` }],
  structuredContent: { query, result: "..." }  // sent to UI
}));
```

### 3. UI Template (Static HTML)

```typescript
export function MY_UI_HTML(): string {
  return `<!DOCTYPE html>
<html><body>
  <div id="content">Loading...</div>
  <script>
    const pending = new Map();
    let nextId = 1;
    
    function request(method, params) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        window.parent.postMessage({ jsonrpc: '2.0', id, method, params }, '*');
      });
    }
    
    window.addEventListener('message', (e) => {
      const msg = e.data;
      if (!msg?.jsonrpc) return;
      
      // Handle responses
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? reject(msg.error) : resolve(msg.result);
        return;
      }
      
      // Handle notifications
      if (msg.method === 'ui/notifications/tool-input') {
        const { arguments: args } = msg.params;
        document.getElementById('content').textContent = JSON.stringify(args);
      }
    });
    
    // Initialize handshake
    request('ui/initialize', { protocolVersion: '2025-11-21' }).then(() => {
      window.parent.postMessage({ jsonrpc: '2.0', method: 'ui/notifications/initialized' }, '*');
    });
  <\/script>
</body></html>`;
}
```

## Critical Requirements

| Requirement | Wrong | Right |
|-------------|-------|-------|
| MIME type | `text/html` | `text/html;profile=mcp-app` |
| URI scheme | `https://`, `file://` | `ui://` |
| Tool registration | `server.tool()` | `server.registerTool()` with `_meta` |
| Data passing | Template parameters | `ui/notifications/tool-input` |
| External fetch/CDN | Just call `fetch()` | Declare domains in `_meta.ui.csp` |
| VS Code setting | Just enable | Enable `chat.mcp.apps.enabled` + **restart** |

## UI Lifecycle

```
UI → Host:  ui/initialize (request)
Host → UI:  response { hostContext }
UI → Host:  ui/notifications/initialized (notification)
Host → UI:  ui/notifications/tool-input { arguments, structuredContent }
Host → UI:  ui/notifications/tool-result { content, structuredContent }
```

**Critical**: Complete `ui/initialize` handshake before expecting data.

## Host Notifications (UI receives)

| Method | When | Params |
|--------|------|--------|
| `ui/notifications/tool-input` | Tool args ready | `{ arguments }` |
| `ui/notifications/tool-input-partial` | Streaming | Partial args |
| `ui/notifications/tool-result` | Tool complete | `{ content, structuredContent }` |
| `ui/notifications/tool-cancelled` | Cancelled | `{ reason }` |
| `ui/notifications/host-context-changed` | Theme/size change | Context object |

## UI Requests (UI sends)

| Method | Purpose | Params |
|--------|---------|--------|
| `ui/initialize` | Start handshake | `{ protocolVersion, capabilities }` |
| `ui/message` | Send text to chat input | `{ content: [{ type: 'text', text }] }` |
| `tools/call` | Call another MCP tool | `{ name, arguments }` |
| `resources/read` | Read MCP resource | `{ uri }` |

## Common Patterns

### Theme Integration

```javascript
function applyHostContext(ctx) {
  if (ctx.theme) document.documentElement.style.colorScheme = ctx.theme;
  if (ctx.styles?.variables) {
    for (const [k, v] of Object.entries(ctx.styles.variables)) {
      document.documentElement.style.setProperty(k, v);
    }
  }
}
```

### Send Results to Chat

```javascript
async function sendToChat(text) {
  await request('ui/message', {
    content: [{ type: 'text', text }]
  });
}
```

### XSS Prevention

```javascript
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

## Advanced Patterns

For complex UI interactions beyond basic tool→UI data flow, load [references/patterns.md](references/patterns.md). Topics include:

| Pattern | When to use |
|---------|-------------|
| **Awaiting User Input** | Tool needs to wait for user interaction before returning (forms, selections, confirmations) |
| **Calling Other Tools** | UI needs to invoke additional MCP tools |
| **Resource Metadata** | Border preferences, sizing hints |
| **Loading External Resources** | Configure CSP via `_meta.ui.csp` to allow external APIs, CDNs, fonts, embeds |
| **Reference Examples** | Production patterns from ext-apps repo (charts, graphs, React, vanilla JS) |

## Gotchas

1. **Templates are static** - Don't pass data via template string interpolation. Data arrives via `tool-input` notification.

2. **VS Code capability detection** - VS Code uses `chat.mcp.apps.enabled` setting, NOT protocol capability negotiation. Don't rely on `extensions["io.modelcontextprotocol/ui"]`.

3. **Script escaping** - Use `<\/script>` in template strings to avoid breaking the outer script.

4. **Rebuild + restart** - After code changes: `npm run build` then restart MCP server in VS Code.

5. **MIME type duplication** - Must set `text/html;profile=mcp-app` in BOTH resource options AND contents array. Missing either causes silent failure.

6. **External resources blocked by default** - UI runs with strict CSP. To use external APIs/CDNs, you MUST declare allowed domains in `_meta.ui.csp`. See [patterns.md](./references/patterns.md#loading-external-resources-csp-configuration).

## Debugging

Check server log file (e.g., `/tmp/mcp-server.log`):
- `📱 resources/read` → VS Code fetched UI (working)
- Only `🔧 Tool called` → Setting not enabled or needs restart

See [references/debugging.md](references/debugging.md) for logging setup and [references/troubleshooting.md](references/troubleshooting.md) for common issues.

## File Structure

```
src/
  index.ts         # Server: tool + resource registration
  ui/
    my-tool.ts     # Export function returning HTML string
```

### Reference Files

- [references/patterns.md](references/patterns.md) - Advanced patterns (awaiting user input, calling tools, CSP, examples)
- [references/debugging.md](references/debugging.md) - Logging setup
- [references/troubleshooting.md](references/troubleshooting.md) - Common issues and fixes