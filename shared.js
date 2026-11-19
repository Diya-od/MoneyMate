// ============================================================
// MoneyMate — Shared Data Logic (script.js)
// All pages import this file for data access & utilities
// ============================================================

// ─── Storage Keys ───────────────────────────────────────────
const KEYS = {
  transactions: 'mm_transactions',
  savings:      'mm_savings',
  assets:       'mm_assets',
  budgets:      'mm_budgets',
  initialized:  'mm_initialized',
};

// ─── Generic LocalStorage helpers ───────────────────────────
function loadData(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch { return []; }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadObject(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch { return {}; }
}

function saveObject(key, obj) {
  localStorage.setItem(key, JSON.stringify(obj));
}

// ─── ID Generator ───────────────────────────────────────────
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Transactions ────────────────────────────────────────────
function getTransactions()            { return loadData(KEYS.transactions); }
function saveTransactions(list)       { saveData(KEYS.transactions, list); }

function addTransaction(tx) {
  const list = getTransactions();
  tx.id = genId();
  tx.amount = parseFloat(tx.amount);
  list.unshift(tx);
  saveTransactions(list);
  return tx;
}

function updateTransaction(id, updates) {
  const list = getTransactions().map(tx =>
    tx.id === id ? { ...tx, ...updates, amount: parseFloat(updates.amount ?? tx.amount) } : tx
  );
  saveTransactions(list);
}

function deleteTransaction(id) {
  saveTransactions(getTransactions().filter(tx => tx.id !== id));
}

// ─── Savings Goals ───────────────────────────────────────────
function getSavings()           { return loadData(KEYS.savings); }
function saveSavings(list)      { saveData(KEYS.savings, list); }

function addSavingGoal(goal) {
  const list = getSavings();
  goal.id = genId();
  goal.target  = parseFloat(goal.target);
  goal.current = parseFloat(goal.current || 0);
  list.push(goal);
  saveSavings(list);
  return goal;
}

function updateSavingGoal(id, updates) {
  const list = getSavings().map(g =>
    g.id === id
      ? { ...g, ...updates,
          target:  parseFloat(updates.target  ?? g.target),
          current: parseFloat(updates.current ?? g.current) }
      : g
  );
  saveSavings(list);
}

function deleteSavingGoal(id) {
  saveSavings(getSavings().filter(g => g.id !== id));
}

// ─── Assets ──────────────────────────────────────────────────
function getAssets()          { return loadData(KEYS.assets); }
function saveAssets(list)     { saveData(KEYS.assets, list); }

function addAsset(asset) {
  const list = getAssets();
  asset.id    = genId();
  asset.value = parseFloat(asset.value);
  list.push(asset);
  saveAssets(list);
  return asset;
}

function updateAsset(id, updates) {
  const list = getAssets().map(a =>
    a.id === id ? { ...a, ...updates, value: parseFloat(updates.value ?? a.value) } : a
  );
  saveAssets(list);
}

function deleteAsset(id) {
  saveAssets(getAssets().filter(a => a.id !== id));
}

// ─── Budgets ─────────────────────────────────────────────────
function getBudgets()         { return loadObject(KEYS.budgets); }
function saveBudgets(obj)     { saveObject(KEYS.budgets, obj); }

// ─── Dashboard Calculations ──────────────────────────────────
function calcSummary() {
  const txs    = getTransactions();
  const assets = getAssets();
  const goals  = getSavings();

  const income   = txs.filter(t => t.type === 'income')  .reduce((s, t) => s + t.amount, 0);
  const expenses = txs.filter(t => t.type === 'expense') .reduce((s, t) => s + t.amount, 0);
  const savings  = txs.filter(t => t.type === 'saving')  .reduce((s, t) => s + t.amount, 0);
  const totalAssets = assets.reduce((s, a) => s + a.value, 0);
  const balance  = income - expenses - savings;
  const netWorth = totalAssets + balance;

  // Budget spending: expense transactions by category for current month
  const now = new Date();
  const month = now.getMonth();
  const year  = now.getFullYear();
  const budgetSpent = {};
  txs.forEach(tx => {
    if (tx.type !== 'expense') return;
    const d = new Date(tx.date);
    if (d.getMonth() !== month || d.getFullYear() !== year) return;
    budgetSpent[tx.category] = (budgetSpent[tx.category] || 0) + tx.amount;
  });

  return { income, expenses, savings, totalAssets, balance, netWorth, budgetSpent };
}

// ─── Formatting Helpers ──────────────────────────────────────
function fmtCurrency(n) {
  n = parseFloat(n) || 0;
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// Category icon map
const CAT_ICONS = {
  food:          '🍔',
  shopping:      '🛍️',
  transport:     '🚗',
  bills:         '📄',
  education:     '📚',
  entertainment: '🎬',
  health:        '❤️',
  travel:        '✈️',
  salary:        '💼',
  business:      '🏢',
  investment:    '📈',
  other:         '💡',
};

function catIcon(cat) {
  return CAT_ICONS[cat?.toLowerCase()] || '💡';
}

// Type badge HTML
function typeBadge(type) {
  const map = {
    income:  '<span class="badge badge-income">Income</span>',
    expense: '<span class="badge badge-expense">Expense</span>',
    saving:  '<span class="badge badge-saving">Saving</span>',
  };
  return map[type] || '';
}

// ─── Active Nav Highlight ────────────────────────────────────
function highlightNav() {
  const page = location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === page);
  });
}

// ─── Mobile menu toggle ──────────────────────────────────────
function initMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!toggle || !sidebar) return;
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');
  });
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  }
}

// ─── Toast Notification ──────────────────────────────────────
function showToast(msg, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ─── Confirm Dialog ──────────────────────────────────────────
function confirmDialog(msg) {
  return window.confirm(msg);
}

// ─── Sample Data Seed (first launch) ─────────────────────────
function seedSampleData() {
  if (localStorage.getItem(KEYS.initialized)) return;

  const today = todayISO();
  const d = (offset) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - offset);
    return dt.toISOString().split('T')[0];
  };

  // Transactions
  const txs = [
    { type: 'income',  amount: 40000, category: 'salary',        description: 'Monthly Salary',       date: d(2),  method: 'bank transfer' },
    { type: 'income',  amount: 5000,  category: 'business',      description: 'Freelance Project',    date: d(5),  method: 'bank transfer' },
    { type: 'expense', amount: 800,   category: 'food',          description: 'Grocery Shopping',     date: d(1),  method: 'cash' },
    { type: 'expense', amount: 300,   category: 'food',          description: 'Restaurant Dinner',    date: d(3),  method: 'upi' },
    { type: 'expense', amount: 2000,  category: 'shopping',      description: 'Clothing Purchase',    date: d(4),  method: 'credit card' },
    { type: 'expense', amount: 1500,  category: 'bills',         description: 'Electricity Bill',     date: d(2),  method: 'upi' },
    { type: 'expense', amount: 500,   category: 'transport',     description: 'Cab Fare',             date: d(1),  method: 'upi' },
    { type: 'expense', amount: 600,   category: 'entertainment', description: 'Movie & Outing',       date: d(6),  method: 'cash' },
    { type: 'expense', amount: 1200,  category: 'health',        description: 'Doctor Consultation',  date: d(7),  method: 'cash' },
    { type: 'expense', amount: 2500,  category: 'education',     description: 'Online Course',        date: d(8),  method: 'credit card' },
    { type: 'saving',  amount: 5000,  category: 'other',         description: 'Emergency Fund Top-up',date: d(2),  method: 'bank transfer' },
    { type: 'saving',  amount: 3000,  category: 'other',         description: 'Laptop Fund',          date: d(9),  method: 'bank transfer' },
  ];
  txs.forEach(tx => { tx.id = genId(); tx.amount = parseFloat(tx.amount); });
  saveTransactions(txs);

  // Savings Goals
  const goals = [
    { name: 'Emergency Fund', target: 50000,  current: 15000, description: '3 months expenses safety net' },
    { name: 'New Laptop',     target: 80000,  current: 20000, description: 'MacBook or Dell XPS' },
    { name: 'Europe Trip',    target: 150000, current: 8000,  description: 'Dream vacation 2026' },
    { name: 'Car Down Payment', target: 100000, current: 35000, description: 'Down payment for car' },
  ];
  goals.forEach(g => { g.id = genId(); g.target = parseFloat(g.target); g.current = parseFloat(g.current); });
  saveSavings(goals);

  // Assets
  const assets = [
    { name: 'Cash in Hand',   type: 'cash',       value: 20000,  description: 'Physical cash',         date: today },
    { name: 'Bank Savings',   type: 'bank',       value: 85000,  description: 'HDFC Savings Account',  date: today },
    { name: 'Gold Jewellery', type: 'gold',       value: 75000,  description: '20 grams gold',         date: today },
    { name: 'Mutual Funds',   type: 'investment', value: 30000,  description: 'SIP Portfolio',         date: today },
    { name: 'Fixed Deposit',  type: 'fd',         value: 50000,  description: 'FD @ 7.2% p.a.',        date: today },
    { name: 'Laptop',         type: 'electronics',value: 65000,  description: 'HP Laptop',             date: today },
  ];
  assets.forEach(a => { a.id = genId(); a.value = parseFloat(a.value); });
  saveAssets(assets);

  // Budgets
  const budgets = {
    food: 5000, shopping: 3000, transport: 1500, bills: 3000,
    entertainment: 1500, education: 3000, health: 2000, other: 2000,
  };
  saveBudgets(budgets);

  localStorage.setItem(KEYS.initialized, '1');
}

// Auto-seed when script loads
seedSampleData();
