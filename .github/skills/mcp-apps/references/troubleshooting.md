# MCP Apps Troubleshooting

## Table of Contents

1. [UI Not Rendering](#ui-not-rendering)
2. [Communication Issues](#communication-issues)
3. [VS Code Specific](#vs-code-specific)

## UI Not Rendering

### Checklist

1. **MIME type correct?**
   ```typescript
   // Both must be: text/html;profile=mcp-app
   { mimeType: "text/html;profile=mcp-app" }  // resource options
   { mimeType: "text/html;profile=mcp-app" }  // contents array
   ```

2. **URI scheme is `ui://`?**
   ```typescript
   "ui://my-server/my-tool"  // ✓
   "https://..."             // ✗
   ```

3. **Tool uses `registerTool` not `tool`?**
   ```typescript
   server.registerTool("name", { _meta: { ui: { resourceUri: "..." } } }, handler);  // ✓
   server.tool("name", handler);  // ✗ can't set _meta
   ```

4. **VS Code setting enabled + restarted?**
   - Setting: `chat.mcp.apps.enabled: true`
   - **Must restart VS Code after changing**

### Test Resource Independently

```typescript
// Add a test endpoint to verify resource returns correctly
log(`HTML length: ${MY_UI_HTML().length} bytes`);
log(`First 200 chars: ${MY_UI_HTML().substring(0, 200)}`);
```

## Communication Issues

### UI Not Receiving Data

**Symptom:** UI renders but shows "Loading..." or empty state.

**Causes:**
1. `ui/initialize` handshake not completed
2. Not listening for `ui/notifications/tool-input`

**Debug in browser console:**
```javascript
// Add to UI template
window.addEventListener('message', (e) => {
  console.log('Received:', e.data);
});
```

### Handshake Timeout

**Symptom:** UI shows briefly then disappears or errors.

**Solution:** Ensure handshake completes:
```javascript
async function init() {
  try {
    const result = await request('ui/initialize', { protocolVersion: '2025-11-21' });
    console.log('Init result:', result);
    window.parent.postMessage({ 
      jsonrpc: '2.0', 
      method: 'ui/notifications/initialized' 
    }, '*');
  } catch (e) {
    console.error('Init failed:', e);
  }
}
init();
```

### `ui/message` Not Working

**Symptom:** No error but nothing appears in chat.

**Check:**
1. Response has `isError: false` or no error
2. Content format is correct:
   ```javascript
   await request('ui/message', {
     content: [{ type: 'text', text: 'Hello' }]  // Must be array
   });
   ```

## VS Code Specific

### Finding Chat MCP App Model

Search VS Code source:
```
src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatMcpAppModel.ts
```

### Supported Methods in VS Code

From `chatMcpAppModel.ts`:
- `ui/initialize` → Returns `hostContext`
- `ui/message` → Appends to chat input
- `tools/call` → Calls another MCP tool
- `resources/read` → Reads MCP resource

### VS Code Does NOT Support

- `awaitCompletion` / `ui/complete` - Tools complete immediately
- Protocol capability negotiation for MCP Apps - Uses setting instead

### Check Client Capabilities

```typescript
server.server.oninitialized = () => {
  const caps = server.server.getClientCapabilities();
  log(`Client caps: ${JSON.stringify(caps, null, 2)}`);
};
```

Note: VS Code won't show `io.modelcontextprotocol/ui` in capabilities.

### Restart Server Without Restarting VS Code

1. `Cmd+Shift+P` → "MCP: List Servers"
2. Find your server, click restart icon

Or use dev mode with watch:
```json
// .vscode/mcp.json
{
  "servers": {
    "my-server": {
      "command": "node",
      "args": ["dist/index.js"],
      "dev": { "watch": "src/**/*.ts" }
    }
  }
}
```
