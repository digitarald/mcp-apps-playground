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
export function HELLO_WORLD_UI() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hello World</title>
  <style>
    :root {
      --vscode-bg: #1e1e1e;
      --vscode-editor-bg: #252526;
      --vscode-input-bg: #3c3c3c;
      --vscode-border: #454545;
      --vscode-text: #cccccc;
      --vscode-text-muted: #858585;
      --vscode-accent: #0078d4;
      --vscode-accent-hover: #1c8ae6;
      --vscode-success: #4ec9b0;
      --vscode-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: var(--vscode-font);
      font-size: 13px;
      background: var(--vscode-bg);
      color: var(--vscode-text);
      padding: 12px;
    }
    
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--vscode-border);
    }
    
    .header-icon { font-size: 18px; }
    
    .greeting {
      font-size: 14px;
      font-weight: 600;
      color: var(--vscode-text);
    }
    
    .subtitle {
      font-size: 11px;
      color: var(--vscode-text-muted);
      margin-top: 2px;
    }
    
    .form-group {
      display: flex;
      gap: 6px;
      margin-bottom: 8px;
    }
    
    input {
      flex: 1;
      padding: 5px 8px;
      background: var(--vscode-input-bg);
      border: 1px solid var(--vscode-border);
      border-radius: 2px;
      color: var(--vscode-text);
      font-size: 13px;
      font-family: inherit;
      outline: none;
    }
    
    input:focus { border-color: var(--vscode-accent); }
    input::placeholder { color: var(--vscode-text-muted); }
    input:disabled { opacity: 0.6; }
    
    button {
      padding: 5px 12px;
      border: none;
      border-radius: 2px;
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.1s;
    }
    
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .btn-secondary {
      background: var(--vscode-input-bg);
      color: var(--vscode-text);
      border: 1px solid var(--vscode-border);
    }
    
    .btn-secondary:hover:not(:disabled) {
      background: #4a4a4a;
    }
    
    .btn-primary {
      background: var(--vscode-accent);
      color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
      background: var(--vscode-accent-hover);
    }
    
    .status {
      font-size: 11px;
      color: var(--vscode-text-muted);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .status.success { color: var(--vscode-success); }
  </style>
</head>
<body>
  <div class="header">
    <span class="header-icon">👋</span>
    <div>
      <div class="greeting" id="greeting">Hello, World!</div>
      <div class="subtitle">MCP UI Playground</div>
    </div>
  </div>
  
  <div class="form-group">
    <input type="text" id="nameInput" placeholder="Enter name..." value="World" disabled />
    <button class="btn-secondary" id="greetBtn" onclick="greetAgain()" disabled>Preview</button>
    <button class="btn-primary" id="submitBtn" onclick="submitForm()" disabled>Send</button>
  </div>
  
  <div class="status" id="status">Initializing...</div>

  <script>
    // ============================================
    // MCP Apps Extension (SEP-1865) Implementation
    // ============================================
    
    let nextRequestId = 1;
    const pendingRequests = new Map();
    let hostContext = null;
    let isInitialized = false;
    let currentName = 'World';
    
    // Generate unique request ID
    function generateId() {
      return nextRequestId++;
    }
    
    // Send JSON-RPC request to host and return promise
    function sendRequest(method, params) {
      const id = generateId();
      const request = {
        jsonrpc: '2.0',
        id: id,
        method: method,
        params: params || {}
      };
      
      return new Promise((resolve, reject) => {
        pendingRequests.set(id, { resolve, reject });
        window.parent.postMessage(request, '*');
      });
    }
    
    // Send JSON-RPC notification to host (no response expected)
    function sendNotification(method, params) {
      const notification = {
        jsonrpc: '2.0',
        method: method,
        params: params || {}
      };
      window.parent.postMessage(notification, '*');
    }
    
    // Listen for messages from the MCP host
    window.addEventListener('message', (event) => {
      try {
        const message = event.data;
        
        // Must be a JSON-RPC 2.0 message
        if (!message || message.jsonrpc !== '2.0') {
          return;
        }
        
        // Handle response to our request
        if (message.id !== undefined && (message.result !== undefined || message.error)) {
          const pending = pendingRequests.get(message.id);
          if (pending) {
            pendingRequests.delete(message.id);
            if (message.error) {
              pending.reject(new Error(message.error.message || 'Unknown error'));
            } else {
              pending.resolve(message.result);
            }
          }
          return;
        }
        
        // Handle notifications from host
        if (message.method) {
          handleHostNotification(message.method, message.params);
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });
    
    // Handle notifications from the host
    function handleHostNotification(method, params) {
      switch (method) {
        case 'ui/notifications/tool-input-partial':
          // Optional: Handle streaming tool input
          if (params?.arguments?.name) {
            updateGreeting(params.arguments.name);
          }
          break;
          
        case 'ui/notifications/tool-input':
          // Complete tool arguments received
          console.log('Tool input received:', params);
          if (params?.arguments) {
            currentName = params.arguments.name || 'World';
            updateGreeting(currentName);
            document.getElementById('nameInput').value = currentName;
          }
          updateStatus('Ready');
          break;
          
        case 'ui/notifications/tool-result':
          // Tool execution completed
          console.log('Tool result received:', params);
          if (params?.structuredContent?.name) {
            updateGreeting(params.structuredContent.name);
          }
          updateStatus('Tool completed', true);
          break;
          
        case 'ui/notifications/tool-cancelled':
          // Tool execution was cancelled
          console.log('Tool cancelled:', params?.reason);
          updateStatus('Cancelled: ' + (params?.reason || 'Unknown reason'));
          break;
          
        case 'ui/notifications/host-context-changed':
          // Host context updated (theme, size, etc.)
          if (params) {
            hostContext = { ...hostContext, ...params };
            applyHostContext();
          }
          break;
          
        case 'ui/resource-teardown':
          // Host is about to tear down this UI
          console.log('Teardown requested:', params?.reason);
          // Could save state here if needed
          break;
          
        default:
          console.log('Unknown notification:', method, params);
      }
    }
    
    // Apply host context (theming, etc.)
    function applyHostContext() {
      if (!hostContext) return;
      
      // Apply theme
      if (hostContext.theme) {
        document.documentElement.style.colorScheme = hostContext.theme;
      }
      
      // Apply CSS variables from host
      if (hostContext.styles?.variables) {
        const root = document.documentElement;
        for (const [key, value] of Object.entries(hostContext.styles.variables)) {
          if (value) {
            root.style.setProperty(key, value);
          }
        }
      }
      
      // Apply custom fonts
      if (hostContext.styles?.css?.fonts) {
        const style = document.createElement('style');
        style.textContent = hostContext.styles.css.fonts;
        document.head.appendChild(style);
      }
    }
    
    // Update the greeting display
    function updateGreeting(name) {
      const safeName = escapeHtml(name);
      document.getElementById('greeting').textContent = 'Hello, ' + safeName + '!';
      document.title = 'Hello ' + safeName;
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    // Update status message
    function updateStatus(message, isSuccess = false) {
      const el = document.getElementById('status');
      el.textContent = message;
      el.className = 'status' + (isSuccess ? ' success' : '');
    }
    
    // Enable interactive controls
    function enableControls() {
      document.getElementById('nameInput').disabled = false;
      document.getElementById('greetBtn').disabled = false;
      document.getElementById('submitBtn').disabled = false;
    }
    
    // ============================================
    // User Interaction Handlers
    // ============================================
    
    // Preview greeting locally
    function greetAgain() {
      const name = document.getElementById('nameInput').value.trim();
      if (!name) {
        updateStatus('Please enter a name');
        return;
      }
      
      currentName = name;
      updateGreeting(name);
      updateStatus('Preview updated');
    }
    
    // Submit form and send message to chat
    async function submitForm() {
      const name = document.getElementById('nameInput').value.trim() || 'World';
      
      updateStatus('Sending...');
      
      // Disable controls to prevent double submission
      document.getElementById('submitBtn').disabled = true;
      document.getElementById('nameInput').disabled = true;
      document.getElementById('greetBtn').disabled = true;
      
      try {
        // Send ui/message to add content to the chat input
        // This lets the user review and send the message
        const result = await sendRequest('ui/message', {
          content: [
            {
              type: 'text',
              text: 'User selected name: ' + name + '\\n\\nPlease greet them with: Hello, ' + name + '!'
            }
          ]
        });
        
        if (result?.isError) {
          throw new Error('Host rejected the message');
        }
        
        updateStatus('Message sent', true);
        
        // Re-enable controls for further interactions
        setTimeout(() => {
          document.getElementById('submitBtn').disabled = false;
          document.getElementById('nameInput').disabled = false;
          document.getElementById('greetBtn').disabled = false;
        }, 1000);
        
      } catch (error) {
        console.error('Submit failed:', error);
        updateStatus('Error: ' + error.message);
        
        // Re-enable controls on error
        document.getElementById('submitBtn').disabled = false;
        document.getElementById('nameInput').disabled = false;
        document.getElementById('greetBtn').disabled = false;
      }
    }
    
    // ============================================
    // Initialization (SEP-1865 Lifecycle)
    // ============================================
    
    async function initialize() {
      try {
        updateStatus('Connecting to host...');
        
        // Step 1: Send ui/initialize request
        const initResult = await sendRequest('ui/initialize', {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: {
            name: 'mcp-ui-playground-greeting',
            version: '1.0.0'
          }
        });
        
        console.log('Initialize result:', initResult);
        
        // Store host context
        hostContext = initResult.hostContext || {};
        applyHostContext();
        
        // Step 2: Send ui/notifications/initialized notification
        sendNotification('ui/notifications/initialized', {});
        
        isInitialized = true;
        enableControls();
        updateStatus('Ready');
        
      } catch (error) {
        console.error('Initialization failed:', error);
        updateStatus('Standalone mode');
        
        // Enable controls anyway for standalone testing
        enableControls();
      }
    }
    
    // Start initialization when page loads
    initialize();
  <\/script>
</body>
</html>`;
}
/**
 * Escape HTML special characters
 */
export function escapeHtml(text) {
    const htmlEscapes = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    };
    return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}
