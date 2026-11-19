// ============================================================
// landing.js — JavaScript for Landing Page (index.html)
// Depends on: shared.js (loaded first)
// ============================================================

/* ── Format helper (compact: 1.2L, 45K) ── */
function fmtK(n) {
  n = parseFloat(n) || 0;
  if (Math.abs(n) >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  if (Math.abs(n) >= 1000)   return '₹' + (n / 1000).toFixed(1)   + 'K';
  return '₹' + n.toFixed(0);
}

/* ── Load live stats from LocalStorage into the hero cards ── */
function loadLiveStats() {
  const { income, expenses, savings, totalAssets, balance, netWorth } = calcSummary();
  const goals = getSavings();
  const txs   = getTransactions();

  document.getElementById('liveBalance').textContent   = fmtK(balance);
  document.getElementById('liveAssets').textContent    = fmtK(totalAssets);
  document.getElementById('liveGoals').textContent     = goals.length + ' goals';
  document.getElementById('liveNetWorth').textContent  = fmtK(netWorth);

  // Mockup dashboard values
  document.getElementById('mBalance').textContent   = fmtK(balance);
  document.getElementById('mIncome').textContent    = fmtK(income);
  document.getElementById('mExpenses').textContent  = fmtK(expenses);

  // Mockup spending bars — top 4 expense categories this month
  const now = new Date();
  const catSpend = {};
  txs.forEach(tx => {
    if (tx.type !== 'expense') return;
    const d = new Date(tx.date);
    if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return;
    catSpend[tx.category] = (catSpend[tx.category] || 0) + tx.amount;
  });
  const sorted   = Object.entries(catSpend).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxVal   = sorted[0]?.[1] || 1;
  const barColors = ['#4f8ef7', '#7b5ffc', '#22c55e', '#f59e0b'];

  const mockBarsEl = document.getElementById('mockBars');
  if (mockBarsEl) {
    mockBarsEl.innerHTML = sorted.length
      ? sorted.map(([cat, val], i) => `
          <div class="mock-bar-row">
            <div class="mock-bar-label">${cat}</div>
            <div class="mock-bar-track">
              <div class="mock-bar-fill" style="width:${Math.round(val / maxVal * 100)}%;background:${barColors[i % barColors.length]}"></div>
            </div>
          </div>`).join('')
      : '<div style="font-size:11px;color:var(--text3);padding:8px 0">No expense data this month</div>';
  }

  // Mockup recent transactions (last 4)
  const recent = txs.slice(0, 4);
  const mockTxsEl = document.getElementById('mockTxs');
  if (mockTxsEl) {
    mockTxsEl.innerHTML = recent.length
      ? recent.map(tx => `
          <div class="mock-tx">
            <span>${catIcon(tx.category)} ${tx.description
              ? tx.description.substring(0, 16) + (tx.description.length > 16 ? '…' : '')
              : tx.category}</span>
            <span style="font-weight:700;color:${tx.type === 'income' ? 'var(--green)' : tx.type === 'saving' ? 'var(--cyan)' : '#ef4444'}">
              ${tx.type === 'income' ? '+' : '−'}${fmtK(tx.amount)}
            </span>
          </div>`).join('')
      : '<div style="font-size:11px;color:var(--text3)">No transactions yet</div>';
  }
}

/* ── Infinite ticker strip ── */
function buildTicker() {
  const TICKER_DATA = [
    { icon: '💵', name: 'Cash',          val: '₹20,000', pos: true  },
    { icon: '🏦', name: 'Bank',          val: '₹85,000', pos: true  },
    { icon: '🥇', name: 'Gold',          val: '₹75,000', pos: true  },
    { icon: '📈', name: 'Mutual Funds',  val: '₹30,000', pos: true  },
    { icon: '📋', name: 'Fixed Deposit', val: '₹50,000', pos: true  },
    { icon: '🏠', name: 'Property',      val: '↑ 4.2%',  pos: true  },
    { icon: '🚗', name: 'Vehicle',       val: '↓ 1.8%',  pos: false },
    { icon: '💻', name: 'Electronics',   val: '₹65,000', pos: true  },
    { icon: '✈️', name: 'Travel Goal',   val: '5% done', pos: true  },
    { icon: '🎯', name: 'Emergency Fund',val: '30% done',pos: true  },
  ];

  // Duplicate for seamless infinite scroll
  const doubled = [...TICKER_DATA, ...TICKER_DATA];
  const track = document.getElementById('tickerTrack');
  if (!track) return;
  track.innerHTML = doubled.map(item => `
    <div class="ticker-card">
      <span class="ticker-icon">${item.icon}</span>
      <span class="ticker-name">${item.name}</span>
      <span class="ticker-val ${item.pos ? '' : 'ticker-neg'}">${item.val}</span>
    </div>`).join('');
}

/* ── Scroll reveal (IntersectionObserver) ── */
function initScrollReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ── Init ── */
loadLiveStats();
buildTicker();
initScrollReveal();
