# MCP Apps Debugging

## Add Logging

```typescript
const LOG_FILE = "/tmp/mcp-server.log";

function log(message: string) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
  console.error(line.trim());
}

// In resource handler
server.resource("my-ui", "ui://...", { ... }, async (uri) => {
  log(`📱 resources/read: ${uri.href}`);
  // ...
});

// In tool handler
server.registerTool("my_tool", { ... }, async (args) => {
  log(`🔧 Tool called: ${JSON.stringify(args)}`);
  // ...
});
```

## Check Log Output

```bash
tail -f /tmp/mcp-server.log
```

**Expected flow:**
1. `🔧 Tool called` - Tool was invoked
2. `📱 resources/read` - Host fetched UI resource

**If only "Tool called" appears:** MCP Apps not enabled or needs restart.

See [troubleshooting.md](troubleshooting.md) for common issues and fixes.
