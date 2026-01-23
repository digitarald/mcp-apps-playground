/**
 * Hello World UI Template
 *
 * This generates the HTML for the hello world greeting UI.
 * The UI is rendered in a sandboxed iframe by MCP hosts that support
 * the Apps Extension (SEP-1865).
 *
 * Communication with the host happens via postMessage using MCP JSON-RPC.
 *
 * Lifecycle (per SEP-1865):
 * 1. UI sends ui/initialize request
 * 2. Host responds with McpUiInitializeResult
 * 3. UI sends ui/notifications/initialized notification
 * 4. Host sends ui/notifications/tool-input with the tool arguments
 * 5. Host sends ui/notifications/tool-result when tool completes
 * 6. UI can send ui/message to add content to chat input
 */
/**
 * Generate the Hello World UI HTML (static template)
 * The actual data comes via ui/notifications/tool-input
 */
export declare function HELLO_WORLD_UI(): string;
/**
 * Escape HTML special characters
 */
export declare function escapeHtml(text: string): string;
