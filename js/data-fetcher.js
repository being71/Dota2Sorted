// ─── OpenDota API Data Fetcher ─────────────────────────────
// Fetches real match data from OpenDota API for Divine/Immortal brackets
// Caches in localStorage with 24h TTL

const API_BASE = 'https://api.opendota.com/api';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_KEY_STATS = 'dota2_hero_stats';
const CACHE_KEY_MATCHUPS = 'dota2_hero_matchups';
const CACHE_KEY_ITEM_POP = 'dota2_item_popularity';
const CACHE_KEY_ITEM_CONST = 'dota2_item_constants';

// Status: 'loading' | 'live' | 'cached' | 'offline'
let dataStatus = 'loading';
let heroStatsData = null;
let heroMatchupsCache = {};
let itemPopularityCache = {};
let itemConstantsData = null;
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

// ─── Initialize: fetch hero stats + item constants on load ──
export async function initDataFetcher() {
    await Promise.allSettled([
        fetchHeroStats(),
        fetchItemConstants()
    ]);
    return heroStatsData;
}
