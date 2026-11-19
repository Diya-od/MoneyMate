// ============================================================
// assets.js — JavaScript for Assets page
// Depends on: shared.js (loaded first)
// ============================================================

highlightNav();
initMobileMenu();

const ASSET_ICONS = {
  cash: '💵', bank: '🏦', gold: '🥇', property: '🏠', land: '🌍',
  investment: '📈', fd: '📋', vehicle: '🚗', electronics: '💻', other: '💡',
};
function aIcon(type) { return ASSET_ICONS[type] || '💡'; }

/* ── Asset Modal ── */
const assetModal = document.getElementById('assetModal');

function openAssetModal(asset = null) {
  document.getElementById('editAssetId').value  = asset ? asset.id            : '';
  document.getElementById('assetName').value    = asset ? asset.name          : '';
  document.getElementById('assetType').value    = asset ? asset.type          : 'cash';
  document.getElementById('assetValue').value   = asset ? asset.value         : '';
  document.getElementById('assetDate').value    = asset ? asset.date          : todayISO();
  document.getElementById('assetDesc').value    = asset ? asset.description || '' : '';
  document.getElementById('assetModalTitle').textContent = asset ? 'Edit Asset' : 'Add Asset';
  assetModal.classList.add('open');
}
function closeAssetModal() { assetModal.classList.remove('open'); }

document.getElementById('addAssetBtn').addEventListener('click', () => openAssetModal());
document.getElementById('assetModalClose').addEventListener('click', closeAssetModal);
document.getElementById('assetCancelBtn').addEventListener('click', closeAssetModal);
assetModal.addEventListener('click', e => { if (e.target === assetModal) closeAssetModal(); });

document.getElementById('saveAssetBtn').addEventListener('click', () => {
  const name  = document.getElementById('assetName').value.trim();
  const type  = document.getElementById('assetType').value;
  const value = parseFloat(document.getElementById('assetValue').value);
  const date  = document.getElementById('assetDate').value;
  const desc  = document.getElementById('assetDesc').value.trim();

  if (!name)                     { showToast('Enter asset name', 'error');        return; }
  if (isNaN(value) || value < 0) { showToast('Enter a valid value', 'error');     return; }

  const id = document.getElementById('editAssetId').value;
  if (id) {
    updateAsset(id, { name, type, value, date, description: desc });
    showToast('Asset updated ✔', 'success');
  } else {
    addAsset({ name, type, value, date, description: desc });
    showToast('Asset added ✔', 'success');
  }
  closeAssetModal();
  renderAssets();
});

/* ── Delete Asset ── */
function removeAsset(id) {
  if (!confirmDialog('Delete this asset? This will reduce your Net Worth.')) return;
  deleteAsset(id);
  showToast('Asset deleted', 'info');
  renderAssets();
}

/* ── Render ── */
function renderAssets() {
  let assets = getAssets();
  const search = document.getElementById('assetSearch').value.toLowerCase();
  const typeF  = document.getElementById('assetTypeFilter').value;

  if (search) assets = assets.filter(a =>
    a.name.toLowerCase().includes(search) ||
    (a.description || '').toLowerCase().includes(search)
  );
  if (typeF) assets = assets.filter(a => a.type === typeF);

  /* Summary chips */
  const allAssets   = getAssets();
  const totalVal    = allAssets.reduce((s, a) => s + a.value, 0);
  const typeGroups  = {};
  allAssets.forEach(a => { typeGroups[a.type] = (typeGroups[a.type] || 0) + a.value; });
  const topType     = Object.entries(typeGroups).sort((a, b) => b[1] - a[1])[0];

  document.getElementById('assetSummary').innerHTML = `
    <div class="asset-chip">
      <div class="asset-chip-label">Total Assets</div>
      <div class="asset-chip-value" style="color:var(--yellow)">${fmtCurrency(totalVal)}</div>
    </div>
    <div class="asset-chip">
      <div class="asset-chip-label">No. of Assets</div>
      <div class="asset-chip-value">${allAssets.length}</div>
    </div>
    <div class="asset-chip">
      <div class="asset-chip-label">Largest Category</div>
      <div class="asset-chip-value" style="color:var(--accent)">${topType ? topType[0] : '—'}</div>
    </div>
    <div class="asset-chip">
      <div class="asset-chip-label">Net Worth</div>
      <div class="asset-chip-value" style="color:var(--purple)">${fmtCurrency(calcSummary().netWorth)}</div>
    </div>`;

  const grid = document.getElementById('assetsGrid');
  if (!assets.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;padding:60px 0">
      <div class="empty-icon">🏦</div>
      <div class="empty-title">No assets found</div>
      <div class="empty-desc">Add your personal assets to track your net worth</div>
    </div>`;
    return;
  }

  grid.innerHTML = assets.map(a => `
    <div class="asset-card animate-in">
      <div class="asset-card-top">
        <span class="asset-type-pill">${aIcon(a.type)} ${a.type}</span>
        <span class="asset-emoji">${aIcon(a.type)}</span>
      </div>
      <div class="asset-name">${a.name}</div>
      <div class="asset-value">${fmtCurrency(a.value)}</div>
      <div class="asset-desc">${a.description || 'No description'}</div>
      <div class="asset-date">Added: ${fmtDate(a.date)}</div>
      <div class="asset-actions">
        <button class="btn btn-secondary btn-sm"
          onclick="openAssetModal(getAssets().find(x=>x.id==='${a.id}'))">✏️ Edit</button>
        <button class="btn btn-danger btn-sm"
          onclick="removeAsset('${a.id}')">🗑️ Delete</button>
      </div>
    </div>`).join('');
}

/* ── Filter listeners ── */
document.getElementById('assetSearch').addEventListener('input', renderAssets);
document.getElementById('assetTypeFilter').addEventListener('change', renderAssets);
document.getElementById('clearAssetFilter').addEventListener('click', () => {
  document.getElementById('assetSearch').value    = '';
  document.getElementById('assetTypeFilter').value = '';
  renderAssets();
});

renderAssets();
