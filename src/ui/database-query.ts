/**
 * Database Query UI - Sales Database Filter/Preview
 * 
 * Interactive data explorer for sales data with filters and aggregations.
 */

export function DATABASE_QUERY_UI(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sales Database</title>
  <style>
    :root {
      --bg: #1e1e1e;
      --surface: #252526;
      --surface2: #2d2d30;
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
        --surface: #f8f8f8;
        --surface2: #f0f0f0;
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
      padding: 10px;
      max-height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* Header with stats */
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    .title {
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .stats {
      display: flex;
      gap: 12px;
      margin-left: auto;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 14px;
      font-weight: 600;
      font-family: var(--mono);
    }
    .stat-value.revenue { color: var(--success); }
    .stat-value.orders { color: var(--accent); }
    .stat-value.avg { color: var(--warning); }
    .stat-label {
      font-size: 9px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Filters row */
    .filters {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      padding: 8px;
      background: var(--surface);
      border-radius: 4px;
      flex-shrink: 0;
    }
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .filter-label {
      font-size: 9px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .filter-group select,
    .filter-group input {
      padding: 4px 6px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 3px;
      color: var(--text);
      font: inherit;
      min-width: 100px;
    }
    .filter-group select:focus,
    .filter-group input:focus {
      outline: none;
      border-color: var(--accent);
    }
    .filter-actions {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      margin-left: auto;
    }

    /* Buttons */
    button {
      padding: 5px 10px;
      font: 10px var(--font);
      border: none;
      border-radius: 3px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .btn-primary {
      background: var(--accent);
      color: white;
    }
    .btn-primary:hover { background: #1c8ae6; }
    .btn-secondary {
      background: var(--surface2);
      color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-secondary:hover { background: var(--border); }
    .btn-success {
      background: var(--success);
      color: #1e1e1e;
    }

    /* Data table */
    .table-container {
      flex: 1;
      overflow: auto;
      border: 1px solid var(--border);
      border-radius: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    thead {
      position: sticky;
      top: 0;
      background: var(--surface);
      z-index: 1;
    }
    th {
      padding: 6px 8px;
      text-align: left;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 9px;
      border-bottom: 1px solid var(--border);
      cursor: pointer;
      user-select: none;
    }
    th:hover { color: var(--text); }
    th.sorted { color: var(--accent); }
    th .sort-icon { font-size: 8px; margin-left: 2px; }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    tr:hover { background: var(--surface); }
    
    /* Status badges */
    .status {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 9px;
      font-weight: 500;
    }
    .status-completed { background: color-mix(in srgb, var(--success) 20%, transparent); color: var(--success); }
    .status-pending { background: color-mix(in srgb, var(--warning) 20%, transparent); color: var(--warning); }
    .status-cancelled { background: color-mix(in srgb, var(--danger) 20%, transparent); color: var(--danger); }
    .status-shipped { background: color-mix(in srgb, var(--accent) 20%, transparent); color: var(--accent); }

    /* Amount styling */
    .amount {
      font-family: var(--mono);
      text-align: right;
    }
    .amount.positive { color: var(--success); }

    /* Footer */
    .footer {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-top: 6px;
      flex-shrink: 0;
    }
    .row-count {
      font-size: 10px;
      color: var(--muted);
    }
    .status-bar {
      font-size: 9px;
      color: var(--muted);
      margin-left: auto;
    }
    .status-bar.success { color: var(--success); }

    /* Empty state */
    .empty {
      padding: 40px;
      text-align: center;
      color: var(--muted);
    }
    .empty-icon { font-size: 24px; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <span class="title">🗄️ Sales Database</span>
    <div class="stats">
      <div class="stat">
        <div class="stat-value revenue" id="totalRevenue">$0</div>
        <div class="stat-label">Revenue</div>
      </div>
      <div class="stat">
        <div class="stat-value orders" id="totalOrders">0</div>
        <div class="stat-label">Orders</div>
      </div>
      <div class="stat">
        <div class="stat-value avg" id="avgOrder">$0</div>
        <div class="stat-label">Avg Order</div>
      </div>
    </div>
  </div>

  <div class="filters">
    <div class="filter-group">
      <span class="filter-label">Date Range</span>
      <select id="dateRange">
        <option value="7d">Last 7 days</option>
        <option value="30d" selected>Last 30 days</option>
        <option value="90d">Last 90 days</option>
        <option value="all">All time</option>
      </select>
    </div>
    <div class="filter-group">
      <span class="filter-label">Category</span>
      <select id="category">
        <option value="">All Categories</option>
        <option value="Electronics">Electronics</option>
        <option value="Clothing">Clothing</option>
        <option value="Home">Home & Garden</option>
        <option value="Sports">Sports</option>
        <option value="Books">Books</option>
      </select>
    </div>
    <div class="filter-group">
      <span class="filter-label">Status</span>
      <select id="status">
        <option value="">All Status</option>
        <option value="completed">Completed</option>
        <option value="pending">Pending</option>
        <option value="shipped">Shipped</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
    <div class="filter-group">
      <span class="filter-label">Sales Rep</span>
      <select id="salesRep">
        <option value="">All Reps</option>
        <option value="Sarah Chen">Sarah Chen</option>
        <option value="Mike Johnson">Mike Johnson</option>
        <option value="Emma Davis">Emma Davis</option>
        <option value="James Wilson">James Wilson</option>
      </select>
    </div>
    <div class="filter-group">
      <span class="filter-label">Min Amount</span>
      <input type="number" id="minAmount" placeholder="$0" min="0" step="50">
    </div>
    <div class="filter-actions">
      <button class="btn-secondary" onclick="resetFilters()">Reset</button>
      <button class="btn-primary" onclick="applyFilters()">Apply</button>
    </div>
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th data-sort="id">Order ID <span class="sort-icon"></span></th>
          <th data-sort="date">Date <span class="sort-icon"></span></th>
          <th data-sort="customer">Customer <span class="sort-icon"></span></th>
          <th data-sort="product">Product <span class="sort-icon"></span></th>
          <th data-sort="category">Category <span class="sort-icon"></span></th>
          <th data-sort="amount">Amount <span class="sort-icon"></span></th>
          <th data-sort="status">Status <span class="sort-icon"></span></th>
          <th data-sort="rep">Sales Rep <span class="sort-icon"></span></th>
        </tr>
      </thead>
      <tbody id="tableBody"></tbody>
    </table>
  </div>

  <div class="footer">
    <span class="row-count"><strong id="rowCount">0</strong> orders found</span>
    <button class="btn-success" onclick="exportData()">📤 Export to Chat</button>
    <span class="status-bar" id="statusBar">Ready</span>
  </div>

  <script>
    // Mock sales data
    const mockData = generateMockData();
    let filteredData = [...mockData];
    let sortColumn = 'date';
    let sortDir = 'desc';

    // Generate realistic mock data
    function generateMockData() {
      const customers = [
        'Acme Corp', 'TechStart Inc', 'Global Retail', 'Summit LLC', 'Velocity Co',
        'Pioneer Group', 'Nexus Labs', 'Atlas Industries', 'Quantum Tech', 'Horizon Enterprises',
        'BlueWave Solutions', 'RedRock Capital', 'Sterling Partners', 'Apex Dynamics', 'Nova Systems'
      ];
      const products = {
        Electronics: ['MacBook Pro 14"', 'iPhone 15 Pro', 'AirPods Max', 'iPad Air', 'Apple Watch Ultra', 'Sony WH-1000XM5', 'Samsung 4K TV 65"'],
        Clothing: ['Nike Air Max', 'Levi\\'s 501 Jeans', 'North Face Jacket', 'Adidas Ultraboost', 'Patagonia Fleece'],
        Home: ['Dyson V15 Vacuum', 'Instant Pot Pro', 'KitchenAid Mixer', 'Philips Hue Starter Kit', 'Roomba i7+'],
        Sports: ['Peloton Bike+', 'Bowflex Dumbbells', 'Yoga Mat Pro', 'Garmin Forerunner', 'Tennis Racket Pro'],
        Books: ['Tech Leadership Guide', 'AI Fundamentals', 'Product Management', 'System Design', 'Clean Code']
      };
      const reps = ['Sarah Chen', 'Mike Johnson', 'Emma Davis', 'James Wilson'];
      const statuses = ['completed', 'completed', 'completed', 'pending', 'shipped', 'cancelled'];
      
      const data = [];
      const now = Date.now();
      
      for (let i = 0; i < 150; i++) {
        const category = Object.keys(products)[Math.floor(Math.random() * 5)];
        const productList = products[category];
        const daysAgo = Math.floor(Math.random() * 120);
        const basePrice = category === 'Electronics' ? 500 : category === 'Sports' ? 300 : category === 'Home' ? 200 : 80;
        const amount = Math.round((basePrice + Math.random() * basePrice * 2) * 100) / 100;
        
        data.push({
          id: 'ORD-' + String(10000 + i).slice(1),
          date: new Date(now - daysAgo * 86400000).toISOString().split('T')[0],
          customer: customers[Math.floor(Math.random() * customers.length)],
          product: productList[Math.floor(Math.random() * productList.length)],
          category: category,
          amount: amount,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          rep: reps[Math.floor(Math.random() * reps.length)]
        });
      }
      
      return data.sort((a, b) => b.date.localeCompare(a.date));
    }

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
        // Could receive custom data here
        updateStatus('Data loaded');
        applyFilters();
      }
    });

    // Rendering
    function renderTable() {
      const tbody = document.getElementById('tableBody');
      
      if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="empty"><div class="empty-icon">📭</div>No orders match your filters</div></td></tr>';
        updateStats([]);
        return;
      }

      // Sort data
      const sorted = [...filteredData].sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];
        if (sortColumn === 'amount') {
          aVal = parseFloat(aVal);
          bVal = parseFloat(bVal);
        }
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });

      tbody.innerHTML = sorted.map(row => \`
        <tr>
          <td><code>\${row.id}</code></td>
          <td>\${row.date}</td>
          <td>\${row.customer}</td>
          <td>\${row.product}</td>
          <td>\${row.category}</td>
          <td class="amount positive">$\${row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td><span class="status status-\${row.status}">\${row.status}</span></td>
          <td>\${row.rep}</td>
        </tr>
      \`).join('');

      // Update sort indicators
      document.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted');
        th.querySelector('.sort-icon').textContent = '';
      });
      const sortedTh = document.querySelector(\`th[data-sort="\${sortColumn}"]\`);
      if (sortedTh) {
        sortedTh.classList.add('sorted');
        sortedTh.querySelector('.sort-icon').textContent = sortDir === 'asc' ? '▲' : '▼';
      }

      updateStats(sorted);
    }

    function updateStats(data) {
      const revenue = data.reduce((sum, r) => sum + r.amount, 0);
      const orders = data.length;
      const avg = orders > 0 ? revenue / orders : 0;

      document.getElementById('totalRevenue').textContent = '$' + revenue.toLocaleString('en-US', { maximumFractionDigits: 0 });
      document.getElementById('totalOrders').textContent = orders.toLocaleString();
      document.getElementById('avgOrder').textContent = '$' + avg.toLocaleString('en-US', { maximumFractionDigits: 0 });
      document.getElementById('rowCount').textContent = orders;
    }

    function applyFilters() {
      const dateRange = document.getElementById('dateRange').value;
      const category = document.getElementById('category').value;
      const status = document.getElementById('status').value;
      const rep = document.getElementById('salesRep').value;
      const minAmount = parseFloat(document.getElementById('minAmount').value) || 0;

      const now = new Date();
      let cutoffDate = null;
      if (dateRange === '7d') cutoffDate = new Date(now - 7 * 86400000);
      else if (dateRange === '30d') cutoffDate = new Date(now - 30 * 86400000);
      else if (dateRange === '90d') cutoffDate = new Date(now - 90 * 86400000);

      filteredData = mockData.filter(row => {
        if (cutoffDate && new Date(row.date) < cutoffDate) return false;
        if (category && row.category !== category) return false;
        if (status && row.status !== status) return false;
        if (rep && row.rep !== rep) return false;
        if (row.amount < minAmount) return false;
        return true;
      });

      renderTable();
      updateStatus(\`Showing \${filteredData.length} of \${mockData.length} orders\`);
    }

    function resetFilters() {
      document.getElementById('dateRange').value = '30d';
      document.getElementById('category').value = '';
      document.getElementById('status').value = '';
      document.getElementById('salesRep').value = '';
      document.getElementById('minAmount').value = '';
      applyFilters();
    }

    function updateStatus(msg, isSuccess = false) {
      const el = document.getElementById('statusBar');
      el.textContent = msg;
      el.className = 'status-bar' + (isSuccess ? ' success' : '');
    }

    // Export to chat
    async function exportData() {
      if (filteredData.length === 0) {
        updateStatus('No data to export');
        return;
      }

      updateStatus('Exporting...');

      const revenue = filteredData.reduce((sum, r) => sum + r.amount, 0);
      const byCategory = {};
      const byStatus = {};
      const byRep = {};
      
      filteredData.forEach(row => {
        byCategory[row.category] = (byCategory[row.category] || 0) + row.amount;
        byStatus[row.status] = (byStatus[row.status] || 0) + 1;
        byRep[row.rep] = (byRep[row.rep] || 0) + row.amount;
      });

      const message = \`## Sales Data Export

**Summary:** \${filteredData.length} orders | $\${revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })} total revenue

### Revenue by Category
\${Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => \`- **\${cat}**: $\${amt.toLocaleString('en-US', { maximumFractionDigits: 0 })}\`).join('\\n')}

### Orders by Status
\${Object.entries(byStatus).map(([s, count]) => \`- \${s}: \${count}\`).join('\\n')}

### Top Sales Reps
\${Object.entries(byRep).sort((a, b) => b[1] - a[1]).map(([rep, amt]) => \`- **\${rep}**: $\${amt.toLocaleString('en-US', { maximumFractionDigits: 0 })}\`).join('\\n')}

### Sample Orders (Top 5 by Amount)
| Order ID | Customer | Product | Amount | Status |
|----------|----------|---------|--------|--------|
\${[...filteredData].sort((a, b) => b.amount - a.amount).slice(0, 5).map(r => \`| \${r.id} | \${r.customer} | \${r.product} | $\${r.amount.toFixed(2)} | \${r.status} |\`).join('\\n')}\`;

      try {
        await sendRequest('ui/message', {
          content: [{ type: 'text', text: message }]
        });
        updateStatus('Sent to chat', true);
      } catch (e) {
        updateStatus('Error: ' + e.message);
      }
    }

    // Sorting
    document.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.sort;
        if (sortColumn === col) {
          sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          sortColumn = col;
          sortDir = col === 'amount' ? 'desc' : 'asc';
        }
        renderTable();
      });
    });

    // Initialize
    async function initialize() {
      try {
        updateStatus('Connecting...');
        await sendRequest('ui/initialize', {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'database-query', version: '1.0.0' }
        });
        sendNotification('ui/notifications/initialized', {});
        updateStatus('Ready');
      } catch (e) {
        updateStatus('Standalone mode');
      }
      applyFilters();
    }

    initialize();
  <\/script>
</body>
</html>`;
}
