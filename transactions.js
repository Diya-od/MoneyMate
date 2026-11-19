// ============================================================
// transactions.js — JavaScript for Transactions page
// Depends on: shared.js (loaded first)
// ============================================================

highlightNav();
initMobileMenu();

const txModal   = document.getElementById('txModal');
let   currentType = 'expense';

/* ── Type tabs ── */
const typeTabs = document.querySelectorAll('.type-tab');

function setType(type) {
  currentType = type;
  document.getElementById('txType').value = type;
  typeTabs.forEach(t => {
    t.className = 'type-tab';
    if (t.dataset.type === type) t.classList.add('active-' + type);
  });
}

typeTabs.forEach(t => t.addEventListener('click', () => setType(t.dataset.type)));
setType('expense');

/* ── Modal open/close ── */
function openModal(tx = null) {
  document.getElementById('txAmount').value   = tx ? tx.amount       : '';
  document.getElementById('txDate').value     = tx ? tx.date         : todayISO();
  document.getElementById('txCategory').value = tx ? tx.category     : 'food';
  document.getElementById('txMethod').value   = tx ? tx.method       : 'cash';
  document.getElementById('txDesc').value     = tx ? tx.description  : '';
  document.getElementById('editTxId').value   = tx ? tx.id           : '';
  document.getElementById('modalTitle').textContent = tx ? 'Edit Transaction' : 'Add Transaction';
  setType(tx ? tx.type : 'expense');
  txModal.classList.add('open');
}

function closeModal() { txModal.classList.remove('open'); }

document.getElementById('addTxBtn').addEventListener('click', () => openModal());
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
txModal.addEventListener('click', e => { if (e.target === txModal) closeModal(); });

/* ── Save transaction ── */
document.getElementById('saveTxBtn').addEventListener('click', () => {
  const amount = parseFloat(document.getElementById('txAmount').value);
  const date   = document.getElementById('txDate').value;

  if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }
  if (!date)                  { showToast('Select a date', 'error');        return; }

  const data = {
    type:        currentType,
    amount,
    date,
    category:    document.getElementById('txCategory').value,
    method:      document.getElementById('txMethod').value,
    description: document.getElementById('txDesc').value.trim(),
  };

  const id = document.getElementById('editTxId').value;
  if (id) {
    updateTransaction(id, data);
    showToast('Transaction updated ✔', 'success');
  } else {
    addTransaction(data);
    showToast('Transaction added ✔', 'success');
  }

  closeModal();
  renderAll();
});

/* ── Delete ── */
function deleteTx(id) {
  if (!confirmDialog('Delete this transaction?')) return;
  deleteTransaction(id);
  showToast('Transaction deleted', 'info');
  renderAll();
}

/* ── Render ── */
function renderAll() {
  const txs    = getTransactions();
  const search = document.getElementById('searchInput').value.toLowerCase();
  const fType  = document.getElementById('filterType').value;
  const fCat   = document.getElementById('filterCat').value;

  const filtered = txs.filter(tx => {
    const matchSearch = !search ||
      (tx.description || '').toLowerCase().includes(search) ||
      tx.category.toLowerCase().includes(search);
    const matchType = !fType || tx.type === fType;
    const matchCat  = !fCat  || tx.category === fCat;
    return matchSearch && matchType && matchCat;
  });

  document.getElementById('txCount').textContent = filtered.length + ' records';

  const tbody = document.getElementById('txTableBody');
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="8">
      <div class="empty-state">
        <div class="empty-icon">💸</div>
        <div class="empty-title">No transactions found</div>
        <div class="empty-desc">Add a transaction or clear your filters</div>
      </div></td></tr>`;
  } else {
    tbody.innerHTML = filtered.map(tx => `
      <tr class="animate-in">
        <td><div class="tx-icon-cell">${catIcon(tx.category)}</div></td>
        <td style="max-width:180px">${tx.description || '<span class="text-muted">—</span>'}</td>
        <td>${typeBadge(tx.type)}</td>
        <td><span class="badge-cat">${tx.category}</span></td>
        <td><span class="method-pill">${tx.method || '—'}</span></td>
        <td class="text-muted">${fmtDate(tx.date)}</td>
        <td class="text-right ${tx.type === 'income' ? 'amount-positive' : tx.type === 'saving' ? 'amount-saving' : 'amount-negative'}">
          ${tx.type === 'income' ? '+' : '−'}${fmtCurrency(tx.amount)}
        </td>
        <td class="text-right">
          <div class="tx-actions-cell">
            <button class="btn-icon" title="Edit"
              onclick="openModal(getTransactions().find(t=>t.id==='${tx.id}'))">✏️</button>
            <button class="btn-icon" title="Delete"
              onclick="deleteTx('${tx.id}')">🗑️</button>
          </div>
        </td>
      </tr>`).join('');
  }

  /* Summary chips */
  const inc = txs.filter(t => t.type === 'income') .reduce((s, t) => s + t.amount, 0);
  const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const sav = txs.filter(t => t.type === 'saving') .reduce((s, t) => s + t.amount, 0);
  document.getElementById('txSummaryChips').innerHTML = `
    <div class="tx-chip">
      <div class="tx-chip-label">Total Income</div>
      <div class="tx-chip-value" style="color:var(--green)">${fmtCurrency(inc)}</div>
    </div>
    <div class="tx-chip">
      <div class="tx-chip-label">Total Expenses</div>
      <div class="tx-chip-value" style="color:var(--red)">${fmtCurrency(exp)}</div>
    </div>
    <div class="tx-chip">
      <div class="tx-chip-label">Total Savings</div>
      <div class="tx-chip-value" style="color:var(--cyan)">${fmtCurrency(sav)}</div>
    </div>
    <div class="tx-chip">
      <div class="tx-chip-label">Balance</div>
      <div class="tx-chip-value" style="color:${inc - exp - sav >= 0 ? 'var(--green)' : 'var(--red)'}">
        ${fmtCurrency(inc - exp - sav)}
      </div>
    </div>`;
}

/* ── Filter listeners ── */
document.getElementById('searchInput').addEventListener('input', renderAll);
document.getElementById('filterType').addEventListener('change', renderAll);
document.getElementById('filterCat').addEventListener('change', renderAll);
document.getElementById('clearFilterBtn').addEventListener('click', () => {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterType').value  = '';
  document.getElementById('filterCat').value   = '';
  renderAll();
});

renderAll();
