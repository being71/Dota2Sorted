// ─── OpenDota API Data Fetcher ─────────────────────────────
// Fetches real match data from OpenDota API for Divine/Immortal brackets
// Caches in localStorage with 24h TTL

const API_BASE = 'https://api.opendota.com/api';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_KEY_STATS = 'dota2_hero_stats';
const CACHE_KEY_MATCHUPS = 'dota2_hero_matchups';
const CACHE_KEY_ITEM_POP = 'dota2_item_popularity';
const CACHE_KEY_ITEM_CONST = 'dota2_item_constants';
const CACHE_KEY_HERO_ABILITIES = 'dota2_hero_abilities';
const CACHE_KEY_ABILITY_DATA = 'dota2_ability_data';
const CACHE_KEY_MATCHUP_ITEMS = 'dota2_matchup_items';

// Status: 'loading' | 'live' | 'cached' | 'offline'
let dataStatus = 'loading';
let heroStatsData = null;
let heroMatchupsCache = {};
let itemPopularityCache = {};
let itemConstantsData = null;
let heroAbilitiesData = null;   // hero_abilities: talents + facets per hero
let abilityDisplayData = null;  // abilities: talent key → display name
let matchupItemsCache = {};     // dotaId → matchup item frequency data
let statusListeners = [];

// ─── Cache helpers ──────────────────────────────────────────
function getCached(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.timestamp > CACHE_TTL) {
            localStorage.removeItem(key);
            return null;
        }
        return parsed.data;
    } catch { return null; }
}

function setCache(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
    } catch { /* localStorage full, ignore */ }
}

// ─── Status management ──────────────────────────────────────
export function getDataStatus() { return dataStatus; }

export function onStatusChange(fn) {
    statusListeners.push(fn);
    return () => { statusListeners = statusListeners.filter(f => f !== fn); };
}

function setStatus(s) {
    dataStatus = s;
    statusListeners.forEach(fn => fn(s));
}

// ─── Fetch hero stats (all heroes, with rank bracket win rates) ───
export async function fetchHeroStats() {
    const cached = getCached(CACHE_KEY_STATS);
    if (cached) {
        heroStatsData = cached;
        setStatus('cached');
        return cached;
    }

    try {
        setStatus('loading');
        const res = await fetch(`${API_BASE}/heroStats`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const processed = {};
        for (const hero of data) {
            const picks = (hero['6_pick'] || 0) + (hero['7_pick'] || 0);
            const wins = (hero['6_win'] || 0) + (hero['7_win'] || 0);
            const winRate = picks > 0 ? wins / picks : 0.5;
            const proPicks = hero.pro_pick || 0;
            const proWins = hero.pro_win || 0;
            const proWinRate = proPicks > 10 ? proWins / proPicks : null;

            processed[hero.id] = {
                dotaId: hero.id,
                name: hero.localized_name,
                internalName: hero.name,
                attr: hero.primary_attr === 'all' ? 'uni' : hero.primary_attr,
                attackType: hero.attack_type,
                roles: hero.roles || [],
                winRate, picks, wins, proWinRate, proPicks,
                proBans: hero.pro_ban || 0,
                img: hero.img,
                icon: hero.icon
            };
        }

        heroStatsData = processed;
        setCache(CACHE_KEY_STATS, processed);
        setStatus('live');
        return processed;
    } catch (err) {
        console.warn('[DataFetcher] Failed to fetch hero stats:', err.message);
        try {
            const raw = localStorage.getItem(CACHE_KEY_STATS);
            if (raw) {
                heroStatsData = JSON.parse(raw).data;
                setStatus('cached');
                return heroStatsData;
            }
        } catch { }
        setStatus('offline');
        return null;
    }
}

// ─── Fetch matchups for a specific hero ─────────────────────
export async function fetchHeroMatchups(dotaId) {
    if (!dotaId) return null;
    if (heroMatchupsCache[dotaId]) return heroMatchupsCache[dotaId];

    const allCached = getCached(CACHE_KEY_MATCHUPS) || {};
    if (allCached[dotaId]) {
        heroMatchupsCache[dotaId] = allCached[dotaId];
        return allCached[dotaId];
    }

    try {
        const res = await fetch(`${API_BASE}/heroes/${dotaId}/matchups`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const processed = {};
        for (const m of data) {
            if (m.games_played >= 10) {
                processed[m.hero_id] = {
                    games: m.games_played,
                    wins: m.wins,
                    winRate: m.wins / m.games_played
                };
            }
        }

        heroMatchupsCache[dotaId] = processed;
        const existing = getCached(CACHE_KEY_MATCHUPS) || {};
        existing[dotaId] = processed;
        setCache(CACHE_KEY_MATCHUPS, existing);
        return processed;
    } catch (err) {
        console.warn(`[DataFetcher] Failed to fetch matchups for hero ${dotaId}:`, err.message);
        return null;
    }
}

// ─── Fetch item constants (ID → name/img mapping, one-time) ──
export async function fetchItemConstants() {
    const cached = getCached(CACHE_KEY_ITEM_CONST);
    if (cached) {
        itemConstantsData = cached;
        return cached;
    }

    try {
        const res = await fetch(`${API_BASE}/constants/items`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Build a lean map: numericId → { key, name, img, cost }
        const idMap = {};
        for (const [key, item] of Object.entries(data)) {
            if (!item.id || !item.dname) continue;
            // Skip recipes, TP scroll, courier, etc.
            if (key.startsWith('recipe_')) continue;
            idMap[item.id] = {
                key,
                name: item.dname,
                img: item.img ? `https://cdn.cloudflare.steamstatic.com${item.img}` : null,
                cost: item.cost || 0
            };
        }

        itemConstantsData = idMap;
        setCache(CACHE_KEY_ITEM_CONST, idMap);
        return idMap;
    } catch (err) {
        console.warn('[DataFetcher] Failed to fetch item constants:', err.message);
        try {
            const raw = localStorage.getItem(CACHE_KEY_ITEM_CONST);
            if (raw) {
                itemConstantsData = JSON.parse(raw).data;
                return itemConstantsData;
            }
        } catch { }
        return null;
    }
}

// ─── Fetch item popularity for a hero ───────────────────────
export async function fetchItemPopularity(dotaId) {
    if (!dotaId) return null;
    if (itemPopularityCache[dotaId]) return itemPopularityCache[dotaId];

    const allCached = getCached(CACHE_KEY_ITEM_POP) || {};
    if (allCached[dotaId]) {
        itemPopularityCache[dotaId] = allCached[dotaId];
        return allCached[dotaId];
    }

    try {
        const res = await fetch(`${API_BASE}/heroes/${dotaId}/itemPopularity`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Sort each phase by purchase count (descending)
        const processed = {};
        for (const phase of ['start_game_items', 'early_game_items', 'mid_game_items', 'late_game_items']) {
            if (data[phase]) {
                processed[phase] = Object.entries(data[phase])
                    .map(([id, count]) => ({ id: parseInt(id), count }))
                    .sort((a, b) => b.count - a.count);
            } else {
                processed[phase] = [];
            }
        }

        itemPopularityCache[dotaId] = processed;
        const existing = getCached(CACHE_KEY_ITEM_POP) || {};
        existing[dotaId] = processed;
        setCache(CACHE_KEY_ITEM_POP, existing);
        return processed;
    } catch (err) {
        console.warn(`[DataFetcher] Failed to fetch item popularity for hero ${dotaId}:`, err.message);
        return null;
    }
}

// ─── Get real item build for a hero (from API data) ─────────
export function getItemBuild(dotaId) {
    const pop = itemPopularityCache[dotaId];
    if (!pop || !itemConstantsData) return null;

    const resolve = (items, maxCount) => {
        return items
            .slice(0, maxCount)
            .map(entry => {
                const item = itemConstantsData[entry.id];
                if (!item) return null;
                return { ...item, numericId: entry.id, purchases: entry.count };
            })
            .filter(Boolean);
    };

    // Filter out cheap consumables and components for mid/late game
    const filterCore = (items) => items.filter(i => {
        const item = itemConstantsData[i.id];
        return item && item.cost >= 1000;
    });

    return {
        startItems: resolve(pop.start_game_items || [], 8),
        earlyItems: resolve(pop.early_game_items || [], 10),
        midItems: resolve(filterCore(pop.mid_game_items || []), 8),
        lateItems: resolve(filterCore(pop.late_game_items || []), 6),
    };
}

// ─── Fetch hero abilities (talents + facets per hero) ────────
export async function fetchHeroAbilities() {
    // Try cache first
    const cachedAbilities = getCached(CACHE_KEY_HERO_ABILITIES);
    const cachedDisplay = getCached(CACHE_KEY_ABILITY_DATA);
    if (cachedAbilities && cachedDisplay) {
        heroAbilitiesData = cachedAbilities;
        abilityDisplayData = cachedDisplay;
        return;
    }

    try {
        const [abilitiesRes, heroAbilitiesRes] = await Promise.all([
            fetch(`${API_BASE}/constants/abilities`),
            fetch(`${API_BASE}/constants/hero_abilities`)
        ]);
        if (!abilitiesRes.ok || !heroAbilitiesRes.ok) throw new Error('HTTP error');

        const abilitiesRaw = await abilitiesRes.json();
        const heroAbilitiesRaw = await heroAbilitiesRes.json();

        // Build talent display name map: key → display name
        const displayMap = {};
        for (const [key, val] of Object.entries(abilitiesRaw)) {
            if (key.startsWith('special_bonus_') && val.dname) {
                displayMap[key] = val.dname;
            }
        }
        abilityDisplayData = displayMap;
        setCache(CACHE_KEY_ABILITY_DATA, displayMap);

        heroAbilitiesData = heroAbilitiesRaw;
        setCache(CACHE_KEY_HERO_ABILITIES, heroAbilitiesRaw);
    } catch (err) {
        console.warn('[DataFetcher] Failed to fetch hero abilities:', err.message);
    }
}

// ─── Clean up talent display names ──────────────────────────
function cleanTalentName(rawKey, displayName) {
    if (displayName) {
        // Strip parameterized placeholders like {s:value}, {sbonus_...}
        return displayName.replace(/\{[^}]+\}/g, '').replace(/\s+/g, ' ').trim();
    }
    // Fallback: convert key to readable text
    // "special_bonus_unique_lion_5" → "Unique Lion 5"
    // "special_bonus_hp_200" → "HP 200" → "+200 Health"
    let clean = rawKey
        .replace(/^special_bonus_/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    return clean || rawKey;
}

// ─── Get talent tree for a hero (4 tiers × 2 choices) ────────
export function getHeroTalents(heroInternalName) {
    if (!heroAbilitiesData || !abilityDisplayData) return null;
    const heroKey = `npc_dota_hero_${heroInternalName}`;
    const heroData = heroAbilitiesData[heroKey];
    if (!heroData || !heroData.talents) return null;

    // Group into tiers (level 1=Lv10, 2=Lv15, 3=Lv20, 4=Lv25)
    const tierLabels = { 1: 10, 2: 15, 3: 20, 4: 25 };
    const tiers = [];
    for (let lvl = 1; lvl <= 4; lvl++) {
        const pair = heroData.talents.filter(t => t.level === lvl);
        if (pair.length >= 2) {
            tiers.push({
                level: tierLabels[lvl],
                left: cleanTalentName(pair[0].name, abilityDisplayData[pair[0].name]),
                right: cleanTalentName(pair[1].name, abilityDisplayData[pair[1].name])
            });
        }
    }
    return tiers.length > 0 ? tiers : null;
}

// ─── Get facets for a hero (non-deprecated only) ─────────────
export function getHeroFacets(heroInternalName) {
    if (!heroAbilitiesData) return null;
    const heroKey = `npc_dota_hero_${heroInternalName}`;
    const heroData = heroAbilitiesData[heroKey];
    if (!heroData || !heroData.facets) return null;

    return heroData.facets
        .filter(f => !f.deprecated && f.title && f.description)
        .map(f => ({
            title: f.title,
            description: f.description,
            color: (f.color || 'Gray').toLowerCase(),
            icon: f.icon || 'default'
        }));
}

// ─── Fetch matchup-specific item data from recent matches ────
// position: 1-5 (optional) — filters matches by role using GPM heuristic
export async function fetchMatchupItemData(dotaId, enemyDotaIds, position = null) {
    if (!dotaId || !enemyDotaIds?.length) return null;
    const cacheKey = `${dotaId}_vs_${enemyDotaIds.sort().join('_')}_pos${position || 'any'}`;
    if (matchupItemsCache[cacheKey]) return matchupItemsCache[cacheKey];

    try {
        const enemyIdsList = enemyDotaIds.join(',');

        // Use Explorer SQL endpoint to get parsed match details including GPM, Lane, and Items.
        // We join player_matches twice:
        // 1. pm1 = the hero we are playing (dotaId)
        // 2. pm2 = the enemy heroes (enemyDotaIds)
        // We ensure they are on opposite teams by checking player_slot < 128 (Radiant).
        const sql = `
SELECT DISTINCT
  matches.match_id, matches.duration, matches.start_time, matches.radiant_win, 
  pm1.player_slot, pm1.kills, pm1.deaths, pm1.assists, pm1.gold_per_min, pm1.xp_per_min, 
  pm1.last_hits, pm1.lane, pm1.lane_role, pm1.is_roaming, 
  pm1.item_0, pm1.item_1, pm1.item_2, pm1.item_3, pm1.item_4, pm1.item_5
FROM matches 
JOIN player_matches pm1 ON matches.match_id = pm1.match_id
JOIN player_matches pm2 ON matches.match_id = pm2.match_id
WHERE pm1.hero_id = ${dotaId}
  AND pm2.hero_id IN (${enemyIdsList})
  AND ((pm1.player_slot < 128) != (pm2.player_slot < 128))
ORDER BY matches.start_time DESC 
LIMIT 300
        `.trim().replace(/\s+/g, ' ');

        const res = await fetch(`${API_BASE}/explorer?sql=${encodeURIComponent(sql)}`);
        const json = await res.json();
        if (json.err) throw new Error(json.err);

        const allMatches = json.rows || [];

        // Filter by role using lane + GPM from replay data:
        // Pos 1 (Carry):        Safe lane (1) + high GPM (≥400) = farming core
        // Pos 2 (Mid):          Mid lane (2)
        // Pos 3 (Offlane):      Off lane (3) + high GPM (≥350) = offlane core
        // Pos 4 (Soft Support): Off lane (3) + low GPM (<350), or roaming
        // Pos 5 (Hard Support): Safe lane (1) + low GPM (<400) = lane support
        let roleFiltered = allMatches;
        if (position) {
            roleFiltered = allMatches.filter(m => {
                const lane = m.lane;      // 1=safe, 2=mid, 3=off, 4=jungle
                const gpm = m.gold_per_min || 0;
                const roaming = m.is_roaming;
                // If no lane data, fall back to GPM-only
                if (!lane && !gpm) return true;
                switch (position) {
                    case 1: return lane === 1 && gpm >= 400;             // Safelane core
                    case 2: return lane === 2;                           // Mid
                    case 3: return lane === 3 && gpm >= 350;             // Offlane core
                    case 4: return (lane === 3 && gpm < 350) || roaming; // Soft support / roamer
                    case 5: return lane === 1 && gpm < 400;              // Hard support
                    default: return true;
                }
            });
        }

        // Take top 150 matches that match the role and the enemy matchup
        let relevantMatches = roleFiltered.slice(0, 150);

        if (relevantMatches.length === 0) return null;

        // Count item purchases across relevant matches
        const itemFreq = {};
        const itemSlots = ['item_0', 'item_1', 'item_2', 'item_3', 'item_4', 'item_5'];
        for (const match of relevantMatches) {
            for (const slot of itemSlots) {
                const itemId = match[slot];
                if (itemId && itemId > 0 && itemConstantsData?.[itemId]) {
                    const item = itemConstantsData[itemId];
                    if (item.cost >= 1000) { // Only meaningful items
                        if (!itemFreq[itemId]) {
                            itemFreq[itemId] = { id: itemId, count: 0, wins: 0, ...item };
                        }
                        itemFreq[itemId].count++;
                        if (match.radiant_win === (match.player_slot < 128)) {
                            itemFreq[itemId].wins++;
                        }
                    }
                }
            }
        }

        const result = Object.values(itemFreq)
            .filter(i => i.count >= 2) // At least bought twice
            .sort((a, b) => b.count - a.count)
            .slice(0, 8)
            .map(i => ({
                ...i,
                winRate: i.wins / i.count,
                matchCount: relevantMatches.length
            }));

        matchupItemsCache[cacheKey] = result;
        return result;
    } catch (err) {
        console.warn(`[DataFetcher] Failed to fetch matchup items for hero ${dotaId}:`, err.message);
        return null;
    }
}

// ─── Get cached data ────────────────────────────────────────
export function getHeroStats() { return heroStatsData; }
export function getItemConstants() { return itemConstantsData; }

export function getHighRankWinRate(dotaId) {
    if (!heroStatsData || !heroStatsData[dotaId]) return 0.5;
    return heroStatsData[dotaId].winRate;
}

export function getMatchupWinRate(heroADotaId, heroBDotaId) {
    const matchups = heroMatchupsCache[heroADotaId];
    if (!matchups || !matchups[heroBDotaId]) return null;
    return matchups[heroBDotaId].winRate;
}

export async function prefetchMatchups(dotaIds) {
    const promises = dotaIds
        .filter(id => id && !heroMatchupsCache[id])
        .map(id => fetchHeroMatchups(id));
    await Promise.allSettled(promises);
}

// ─── Initialize: fetch hero stats + item constants + abilities on load ──
export async function initDataFetcher() {
    await Promise.allSettled([
        fetchHeroStats(),
        fetchItemConstants(),
        fetchHeroAbilities()
    ]);
    return heroStatsData;
}
