// ============================================================
// budget.js — JavaScript for Budget page
// Depends on: shared.js (loaded first)
// ============================================================

highlightNav();
initMobileMenu();

const now = new Date();

/* ── Month label ── */
document.getElementById('budgetMonthLabel').textContent =
  now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

/* ── Budget category definitions ── */
const BUDGET_CATS = [
  { key: 'food',          label: 'Food',         icon: '🍔' },
  { key: 'shopping',      label: 'Shopping',      icon: '🛍️' },
  { key: 'transport',     label: 'Transport',     icon: '🚗' },
  { key: 'bills',         label: 'Bills',         icon: '📄' },
  { key: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { key: 'education',     label: 'Education',     icon: '📚' },
  { key: 'health',        label: 'Health',        icon: '❤️' },
  { key: 'travel',        label: 'Travel',        icon: '✈️' },
  { key: 'other',         label: 'Other',         icon: '💡' },
];

/* ── Edit Budget Modal ── */
const budgetModal = document.getElementById('budgetModal');

function openBudgetModal() {
  const budgets = getBudgets();
  document.getElementById('budgetModalBody').innerHTML = BUDGET_CATS.map(c => `
    <div class="form-group">
      <label class="form-label">${c.icon} ${c.label} (₹)</label>
      <input type="number" class="form-input" id="b_${c.key}"
        placeholder="0" min="0"
        value="${budgets[c.key] !== undefined ? budgets[c.key] : ''}" />
    </div>`).join('');
  budgetModal.classList.add('open');
}
function closeBudgetModal() { budgetModal.classList.remove('open'); }

document.getElementById('editBudgetBtn').addEventListener('click', openBudgetModal);
document.getElementById('budgetModalClose').addEventListener('click', closeBudgetModal);
document.getElementById('budgetCancelBtn').addEventListener('click', closeBudgetModal);
budgetModal.addEventListener('click', e => { if (e.target === budgetModal) closeBudgetModal(); });

document.getElementById('saveBudgetBtn').addEventListener('click', () => {
  const obj = {};
  BUDGET_CATS.forEach(c => {
    const v = parseFloat(document.getElementById('b_' + c.key).value);
    if (!isNaN(v) && v > 0) obj[c.key] = v;
  });
  saveBudgets(obj);
  showToast('Budgets saved ✔', 'success');
  closeBudgetModal();
  renderBudget();
});

/* ── Compute this month's spending per category ── */
function monthSpending() {
  const txs   = getTransactions();
  const spent = {};
  txs.forEach(tx => {
    if (tx.type !== 'expense') return;
    const d = new Date(tx.date);
    if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return;
    spent[tx.category] = (spent[tx.category] || 0) + tx.amount;
  });
  return spent;
}

/* ── Render ── */
function renderBudget() {
  const budgets = getBudgets();
  const spent   = monthSpending();

  let totalBudget = 0, totalSpent = 0;
  Object.values(budgets).forEach(v => { totalBudget += v; });
  Object.values(spent).forEach(v => { totalSpent += v; });
  const totalRemaining  = totalBudget - totalSpent;
  const overBudgetCount = BUDGET_CATS.filter(c =>
    budgets[c.key] && (spent[c.key] || 0) > budgets[c.key]
  ).length;

  /* Summary chips */
  document.getElementById('budgetSummaryChips').innerHTML = `
    <div class="bud-chip">
      <div class="bud-chip-label">Total Budget</div>
      <div class="bud-chip-value" style="color:var(--accent)">${fmtCurrency(totalBudget)}</div>
    </div>
    <div class="bud-chip">
      <div class="bud-chip-label">Total Spent</div>
      <div class="bud-chip-value" style="color:var(--red)">${fmtCurrency(totalSpent)}</div>
    </div>
    <div class="bud-chip">
      <div class="bud-chip-label">Remaining</div>
      <div class="bud-chip-value" style="color:${totalRemaining >= 0 ? 'var(--green)' : 'var(--red)'}">
        ${fmtCurrency(totalRemaining)}
      </div>
    </div>
    <div class="bud-chip">
      <div class="bud-chip-label">Over Budget</div>
      <div class="bud-chip-value" style="color:${overBudgetCount ? 'var(--red)' : 'var(--green)'}">
        ${overBudgetCount} categories
      </div>
    </div>`;

  const list = document.getElementById('budgetList');

  if (!Object.keys(budgets).length) {
    list.innerHTML = `<div class="budget-empty">
      <div class="be-icon">📊</div>
      <div class="be-title">No budgets set yet</div>
      <div class="be-desc">Click "Edit Budgets" to set monthly spending limits per category</div>
    </div>`;
    return;
  }

  const items = BUDGET_CATS.map(c => {
    const limit = parseFloat(budgets[c.key]) || 0;
    const s     = spent[c.key] || 0;
    if (!limit && !s) return '';   // skip categories with no data

    const rem   = limit - s;
    const pct   = limit ? Math.min(Math.round(s / limit * 100), 100) : (s > 0 ? 100 : 0);
    const over  = s > limit && limit > 0;
    const warn  = pct >= 80 && !over;

    const barClass  = over ? 'red' : warn ? 'yellow' : 'green';
    const spentClass = over ? 'over' : warn ? 'warn' : 'safe';
    const remClass   = over ? 'over' : warn ? 'warn' : 'ok';

    return `<div class="budget-item animate-in">
      <div class="budget-item-header">
        <div class="budget-cat-info">
          <span class="budget-cat-icon">${c.icon}</span>
          <span class="budget-cat-name">${c.label}</span>
        </div>
        <div class="budget-amount-info">
          <div class="budget-spent-val ${spentClass}">${fmtCurrency(s)}</div>
          <div class="budget-limit-val">of ${limit ? fmtCurrency(limit) : 'No limit'}</div>
        </div>
      </div>
      <div class="budget-stats-row">
        <span class="budget-pct-used">${pct}% used</span>
        <span class="budget-remaining-val ${remClass}">
          ${over
            ? '⚠️ Over by ' + fmtCurrency(s - limit)
            : 'Remaining: ' + fmtCurrency(Math.max(0, rem))}
        </span>
      </div>
      <div class="progress-wrap">
        <div class="progress-bar ${barClass}" style="width:${pct}%"></div>
      </div>
      ${over ? `<div class="budget-warning-msg danger">⚠️ Exceeded budget by ${fmtCurrency(s - limit)}!</div>` : ''}
      ${warn ? `<div class="budget-warning-msg caution">⚡ Approaching limit — ${pct}% used</div>` : ''}
    </div>`;
  }).filter(Boolean).join('');

  list.innerHTML = items || `<div class="empty-state">
    <div class="empty-icon">📊</div>
    <div class="empty-title">No expense data for this month</div>
  </div>`;
}

renderBudget();
