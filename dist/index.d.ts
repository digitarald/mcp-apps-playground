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
export {};
