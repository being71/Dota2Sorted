// ─── Dota 2 Item Database (~150 items) + Hero Builds ────────
// Items organized by category with tags for situational matching

export function getItemImage(itemId) {
    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${itemId}.png`;
}

// ═══════════════════════ ITEM DEFINITIONS ═══════════════════
export const ITEMS = {
    // ──── Starting / Laning ────
    tango: { name: 'Tango', cost: 90, tags: ['regen', 'consumable'], cat: 'start' },
    healing_salve: { name: 'Healing Salve', cost: 100, tags: ['regen', 'consumable'], cat: 'start' },
    clarity: { name: 'Clarity', cost: 50, tags: ['mana', 'consumable'], cat: 'start' },
    enchanted_mango: { name: 'Enchanted Mango', cost: 65, tags: ['mana', 'regen', 'consumable'], cat: 'start' },
    faerie_fire: { name: 'Faerie Fire', cost: 70, tags: ['damage', 'consumable'], cat: 'start' },
    iron_branch: { name: 'Iron Branch', cost: 50, tags: ['stats', 'consumable'], cat: 'start' },
    circlet: { name: 'Circlet', cost: 155, tags: ['stats'], cat: 'start' },
    slippers: { name: 'Slippers of Agility', cost: 140, tags: ['agi'], cat: 'start' },
    mantle: { name: 'Mantle of Intelligence', cost: 140, tags: ['int'], cat: 'start' },
    gauntlets: { name: 'Gauntlets of Strength', cost: 140, tags: ['str'], cat: 'start' },
    quelling_blade: { name: 'Quelling Blade', cost: 100, tags: ['damage', 'melee'], cat: 'start' },
    stout_shield: { name: 'Stout Shield', cost: 175, tags: ['tank'], cat: 'start' },
    ward_observer: { name: 'Observer Ward', cost: 0, tags: ['vision', 'support'], cat: 'start' },
    ward_sentry: { name: 'Sentry Ward', cost: 50, tags: ['vision', 'support', 'detection'], cat: 'start' },
    dust: { name: 'Dust of Appearance', cost: 80, tags: ['detection', 'support'], cat: 'start' },
    smoke_of_deceit: { name: 'Smoke of Deceit', cost: 50, tags: ['invis', 'support'], cat: 'start' },

    // ──── Boots ────
    boots: { name: 'Boots of Speed', cost: 500, tags: ['move_speed'], cat: 'boots' },
    power_treads: { name: 'Power Treads', cost: 1400, tags: ['attack_speed', 'stats', 'move_speed'], cat: 'boots' },
    phase_boots: { name: 'Phase Boots', cost: 1500, tags: ['damage', 'move_speed', 'armor'], cat: 'boots' },
    arcane_boots: { name: 'Arcane Boots', cost: 1300, tags: ['mana', 'support', 'move_speed'], cat: 'boots' },
    tranquil_boots: { name: 'Tranquil Boots', cost: 925, tags: ['regen', 'move_speed', 'support'], cat: 'boots' },
    guardian_greaves: { name: 'Guardian Greaves', cost: 5450, tags: ['heal', 'dispel', 'aura', 'support'], cat: 'boots' },
    boots_of_bearing: { name: 'Boots of Bearing', cost: 4275, tags: ['aura', 'move_speed', 'attack_speed'], cat: 'boots' },

    // ──── Early Game ────
    magic_wand: { name: 'Magic Wand', cost: 450, tags: ['stats', 'regen', 'burst_heal'], cat: 'early' },
    bracer: { name: 'Bracer', cost: 505, tags: ['stats', 'str', 'tank'], cat: 'early' },
    wraith_band: { name: 'Wraith Band', cost: 505, tags: ['stats', 'agi', 'damage'], cat: 'early' },
    null_talisman: { name: 'Null Talisman', cost: 505, tags: ['stats', 'int', 'mana'], cat: 'early' },
    soul_ring: { name: 'Soul Ring', cost: 805, tags: ['mana', 'regen'], cat: 'early' },
    bottle: { name: 'Bottle', cost: 675, tags: ['regen', 'rune'], cat: 'early' },
    urn_of_shadows: { name: 'Urn of Shadows', cost: 880, tags: ['heal', 'magic', 'str'], cat: 'early' },
    ring_of_basilius: { name: 'Ring of Basilius', cost: 425, tags: ['aura', 'mana', 'armor'], cat: 'early' },
    headdress: { name: 'Headdress', cost: 425, tags: ['regen', 'aura'], cat: 'early' },
    buckler: { name: 'Buckler', cost: 425, tags: ['armor', 'aura'], cat: 'early' },
    helm_of_iron_will: { name: 'Helm of Iron Will', cost: 975, tags: ['armor', 'regen'], cat: 'early' },
    orb_of_venom: { name: 'Orb of Venom', cost: 275, tags: ['slow', 'melee'], cat: 'early' },
    blight_stone: { name: 'Blight Stone', cost: 300, tags: ['armor_reduce', 'physical'], cat: 'early' },
    wind_lace: { name: 'Wind Lace', cost: 250, tags: ['move_speed'], cat: 'early' },
    infused_raindrop: { name: 'Infused Raindrop', cost: 225, tags: ['magic_resist', 'mana_regen'], cat: 'early' },
    medallion: { name: 'Medallion of Courage', cost: 1025, tags: ['armor', 'armor_reduce'], cat: 'early' },
    falcon_blade: { name: 'Falcon Blade', cost: 1125, tags: ['damage', 'mana_regen', 'hp'], cat: 'early' },
    pavise: { name: 'Pavise', cost: 1100, tags: ['armor', 'shield', 'support'], cat: 'early' },
    veil_of_discord: { name: 'Veil of Discord', cost: 1525, tags: ['magic_amp', 'stats'], cat: 'early' },
    rod_of_atos: { name: 'Rod of Atos', cost: 2750, tags: ['disable', 'root', 'stats'], cat: 'early' },
    drum_of_endurance: { name: 'Drum of Endurance', cost: 1700, tags: ['aura', 'stats', 'move_speed'], cat: 'early' },

    // ──── Core Items ────
    blink: { name: 'Blink Dagger', cost: 2250, tags: ['mobility', 'initiator', 'blink'], cat: 'core' },
    force_staff: { name: 'Force Staff', cost: 2200, tags: ['mobility', 'save', 'support'], cat: 'core' },
    ghost: { name: 'Ghost Scepter', cost: 1500, tags: ['save', 'ghost', 'anti_physical'], cat: 'core' },
    glimmer_cape: { name: 'Glimmer Cape', cost: 1950, tags: ['invis', 'magic_resist', 'save', 'support'], cat: 'core' },
    aether_lens: { name: 'Aether Lens', cost: 2275, tags: ['mana', 'cast_range'], cat: 'core' },
    mekansm: { name: 'Mekansm', cost: 1775, tags: ['heal', 'aura', 'support'], cat: 'core' },
    solar_crest: { name: 'Solar Crest', cost: 2625, tags: ['armor', 'armor_reduce', 'attack_speed', 'save'], cat: 'core' },
    spirit_vessel: { name: 'Spirit Vessel', cost: 2880, tags: ['anti_heal', 'magic', 'str'], cat: 'core' },
    vladmir: { name: "Vladmir's Offering", cost: 2450, tags: ['aura', 'lifesteal', 'armor', 'damage'], cat: 'core' },
    maelstrom: { name: 'Maelstrom', cost: 2700, tags: ['attack_speed', 'magic', 'aoe', 'farm'], cat: 'core' },
    desolator: { name: 'Desolator', cost: 3500, tags: ['damage', 'armor_reduce', 'physical'], cat: 'core' },
    blade_mail: { name: 'Blade Mail', cost: 2100, tags: ['reflect', 'armor', 'damage', 'tank'], cat: 'core' },
    black_king_bar: { name: 'Black King Bar', cost: 4050, tags: ['magic_immune', 'dispel', 'tank'], cat: 'core' },
    sange_and_yasha: { name: 'Sange and Yasha', cost: 4100, tags: ['stats', 'move_speed', 'tank', 'damage'], cat: 'core' },
    yasha_and_kaya: { name: 'Yasha and Kaya', cost: 4100, tags: ['stats', 'move_speed', 'magic_amp', 'mana'], cat: 'core' },
    kaya_and_sange: { name: 'Kaya and Sange', cost: 4100, tags: ['stats', 'tank', 'magic_amp'], cat: 'core' },
    manta: { name: 'Manta Style', cost: 4600, tags: ['illusion', 'dispel', 'agi', 'stats'], cat: 'core' },
    diffusal_blade: { name: 'Diffusal Blade', cost: 2500, tags: ['mana_burn', 'slow', 'agi'], cat: 'core' },
    orchid: { name: 'Orchid Malevolence', cost: 3475, tags: ['silence', 'damage', 'mana_regen', 'magic'], cat: 'core' },
    euls: { name: "Eul's Scepter", cost: 2725, tags: ['dispel', 'disable', 'mana_regen', 'move_speed'], cat: 'core' },
    aghanims_scepter: { name: "Aghanim's Scepter", cost: 4200, tags: ['upgrade', 'stats'], cat: 'core' },
    aghanims_shard: { name: "Aghanim's Shard", cost: 1400, tags: ['upgrade'], cat: 'core' },
    hood_of_defiance: { name: 'Hood of Defiance', cost: 1500, tags: ['magic_resist', 'regen'], cat: 'core' },
    vanguard: { name: 'Vanguard', cost: 1825, tags: ['tank', 'regen', 'block'], cat: 'core' },
    crimson_guard: { name: 'Crimson Guard', cost: 3725, tags: ['tank', 'armor', 'aura', 'block', 'anti_physical'], cat: 'core' },
    pipe: { name: 'Pipe of Insight', cost: 3475, tags: ['magic_resist', 'aura', 'team', 'anti_magic'], cat: 'core' },
    lotus_orb: { name: 'Lotus Orb', cost: 3850, tags: ['dispel', 'reflect', 'armor'], cat: 'core' },
    aeon_disk: { name: 'Aeon Disk', cost: 3000, tags: ['save', 'tank', 'dispel'], cat: 'core' },
    heavens_halberd: { name: "Heaven's Halberd", cost: 3550, tags: ['disarm', 'evasion', 'tank', 'anti_carry'], cat: 'core' },
    echo_sabre: { name: 'Echo Sabre', cost: 2500, tags: ['damage', 'attack_speed', 'mana', 'slow'], cat: 'core' },
    armlet: { name: 'Armlet of Mordiggian', cost: 2475, tags: ['damage', 'tank', 'str', 'toggle'], cat: 'core' },
    mask_of_madness: { name: 'Mask of Madness', cost: 1775, tags: ['attack_speed', 'lifesteal', 'farm'], cat: 'core' },
    dragon_lance: { name: 'Dragon Lance', cost: 1900, tags: ['stats', 'range', 'agi'], cat: 'core' },
    hurricane_pike: { name: 'Hurricane Pike', cost: 4450, tags: ['range', 'mobility', 'stats', 'save'], cat: 'core' },
    hand_of_midas: { name: 'Hand of Midas', cost: 2200, tags: ['farm', 'attack_speed', 'gold'], cat: 'core' },
    meteor_hammer: { name: 'Meteor Hammer', cost: 2350, tags: ['stun', 'push', 'magic', 'regen'], cat: 'core' },
    witch_blade: { name: 'Witch Blade', cost: 2600, tags: ['damage', 'int', 'slow', 'attack_speed'], cat: 'core' },
    phylactery: { name: 'Phylactery', cost: 2400, tags: ['magic', 'burst', 'stats', 'mana'], cat: 'core' },

    // ──── Luxury / Late Game ────
    heart: { name: 'Heart of Tarrasque', cost: 5000, tags: ['tank', 'str', 'regen', 'late_game'], cat: 'luxury' },
    butterfly: { name: 'Butterfly', cost: 4975, tags: ['evasion', 'agi', 'attack_speed', 'damage', 'late_game'], cat: 'luxury' },
    satanic: { name: 'Satanic', cost: 5050, tags: ['lifesteal', 'tank', 'str', 'dispel', 'late_game'], cat: 'luxury' },
    assault: { name: 'Assault Cuirass', cost: 5250, tags: ['armor', 'attack_speed', 'aura', 'armor_reduce', 'late_game'], cat: 'luxury' },
    daedalus: { name: 'Daedalus', cost: 5150, tags: ['crit', 'damage', 'physical', 'late_game'], cat: 'luxury' },
    monkey_king_bar: { name: 'Monkey King Bar', cost: 4975, tags: ['damage', 'true_strike', 'physical', 'late_game'], cat: 'luxury' },
    skadi: { name: 'Eye of Skadi', cost: 5300, tags: ['slow', 'stats', 'tank', 'late_game'], cat: 'luxury' },
    abyssal_blade: { name: 'Abyssal Blade', cost: 6250, tags: ['stun', 'bash', 'damage', 'physical', 'late_game', 'blink'], cat: 'luxury' },
    radiance: { name: 'Radiance', cost: 5150, tags: ['damage', 'burn', 'evasion', 'farm', 'late_game'], cat: 'luxury' },
    mjollnir: { name: 'Mjollnir', cost: 5600, tags: ['attack_speed', 'magic', 'aoe', 'farm', 'late_game'], cat: 'luxury' },
    shivas_guard: { name: "Shiva's Guard", cost: 5175, tags: ['armor', 'aoe', 'slow', 'anti_heal', 'magic', 'late_game'], cat: 'luxury' },
    sheepstick: { name: 'Scythe of Vyse', cost: 5650, tags: ['disable', 'hex', 'int', 'mana', 'late_game'], cat: 'luxury' },
    nullifier: { name: 'Nullifier', cost: 4725, tags: ['dispel', 'damage', 'physical', 'mute', 'late_game'], cat: 'luxury' },
    bloodthorn: { name: 'Bloodthorn', cost: 6800, tags: ['silence', 'crit', 'damage', 'true_strike', 'late_game'], cat: 'luxury' },
    refresher: { name: 'Refresher Orb', cost: 5000, tags: ['refresh', 'regen', 'late_game'], cat: 'luxury' },
    octarine_core: { name: 'Octarine Core', cost: 5275, tags: ['cooldown', 'mana', 'stats', 'late_game'], cat: 'luxury' },
    overwhelming_blink: { name: 'Overwhelming Blink', cost: 6800, tags: ['mobility', 'blink', 'str', 'tank', 'aoe', 'late_game'], cat: 'luxury' },
    swift_blink: { name: 'Swift Blink', cost: 6800, tags: ['mobility', 'blink', 'agi', 'damage', 'late_game'], cat: 'luxury' },
    arcane_blink: { name: 'Arcane Blink', cost: 6800, tags: ['mobility', 'blink', 'int', 'cooldown', 'late_game'], cat: 'luxury' },
    ethereal_blade: { name: 'Ethereal Blade', cost: 4650, tags: ['ghost', 'magic_amp', 'agi', 'save', 'late_game'], cat: 'luxury' },
    silver_edge: { name: 'Silver Edge', cost: 5450, tags: ['invis', 'break', 'damage', 'physical', 'late_game'], cat: 'luxury' },
    shadow_blade: { name: 'Shadow Blade', cost: 3000, tags: ['invis', 'damage', 'attack_speed'], cat: 'core' },
    travel_boots: { name: 'Boots of Travel', cost: 2500, tags: ['move_speed', 'teleport', 'late_game', 'split_push'], cat: 'luxury' },
    divine_rapier: { name: 'Divine Rapier', cost: 5950, tags: ['damage', 'physical', 'late_game', 'risky'], cat: 'luxury' },
    linken: { name: "Linken's Sphere", cost: 4600, tags: ['save', 'block', 'stats', 'regen'], cat: 'luxury' },
    wind_waker: { name: 'Wind Waker', cost: 6825, tags: ['save', 'dispel', 'move_speed', 'mana', 'late_game'], cat: 'luxury' },
    disperser: { name: 'Disperser', cost: 5300, tags: ['dispel', 'slow', 'move_speed', 'damage', 'agi', 'late_game'], cat: 'luxury' },
    khanda: { name: 'Khanda', cost: 5200, tags: ['crit', 'damage', 'mana_regen', 'burst', 'late_game'], cat: 'luxury' },
    parasma: { name: 'Parasma', cost: 5750, tags: ['magic', 'damage', 'attack_speed', 'late_game'], cat: 'luxury' },
    gleipnir: { name: 'Gleipnir', cost: 5450, tags: ['root', 'aoe', 'attack_speed', 'magic', 'late_game'], cat: 'luxury' },
    revenant_brooch: { name: "Revenant's Brooch", cost: 5200, tags: ['magic', 'attack_speed', 'ghost', 'int', 'late_game'], cat: 'luxury' },
    harpoon: { name: 'Harpoon', cost: 4500, tags: ['pull', 'stats', 'damage', 'initiation'], cat: 'luxury' },
};

// ═══════════════════════ HERO BUILD TEMPLATES ═══════════════
export const HERO_BUILDS = {
    // ──── Carry builds ────
    anti_mage: {
        boots: 'power_treads',
        core: ['blink', 'manta', 'abyssal_blade'],
        luxury: ['butterfly', 'skadi', 'heart'],
        situational: [
            { item: 'black_king_bar', vs_tags: ['stun', 'disable', 'magic'], reason: 'BKB vs heavy disable' },
            { item: 'monkey_king_bar', vs_tags: ['evasion'], reason: 'MKB vs evasion heroes' },
            { item: 'linken', vs_tags: ['lockdown', 'disable'], reason: 'Linkens vs targeted lockdown' },
            { item: 'nullifier', vs_tags: ['ghost', 'save'], reason: 'Nullifier vs save items' },
        ],
        timings: { blink: 12, manta: 20, abyssal_blade: 30 }
    },
    juggernaut: {
        boots: 'phase_boots',
        core: ['maelstrom', 'diffusal_blade', 'aghanims_scepter'],
        luxury: ['mjollnir', 'butterfly', 'skadi', 'abyssal_blade'],
        situational: [
            { item: 'black_king_bar', vs_tags: ['stun', 'disable'], reason: 'BKB for teamfights' },
            { item: 'manta', vs_tags: ['silence', 'slow', 'root'], reason: 'Manta to purge debuffs' },
            { item: 'monkey_king_bar', vs_tags: ['evasion'], reason: 'MKB vs evasion' },
            { item: 'nullifier', vs_tags: ['ghost', 'save'], reason: 'Nullifier disables Ghost Scepter' },
        ],
        timings: { maelstrom: 12, diffusal_blade: 18, aghanims_scepter: 25 }
    },
    phantom_assassin: {
        boots: 'power_treads',
        core: ['desolator', 'black_king_bar', 'abyssal_blade'],
        luxury: ['satanic', 'nullifier', 'daedalus'],
        situational: [
            { item: 'monkey_king_bar', vs_tags: ['evasion'], reason: 'Counter enemy evasion' },
            { item: 'silver_edge', vs_tags: ['tank', 'passive'], reason: 'Break tanky passives' },
            { item: 'aghanims_shard', vs_tags: ['disable', 'stun'], reason: 'Fan of Knives for burst' },
        ],
        timings: { desolator: 14, black_king_bar: 20, abyssal_blade: 28 }
    },
    faceless_void: {
        boots: 'power_treads',
        core: ['mask_of_madness', 'maelstrom', 'black_king_bar'],
        luxury: ['mjollnir', 'butterfly', 'skadi', 'daedalus'],
        situational: [
            { item: 'diffusal_blade', vs_tags: ['mana_burn', 'ghost'], reason: 'Purge and mana burn' },
            { item: 'aghanims_scepter', vs_tags: ['aoe', 'teamfight'], reason: 'Bigger Chronosphere' },
            { item: 'monkey_king_bar', vs_tags: ['evasion'], reason: 'MKB vs evasion' },
        ],
        timings: { mask_of_madness: 8, maelstrom: 14, black_king_bar: 22 }
    },
    spectre: {
        boots: 'power_treads',
        core: ['radiance', 'manta', 'heart'],
        luxury: ['butterfly', 'skadi', 'abyssal_blade'],
        situational: [
            { item: 'blade_mail', vs_tags: ['physical', 'burst'], reason: 'Early Blade Mail for fighting' },
            { item: 'diffusal_blade', vs_tags: ['mana_burn', 'ghost'], reason: 'Diffusal vs Ghost Scepter carriers' },
            { item: 'aghanims_scepter', vs_tags: ['aoe', 'teamfight'], reason: 'Shadow Step on Haunt' },
        ],
        timings: { radiance: 18, manta: 25, heart: 32 }
    },
    wraith_king: {
        boots: 'phase_boots',
        core: ['armlet', 'blink', 'desolator'],
        luxury: ['assault', 'abyssal_blade', 'overwhelming_blink'],
        situational: [
            { item: 'black_king_bar', vs_tags: ['stun', 'disable', 'magic'], reason: 'BKB for teamfight' },
            { item: 'radiance', vs_tags: ['illusion', 'invis', 'farm'], reason: 'Radiance burn for illusion clear' },
            { item: 'silver_edge', vs_tags: ['tank', 'passive'], reason: 'Break passives' },
        ],
        timings: { armlet: 10, blink: 16, desolator: 22 }
    },
    slark: {
        boots: 'power_treads',
        core: ['diffusal_blade', 'echo_sabre', 'aghanims_scepter'],
        luxury: ['skadi', 'abyssal_blade', 'butterfly'],
        situational: [
            { item: 'black_king_bar', vs_tags: ['stun', 'disable'], reason: 'BKB vs chain disables' },
            { item: 'silver_edge', vs_tags: ['tank', 'passive'], reason: 'Break + burst damage' },
            { item: 'linken', vs_tags: ['lockdown'], reason: 'Linkens vs targeted lockdown' },
        ],
        timings: { diffusal_blade: 12, echo_sabre: 16, aghanims_scepter: 24 }
    },
    sven: {
        boots: 'power_treads',
        core: ['echo_sabre', 'blink', 'black_king_bar'],
        luxury: ['daedalus', 'assault', 'swift_blink'],
        situational: [
            { item: 'monkey_king_bar', vs_tags: ['evasion'], reason: 'MKB vs evasion' },
            { item: 'aghanims_scepter', vs_tags: ['aoe', 'teamfight'], reason: 'Storm Hammer dispel' },
            { item: 'satanic', vs_tags: ['burst', 'physical'], reason: 'Satanic for sustain' },
        ],
        timings: { echo_sabre: 10, blink: 16, black_king_bar: 22 }
    },

    // ──── Mid builds ────
    invoker: {
        boots: 'power_treads',
        core: ['hand_of_midas', 'aghanims_scepter', 'black_king_bar'],
        luxury: ['sheepstick', 'refresher', 'octarine_core', 'shivas_guard'],
        situational: [
            { item: 'linken', vs_tags: ['lockdown'], reason: 'Linkens vs single target lockdown' },
            { item: 'euls', vs_tags: ['silence'], reason: 'Euls dispels silence + combo setup' },
            { item: 'spirit_vessel', vs_tags: ['heal', 'regen'], reason: 'Vessel cuts healing' },
        ],
        timings: { hand_of_midas: 6, aghanims_scepter: 18, black_king_bar: 24 }
    },
    storm_spirit: {
        boots: 'power_treads',
        core: ['orchid', 'black_king_bar', 'aghanims_scepter'],
        luxury: ['bloodthorn', 'sheepstick', 'shivas_guard', 'linken'],
        situational: [
            { item: 'euls', vs_tags: ['silence'], reason: 'Euls purge silence' },
            { item: 'linken', vs_tags: ['lockdown'], reason: 'Linkens vs targeted disable' },
            { item: 'spirit_vessel', vs_tags: ['heal'], reason: 'Anti-heal' },
        ],
        timings: { orchid: 14, black_king_bar: 22, aghanims_scepter: 28 }
    },
    shadow_fiend: {
        boots: 'power_treads',
        core: ['maelstrom', 'black_king_bar', 'desolator'],
        luxury: ['daedalus', 'butterfly', 'satanic', 'mjollnir'],
        situational: [
            { item: 'euls', vs_tags: ['disable'], reason: 'Euls for Requiem combo' },
            { item: 'manta', vs_tags: ['silence', 'root'], reason: 'Manta dispel' },
            { item: 'silver_edge', vs_tags: ['passive', 'tank'], reason: 'Break passives' },
        ],
        timings: { maelstrom: 10, black_king_bar: 18, desolator: 24 }
    },
    queen_of_pain: {
        boots: 'power_treads',
        core: ['orchid', 'aghanims_scepter', 'black_king_bar'],
        luxury: ['bloodthorn', 'sheepstick', 'shivas_guard', 'octarine_core'],
        situational: [
            { item: 'linken', vs_tags: ['lockdown'], reason: 'Linkens vs targeted disable' },
            { item: 'euls', vs_tags: ['silence'], reason: 'Purge silence' },
            { item: 'spirit_vessel', vs_tags: ['heal'], reason: 'Anti-heal' },
        ],
        timings: { orchid: 12, aghanims_scepter: 20, black_king_bar: 26 }
    },

    // ──── Offlane builds ────
    axe: {
        boots: 'phase_boots',
        core: ['blink', 'blade_mail', 'black_king_bar'],
        luxury: ['overwhelming_blink', 'heart', 'shivas_guard'],
        situational: [
            { item: 'aghanims_scepter', vs_tags: ['passive', 'aoe'], reason: 'Counter Helix applies hunger on hit' },
            { item: 'pipe', vs_tags: ['magic', 'aoe'], reason: 'Magic barrier for team vs magic damage lineup' },
            { item: 'crimson_guard', vs_tags: ['physical', 'summon'], reason: 'Block physical damage for team' },
            { item: 'heavens_halberd', vs_tags: ['physical', 'carry'], reason: 'Disarm enemy carry' },
            { item: 'lotus_orb', vs_tags: ['lockdown', 'disable'], reason: 'Reflect single target spells' },
        ],
        timings: { blink: 11, blade_mail: 13, black_king_bar: 20 }
    },
    tidehunter: {
        boots: 'arcane_boots',
        core: ['blink', 'aghanims_shard', 'black_king_bar'],
        luxury: ['refresher', 'overwhelming_blink', 'shivas_guard', 'assault'],
        situational: [
            { item: 'pipe', vs_tags: ['magic'], reason: 'Pipe vs magic heavy lineup' },
            { item: 'crimson_guard', vs_tags: ['physical', 'summon'], reason: 'Block physical damage' },
            { item: 'lotus_orb', vs_tags: ['lockdown'], reason: 'Reflect spells' },
        ],
        timings: { blink: 12, arcane_boots: 8, black_king_bar: 22 }
    },
    mars: {
        boots: 'phase_boots',
        core: ['blink', 'black_king_bar', 'desolator'],
        luxury: ['overwhelming_blink', 'assault', 'satanic', 'refresher'],
        situational: [
            { item: 'pipe', vs_tags: ['magic'], reason: 'Team magic protection' },
            { item: 'heavens_halberd', vs_tags: ['physical', 'carry'], reason: 'Disarm carry in Arena' },
            { item: 'aghanims_scepter', vs_tags: ['teamfight'], reason: 'Arena upgrade' },
        ],
        timings: { blink: 11, black_king_bar: 18, desolator: 24 }
    },

    // ──── Support builds ────
    crystal_maiden: {
        boots: 'tranquil_boots',
        core: ['glimmer_cape', 'force_staff', 'black_king_bar'],
        luxury: ['aghanims_scepter', 'wind_waker', 'guardian_greaves'],
        situational: [
            { item: 'ghost', vs_tags: ['physical', 'carry'], reason: 'Ghost Scepter vs physical burst' },
            { item: 'aeon_disk', vs_tags: ['burst', 'initiator'], reason: 'Survive initiation' },
            { item: 'lotus_orb', vs_tags: ['lockdown'], reason: 'Reflect targeted spells' },
        ],
        timings: { glimmer_cape: 14, force_staff: 20 }
    },
    lion: {
        boots: 'arcane_boots',
        core: ['blink', 'aether_lens', 'aghanims_scepter'],
        luxury: ['guardian_greaves', 'force_staff', 'octarine_core'],
        situational: [
            { item: 'ghost', vs_tags: ['physical'], reason: 'Ghost vs physical heroes' },
            { item: 'glimmer_cape', vs_tags: ['magic', 'burst'], reason: 'Magic resist save' },
            { item: 'aeon_disk', vs_tags: ['burst', 'initiator'], reason: 'Survive burst' },
        ],
        timings: { blink: 14, aether_lens: 20 }
    },
    witch_doctor: {
        boots: 'arcane_boots',
        core: ['glimmer_cape', 'aghanims_scepter', 'black_king_bar'],
        luxury: ['guardian_greaves', 'refresher', 'aeon_disk'],
        situational: [
            { item: 'ghost', vs_tags: ['physical'], reason: 'Ghost during Death Ward' },
            { item: 'force_staff', vs_tags: ['mobile', 'gap_close'], reason: 'Reposition during Ward' },
            { item: 'aeon_disk', vs_tags: ['burst'], reason: 'Survive initiation' },
        ],
        timings: { glimmer_cape: 16, aghanims_scepter: 24 }
    },

    // ──── Default template for heroes without specific builds ────
    _default_carry: {
        boots: 'power_treads',
        core: ['maelstrom', 'black_king_bar', 'sange_and_yasha'],
        luxury: ['daedalus', 'satanic', 'butterfly', 'skadi'],
        situational: [
            { item: 'monkey_king_bar', vs_tags: ['evasion'], reason: 'MKB vs evasion' },
            { item: 'silver_edge', vs_tags: ['passive', 'tank'], reason: 'Break passives' },
            { item: 'linken', vs_tags: ['lockdown'], reason: 'Block targeted spells' },
        ],
        timings: { maelstrom: 14, black_king_bar: 22 }
    },
    _default_mid: {
        boots: 'power_treads',
        core: ['aghanims_scepter', 'black_king_bar', 'euls'],
        luxury: ['sheepstick', 'octarine_core', 'shivas_guard'],
        situational: [
            { item: 'spirit_vessel', vs_tags: ['heal'], reason: 'Anti-healing' },
            { item: 'linken', vs_tags: ['lockdown'], reason: 'Block targeted spells' },
        ],
        timings: { aghanims_scepter: 18, black_king_bar: 24 }
    },
    _default_offlane: {
        boots: 'phase_boots',
        core: ['blink', 'blade_mail', 'black_king_bar'],
        luxury: ['overwhelming_blink', 'heart', 'assault'],
        situational: [
            { item: 'pipe', vs_tags: ['magic'], reason: 'Pipe vs magic lineup' },
            { item: 'crimson_guard', vs_tags: ['physical', 'summon'], reason: 'Block physical' },
            { item: 'heavens_halberd', vs_tags: ['carry', 'physical'], reason: 'Disarm carry' },
            { item: 'lotus_orb', vs_tags: ['lockdown'], reason: 'Reflect spells' },
        ],
        timings: { blink: 12, blade_mail: 15, black_king_bar: 22 }
    },
    _default_support: {
        boots: 'arcane_boots',
        core: ['glimmer_cape', 'force_staff', 'aghanims_shard'],
        luxury: ['guardian_greaves', 'aghanims_scepter', 'aeon_disk'],
        situational: [
            { item: 'ghost', vs_tags: ['physical', 'carry'], reason: 'Ghost vs physical burst' },
            { item: 'aeon_disk', vs_tags: ['burst', 'initiator'], reason: 'Survive burst damage' },
            { item: 'spirit_vessel', vs_tags: ['heal'], reason: 'Anti-heal' },
        ],
        timings: { glimmer_cape: 16, force_staff: 22 }
    },
};

// ─── Get build for hero ─────────────────────────────────────
export function getHeroBuild(heroId, heroData) {
    if (HERO_BUILDS[heroId]) return HERO_BUILDS[heroId];
    // Fallback by primary role
    const roles = heroData?.roles || [];
    if (roles.includes('carry')) return HERO_BUILDS._default_carry;
    if (roles.includes('mid')) return HERO_BUILDS._default_mid;
    if (roles.includes('offlane')) return HERO_BUILDS._default_offlane;
    return HERO_BUILDS._default_support;
}

// ─── Get situational items based on enemy tags ──────────────
export function getSituationalItems(build, enemyTags) {
    if (!build?.situational) return [];
    return build.situational.filter(s =>
        s.vs_tags.some(tag => enemyTags.includes(tag))
    );
}
