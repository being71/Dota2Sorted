// ─── Dota 2 AI Draft Assistant — Main App ───────────────────
import { HEROES, HERO_MAP, getHeroImage } from '../data/heroes.js';
import { ITEMS, getItemImage } from '../data/items.js';
import { AIEngine } from './ai-engine.js';
import { initDataFetcher, onStatusChange, getDataStatus, fetchHeroMatchups, fetchItemPopularity } from './data-fetcher.js';

// ─── State ──────────────────────────────────────────────────
const engine = new AIEngine();
let pickMode = 'ally'; // 'ally' | 'enemy'
let attrFilter = null;
let searchQuery = '';
let selectedRoadmapHero = null;

// ─── DOM Elements ───────────────────────────────────────────
const $ = id => document.getElementById(id);
const heroGrid = $('hero-grid');
const allyPanel = $('ally-picks');
const enemyPanel = $('enemy-picks');
const recList = $('rec-list');
const roadmapSelect = $('roadmap-hero-select');
const roadmapContent = $('roadmap-content');
const searchBox = $('search-box');
const pickModeEl = $('pick-mode');
const btnAlly = $('btn-ally-pick');
const btnEnemy = $('btn-enemy-pick');
const btnReset = $('btn-reset');
const tooltip = $('tooltip');

// ─── Initialize ─────────────────────────────────────────────
async function init() {
  renderHeroGrid();
  renderTeamPanels();
  bindEvents();

  updateDataStatus('loading');
  await initDataFetcher();
  updateDataStatus(getDataStatus());
  onStatusChange(status => updateDataStatus(status));
}

// ─── Data Status Indicator ──────────────────────────────────
function updateDataStatus(status) {
  let statusEl = document.querySelector('.data-status');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.className = 'data-status';
    document.querySelector('.header-inner').appendChild(statusEl);
  }
  const labels = {
    loading: '⏳ Fetching live data...',
    live: '📡 Live data (Divine+)',
    cached: '📦 Cached data (Divine+)',
    offline: '⚠️ Offline (heuristic mode)'
  };
  statusEl.textContent = labels[status] || status;
  statusEl.className = `data-status ${status}`;
}

// ─── Events ─────────────────────────────────────────────────
function bindEvents() {
  btnAlly.addEventListener('click', () => setPickMode('ally'));
  btnEnemy.addEventListener('click', () => setPickMode('enemy'));
  btnReset.addEventListener('click', resetDraft);
  searchBox.addEventListener('input', () => {
    searchQuery = searchBox.value.toLowerCase();
    renderHeroGrid();
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const attr = btn.dataset.attr;
      attrFilter = attrFilter === attr ? null : attr;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      if (attrFilter) btn.classList.add('active');
      renderHeroGrid();
    });
  });
}

function setPickMode(mode) {
  pickMode = mode;
  btnAlly.classList.toggle('active', mode === 'ally');
  btnEnemy.classList.toggle('active', mode === 'enemy');
  pickModeEl.className = `pick-mode-indicator ${mode}`;
  pickModeEl.innerHTML = mode === 'ally'
    ? '🟢 Picking for <strong>YOUR</strong> team'
    : '🔴 Picking for <strong>ENEMY</strong> team';
}

// ─── Reset ──────────────────────────────────────────────────
function resetDraft() {
  engine.reset();
  pickMode = 'ally';
  attrFilter = null;
  searchQuery = '';
  selectedRoadmapHero = null;
  searchBox.value = '';
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  setPickMode('ally');
  renderAll();
}

// ─── Render all views ───────────────────────────────────────
function renderAll() {
  renderHeroGrid();
  renderTeamPanels();
  renderRecommendations();
  renderRolePanel();
  renderRoadmap();
}

// ─── Hero Grid ──────────────────────────────────────────────
function renderHeroGrid() {
  const picked = new Set(engine.allPicked());
  const filtered = HEROES.filter(h => {
    if (picked.has(h.id)) return false;
    if (attrFilter && h.attr !== attrFilter) return false;
    if (searchQuery && !h.name.toLowerCase().includes(searchQuery)) return false;
    return true;
  });

  heroGrid.innerHTML = filtered.map(h => `
    <div class="hero-card ${h.attr}" data-id="${h.id}" title="${h.name}">
      <img src="${getHeroImage(h)}" alt="${h.name}" loading="lazy"
        onerror="this.style.display='none'">
      <span class="attr-dot ${h.attr}"></span>
      <div class="hero-name">${h.name}</div>
    </div>
  `).join('');

  heroGrid.querySelectorAll('.hero-card').forEach(card => {
    card.addEventListener('click', () => onHeroPick(card.dataset.id));
    card.addEventListener('mouseenter', e => showTooltip(e, card.dataset.id));
    card.addEventListener('mouseleave', () => hideTooltip());
  });
}

// ─── Hero Pick ──────────────────────────────────────────────
async function onHeroPick(heroId) {
  const maxPicks = 5;
  const current = pickMode === 'ally' ? engine.allyPicks : engine.enemyPicks;
  if (current.length >= maxPicks) return;

  engine.addPick(heroId, pickMode);

  // Fetch matchup data for newly picked enemy
  if (pickMode === 'enemy') {
    const hero = HERO_MAP[heroId];
    if (hero?.dotaId) {
      fetchHeroMatchups(hero.dotaId).then(() => renderRecommendations());
    }
  }

  // Fetch matchup + item data for ally
  if (pickMode === 'ally') {
    const hero = HERO_MAP[heroId];
    if (hero?.dotaId) {
      fetchHeroMatchups(hero.dotaId);
      fetchItemPopularity(hero.dotaId).then(() => renderRoadmap());
    }
    // Auto-assign roles when ally picked
    engine.assignRoles();
  }

  renderAll();
}

// ─── Team Panels ────────────────────────────────────────────
function renderTeamPanels() {
  renderPanel(allyPanel, engine.allyPicks, 'ally');
  renderPanel(enemyPanel, engine.enemyPicks, 'enemy');
}

function renderPanel(panel, picks, team) {
  const slots = [];
  for (let i = 0; i < 5; i++) {
    if (picks[i]) {
      const hero = HERO_MAP[picks[i]];
      const pos = team === 'ally' ? engine.getHeroPosition(picks[i]) : null;
      const posLabel = pos ? engine.getPositionLabel(pos) : null;
      slots.push(`
        <div class="pick-slot filled" data-id="${picks[i]}" data-team="${team}">
          <img src="${getHeroImage(hero)}" alt="${hero.name}">
          <span class="pick-name">${hero.name}</span>
          ${posLabel ? `<span class="pick-role-badge">${posLabel.icon} ${posLabel.short}</span>` : ''}
          <button class="pick-remove" title="Remove">✕</button>
        </div>
      `);
    } else {
      slots.push(`<div class="pick-slot empty"><span class="slot-num">${i + 1}</span><span class="slot-dash">—</span></div>`);
    }
  }
  panel.innerHTML = slots.join('');

  panel.querySelectorAll('.pick-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const slot = btn.closest('.pick-slot');
      engine.removePick(slot.dataset.id, slot.dataset.team);
      if (selectedRoadmapHero === slot.dataset.id) selectedRoadmapHero = null;
      if (slot.dataset.team === 'ally') engine.assignRoles();
      renderAll();
    });
  });
}

// ─── Role Panel ─────────────────────────────────────────────
function renderRolePanel() {
  let rolePanel = $('role-panel');
  if (!rolePanel) {
    rolePanel = document.createElement('div');
    rolePanel.id = 'role-panel';
    rolePanel.className = 'role-panel';
    const allySection = document.querySelector('.team-panel.ally') || allyPanel.parentElement;
    allySection.parentElement.insertBefore(rolePanel, allySection.nextSibling);
  }

  if (engine.allyPicks.length === 0) {
    rolePanel.innerHTML = '';
    rolePanel.style.display = 'none';
    return;
  }

  rolePanel.style.display = 'block';

  // User role selector
  const positions = [1, 2, 3, 4, 5];
  let html = `<div class="role-selector">
    <h4>🎮 Your Role</h4>
    <div class="role-btns">
      ${positions.map(p => {
    const label = engine.getPositionLabel(p);
    return `<button class="role-btn ${engine.userRole === p ? 'active' : ''}" data-pos="${p}">
          ${label.icon} ${label.short}
        </button>`;
  }).join('')}
      <button class="role-btn ${!engine.userRole ? 'active' : ''}" data-pos="0">❌ Auto</button>
    </div>
  </div>`;

  // Role assignments
  if (engine.allyPicks.length >= 2) {
    const assignments = engine.roleAssignments;
    html += `<div class="role-assignments">
      <h4>📋 Role Assignments</h4>
      <div class="assignment-list">
        ${engine.allyPicks.map(id => {
      const hero = HERO_MAP[id];
      const pos = assignments[id];
      const posLabel = pos ? engine.getPositionLabel(pos) : null;
      return `<div class="assignment-row" data-id="${id}">
            <img src="${getHeroImage(hero)}" alt="${hero.name}">
            <span class="assign-hero-name">${hero.name}</span>
            <select class="assign-role-select" data-id="${id}">
              ${positions.map(p => {
        const lbl = engine.getPositionLabel(p);
        return `<option value="${p}" ${pos === p ? 'selected' : ''}>${lbl.icon} ${lbl.name}</option>`;
      }).join('')}
            </select>
          </div>`;
    }).join('')}
      </div>
    </div>`;
  }

  rolePanel.innerHTML = html;

  // Bind role selector buttons
  rolePanel.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pos = parseInt(btn.dataset.pos);
      engine.setUserRole(pos === 0 ? null : pos);
      engine.assignRoles();
      renderAll();
    });
  });

  // Bind role assignment dropdowns
  rolePanel.querySelectorAll('.assign-role-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const heroId = sel.dataset.id;
      const pos = parseInt(sel.value);
      engine.setHeroPosition(heroId, pos);
      renderAll();
    });
  });
}

// ─── Recommendations ────────────────────────────────────────
function renderRecommendations() {
  const recs = engine.getRecommendations();

  if (recs.length === 0) {
    recList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎯</div>
        <div class="empty-text">Start picking heroes to get<br>AI recommendations</div>
      </div>`;
    return;
  }

  recList.innerHTML = recs.map((rec, i) => {
    const h = rec.hero;
    const reasons = engine.buildReasons(rec);
    return `
      <div class="rec-item" data-id="${h.id}">
        <div class="rec-rank">#${i + 1}</div>
        <img class="rec-img" src="${getHeroImage(h)}" alt="${h.name}">
        <div class="rec-info">
          <div class="rec-name">${h.name}</div>
          <div class="rec-score">Score: ${rec.score.toFixed(1)} · ${h.roles.join(', ')}${rec.winRateDisplay ? ` · ${rec.winRateDisplay}% WR` : ''}</div>
          <div class="rec-reasons">${reasons.join(' · ')}</div>
        </div>
        <button class="btn btn-pick" data-id="${h.id}">PICK</button>
      </div>
    `;
  }).join('');

  recList.querySelectorAll('.btn-pick').forEach(btn => {
    btn.addEventListener('click', () => {
      pickMode = 'ally';
      setPickMode('ally');
      onHeroPick(btn.dataset.id);
    });
  });
}

// ─── Roadmap ────────────────────────────────────────────────
function renderRoadmap() {
  if (engine.allyPicks.length === 0) {
    roadmapSelect.innerHTML = '';
    roadmapContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🗺️</div>
        <div class="empty-text">Pick allies to generate<br>item roadmaps</div>
      </div>`;
    return;
  }

  roadmapSelect.innerHTML = engine.allyPicks.map(id => {
    const h = HERO_MAP[id];
    const pos = engine.getHeroPosition(id);
    const posLabel = pos ? engine.getPositionLabel(pos) : null;
    return `<button class="roadmap-hero-btn ${selectedRoadmapHero === id ? 'active' : ''}" data-id="${id}">
      <img src="${getHeroImage(h)}" alt="${h.name}"> ${h.name}
      ${posLabel ? `<span class="rm-role-tag">${posLabel.icon}</span>` : ''}
    </button>`;
  }).join('');

  roadmapSelect.querySelectorAll('.roadmap-hero-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRoadmapHero = btn.dataset.id;
      renderRoadmap();
    });
  });

  // Auto-select first ally if none selected
  if (!selectedRoadmapHero && engine.allyPicks.length > 0) {
    selectedRoadmapHero = engine.allyPicks[0];
    renderRoadmap();
    return;
  }

  const roadmap = engine.generateItemRoadmap(selectedRoadmapHero);
  if (!roadmap) return;

  let html = '';

  // Position badge
  if (roadmap.position) {
    const posLabel = engine.getPositionLabel(roadmap.position);
    html += `<div class="roadmap-position-badge">
      <span class="pos-icon">${posLabel.icon}</span>
      <span class="pos-name">${posLabel.name}</span>
      <span class="pos-lane">· ${posLabel.lane}</span>
    </div>`;
  }

  // Data source indicator with role context
  const roleSuffix = roadmap.position
    ? (roadmap.position <= 3 ? ' · Core Build' : ' · Support Build')
    : '';
  html += `<div class="roadmap-data-source ${roadmap.dataSource}">
    ${roadmap.dataSource === 'api' ? `📊 Built from real match data (Divine+)${roleSuffix}` : `📋 Template build (offline)${roleSuffix}`}
  </div>`;

  // ─── Facets ───
  if (roadmap.facets?.length) {
    html += `<div class="roadmap-section facets-section">
      <h4>💠 FACETS</h4>
      <div class="facets-grid">
        ${roadmap.facets.map(f => `
          <div class="facet-card facet-${f.color}">
            <div class="facet-title">${f.title}</div>
            <div class="facet-desc">${f.description}</div>
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  // ─── Talent Tree ───
  if (roadmap.talents?.length) {
    html += `<div class="roadmap-section talent-section">
      <h4>🌟 TALENT TREE</h4>
      <div class="talent-tree">
        ${roadmap.talents.slice().reverse().map(tier => `
          <div class="talent-tier">
            <div class="talent-left">${tier.left}</div>
            <div class="talent-level">Lv ${tier.level}</div>
            <div class="talent-right">${tier.right}</div>
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  if (roadmap.dataSource === 'api') {
    // Render API-driven item phases
    if (roadmap.startItems?.length) {
      html += renderApiPhase('🏁 STARTING ITEMS', roadmap.startItems);
    }
    if (roadmap.earlyItems?.length) {
      html += renderApiPhase('🌅 EARLY GAME', roadmap.earlyItems);
    }
    if (roadmap.coreItems?.length) {
      html += renderApiPhase('⚔️ CORE / MID GAME', roadmap.coreItems);
    }
    if (roadmap.lateItems?.length) {
      html += renderApiPhase('💎 LATE GAME', roadmap.lateItems);
    }
  } else {
    // Template fallback rendering
    if (roadmap.boots && ITEMS[roadmap.boots]) {
      html += `<div class="roadmap-section">
        <h4>👟 BOOTS</h4>
        <div class="item-row">
          <div class="item-chip"><img src="${getItemImage(roadmap.boots)}" onerror="this.style.display='none'">${ITEMS[roadmap.boots].name}</div>
        </div>
      </div>`;
    }
    if (roadmap.core?.length) {
      html += `<div class="roadmap-section">
        <h4>⚔️ CORE BUILD</h4>
        <div class="item-row">${roadmap.core.map(id => ITEMS[id] ?
        `<div class="item-chip"><img src="${getItemImage(id)}" onerror="this.style.display='none'">${ITEMS[id].name}</div>` : ''
      ).join('')}</div>
      </div>`;
    }
    if (roadmap.luxury?.length) {
      html += `<div class="roadmap-section">
        <h4>💎 LUXURY / LATE GAME</h4>
        <div class="item-row">${roadmap.luxury.map(id => ITEMS[id] ?
        `<div class="item-chip"><img src="${getItemImage(id)}" onerror="this.style.display='none'">${ITEMS[id].name}</div>` : ''
      ).join('')}</div>
      </div>`;
    }
    if (roadmap.timings && Object.keys(roadmap.timings).length) {
      html += `<div class="roadmap-section">
        <h4>⏱️ TIMING TARGETS</h4>
        ${Object.entries(roadmap.timings).map(([item, min]) => ITEMS[item] ? `
          <div class="timing-row">
            <span class="timing-min">${min}:00</span>
            <div>
              <div class="timing-item">${ITEMS[item].name}</div>
              <div class="timing-note">${getTimingNote(item, roadmap.hero)}</div>
            </div>
          </div>` : ''
      ).join('')}
      </div>`;
    }
  }

  // Situational (shown for both modes)
  if (roadmap.situational?.length) {
    html += `<div class="roadmap-section situational">
      <h4>🔄 SITUATIONAL (vs Enemy)</h4>
      ${roadmap.situational.map(s => {
      const itemKey = s.item;
      const itemData = ITEMS[itemKey];
      if (!itemData) return '';
      return `
          <div class="sit-item">
            <img src="${getItemImage(itemKey)}" onerror="this.style.display='none'">
            <div>
              <div class="sit-name">${itemData.name}</div>
              <div class="sit-reason">${s.reason}</div>
            </div>
          </div>`;
    }).join('')}
    </div>`;
  }

  // Matchup items placeholder (populated async)
  html += `<div id="matchup-items-section"></div>`;

  // Tips
  if (roadmap.tips?.length) {
    html += `<div class="roadmap-section tips">
      <h4>💡 GAME TIPS</h4>
      ${roadmap.tips.map(t => `<div class="tip-row">${t}</div>`).join('')}
    </div>`;
  }

  roadmapContent.innerHTML = html;

  // Async: fetch matchup items if enemies are picked
  if (engine.enemyPicks.length > 0 && selectedRoadmapHero) {
    engine.fetchMatchupItems(selectedRoadmapHero).then(matchupItems => {
      const container = document.getElementById('matchup-items-section');
      if (!container || !matchupItems?.length) return;
      container.innerHTML = `<div class="roadmap-section matchup-items">
        <h4>📊 MATCHUP ITEMS (vs Enemy Heroes)</h4>
        <div class="matchup-items-note">Items popular in matches against current enemies</div>
        <div class="item-row api-items">
          ${matchupItems.map(item => `
            <div class="item-chip api-item matchup-item" title="${item.name} — ${Math.round(item.winRate * 100)}% WR in ${item.matchCount} matches">
              <img src="${item.img || ''}" onerror="this.style.display='none'">
              <span class="api-item-name">${item.name}</span>
              <span class="matchup-wr ${item.winRate >= 0.5 ? 'win' : 'lose'}">${Math.round(item.winRate * 100)}%</span>
            </div>
          `).join('')}
        </div>
      </div>`;
    });
  }
}

// ─── Render API item phase ──────────────────────────────────
function renderApiPhase(title, items) {
  return `<div class="roadmap-section api-phase">
    <h4>${title}</h4>
    <div class="item-row api-items">
      ${items.map(item => `
        <div class="item-chip api-item" title="${item.name} (${item.cost}g)">
          <img src="${item.img || getItemImage(item.key)}" onerror="this.style.display='none'">
          <span class="api-item-name">${item.name}</span>
          <span class="api-item-cost">${item.cost}g</span>
        </div>
      `).join('')}
    </div>
  </div>`;
}

function getTimingNote(item, hero) {
  const notes = {
    blink: 'Blink initiation timing',
    maelstrom: 'Farm acceleration',
    desolator: 'Power spike for ganking',
    black_king_bar: 'Teamfight participation',
    radiance: 'Radiance timing for max impact',
    manta: 'Dispel + fight timing',
    diffusal_blade: 'Purge + fight timing',
    hand_of_midas: 'Early gold advantage',
    orchid: 'Solo kill window',
    mask_of_madness: 'Farm + Roshan timing',
    echo_sabre: 'Early fight power spike',
    armlet: 'Aggressive fighting timing',
    blade_mail: 'Counter-initiation timing',
    aghanims_scepter: 'Ultimate upgrade impact',
    aghanims_shard: 'Ability enhancement',
    glimmer_cape: 'Save timing for team',
    force_staff: 'Utility save timing',
    arcane_boots: 'Mana sustain for team',
  };
  return notes[item] || `Key power spike for ${hero?.name || 'hero'}`;
}

// ─── Tooltip ────────────────────────────────────────────────
function showTooltip(e, heroId) {
  const hero = HERO_MAP[heroId];
  if (!hero) return;

  tooltip.innerHTML = `
    <div class="tt-name">${hero.name}</div>
    <div class="tt-meta">${hero.attr.toUpperCase()} · ${hero.type} · ${hero.roles.join(', ')}</div>
    <div class="tt-tags">${hero.tags?.slice(0, 6).map(t => `<span class="tag">${t}</span>`).join('') || ''}</div>
  `;
  tooltip.style.display = 'block';

  const rect = e.target.getBoundingClientRect();
  tooltip.style.left = Math.min(rect.left, window.innerWidth - 280) + 'px';
  tooltip.style.top = (rect.bottom + 8) + 'px';
}

function hideTooltip() {
  tooltip.style.display = 'none';
}

// ─── Start ──────────────────────────────────────────────────
init();
