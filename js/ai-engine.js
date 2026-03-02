// ─── Data-Driven AI Recommendation Engine ──────────────────
// Uses real OpenDota matchup data (Divine/Immortal) + heuristic fallback

import { HEROES, HERO_MAP } from '../data/heroes.js';
import { ITEMS, HERO_BUILDS, getHeroBuild, getSituationalItems } from '../data/items.js';
import {
    getHighRankWinRate,
    getMatchupWinRate,
    fetchHeroMatchups,
    prefetchMatchups,
    getHeroStats,
    getDataStatus,
    getItemBuild,
    getItemConstants,
    fetchItemPopularity
} from './data-fetcher.js';

// ─── Scoring Weights ────────────────────────────────────────
const W = {
    REAL_MATCHUP: 5.0,
    HIGH_RANK_META: 2.0,
    HEURISTIC_COUNTER: 2.0,
    TAG_COUNTER: 1.5,
    HEURISTIC_SYNERGY: 1.5,
    TAG_SYNERGY: 1.0,
    ROLE_GAP: 2.5,
    LANE_BALANCE: 1.0,
};

// ─── Role Definitions ───────────────────────────────────────
const POSITION_LABELS = {
    1: { name: 'Pos 1 — Carry', short: 'Carry', icon: '🗡️', lane: 'Safe Lane' },
    2: { name: 'Pos 2 — Mid', short: 'Mid', icon: '⚡', lane: 'Mid Lane' },
    3: { name: 'Pos 3 — Offlane', short: 'Offlane', icon: '🛡️', lane: 'Off Lane' },
    4: { name: 'Pos 4 — Soft Support', short: 'Soft Sup', icon: '🏹', lane: 'Roam / Off' },
    5: { name: 'Pos 5 — Hard Support', short: 'Hard Sup', icon: '💚', lane: 'Safe Lane' },
};

// Hero role → position mapping weights
const ROLE_POSITION_MAP = {
    carry: { 1: 10, 2: 3, 3: 1 },
    mid: { 2: 10, 1: 2, 3: 1 },
    offlane: { 3: 10, 4: 2, 2: 1 },
    support: { 4: 8, 5: 6, 3: 1 },
    hard_support: { 5: 10, 4: 5 },
    initiator: { 3: 5, 4: 3, 2: 2 },
    nuker: { 2: 5, 4: 3, 3: 2 },
    pusher: { 3: 3, 2: 2, 1: 1 },
    jungler: { 4: 3, 1: 2, 3: 2 },
};

// ─── Draft State ────────────────────────────────────────────
export class AIEngine {
    constructor() {
        this.allyPicks = [];
        this.enemyPicks = [];
        this.userRole = null; // User's selected role (1-5)
        this.roleAssignments = {}; // heroId → position (1-5)
    }

    addPick(heroId, team) {
        if (team === 'ally') this.allyPicks.push(heroId);
        if (team === 'enemy') this.enemyPicks.push(heroId);
    }

    removePick(heroId, team) {
        if (team === 'ally') this.allyPicks = this.allyPicks.filter(h => h !== heroId);
        if (team === 'enemy') this.enemyPicks = this.enemyPicks.filter(h => h !== heroId);
        delete this.roleAssignments[heroId];
    }

    reset() {
        this.allyPicks = [];
        this.enemyPicks = [];
        this.userRole = null;
        this.roleAssignments = {};
    }

    setUserRole(pos) { this.userRole = pos; }

    allPicked() {
        return [...this.allyPicks, ...this.enemyPicks];
    }

    // ─── Role Assignment System ──────────────────────────────
    assignRoles() {
        if (this.allyPicks.length === 0) return {};

        const heroes = this.allyPicks.map(id => HERO_MAP[id]).filter(Boolean);
        const positions = [1, 2, 3, 4, 5];
        const assignments = {};

        // Build score matrix: hero → position → score
        const scores = {};
        for (const hero of heroes) {
            scores[hero.id] = {};
            for (const pos of positions) {
                let s = 0;
                for (const role of (hero.roles || [])) {
                    const map = ROLE_POSITION_MAP[role];
                    if (map && map[pos]) s += map[pos];
                }
                // Boost if hero tags match position expectations
                if (pos <= 2 && hero.tags?.some(t => ['carry', 'damage', 'physical', 'farm'].includes(t))) s += 2;
                if (pos === 2 && hero.tags?.some(t => ['burst', 'nuker', 'ganker', 'snowball'].includes(t))) s += 3;
                if (pos === 3 && hero.tags?.some(t => ['tank', 'initiator', 'aura'].includes(t))) s += 2;
                if (pos >= 4 && hero.tags?.some(t => ['support', 'heal', 'save', 'disable'].includes(t))) s += 2;
                scores[hero.id][pos] = s;
            }
        }

        // Greedy assignment: assign best fits first
        const usedPositions = new Set();
        const usedHeroes = new Set();

        // If user selected a role and is first ally pick, assign that first
        if (this.userRole && this.allyPicks.length > 0) {
            const firstPick = this.allyPicks[0];
            assignments[firstPick] = this.userRole;
            usedPositions.add(this.userRole);
            usedHeroes.add(firstPick);
        }

        // Build sorted pairs of (hero, position, score)
        const pairs = [];
        for (const hero of heroes) {
            if (usedHeroes.has(hero.id)) continue;
            for (const pos of positions) {
                if (usedPositions.has(pos)) continue;
                pairs.push({ heroId: hero.id, pos, score: scores[hero.id][pos] || 0 });
            }
        }
        pairs.sort((a, b) => b.score - a.score);

        for (const { heroId, pos } of pairs) {
            if (usedHeroes.has(heroId) || usedPositions.has(pos)) continue;
            assignments[heroId] = pos;
            usedHeroes.add(heroId);
            usedPositions.add(pos);
        }

        this.roleAssignments = assignments;
        return assignments;
    }

    getPositionLabel(pos) {
        return POSITION_LABELS[pos] || { name: `Pos ${pos}`, short: `Pos ${pos}`, icon: '❓', lane: '' };
    }

    getHeroPosition(heroId) {
        return this.roleAssignments[heroId] || null;
    }

    setHeroPosition(heroId, pos) {
        // Swap if someone else has this position
        const currentHolder = Object.entries(this.roleAssignments)
            .find(([, p]) => p === pos);
        if (currentHolder) {
            const oldPos = this.roleAssignments[heroId];
            this.roleAssignments[currentHolder[0]] = oldPos || null;
        }
        this.roleAssignments[heroId] = pos;
    }

    // ─── Prefetch matchup data ───────────────────────────────
    async prefetchCurrentMatchups() {
        const enemyDotaIds = this.enemyPicks
            .map(id => HERO_MAP[id]?.dotaId)
            .filter(Boolean);
        if (enemyDotaIds.length > 0) await prefetchMatchups(enemyDotaIds);
    }

    // ─── Fetch item popularity for ally hero ─────────────────
    async fetchItemData(heroId) {
        const hero = HERO_MAP[heroId];
        if (hero?.dotaId) await fetchItemPopularity(hero.dotaId);
    }

    getTeamTags(team) {
        const picks = team === 'ally' ? this.allyPicks : this.enemyPicks;
        const tags = new Set();
        picks.forEach(id => {
            const hero = HERO_MAP[id];
            if (hero?.tags) hero.tags.forEach(t => tags.add(t));
        });
        return [...tags];
    }

    getFilledRoles() {
        const filled = new Set();
        this.allyPicks.forEach(id => {
            const hero = HERO_MAP[id];
            if (hero?.roles) hero.roles.forEach(r => filled.add(r));
        });
        return filled;
    }

    // ─── SCORING METHODS ────────────────────────────────────
    scoreRealMatchups(candidateDotaId) {
        let score = 0, matchCount = 0;
        for (const enemyId of this.enemyPicks) {
            const enemy = HERO_MAP[enemyId];
            if (!enemy?.dotaId) continue;
            const wr = getMatchupWinRate(candidateDotaId, enemy.dotaId);
            if (wr !== null) { score += (wr - 0.5) * 20; matchCount++; }
        }
        for (const enemyId of this.enemyPicks) {
            const enemy = HERO_MAP[enemyId];
            if (!enemy?.dotaId) continue;
            const wr = getMatchupWinRate(enemy.dotaId, candidateDotaId);
            if (wr !== null) { score += (0.5 - wr) * 15; matchCount++; }
        }
        return matchCount > 0 ? score : 0;
    }

    scoreHighRankMeta(dotaId) {
        return (getHighRankWinRate(dotaId) - 0.5) * 100;
    }

    scoreHeuristicCounters(hero) {
        let score = 0;
        for (const enemyId of this.enemyPicks) {
            if (hero.strong?.includes(enemyId)) score += 3;
            if (hero.weak?.includes(enemyId)) score -= 4;
        }
        return score;
    }

    scoreTagCounters(hero) {
        const enemyTags = this.getTeamTags('enemy');
        let score = 0;
        const counterMap = {
            'magic': ['magic_immune', 'anti_magic'],
            'physical': ['evasion', 'armor', 'ghost', 'anti_physical'],
            'invis': ['detection', 'vision', 'aoe'],
            'summon': ['aoe', 'cleave'],
            'heal': ['anti_heal'],
            'illusion': ['aoe', 'cleave'],
            'stun': ['magic_immune', 'mobile'],
            'silence': ['dispel'],
            'mobile': ['stun', 'disable', 'lockdown', 'root'],
            'push': ['aoe', 'depush'],
            'late_game': ['snowball', 'push'],
        };
        for (const [enemyTag, goodTags] of Object.entries(counterMap)) {
            if (enemyTags.includes(enemyTag)) {
                if (hero.tags?.some(t => goodTags.includes(t))) score += 1.5;
            }
        }
        return score;
    }

    scoreHeuristicSynergy(hero) {
        let score = 0;
        for (const allyId of this.allyPicks) {
            if (hero.pairs?.includes(allyId)) score += 3;
            const ally = HERO_MAP[allyId];
            if (ally?.pairs?.includes(hero.id)) score += 2;
        }
        return score;
    }

    scoreTagSynergy(hero) {
        const allyTags = this.getTeamTags('ally');
        let score = 0;
        const synergyMap = {
            'stun': ['burst', 'physical', 'magic'],
            'initiator': ['aoe', 'burst'],
            'aura': ['push', 'physical'],
            'heal': ['tank', 'late_game'],
            'save': ['carry', 'late_game'],
            'disable': ['burst', 'physical'],
            'armor_reduce': ['physical'],
        };
        for (const [allyTag, goodTags] of Object.entries(synergyMap)) {
            if (allyTags.includes(allyTag)) {
                if (hero.tags?.some(t => goodTags.includes(t))) score += 0.8;
            }
        }
        return score;
    }

    scoreRoleGap(hero) {
        const filled = this.getFilledRoles();
        const allRoles = ['carry', 'mid', 'offlane', 'support', 'hard_support'];
        const missing = allRoles.filter(r => !filled.has(r));
        let score = 0;
        for (const role of missing) {
            if (hero.roles?.includes(role)) {
                score += role === 'carry' ? 3 : role === 'support' || role === 'hard_support' ? 2.5 : 2;
            }
        }
        return score;
    }

    scoreLaneBalance(hero) {
        const lanes = { carry: 0, mid: 0, offlane: 0, support: 0, hard_support: 0 };
        this.allyPicks.forEach(id => {
            const h = HERO_MAP[id];
            if (h?.roles) h.roles.forEach(r => { if (lanes[r] !== undefined) lanes[r]++; });
        });
        let score = 0;
        if (hero.roles?.includes('support') && lanes.support === 0 && lanes.hard_support === 0) score += 1.5;
        if (hero.roles?.includes('mid') && lanes.mid === 0) score += 1.0;
        if (hero.roles?.includes('carry') && lanes.carry === 0) score += 1.5;
        if (hero.roles?.includes('offlane') && lanes.offlane === 0) score += 1.0;
        return score;
    }

    // ─── GET RECOMMENDATIONS ──────────────────────────────────
    getRecommendations() {
        const picked = new Set(this.allPicked());
        if (picked.size === 0) return [];

        const hasApiData = getDataStatus() === 'live' || getDataStatus() === 'cached';
        const heroStats = getHeroStats();

        const scored = HEROES
            .filter(h => !picked.has(h.id))
            .map(hero => {
                let total = 0;
                const breakdown = {};

                if (hasApiData && hero.dotaId && this.enemyPicks.length > 0) {
                    const realScore = this.scoreRealMatchups(hero.dotaId);
                    total += realScore * W.REAL_MATCHUP;
                    breakdown.realMatchup = realScore * W.REAL_MATCHUP;
                }
                if (hasApiData && hero.dotaId) {
                    const metaScore = this.scoreHighRankMeta(hero.dotaId);
                    total += metaScore * W.HIGH_RANK_META;
                    breakdown.meta = metaScore * W.HIGH_RANK_META;
                }

                const heuristicW = hasApiData ? 0.5 : 1.0;
                if (this.enemyPicks.length > 0) {
                    const hcScore = this.scoreHeuristicCounters(hero);
                    total += hcScore * W.HEURISTIC_COUNTER * heuristicW;
                    breakdown.counters = hcScore * W.HEURISTIC_COUNTER * heuristicW;
                    const tcScore = this.scoreTagCounters(hero);
                    total += tcScore * W.TAG_COUNTER * heuristicW;
                    breakdown.tagCounter = tcScore * W.TAG_COUNTER * heuristicW;
                }
                if (this.allyPicks.length > 0) {
                    const hsScore = this.scoreHeuristicSynergy(hero);
                    total += hsScore * W.HEURISTIC_SYNERGY;
                    breakdown.synergy = hsScore * W.HEURISTIC_SYNERGY;
                    const tsScore = this.scoreTagSynergy(hero);
                    total += tsScore * W.TAG_SYNERGY;
                    breakdown.tagSynergy = tsScore * W.TAG_SYNERGY;
                }
                if (this.allyPicks.length > 0) {
                    const rgScore = this.scoreRoleGap(hero);
                    total += rgScore * W.ROLE_GAP;
                    breakdown.roleGap = rgScore * W.ROLE_GAP;
                    const lbScore = this.scoreLaneBalance(hero);
                    total += lbScore * W.LANE_BALANCE;
                    breakdown.lane = lbScore * W.LANE_BALANCE;
                }

                let winRateDisplay = null;
                if (heroStats && heroStats[hero.dotaId]) {
                    winRateDisplay = (heroStats[hero.dotaId].winRate * 100).toFixed(1);
                }
                return { hero, score: total, breakdown, winRateDisplay };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        return scored;
    }

    buildReasons(rec) {
        const reasons = [];
        const b = rec.breakdown;
        if (b.realMatchup && b.realMatchup > 3) reasons.push(`📊 Strong vs enemy (real data: +${b.realMatchup.toFixed(1)})`);
        if (b.realMatchup && b.realMatchup < -3) reasons.push(`⚠️ Weak vs enemy (real data: ${b.realMatchup.toFixed(1)})`);
        if (b.meta && b.meta > 2) reasons.push(`📈 High rank meta pick`);
        if (b.counters && b.counters > 2) reasons.push(`Counters enemy heroes (+${b.counters.toFixed(1)})`);
        if (b.counters && b.counters < -2) reasons.push(`⚠️ Countered by enemy (${b.counters.toFixed(1)})`);
        if ((b.tagCounter || 0) + (b.realMatchup || 0) > 3) reasons.push(`Good vs enemy composition`);
        if (b.synergy && b.synergy > 2) reasons.push(`Synergy with allies (+${b.synergy.toFixed(1)})`);
        if (b.roleGap && b.roleGap > 2) reasons.push(`Fills team role gap (+${b.roleGap.toFixed(1)})`);
        if (b.lane && b.lane > 1) reasons.push(`Balances lanes`);
        if (rec.winRateDisplay) reasons.push(`${rec.winRateDisplay}% win rate (Divine+)`);
        return reasons.length > 0 ? reasons : ['General pick suggestion'];
    }

    // ─── DATA-DRIVEN ITEM ROADMAP ────────────────────────────
    generateItemRoadmap(allyHeroId) {
        const hero = HERO_MAP[allyHeroId];
        if (!hero) return null;

        const enemyTags = this.getTeamTags('enemy');
        const tips = this.generateGameTips(allyHeroId);
        const pos = this.roleAssignments[allyHeroId] || null;

        // Try real API data first
        const apiBuild = hero.dotaId ? getItemBuild(hero.dotaId) : null;

        if (apiBuild && (apiBuild.midItems.length > 0 || apiBuild.earlyItems.length > 0)) {
            // Use real OpenDota item popularity data
            const situational = this.getSituationalFromTags(enemyTags);

            return {
                hero,
                position: pos,
                dataSource: 'api',
                startItems: apiBuild.startItems,
                earlyItems: apiBuild.earlyItems,
                coreItems: apiBuild.midItems,
                lateItems: apiBuild.lateItems,
                situational,
                tips,
            };
        }

        // Fallback: use template builds
        const build = getHeroBuild(allyHeroId, hero);
        const situational = getSituationalItems(build, enemyTags);

        return {
            hero,
            position: pos,
            dataSource: 'template',
            boots: build.boots,
            core: build.core,
            luxury: build.luxury,
            situational,
            timings: build.timings || {},
            tips,
        };
    }

    // ─── Situational items from enemy tags (overlay on API data) ──
    getSituationalFromTags(enemyTags) {
        const sit = [];
        const tagItemMap = [
            { vs: ['stun', 'disable', 'magic'], item: 'black_king_bar', reason: 'BKB vs heavy disable/magic' },
            { vs: ['evasion'], item: 'monkey_king_bar', reason: 'MKB to counter evasion' },
            { vs: ['heal', 'regen'], item: 'spirit_vessel', reason: 'Anti-heal vs healing heroes' },
            { vs: ['invis'], item: 'dust', reason: 'Dust vs invisible enemies' },
            { vs: ['physical', 'carry'], item: 'heavens_halberd', reason: 'Disarm vs right-click carry' },
            { vs: ['passive', 'tank'], item: 'silver_edge', reason: 'Break passive abilities' },
            { vs: ['ghost', 'save'], item: 'nullifier', reason: 'Nullifier vs Ghost/save items' },
            { vs: ['illusion', 'summon'], item: 'crimson_guard', reason: 'Block multiple attack sources' },
            { vs: ['magic', 'aoe'], item: 'pipe', reason: 'Team magic barrier' },
            { vs: ['lockdown'], item: 'linken', reason: "Linken's blocks targeted lockdown" },
            { vs: ['silence'], item: 'euls', reason: "Eul's purges silence" },
        ];

        for (const mapping of tagItemMap) {
            if (mapping.vs.some(tag => enemyTags.includes(tag))) {
                if (ITEMS[mapping.item]) {
                    sit.push({ item: mapping.item, reason: mapping.reason });
                }
            }
        }

        return sit;
    }

    // ─── GENERATE GAME TIPS ──────────────────────────────────
    generateGameTips(allyHeroId) {
        const tips = [];
        const enemyTags = this.getTeamTags('enemy');
        const hero = HERO_MAP[allyHeroId];

        for (const enemyId of this.enemyPicks) {
            const enemy = HERO_MAP[enemyId];
            if (!enemy) continue;
            if (enemyId === 'juggernaut') tips.push('⚔️ Ghost Scepter timing for Omnislash');
            if (enemyId === 'huskar') tips.push('⚔️ Spirit Vessel or AA ult counters Huskar healing');
            if (enemyId === 'phantom_assassin') tips.push('⚔️ MKB or Silver Edge vs PA evasion');
            if (enemyId === 'invoker') tips.push('⚔️ BKB critical vs Invoker combos');
            if (enemy.tags?.includes('invis')) tips.push(`👁️ Buy detection for ${enemy.name}`);
            if (enemyId === 'axe' && hero?.tags?.includes('illusion'))
                tips.push('⚔️ Axe Counter Helix shreds illusions');
        }

        const stunCount = this.enemyPicks.filter(id => HERO_MAP[id]?.tags?.includes('stun')).length;
        if (stunCount >= 3) tips.push('🛡️ BKB essential vs 3+ stuns');
        if (enemyTags.includes('heal')) tips.push('💀 Anti-heal needed (Spirit Vessel / Shiva\'s)');
        if (enemyTags.includes('magic') && !enemyTags.includes('physical'))
            tips.push('🛡️ Pipe of Insight vs magic-heavy lineup');
        if (enemyTags.includes('physical') && !enemyTags.includes('magic'))
            tips.push('🛡️ Crimson Guard vs physical-heavy lineup');
        if (enemyTags.includes('push')) tips.push('🏰 Prioritize tower defense items early');

        if (getDataStatus() === 'live' || getDataStatus() === 'cached') {
            const heroStats = getHeroStats();
            if (heroStats && hero?.dotaId && heroStats[hero.dotaId]) {
                const wr = heroStats[hero.dotaId].winRate;
                if (wr > 0.53) tips.push(`📈 ${hero.name} is strong this patch (${(wr * 100).toFixed(1)}% WR)`);
                if (wr < 0.47) tips.push(`📉 ${hero.name} below average (${(wr * 100).toFixed(1)}% WR)`);
            }
        }

        return [...new Set(tips)];
    }
}
