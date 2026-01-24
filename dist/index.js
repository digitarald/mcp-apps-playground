#!/usr/bin/env node
/**
 * MCP Apps Playground - Hello World Server (stdio transport)
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
import { FLAME_GRAPH_UI } from "./ui/flame-graph.js";
import * as fs from "fs";
// Log file for debugging client capabilities
const LOG_FILE = "/tmp/mcp-apps-playground.log";
function log(message) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(LOG_FILE, line);
    console.error(line.trim());
}
// Create MCP server with metadata
const server = new McpServer({
    name: "mcp-apps-playground",
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
    const caps = clientCapabilities;
    const uiExtension = caps?.extensions?.["io.modelcontextprotocol/ui"];
    if (uiExtension) {
        log(`✅ Client advertises MCP Apps extension (SEP-1865): ${JSON.stringify(uiExtension)}`);
    }
    else {
        log(`ℹ️ Client does not advertise io.modelcontextprotocol/ui extension`);
        log(`   VS Code uses chat.mcp.apps.enabled setting instead of protocol negotiation`);
    }
};
// Register UI resource with ui:// scheme (Apps Extension pattern)
// This allows hosts to prefetch and audit the template before rendering
// The template is STATIC - data comes via ui/notifications/tool-input
server.resource("greeting-ui", "ui://mcp-apps-playground/greeting", {
    description: "Interactive greeting UI panel",
    mimeType: "text/html;profile=mcp-app",
}, async (uri) => {
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
});
// Register hello_world tool with UI annotation (SEP-1865)
// The _meta.ui.resourceUri tells the host to render UI for this tool
server.registerTool("hello_world", {
    description: "Display a Hello World greeting with optional interactive UI",
    inputSchema: {
        name: z.string().describe("Name to greet"),
        showUI: z.boolean().optional().describe("Show interactive UI panel"),
    },
    // SEP-1865: Tool metadata linking to UI resource
    // Host fetches this resource and renders it when the tool is called
    _meta: {
        ui: {
            resourceUri: "ui://mcp-apps-playground/greeting",
            visibility: ["model", "app"], // Visible to both model and UI
        },
    },
}, async ({ name, showUI = true }, extra) => {
    // Send progress notification with nice label
    const progressToken = extra._meta?.progressToken;
    if (progressToken !== undefined) {
        await extra.sendNotification({
            method: "notifications/progress",
            params: {
                progressToken,
                progress: 0,
                message: `👋 Greeting ${name}...`
            }
        });
    }
    log(`🔧 Tool hello_world called: name="${name}", showUI=${showUI}`);
    const greeting = `Hello, ${name}! 👋`;
    // Build response with structured content for the UI
    const response = {
        content: [{ type: "text", text: greeting }],
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
});
// Register a markdown resource for documentation
server.resource("greeting-docs", "mcp://mcp-apps-playground/docs/greeting", {
    description: "Documentation for the greeting tool",
    mimeType: "text/markdown",
}, async () => ({
    contents: [
        {
            uri: "mcp://mcp-apps-playground/docs/greeting",
            mimeType: "text/markdown",
            text: `# Greeting Tool

Use the \`hello_world\` tool to generate personalized greetings.

## Parameters
- **name**: The name to greet
- **showUI**: Whether to show interactive UI (default: true)

## Apps Extension (SEP-1865)
When \`showUI=true\`, the tool returns \`_meta.ui.resourceUri\` pointing to
\`ui://mcp-apps-playground/greeting\`. The host:

1. Fetches the HTML template via \`resources/read\`
2. Renders it in a sandboxed iframe
3. Sends tool arguments via \`ui/notifications/tool-input\`
4. Sends tool result via \`ui/notifications/tool-result\`

The UI can send messages to chat via \`ui/message\` request.`,
        },
    ],
}));
// Register list-sort UI resource
server.resource("list-sort-ui", "ui://mcp-apps-playground/list-sort", {
    description: "Interactive list sorting UI panel",
    mimeType: "text/html;profile=mcp-app",
}, async (uri) => {
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
});
// Register list_sort tool with UI annotation (SEP-1865)
server.registerTool("list_sort", {
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
}, async ({ items, title }, extra) => {
    // Send progress notification with nice label
    const progressToken = extra._meta?.progressToken;
    if (progressToken !== undefined) {
        await extra.sendNotification({
            method: "notifications/progress",
            params: {
                progressToken,
                progress: 0,
                message: `📋 Loading ${items.length} items to sort...`
            }
        });
    }
    log(`🔧 Tool list_sort called: ${items.length} items, title="${title || 'Sort List'}"`);
    return {
        content: [{ type: "text", text: `Showing ${items.length} items for sorting.` }],
        structuredContent: {
            items,
            title: title || "Sort List",
        },
    };
});
// Register flame-graph UI resource
server.resource("flame-graph-ui", "ui://mcp-apps-playground/flame-graph", {
    description: "Interactive flame graph profiler visualization",
    mimeType: "text/html;profile=mcp-app",
}, async (uri) => {
    log(`📱 resources/read called for: ${uri.href}`);
    return {
        contents: [
            {
                uri: uri.href,
                mimeType: "text/html;profile=mcp-app",
                text: FLAME_GRAPH_UI(),
                _meta: {
                    ui: {
                        csp: {},
                        prefersBorder: false,
                    },
                },
            },
        ],
    };
});
// Register flame_graph tool with UI annotation (SEP-1865)
server.registerTool("flame_graph", {
    description: "Display an interactive flame graph visualization for performance profiling. Shows call hierarchy with execution time. Click frames to zoom, analyze hot paths.",
    inputSchema: {
        title: z.string().optional().describe("Title for the profile visualization"),
        filename: z.string().optional().describe("Source filename or profile name"),
        profile: z.any().optional().describe("Profile data (uses simulated data if not provided)"),
    },
    _meta: {
        ui: {
            resourceUri: "ui://mcp-apps-playground/flame-graph",
            visibility: ["model", "app"],
        },
    },
}, async ({ title, filename, profile }, extra) => {
    // Extract progress token for notifications
    const progressToken = extra._meta?.progressToken;
    // Send progress notification with nice label
    if (progressToken !== undefined) {
        await extra.sendNotification({
            method: "notifications/progress",
            params: {
                progressToken,
                progress: 0,
                message: `🔥 Loading flame graph...`
            }
        });
    }
    log(`🔧 Tool flame_graph called: title="${title || 'Performance Profile'}"`);
    // Analyze the profile (or use simulated analysis)
    if (progressToken !== undefined) {
        await extra.sendNotification({
            method: "notifications/progress",
            params: {
                progressToken,
                progress: 50,
                message: `📊 Analyzing performance profile...`
            }
        });
    }
    const analysis = profile ? analyzeProfile(profile) : getSimulatedAnalysis();
    // Format analysis for the model (markdown)
    const analysisText = `## Flame Graph: ${title || 'Performance Profile'}

**Summary:** ${analysis.summary}

### Key Findings
${analysis.findings.map((f, i) => `${i + 1}. ${f}`).join('\n')}

### Hot Paths (>10% self time)
${analysis.hotPaths.map((h) => `- \`${h.name}\` in ${h.file} (${h.percent}%)`).join('\n')}

### Recommendations
${analysis.recommendations.map((r) => `- ${r}`).join('\n')}`;
    return {
        content: [{
                type: "text",
                text: analysisText
            }],
        // structuredContent: structured data for UI + model
        // Note: VS Code sends JSON.stringify(structuredContent) to model when present,
        // so we include analysis fields as structured data (not prose)
        structuredContent: {
            title: title || "Performance Profile",
            filename: filename || "CPU Profile",
            // Profile data for the UI to render
            profile: profile || null,
            // Structured analysis for the model (not duplicating the markdown)
            summary: analysis.summary,
            findings: analysis.findings,
            hotPaths: analysis.hotPaths,
            recommendations: analysis.recommendations,
        },
    };
});
// Analyze a real profile
function analyzeProfile(profile) {
    const hotPaths = [];
    const findings = [];
    // Walk the tree to find hot paths
    function walk(node, total) {
        const selfPercent = ((node.self || 0) / total) * 100;
        if (selfPercent > 10) {
            hotPaths.push({
                name: node.name,
                file: node.file || 'unknown',
                percent: Math.round(selfPercent)
            });
        }
        if (node.children) {
            for (const child of node.children) {
                walk(child, total);
            }
        }
    }
    walk(profile, profile.total);
    hotPaths.sort((a, b) => b.percent - a.percent);
    return {
        summary: `Total execution time: ${profile.total}ms across ${countNodes(profile)} stack frames`,
        findings: [
            `${hotPaths.length} functions consume >10% self time`,
            hotPaths.length > 0 ? `Hottest function: ${hotPaths[0].name} at ${hotPaths[0].percent}%` : 'No major bottlenecks detected'
        ],
        hotPaths: hotPaths.slice(0, 5),
        recommendations: [
            hotPaths.length > 3 ? 'Multiple hot spots suggest distributed load - consider parallel optimization' : 'Focus optimization on the top hot path',
            'Profile under production load for accurate measurements'
        ]
    };
}
function countNodes(node) {
    let count = 1;
    if (node.children) {
        for (const child of node.children) {
            count += countNodes(child);
        }
    }
    return count;
}
// Simulated analysis for demo data
function getSimulatedAnalysis() {
    return {
        summary: "Node.js API server profile showing 3.85s execution across 58 stack frames. Full request lifecycle including auth, business logic, webhooks, scheduled jobs, event loop, and GC.",
        findings: [
            "Database operations dominate at 42% total time (prisma + pg queries across 4 call sites)",
            "Network I/O (fetch for webhooks + TLS) adds 320ms latency with crypto overhead",
            "GC pressure visible: 350ms in garbage collection (9% of total) - consider memory optimization",
            "Event loop processing shows 520ms overhead including microtask draining",
            "JWT verification is a hot synchronous operation at 180ms self time",
            "JSON parsing/stringifying appears in multiple paths totaling ~175ms"
        ],
        hotPaths: [
            { name: "fetch", file: "[native]", percent: 6 },
            { name: "jwt.verify", file: "node_modules/jsonwebtoken/verify.js:45", percent: 5 },
            { name: "prisma.query", file: "node_modules/@prisma/client/runtime.js:1234", percent: 5 },
            { name: "gc", file: "[native]", percent: 5 },
            { name: "prisma.deleteMany", file: "node_modules/@prisma/client/runtime.js:3456", percent: 4 },
            { name: "calculateTotals", file: "src/services/orders.ts:234", percent: 4 },
            { name: "JSON.parse", file: "[native]", percent: 3 }
        ],
        recommendations: [
            "**High impact:** Batch database queries - 4 separate pg.query calls could potentially be combined",
            "**Medium impact:** Cache JWT verification results for repeat tokens within request window",
            "**Medium impact:** Move webhook delivery to async background queue to reduce request latency by 320ms",
            "**Medium impact:** Investigate GC pressure - 9% in garbage collection suggests allocation hotspots",
            "**Low impact:** Consider streaming JSON parsing for large payloads",
            "**Investigate:** Event loop is processing 520ms of callbacks - check for blocking operations",
            "**User code focus:** \\`calculateTotals\\` at 140ms self time is the hottest user function - profile for optimization opportunities"
        ]
    };
}
// Start server with stdio transport
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("🚀 MCP Apps Playground server running (stdio)");
    console.error("📱 Apps Extension: UI resources available at ui://mcp-apps-playground/");
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
