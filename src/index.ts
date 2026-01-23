#!/usr/bin/env node
/**
 * MCP UI Playground - Hello World Server (stdio transport)
 * 
 * Demonstrates MCP server with UI capabilities using the Apps Extension (SEP-1865).
 * 
 * Key concepts:
 * 1. UI resources declared with ui:// scheme and text/html;profile=mcp-app MIME type
 * 2. Tools annotated with _meta.ui.resourceUri pointing to UI resource
 * 3. UI can send messages to chat via ui/message request
 * 
 * Run with: npm run dev
 * Test with: npm run inspector
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { HELLO_WORLD_UI } from "./ui/hello-world.js";
import { LIST_SORT_UI } from "./ui/list-sort.js";
import * as fs from "fs";

// Log file for debugging client capabilities
const LOG_FILE = "/tmp/mcp-ui-playground.log";

function log(message: string) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
  console.error(line.trim());
}

// Create MCP server with metadata
const server = new McpServer({
  name: "mcp-ui-playground",
  version: "1.0.0",
});

// Hook into the underlying server to capture client capabilities
server.server.oninitialized = () => {
  const clientCapabilities = server.server.getClientCapabilities();
  log(`Client capabilities: ${JSON.stringify(clientCapabilities, null, 2)}`);
  
  // Note: VS Code does NOT advertise MCP Apps support via protocol capabilities.
  // Instead, it uses the internal setting `chat.mcp.apps.enabled`.
  // The io.modelcontextprotocol/ui extension check only works for hosts that
  // implement SEP-1865 protocol-level capability negotiation.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const caps = clientCapabilities as any;
  const uiExtension = caps?.extensions?.["io.modelcontextprotocol/ui"];
  if (uiExtension) {
    log(`✅ Client advertises MCP Apps extension (SEP-1865): ${JSON.stringify(uiExtension)}`);
  } else {
    log(`ℹ️ Client does not advertise io.modelcontextprotocol/ui extension`);
    log(`   VS Code uses chat.mcp.apps.enabled setting instead of protocol negotiation`);
  }
};

// Register UI resource with ui:// scheme (Apps Extension pattern)
// This allows hosts to prefetch and audit the template before rendering
// The template is STATIC - data comes via ui/notifications/tool-input
server.resource(
  "greeting-ui",
  "ui://mcp-ui-playground/greeting",
  {
    description: "Interactive greeting UI panel",
    mimeType: "text/html;profile=mcp-app",
  },
  async (uri) => {
    log(`📱 resources/read called for: ${uri.href}`);
    log(`📱 Returning HTML template (${HELLO_WORLD_UI().length} bytes)`);
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html;profile=mcp-app",
          text: HELLO_WORLD_UI(),
          // SEP-1865: UI resource metadata
          _meta: {
            ui: {
              // CSP: No external domains needed for this simple UI
              csp: {},
              // Request no host-provided border
              prefersBorder: false,
            },
          },
        },
      ],
    };
  }
);

// Register hello_world tool with UI annotation (SEP-1865)
// The _meta.ui.resourceUri tells the host to render UI for this tool
server.registerTool(
  "hello_world",
  {
    description: "Display a Hello World greeting with optional interactive UI",
    inputSchema: {
      name: z.string().describe("Name to greet"),
      showUI: z.boolean().optional().describe("Show interactive UI panel"),
    },
    // SEP-1865: Tool metadata linking to UI resource
    // Host fetches this resource and renders it when the tool is called
    _meta: {
      ui: {
        resourceUri: "ui://mcp-ui-playground/greeting",
        visibility: ["model", "app"], // Visible to both model and UI
      },
    },
  },
  async ({ name, showUI = true }) => {
    log(`🔧 Tool hello_world called: name="${name}", showUI=${showUI}`);
    const greeting = `Hello, ${name}! 👋`;

    // Build response with structured content for the UI
    const response: {
      content: Array<{ type: "text"; text: string }>;
      structuredContent?: Record<string, unknown>;
    } = {
      content: [{ type: "text" as const, text: greeting }],
    };

    if (showUI) {
      // Add structured content for the UI template to consume
      // Host sends this via ui/notifications/tool-input
      response.structuredContent = {
        name,
        greeting,
        timestamp: new Date().toISOString(),
      };
      log(`🎨 Returning structuredContent: ${JSON.stringify(response.structuredContent)}`);
    }

    return response;
  }
);

// Register a markdown resource for documentation
server.resource(
  "greeting-docs",
  "mcp://mcp-ui-playground/docs/greeting",
  {
    description: "Documentation for the greeting tool",
    mimeType: "text/markdown",
  },
  async () => ({
    contents: [
      {
        uri: "mcp://mcp-ui-playground/docs/greeting",
        mimeType: "text/markdown",
        text: `# Greeting Tool

Use the \`hello_world\` tool to generate personalized greetings.

## Parameters
- **name**: The name to greet
- **showUI**: Whether to show interactive UI (default: true)

## Apps Extension (SEP-1865)
When \`showUI=true\`, the tool returns \`_meta.ui.resourceUri\` pointing to
\`ui://mcp-ui-playground/greeting\`. The host:

1. Fetches the HTML template via \`resources/read\`
2. Renders it in a sandboxed iframe
3. Sends tool arguments via \`ui/notifications/tool-input\`
4. Sends tool result via \`ui/notifications/tool-result\`

The UI can send messages to chat via \`ui/message\` request.`,
      },
    ],
  })
);

  // Register list-sort UI resource
  server.resource(
    "list-sort-ui",
    "ui://mcp-ui-playground/list-sort",
    {
      description: "Interactive list sorting UI panel",
      mimeType: "text/html;profile=mcp-app",
    },
    async (uri) => {
      log(`📱 resources/read called for: ${uri.href}`);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/html;profile=mcp-app",
            text: LIST_SORT_UI(),
            _meta: {
              ui: {
                csp: {},
                prefersBorder: false,
              },
            },
          },
        ],
      };
    }
  );

  // Register list_sort tool with UI annotation (SEP-1865)
  server.registerTool(
    "list_sort",
    {
      description: "Display an interactive list sorting UI. User can drag to reorder items, save the sorted order, or ask the AI to sort the list.",
      inputSchema: {
        items: z.array(z.object({
          id: z.string().describe("Unique identifier for the item"),
          label: z.string().describe("Display label for the item"),
        })).describe("List of items to sort"),
        title: z.string().optional().describe("Optional title for the list"),
      },
      _meta: {
        ui: {
          resourceUri: "ui://mcp-ui-playground/list-sort",
          visibility: ["model", "app"],
        },
      },
    },
    async ({ items, title }) => {
      log(`🔧 Tool list_sort called: ${items.length} items, title="${title || 'Sort List'}"`);
    
      return {
        content: [{ type: "text" as const, text: `Showing ${items.length} items for sorting.` }],
        structuredContent: {
          items,
          title: title || "Sort List",
        },
      };
    }
  );

// Start server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 MCP UI Playground server running (stdio)");
  console.error("📱 Apps Extension: UI resources available at ui://mcp-ui-playground/");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
