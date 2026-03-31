# Melody Recommender Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive melody recommender tool that takes group composition, encounter conditions, and bard gear as inputs and outputs an optimal 4-song bard melody with scoring.

**Architecture:** Single-page app at `/tools/melody/` with three files. `songs.js` holds song data and class weight config (the tunable file). `melody.js` holds the scoring algorithm and UI logic. `index.html` has the page structure and styling. All state lives in the DOM — no framework, just jQuery event handlers that recompute on input change.

**Tech Stack:** HTML5, CSS3 (Tavern Hearth theme variables from `/css/style.css`), jQuery 3.7.1 (CDN), vanilla JS. No build step. Static files for Cloudflare Pages.

**Reference files:**
- Design spec: `docs/superpowers/specs/2026-03-31-melody-recommender-design.md`
- Site CSS: `css/style.css` (all theme variables defined there)
- Nav partial: `partials/nav.html` (loaded via jQuery)
- JS patterns: `js/main.js` (existing jQuery patterns)
- Song data extraction: `bard_songs_data.json` (raw Quarm database extraction)

---

### Task 1: Create Song Database Config (`songs.js`)

**Files:**
- Create: `tools/melody/songs.js`

This is the core data file the site owner edits to tune weights. It exports three objects: `SONGS` (melody candidates), `CLASSES` (class metadata), and `INSTRUMENTS` (item modifier values).

- [ ] **Step 1: Create the CLASSES config**

Create `tools/melody/songs.js` with the class definitions and type tags:

```js
// ============================================================
// Melody Recommender — Song Database & Class Weight Config
// Edit class weights per song to tune recommendations.
// ============================================================

var CLASSES = [
  { id: 'warrior',     name: 'Warrior',     type: ['melee', 'tank', 'warrior-tank'] },
  { id: 'cleric',      name: 'Cleric',      type: ['healer', 'caster'] },
  { id: 'paladin',     name: 'Paladin',     type: ['tank', 'hybrid', 'melee'] },
  { id: 'ranger',      name: 'Ranger',      type: ['melee', 'hybrid'] },
  { id: 'shadowknight',name: 'Shadowknight',type: ['tank', 'hybrid', 'melee'] },
  { id: 'druid',       name: 'Druid',       type: ['healer', 'caster'] },
  { id: 'monk',        name: 'Monk',        type: ['melee'] },
  { id: 'bard',        name: 'Bard',        type: ['melee', 'hybrid'] },
  { id: 'rogue',       name: 'Rogue',       type: ['melee'] },
  { id: 'shaman',      name: 'Shaman',      type: ['healer', 'caster', 'slower'] },
  { id: 'necromancer', name: 'Necromancer',  type: ['caster'] },
  { id: 'wizard',      name: 'Wizard',      type: ['caster'] },
  { id: 'magician',    name: 'Magician',    type: ['caster'] },
  { id: 'enchanter',   name: 'Enchanter',   type: ['caster', 'slower', 'haster'] },
  { id: 'beastlord',   name: 'Beastlord',   type: ['melee', 'hybrid', 'slower'] }
];
```

- [ ] **Step 2: Create the INSTRUMENTS config**

Append the instrument modifier data below CLASSES in the same file. Values sourced from Quarm codebase `client_mods.cpp:GetInstrumentMod()`. Each item's value is the raw mod bonus (added to base 10).

```js
var INSTRUMENTS = {
  percussion: {
    none:           { name: 'None',             mod: 0 },
    combine:        { name: 'Combine',          mod: 10 },
    selos:          { name: "Selo's Drums",     mod: 18 },
    drum_of_beast:  { name: 'Drum of the Beast',mod: 24 }
  },
  stringed: {
    none:     { name: 'None',            mod: 0 },
    combine:  { name: 'Combine',         mod: 10 },
    kelin:    { name: "Kelin's Lute",    mod: 18 },
    lyran:    { name: "Lyran's Lute",    mod: 24 }
  },
  brass: {
    none:       { name: 'None',              mod: 0 },
    combine:    { name: 'Combine',           mod: 10 },
    mcvax:      { name: "McVaxius' Horn",    mod: 18 },
    immaculate: { name: 'Immaculate Horn',   mod: 22 },
    denon:      { name: "Denon's Horn",      mod: 24 }
  },
  wind: {
    none:    { name: 'None',            mod: 0 },
    combine: { name: 'Combine',         mod: 10 },
    pipes:   { name: 'Pipes of Insight',mod: 18 },
    mahlin:  { name: "Mahlin's Flute",  mod: 24 }
  }
};

// AA modifier values (per rank)
var AA_MODS = {
  instrument_mastery: [0, 1, 2, 3],  // adds to all instrument types
  singing_mastery:    [0, 1, 2, 3],  // adds to singing
  jam_fest:           [0, 1, 2, 3]   // adds to effective casting level
};

// Clicky singing bonuses (SE_Amplification values)
var SINGING_CLICKIES = {
  none:  { name: 'None',              mod: 0 },
  vots:  { name: 'Voice of the Serpent (Resonance)', mod: 6 },
  shei:  { name: 'Shadowsong Cloak (Harmonize)',     mod: 9 }
};

// Instrument modifier soft cap
var INSTRUMENT_SOFT_CAP = 36;
```

- [ ] **Step 3: Create the SONGS array — haste and overhaste songs**

Append the song definitions. Each song has: id, name, level, instrument skill, buff category (for slot conflict detection), effects array with lv60 base values and moddable flag, and a `classWeights` object with 0.00-1.00 per class.

```js
// Buff categories — songs in the same category conflict (only pick one per melody)
// 'haste_v1v2', 'overhaste_v3', 'slow', 'mana_regen', 'hp_mana_regen',
// 'resist_fire', 'resist_cold', 'resist_poison', 'resist_disease', 'resist_magic',
// 'resist_multi_elem', 'resist_multi_purify', 'resist_all', 'ac_def', 'dot', 'dot_ae'

var SONGS = [
  // === v3 OVERHASTE (bard-exclusive) ===
  {
    id: 2606, name: 'Battlecry of the Vah Shir', level: 52, instrument: 'brass',
    category: 'overhaste_v3',
    effects: [
      { type: 'AttackSpeed3', value: 15, moddable: false }
    ],
    classWeights: {
      warrior: 0.95, cleric: 0.0, paladin: 0.15, ranger: 0.60,
      shadowknight: 0.15, druid: 0.0, monk: 0.85, bard: 0.50,
      rogue: 0.90, shaman: 0.0, necromancer: 0.0, wizard: 0.0,
      magician: 0.0, enchanter: 0.0, beastlord: 0.65
    }
  },
  {
    id: 2610, name: 'Warsong of the Vah Shir', level: 60, instrument: 'brass',
    category: 'overhaste_v3',
    effects: [
      { type: 'AttackSpeed3', value: 25, moddable: false }
    ],
    classWeights: {
      warrior: 0.95, cleric: 0.0, paladin: 0.15, ranger: 0.60,
      shadowknight: 0.15, druid: 0.0, monk: 0.85, bard: 0.50,
      rogue: 0.90, shaman: 0.0, necromancer: 0.0, wizard: 0.0,
      magician: 0.0, enchanter: 0.0, beastlord: 0.65
    }
  },

  // === v1/v2 HASTE (conditional — eliminated if external haste present) ===
  {
    id: 701, name: 'Anthem de Arms', level: 10, instrument: 'singing',
    category: 'haste_v1v2',
    eliminateIf: ['haster'],
    effects: [
      { type: 'AttackSpeed', value: 110, moddable: false },
      { type: 'STR', value: 35, moddable: true }
    ],
    classWeights: {
      warrior: 0.70, cleric: 0.05, paladin: 0.40, ranger: 0.55,
      shadowknight: 0.40, druid: 0.05, monk: 0.65, bard: 0.40,
      rogue: 0.65, shaman: 0.10, necromancer: 0.0, wizard: 0.0,
      magician: 0.0, enchanter: 0.0, beastlord: 0.55
    }
  },
  {
    id: 740, name: "Vilia's Verses of Celerity", level: 36, instrument: 'singing',
    category: 'haste_v1v2',
    eliminateIf: ['haster'],
    effects: [
      { type: 'AttackSpeed', value: 120, moddable: false },
      { type: 'AGI', value: 35, moddable: true },
      { type: 'ArmorClass', value: 31, moddable: true }
    ],
    classWeights: {
      warrior: 0.75, cleric: 0.05, paladin: 0.45, ranger: 0.60,
      shadowknight: 0.45, druid: 0.05, monk: 0.70, bard: 0.45,
      rogue: 0.70, shaman: 0.10, necromancer: 0.0, wizard: 0.0,
      magician: 0.0, enchanter: 0.0, beastlord: 0.60
    }
  },
  {
    id: 702, name: "McVaxius' Berserker Crescendo", level: 42, instrument: 'brass',
    category: 'haste_v1v2',
    eliminateIf: ['haster'],
    effects: [
      { type: 'AttackSpeed', value: 123, moddable: false },
      { type: 'STR', value: 21, moddable: true },
      { type: 'ArmorClass', value: 31, moddable: true }
    ],
    classWeights: {
      warrior: 0.80, cleric: 0.05, paladin: 0.50, ranger: 0.65,
      shadowknight: 0.50, druid: 0.05, monk: 0.75, bard: 0.50,
      rogue: 0.75, shaman: 0.10, necromancer: 0.0, wizard: 0.0,
      magician: 0.0, enchanter: 0.0, beastlord: 0.65
    }
  },
  {
    id: 747, name: 'Verses of Victory', level: 50, instrument: 'singing',
    category: 'haste_v1v2',
    eliminateIf: ['haster'],
    effects: [
      { type: 'AttackSpeed', value: 130, moddable: false },
      { type: 'AGI', value: 30, moddable: false },
      { type: 'ArmorClass', value: 50, moddable: false },
      { type: 'STR', value: 30, moddable: false }
    ],
    classWeights: {
      warrior: 0.80, cleric: 0.10, paladin: 0.50, ranger: 0.65,
      shadowknight: 0.50, druid: 0.05, monk: 0.75, bard: 0.50,
      rogue: 0.75, shaman: 0.10, necromancer: 0.0, wizard: 0.0,
      magician: 0.0, enchanter: 0.0, beastlord: 0.65
    }
  },
  {
    id: 1757, name: "Vilia's Chorus of Celerity", level: 54, instrument: 'singing',
    category: 'haste_v1v2',
    eliminateIf: ['haster'],
    effects: [
      { type: 'AttackSpeed', value: 145, moddable: false }
    ],
    classWeights: {
      warrior: 0.85, cleric: 0.05, paladin: 0.50, ranger: 0.65,
      shadowknight: 0.50, druid: 0.05, monk: 0.80, bard: 0.50,
      rogue: 0.80, shaman: 0.10, necromancer: 0.0, wizard: 0.0,
      magician: 0.0, enchanter: 0.0, beastlord: 0.65
    }
  },
  {
    id: 1760, name: "McVaxius' Rousing Rondo", level: 57, instrument: 'brass',
    category: 'atk_ds',
    // NOTE: NOT in haste_v1v2 category because ATK+DS riders are the primary value
    effects: [
      { type: 'AttackSpeed', value: 120, moddable: false },
      { type: 'STR', value: 21, moddable: true },
      { type: 'ATK', value: 12, moddable: true },
      { type: 'DamageShield', value: 8, moddable: true }
    ],
    classWeights: {
      warrior: 0.90, cleric: 0.05, paladin: 0.50, ranger: 0.70,
      shadowknight: 0.50, druid: 0.05, monk: 0.85, bard: 0.55,
      rogue: 0.85, shaman: 0.10, necromancer: 0.0, wizard: 0.0,
      magician: 0.0, enchanter: 0.0, beastlord: 0.70
    }
  },

  // === v2 OVERHASTE (conditional — eliminated if external v2 present) ===
  {
    id: 1449, name: 'Melody of Ervaj', level: 50, instrument: 'brass',
    category: 'haste_v1v2',
    eliminateIf: ['haster'],
    effects: [
      { type: 'AttackSpeed2', value: 105, moddable: false },
      { type: 'ArmorClass', value: 21, moddable: true }
    ],
    classWeights: {
      warrior: 0.75, cleric: 0.05, paladin: 0.40, ranger: 0.55,
      shadowknight: 0.40, druid: 0.05, monk: 0.70, bard: 0.45,
      rogue: 0.70, shaman: 0.05, necromancer: 0.0, wizard: 0.0,
      magician: 0.0, enchanter: 0.0, beastlord: 0.55
    }
  },
  {
    id: 1452, name: 'Composition of Ervaj', level: 60, instrument: 'brass',
    category: 'haste_v1v2',
    eliminateIf: ['haster'],
    effects: [
      { type: 'AttackSpeed2', value: 110, moddable: false },
      { type: 'ArmorClass', value: 30, moddable: true }
    ],
    classWeights: {
      warrior: 0.80, cleric: 0.05, paladin: 0.45, ranger: 0.60,
      shadowknight: 0.45, druid: 0.05, monk: 0.75, bard: 0.50,
      rogue: 0.75, shaman: 0.05, necromancer: 0.0, wizard: 0.0,
      magician: 0.0, enchanter: 0.0, beastlord: 0.60
    }
  },

  // === MANA / HP REGEN ===
  {
    id: 7, name: 'Hymn of Restoration', level: 6, instrument: 'stringed',
    category: 'hp_regen',
    effects: [
      { type: 'CurrentHP', value: 11, moddable: true }
    ],
    classWeights: {
      warrior: 0.50, cleric: 0.30, paladin: 0.45, ranger: 0.45,
      shadowknight: 0.45, druid: 0.30, monk: 0.50, bard: 0.40,
      rogue: 0.50, shaman: 0.30, necromancer: 0.20, wizard: 0.20,
      magician: 0.20, enchanter: 0.20, beastlord: 0.45
    }
  },
  {
    id: 1287, name: "Cassindra's Chant of Clarity", level: 20, instrument: 'singing',
    category: 'mana_regen',
    effects: [
      { type: 'CurrentMana', value: 2, moddable: false }
    ],
    classWeights: {
      warrior: 0.0, cleric: 0.70, paladin: 0.40, ranger: 0.30,
      shadowknight: 0.40, druid: 0.70, monk: 0.0, bard: 0.15,
      rogue: 0.0, shaman: 0.70, necromancer: 0.80, wizard: 0.85,
      magician: 0.85, enchanter: 0.80, beastlord: 0.40
    }
  },
  {
    id: 723, name: "Cassindra's Chorus of Clarity", level: 32, instrument: 'singing',
    category: 'mana_regen',
    effects: [
      { type: 'CurrentMana', value: 7, moddable: false }
    ],
    classWeights: {
      warrior: 0.0, cleric: 0.75, paladin: 0.45, ranger: 0.35,
      shadowknight: 0.45, druid: 0.75, monk: 0.0, bard: 0.20,
      rogue: 0.0, shaman: 0.75, necromancer: 0.85, wizard: 0.90,
      magician: 0.90, enchanter: 0.85, beastlord: 0.45
    }
  },
  {
    id: 1448, name: 'Cantata of Soothing', level: 34, instrument: 'stringed',
    category: 'hp_mana_regen',
    effects: [
      { type: 'CurrentHP', value: 4, moddable: true },
      { type: 'CurrentMana', value: 5, moddable: true }
    ],
    classWeights: {
      warrior: 0.15, cleric: 0.70, paladin: 0.55, ranger: 0.45,
      shadowknight: 0.55, druid: 0.70, monk: 0.15, bard: 0.30,
      rogue: 0.15, shaman: 0.70, necromancer: 0.75, wizard: 0.80,
      magician: 0.80, enchanter: 0.75, beastlord: 0.50
    }
  },
  {
    id: 1759, name: 'Cantata of Replenishment', level: 55, instrument: 'stringed',
    category: 'hp_mana_regen',
    effects: [
      { type: 'CurrentHP', value: 12, moddable: true },
      { type: 'CurrentMana', value: 11, moddable: true }
    ],
    classWeights: {
      warrior: 0.20, cleric: 0.80, paladin: 0.60, ranger: 0.50,
      shadowknight: 0.60, druid: 0.80, monk: 0.20, bard: 0.35,
      rogue: 0.20, shaman: 0.80, necromancer: 0.85, wizard: 0.90,
      magician: 0.90, enchanter: 0.85, beastlord: 0.55
    }
  },
  // Raid AE versions
  {
    id: 2609, name: 'Chorus of Replenishment', level: 58, instrument: 'stringed',
    category: 'hp_mana_regen', raidOnly: true,
    effects: [
      { type: 'CurrentHP', value: 12, moddable: true },
      { type: 'CurrentMana', value: 11, moddable: true }
    ],
    classWeights: {
      warrior: 0.20, cleric: 0.80, paladin: 0.60, ranger: 0.50,
      shadowknight: 0.60, druid: 0.80, monk: 0.20, bard: 0.35,
      rogue: 0.20, shaman: 0.80, necromancer: 0.85, wizard: 0.90,
      magician: 0.90, enchanter: 0.85, beastlord: 0.55
    }
  },
  {
    id: 1196, name: "Ancient: Lcea's Lament", level: 60, instrument: 'stringed',
    category: 'hp_mana_regen', raidOnly: true,
    effects: [
      { type: 'CurrentHP', value: 16, moddable: true },
      { type: 'CurrentMana', value: 15, moddable: true }
    ],
    classWeights: {
      warrior: 0.25, cleric: 0.85, paladin: 0.65, ranger: 0.55,
      shadowknight: 0.65, druid: 0.85, monk: 0.25, bard: 0.40,
      rogue: 0.25, shaman: 0.85, necromancer: 0.90, wizard: 0.95,
      magician: 0.95, enchanter: 0.90, beastlord: 0.60
    }
  },

  // === RESIST + DAMAGE SHIELD ===
  {
    id: 710, name: 'Elemental Rhythms', level: 9, instrument: 'percussion',
    category: 'resist_multi_elem',
    encounterTags: ['fire', 'cold', 'magic'],
    effects: [
      { type: 'ResistMagic', value: 35, moddable: true },
      { type: 'ResistCold', value: 35, moddable: true },
      { type: 'ResistFire', value: 35, moddable: true },
      { type: 'ArmorClass', value: 20, moddable: true }
    ],
    classWeights: {
      warrior: 0.50, cleric: 0.50, paladin: 0.50, ranger: 0.50,
      shadowknight: 0.50, druid: 0.50, monk: 0.50, bard: 0.50,
      rogue: 0.50, shaman: 0.50, necromancer: 0.50, wizard: 0.50,
      magician: 0.50, enchanter: 0.50, beastlord: 0.50
    }
  },
  {
    id: 711, name: 'Purifying Rhythms', level: 13, instrument: 'percussion',
    category: 'resist_multi_purify',
    encounterTags: ['poison', 'disease', 'magic'],
    effects: [
      { type: 'ResistMagic', value: 35, moddable: true },
      { type: 'ResistPoison', value: 35, moddable: true },
      { type: 'ResistDisease', value: 35, moddable: true },
      { type: 'ArmorClass', value: 20, moddable: true }
    ],
    classWeights: {
      warrior: 0.50, cleric: 0.50, paladin: 0.50, ranger: 0.50,
      shadowknight: 0.50, druid: 0.50, monk: 0.50, bard: 0.50,
      rogue: 0.50, shaman: 0.50, necromancer: 0.50, wizard: 0.50,
      magician: 0.50, enchanter: 0.50, beastlord: 0.50
    }
  },
  {
    id: 709, name: 'Guardian Rhythms', level: 17, instrument: 'percussion',
    category: 'ac_def',
    effects: [
      { type: 'ArmorClass', value: 35, moddable: true },
      { type: 'ResistMagic', value: 35, moddable: true }
    ],
    classWeights: {
      warrior: 0.55, cleric: 0.30, paladin: 0.50, ranger: 0.35,
      shadowknight: 0.50, druid: 0.30, monk: 0.45, bard: 0.35,
      rogue: 0.40, shaman: 0.30, necromancer: 0.25, wizard: 0.25,
      magician: 0.25, enchanter: 0.25, beastlord: 0.40
    }
  },
  {
    id: 712, name: 'Psalm of Warmth', level: 25, instrument: 'singing',
    category: 'resist_cold',
    encounterTags: ['cold'],
    effects: [
      { type: 'DamageShield', value: 11, moddable: true },
      { type: 'ResistCold', value: 70, moddable: true },
      { type: 'ArmorClass', value: 20, moddable: true }
    ],
    classWeights: {
      warrior: 0.55, cleric: 0.45, paladin: 0.50, ranger: 0.45,
      shadowknight: 0.50, druid: 0.45, monk: 0.50, bard: 0.45,
      rogue: 0.50, shaman: 0.45, necromancer: 0.40, wizard: 0.40,
      magician: 0.40, enchanter: 0.40, beastlord: 0.50
    }
  },
  {
    id: 715, name: 'Psalm of Vitality', level: 29, instrument: 'singing',
    category: 'resist_disease',
    encounterTags: ['disease'],
    effects: [
      { type: 'DamageShield', value: 11, moddable: true },
      { type: 'ResistDisease', value: 70, moddable: true },
      { type: 'ArmorClass', value: 20, moddable: true }
    ],
    classWeights: {
      warrior: 0.55, cleric: 0.45, paladin: 0.50, ranger: 0.45,
      shadowknight: 0.50, druid: 0.45, monk: 0.50, bard: 0.45,
      rogue: 0.50, shaman: 0.45, necromancer: 0.40, wizard: 0.40,
      magician: 0.40, enchanter: 0.40, beastlord: 0.50
    }
  },
  {
    id: 713, name: 'Psalm of Cooling', level: 33, instrument: 'singing',
    category: 'resist_fire',
    encounterTags: ['fire'],
    effects: [
      { type: 'DamageShield', value: 11, moddable: true },
      { type: 'ResistFire', value: 70, moddable: true },
      { type: 'ArmorClass', value: 20, moddable: true }
    ],
    classWeights: {
      warrior: 0.55, cleric: 0.45, paladin: 0.50, ranger: 0.45,
      shadowknight: 0.50, druid: 0.45, monk: 0.50, bard: 0.45,
      rogue: 0.50, shaman: 0.45, necromancer: 0.40, wizard: 0.40,
      magician: 0.40, enchanter: 0.40, beastlord: 0.50
    }
  },
  {
    id: 716, name: 'Psalm of Purity', level: 37, instrument: 'singing',
    category: 'resist_poison',
    encounterTags: ['poison'],
    effects: [
      { type: 'DamageShield', value: 11, moddable: true },
      { type: 'ResistPoison', value: 70, moddable: true },
      { type: 'ArmorClass', value: 20, moddable: true }
    ],
    classWeights: {
      warrior: 0.55, cleric: 0.45, paladin: 0.50, ranger: 0.45,
      shadowknight: 0.50, druid: 0.45, monk: 0.50, bard: 0.45,
      rogue: 0.50, shaman: 0.45, necromancer: 0.40, wizard: 0.40,
      magician: 0.40, enchanter: 0.40, beastlord: 0.50
    }
  },
  {
    id: 714, name: 'Psalm of Mystic Shielding', level: 41, instrument: 'singing',
    category: 'resist_magic',
    encounterTags: ['magic'],
    effects: [
      { type: 'ResistMagic', value: 70, moddable: true },
      { type: 'AbsorbMagicAtt', value: 15, moddable: true },
      { type: 'CurrentHP', value: 5, moddable: false },
      { type: 'ArmorClass', value: 20, moddable: true }
    ],
    classWeights: {
      warrior: 0.55, cleric: 0.50, paladin: 0.50, ranger: 0.50,
      shadowknight: 0.50, druid: 0.50, monk: 0.50, bard: 0.50,
      rogue: 0.50, shaman: 0.50, necromancer: 0.45, wizard: 0.45,
      magician: 0.45, enchanter: 0.45, beastlord: 0.50
    }
  },
  // Raid AE resist
  {
    id: 2607, name: 'Elemental Chorus', level: 54, instrument: 'percussion',
    category: 'resist_multi_elem', raidOnly: true,
    encounterTags: ['fire', 'cold', 'magic'],
    effects: [
      { type: 'ResistMagic', value: 45, moddable: true },
      { type: 'ResistCold', value: 45, moddable: true },
      { type: 'ResistFire', value: 45, moddable: true },
      { type: 'ArmorClass', value: 4, moddable: false }
    ],
    classWeights: {
      warrior: 0.50, cleric: 0.50, paladin: 0.50, ranger: 0.50,
      shadowknight: 0.50, druid: 0.50, monk: 0.50, bard: 0.50,
      rogue: 0.50, shaman: 0.50, necromancer: 0.50, wizard: 0.50,
      magician: 0.50, enchanter: 0.50, beastlord: 0.50
    }
  },
  {
    id: 2608, name: 'Purifying Chorus', level: 56, instrument: 'percussion',
    category: 'resist_multi_purify', raidOnly: true,
    encounterTags: ['poison', 'disease', 'magic'],
    effects: [
      { type: 'ResistMagic', value: 45, moddable: true },
      { type: 'ResistPoison', value: 45, moddable: true },
      { type: 'ResistDisease', value: 45, moddable: true },
      { type: 'ArmorClass', value: 4, moddable: false }
    ],
    classWeights: {
      warrior: 0.50, cleric: 0.50, paladin: 0.50, ranger: 0.50,
      shadowknight: 0.50, druid: 0.50, monk: 0.50, bard: 0.50,
      rogue: 0.50, shaman: 0.50, necromancer: 0.50, wizard: 0.50,
      magician: 0.50, enchanter: 0.50, beastlord: 0.50
    }
  },

  // === AC / DEFENSIVE ===
  {
    id: 700, name: 'Chant of Battle', level: 1, instrument: 'percussion',
    category: 'ac_def',
    effects: [
      { type: 'ArmorClass', value: 20, moddable: true },
      { type: 'STR', value: 20, moddable: true },
      { type: 'DEX', value: 20, moddable: true }
    ],
    classWeights: {
      warrior: 0.40, cleric: 0.15, paladin: 0.35, ranger: 0.35,
      shadowknight: 0.35, druid: 0.15, monk: 0.40, bard: 0.30,
      rogue: 0.40, shaman: 0.15, necromancer: 0.05, wizard: 0.05,
      magician: 0.05, enchanter: 0.05, beastlord: 0.35
    }
  },
  {
    id: 748, name: "Niv's Melody of Preservation", level: 47, instrument: 'stringed',
    category: 'ac_def',
    effects: [
      { type: 'STR', value: 10, moddable: false },
      { type: 'AbsorbMagicAtt', value: 10, moddable: true },
      { type: 'CurrentHP', value: 8, moddable: true }
    ],
    classWeights: {
      warrior: 0.40, cleric: 0.25, paladin: 0.35, ranger: 0.30,
      shadowknight: 0.35, druid: 0.25, monk: 0.35, bard: 0.30,
      rogue: 0.35, shaman: 0.25, necromancer: 0.20, wizard: 0.20,
      magician: 0.20, enchanter: 0.20, beastlord: 0.30
    }
  },
  {
    id: 1450, name: 'Shield of Songs', level: 49, instrument: 'stringed',
    category: 'ac_def',
    effects: [
      { type: 'Rune', value: 20, moddable: true },
      { type: 'AbsorbMagicAtt', value: 20, moddable: true }
    ],
    classWeights: {
      warrior: 0.50, cleric: 0.30, paladin: 0.45, ranger: 0.35,
      shadowknight: 0.45, druid: 0.30, monk: 0.40, bard: 0.35,
      rogue: 0.40, shaman: 0.30, necromancer: 0.25, wizard: 0.25,
      magician: 0.25, enchanter: 0.25, beastlord: 0.35
    }
  },
  {
    id: 1763, name: "Niv's Harmonic", level: 58, instrument: 'singing',
    category: 'ac_def',
    effects: [
      { type: 'AbsorbMagicAtt', value: 10, moddable: false },
      { type: 'ArmorClass', value: 80, moddable: false }
    ],
    classWeights: {
      warrior: 0.35, cleric: 0.15, paladin: 0.30, ranger: 0.20,
      shadowknight: 0.30, druid: 0.15, monk: 0.30, bard: 0.20,
      rogue: 0.25, shaman: 0.15, necromancer: 0.10, wizard: 0.10,
      magician: 0.10, enchanter: 0.10, beastlord: 0.25
    }
  },

  // === SLOW ===
  {
    id: 705, name: "Largo's Melodic Binding", level: 20, instrument: 'singing',
    category: 'slow',
    eliminateIf: ['slower'],
    encounterTags: ['slow'],
    effects: [
      { type: 'AttackSpeed', value: 65, moddable: false, label: '35% slow' },
      { type: 'ArmorClass', value: -35, moddable: true, label: 'AC debuff' }
    ],
    classWeights: {
      warrior: 0.70, cleric: 0.50, paladin: 0.60, ranger: 0.50,
      shadowknight: 0.60, druid: 0.50, monk: 0.60, bard: 0.50,
      rogue: 0.55, shaman: 0.0, necromancer: 0.40, wizard: 0.40,
      magician: 0.40, enchanter: 0.0, beastlord: 0.50
    }
  },
  {
    id: 738, name: "Selo's Consonant Chain", level: 23, instrument: 'singing',
    category: 'slow',
    eliminateIf: ['slower'],
    encounterTags: ['slow'],
    effects: [
      { type: 'AttackSpeed', value: 60, moddable: false, label: '40% slow' },
      { type: 'MovementSpeed', value: -90, moddable: false, label: 'Snare' }
    ],
    classWeights: {
      warrior: 0.70, cleric: 0.50, paladin: 0.60, ranger: 0.50,
      shadowknight: 0.60, druid: 0.50, monk: 0.60, bard: 0.50,
      rogue: 0.55, shaman: 0.0, necromancer: 0.40, wizard: 0.40,
      magician: 0.40, enchanter: 0.0, beastlord: 0.50
    }
  },
  {
    id: 746, name: "Selo's Chords of Cessation", level: 48, instrument: 'stringed',
    category: 'slow',
    eliminateIf: ['slower'],
    encounterTags: ['slow'],
    effects: [
      { type: 'AttackSpeed', value: 75, moddable: false, label: '25% slow' },
      { type: 'CurrentHP', value: -32, moddable: true, label: 'DoT' }
    ],
    classWeights: {
      warrior: 0.60, cleric: 0.45, paladin: 0.55, ranger: 0.45,
      shadowknight: 0.55, druid: 0.45, monk: 0.55, bard: 0.45,
      rogue: 0.50, shaman: 0.0, necromancer: 0.35, wizard: 0.35,
      magician: 0.35, enchanter: 0.0, beastlord: 0.45
    }
  },
  {
    id: 1751, name: "Largo's Absonant Binding", level: 51, instrument: 'singing',
    category: 'slow',
    eliminateIf: ['slower'],
    encounterTags: ['slow'],
    effects: [
      { type: 'AttackSpeed', value: 65, moddable: false, label: '35% slow' },
      { type: 'ArmorClass', value: -61, moddable: true, label: 'AC debuff' },
      { type: 'MovementSpeed', value: -61, moddable: false, label: 'Snare' },
      { type: 'AGI', value: -50, moddable: true, label: 'AGI debuff' }
    ],
    classWeights: {
      warrior: 0.75, cleric: 0.50, paladin: 0.65, ranger: 0.55,
      shadowknight: 0.65, druid: 0.50, monk: 0.65, bard: 0.55,
      rogue: 0.60, shaman: 0.0, necromancer: 0.40, wizard: 0.40,
      magician: 0.40, enchanter: 0.0, beastlord: 0.55
    }
  },
  {
    id: 1758, name: "Selo's Assonant Strane", level: 54, instrument: 'stringed',
    category: 'slow',
    eliminateIf: ['slower'],
    encounterTags: ['slow'],
    effects: [
      { type: 'AttackSpeed', value: 60, moddable: false, label: '40% slow (AE)' },
      { type: 'MovementSpeed', value: -45, moddable: false, label: 'Snare' }
    ],
    classWeights: {
      warrior: 0.75, cleric: 0.50, paladin: 0.65, ranger: 0.55,
      shadowknight: 0.65, druid: 0.50, monk: 0.65, bard: 0.55,
      rogue: 0.60, shaman: 0.0, necromancer: 0.45, wizard: 0.45,
      magician: 0.45, enchanter: 0.0, beastlord: 0.55
    }
  },
  {
    id: 1748, name: "Angstlich's Assonance", level: 60, instrument: 'brass',
    category: 'slow',
    eliminateIf: ['slower'],
    encounterTags: ['slow'],
    effects: [
      { type: 'AttackSpeed', value: 60, moddable: false, label: '40% slow' },
      { type: 'CurrentHP', value: -25, moddable: true, label: 'DoT' }
    ],
    classWeights: {
      warrior: 0.75, cleric: 0.50, paladin: 0.65, ranger: 0.55,
      shadowknight: 0.65, druid: 0.50, monk: 0.65, bard: 0.55,
      rogue: 0.60, shaman: 0.0, necromancer: 0.45, wizard: 0.45,
      magician: 0.45, enchanter: 0.0, beastlord: 0.55
    }
  },

  // === DoTs + RESIST DEBUFFS ===
  {
    id: 703, name: 'Chords of Dissonance', level: 2, instrument: 'stringed',
    category: 'dot_ae', soloOnly: true,
    effects: [
      { type: 'CurrentHP', value: -17, moddable: true }
    ],
    classWeights: {
      warrior: 0.0, cleric: 0.0, paladin: 0.0, ranger: 0.0,
      shadowknight: 0.0, druid: 0.0, monk: 0.0, bard: 1.0,
      rogue: 0.0, shaman: 0.0, necromancer: 0.0, wizard: 0.0,
      magician: 0.0, enchanter: 0.0, beastlord: 0.0
    }
  },
  {
    id: 730, name: "Denon's Disruptive Discord", level: 18, instrument: 'brass',
    category: 'dot_ae', soloOnly: true,
    effects: [
      { type: 'CurrentHP', value: -19, moddable: true },
      { type: 'ArmorClass', value: -61, moddable: true }
    ],
    classWeights: {
      warrior: 0.0, cleric: 0.0, paladin: 0.0, ranger: 0.0,
      shadowknight: 0.0, druid: 0.0, monk: 0.0, bard: 1.0,
      rogue: 0.0, shaman: 0.0, necromancer: 0.0, wizard: 0.0,
      magician: 0.0, enchanter: 0.0, beastlord: 0.0
    }
  },
  {
    id: 707, name: "Fufil's Curtailing Chant", level: 30, instrument: 'percussion',
    category: 'dot',
    encounterTags: ['resist_debuff'],
    effects: [
      { type: 'CurrentHP', value: -21, moddable: true },
      { type: 'ResistMagic', value: -17, moddable: false, label: 'MR debuff' }
    ],
    classWeights: {
      warrior: 0.05, cleric: 0.05, paladin: 0.05, ranger: 0.05,
      shadowknight: 0.05, druid: 0.10, monk: 0.05, bard: 0.30,
      rogue: 0.05, shaman: 0.10, necromancer: 0.30, wizard: 0.40,
      magician: 0.40, enchanter: 0.30, beastlord: 0.10
    }
  },
  {
    id: 743, name: "Tuyen's Chant of Flame", level: 38, instrument: 'percussion',
    category: 'dot',
    encounterTags: ['resist_debuff'],
    effects: [
      { type: 'CurrentHP', value: -31, moddable: true },
      { type: 'ResistFire', value: -17, moddable: false, label: 'FR debuff' }
    ],
    classWeights: {
      warrior: 0.05, cleric: 0.05, paladin: 0.05, ranger: 0.05,
      shadowknight: 0.05, druid: 0.15, monk: 0.05, bard: 0.30,
      rogue: 0.05, shaman: 0.10, necromancer: 0.15, wizard: 0.45,
      magician: 0.40, enchanter: 0.15, beastlord: 0.10
    }
  },
  {
    id: 3567, name: "Tuyen's Chant of Disease", level: 42, instrument: 'percussion',
    category: 'dot',
    encounterTags: ['resist_debuff'],
    effects: [
      { type: 'CurrentHP', value: -31, moddable: true },
      { type: 'ResistDisease', value: -17, moddable: false, label: 'DR debuff' }
    ],
    classWeights: {
      warrior: 0.05, cleric: 0.05, paladin: 0.05, ranger: 0.05,
      shadowknight: 0.05, druid: 0.15, monk: 0.05, bard: 0.30,
      rogue: 0.05, shaman: 0.15, necromancer: 0.35, wizard: 0.15,
      magician: 0.15, enchanter: 0.15, beastlord: 0.10
    }
  },
  {
    id: 742, name: "Denon's Desperate Dirge", level: 43, instrument: 'singing',
    category: 'dot_ae', soloOnly: true,
    effects: [
      { type: 'CurrentHP', value: -485, moddable: true }
    ],
    classWeights: {
      warrior: 0.0, cleric: 0.0, paladin: 0.0, ranger: 0.0,
      shadowknight: 0.0, druid: 0.0, monk: 0.0, bard: 1.0,
      rogue: 0.0, shaman: 0.0, necromancer: 0.0, wizard: 0.0,
      magician: 0.0, enchanter: 0.0, beastlord: 0.0
    }
  },
  {
    id: 744, name: "Tuyen's Chant of Frost", level: 46, instrument: 'percussion',
    category: 'dot',
    encounterTags: ['resist_debuff'],
    effects: [
      { type: 'CurrentHP', value: -31, moddable: true },
      { type: 'ResistCold', value: -17, moddable: false, label: 'CR debuff' }
    ],
    classWeights: {
      warrior: 0.05, cleric: 0.05, paladin: 0.05, ranger: 0.05,
      shadowknight: 0.05, druid: 0.15, monk: 0.05, bard: 0.30,
      rogue: 0.05, shaman: 0.10, necromancer: 0.15, wizard: 0.45,
      magician: 0.20, enchanter: 0.15, beastlord: 0.10
    }
  },
  {
    id: 3566, name: "Tuyen's Chant of Poison", level: 50, instrument: 'percussion',
    category: 'dot',
    encounterTags: ['resist_debuff'],
    effects: [
      { type: 'CurrentHP', value: -31, moddable: true },
      { type: 'ResistPoison', value: -17, moddable: false, label: 'PR debuff' }
    ],
    classWeights: {
      warrior: 0.05, cleric: 0.05, paladin: 0.05, ranger: 0.05,
      shadowknight: 0.05, druid: 0.15, monk: 0.05, bard: 0.30,
      rogue: 0.05, shaman: 0.15, necromancer: 0.35, wizard: 0.15,
      magician: 0.15, enchanter: 0.15, beastlord: 0.10
    }
  },
  {
    id: 1451, name: 'Occlusion of Sound', level: 55, instrument: 'percussion',
    category: 'dot',
    encounterTags: ['resist_debuff'],
    effects: [
      { type: 'ResistCold', value: -10, moddable: false, label: 'CR debuff' },
      { type: 'ResistFire', value: -10, moddable: false, label: 'FR debuff' },
      { type: 'ResistMagic', value: -10, moddable: false, label: 'MR debuff' }
    ],
    classWeights: {
      warrior: 0.05, cleric: 0.05, paladin: 0.05, ranger: 0.05,
      shadowknight: 0.05, druid: 0.15, monk: 0.05, bard: 0.15,
      rogue: 0.05, shaman: 0.10, necromancer: 0.35, wizard: 0.45,
      magician: 0.45, enchanter: 0.30, beastlord: 0.10
    }
  },
  {
    id: 1764, name: "Denon's Bereavement", level: 59, instrument: 'stringed',
    category: 'dot_ae',
    encounterTags: ['resist_debuff'],
    effects: [
      { type: 'CurrentHP', value: -30, moddable: false },
      { type: 'ResistMagic', value: -15, moddable: false, label: 'MR debuff' }
    ],
    classWeights: {
      warrior: 0.05, cleric: 0.05, paladin: 0.05, ranger: 0.05,
      shadowknight: 0.05, druid: 0.15, monk: 0.05, bard: 0.30,
      rogue: 0.05, shaman: 0.10, necromancer: 0.35, wizard: 0.45,
      magician: 0.45, enchanter: 0.30, beastlord: 0.10
    }
  }
];
```

- [ ] **Step 4: Verify file loads without errors**

Open browser console and load `tools/melody/songs.js` via a script tag in a temp HTML file. Verify `SONGS.length`, `CLASSES.length`, and `INSTRUMENTS` are all accessible. Expected: SONGS has ~45 entries, CLASSES has 15, INSTRUMENTS has 4 instrument types.

- [ ] **Step 5: Commit**

```bash
git add tools/melody/songs.js
git commit -m "feat(melody): add song database and class weight config"
```

---

### Task 2: Create Page Structure (`index.html`)

**Files:**
- Create: `tools/melody/index.html`

- [ ] **Step 1: Create the HTML shell with page header**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Melody Recommender — Lyri Cal</title>
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <div id="nav-placeholder"></div>

  <div class="page-header">
    <span class="category-label">Tools</span>
    <h1>Melody Recommender</h1>
    <p class="subtitle">Build the optimal twist for your group, raid, or solo session.</p>
  </div>

  <div class="section-divider">
    <img src="/assets/divider.svg" alt="">
  </div>

  <div class="content" id="melody-app">
    <!-- Mode tabs -->
    <div class="mode-tabs">
      <button class="mode-tab active" data-mode="group">Group</button>
      <button class="mode-tab" data-mode="raid">Raid</button>
      <button class="mode-tab" data-mode="solo">Solo</button>
    </div>

    <!-- GROUP MODE -->
    <div class="mode-panel active" id="mode-group">
      <h3 class="section-title">Group Composition</h3>
      <div class="group-slots">
        <div class="group-slot">
          <label>Slot 1</label>
          <select class="class-select" data-slot="1">
            <option value="">Empty</option>
          </select>
        </div>
        <div class="group-slot">
          <label>Slot 2</label>
          <select class="class-select" data-slot="2">
            <option value="">Empty</option>
          </select>
        </div>
        <div class="group-slot">
          <label>Slot 3</label>
          <select class="class-select" data-slot="3">
            <option value="">Empty</option>
          </select>
        </div>
        <div class="group-slot">
          <label>Slot 4</label>
          <select class="class-select" data-slot="4">
            <option value="">Empty</option>
          </select>
        </div>
        <div class="group-slot">
          <label>Slot 5</label>
          <select class="class-select" data-slot="5">
            <option value="">Empty</option>
          </select>
        </div>
        <div class="group-slot group-slot--bard">
          <label>Slot 6</label>
          <select class="class-select" data-slot="6" disabled>
            <option value="bard" selected>Bard</option>
          </select>
        </div>
      </div>
    </div>

    <!-- RAID MODE -->
    <div class="mode-panel" id="mode-raid">
      <h3 class="section-title">Raid Composition</h3>
      <div class="raid-grid" id="raid-grid">
        <!-- Populated by JS from CLASSES -->
      </div>
      <div class="raid-role">
        <label>Bard's Role:</label>
        <select id="raid-role-select">
          <option value="tank">Tank Group</option>
          <option value="melee">Melee Group</option>
          <option value="caster">Caster Group</option>
        </select>
      </div>
    </div>

    <!-- SOLO MODE -->
    <div class="mode-panel" id="mode-solo">
      <h3 class="section-title">Solo Style</h3>
      <div class="solo-style">
        <button class="solo-btn active" data-style="kiting">Kiting</button>
        <button class="solo-btn" data-style="swarming">Swarming</button>
        <button class="solo-btn" data-style="charm">Charm</button>
      </div>
    </div>

    <!-- ENCOUNTER CONDITIONS -->
    <h3 class="section-title">Encounter Conditions</h3>
    <div class="encounter-panel">
      <div class="encounter-row">
        <label>Mob Damage Type:</label>
        <div class="dmg-type-toggles">
          <button class="dmg-toggle" data-dmg="fire">Fire</button>
          <button class="dmg-toggle" data-dmg="cold">Cold</button>
          <button class="dmg-toggle" data-dmg="poison">Poison</button>
          <button class="dmg-toggle" data-dmg="disease">Disease</button>
          <button class="dmg-toggle" data-dmg="magic">Magic</button>
        </div>
      </div>
      <div class="encounter-row">
        <label>Slow Needed:</label>
        <select id="slow-needed">
          <option value="auto">Auto</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>
      <div class="encounter-row">
        <label>Slow-Immune Mob:</label>
        <input type="checkbox" id="slow-immune" class="toggle-check">
      </div>
      <div class="encounter-row">
        <label>Resist Debuff Useful:</label>
        <input type="checkbox" id="resist-debuff" class="toggle-check">
      </div>
    </div>

    <!-- GEAR / MODIFIER PANEL -->
    <h3 class="section-title">Gear &amp; Modifiers</h3>
    <div class="gear-panel">
      <div class="gear-row">
        <div class="gear-group">
          <label>Epic</label>
          <input type="checkbox" id="gear-epic" class="toggle-check">
        </div>
        <div class="gear-group">
          <label>Amplification</label>
          <input type="checkbox" id="gear-amp" class="toggle-check">
        </div>
        <div class="gear-group">
          <label>Puretone</label>
          <input type="checkbox" id="gear-puretone" class="toggle-check">
        </div>
      </div>
      <div class="gear-row">
        <div class="gear-group">
          <label>Drums</label>
          <select id="gear-percussion"></select>
        </div>
        <div class="gear-group">
          <label>Stringed</label>
          <select id="gear-stringed"></select>
        </div>
        <div class="gear-group">
          <label>Brass</label>
          <select id="gear-brass"></select>
        </div>
        <div class="gear-group">
          <label>Wind</label>
          <select id="gear-wind"></select>
        </div>
      </div>
      <div class="gear-row">
        <div class="gear-group">
          <label>Instrument Mastery</label>
          <select id="aa-inst-mastery">
            <option value="0">0</option><option value="1">1</option>
            <option value="2">2</option><option value="3">3</option>
          </select>
        </div>
        <div class="gear-group">
          <label>Singing Mastery</label>
          <select id="aa-sing-mastery">
            <option value="0">0</option><option value="1">1</option>
            <option value="2">2</option><option value="3">3</option>
          </select>
        </div>
        <div class="gear-group">
          <label>Jam Fest</label>
          <select id="aa-jam-fest">
            <option value="0">0</option><option value="1">1</option>
            <option value="2">2</option><option value="3">3</option>
          </select>
        </div>
      </div>
      <div class="gear-row">
        <div class="gear-group">
          <label>Singing Clicky</label>
          <select id="gear-clicky"></select>
        </div>
      </div>

      <!-- Modifier Table -->
      <table class="mod-table" id="mod-table">
        <thead>
          <tr>
            <th>Skill</th><th>Item</th><th>AA</th><th>Amp</th><th>Total</th><th>Multiplier</th>
          </tr>
        </thead>
        <tbody>
          <tr data-skill="percussion"><td>Percussion</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
          <tr data-skill="stringed"><td>Stringed</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
          <tr data-skill="brass"><td>Brass</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
          <tr data-skill="wind"><td>Wind</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
          <tr data-skill="singing"><td>Singing</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
        </tbody>
      </table>
    </div>

    <!-- RESULTS -->
    <h3 class="section-title">Recommended Melody</h3>
    <div id="melody-results">
      <div class="results-empty">Select a group composition to see recommendations.</div>
    </div>

    <h3 class="section-title">Runner-Ups</h3>
    <div id="melody-runnerups">
      <div class="results-empty">—</div>
    </div>
  </div>

  <button class="back-to-top">↑ Top</button>

  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  <script src="/js/main.js"></script>
  <script src="/tools/melody/songs.js"></script>
  <script src="/tools/melody/melody.js"></script>
</body>
</html>
```

- [ ] **Step 2: Add tool-specific styles**

Add a `<style>` block inside the `<head>` of `index.html`, after the stylesheet link. This covers mode tabs, group slots, gear panel, modifier table, encounter conditions, results, and responsive rules. Use only existing CSS variables from the site theme.

```css
/* Mode tabs */
.mode-tabs { display: flex; gap: 0; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
.mode-tab { background: none; border: none; border-bottom: 2px solid transparent; color: var(--text-muted); font-size: 0.9rem; letter-spacing: 0.06em; padding: 0.6rem 1.5rem; cursor: pointer; transition: color 0.2s, border-color 0.2s; font-family: Georgia, serif; }
.mode-tab:hover { color: var(--accent); }
.mode-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
.mode-panel { display: none; }
.mode-panel.active { display: block; }

/* Group slots */
.group-slots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; }
.group-slot label { display: block; color: var(--text-muted); font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.3rem; }
.group-slot select, .gear-group select, .encounter-row select, #raid-role-select {
  width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 4px;
  color: var(--text); font-size: 0.85rem; padding: 0.5rem 0.6rem; font-family: inherit;
  transition: border-color 0.2s;
}
.group-slot select:focus, .gear-group select:focus, .encounter-row select:focus { border-color: var(--accent-muted); outline: none; }
.group-slot--bard select { color: var(--accent); border-color: var(--accent-muted); }

/* Raid grid */
.raid-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 1rem; }
.raid-class { display: flex; align-items: center; gap: 0.5rem; }
.raid-class label { color: var(--text-body); font-size: 0.82rem; flex: 1; }
.raid-class input[type="number"] {
  width: 48px; background: var(--surface); border: 1px solid var(--border); border-radius: 4px;
  color: var(--text); font-size: 0.85rem; padding: 0.3rem 0.4rem; text-align: center; font-family: inherit;
}
.raid-class input[type="number"]:focus { border-color: var(--accent-muted); outline: none; }
.raid-role { margin-bottom: 1.5rem; }
.raid-role label { color: var(--text-muted); font-size: 0.8rem; margin-right: 0.5rem; }
.raid-role select { width: auto; display: inline-block; }

/* Solo style */
.solo-style { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
.solo-btn { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem 1.25rem; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.solo-btn:hover { border-color: var(--accent-muted); color: var(--accent); }
.solo-btn.active { border-color: var(--accent); color: var(--accent); background: rgba(212,130,74,0.08); }

/* Encounter panel */
.encounter-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 5px; padding: 1rem; margin-bottom: 1.5rem; }
.encounter-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
.encounter-row:last-child { margin-bottom: 0; }
.encounter-row label { color: var(--text-body); font-size: 0.85rem; min-width: 140px; flex-shrink: 0; }
.encounter-row select { width: auto; }
.dmg-type-toggles { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.dmg-toggle { background: var(--bg); border: 1px solid var(--border); border-radius: 3px; color: var(--text-muted); font-size: 0.78rem; padding: 0.3rem 0.7rem; cursor: pointer; transition: all 0.2s; }
.dmg-toggle:hover { border-color: var(--accent-muted); }
.dmg-toggle.active { border-color: var(--accent); color: var(--accent); background: rgba(212,130,74,0.1); }

/* Toggle checkbox */
.toggle-check { appearance: none; -webkit-appearance: none; width: 16px; height: 16px; border: 1px solid var(--accent-muted); border-radius: 3px; background: var(--bg); cursor: pointer; position: relative; transition: background 0.15s, border-color 0.15s; flex-shrink: 0; }
.toggle-check:checked { background: var(--accent); border-color: var(--accent); }
.toggle-check:checked::after { content: "\2713"; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); color: var(--bg); font-size: 10px; }

/* Gear panel */
.gear-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 5px; padding: 1rem; margin-bottom: 1.5rem; }
.gear-row { display: flex; gap: 1rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
.gear-row:last-child { margin-bottom: 0; }
.gear-group { flex: 1; min-width: 140px; }
.gear-group label { display: block; color: var(--text-muted); font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 0.3rem; }
.gear-group input[type="checkbox"] { margin-top: 0.35rem; }

/* Modifier table */
.mod-table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.82rem; }
.mod-table th { text-align: left; color: var(--accent); font-family: Georgia, serif; font-weight: normal; font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; padding: 0.5rem 0.6rem; border-bottom: 1px solid var(--border); }
.mod-table td { color: var(--text-body); padding: 0.4rem 0.6rem; border-bottom: 1px solid var(--border-subtle); }
.mod-table tr:nth-child(even) td { background: rgba(0,0,0,0.15); }
.mod-table td:last-child { color: var(--accent); font-weight: 600; }

/* Results */
.melody-song { background: var(--surface); border: 1px solid var(--border); border-radius: 5px; display: flex; align-items: flex-start; gap: 1rem; padding: 0.85rem 1rem; margin-bottom: 0.5rem; }
.melody-song-icon { color: var(--accent); font-size: 1.3rem; flex-shrink: 0; }
.melody-song-info { flex: 1; }
.melody-song-name { color: var(--accent); font-family: Georgia, serif; font-size: 0.95rem; margin-bottom: 0.15rem; }
.melody-song-meta { color: var(--text-muted); font-size: 0.775rem; margin-bottom: 0.3rem; }
.melody-song-effects { color: var(--text-body); font-size: 0.85rem; line-height: 1.5; }
.melody-song-tag { display: inline-block; background: rgba(212,130,74,0.1); border: 1px solid var(--accent-muted); color: var(--accent); font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 3px; margin-top: 0.3rem; letter-spacing: 0.03em; }
.melody-song-score { flex-shrink: 0; text-align: right; min-width: 60px; }
.score-bar { height: 6px; background: var(--border); border-radius: 3px; margin-top: 0.3rem; overflow: hidden; }
.score-bar-fill { height: 100%; background: var(--accent); border-radius: 3px; transition: width 0.3s; }
.score-value { color: var(--text-muted); font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.runnerup-song { opacity: 0.65; }
.runnerup-song .melody-song-tag { background: rgba(100,100,100,0.1); border-color: var(--text-muted); color: var(--text-muted); }
.results-empty { color: var(--text-muted); font-style: italic; font-size: 0.85rem; padding: 1rem 0; }

/* Responsive */
@media (max-width: 600px) {
  .group-slots { grid-template-columns: repeat(2, 1fr); }
  .raid-grid { grid-template-columns: repeat(2, 1fr); }
  .gear-row { flex-direction: column; gap: 0.5rem; }
  .encounter-row { flex-direction: column; align-items: flex-start; gap: 0.3rem; }
  .encounter-row label { min-width: auto; }
  .mode-tab { padding: 0.5rem 1rem; font-size: 0.82rem; }
}
```

- [ ] **Step 3: Verify page loads with correct styling**

Open `tools/melody/index.html` in a browser. The page should show the nav, header, mode tabs, group slots, encounter conditions, gear panel, modifier table, and results area — all styled to match the Tavern Hearth theme. Verify responsive at 600px.

- [ ] **Step 4: Commit**

```bash
git add tools/melody/index.html
git commit -m "feat(melody): add page structure and styling"
```

---

### Task 3: Create Algorithm and UI Logic (`melody.js`)

**Files:**
- Create: `tools/melody/melody.js`

- [ ] **Step 1: Create melody.js with initialization and modifier calculator**

```js
$(function () {
  // ============================================================
  // Melody Recommender — Algorithm & UI
  // ============================================================

  var currentMode = 'group';
  var currentSoloStyle = 'kiting';

  // --- Initialization ---
  function init() {
    populateClassDropdowns();
    populateRaidGrid();
    populateGearDropdowns();
    bindEvents();
    recalculate();
  }

  function populateClassDropdowns() {
    var $selects = $('.class-select').not('[data-slot="6"]');
    $selects.each(function () {
      var $sel = $(this);
      // Keep the empty option
      for (var i = 0; i < CLASSES.length; i++) {
        $sel.append('<option value="' + CLASSES[i].id + '">' + CLASSES[i].name + '</option>');
      }
    });
  }

  function populateRaidGrid() {
    var $grid = $('#raid-grid');
    for (var i = 0; i < CLASSES.length; i++) {
      var c = CLASSES[i];
      $grid.append(
        '<div class="raid-class">' +
          '<label>' + c.name + '</label>' +
          '<input type="number" class="raid-count" data-class="' + c.id + '" min="0" max="12" value="0">' +
        '</div>'
      );
    }
  }

  function populateGearDropdowns() {
    var types = ['percussion', 'stringed', 'brass', 'wind'];
    for (var t = 0; t < types.length; t++) {
      var type = types[t];
      var $sel = $('#gear-' + type);
      var items = INSTRUMENTS[type];
      for (var key in items) {
        $sel.append('<option value="' + key + '">' + items[key].name + '</option>');
      }
    }
    // Singing clicky
    var $clicky = $('#gear-clicky');
    for (var key in SINGING_CLICKIES) {
      $clicky.append('<option value="' + key + '">' + SINGING_CLICKIES[key].name + '</option>');
    }
  }

  // --- Modifier Calculation ---
  // Based on Quarm codebase: client_mods.cpp GetInstrumentMod()
  function calcModifiers() {
    var mods = {};
    var instMastery = parseInt($('#aa-inst-mastery').val()) || 0;
    var singMastery = parseInt($('#aa-sing-mastery').val()) || 0;
    var puretone = $('#gear-puretone').is(':checked');
    var ampActive = $('#gear-amp').is(':checked');
    var clickyKey = $('#gear-clicky').val();
    var clickyMod = SINGING_CLICKIES[clickyKey] ? SINGING_CLICKIES[clickyKey].mod : 0;

    var types = ['percussion', 'stringed', 'brass', 'wind'];
    for (var t = 0; t < types.length; t++) {
      var type = types[t];
      var itemKey = $('#gear-' + type).val();
      var itemMod = INSTRUMENTS[type][itemKey] ? INSTRUMENTS[type][itemKey].mod : 0;
      var spellMod = puretone ? 10 : 0; // Puretone adds 10
      var bestBase = Math.max(itemMod, spellMod);
      var total = 10 + bestBase + instMastery;
      var cap = INSTRUMENT_SOFT_CAP + instMastery;
      if (total > cap) total = cap;
      mods[type] = { item: itemMod, aa: instMastery, amp: 0, total: total, multiplier: total / 10 };
    }

    // Singing
    var singingBase = 10;
    var ampBonus = 0;
    if (ampActive) ampBonus += 9; // Amplification spell at lv60
    if (clickyMod > 0) ampBonus += clickyMod;
    if (ampBonus > 28) ampBonus = 28; // Amplification cap
    var singingTotal = singingBase + singMastery + ampBonus;
    var singingCap = INSTRUMENT_SOFT_CAP + singMastery;
    if (singingTotal > singingCap) singingTotal = singingCap;
    mods.singing = { item: 0, aa: singMastery, amp: ampBonus, total: singingTotal, multiplier: singingTotal / 10 };

    return mods;
  }

  function updateModTable(mods) {
    var skills = ['percussion', 'stringed', 'brass', 'wind', 'singing'];
    for (var i = 0; i < skills.length; i++) {
      var sk = skills[i];
      var m = mods[sk];
      var $row = $('#mod-table tr[data-skill="' + sk + '"]');
      var cells = $row.find('td');
      cells.eq(1).text(m.item > 0 ? '+' + m.item : '—');
      cells.eq(2).text(m.aa > 0 ? '+' + m.aa : '—');
      cells.eq(3).text(m.amp > 0 ? '+' + m.amp : '—');
      cells.eq(4).text(m.total);
      cells.eq(5).text(m.multiplier.toFixed(1) + 'x');
    }
  }

  // --- Composition Profile ---
  function getGroupComposition() {
    var classes = [];
    if (currentMode === 'group') {
      $('.class-select').each(function () {
        var val = $(this).val();
        if (val) classes.push(val);
      });
    } else if (currentMode === 'raid') {
      // Build a simulated group based on role
      var role = $('#raid-role-select').val();
      // For raid mode, we use the full raid counts but optimize for the role
      $('.raid-count').each(function () {
        var cls = $(this).data('class');
        var count = parseInt($(this).val()) || 0;
        for (var i = 0; i < count; i++) classes.push(cls);
      });
    } else if (currentMode === 'solo') {
      classes.push('bard');
    }
    return classes;
  }

  function hasClassType(classes, type) {
    for (var i = 0; i < classes.length; i++) {
      var classDef = getClassDef(classes[i]);
      if (classDef && classDef.type.indexOf(type) !== -1) return true;
    }
    return false;
  }

  function getClassDef(classId) {
    for (var i = 0; i < CLASSES.length; i++) {
      if (CLASSES[i].id === classId) return CLASSES[i];
    }
    return null;
  }

  // --- Encounter Conditions ---
  function getEncounterConditions() {
    var dmgTypes = [];
    $('.dmg-toggle.active').each(function () {
      dmgTypes.push($(this).data('dmg'));
    });
    return {
      dmgTypes: dmgTypes,
      slowNeeded: $('#slow-needed').val(),
      slowImmune: $('#slow-immune').is(':checked'),
      resistDebuff: $('#resist-debuff').is(':checked')
    };
  }

  // --- Scoring Algorithm ---
  function scoreSongs(classes, mods, encounter) {
    var hasSlower = hasClassType(classes, 'slower');
    var hasHaster = hasClassType(classes, 'haster');
    var isSolo = currentMode === 'solo';
    var isRaid = currentMode === 'raid';

    // Step 1: Filter candidates
    var candidates = [];
    for (var i = 0; i < SONGS.length; i++) {
      var song = SONGS[i];

      // Skip raid-only songs in group/solo mode
      if (song.raidOnly && !isRaid) continue;

      // Skip solo-only songs in group/raid mode
      if (song.soloOnly && !isSolo) continue;

      // Eliminate songs covered by external sources
      if (song.eliminateIf) {
        var dominated = false;
        for (var e = 0; e < song.eliminateIf.length; e++) {
          var tag = song.eliminateIf[e];
          if (tag === 'slower') {
            // Check slow override
            if (encounter.slowNeeded === 'auto' && hasSlower) dominated = true;
            if (encounter.slowNeeded === 'no') dominated = true;
          }
          if (tag === 'haster' && hasHaster) dominated = true;
        }
        if (dominated) continue;
      }

      // Eliminate slow songs if mob is slow-immune
      if (encounter.slowImmune && song.category === 'slow') continue;

      candidates.push(song);
    }

    // Step 2: Identify encounter-locked songs
    var lockedSongs = [];
    var lockedCategories = {};

    // Map damage types to encounter tags
    var dmgToResist = {
      fire: 'fire', cold: 'cold', poison: 'poison', disease: 'disease', magic: 'magic'
    };

    for (var d = 0; d < encounter.dmgTypes.length; d++) {
      var tag = encounter.dmgTypes[d];
      // Find best song with this encounter tag
      var best = null;
      var bestScore = -1;
      for (var j = 0; j < candidates.length; j++) {
        var s = candidates[j];
        if (!s.encounterTags || s.encounterTags.indexOf(tag) === -1) continue;
        // Only consider resist songs (not DoTs) for damage type locking
        if (s.category.indexOf('resist') === -1 && s.category.indexOf('ac_def') === -1) continue;
        var sc = calcSongScore(s, classes, mods);
        if (sc > bestScore) { bestScore = sc; best = s; }
      }
      if (best && !lockedCategories[best.category]) {
        lockedSongs.push({ song: best, score: bestScore, reason: 'Encounter: ' + tag + ' resist required' });
        lockedCategories[best.category] = true;
      }
    }

    // Lock slow if needed and no external source
    if (encounter.slowNeeded === 'yes' || (encounter.slowNeeded === 'auto' && !hasSlower && !encounter.slowImmune)) {
      var bestSlow = null;
      var bestSlowScore = -1;
      for (var j = 0; j < candidates.length; j++) {
        if (candidates[j].category !== 'slow') continue;
        var sc = calcSongScore(candidates[j], classes, mods);
        if (sc > bestSlowScore) { bestSlowScore = sc; bestSlow = candidates[j]; }
      }
      if (bestSlow && !lockedCategories['slow']) {
        // Don't auto-lock slow, let it compete — only lock if explicitly "yes"
        if (encounter.slowNeeded === 'yes') {
          lockedSongs.push({ song: bestSlow, score: bestSlowScore, reason: 'Encounter: slow required' });
          lockedCategories['slow'] = true;
        }
      }
    }

    // Step 3: Score remaining candidates
    var scored = [];
    var lockedIds = {};
    for (var l = 0; l < lockedSongs.length; l++) lockedIds[lockedSongs[l].song.id] = true;

    for (var i = 0; i < candidates.length; i++) {
      if (lockedIds[candidates[i].id]) continue;
      var score = calcSongScore(candidates[i], classes, mods);
      scored.push({ song: candidates[i], score: score });
    }

    scored.sort(function (a, b) { return b.score - a.score; });

    // Step 4: Build melody — greedy with category constraints
    var melody = lockedSongs.slice(); // Start with locked songs
    var usedCategories = {};
    for (var l = 0; l < lockedSongs.length; l++) usedCategories[lockedSongs[l].song.category] = true;

    var runnerUps = [];
    var slotsRemaining = 4 - melody.length;

    for (var i = 0; i < scored.length && slotsRemaining > 0; i++) {
      var entry = scored[i];
      if (entry.score <= 0) break;
      if (usedCategories[entry.song.category]) {
        runnerUps.push({ song: entry.song, score: entry.score, reason: 'Outscored by another ' + entry.song.category + ' song' });
        continue;
      }
      melody.push({ song: entry.song, score: entry.score, reason: '' });
      usedCategories[entry.song.category] = true;
      slotsRemaining--;
    }

    // Collect remaining runner-ups (up to 3)
    var ruCount = 0;
    for (var i = 0; i < scored.length && ruCount < 3; i++) {
      var entry = scored[i];
      var inMelody = false;
      for (var m = 0; m < melody.length; m++) {
        if (melody[m].song.id === entry.song.id) { inMelody = true; break; }
      }
      var inRunnerUp = false;
      for (var r = 0; r < runnerUps.length; r++) {
        if (runnerUps[r].song.id === entry.song.id) { inRunnerUp = true; break; }
      }
      if (!inMelody && !inRunnerUp && entry.score > 0) {
        var reason = 'Lower score';
        if (usedCategories[entry.song.category]) {
          reason = 'Category ' + entry.song.category + ' already filled';
        }
        runnerUps.push({ song: entry.song, score: entry.score, reason: reason });
        ruCount++;
      }
    }

    // Sort melody by score descending
    melody.sort(function (a, b) { return b.score - a.score; });

    return { melody: melody, runnerUps: runnerUps.slice(0, 3) };
  }

  function calcSongScore(song, classes, mods) {
    // Sum class weights for present classes
    var weightSum = 0;
    for (var i = 0; i < classes.length; i++) {
      var w = song.classWeights[classes[i]];
      if (w) weightSum += w;
    }
    if (weightSum === 0) return 0;

    // Calculate effective song value with instrument mods
    var effectiveValue = 0;
    var mod = mods[song.instrument] || mods.singing;
    for (var e = 0; e < song.effects.length; e++) {
      var eff = song.effects[e];
      var val = Math.abs(eff.value);
      if (eff.moddable) val = val * mod.multiplier;
      effectiveValue += val;
    }

    return weightSum * effectiveValue;
  }

  // --- Rendering ---
  function renderResults(results) {
    var $melody = $('#melody-results');
    var $runners = $('#melody-runnerups');

    if (results.melody.length === 0) {
      $melody.html('<div class="results-empty">No songs to recommend. Add classes to your group.</div>');
      $runners.html('<div class="results-empty">—</div>');
      return;
    }

    var maxScore = 0;
    for (var i = 0; i < results.melody.length; i++) {
      if (results.melody[i].score > maxScore) maxScore = results.melody[i].score;
    }

    var html = '';
    for (var i = 0; i < results.melody.length; i++) {
      var entry = results.melody[i];
      html += renderSongRow(entry, maxScore, false);
    }
    $melody.html(html);

    // Runner-ups
    if (results.runnerUps.length === 0) {
      $runners.html('<div class="results-empty">—</div>');
    } else {
      var ruHtml = '';
      for (var i = 0; i < results.runnerUps.length; i++) {
        ruHtml += renderSongRow(results.runnerUps[i], maxScore, true);
      }
      $runners.html(ruHtml);
    }
  }

  function renderSongRow(entry, maxScore, isRunnerUp) {
    var song = entry.song;
    var pct = maxScore > 0 ? Math.round((entry.score / maxScore) * 100) : 0;
    var cls = isRunnerUp ? 'melody-song runnerup-song' : 'melody-song';

    var effectsHtml = '';
    for (var e = 0; e < song.effects.length; e++) {
      var eff = song.effects[e];
      var label = eff.label || eff.type.replace(/([A-Z])/g, ' $1').trim();
      var val = eff.value;
      if (e > 0) effectsHtml += ', ';
      effectsHtml += label + ' ' + (val >= 0 ? '+' : '') + val;
    }

    return '<div class="' + cls + '">' +
      '<div class="melody-song-icon">&#9835;</div>' +
      '<div class="melody-song-info">' +
        '<div class="melody-song-name">' + song.name + '</div>' +
        '<div class="melody-song-meta">Lv ' + song.level + ' &middot; ' + song.instrument.charAt(0).toUpperCase() + song.instrument.slice(1) + '</div>' +
        '<div class="melody-song-effects">' + effectsHtml + '</div>' +
        (entry.reason ? '<div class="melody-song-tag">' + entry.reason + '</div>' : '') +
      '</div>' +
      '<div class="melody-song-score">' +
        '<div class="score-value">' + Math.round(entry.score) + '</div>' +
        '<div class="score-bar"><div class="score-bar-fill" style="width:' + pct + '%"></div></div>' +
      '</div>' +
    '</div>';
  }

  // --- Event Bindings ---
  function bindEvents() {
    // Mode tabs
    $('.mode-tab').on('click', function () {
      $('.mode-tab').removeClass('active');
      $(this).addClass('active');
      currentMode = $(this).data('mode');
      $('.mode-panel').removeClass('active');
      $('#mode-' + currentMode).addClass('active');
      recalculate();
    });

    // Solo style
    $('.solo-btn').on('click', function () {
      $('.solo-btn').removeClass('active');
      $(this).addClass('active');
      currentSoloStyle = $(this).data('style');
      recalculate();
    });

    // Damage type toggles (multi-select)
    $('.dmg-toggle').on('click', function () {
      $(this).toggleClass('active');
      recalculate();
    });

    // All inputs trigger recalculate
    $(document).on('change', '.class-select, .raid-count, #raid-role-select, #slow-needed, #slow-immune, #resist-debuff, #gear-epic, #gear-amp, #gear-puretone, #gear-percussion, #gear-stringed, #gear-brass, #gear-wind, #aa-inst-mastery, #aa-sing-mastery, #aa-jam-fest, #gear-clicky', function () {
      recalculate();
    });
  }

  // --- Main Recalculate ---
  function recalculate() {
    var mods = calcModifiers();
    updateModTable(mods);

    var classes = getGroupComposition();
    var encounter = getEncounterConditions();
    var results = scoreSongs(classes, mods, encounter);
    renderResults(results);
  }

  // Go
  init();
});
```

- [ ] **Step 2: Verify the complete tool works end-to-end**

Open `tools/melody/index.html` in a browser.

1. **Group mode:** Select Warrior, Monk, Rogue, Cleric, Shaman. Verify melody shows v3 overhaste, regen, and other songs. Verify haste and slow songs are eliminated (Shaman = slower, Enchanter would be haster).
2. **Modifier table:** Select Drum of the Beast, Lyran's Lute, Denon's Horn. Verify table shows increasing multipliers. Toggle Amplification + Shei Cloak and verify singing mod goes up.
3. **Encounter conditions:** Toggle "Fire" damage type. Verify Psalm of Cooling or equivalent gets locked in.
4. **Solo mode:** Switch to solo tab. Verify Denon's Desperate Dirge and AE DoTs appear.
5. **Responsive:** Resize to 600px. Verify single-column layout.

- [ ] **Step 3: Commit**

```bash
git add tools/melody/melody.js
git commit -m "feat(melody): add scoring algorithm and UI logic"
```

---

### Task 4: Update Navigation and Search Index

**Files:**
- Modify: `partials/nav.html`
- Modify: `search-index.json`

- [ ] **Step 1: Add melody tool to navigation**

In `partials/nav.html`, find the Misc dropdown's "Bard Pro" link and add the melody recommender link before it:

In the desktop nav `#dropdown-misc`:
```html
<a href="/tools/melody/">Melody Recommender</a>
```

In the mobile nav `#mobile-misc`:
```html
<a href="/tools/melody/">Melody Recommender</a>
```

- [ ] **Step 2: Update search index**

In `search-index.json`, add an entry for the melody recommender:

```json
{
  "title": "Melody Recommender",
  "url": "/tools/melody/",
  "category": "Tools",
  "description": "Build the optimal twist for your group, raid, or solo session based on class composition, encounter conditions, and gear.",
  "tags": ["melody", "twist", "songs", "group", "raid", "solo", "haste", "overhaste", "regen", "resist", "slow", "tool"]
}
```

- [ ] **Step 3: Remove coming-soon from tools nav links if present**

Check if the Melody Recommender or Bard Pro links have `data-coming-soon` attributes in the nav. If the melody link was added fresh, ensure it does NOT have this attribute.

- [ ] **Step 4: Verify navigation works**

Open any page on the site. Verify the melody recommender appears in the Misc dropdown (desktop) and mobile nav. Click it to confirm navigation works.

- [ ] **Step 5: Commit**

```bash
git add partials/nav.html search-index.json
git commit -m "feat(melody): add tool to navigation and search index"
```

---

### Task 5: Polish and LocalStorage Persistence

**Files:**
- Modify: `tools/melody/melody.js`

- [ ] **Step 1: Add LocalStorage save/restore for gear settings**

At the end of `melody.js`, before `init()` is called, add save/restore functions:

```js
  var STORAGE_KEY = 'lyrical_melody_gear';

  function saveGearState() {
    var state = {
      epic: $('#gear-epic').is(':checked'),
      amp: $('#gear-amp').is(':checked'),
      puretone: $('#gear-puretone').is(':checked'),
      percussion: $('#gear-percussion').val(),
      stringed: $('#gear-stringed').val(),
      brass: $('#gear-brass').val(),
      wind: $('#gear-wind').val(),
      instMastery: $('#aa-inst-mastery').val(),
      singMastery: $('#aa-sing-mastery').val(),
      jamFest: $('#aa-jam-fest').val(),
      clicky: $('#gear-clicky').val()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function restoreGearState() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      var state = JSON.parse(raw);
      if (state.epic) $('#gear-epic').prop('checked', state.epic);
      if (state.amp) $('#gear-amp').prop('checked', state.amp);
      if (state.puretone) $('#gear-puretone').prop('checked', state.puretone);
      if (state.percussion) $('#gear-percussion').val(state.percussion);
      if (state.stringed) $('#gear-stringed').val(state.stringed);
      if (state.brass) $('#gear-brass').val(state.brass);
      if (state.wind) $('#gear-wind').val(state.wind);
      if (state.instMastery) $('#aa-inst-mastery').val(state.instMastery);
      if (state.singMastery) $('#aa-sing-mastery').val(state.singMastery);
      if (state.jamFest) $('#aa-jam-fest').val(state.jamFest);
      if (state.clicky) $('#gear-clicky').val(state.clicky);
    } catch (e) { /* ignore corrupt state */ }
  }
```

Then modify the event binding to call `saveGearState()` after recalculate on gear changes, and call `restoreGearState()` in `init()` before the first `recalculate()`.

- [ ] **Step 2: Verify persistence**

1. Set some gear options (Drum of the Beast, Singing Mastery 3, etc.)
2. Refresh the page
3. Verify gear selections are restored

- [ ] **Step 3: Commit**

```bash
git add tools/melody/melody.js
git commit -m "feat(melody): persist gear settings in LocalStorage"
```
