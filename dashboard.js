// ============================================================
// dashboard.js — JavaScript for Dashboard (dashboard.html)
// Depends on: shared.js (loaded first)
// ============================================================

/* ── Init nav & mobile menu ── */
highlightNav();
initMobileMenu();

/* ── Header date ── */
document.getElementById('headerDate').textContent =
  new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });

/* ── Main render function ── */
function renderDashboard() {
  const { income, expenses, savings, totalAssets, balance, netWorth, budgetSpent } = calcSummary();
  const txs     = getTransactions();
  const assets  = getAssets();
  const goals   = getSavings();
  const budgets = getBudgets();

  /* Net Worth banner */
  document.getElementById('netWorthVal').textContent = fmtCurrency(netWorth);
  document.getElementById('netWorthSub').textContent =
    netWorth >= 0 ? '📈 Positive net worth' : '📉 Negative net worth';

  /* Stat cards */
  const balEl = document.getElementById('statBalance');
  balEl.textContent = fmtCurrency(balance);
  balEl.className   = 'stat-value ' + (balance >= 0 ? 'positive' : 'negative');

  document.getElementById('statIncome').textContent   = fmtCurrency(income);
  document.getElementById('statExpenses').textContent = fmtCurrency(expenses);
  document.getElementById('statSavings').textContent  = fmtCurrency(savings);
  document.getElementById('statAssets').textContent   = fmtCurrency(totalAssets);
  document.getElementById('statGoals').textContent    = goals.length;

  const incTxs = txs.filter(t => t.type === 'income');
  const expTxs = txs.filter(t => t.type === 'expense');
  const savTxs = txs.filter(t => t.type === 'saving');
  document.getElementById('incomeCount').textContent  = incTxs.length  + ' transactions';
  document.getElementById('expenseCount').textContent = expTxs.length  + ' transactions';
  document.getElementById('savingCount').textContent  = savTxs.length  + ' transactions';
  document.getElementById('assetCount').textContent   = assets.length  + ' assets';

  const completedGoals = goals.filter(g => g.current >= g.target).length;
  document.getElementById('goalsProgress').textContent = completedGoals + ' completed';

  /* ── Recent Transactions ── */
  const recent = txs.slice(0, 6);
  const tbody  = document.getElementById('recentTxBody');
  if (!recent.length) {
    tbody.innerHTML = `<tr><td colspan="5">
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-title">No transactions yet</div>
        <div class="empty-desc">Add some on the Transactions page</div>
      </div></td></tr>`;
  } else {
    tbody.innerHTML = recent.map(tx => `
      <tr class="animate-in">
        <td><div class="tx-icon-wrap">${catIcon(tx.category)}</div></td>
        <td>${tx.description || '<span class="text-muted">—</span>'}</td>
        <td><span class="badge-cat">${tx.category}</span></td>
        <td class="text-muted">${fmtDate(tx.date)}</td>
        <td class="text-right ${tx.type === 'income' ? 'amount-positive' : tx.type === 'saving' ? 'amount-saving' : 'amount-negative'}">
          ${tx.type === 'income' ? '+' : '−'}${fmtCurrency(tx.amount)}
        </td>
      </tr>`).join('');
  }

  /* ── Spending Summary (this month, by category) ── */
  const catTotals = {};
  const now = new Date();
  txs.forEach(tx => {
    if (tx.type !== 'expense') return;
    const d = new Date(tx.date);
    if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return;
    catTotals[tx.category] = (catTotals[tx.category] || 0) + tx.amount;
  });
  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const totalExpM  = sortedCats.reduce((s, [, v]) => s + v, 0);
  const spendEl    = document.getElementById('spendingSummary');

  if (!sortedCats.length) {
    spendEl.innerHTML = `<div class="empty-state" style="padding:28px 0">
      <div class="empty-icon">📊</div>
      <div class="empty-title">No expenses this month</div>
    </div>`;
  } else {
    spendEl.innerHTML = sortedCats.slice(0, 7).map(([cat, amt]) => {
      const pct = totalExpM ? Math.round(amt / totalExpM * 100) : 0;
      return `<div class="spend-row">
        <div class="spend-row-head">
          <span class="spend-cat-name">${catIcon(cat)} ${cat}</span>
          <span class="spend-amount">${fmtCurrency(amt)}<span class="spend-pct">(${pct}%)</span></span>
        </div>
        <div class="progress-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>
      </div>`;
    }).join('');
  }

  /* ── Budget Overview ── */
  const budgetEl = document.getElementById('budgetOverview');
  const bKeys    = Object.keys(budgets);
  if (!bKeys.length) {
    budgetEl.innerHTML = `<div class="empty-state" style="padding:28px 0">
      <div class="empty-icon">📋</div>
      <div class="empty-title">No budgets set</div>
      <a href="budget.html" style="color:var(--accent);font-size:14px">Set budgets →</a>
    </div>`;
  } else {
    budgetEl.innerHTML = bKeys.slice(0, 5).map(cat => {
      const limit    = parseFloat(budgets[cat]) || 0;
      const spent    = budgetSpent[cat] || 0;
      const pct      = limit ? Math.min(Math.round(spent / limit * 100), 100) : 0;
      const over     = spent > limit;
      const barClass = pct >= 100 ? 'red' : pct >= 80 ? 'yellow' : '';
      return `<div class="budget-mini-row">
        <div class="budget-mini-head">
          <span>${catIcon(cat)} ${cat}</span>
          <span style="font-weight:600;color:${over ? 'var(--red)' : 'var(--text2)'}">${fmtCurrency(spent)} / ${fmtCurrency(limit)}</span>
        </div>
        <div class="progress-wrap"><div class="progress-bar ${barClass}" style="width:${pct}%"></div></div>
        ${over ? `<div class="budget-over-tag">⚠️ Over by ${fmtCurrency(spent - limit)}</div>` : ''}
      </div>`;
    }).join('') + (bKeys.length > 5
      ? `<a href="budget.html" style="font-size:13px;color:var(--accent);display:block;margin-top:8px">+${bKeys.length - 5} more →</a>`
      : '');
  }

  /* ── Savings Progress ── */
  const savEl = document.getElementById('savingsProgress');
  if (!goals.length) {
    savEl.innerHTML = `<div class="empty-state" style="padding:28px 0">
      <div class="empty-icon">💵</div>
      <div class="empty-title">No savings goals</div>
      <a href="savings.html" style="color:var(--accent);font-size:14px">Add a goal →</a>
    </div>`;
  } else {
    savEl.innerHTML = goals.slice(0, 4).map(g => {
      const pct      = g.target ? Math.min(Math.round(g.current / g.target * 100), 100) : 0;
      const barClass = pct >= 100 ? 'green' : pct >= 60 ? 'cyan' : '';
      return `<div class="sav-prog-row">
        <div class="sav-prog-head">
          <span class="sav-prog-name">${g.name}</span>
          <span class="sav-prog-pct">${pct}%</span>
        </div>
        <div class="progress-wrap"><div class="progress-bar ${barClass}" style="width:${pct}%"></div></div>
        <div class="sav-prog-foot">
          <span>${fmtCurrency(g.current)} saved</span>
          <span>Goal: ${fmtCurrency(g.target)}</span>
        </div>
      </div>`;
    }).join('');
  }

  /* ── Asset Summary table ── */
  const assetBody = document.getElementById('assetSummaryBody');
  if (!assets.length) {
    assetBody.innerHTML = `<tr><td colspan="4">
      <div class="empty-state" style="padding:24px 0">
        <div class="empty-icon">🏦</div>
        <div class="empty-title">No assets yet</div>
      </div></td></tr>`;
  } else {
    assetBody.innerHTML = assets.map(a => `
      <tr>
        <td style="font-weight:600">${a.name}</td>
        <td><span class="asset-type-badge">${a.type}</span></td>
        <td class="text-muted">${a.description || '—'}</td>
        <td class="text-right amount-positive">${fmtCurrency(a.value)}</td>
      </tr>`).join('');
  }
}

renderDashboard();
