/**
 * List Sort UI Template
 * 
 * Interactive list sorting UI for MCP Apps (SEP-1865).
 * Users can drag to reorder items, save the sorted list, or ask the agent to sort.
 */

/**
 * Generate the List Sort UI HTML
 * Data comes via ui/notifications/tool-input
 */
export function LIST_SORT_UI(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sort List</title>
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
      --vscode-warning: #ddb300;
      --vscode-drag-bg: #094771;
      --vscode-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: var(--vscode-font);
      font-size: 13px;
      background: var(--vscode-bg);
      color: var(--vscode-text);
      padding: 12px;
      min-height: 100vh;
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
    
    .title {
      font-size: 14px;
      font-weight: 600;
      color: var(--vscode-text);
    }
    
    .subtitle {
      font-size: 11px;
      color: var(--vscode-text-muted);
      margin-top: 2px;
    }
    
    .list-container {
      background: var(--vscode-editor-bg);
      border: 1px solid var(--vscode-border);
      border-radius: 4px;
      margin-bottom: 12px;
      max-height: 300px;
      overflow-y: auto;
    }
    
    .list-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--vscode-border);
      cursor: grab;
      user-select: none;
      transition: background 0.1s;
    }
    
    .list-item:last-child {
      border-bottom: none;
    }
    
    .list-item:hover {
      background: var(--vscode-input-bg);
    }
    
    .list-item.dragging {
      opacity: 0.5;
      background: var(--vscode-drag-bg);
    }
    
    .list-item.drag-over {
      border-top: 2px solid var(--vscode-accent);
    }
    
    .drag-handle {
      color: var(--vscode-text-muted);
      font-size: 14px;
      cursor: grab;
    }
    
    .item-index {
      color: var(--vscode-text-muted);
      font-size: 11px;
      min-width: 20px;
    }
    
    .item-label {
      flex: 1;
    }
    
    .item-id {
      font-size: 11px;
      color: var(--vscode-text-muted);
      font-family: monospace;
    }
    
    .actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    
    button {
      padding: 5px 12px;
      border: none;
      border-radius: 2px;
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.1s;
      display: flex;
      align-items: center;
      gap: 4px;
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
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .status.success { color: var(--vscode-success); }
    .status.warning { color: var(--vscode-warning); }
    
    .empty-state {
      padding: 24px;
      text-align: center;
      color: var(--vscode-text-muted);
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="header-icon">📋</span>
    <div>
      <div class="title" id="title">Sort List</div>
      <div class="subtitle">Drag items to reorder</div>
    </div>
  </div>
  
  <div class="list-container" id="listContainer">
    <div class="empty-state">Loading items...</div>
  </div>
  
  <div class="actions">
    <button class="btn-primary" id="saveBtn" onclick="saveOrder()" disabled>
      💾 Save Order
    </button>
    <button class="btn-secondary" id="askAIBtn" onclick="askAIToSort()" disabled>
      🤖 Ask AI to Sort
    </button>
    <button class="btn-secondary" id="resetBtn" onclick="resetOrder()" disabled>
      ↩️ Reset
    </button>
  </div>
  
  <div class="status" id="status">Initializing...</div>

  <script>
    // ============================================
    // MCP Apps Extension Implementation
    // ============================================
    
    let nextRequestId = 1;
    const pendingRequests = new Map();
    let hostContext = null;
    let isInitialized = false;
    
    // List state
    let originalItems = [];  // Original order for reset
    let currentItems = [];   // Current order
    let draggedItem = null;
    
    function generateId() {
      return nextRequestId++;
    }
    
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
    
    function sendNotification(method, params) {
      const notification = {
        jsonrpc: '2.0',
        method: method,
        params: params || {}
      };
      window.parent.postMessage(notification, '*');
    }
    
    window.addEventListener('message', (event) => {
      try {
        const message = event.data;
        if (!message || message.jsonrpc !== '2.0') return;
        
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
        
        if (message.method) {
          handleHostNotification(message.method, message.params);
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });
    
    function handleHostNotification(method, params) {
      switch (method) {
        case 'ui/notifications/tool-input':
          console.log('Tool input received:', params);
          if (params?.arguments?.items) {
            setItems(params.arguments.items);
          }
          if (params?.arguments?.title) {
            document.getElementById('title').textContent = params.arguments.title;
          }
          updateStatus('Ready - drag items to reorder');
          break;
          
        case 'ui/notifications/tool-result':
          console.log('Tool result received:', params);
          updateStatus('Order saved', true);
          break;
          
        case 'ui/notifications/host-context-changed':
          if (params) {
            hostContext = { ...hostContext, ...params };
            applyHostContext();
          }
          break;
          
        default:
          console.log('Unknown notification:', method, params);
      }
    }
    
    function applyHostContext() {
      if (!hostContext) return;
      
      if (hostContext.theme) {
        document.documentElement.style.colorScheme = hostContext.theme;
      }
      
      if (hostContext.styles?.variables) {
        const root = document.documentElement;
        for (const [key, value] of Object.entries(hostContext.styles.variables)) {
          if (value) root.style.setProperty(key, value);
        }
      }
    }
    
    // ============================================
    // List Rendering & Drag-Drop
    // ============================================
    
    function setItems(items) {
      // Items come as [{id: string, label: string}, ...]
      originalItems = [...items];
      currentItems = [...items];
      renderList();
      enableControls();
    }
    
    function renderList() {
      const container = document.getElementById('listContainer');
      
      if (currentItems.length === 0) {
        container.innerHTML = '<div class="empty-state">No items to sort</div>';
        return;
      }
      
      container.innerHTML = currentItems.map((item, index) => \`
        <div class="list-item" 
             data-index="\${index}" 
             draggable="true"
             ondragstart="handleDragStart(event)"
             ondragover="handleDragOver(event)"
             ondragleave="handleDragLeave(event)"
             ondrop="handleDrop(event)"
             ondragend="handleDragEnd(event)">
          <span class="drag-handle">⋮⋮</span>
          <span class="item-index">\${index + 1}.</span>
          <span class="item-label">\${escapeHtml(item.label)}</span>
          <span class="item-id">\${escapeHtml(item.id)}</span>
        </div>
      \`).join('');
    }
    
    function handleDragStart(e) {
      draggedItem = e.target.closest('.list-item');
      draggedItem.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draggedItem.dataset.index);
    }
    
    function handleDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const target = e.target.closest('.list-item');
      if (target && target !== draggedItem) {
        target.classList.add('drag-over');
      }
    }
    
    function handleDragLeave(e) {
      const target = e.target.closest('.list-item');
      if (target) {
        target.classList.remove('drag-over');
      }
    }
    
    function handleDrop(e) {
      e.preventDefault();
      const target = e.target.closest('.list-item');
      if (!target || target === draggedItem) return;
      
      target.classList.remove('drag-over');
      
      const fromIndex = parseInt(draggedItem.dataset.index);
      const toIndex = parseInt(target.dataset.index);
      
      // Reorder items
      const [movedItem] = currentItems.splice(fromIndex, 1);
      currentItems.splice(toIndex, 0, movedItem);
      
      renderList();
      checkForChanges();
    }
    
    function handleDragEnd(e) {
      document.querySelectorAll('.list-item').forEach(item => {
        item.classList.remove('dragging', 'drag-over');
      });
      draggedItem = null;
    }
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    // ============================================
    // Actions
    // ============================================
    
    function checkForChanges() {
      const hasChanges = JSON.stringify(currentItems) !== JSON.stringify(originalItems);
      document.getElementById('resetBtn').disabled = !hasChanges;
      
      if (hasChanges) {
        updateStatus('Order changed - save to confirm', false, true);
      } else {
        updateStatus('Ready - drag items to reorder');
      }
    }
    
    async function saveOrder() {
      updateStatus('Sending sorted list...');
      disableControls();
      
      try {
        // Format the sorted list for the agent
        const sortedList = currentItems.map((item, i) => \`\${i + 1}. \${item.label} (id: \${item.id})\`).join('\\n');
        
        await sendRequest('ui/message', {
          content: [
            {
              type: 'text',
              text: \`User sorted the list. New order:\\n\\n\${sortedList}\\n\\nPlease proceed with this order.\`
            }
          ]
        });
        
        // Update original to match current (saved state)
        originalItems = [...currentItems];
        updateStatus('Order sent to agent', true);
        
        setTimeout(enableControls, 1000);
      } catch (error) {
        console.error('Save failed:', error);
        updateStatus('Error: ' + error.message);
        enableControls();
      }
    }
    
    async function askAIToSort() {
      updateStatus('Asking AI to sort...');
      disableControls();
      
      try {
        const itemsList = currentItems.map(item => \`- \${item.label} (id: \${item.id})\`).join('\\n');
        
        await sendRequest('ui/message', {
          content: [
            {
              type: 'text',
              text: \`Please sort this list in a logical order and explain your reasoning:\\n\\n\${itemsList}\`
            }
          ]
        });
        
        updateStatus('Request sent to agent', true);
        setTimeout(enableControls, 1000);
      } catch (error) {
        console.error('Ask AI failed:', error);
        updateStatus('Error: ' + error.message);
        enableControls();
      }
    }
    
    function resetOrder() {
      currentItems = [...originalItems];
      renderList();
      updateStatus('Order reset to original');
      document.getElementById('resetBtn').disabled = true;
    }
    
    // ============================================
    // UI Helpers
    // ============================================
    
    function updateStatus(message, isSuccess = false, isWarning = false) {
      const el = document.getElementById('status');
      el.textContent = message;
      el.className = 'status' + (isSuccess ? ' success' : '') + (isWarning ? ' warning' : '');
    }
    
    function enableControls() {
      document.getElementById('saveBtn').disabled = false;
      document.getElementById('askAIBtn').disabled = false;
      checkForChanges();
    }
    
    function disableControls() {
      document.getElementById('saveBtn').disabled = true;
      document.getElementById('askAIBtn').disabled = true;
      document.getElementById('resetBtn').disabled = true;
    }
    
    // ============================================
    // Initialization
    // ============================================
    
    async function initialize() {
      try {
        updateStatus('Connecting to host...');
        
        const initResult = await sendRequest('ui/initialize', {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: {
            name: 'mcp-apps-playground-list-sort',
            version: '1.0.0'
          }
        });
        
        hostContext = initResult.hostContext || {};
        applyHostContext();
        
        sendNotification('ui/notifications/initialized', {});
        
        isInitialized = true;
        updateStatus('Waiting for items...');
        
      } catch (error) {
        console.error('Initialization failed:', error);
        updateStatus('Standalone mode');
        
        // Demo data for standalone testing
        setItems([
          { id: 'item-1', label: 'First item' },
          { id: 'item-2', label: 'Second item' },
          { id: 'item-3', label: 'Third item' },
        ]);
      }
    }
    
    initialize();
  <\/script>
</body>
</html>`;
}
