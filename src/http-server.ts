#!/usr/bin/env node
/**
 * MCP Apps Playground - Hello World Server (HTTP transport)
 * 
 * Exposes MCP server via Streamable HTTP for web-based clients.
 * Uses Apps Extension (SEP-1865) for UI rendering.
 * 
 * Run with: npm run dev:http
 * Test with: npm run inspector:http
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import { z } from "zod";
import { HELLO_WORLD_UI } from "./ui/hello-world.js";
import { LIST_SORT_UI } from "./ui/list-sort.js";

// Create MCP server with metadata
const server = new McpServer({
  name: "mcp-apps-playground",
  version: "1.0.0",
});

// Register UI resource with ui:// scheme (Apps Extension pattern)
// The template is STATIC - data comes via ui/notifications/tool-input
server.resource(
  "greeting-ui",
  "ui://mcp-apps-playground/greeting",
  {
    description: "Interactive greeting UI panel",
    mimeType: "text/html;profile=mcp-app",
  },
  async (uri) => {
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html;profile=mcp-app",
          text: HELLO_WORLD_UI(),
          // SEP-1865: UI resource metadata
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
    _meta: {
      ui: {
        resourceUri: "ui://mcp-apps-playground/greeting",
        visibility: ["model", "app"],
      },
    },
  },
  async ({ name, showUI = true }) => {
    const greeting = `Hello, ${name}! 👋`;

    const response: {
      content: Array<{ type: "text"; text: string }>;
      structuredContent?: Record<string, unknown>;
    } = {
      content: [{ type: "text" as const, text: greeting }],
    };

    if (showUI) {
      response.structuredContent = {
        name,
        greeting,
        timestamp: new Date().toISOString(),
      };
    }

    return response;
  }
);

  // Register list-sort UI resource
  server.resource(
    "list-sort-ui",
    "ui://mcp-apps-playground/list-sort",
    {
      description: "Interactive list sorting UI panel",
      mimeType: "text/html;profile=mcp-app",
    },
    async (uri) => {
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

  // Register list_sort tool with UI annotation
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
          resourceUri: "ui://mcp-apps-playground/list-sort",
          visibility: ["model", "app"],
        },
      },
    },
    async ({ items, title }) => {
      return {
        content: [{ type: "text" as const, text: `Showing ${items.length} items for sorting.` }],
        structuredContent: {
          items,
          title: title || "Sort List",
        },
      };
    }
  );

// Express app for HTTP transport
const app = express();
app.use(express.json());

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", server: "mcp-apps-playground" });
});

// MCP endpoint
app.post("/mcp", async (req: Request, res: Response) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => transport.close());

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// SSE endpoint for streaming (optional)
app.get("/mcp/sse", async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    enableJsonResponse: false,
  });

  res.on("close", () => transport.close());

  await server.connect(transport);
  await transport.handleRequest(req, res);
});

const port = parseInt(process.env.PORT || "3000");

app.listen(port, () => {
  console.log(`🚀 MCP Apps Playground server running at http://localhost:${port}`);
  console.log(`📡 MCP endpoint: http://localhost:${port}/mcp`);
  console.log(`🔍 Test with: npx @modelcontextprotocol/inspector http://localhost:${port}/mcp`);
});
