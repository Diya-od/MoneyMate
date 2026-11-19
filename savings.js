// ============================================================
// savings.js — JavaScript for Savings Goals page
// Depends on: shared.js (loaded first)
// ============================================================

highlightNav();
initMobileMenu();

/* ── Goal Modal ── */
const goalModal = document.getElementById('goalModal');

function openGoalModal(goal = null) {
  document.getElementById('editGoalId').value   = goal ? goal.id            : '';
  document.getElementById('goalName').value     = goal ? goal.name          : '';
  document.getElementById('goalTarget').value   = goal ? goal.target        : '';
  document.getElementById('goalCurrent').value  = goal ? goal.current       : '';
  document.getElementById('goalDesc').value     = goal ? goal.description || '' : '';
  document.getElementById('goalModalTitle').textContent = goal ? 'Edit Goal' : 'Add Savings Goal';
  goalModal.classList.add('open');
}
function closeGoalModal() { goalModal.classList.remove('open'); }

document.getElementById('addGoalBtn').addEventListener('click', () => openGoalModal());
document.getElementById('goalModalClose').addEventListener('click', closeGoalModal);
document.getElementById('goalCancelBtn').addEventListener('click', closeGoalModal);
goalModal.addEventListener('click', e => { if (e.target === goalModal) closeGoalModal(); });

document.getElementById('saveGoalBtn').addEventListener('click', () => {
  const name    = document.getElementById('goalName').value.trim();
  const target  = parseFloat(document.getElementById('goalTarget').value);
  const current = parseFloat(document.getElementById('goalCurrent').value) || 0;
  const desc    = document.getElementById('goalDesc').value.trim();

  if (!name)             { showToast('Enter a goal name', 'error');          return; }
  if (!target || target <= 0) { showToast('Enter a valid target amount', 'error'); return; }

  const id = document.getElementById('editGoalId').value;
  if (id) {
    updateSavingGoal(id, { name, target, current, description: desc });
    showToast('Goal updated ✔', 'success');
  } else {
    addSavingGoal({ name, target, current, description: desc });
    showToast('Goal added ✔', 'success');
  }
  closeGoalModal();
  renderGoals();
});

/* ── Money Modal ── */
const moneyModal = document.getElementById('moneyModal');

function openMoneyModal(id, action) {
  document.getElementById('moneyGoalId').value    = id;
  document.getElementById('moneyAction').value    = action;
  document.getElementById('moneyAmount').value    = '';
  document.getElementById('moneyModalTitle').textContent =
    action === 'add' ? '➕ Add Money to Goal' : '➖ Remove Money from Goal';
  moneyModal.classList.add('open');
}
function closeMoneyModal() { moneyModal.classList.remove('open'); }

document.getElementById('moneyModalClose').addEventListener('click', closeMoneyModal);
document.getElementById('moneyCancelBtn').addEventListener('click', closeMoneyModal);
moneyModal.addEventListener('click', e => { if (e.target === moneyModal) closeMoneyModal(); });

document.getElementById('saveMoneyBtn').addEventListener('click', () => {
  const id     = document.getElementById('moneyGoalId').value;
  const action = document.getElementById('moneyAction').value;
  const amount = parseFloat(document.getElementById('moneyAmount').value);

  if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }

  const goal = getSavings().find(g => g.id === id);
  if (!goal) return;

  const newCurrent = action === 'add'
    ? goal.current + amount
    : Math.max(0, goal.current - amount);

  updateSavingGoal(id, { current: newCurrent });
  showToast(
    action === 'add'
      ? `${fmtCurrency(amount)} added to "${goal.name}" ✔`
      : `${fmtCurrency(amount)} removed from "${goal.name}"`,
    'success'
  );
  closeMoneyModal();
  renderGoals();
});

/* ── Delete Goal ── */
function deleteGoal(id) {
  if (!confirmDialog('Delete this savings goal?')) return;
  deleteSavingGoal(id);
  showToast('Goal deleted', 'info');
  renderGoals();
}

/* ── Render ── */
function renderGoals() {
  const goals = getSavings();

  /* Summary bar */
  const totalTarget  = goals.reduce((s, g) => s + g.target,  0);
  const totalCurrent = goals.reduce((s, g) => s + g.current, 0);
  const done = goals.filter(g => g.current >= g.target).length;

  document.getElementById('savSummary').innerHTML = `
    <div class="sav-chip">
      <div class="sav-chip-label">Total Goals</div>
      <div class="sav-chip-value">${goals.length}</div>
    </div>
    <div class="sav-chip">
      <div class="sav-chip-label">Total Saved</div>
      <div class="sav-chip-value" style="color:var(--green)">${fmtCurrency(totalCurrent)}</div>
    </div>
    <div class="sav-chip">
      <div class="sav-chip-label">Total Target</div>
      <div class="sav-chip-value" style="color:var(--accent)">${fmtCurrency(totalTarget)}</div>
    </div>
    <div class="sav-chip">
      <div class="sav-chip-label">Completed</div>
      <div class="sav-chip-value" style="color:var(--cyan)">${done}</div>
    </div>`;

  const grid = document.getElementById('goalsGrid');
  if (!goals.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;padding:60px 0">
      <div class="empty-icon">💵</div>
      <div class="empty-title">No savings goals yet</div>
      <div class="empty-desc">Click "Add Goal" to create your first savings target</div>
    </div>`;
    return;
  }

  grid.innerHTML = goals.map(g => {
    const pct       = g.target ? Math.min(Math.round(g.current / g.target * 100), 100) : 0;
    const rem       = Math.max(0, g.target - g.current);
    const barClass  = pct >= 100 ? 'green' : pct >= 60 ? 'cyan' : '';
    const completed = g.current >= g.target;

    return `<div class="goal-card animate-in ${completed ? 'completed' : ''}">
      ${completed ? '<div class="completed-badge">✅ Completed</div>' : ''}
      <div class="goal-top">
        <div class="goal-name">${g.name}</div>
        <div class="goal-pct">${pct}%</div>
      </div>
      <div class="goal-desc">${g.description || 'No description'}</div>
      <div class="goal-progress-wrap">
        <div class="progress-wrap"><div class="progress-bar ${barClass}" style="width:${pct}%"></div></div>
      </div>
      <div class="goal-amounts">
        <span class="goal-target">Target: ${fmtCurrency(g.target)}</span>
        <span class="goal-current">${fmtCurrency(g.current)} saved</span>
      </div>
      <div class="goal-remaining">Remaining: ${fmtCurrency(rem)}</div>
      <div class="goal-actions">
        <button class="btn btn-success btn-sm"
          onclick="openMoneyModal('${g.id}','add')">+ Add</button>
        <button class="btn btn-danger btn-sm"
          onclick="openMoneyModal('${g.id}','remove')">− Remove</button>
        <button class="btn btn-secondary btn-sm"
          onclick="openGoalModal(getSavings().find(x=>x.id==='${g.id}'))">✏️ Edit</button>
        <button class="btn btn-danger btn-sm"
          onclick="deleteGoal('${g.id}')">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

renderGoals();
