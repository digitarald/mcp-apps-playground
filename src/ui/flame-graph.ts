/**
 * Flame Graph UI Template
 * 
 * An elegant, Tufte-inspired flame graph visualization for profiling data.
 * Designed with high data-ink ratio, minimal chrome, and warm color palette.
 * 
 * MCP Apps Extension (SEP-1865) implementation.
 */

/**
 * Generate the Flame Graph UI HTML
 * Data comes via ui/notifications/tool-input
 */
export function FLAME_GRAPH_UI(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flame Graph</title>
  <style>
    /* Tufte-inspired palette: warm, muted, high contrast where it matters */
    :root {
      --bg: #faf9f7;
      --bg-subtle: #f5f4f2;
      --text: #333;
      --text-muted: #666;
      --text-faint: #999;
      --accent: #c25450;
      --accent-hover: #a8423f;
      
      /* Flame gradient - warm earth tones */
      --flame-user-1: #e8c4a0;
      --flame-user-2: #dda667;
      --flame-user-3: #d18a3d;
      --flame-user-4: #c46d23;
      --flame-lib: #9db5c9;
      --flame-hot: #c25450;
      --flame-hover: rgba(0,0,0,0.08);
      
      /* Typography */
      --font-serif: 'Georgia', 'Times New Roman', serif;
      --font-mono: 'SF Mono', 'Menlo', 'Monaco', monospace;
      --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      
      color-scheme: light dark;
    }
    
    /* Dark mode overrides */
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1a1918;
        --bg-subtle: #242322;
        --text: #e8e6e3;
        --text-muted: #a8a6a3;
        --text-faint: #6a6865;
        --flame-user-1: #5c4a3a;
        --flame-user-2: #6d5a42;
        --flame-user-3: #7d6a4a;
        --flame-user-4: #8d7a52;
        --flame-lib: #3a4a5c;
        --flame-hot: #a84440;
        --flame-hover: rgba(255,255,255,0.1);
      }
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: var(--font-sans);
      font-size: 11px;
      background: var(--bg);
      color: var(--text);
      padding: 8px 12px;
      line-height: 1.4;
    }
    
    /* Dense header row */
    .header-row {
      display: flex;
      align-items: baseline;
      gap: 16px;
      margin-bottom: 6px;
      flex-wrap: wrap;
    }
    
    h1 {
      font-family: var(--font-serif);
      font-size: 14px;
      font-weight: 400;
      letter-spacing: -0.02em;
      color: var(--text);
    }
    
    .subtitle {
      font-size: 10px;
      color: var(--text-faint);
      font-family: var(--font-mono);
    }
    
    /* Inline stats */
    .stats {
      display: flex;
      gap: 12px;
      margin-left: auto;
    }
    
    .stat {
      display: flex;
      align-items: baseline;
      gap: 4px;
      font-family: var(--font-mono);
      font-size: 10px;
    }
    
    .stat-value {
      font-weight: 600;
      color: var(--text);
    }
    
    .stat-label {
      color: var(--text-faint);
      text-transform: lowercase;
    }
    
    /* Flame graph container */
    .flame-container {
      position: relative;
      background: var(--bg-subtle);
      border-radius: 2px;
      padding: 4px;
      margin-bottom: 6px;
      overflow-x: auto;
    }
    
    .flame-graph {
      position: relative;
      min-height: 120px;
    }
    
    /* Individual flame bars */
    .frame {
      position: absolute;
      height: 18px;
      border-radius: 1px;
      cursor: pointer;
      transition: filter 0.1s;
      display: flex;
      align-items: center;
      padding: 0 4px;
      overflow: hidden;
      white-space: nowrap;
      font-size: 10px;
      font-family: var(--font-mono);
      color: var(--text);
      border-left: 1px solid rgba(255,255,255,0.15);
      border-right: 1px solid rgba(0,0,0,0.08);
    }
    
    .frame:hover {
      filter: brightness(1.1);
      z-index: 10;
    }
    
    .frame.hot {
      background: var(--flame-hot) !important;
      color: white;
    }
    
    .frame.library {
      background: var(--flame-lib);
    }
    
    .frame-label {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    /* Tooltip - Tufte sidenote style */
    .tooltip {
      position: fixed;
      background: var(--bg);
      border: 1px solid var(--text-faint);
      border-radius: 2px;
      padding: 8px 12px;
      font-size: 11px;
      max-width: 320px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      pointer-events: none;
      z-index: 100;
      display: none;
    }
    
    .tooltip-title {
      font-family: var(--font-mono);
      font-weight: 500;
      margin-bottom: 4px;
      word-break: break-all;
    }
    
    .tooltip-file {
      font-family: var(--font-mono);
      font-size: 10px;
      color: var(--text-muted);
      margin-bottom: 6px;
    }
    
    .tooltip-stats {
      display: flex;
      gap: 16px;
      border-top: 1px solid var(--text-faint);
      padding-top: 6px;
      margin-top: 6px;
    }
    
    .tooltip-stat {
      display: flex;
      flex-direction: column;
    }
    
    .tooltip-stat-value {
      font-family: var(--font-mono);
      font-weight: 500;
    }
    
    .tooltip-stat-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-faint);
    }
    
    /* Breadcrumb navigation */
    .breadcrumb {
      font-size: 10px;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }
    
    .breadcrumb a {
      color: var(--accent);
      text-decoration: none;
      cursor: pointer;
    }
    
    .breadcrumb a:hover {
      text-decoration: underline;
    }
    
    .breadcrumb span {
      color: var(--text-faint);
      margin: 0 3px;
    }
    
    /* Footer row: breadcrumb + legend + actions */
    .footer-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    
    .actions {
      display: flex;
      gap: 6px;
      align-items: center;
      margin-left: auto;
    }
    
    button {
      font-family: var(--font-sans);
      font-size: 10px;
      padding: 3px 8px;
      border: 1px solid var(--text-faint);
      background: var(--bg);
      color: var(--text);
      border-radius: 2px;
      cursor: pointer;
      transition: all 0.1s;
    }
    
    button:hover:not(:disabled) {
      border-color: var(--text-muted);
      background: var(--bg-subtle);
    }
    
    button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    
    button.primary {
      background: var(--accent);
      border-color: var(--accent);
      color: white;
    }
    
    button.primary:hover:not(:disabled) {
      background: var(--accent-hover);
      border-color: var(--accent-hover);
    }
    
    /* Legend - tiny inline */
    .legend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 9px;
      color: var(--text-faint);
    }
    
    .legend-swatch {
      width: 8px;
      height: 8px;
      border-radius: 1px;
      margin-left: 6px;
    }
    
    .legend-swatch:first-child {
      margin-left: 0;
    }
    
    .swatch-user { background: var(--flame-user-3); }
    .swatch-lib { background: var(--flame-lib); }
    .swatch-hot { background: var(--flame-hot); }
  </style>
</head>
<body>
  <div class="header-row">
    <h1 id="title">Profile</h1>
    <span class="subtitle" id="subtitle"></span>
    <div class="stats">
      <div class="stat"><span class="stat-value" id="totalTime">—</span><span class="stat-label">total</span></div>
      <div class="stat"><span class="stat-value" id="selfTime">—</span><span class="stat-label">hot</span></div>
      <div class="stat"><span class="stat-value" id="frameCount">—</span><span class="stat-label">frames</span></div>
    </div>
    <div class="actions">
      <button id="resetBtn" onclick="resetZoom()" disabled>Reset</button>
      <button id="analyzeBtn" onclick="analyzeHotPath()" class="primary" disabled>Analyze</button>
    </div>
  </div>
  
  <div class="flame-container">
    <div class="flame-graph" id="flameGraph"></div>
  </div>
  
  <div class="footer-row">
    <div class="breadcrumb" id="breadcrumb"><a onclick="resetZoom()">root</a></div>
    <div class="legend">
      <span class="legend-swatch swatch-user"></span>user
      <span class="legend-swatch swatch-lib"></span>lib
      <span class="legend-swatch swatch-hot"></span>hot
    </div>
  </div>
  
  <div class="tooltip" id="tooltip"></div>

  <script>
    // ============================================
    // MCP Apps Extension Implementation
    // ============================================
    
    let nextRequestId = 1;
    const pendingRequests = new Map();
    let hostContext = null;
    let isInitialized = false;
    
    // Flame graph state
    let profileData = null;
    let zoomStack = [];
    let currentRoot = null;
    
    function generateId() { return nextRequestId++; }
    
    function sendRequest(method, params) {
      const id = generateId();
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
      if (!msg?.jsonrpc) return;
      
      if (msg.id !== undefined) {
        const pending = pendingRequests.get(msg.id);
        if (pending) {
          pendingRequests.delete(msg.id);
          msg.error ? pending.reject(new Error(msg.error.message)) : pending.resolve(msg.result);
        }
        return;
      }
      
      if (msg.method) handleNotification(msg.method, msg.params);
    });
    
    function handleNotification(method, params) {
      switch (method) {
        case 'ui/notifications/tool-input':
          if (params?.arguments) {
            loadProfile(params.arguments);
          }
          break;
        case 'ui/notifications/host-context-changed':
          if (params) {
            hostContext = { ...hostContext, ...params };
            applyTheme();
          }
          break;
      }
    }
    
    function applyTheme() {
      if (hostContext?.theme) {
        document.documentElement.style.colorScheme = hostContext.theme;
      }
    }
    
    // ============================================
    // Flame Graph Rendering
    // ============================================
    
    function loadProfile(args) {
      profileData = args.profile || generateSimulatedProfile();
      currentRoot = profileData;
      
      document.getElementById('title').textContent = args.title || 'Performance Profile';
      document.getElementById('subtitle').textContent = args.filename || 'CPU Profile';
      
      renderStats();
      renderFlameGraph();
      enableControls();
      updateStatus('Ready');
    }
    
    function generateSimulatedProfile() {
      // Simulated call hierarchy - realistic Node.js server profile
      return {
        name: '(root)',
        file: '',
        self: 0,
        total: 3850,
        children: [
          {
            name: 'main',
            file: 'src/index.ts:12',
            self: 5,
            total: 3850,
            children: [
              {
                name: 'handleRequest',
                file: 'src/server.ts:45',
                self: 12,
                total: 1780,
                children: [
                  {
                    name: 'authenticate',
                    file: 'src/auth/middleware.ts:23',
                    self: 35,
                    total: 420,
                    children: [
                      { 
                        name: 'jwt.verify', 
                        file: 'node_modules/jsonwebtoken/verify.js:45', 
                        self: 180, 
                        total: 310, 
                        library: true,
                        children: [
                          { name: 'crypto.createHmac', file: '[native]', self: 85, total: 85, library: true, children: [] },
                          { name: 'Buffer.from', file: '[native]', self: 45, total: 45, library: true, children: [] }
                        ]
                      },
                      { name: 'UserCache.get', file: 'src/cache/users.ts:67', self: 35, total: 75, children: [
                        { name: 'redis.get', file: 'node_modules/ioredis/index.js:234', self: 25, total: 40, library: true, children: [
                          { name: 'net.Socket.write', file: '[native]', self: 15, total: 15, library: true, children: [] }
                        ]}
                      ]}
                    ]
                  },
                  {
                    name: 'parseRequestBody',
                    file: 'src/utils/parser.ts:23',
                    self: 45,
                    total: 380,
                    children: [
                      { name: 'JSON.parse', file: '[native]', self: 115, total: 115, library: true, children: [] },
                      { 
                        name: 'validateSchema', 
                        file: 'src/validation.ts:78', 
                        self: 65, 
                        total: 220,
                        children: [
                          { name: 'ajv.validate', file: 'node_modules/ajv/dist/ajv.js:234', self: 95, total: 155, library: true, children: [
                            { name: 'RegExp.test', file: '[native]', self: 40, total: 40, library: true, children: [] },
                            { name: 'Object.keys', file: '[native]', self: 20, total: 20, library: true, children: [] }
                          ]}
                        ]
                      }
                    ]
                  },
                  {
                    name: 'executeBusinessLogic',
                    file: 'src/services/orders.ts:156',
                    self: 28,
                    total: 680,
                    children: [
                      { 
                        name: 'OrderRepository.findMany', 
                        file: 'src/repositories/orders.ts:89', 
                        self: 25, 
                        total: 380, 
                        children: [
                          { name: 'prisma.query', file: 'node_modules/@prisma/client/runtime.js:1234', self: 185, total: 320, library: true, children: [
                            { name: 'pg.query', file: 'node_modules/pg/lib/client.js:45', self: 95, total: 135, library: true, children: [
                              { name: 'net.Socket.write', file: '[native]', self: 40, total: 40, library: true, children: [] }
                            ]}
                          ]},
                          { name: 'transformResults', file: 'src/repositories/orders.ts:145', self: 35, total: 35, children: [] }
                        ]
                      },
                      { name: 'calculateTotals', file: 'src/services/orders.ts:234', self: 140, total: 175, children: [
                        { name: 'Decimal.mul', file: 'node_modules/decimal.js/decimal.js:567', self: 35, total: 35, library: true, children: [] }
                      ]},
                      { name: 'applyDiscounts', file: 'src/services/pricing.ts:89', self: 75, total: 125, children: [
                        { name: 'RuleEngine.evaluate', file: 'src/engine/rules.ts:45', self: 35, total: 50, children: [
                          { name: 'vm.runInContext', file: '[native]', self: 15, total: 15, library: true, children: [] }
                        ]}
                      ]}
                    ]
                  },
                  {
                    name: 'formatResponse',
                    file: 'src/utils/response.ts:34',
                    self: 55,
                    total: 288,
                    children: [
                      { name: 'serializeEntities', file: 'src/serializers/order.ts:23', self: 85, total: 175, children: [
                        { name: 'dayjs.format', file: 'node_modules/dayjs/index.js:123', self: 50, total: 90, library: true, children: [
                          { name: 'Date.toISOString', file: '[native]', self: 40, total: 40, library: true, children: [] }
                        ]}
                      ]},
                      { name: 'JSON.stringify', file: '[native]', self: 58, total: 58, library: true, children: [] }
                    ]
                  }
                ]
              },
              {
                name: 'processWebhooks',
                file: 'src/webhooks/processor.ts:34',
                self: 18,
                total: 720,
                children: [
                  {
                    name: 'WebhookQueue.process',
                    file: 'src/queues/webhook.ts:89',
                    self: 32,
                    total: 480,
                    children: [
                      { name: 'fetch', file: '[native]', self: 220, total: 320, library: true, children: [
                        { name: 'TLSSocket.write', file: '[native]', self: 60, total: 100, library: true, children: [
                          { name: 'crypto.createCipheriv', file: '[native]', self: 40, total: 40, library: true, children: [] }
                        ]}
                      ]},
                      { name: 'signPayload', file: 'src/webhooks/signing.ts:12', self: 65, total: 128, children: [
                        { name: 'crypto.createHmac', file: '[native]', self: 43, total: 63, library: true, children: [
                          { name: 'Buffer.concat', file: '[native]', self: 20, total: 20, library: true, children: [] }
                        ]}
                      ]}
                    ]
                  },
                  { name: 'WebhookLog.create', file: 'src/models/webhookLog.ts:45', self: 55, total: 222, children: [
                    { name: 'prisma.create', file: 'node_modules/@prisma/client/runtime.js:2345', self: 115, total: 167, library: true, children: [
                      { name: 'pg.query', file: 'node_modules/pg/lib/client.js:45', self: 32, total: 52, library: true, children: [
                        { name: 'net.Socket.write', file: '[native]', self: 20, total: 20, library: true, children: [] }
                      ]}
                    ]}
                  ]}
                ]
              },
              {
                name: 'runScheduledJobs',
                file: 'src/jobs/scheduler.ts:23',
                self: 15,
                total: 480,
                children: [
                  { name: 'CleanupJob.execute', file: 'src/jobs/cleanup.ts:34', self: 25, total: 240, children: [
                    { name: 'prisma.deleteMany', file: 'node_modules/@prisma/client/runtime.js:3456', self: 145, total: 215, library: true, children: [
                      { name: 'pg.query', file: 'node_modules/pg/lib/client.js:45', self: 45, total: 70, library: true, children: [
                        { name: 'net.Socket.write', file: '[native]', self: 25, total: 25, library: true, children: [] }
                      ]}
                    ]}
                  ]},
                  { name: 'MetricsJob.execute', file: 'src/jobs/metrics.ts:56', self: 55, total: 225, children: [
                    { name: 'prometheus.collect', file: 'node_modules/prom-client/lib/registry.js:78', self: 85, total: 170, library: true, children: [
                      { name: 'process.memoryUsage', file: '[native]', self: 45, total: 45, library: true, children: [] },
                      { name: 'process.cpuUsage', file: '[native]', self: 40, total: 40, library: true, children: [] }
                    ]}
                  ]}
                ]
              },
              {
                name: 'handleEventLoop',
                file: 'src/events/loop.ts:12',
                self: 22,
                total: 520,
                children: [
                  { name: 'EventEmitter.emit', file: '[native]', self: 75, total: 185, library: true, children: [
                    { name: 'listeners.forEach', file: '[native]', self: 65, total: 110, library: true, children: [
                      { name: 'Function.call', file: '[native]', self: 45, total: 45, library: true, children: [] }
                    ]}
                  ]},
                  { name: 'processTimers', file: 'src/events/timers.ts:34', self: 45, total: 168, children: [
                    { name: 'setTimeout.callback', file: '[native]', self: 78, total: 123, library: true, children: [
                      { name: 'Promise.resolve', file: '[native]', self: 45, total: 45, library: true, children: [] }
                    ]}
                  ]},
                  { name: 'drainMicrotasks', file: '[native]', self: 95, total: 145, library: true, children: [
                    { name: 'Promise.then', file: '[native]', self: 50, total: 50, library: true, children: [] }
                  ]}
                ]
              },
              {
                name: 'gc',
                file: '[native]',
                self: 180,
                total: 350,
                library: true,
                children: [
                  { name: 'markSweep', file: '[native]', self: 95, total: 95, library: true, children: [] },
                  { name: 'scavenge', file: '[native]', self: 75, total: 75, library: true, children: [] }
                ]
              }
            ]
          }
        ]
      };
    }
    
    function renderStats() {
      const total = currentRoot.total;
      const hotPath = findHotPath(currentRoot);
      const frames = countFrames(currentRoot);
      
      document.getElementById('totalTime').textContent = formatTime(total);
      document.getElementById('selfTime').textContent = hotPath.name;
      document.getElementById('frameCount').textContent = frames.toString();
    }
    
    function findHotPath(node) {
      let hot = node;
      let stack = [node];
      while (stack.length) {
        const current = stack.pop();
        if (current.self > hot.self) hot = current;
        if (current.children) stack.push(...current.children);
      }
      return hot;
    }
    
    function countFrames(node) {
      let count = 1;
      if (node.children) {
        for (const child of node.children) {
          count += countFrames(child);
        }
      }
      return count;
    }
    
    function formatTime(ms) {
      if (ms >= 1000) return (ms / 1000).toFixed(1) + 's';
      return ms + 'ms';
    }
    
    function renderFlameGraph() {
      const container = document.getElementById('flameGraph');
      const totalWidth = container.clientWidth || 600;
      const rowHeight = 20;
      const gap = 2;
      
      // Calculate depth
      const maxDepth = getMaxDepth(currentRoot);
      container.style.height = (maxDepth * (rowHeight + gap)) + 'px';
      
      // Build HTML
      const frames = [];
      renderFrame(currentRoot, 0, 0, totalWidth, frames, rowHeight, gap, totalWidth);
      
      container.innerHTML = frames.join('');
      
      // Attach event listeners
      container.querySelectorAll('.frame').forEach(el => {
        el.addEventListener('mouseenter', showTooltip);
        el.addEventListener('mouseleave', hideTooltip);
        el.addEventListener('mousemove', moveTooltip);
        el.addEventListener('click', zoomToFrame);
      });
    }
    
    function getMaxDepth(node, depth = 0) {
      let max = depth + 1;
      if (node.children) {
        for (const child of node.children) {
          max = Math.max(max, getMaxDepth(child, depth + 1));
        }
      }
      return max;
    }
    
    function renderFrame(node, depth, x, availableWidth, frames, rowHeight, gap, totalWidth) {
      if (availableWidth < 2) return;
      
      const root = currentRoot;
      const pct = (node.total / root.total) * 100;
      const selfPct = (node.self / root.total) * 100;
      
      // Color based on type and heat
      let colorClass = '';
      let bgColor = '';
      
      if (selfPct > 15) {
        colorClass = 'hot';
      } else if (node.library) {
        colorClass = 'library';
      } else {
        // Gradient based on depth for user code
        const colors = ['var(--flame-user-1)', 'var(--flame-user-2)', 'var(--flame-user-3)', 'var(--flame-user-4)'];
        bgColor = colors[depth % colors.length];
      }
      
      const style = [
        'left:' + x + 'px',
        'top:' + (depth * (rowHeight + gap)) + 'px',
        'width:' + availableWidth + 'px',
        'height:' + rowHeight + 'px'
      ];
      
      if (bgColor) style.push('background:' + bgColor);
      
      const label = availableWidth > 40 ? escapeHtml(node.name) : '';
      
      frames.push(
        '<div class="frame ' + colorClass + '" style="' + style.join(';') + '" ' +
        'data-name="' + escapeAttr(node.name) + '" ' +
        'data-file="' + escapeAttr(node.file || '') + '" ' +
        'data-total="' + node.total + '" ' +
        'data-self="' + node.self + '" ' +
        'data-pct="' + pct.toFixed(1) + '">' +
        '<span class="frame-label">' + label + '</span></div>'
      );
      
      // Render children
      if (node.children) {
        let childX = x;
        for (const child of node.children) {
          const childWidth = (child.total / root.total) * totalWidth;
          renderFrame(child, depth + 1, childX, childWidth, frames, rowHeight, gap, totalWidth);
          childX += childWidth;
        }
      }
    }
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    function escapeAttr(text) {
      return text.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    
    // ============================================
    // Tooltip
    // ============================================
    
    function showTooltip(e) {
      const el = e.target.closest('.frame');
      if (!el) return;
      
      const name = el.dataset.name;
      const file = el.dataset.file;
      const total = parseInt(el.dataset.total);
      const self = parseInt(el.dataset.self);
      const pct = el.dataset.pct;
      
      const tooltip = document.getElementById('tooltip');
      tooltip.innerHTML = \`
        <div class="tooltip-title">\${escapeHtml(name)}</div>
        \${file ? '<div class="tooltip-file">' + escapeHtml(file) + '</div>' : ''}
        <div class="tooltip-stats">
          <div class="tooltip-stat">
            <span class="tooltip-stat-value">\${formatTime(total)}</span>
            <span class="tooltip-stat-label">Total (\${pct}%)</span>
          </div>
          <div class="tooltip-stat">
            <span class="tooltip-stat-value">\${formatTime(self)}</span>
            <span class="tooltip-stat-label">Self</span>
          </div>
        </div>
      \`;
      tooltip.style.display = 'block';
      positionTooltip(e);
    }
    
    function hideTooltip() {
      document.getElementById('tooltip').style.display = 'none';
    }
    
    function moveTooltip(e) {
      positionTooltip(e);
    }
    
    function positionTooltip(e) {
      const tooltip = document.getElementById('tooltip');
      const rect = tooltip.getBoundingClientRect();
      const padding = 12;
      
      let x = e.clientX + padding;
      let y = e.clientY + padding;
      
      // Keep within viewport
      const maxX = window.innerWidth - rect.width - padding;
      const maxY = window.innerHeight - rect.height - padding;
      
      if (x > maxX) x = e.clientX - rect.width - padding;
      if (y > maxY) y = e.clientY - rect.height - padding;
      
      // Ensure not negative
      x = Math.max(padding, x);
      y = Math.max(padding, y);
      
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
    }
    
    // ============================================
    // Zoom
    // ============================================
    
    function zoomToFrame(e) {
      const el = e.target.closest('.frame');
      if (!el) return;
      
      const name = el.dataset.name;
      const node = findNode(profileData, name);
      
      if (node && node.children && node.children.length > 0) {
        zoomStack.push(currentRoot);
        currentRoot = node;
        document.getElementById('resetBtn').disabled = false;
        updateBreadcrumb();
        renderStats();
        renderFlameGraph();
      }
    }
    
    function findNode(node, name) {
      if (node.name === name) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child, name);
          if (found) return found;
        }
      }
      return null;
    }
    
    function resetZoom() {
      zoomStack = [];
      currentRoot = profileData;
      document.getElementById('resetBtn').disabled = true;
      updateBreadcrumb();
      renderStats();
      renderFlameGraph();
    }
    
    function updateBreadcrumb() {
      const bc = document.getElementById('breadcrumb');
      const parts = ['<a onclick="resetZoom()">root</a>'];
      
      for (let i = 0; i < zoomStack.length; i++) {
        parts.push('<span>›</span>');
        parts.push('<span>' + escapeHtml(zoomStack[i].name) + '</span>');
      }
      
      if (currentRoot !== profileData) {
        parts.push('<span>›</span>');
        parts.push('<strong>' + escapeHtml(currentRoot.name) + '</strong>');
      }
      
      bc.innerHTML = parts.join('');
    }
    
    // ============================================
    // Actions
    // ============================================
    
    async function analyzeHotPath() {
      const hotPath = findHotPath(currentRoot);
      updateStatus('Sending to chat...');
      
      document.getElementById('analyzeBtn').disabled = true;
      
      try {
        const context = \`Function: \${hotPath.name}
File: \${hotPath.file || 'unknown'}  
Self time: \${formatTime(hotPath.self)} (\${((hotPath.self / profileData.total) * 100).toFixed(1)}% of total)
Total time: \${formatTime(hotPath.total)}\`;
        
        await sendRequest('ui/message', {
          content: [{
            type: 'text',
            text: \`The hot path in this profile is:\\n\\n\${context}\\n\\nPlease analyze this function and suggest optimizations.\`
          }]
        });
        
        updateStatus('Sent to chat');
        setTimeout(() => {
          document.getElementById('analyzeBtn').disabled = false;
          updateStatus('Ready');
        }, 1500);
        
      } catch (err) {
        updateStatus('Error: ' + err.message);
        document.getElementById('analyzeBtn').disabled = false;
      }
    }
    
    function updateStatus(msg) {
      console.log('[flame-graph]', msg);
    }
    
    function enableControls() {
      document.getElementById('analyzeBtn').disabled = false;
    }
    
    // ============================================
    // Initialization
    // ============================================
    
    async function initialize() {
      try {
        updateStatus('Connecting...');
        
        const result = await sendRequest('ui/initialize', {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'mcp-apps-flame-graph', version: '1.0.0' }
        });
        
        hostContext = result.hostContext || {};
        applyTheme();
        
        sendNotification('ui/notifications/initialized', {});
        isInitialized = true;
        updateStatus('Waiting for data...');
        
      } catch (err) {
        console.error('Init failed:', err);
        updateStatus('Standalone mode');
        
        // Load demo data
        loadProfile({ title: 'Demo Profile', filename: 'sample.cpuprofile' });
      }
    }
    
    // Handle resize
    window.addEventListener('resize', () => {
      if (currentRoot) renderFlameGraph();
    });
    
    initialize();
  <\/script>
</body>
</html>`;
}
