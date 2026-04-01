/**
 * songs.js — Melody Recommender: Core Data Config
 *
 * This is the primary config file the site owner edits to tune the recommender.
 * Adjust classWeights (0.00–1.00) to raise or lower how strongly a song is
 * recommended for each class. Add, remove, or update songs as the game changes.
 *
 * Loaded via <script src="/tools/melody/songs.js"> before melody.js.
 * All variables are global (no modules — static HTML/jQuery site).
 */

// ---------------------------------------------------------------------------
// CLASSES
// ---------------------------------------------------------------------------

var CLASSES = [
  { id: 'warrior',      name: 'Warrior',      type: ['melee', 'tank', 'warrior-tank'] },
  { id: 'cleric',       name: 'Cleric',       type: ['healer', 'caster'] },
  { id: 'paladin',      name: 'Paladin',      type: ['tank', 'hybrid', 'melee'] },
  { id: 'ranger',       name: 'Ranger',       type: ['melee', 'hybrid'] },
  { id: 'shadowknight', name: 'Shadowknight', type: ['tank', 'hybrid', 'melee'] },
  { id: 'druid',        name: 'Druid',        type: ['healer', 'caster'] },
  { id: 'monk',         name: 'Monk',         type: ['melee'] },
  { id: 'bard',         name: 'Bard',         type: ['melee', 'hybrid'] },
  { id: 'rogue',        name: 'Rogue',        type: ['melee'] },
  { id: 'shaman',       name: 'Shaman',       type: ['healer', 'caster', 'slower'] },
  { id: 'necromancer',  name: 'Necromancer',  type: ['caster'] },
  { id: 'wizard',       name: 'Wizard',       type: ['caster'] },
  { id: 'magician',     name: 'Magician',     type: ['caster'] },
  { id: 'enchanter',    name: 'Enchanter',    type: ['caster', 'slower', 'haster'] },
  { id: 'beastlord',    name: 'Beastlord',    type: ['melee', 'hybrid', 'slower'] }
];

// ---------------------------------------------------------------------------
// INSTRUMENTS
// ---------------------------------------------------------------------------

var INSTRUMENTS = {
  percussion: {
    none:    { name: 'None',              mod: 0  },
    combine: { name: 'Combine',           mod: 10 },
    selos:   { name: "Selo's Drums",      mod: 18 },
    drum_of_beast: { name: 'Drum of the Beast', mod: 24 }
  },
  stringed: {
    none:    { name: 'None',              mod: 0  },
    combine: { name: 'Combine',           mod: 10 },
    kelin:   { name: "Kelin's Lute",      mod: 18 },
    lyran:   { name: "Lyran's Lute",      mod: 24 }
  },
  brass: {
    none:        { name: 'None',              mod: 0  },
    combine:     { name: 'Combine',           mod: 10 },
    mcvax:       { name: "McVaxius' Horn",    mod: 18 },
    immaculate:  { name: 'Immaculate Horn',   mod: 22 },
    denon:       { name: "Denon's Horn",      mod: 24 }
  },
  wind: {
    none:    { name: 'None',              mod: 0  },
    combine: { name: 'Combine',           mod: 10 },
    pipes:   { name: 'Pipes of Insight',  mod: 18 },
    mahlin:  { name: "Mahlin's Flute",    mod: 24 }
  },
  singing: {
    none: { name: 'None', mod: 0 }
  }
};

// ---------------------------------------------------------------------------
// ALTERNATE ADVANCEMENT MODIFIERS
// ---------------------------------------------------------------------------

var AA_MODS = {
  instrument_mastery: [0, 1, 2, 3],
  singing_mastery:    [0, 1, 2, 3],
  jam_fest:           [0, 1, 2, 3]
};

// ---------------------------------------------------------------------------
// SINGING CLICKY ITEMS
// ---------------------------------------------------------------------------

var SINGING_CLICKIES = {
  none: { name: 'None',                                    mod: 0 },
  vots: { name: 'Voice of the Serpent (Resonance)',        mod: 6 },
  shei: { name: 'Shadowsong Cloak (Harmonize)',            mod: 9 }
};

// ---------------------------------------------------------------------------
// INSTRUMENT SOFT CAP
// ---------------------------------------------------------------------------

var INSTRUMENT_SOFT_CAP = 36;

// ---------------------------------------------------------------------------
// SONGS
// ---------------------------------------------------------------------------

var SONGS = [

  // -------------------------------------------------------------------------
  // v3 Overhaste (bard-exclusive, not eliminated by external haste)
  // -------------------------------------------------------------------------

  {
    id: 2606,
    name: "Battlecry of the Vah Shir",
    level: 52,
    instrument: 'brass',
    category: 'overhaste_v3',
    effects: [
      { type: 'Haste3', value: 15, moddable: false }
    ],
    classWeights: {
      warrior: 0.95, rogue: 0.90, monk: 0.85, ranger: 0.60,
      beastlord: 0.65, bard: 0.50, paladin: 0.15, shadowknight: 0.15,
      cleric: 0.0, druid: 0.0, shaman: 0.0, necromancer: 0.0,
      wizard: 0.0, magician: 0.0, enchanter: 0.0
    }
  },

  {
    id: 2610,
    name: "Warsong of the Vah Shir",
    level: 60,
    instrument: 'brass',
    category: 'overhaste_v3',
    effects: [
      { type: 'Haste3', value: 25, moddable: false }
    ],
    classWeights: {
      warrior: 0.95, rogue: 0.90, monk: 0.85, ranger: 0.60,
      beastlord: 0.65, bard: 0.50, paladin: 0.15, shadowknight: 0.15,
      cleric: 0.0, druid: 0.0, shaman: 0.0, necromancer: 0.0,
      wizard: 0.0, magician: 0.0, enchanter: 0.0
    }
  },

  // -------------------------------------------------------------------------
  // v1/v2 Haste (eliminateIf: haster — enc already has their own haste)
  // -------------------------------------------------------------------------

  {
    id: 701,
    name: "Anthem de Arms",
    level: 10,
    instrument: 'singing',
    category: 'haste_v1v2',
    eliminateIf: ['haster'],
    effects: [
      { type: 'AttackSpeed', value: 110, moddable: false },
      { type: 'STR',         value: 35,  moddable: true  }
    ],
    classWeights: {
      warrior: 0.85, rogue: 0.80, monk: 0.80, ranger: 0.70,
      beastlord: 0.70, bard: 0.60, paladin: 0.65, shadowknight: 0.65,
      cleric: 0.10, druid: 0.10, shaman: 0.10, necromancer: 0.05,
      wizard: 0.05, magician: 0.05, enchanter: 0.0
    }
  },

  {
    id: 740,
    name: "Vilia's Verses of Celerity",
    level: 36,
    instrument: 'singing',
    category: 'haste_v1v2',
    eliminateIf: ['haster'],
    effects: [
      { type: 'AttackSpeed', value: 120, moddable: false },
      { type: 'AGI',         value: 35,  moddable: true  },
      { type: 'AC',          value: 31,  moddable: true  }
    ],
    classWeights: {
      warrior: 0.85, rogue: 0.80, monk: 0.80, ranger: 0.70,
      beastlord: 0.70, bard: 0.60, paladin: 0.65, shadowknight: 0.65,
      cleric: 0.10, druid: 0.10, shaman: 0.10, necromancer: 0.05,
      wizard: 0.05, magician: 0.05, enchanter: 0.0
    }
  },

  {
    id: 702,
    name: "McVaxius' Berserker Crescendo",
    level: 42,
    instrument: 'brass',
    category: 'haste_v1v2',
    eliminateIf: ['haster'],
    effects: [
      { type: 'AttackSpeed', value: 123, moddable: false },
      { type: 'STR',         value: 21,  moddable: true  },
      { type: 'AC',          value: 31,  moddable: true  }
    ],
    classWeights: {
      warrior: 0.85, rogue: 0.80, monk: 0.80, ranger: 0.70,
      beastlord: 0.70, bard: 0.60, paladin: 0.65, shadowknight: 0.65,
      cleric: 0.10, druid: 0.10, shaman: 0.10, necromancer: 0.05,
      wizard: 0.05, magician: 0.05, enchanter: 0.0
    }
  },

  {
    id: 747,
    name: "Verses of Victory",
    level: 50,
    instrument: 'singing',
    category: 'haste_v1v2',
    eliminateIf: ['haster'],
    effects: [
      { type: 'AttackSpeed', value: 130, moddable: false },
      { type: 'AGI',         value: 30,  moddable: false },
      { type: 'AC',          value: 50,  moddable: false },
      { type: 'STR',         value: 30,  moddable: false }
    ],
    classWeights: {
      warrior: 0.85, rogue: 0.80, monk: 0.80, ranger: 0.70,
      beastlord: 0.70, bard: 0.60, paladin: 0.65, shadowknight: 0.65,
      cleric: 0.10, druid: 0.10, shaman: 0.10, necromancer: 0.05,
      wizard: 0.05, magician: 0.05, enchanter: 0.0
    }
  },

  {
    id: 1757,
    name: "Vilia's Chorus of Celerity",
    level: 54,
    instrument: 'singing',
    category: 'haste_v1v2',
    eliminateIf: ['haster'],
    effects: [
      { type: 'AttackSpeed', value: 145, moddable: false }
    ],
    classWeights: {
      warrior: 0.85, rogue: 0.80, monk: 0.80, ranger: 0.70,
      beastlord: 0.70, bard: 0.60, paladin: 0.65, shadowknight: 0.65,
      cleric: 0.10, druid: 0.10, shaman: 0.10, necromancer: 0.05,
      wizard: 0.05, magician: 0.05, enchanter: 0.0
    }
  },

  {
    id: 1449,
    name: "Melody of Ervaj",
    level: 50,
    instrument: 'brass',
    category: 'haste_v1v2',
    eliminateIf: ['haster'],
    effects: [
      { type: 'Haste2', value: 105, moddable: false },
      { type: 'AC',           value: 21,  moddable: true  }
    ],
    classWeights: {
      warrior: 0.85, rogue: 0.80, monk: 0.80, ranger: 0.70,
      beastlord: 0.70, bard: 0.60, paladin: 0.65, shadowknight: 0.65,
      cleric: 0.10, druid: 0.10, shaman: 0.10, necromancer: 0.05,
      wizard: 0.05, magician: 0.05, enchanter: 0.0
    }
  },

  {
    id: 1452,
    name: "Composition of Ervaj",
    level: 60,
    instrument: 'brass',
    category: 'haste_v1v2',
    eliminateIf: ['haster'],
    effects: [
      { type: 'Haste2', value: 110, moddable: false },
      { type: 'AC',           value: 30,  moddable: true  }
    ],
    classWeights: {
      warrior: 0.85, rogue: 0.80, monk: 0.80, ranger: 0.70,
      beastlord: 0.70, bard: 0.60, paladin: 0.65, shadowknight: 0.65,
      cleric: 0.10, druid: 0.10, shaman: 0.10, necromancer: 0.05,
      wizard: 0.05, magician: 0.05, enchanter: 0.0
    }
  },

  // -------------------------------------------------------------------------
  // ATK / Damage Shield (McVaxius Rondo — NOT eliminated by external haste)
  // -------------------------------------------------------------------------

  {
    id: 1760,
    name: "McVaxius' Rousing Rondo",
    level: 57,
    instrument: 'brass',
    category: 'atk_ds',
    effects: [
      { type: 'AttackSpeed',  value: 120, moddable: false },
      { type: 'STR',          value: 21,  moddable: true  },
      { type: 'ATK',          value: 12,  moddable: true  },
      { type: 'DS', value: 8,   moddable: true  }
    ],
    classWeights: {
      warrior: 0.90, monk: 0.85, rogue: 0.85, ranger: 0.70,
      beastlord: 0.70, paladin: 0.60, shadowknight: 0.60, bard: 0.55,
      shaman: 0.20, cleric: 0.15, druid: 0.15, necromancer: 0.10,
      wizard: 0.10, magician: 0.10, enchanter: 0.05
    }
  },

  // -------------------------------------------------------------------------
  // Mana / HP Regen
  // -------------------------------------------------------------------------

  {
    id: 7,
    name: "Hymn of Restoration",
    level: 6,
    instrument: 'stringed',
    category: 'hp_regen',
    effects: [
      { type: 'HP', value: 11, moddable: true }
    ],
    classWeights: {
      warrior: 0.50, cleric: 0.45, paladin: 0.45, ranger: 0.45,
      shadowknight: 0.45, druid: 0.40, monk: 0.45, bard: 0.40,
      rogue: 0.45, shaman: 0.40, necromancer: 0.35, wizard: 0.35,
      magician: 0.35, enchanter: 0.35, beastlord: 0.45
    }
  },

  {
    id: 1287,
    name: "Cassindra's Chant of Clarity",
    level: 20,
    instrument: 'singing',
    category: 'mana_regen',
    effects: [
      { type: 'Mana', value: 2, moddable: false }
    ],
    classWeights: {
      warrior: 0.0, cleric: 0.70, paladin: 0.35, ranger: 0.35,
      shadowknight: 0.35, druid: 0.70, monk: 0.0, bard: 0.20,
      rogue: 0.0, shaman: 0.70, necromancer: 0.80, wizard: 0.85,
      magician: 0.85, enchanter: 0.80, beastlord: 0.30
    }
  },

  {
    id: 723,
    name: "Cassindra's Chorus of Clarity",
    level: 32,
    instrument: 'singing',
    category: 'mana_regen',
    effects: [
      { type: 'Mana', value: 7, moddable: false }
    ],
    classWeights: {
      warrior: 0.0, cleric: 0.75, paladin: 0.40, ranger: 0.40,
      shadowknight: 0.40, druid: 0.75, monk: 0.0, bard: 0.25,
      rogue: 0.0, shaman: 0.75, necromancer: 0.85, wizard: 0.90,
      magician: 0.90, enchanter: 0.85, beastlord: 0.35
    }
  },

  {
    id: 1448,
    name: "Cantata of Soothing",
    level: 34,
    instrument: 'stringed',
    category: 'hp_mana_regen',
    effects: [
      { type: 'HP',   value: 4, moddable: true },
      { type: 'Mana', value: 5, moddable: true }
    ],
    classWeights: {
      warrior: 0.30, cleric: 0.60, paladin: 0.45, ranger: 0.45,
      shadowknight: 0.45, druid: 0.60, monk: 0.30, bard: 0.35,
      rogue: 0.30, shaman: 0.60, necromancer: 0.65, wizard: 0.70,
      magician: 0.70, enchanter: 0.65, beastlord: 0.45
    }
  },

  {
    id: 1759,
    name: "Cantata of Replenishment",
    level: 55,
    instrument: 'stringed',
    category: 'hp_mana_regen',
    effects: [
      { type: 'HP',   value: 12, moddable: true },
      { type: 'Mana', value: 11, moddable: true }
    ],
    classWeights: {
      warrior: 0.30, cleric: 0.75, paladin: 0.50, ranger: 0.50,
      shadowknight: 0.50, druid: 0.75, monk: 0.30, bard: 0.40,
      rogue: 0.30, shaman: 0.75, necromancer: 0.80, wizard: 0.85,
      magician: 0.85, enchanter: 0.80, beastlord: 0.50
    }
  },

  {
    id: 2609,
    name: "Chorus of Replenishment",
    level: 58,
    instrument: 'stringed',
    category: 'hp_mana_regen',
    raidOnly: true,
    effects: [
      { type: 'HP',   value: 12, moddable: true },
      { type: 'Mana', value: 11, moddable: true }
    ],
    classWeights: {
      warrior: 0.30, cleric: 0.75, paladin: 0.50, ranger: 0.50,
      shadowknight: 0.50, druid: 0.75, monk: 0.30, bard: 0.40,
      rogue: 0.30, shaman: 0.75, necromancer: 0.80, wizard: 0.85,
      magician: 0.85, enchanter: 0.80, beastlord: 0.50
    }
  },

  {
    id: 1196,
    name: "Ancient: Lcea's Lament",
    level: 60,
    instrument: 'stringed',
    category: 'hp_mana_regen',
    raidOnly: true,
    effects: [
      { type: 'HP',   value: 16, moddable: true },
      { type: 'Mana', value: 15, moddable: true }
    ],
    classWeights: {
      warrior: 0.35, cleric: 0.85, paladin: 0.55, ranger: 0.55,
      shadowknight: 0.55, druid: 0.85, monk: 0.35, bard: 0.45,
      rogue: 0.35, shaman: 0.85, necromancer: 0.90, wizard: 0.95,
      magician: 0.95, enchanter: 0.90, beastlord: 0.55
    }
  },

  // -------------------------------------------------------------------------
  // Resist + AC (Psalms and Rhythms)
  // -------------------------------------------------------------------------

  {
    id: 710,
    name: "Elemental Rhythms",
    level: 9,
    instrument: 'percussion',
    category: 'resist_multi_elem',
    encounterTags: ['fire', 'cold', 'magic'],
    effects: [
      { type: 'MR', value: 35, moddable: true },
      { type: 'CR', value: 35, moddable: true },
      { type: 'FR', value: 35, moddable: true },
      { type: 'AC', value: 20, moddable: true }
    ],
    classWeights: {
      warrior: 0.50, cleric: 0.50, paladin: 0.50, ranger: 0.50,
      shadowknight: 0.50, druid: 0.50, monk: 0.50, bard: 0.50,
      rogue: 0.50, shaman: 0.50, necromancer: 0.50, wizard: 0.50,
      magician: 0.50, enchanter: 0.50, beastlord: 0.50
    }
  },

  {
    id: 711,
    name: "Purifying Rhythms",
    level: 13,
    instrument: 'percussion',
    category: 'resist_multi_purify',
    encounterTags: ['poison', 'disease', 'magic'],
    effects: [
      { type: 'MR', value: 35, moddable: true },
      { type: 'PR', value: 35, moddable: true },
      { type: 'DR', value: 35, moddable: true },
      { type: 'AC', value: 20, moddable: true }
    ],
    classWeights: {
      warrior: 0.50, cleric: 0.50, paladin: 0.50, ranger: 0.50,
      shadowknight: 0.50, druid: 0.50, monk: 0.50, bard: 0.50,
      rogue: 0.50, shaman: 0.50, necromancer: 0.50, wizard: 0.50,
      magician: 0.50, enchanter: 0.50, beastlord: 0.50
    }
  },

  {
    id: 709,
    name: "Guardian Rhythms",
    level: 17,
    instrument: 'percussion',
    category: 'ac_def',
    effects: [
      { type: 'AC', value: 35, moddable: true },
      { type: 'MR', value: 35, moddable: true }
    ],
    classWeights: {
      warrior: 0.80, paladin: 0.75, shadowknight: 0.75, monk: 0.60,
      ranger: 0.55, beastlord: 0.55, bard: 0.50, rogue: 0.45,
      cleric: 0.40, druid: 0.35, shaman: 0.35, necromancer: 0.20,
      wizard: 0.20, magician: 0.20, enchanter: 0.20
    }
  },

  {
    id: 712,
    name: "Psalm of Warmth",
    level: 25,
    instrument: 'singing',
    category: 'resist_cold',
    encounterTags: ['cold'],
    effects: [
      { type: 'DS', value: 11, moddable: true },
      { type: 'CR',           value: 70, moddable: true },
      { type: 'AC',           value: 20, moddable: true }
    ],
    classWeights: {
      warrior: 0.50, cleric: 0.50, paladin: 0.50, ranger: 0.50,
      shadowknight: 0.50, druid: 0.50, monk: 0.50, bard: 0.50,
      rogue: 0.50, shaman: 0.50, necromancer: 0.50, wizard: 0.50,
      magician: 0.50, enchanter: 0.50, beastlord: 0.50
    }
  },

  {
    id: 715,
    name: "Psalm of Vitality",
    level: 29,
    instrument: 'singing',
    category: 'resist_disease',
    encounterTags: ['disease'],
    effects: [
      { type: 'DS', value: 11, moddable: true },
      { type: 'DR',           value: 70, moddable: true },
      { type: 'AC',           value: 20, moddable: true }
    ],
    classWeights: {
      warrior: 0.50, cleric: 0.50, paladin: 0.50, ranger: 0.50,
      shadowknight: 0.50, druid: 0.50, monk: 0.50, bard: 0.50,
      rogue: 0.50, shaman: 0.50, necromancer: 0.50, wizard: 0.50,
      magician: 0.50, enchanter: 0.50, beastlord: 0.50
    }
  },

  {
    id: 713,
    name: "Psalm of Cooling",
    level: 33,
    instrument: 'singing',
    category: 'resist_fire',
    encounterTags: ['fire'],
    effects: [
      { type: 'DS', value: 11, moddable: true },
      { type: 'FR',           value: 70, moddable: true },
      { type: 'AC',           value: 20, moddable: true }
    ],
    classWeights: {
      warrior: 0.50, cleric: 0.50, paladin: 0.50, ranger: 0.50,
      shadowknight: 0.50, druid: 0.50, monk: 0.50, bard: 0.50,
      rogue: 0.50, shaman: 0.50, necromancer: 0.50, wizard: 0.50,
      magician: 0.50, enchanter: 0.50, beastlord: 0.50
    }
  },

  {
    id: 716,
    name: "Psalm of Purity",
    level: 37,
    instrument: 'singing',
    category: 'resist_poison',
    encounterTags: ['poison'],
    effects: [
      { type: 'DS', value: 11, moddable: true },
      { type: 'PR',           value: 70, moddable: true },
      { type: 'AC',           value: 20, moddable: true }
    ],
    classWeights: {
      warrior: 0.50, cleric: 0.50, paladin: 0.50, ranger: 0.50,
      shadowknight: 0.50, druid: 0.50, monk: 0.50, bard: 0.50,
      rogue: 0.50, shaman: 0.50, necromancer: 0.50, wizard: 0.50,
      magician: 0.50, enchanter: 0.50, beastlord: 0.50
    }
  },

  {
    id: 714,
    name: "Psalm of Mystic Shielding",
    level: 41,
    instrument: 'singing',
    category: 'resist_magic',
    encounterTags: ['magic'],
    effects: [
      { type: 'MR',     value: 70, moddable: true  },
      { type: 'Absorb', value: 15, moddable: true  },
      { type: 'HP',     value: 5,  moddable: false },
      { type: 'AC',     value: 20, moddable: true  }
    ],
    classWeights: {
      warrior: 0.50, cleric: 0.50, paladin: 0.50, ranger: 0.50,
      shadowknight: 0.50, druid: 0.50, monk: 0.50, bard: 0.50,
      rogue: 0.50, shaman: 0.50, necromancer: 0.50, wizard: 0.50,
      magician: 0.50, enchanter: 0.50, beastlord: 0.50
    }
  },

  {
    id: 2607,
    name: "Elemental Chorus",
    level: 54,
    instrument: 'percussion',
    category: 'resist_multi_elem',
    raidOnly: true,
    encounterTags: ['fire', 'cold', 'magic'],
    effects: [
      { type: 'MR', value: 45, moddable: true  },
      { type: 'CR', value: 45, moddable: true  },
      { type: 'FR', value: 45, moddable: true  },
      { type: 'AC', value: 4,  moddable: false }
    ],
    classWeights: {
      warrior: 0.50, cleric: 0.50, paladin: 0.50, ranger: 0.50,
      shadowknight: 0.50, druid: 0.50, monk: 0.50, bard: 0.50,
      rogue: 0.50, shaman: 0.50, necromancer: 0.50, wizard: 0.50,
      magician: 0.50, enchanter: 0.50, beastlord: 0.50
    }
  },

  {
    id: 2608,
    name: "Purifying Chorus",
    level: 56,
    instrument: 'percussion',
    category: 'resist_multi_purify',
    raidOnly: true,
    encounterTags: ['poison', 'disease', 'magic'],
    effects: [
      { type: 'MR', value: 45, moddable: true  },
      { type: 'PR', value: 45, moddable: true  },
      { type: 'DR', value: 45, moddable: true  },
      { type: 'AC', value: 4,  moddable: false }
    ],
    classWeights: {
      warrior: 0.50, cleric: 0.50, paladin: 0.50, ranger: 0.50,
      shadowknight: 0.50, druid: 0.50, monk: 0.50, bard: 0.50,
      rogue: 0.50, shaman: 0.50, necromancer: 0.50, wizard: 0.50,
      magician: 0.50, enchanter: 0.50, beastlord: 0.50
    }
  },

  // -------------------------------------------------------------------------
  // AC / Defensive
  // -------------------------------------------------------------------------

  {
    id: 700,
    name: "Chant of Battle",
    level: 1,
    instrument: 'percussion',
    category: 'ac_def',
    effects: [
      { type: 'AC',  value: 20, moddable: true },
      { type: 'STR', value: 20, moddable: true },
      { type: 'DEX', value: 20, moddable: true }
    ],
    classWeights: {
      warrior: 0.40, paladin: 0.40, shadowknight: 0.40, ranger: 0.40,
      monk: 0.40, beastlord: 0.40, bard: 0.35, rogue: 0.35,
      cleric: 0.10, druid: 0.10, shaman: 0.10, necromancer: 0.05,
      wizard: 0.05, magician: 0.05, enchanter: 0.05
    }
  },

  {
    id: 748,
    name: "Niv's Melody of Preservation",
    level: 47,
    instrument: 'stringed',
    category: 'ac_def',
    effects: [
      { type: 'STR',    value: 10, moddable: false },
      { type: 'Absorb', value: 10, moddable: true  },
      { type: 'HP',     value: 8,  moddable: true  }
    ],
    classWeights: {
      warrior: 0.55, paladin: 0.55, shadowknight: 0.55, monk: 0.50,
      ranger: 0.50, beastlord: 0.50, bard: 0.45, rogue: 0.45,
      cleric: 0.35, druid: 0.35, shaman: 0.35, necromancer: 0.25,
      wizard: 0.25, magician: 0.25, enchanter: 0.25
    }
  },

  {
    id: 1450,
    name: "Shield of Songs",
    level: 49,
    instrument: 'stringed',
    category: 'ac_def',
    effects: [
      { type: 'Rune',   value: 20, moddable: true },
      { type: 'Absorb', value: 20, moddable: true }
    ],
    classWeights: {
      warrior: 0.70, paladin: 0.70, shadowknight: 0.70, monk: 0.55,
      ranger: 0.55, beastlord: 0.55, bard: 0.50, rogue: 0.50,
      cleric: 0.40, druid: 0.35, shaman: 0.35, necromancer: 0.25,
      wizard: 0.25, magician: 0.25, enchanter: 0.25
    }
  },

  {
    id: 1763,
    name: "Niv's Harmonic",
    level: 58,
    instrument: 'singing',
    category: 'ac_def',
    effects: [
      { type: 'Absorb', value: 10, moddable: false },
      { type: 'AC',     value: 80, moddable: false }
    ],
    classWeights: {
      warrior: 0.35, paladin: 0.35, shadowknight: 0.35, monk: 0.30,
      ranger: 0.30, beastlord: 0.30, bard: 0.25, rogue: 0.25,
      cleric: 0.20, druid: 0.20, shaman: 0.20, necromancer: 0.15,
      wizard: 0.15, magician: 0.15, enchanter: 0.15
    }
  },

  // -------------------------------------------------------------------------
  // Slow (eliminateIf: slower — shaman/enc have their own slow)
  // -------------------------------------------------------------------------

  {
    id: 705,
    name: "Largo's Melodic Binding",
    level: 20,
    instrument: 'singing',
    category: 'slow',
    eliminateIf: ['slower'],
    encounterTags: ['slow'],
    effects: [
      { type: 'AttackSpeed',   value: 65,  moddable: false, label: '35% slow' },
      { type: 'AC',            value: -35, moddable: true }
    ],
    classWeights: {
      warrior: 0.70, paladin: 0.65, shadowknight: 0.65, monk: 0.50,
      ranger: 0.50, beastlord: 0.0, bard: 0.40, rogue: 0.45,
      cleric: 0.40, druid: 0.40, necromancer: 0.35, wizard: 0.35,
      magician: 0.35, enchanter: 0.0, shaman: 0.0
    }
  },

  {
    id: 738,
    name: "Selo's Consonant Chain",
    level: 23,
    instrument: 'singing',
    category: 'slow',
    eliminateIf: ['slower'],
    encounterTags: ['slow'],
    effects: [
      { type: 'AttackSpeed',   value: 60,  moddable: false, label: '40% slow' },
      { type: 'MovementSpeed', value: -90, moddable: false, label: 'Snare' }
    ],
    classWeights: {
      warrior: 0.70, paladin: 0.65, shadowknight: 0.65, monk: 0.50,
      ranger: 0.50, beastlord: 0.0, bard: 0.40, rogue: 0.45,
      cleric: 0.40, druid: 0.40, necromancer: 0.35, wizard: 0.35,
      magician: 0.35, enchanter: 0.0, shaman: 0.0
    }
  },

  {
    id: 746,
    name: "Selo's Chords of Cessation",
    level: 48,
    instrument: 'stringed',
    category: 'slow',
    eliminateIf: ['slower'],
    encounterTags: ['slow'],
    effects: [
      { type: 'AttackSpeed', value: 75,  moddable: false, label: '25% slow' },
      { type: 'HP',   value: -32, moddable: true,  label: 'DoT' }
    ],
    classWeights: {
      warrior: 0.70, paladin: 0.65, shadowknight: 0.65, monk: 0.50,
      ranger: 0.50, beastlord: 0.0, bard: 0.40, rogue: 0.45,
      cleric: 0.40, druid: 0.40, necromancer: 0.35, wizard: 0.35,
      magician: 0.35, enchanter: 0.0, shaman: 0.0
    }
  },

  {
    id: 1751,
    name: "Largo's Absonant Binding",
    level: 51,
    instrument: 'singing',
    category: 'slow',
    eliminateIf: ['slower'],
    encounterTags: ['slow'],
    effects: [
      { type: 'AttackSpeed',   value: 65,  moddable: false, label: '35% slow' },
      { type: 'AC',            value: -61, moddable: true  },
      { type: 'MovementSpeed', value: -61, moddable: false, label: 'Snare' },
      { type: 'AGI',           value: -50, moddable: true  }
    ],
    classWeights: {
      warrior: 0.70, paladin: 0.65, shadowknight: 0.65, monk: 0.50,
      ranger: 0.50, beastlord: 0.0, bard: 0.40, rogue: 0.45,
      cleric: 0.40, druid: 0.40, necromancer: 0.35, wizard: 0.35,
      magician: 0.35, enchanter: 0.0, shaman: 0.0
    }
  },

  {
    id: 1758,
    name: "Selo's Assonant Strane",
    level: 54,
    instrument: 'stringed',
    category: 'slow',
    eliminateIf: ['slower'],
    encounterTags: ['slow'],
    effects: [
      { type: 'AttackSpeed',   value: 60,  moddable: false, label: '40% slow AE' },
      { type: 'MovementSpeed', value: -45, moddable: false, label: 'Snare' }
    ],
    classWeights: {
      warrior: 0.70, paladin: 0.65, shadowknight: 0.65, monk: 0.50,
      ranger: 0.50, beastlord: 0.0, bard: 0.40, rogue: 0.45,
      cleric: 0.40, druid: 0.40, necromancer: 0.35, wizard: 0.35,
      magician: 0.35, enchanter: 0.0, shaman: 0.0
    }
  },

  {
    id: 1748,
    name: "Angstlich's Assonance",
    level: 60,
    instrument: 'brass',
    category: 'slow',
    eliminateIf: ['slower'],
    encounterTags: ['slow'],
    effects: [
      { type: 'AttackSpeed', value: 60,  moddable: false, label: '40% slow' },
      { type: 'HP',   value: -25, moddable: true,  label: 'DoT' }
    ],
    classWeights: {
      warrior: 0.70, paladin: 0.65, shadowknight: 0.65, monk: 0.50,
      ranger: 0.50, beastlord: 0.0, bard: 0.40, rogue: 0.45,
      cleric: 0.40, druid: 0.40, necromancer: 0.35, wizard: 0.35,
      magician: 0.35, enchanter: 0.0, shaman: 0.0
    }
  },

  // -------------------------------------------------------------------------
  // DoTs + Resist Debuffs
  // -------------------------------------------------------------------------

  {
    id: 703,
    name: "Chords of Dissonance",
    level: 2,
    instrument: 'stringed',
    category: 'dot_ae',
    soloOnly: true,
    effects: [
      { type: 'HP', value: -17, moddable: true }
    ],
    classWeights: {
      warrior: 0.0, cleric: 0.0, paladin: 0.0, ranger: 0.0,
      shadowknight: 0.0, druid: 0.0, monk: 0.0, bard: 1.0,
      rogue: 0.0, shaman: 0.0, necromancer: 0.0, wizard: 0.0,
      magician: 0.0, enchanter: 0.0, beastlord: 0.0
    }
  },

  {
    id: 730,
    name: "Denon's Disruptive Discord",
    level: 18,
    instrument: 'brass',
    category: 'dot_ae',
    soloOnly: true,
    effects: [
      { type: 'HP', value: -19, moddable: true },
      { type: 'AC',        value: -61, moddable: true }
    ],
    classWeights: {
      warrior: 0.0, cleric: 0.0, paladin: 0.0, ranger: 0.0,
      shadowknight: 0.0, druid: 0.0, monk: 0.0, bard: 1.0,
      rogue: 0.0, shaman: 0.0, necromancer: 0.0, wizard: 0.0,
      magician: 0.0, enchanter: 0.0, beastlord: 0.0
    }
  },

  {
    id: 707,
    name: "Fufil's Curtailing Chant",
    level: 30,
    instrument: 'percussion',
    category: 'dot',
    encounterTags: ['resist_debuff'],
    effects: [
      { type: 'HP', value: -21, moddable: true  },
      { type: 'MR',        value: -17, moddable: false, label: 'MR debuff' }
    ],
    classWeights: {
      warrior: 0.0, cleric: 0.0, paladin: 0.0, ranger: 0.0,
      shadowknight: 0.0, druid: 0.0, monk: 0.0, bard: 0.0,
      rogue: 0.0, shaman: 0.0, necromancer: 0.30, wizard: 0.40,
      magician: 0.40, enchanter: 0.30, beastlord: 0.0
    }
  },

  {
    id: 743,
    name: "Tuyen's Chant of Flame",
    level: 38,
    instrument: 'percussion',
    category: 'dot',
    encounterTags: ['resist_debuff'],
    effects: [
      { type: 'HP', value: -31, moddable: true  },
      { type: 'FR',        value: -17, moddable: false, label: 'FR debuff' }
    ],
    classWeights: {
      warrior: 0.0, cleric: 0.0, paladin: 0.0, ranger: 0.0,
      shadowknight: 0.0, druid: 0.0, monk: 0.0, bard: 0.0,
      rogue: 0.0, shaman: 0.0, necromancer: 0.0, wizard: 0.45,
      magician: 0.40, enchanter: 0.0, beastlord: 0.0
    }
  },

  {
    id: 3567,
    name: "Tuyen's Chant of Disease",
    level: 42,
    instrument: 'percussion',
    category: 'dot',
    encounterTags: ['resist_debuff'],
    effects: [
      { type: 'HP', value: -31, moddable: true  },
      { type: 'DR',        value: -17, moddable: false, label: 'DR debuff' }
    ],
    classWeights: {
      warrior: 0.0, cleric: 0.0, paladin: 0.0, ranger: 0.0,
      shadowknight: 0.0, druid: 0.0, monk: 0.0, bard: 0.0,
      rogue: 0.0, shaman: 0.0, necromancer: 0.35, wizard: 0.0,
      magician: 0.0, enchanter: 0.0, beastlord: 0.0
    }
  },

  {
    id: 742,
    name: "Denon's Desperate Dirge",
    level: 43,
    instrument: 'singing',
    category: 'dot_ae',
    soloOnly: true,
    effects: [
      { type: 'HP', value: -485, moddable: true }
    ],
    classWeights: {
      warrior: 0.0, cleric: 0.0, paladin: 0.0, ranger: 0.0,
      shadowknight: 0.0, druid: 0.0, monk: 0.0, bard: 1.0,
      rogue: 0.0, shaman: 0.0, necromancer: 0.0, wizard: 0.0,
      magician: 0.0, enchanter: 0.0, beastlord: 0.0
    }
  },

  {
    id: 744,
    name: "Tuyen's Chant of Frost",
    level: 46,
    instrument: 'percussion',
    category: 'dot',
    encounterTags: ['resist_debuff'],
    effects: [
      { type: 'HP', value: -31, moddable: true  },
      { type: 'CR',        value: -17, moddable: false, label: 'CR debuff' }
    ],
    classWeights: {
      warrior: 0.0, cleric: 0.0, paladin: 0.0, ranger: 0.0,
      shadowknight: 0.0, druid: 0.0, monk: 0.0, bard: 0.0,
      rogue: 0.0, shaman: 0.0, necromancer: 0.0, wizard: 0.45,
      magician: 0.0, enchanter: 0.0, beastlord: 0.0
    }
  },

  {
    id: 3566,
    name: "Tuyen's Chant of Poison",
    level: 50,
    instrument: 'percussion',
    category: 'dot',
    encounterTags: ['resist_debuff'],
    effects: [
      { type: 'HP', value: -31, moddable: true  },
      { type: 'PR',        value: -17, moddable: false, label: 'PR debuff' }
    ],
    classWeights: {
      warrior: 0.0, cleric: 0.0, paladin: 0.0, ranger: 0.0,
      shadowknight: 0.0, druid: 0.0, monk: 0.0, bard: 0.0,
      rogue: 0.0, shaman: 0.0, necromancer: 0.35, wizard: 0.0,
      magician: 0.0, enchanter: 0.0, beastlord: 0.0
    }
  },

  {
    id: 1451,
    name: "Occlusion of Sound",
    level: 55,
    instrument: 'percussion',
    category: 'resist_debuff',
    encounterTags: ['resist_debuff'],
    effects: [
      { type: 'CR', value: -10, moddable: false },
      { type: 'FR', value: -10, moddable: false },
      { type: 'MR', value: -10, moddable: false }
    ],
    classWeights: {
      warrior: 0.0, cleric: 0.0, paladin: 0.0, ranger: 0.0,
      shadowknight: 0.0, druid: 0.0, monk: 0.0, bard: 0.0,
      rogue: 0.0, shaman: 0.0, necromancer: 0.30, wizard: 0.40,
      magician: 0.40, enchanter: 0.30, beastlord: 0.0
    }
  },

  {
    id: 1764,
    name: "Denon's Bereavement",
    level: 59,
    instrument: 'stringed',
    category: 'dot_ae',
    encounterTags: ['resist_debuff'],
    effects: [
      { type: 'HP', value: -30, moddable: false },
      { type: 'MR',        value: -15, moddable: false, label: 'MR debuff' }
    ],
    classWeights: {
      warrior: 0.0, cleric: 0.0, paladin: 0.0, ranger: 0.0,
      shadowknight: 0.0, druid: 0.0, monk: 0.0, bard: 0.0,
      rogue: 0.0, shaman: 0.0, necromancer: 0.30, wizard: 0.40,
      magician: 0.40, enchanter: 0.30, beastlord: 0.0
    }
  }

];
