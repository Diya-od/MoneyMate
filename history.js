// ============================================================
// history.js — JavaScript for Money History page
// Depends on: shared.js (loaded first)
// ============================================================

highlightNav();
initMobileMenu();

const PAGE_SIZE = 20;
let currentPage  = 1;
let filteredData = [];

/* ── Apply filters & sort ── */
function applyFilters() {
  const search  = document.getElementById('histSearch').value.toLowerCase();
  const type    = document.getElementById('histType').value;
  const cat     = document.getElementById('histCat').value;
  const fromVal = document.getElementById('histFrom').value;
  const toVal   = document.getElementById('histTo').value;
  const sort    = document.getElementById('histSort').value;

  const from = fromVal ? new Date(fromVal)              : null;
  const to   = toVal   ? new Date(toVal + 'T23:59:59')  : null;

  let data = getTransactions().filter(tx => {
    const d = new Date(tx.date);
    return (
      (!search || (tx.description || '').toLowerCase().includes(search) ||
                  tx.category.toLowerCase().includes(search)) &&
      (!type   || tx.type     === type) &&
      (!cat    || tx.category === cat)  &&
      (!from   || d >= from)            &&
      (!to     || d <= to)
    );
  });

  data.sort((a, b) => {
    if (sort === 'date-desc')   return new Date(b.date) - new Date(a.date);
    if (sort === 'date-asc')    return new Date(a.date) - new Date(b.date);
    if (sort === 'amount-desc') return b.amount - a.amount;
    if (sort === 'amount-asc')  return a.amount - b.amount;
    return 0;
  });

  filteredData = data;
  currentPage  = 1;
  renderTable();
  renderSummary();
}

/* ── Summary chips ── */
function renderSummary() {
  const inc = filteredData.filter(t => t.type === 'income') .reduce((s, t) => s + t.amount, 0);
  const exp = filteredData.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const sav = filteredData.filter(t => t.type === 'saving') .reduce((s, t) => s + t.amount, 0);

  document.getElementById('histSummary').innerHTML = `
    <div class="hist-chip">
      <div class="hist-chip-label">Showing</div>
      <div class="hist-chip-value">${filteredData.length} records</div>
    </div>
    <div class="hist-chip">
      <div class="hist-chip-label">Income</div>
      <div class="hist-chip-value" style="color:var(--green)">${fmtCurrency(inc)}</div>
    </div>
    <div class="hist-chip">
      <div class="hist-chip-label">Expenses</div>
      <div class="hist-chip-value" style="color:var(--red)">${fmtCurrency(exp)}</div>
    </div>
    <div class="hist-chip">
      <div class="hist-chip-label">Savings</div>
      <div class="hist-chip-value" style="color:var(--cyan)">${fmtCurrency(sav)}</div>
    </div>`;
}

/* ── Table with pagination ── */
function renderTable() {
  const total = filteredData.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  currentPage = Math.min(currentPage, pages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const page  = filteredData.slice(start, start + PAGE_SIZE);

  document.getElementById('histCount').textContent    = total + ' records';
  document.getElementById('pageInfo').textContent     =
    total ? `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, total)} of ${total}` : '';
  document.getElementById('prevPage').disabled = currentPage <= 1;
  document.getElementById('nextPage').disabled = currentPage >= pages;

  const tbody = document.getElementById('histTableBody');
  if (!page.length) {
    tbody.innerHTML = `<tr><td colspan="7">
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-title">No records found</div>
        <div class="empty-desc">Try adjusting your filters</div>
      </div></td></tr>`;
    return;
  }

  tbody.innerHTML = page.map(tx => `
    <tr class="animate-in">
      <td><div class="tx-icon-cell">${catIcon(tx.category)}</div></td>
      <td class="text-muted" style="white-space:nowrap">${fmtDate(tx.date)}</td>
      <td style="max-width:200px">${tx.description || '<span class="text-muted">—</span>'}</td>
      <td>${typeBadge(tx.type)}</td>
      <td><span class="badge-cat">${tx.category}</span></td>
      <td class="text-muted" style="text-transform:capitalize">${tx.method || '—'}</td>
      <td class="text-right ${tx.type === 'income' ? 'amount-positive' : tx.type === 'saving' ? 'amount-saving' : 'amount-negative'}">
        ${tx.type === 'income' ? '+' : '−'}${fmtCurrency(tx.amount)}
      </td>
    </tr>`).join('');
}

/* ── Pagination buttons ── */
document.getElementById('prevPage').addEventListener('click', () => { currentPage--; renderTable(); });
document.getElementById('nextPage').addEventListener('click', () => { currentPage++; renderTable(); });

/* ── Filter listeners ── */
['histSearch', 'histType', 'histCat', 'histFrom', 'histTo', 'histSort'].forEach(id => {
  document.getElementById(id).addEventListener(
    id === 'histSearch' ? 'input' : 'change',
    applyFilters
  );
});

document.getElementById('clearHistFilter').addEventListener('click', () => {
  ['histSearch', 'histType', 'histCat', 'histFrom', 'histTo'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('histSort').value = 'date-desc';
  applyFilters();
});

/* ── CSV Export ── */
document.getElementById('exportBtn').addEventListener('click', () => {
  const rows = [['Date', 'Description', 'Type', 'Category', 'Method', 'Amount (₹)']];
  filteredData.forEach(tx => {
    rows.push([
      tx.date,
      tx.description || '',
      tx.type,
      tx.category,
      tx.method || '',
      tx.amount,
    ]);
  });
  const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'moneymate-history.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exported ✔', 'success');
});

applyFilters();
