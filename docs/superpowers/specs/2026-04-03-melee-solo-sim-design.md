# Melee Solo Sim — Design Spec

**Date:** 2026-04-03
**Branch:** feat/melody-recommender
**Scope:** Add a "Melee" solo style to the Melody Recommender that runs an actual combat simulation to find the optimal 5-song twist for sustainable DPS against a specific NPC.

---

## Overview

The existing melody recommender uses class-weight scoring to rank songs for group/raid/solo modes. The melee solo mode replaces this with a combat simulation that models the bard standing toe-to-toe with a specific NPC, calculating actual DPS, incoming damage, and survivability for every possible 5-song combination.

The goal: given my gear, my stats, and this specific NPC — what 5 songs maximize my kill speed while keeping me alive?

---

## Character Profile

A new panel shown when the "Melee" solo style is selected. All fields persisted in LocalStorage (key: `lyrical_melody_melee_profile`).

### Fields

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| Level | number | 60 | Affects hit rate, spell scaling |
| Max HP | number | 3353 | With always-on self-buffs |
| HP per tick | number | 13 | Base regen including gear/buffs |
| Item haste % | number | 36 | From worn gear (e.g., helmet) |
| Buff haste % | number | 40 | From non-song V1/V2 haste (e.g., Illusion: Werewolf) |
| Primary weapon name | text | Scimitar of Shissar Slaying | Display only |
| Primary base damage | number | 15 | From /mystats BaseDmg |
| Primary bonus damage | number | 11 | From /mystats BonusDmg |
| Primary delay | number | 19 | Weapon delay |
| Secondary weapon name | text | Singing Short Sword | Display only |
| Secondary base damage | number | 16 | From /mystats BaseDmg |
| Secondary bonus damage | number | 0 | From /mystats BonusDmg |
| Secondary delay | number | 25 | Weapon delay |
| Always-on DS | number | 0 | Combined DS from self-buff clickies (Shield of Flame, etc.) |
| Always-on AC bonus | number | 0 | Additional AC from self-buffs (Arch Shielding, etc.) |

---

## NPC Lookup

### Data Source

Extract NPC data from the Quarm DB (`C:/Apps/quarm/db/quarm_2026-03-20-09_37.sql`) into a static JSON file at `/tools/melody/npcs.json`.

### Filter Criteria

Reasonable solo targets only:
- Level 40–66
- Exclude NPCs with 0 HP, 0 max damage, or missing combat stats
- Exclude untargetable/quest-only NPCs where identifiable

### JSON Schema

```json
{
  "id": 89018,
  "name": "blood_of_chottal",
  "level": 55,
  "class": 7,
  "hp": 14275,
  "min_dmg": 41,
  "max_dmg": 147,
  "attack_speed": 0,
  "resists": { "mr": 218, "fr": 218, "cr": 218, "pr": 218, "dr": 218 },
  "special_abilities": "1,1^10,1^21,1^23,1^42,1"
}
```

### UI

- Text input: search by NPC ID or name (substring match)
- Dropdown/autocomplete showing matches
- On selection, display: name, level, class, HP, min/max damage, attack speed, resists

---

## Song Candidates

16 candidates total (15 songs + Amplification). The sim evaluates all C(16,5) = 4,368 five-song combinations.

### Haste Songs

| Song | Instrument | Haste Type | Haste Value | Other Effects |
|------|------------|------------|-------------|---------------|
| Warsong of the Vah Shir | Brass | V3 overhaste | +25% | — |
| Jonthan's Inspiration | Singing | V1/V2 spell | 61–66% | STR +17–19, ATK +13–14 |
| McVaxius' Rousing Rondo | Brass | V1/V2 spell | 19–20% | STR +20–22, ATK +11–12, DS 8 |

### Slow Songs

| Song | Instrument | Slow % | Target | Other Effects |
|------|------------|--------|--------|---------------|
| Selo's Consonant Chain | Singing | 40% | Single | Snare |
| Selo's Assonant Strane | Stringed | 40% | AE | Snare |
| Largo's Melodic Binding | Singing | 35% | AE | AC debuff |
| Largo's Absonant Binding | Singing | 35% | Single | AC debuff, snare, AGI debuff |
| Selo's Chords of Cessation | Stringed | 25% | AE | DoT 26–35/tick |

### DoT Songs

| Song | Instrument | DoT/tick | Other Effects |
|------|------------|----------|---------------|
| Tuyen's Chant of Frost | Percussion | 24–34 | CR debuff –14 to –19 |
| Tuyen's Chant of Flame | Percussion | 20–34 | FR debuff –12 to –19 |

### Defensive / Regen Songs

| Song | Instrument | Key Effects |
|------|------------|-------------|
| Ancient: Lcea's Lament | Stringed | HP regen 16–17/tick, Mana regen 15/tick, STA +10 |
| Niv's Harmonic | Singing | Absorb Magic 10, AC +23 |
| Niv's Melody of Preservation | Stringed | Absorb Magic 10, HP regen 6–9/tick, STR +10 |
| Psalm of Cooling | Singing | DS 7–12, FR +43–75, AC +3–5 |

### Utility

| Song | Instrument | Key Effects |
|------|------------|-------------|
| Brusco's Bombastic Bellow | Singing | Stun 8s, DD 222 |

### Amplification

Competes for a melody slot. If included, boosts the **singing** skill modifier (not percussion/stringed/brass/wind). This affects the 7 singing-instrument songs in the candidate pool: Jonthan's Inspiration, Niv's Harmonic, Brusco's Bombastic Bellow, Psalm of Cooling, Selo's Consonant Chain, Largo's Melodic Binding, and Largo's Absonant Binding. Only worth the slot if the aggregate DPS/survivability gain from boosted singing songs exceeds what a 5th song would contribute.

---

## Haste Stacking Model

```
total_haste = item_haste + max(buff_haste, best_v1v2_song_haste) + v3_song_haste
```

- **Item haste** (worn): constant from profile (e.g., 36%)
- **Buff haste** (non-song V1/V2): constant from profile (e.g., 40% from Illusion: Werewolf)
- **Song V1/V2 haste**: from Jonthan's Inspiration or Rondo if in the melody — overwrites buff haste only if higher
- **V3 overhaste**: from Warsong if in the melody — always stacks on top

Example baselines:
- No haste songs: 36% + 40% + 0% = **76%**
- Warsong only: 36% + 40% + 25% = **101%**
- Jonthan's + Warsong: 36% + 63% + 25% = **124%**

---

## Combat Simulation

### Per-Combination Calculation

For each 5-song combo:

**1. Player Melee DPS**

```
total_haste = item_haste + max(buff_haste, song_v1v2_haste) + v3_haste
haste_multiplier = 1 + (total_haste / 100)

primary_dps = (bonus_dmg + base_dmg * avg_mit_factor) / (delay / haste_multiplier)
secondary_dps = (bonus_dmg + base_dmg * avg_mit_factor) / (delay / haste_multiplier)
melee_dps = primary_dps + secondary_dps
```

Plus ATK/STR bonuses from songs factored into the damage multiplier.

**2. Song DPS (DoTs + DS)**

```
dot_dps = sum of DoT values per tick from all DoT songs in melody / 6 (ticks to seconds)
ds_dps = (player_ds_total) * mob_attacks_per_second
  where player_ds_total = always_on_ds + song_ds (Rondo, Psalm of Cooling)
  and mob_attacks_per_second = derived from mob attack_speed
```

**3. Stun Contribution (Brusco's)**

If Brusco's Bombastic Bellow is in the melody:
```
stun_uptime_ratio = stun_duration / twist_cycle_time (capped by resist checks vs mob level)
dd_dps = 222 / twist_cycle_time
mob_dps_reduction_from_stun = mob_base_dps * stun_uptime_ratio
```

**4. Incoming Mob DPS**

```
mob_avg_dmg = (min_dmg + max_dmg) / 2
mob_attacks_per_second = derived from mob attack_speed
mob_base_dps = mob_avg_dmg * mob_attacks_per_second

slow_percent = best slow song in melody (0%, 25%, 35%, or 40%)
mob_slowed_dps = mob_base_dps * (1 - slow_percent)

effective_incoming_dps = mob_slowed_dps - stun_reduction (if Brusco's)
  adjusted for: player AC, absorb effects from songs
```

**5. Survivability**

```
regen_per_second = (hp_per_tick + song_hp_per_tick) / 6
net_incoming_dps = effective_incoming_dps - regen_per_second

time_to_die = max_hp / net_incoming_dps
  (if net_incoming_dps <= 0: infinite — fully sustainable)

total_player_dps = melee_dps + dot_dps + ds_dps + dd_dps
time_to_kill = mob_hp / total_player_dps

sustainable = time_to_kill < time_to_die
survival_margin = time_to_die - time_to_kill
```

### Ranking

1. Sustainable combos first (time_to_kill < time_to_die)
2. Among sustainable: fastest time_to_kill wins
3. Among unsustainable: largest survival_margin (least negative) as tiebreaker

---

## Results Output

### Top Melody

Display the winning 5-song combo with per-song breakdown:

```
1. Warsong of the Vah Shir     — +25% overhaste → +14.2 melee DPS
2. Jonthan's Inspiration        — +23% spell haste → +11.8 melee DPS, +ATK
3. Selo's Consonant Chain       — 40% slow → −38.4 mob DPS
4. Tuyen's Chant of Frost       — DoT 34/tick → +5.7 DPS
5. Ancient: Lcea's Lament       — +17 HP/tick regen → +8.5s survival
```

### Combat Summary

| Stat | Value |
|------|-------|
| Your DPS | 58.3 (melee 47.2 + DoT 5.7 + DS 5.4) |
| Mob DPS (raw) | 64.0 |
| Mob DPS (after slow) | 38.4 |
| HP regen/sec | 5.0 |
| Net incoming DPS | 33.4 |
| Time to kill | 244s |
| Time to die | 100s |
| Survival margin | −144s (UNSUSTAINABLE) |

(Example numbers — actual sim will calculate real values)

### Runner-Ups

Top 3–5 alternative melodies, condensed:
- Song names, time-to-kill, sustainable yes/no, survival margin

---

## UI Layout

When "Melee" is selected in the solo style buttons:

1. **Character Profile panel** appears (collapsible, below solo buttons)
   - Two-column layout: left = combat stats, right = weapons
   - Always-on buffs row at bottom
   - "Save Profile" implicit (auto-saves on change, like gear panel)

2. **NPC Lookup panel** appears (below encounter panel or replaces it)
   - Search input + result display
   - Encounter conditions panel hides (not relevant — NPC data replaces it)

3. **Results** change to sim output format (breakdown + summary + runner-ups)

The existing gear panel (instruments, AAs, clickies) remains visible — instrument modifiers still affect song effect values in the sim.

---

## Data Work

1. **Extract NPC JSON** from Quarm DB SQL → `/tools/melody/npcs.json`
   - Filter: level 40–66, valid combat stats
   - Fields: id, name, level, class, hp, min_dmg, max_dmg, attack_speed, resists, special_abilities

2. **Add new songs to songs.js:**
   - Jonthan's Inspiration (not currently in songs.js)
   - Brusco's Bombastic Bellow (not currently in songs.js)
   - Update existing songs with precise level-scaled values for the sim

3. **New melee solo scoring path in melody.js:**
   - Bypasses classWeights entirely
   - Runs combat sim for all 4,368 combinations
   - New rendering for sim results

---

## Implementation Boundaries

- Melee solo mode is isolated from group/raid scoring — no changes to existing classWeight logic
- Character profile uses its own LocalStorage key, separate from gear state
- NPC JSON is a static file loaded on demand (only when melee solo is active)
- Song data additions are backward-compatible (new fields on existing songs, new song entries)

---

## Open Questions / Refinements for Implementation

- Exact EQ formula for mob attack speed → attacks per second conversion
- Stun resist rate vs mob level (Brusco's effectiveness degrades against higher-level mobs)
- Whether song effect level scaling uses character level or character level + Jam Fest AA
- Dual-wield hit rate for secondary weapon (not 100% — level-dependent)
- Absorb magic damage mechanics (flat per-hit reduction? percentage?)
