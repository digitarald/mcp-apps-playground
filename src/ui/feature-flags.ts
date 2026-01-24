/**
 * Feature Flag Selector UI
 * 
 * Compact picker for feature flags from services like LaunchDarkly/Unleash.
 * Demonstrates multi-select pattern with environment-aware status.
 */

export function FEATURE_FLAGS_UI(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feature Flags</title>
  <style>
    :root {
      --bg: #1e1e1e;
      --surface: #252526;
      --border: #3c3c3c;
      --text: #cccccc;
      --muted: #858585;
      --accent: #0078d4;
      --success: #4ec9b0;
      --warning: #ddb76f;
      --danger: #f14c4c;
      --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --mono: 'SF Mono', Consolas, monospace;
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg: #ffffff;
        --surface: #f5f5f5;
        --border: #e0e0e0;
        --text: #1e1e1e;
        --muted: #666666;
      }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font: 11px/1.4 var(--font);
      background: var(--bg);
      color: var(--text);
      padding: 8px;
      max-height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    /* Header row */
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      flex-shrink: 0;
    }
    .title { font-weight: 600; font-size: 12px; }
    .env-tabs {
      display: flex;
      gap: 2px;
      margin-left: auto;
    }
    .env-tab {
      padding: 2px 6px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: none;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      border-radius: 2px;
    }
    .env-tab:hover { background: var(--surface); }
    .env-tab.active {
      background: var(--accent);
      color: white;
    }
    
    /* Search */
    .search {
      display: flex;
      gap: 4px;
      margin-bottom: 6px;
      flex-shrink: 0;
    }
    .search input {
      flex: 1;
      padding: 4px 6px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 2px;
      color: var(--text);
      font: inherit;
      outline: none;
    }
    .search input:focus { border-color: var(--accent); }
    .search input::placeholder { color: var(--muted); }
    .tag-filter {
      display: flex;
      gap: 2px;
    }
    .tag-btn {
      padding: 2px 5px;
      font-size: 9px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 2px;
      color: var(--muted);
      cursor: pointer;
    }
    .tag-btn:hover, .tag-btn.active {
      border-color: var(--accent);
      color: var(--accent);
    }
    
    /* Flag list */
    .flags {
      flex: 1;
      overflow-y: auto;
      border: 1px solid var(--border);
      border-radius: 2px;
    }
    .flag {
      display: grid;
      grid-template-columns: 20px 1fr auto auto;
      align-items: center;
      gap: 6px;
      padding: 5px 6px;
      border-bottom: 1px solid var(--border);
      cursor: pointer;
      transition: background 0.1s;
    }
    .flag:last-child { border-bottom: none; }
    .flag:hover { background: var(--surface); }
    .flag.selected { background: color-mix(in srgb, var(--accent) 15%, transparent); }
    
    .flag-check {
      width: 14px;
      height: 14px;
      border: 1px solid var(--border);
      border-radius: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: transparent;
    }
    .flag.selected .flag-check {
      background: var(--accent);
      border-color: var(--accent);
      color: white;
    }
    
    .flag-info { min-width: 0; }
    .flag-key {
      font-family: var(--mono);
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .flag-desc {
      font-size: 9px;
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .flag-status {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 9px;
      font-family: var(--mono);
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .status-on { background: var(--success); }
    .status-off { background: var(--muted); }
    .status-partial { background: var(--warning); }
    
    .flag-tags {
      display: flex;
      gap: 2px;
    }
    .flag-tag {
      padding: 1px 4px;
      font-size: 8px;
      background: var(--surface);
      border-radius: 2px;
      color: var(--muted);
    }
    
    /* Footer */
    .footer {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid var(--border);
      flex-shrink: 0;
    }
    .selected-count {
      font-size: 10px;
      color: var(--muted);
    }
    .selected-count strong {
      color: var(--text);
    }
    .spacer { flex: 1; }
    button {
      padding: 4px 10px;
      font: 10px var(--font);
      border: none;
      border-radius: 2px;
      cursor: pointer;
    }
    .btn-secondary {
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-secondary:hover { background: var(--border); }
    .btn-primary {
      background: var(--accent);
      color: white;
    }
    .btn-primary:hover { background: #1c8ae6; }
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    /* Status indicator */
    .status-bar {
      font-size: 9px;
      color: var(--muted);
    }
    .status-bar.success { color: var(--success); }
  </style>
</head>
<body>
  <div class="header">
    <span class="title">🚩 Feature Flags</span>
    <div class="env-tabs">
      <button class="env-tab active" data-env="production">prod</button>
      <button class="env-tab" data-env="staging">stage</button>
      <button class="env-tab" data-env="development">dev</button>
    </div>
  </div>
  
  <div class="search">
    <input type="text" id="searchInput" placeholder="Search flags..." />
    <div class="tag-filter">
      <button class="tag-btn" data-tag="experiment">exp</button>
      <button class="tag-btn" data-tag="rollout">roll</button>
      <button class="tag-btn" data-tag="ops">ops</button>
    </div>
  </div>
  
  <div class="flags" id="flagList"></div>
  
  <div class="footer">
    <span class="selected-count"><strong id="selectedCount">0</strong> selected</span>
    <span class="status-bar" id="status">Ready</span>
    <span class="spacer"></span>
    <button class="btn-secondary" onclick="clearSelection()">Clear</button>
    <button class="btn-primary" id="generateBtn" onclick="generateCode()" disabled>Generate Code</button>
  </div>

  <script>
    // Sample feature flags data (will be replaced via tool-input)
    let flags = [
      { key: 'checkout-v2', description: 'New checkout flow with saved cards', tags: ['experiment', 'payments'], status: { production: 'partial', staging: 'on', development: 'on' }, rollout: 25 },
      { key: 'dark-mode', description: 'Enable dark mode toggle in settings', tags: ['rollout'], status: { production: 'on', staging: 'on', development: 'on' }, rollout: 100 },
      { key: 'ai-suggestions', description: 'ML-powered product recommendations', tags: ['experiment', 'ml'], status: { production: 'off', staging: 'on', development: 'on' }, rollout: 0 },
      { key: 'rate-limit-v2', description: 'Adaptive rate limiting algorithm', tags: ['ops'], status: { production: 'partial', staging: 'on', development: 'on' }, rollout: 50 },
      { key: 'graphql-federation', description: 'Enable federated GraphQL gateway', tags: ['ops', 'api'], status: { production: 'off', staging: 'partial', development: 'on' }, rollout: 0 },
      { key: 'social-login', description: 'OAuth with Google, GitHub, Apple', tags: ['rollout', 'auth'], status: { production: 'on', staging: 'on', development: 'on' }, rollout: 100 },
      { key: 'realtime-collab', description: 'WebSocket-based real-time editing', tags: ['experiment'], status: { production: 'off', staging: 'off', development: 'on' }, rollout: 0 },
      { key: 'cdn-next', description: 'Next-gen CDN with edge compute', tags: ['ops', 'infra'], status: { production: 'partial', staging: 'on', development: 'on' }, rollout: 10 },
      { key: 'password-strength', description: 'Enhanced password requirements', tags: ['rollout', 'auth'], status: { production: 'on', staging: 'on', development: 'on' }, rollout: 100 },
      { key: 'analytics-v3', description: 'Event streaming analytics pipeline', tags: ['experiment', 'data'], status: { production: 'off', staging: 'partial', development: 'on' }, rollout: 0 },
      { key: 'user-segments', description: 'Dynamic user segmentation engine', tags: ['experiment', 'ml'], status: { production: 'partial', staging: 'on', development: 'on' }, rollout: 15 },
      { key: 'webhook-retry', description: 'Exponential backoff for webhooks', tags: ['ops'], status: { production: 'on', staging: 'on', development: 'on' }, rollout: 100 },
    ];
    
    let currentEnv = 'production';
    let selectedFlags = new Set();
    let searchTerm = '';
    let activeTag = null;
    let isInitialized = false;
    
    // MCP communication
    let nextRequestId = 1;
    const pendingRequests = new Map();
    
    function sendRequest(method, params) {
      const id = nextRequestId++;
      return new Promise((resolve, reject) => {
        pendingRequests.set(id, { resolve, reject });
        window.parent.postMessage({ jsonrpc: '2.0', id, method, params: params || {} }, '*');
      });
    }
    
    function sendNotification(method, params) {
      window.parent.postMessage({ jsonrpc: '2.0', method, params: params || {} }, '*');
    }
    
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg || msg.jsonrpc !== '2.0') return;
      
      if (msg.id !== undefined && pendingRequests.has(msg.id)) {
        const { resolve, reject } = pendingRequests.get(msg.id);
        pendingRequests.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
        return;
      }
      
      if (msg.method === 'ui/notifications/tool-input') {
        if (msg.params?.arguments?.flags) {
          flags = msg.params.arguments.flags;
          renderFlags();
        }
        updateStatus('Ready');
      }
    });
    
    // Render
    function renderFlags() {
      const list = document.getElementById('flagList');
      const filtered = flags.filter(f => {
        if (searchTerm && !f.key.includes(searchTerm) && !f.description.toLowerCase().includes(searchTerm)) return false;
        if (activeTag && !f.tags.includes(activeTag)) return false;
        return true;
      });
      
      list.innerHTML = filtered.map(f => {
        const status = f.status[currentEnv];
        const statusClass = status === 'on' ? 'status-on' : status === 'partial' ? 'status-partial' : 'status-off';
        const statusText = status === 'partial' ? f.rollout + '%' : status;
        const selected = selectedFlags.has(f.key) ? 'selected' : '';
        
        return \`
          <div class="flag \${selected}" data-key="\${f.key}" onclick="toggleFlag('\${f.key}')">
            <div class="flag-check">✓</div>
            <div class="flag-info">
              <div class="flag-key">\${f.key}</div>
              <div class="flag-desc">\${f.description}</div>
            </div>
            <div class="flag-status">
              <span class="status-dot \${statusClass}"></span>
              \${statusText}
            </div>
            <div class="flag-tags">
              \${f.tags.slice(0, 2).map(t => \`<span class="flag-tag">\${t}</span>\`).join('')}
            </div>
          </div>
        \`;
      }).join('');
      
      updateCount();
    }
    
    function toggleFlag(key) {
      if (selectedFlags.has(key)) {
        selectedFlags.delete(key);
      } else {
        selectedFlags.add(key);
      }
      renderFlags();
    }
    
    function updateCount() {
      document.getElementById('selectedCount').textContent = selectedFlags.size;
      document.getElementById('generateBtn').disabled = selectedFlags.size === 0;
    }
    
    function clearSelection() {
      selectedFlags.clear();
      renderFlags();
    }
    
    function updateStatus(msg, isSuccess = false) {
      const el = document.getElementById('status');
      el.textContent = msg;
      el.className = 'status-bar' + (isSuccess ? ' success' : '');
    }
    
    // Generate code and send to chat
    async function generateCode() {
      const selected = flags.filter(f => selectedFlags.has(f.key));
      if (selected.length === 0) return;
      
      updateStatus('Generating...');
      document.getElementById('generateBtn').disabled = true;
      
      const code = selected.map(f => {
        const envStatus = f.status[currentEnv];
        const comment = envStatus === 'off' ? ' // Currently OFF in ' + currentEnv : 
                       envStatus === 'partial' ? ' // ' + f.rollout + '% rollout' : '';
        return \`const \${toCamelCase(f.key)} = useFeatureFlag('\${f.key}');\${comment}\`;
      }).join('\\n');
      
      const message = \`Selected \${selected.length} feature flag(s) for \${currentEnv}:

\\\`\\\`\\\`typescript
import { useFeatureFlag } from '@your-org/feature-flags';

\${code}
\\\`\\\`\\\`

Flags selected:
\${selected.map(f => \`- **\${f.key}**: \${f.description} (\${f.status[currentEnv] === 'partial' ? f.rollout + '%' : f.status[currentEnv]})\`).join('\\n')}\`;
      
      try {
        await sendRequest('ui/message', {
          content: [{ type: 'text', text: message }]
        });
        updateStatus('Sent to chat', true);
      } catch (e) {
        updateStatus('Error: ' + e.message);
      }
      
      document.getElementById('generateBtn').disabled = false;
    }
    
    function toCamelCase(str) {
      return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    }
    
    // Event listeners
    document.getElementById('searchInput').addEventListener('input', (e) => {
      searchTerm = e.target.value.toLowerCase();
      renderFlags();
    });
    
    document.querySelectorAll('.env-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.env-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentEnv = tab.dataset.env;
        renderFlags();
      });
    });
    
    document.querySelectorAll('.tag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (activeTag === btn.dataset.tag) {
          activeTag = null;
          btn.classList.remove('active');
        } else {
          document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeTag = btn.dataset.tag;
        }
        renderFlags();
      });
    });
    
    // Initialize
    async function initialize() {
      try {
        updateStatus('Connecting...');
        await sendRequest('ui/initialize', {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'feature-flags-selector', version: '1.0.0' }
        });
        sendNotification('ui/notifications/initialized', {});
        isInitialized = true;
        updateStatus('Ready');
      } catch (e) {
        updateStatus('Standalone mode');
      }
      renderFlags();
    }
    
    initialize();
  <\/script>
</body>
</html>`;
}
