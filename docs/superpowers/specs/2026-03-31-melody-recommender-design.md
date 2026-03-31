# Melody Recommender — Design Spec

## Overview

A single-page interactive tool for lyri-cal.com that recommends an optimal 4-song bard melody based on group composition, encounter conditions, and bard gear/AAs. All song data sourced from the Project Quarm codebase with actual level 60 spell formula calculations.

## Modes

Three tabs on one page:

### Group Mode
- 6 class slots (one auto-filled as Bard)
- 5 dropdowns: Warrior, Cleric, Paladin, Ranger, Shadowknight, Druid, Monk, Bard, Rogue, Shaman, Necromancer, Wizard, Magician, Enchanter, Beastlord, or Empty

### Raid Mode
- Class count grid (e.g., Warriors: 3, Clerics: 4)
- Role dropdown: Tank Group, Melee Group, Caster Group
- Role determines which subset of the raid the melody optimizes for

### Solo Mode
- No class inputs (bard only)
- Style toggle: Kiting / Swarming / Charm

## Encounter Conditions (all modes)

- Mob damage type: None, Fire, Cold, Poison, Disease, Magic (multi-select)
- Slow needed: Auto (checks if group has Enchanter/Shaman) / Yes / No
- Slow-immune mob: Y/N
- Resist debuff useful: Y/N

**Encounter conditions lock songs into the melody.** If "Fire Resist" is required, the best FR song (Psalm of Cooling or Elemental Chorus) is scored and locked into a melody slot. Remaining slots filled from the open pool. Multiple conditions can lock multiple slots.

## Gear / Modifier Panel

### Toggles
- Epic: Y/N
- Amplification active: Y/N
- Puretone active: Y/N

### Instrument Dropdowns
- Drums (Percussion): None / Combine / Selo's / Drum of the Beast
- Stringed: None / Combine / Kelin / Lyran
- Brass: None / Combine / McVax / Immaculate / Denon
- Wind: None / Combine / (other tiers)

### AAs
- Instrument Mastery: 0 / 1 / 2 / 3
- Singing Mastery: 0 / 1 / 2 / 3
- Jam Fest: 0 / 1 / 2 / 3

### Clicky Items
- None / Voice of the Serpent (Resonance — +60% singing) / Shadowsong Cloak (Harmonize — +90% singing)

### Modifier Table
Live-updating table showing calculated modifier value for each skill (Percussion, Stringed, Brass, Wind, Singing) based on current selections. Modifier formula from Quarm codebase:

```
modifier = max(item_bonus, spell_bonus) + aa_bonus + amplification_bonus
effective_value = base_lv60_value * (modifier / 10)
```

- Base modifier: 10 (100%)
- Soft cap: 36 + AA bonuses (up to +3 from Ayonae's Tutelage)
- Amplification bonus: capped at 28, singing only
- Puretone: additive to base 10
- VoTS/Shei Cloak: adds to singing via SE_Amplification

## Scoring Algorithm

### Step 1 — Eliminate externally covered songs
- Enchanter or Shaman present → all v1/v2 haste songs removed from candidate pool
- Enchanter or Shaman present → all slow songs removed (unless "Slow needed: Yes" override)
- Slow-immune mob → slow songs removed

### Step 2 — Lock encounter-required songs
- For each toggled encounter condition (e.g., fire resist), score eligible songs for that condition and lock the best into a melody slot
- Locked songs are removed from the open pool

### Step 3 — Calculate effective song values
- For each remaining candidate, apply instrument modifier to moddable effects
- Non-moddable effects (AttackSpeed, Cassindra mana lines) use flat lv60 values
- Moddable effects: CurrentHP, ArmorClass, ATK, MovementSpeed, STR/DEX/AGI/STA/INT/WIS/CHA, ResistFire/Cold/Poison/Disease/Magic, ResistAll, Rune, DamageShield, AbsorbMagicAtt, and mana regen (Cantata/Replenishment lines only, NOT Cassindra)

### Step 4 — Score each song using class weight matrix
Each song has a weight from 0.00 to 1.00 for every class. The score formula:

```
song_score = sum(class_weight[song][class] for each class in group) * effective_song_value
```

Example weights:
- Warsong of the Vah Shir: Warrior 0.95, Monk 0.80, Rogue 0.85, Ranger 0.60, Wizard 0.0
- Cantata of Replenishment: Wizard 0.90, Enchanter 0.85, Cleric 0.70, Warrior 0.05
- Psalm of Cooling: all classes ~0.50 baseline (boosted when encounter-locked)

Stat riders (STR, AGI, DEX) get reduced multiplier reflecting Luclin-era stat caps.

### Step 5 — Build melody (greedy with slot constraints)
- Sort remaining candidates by score descending
- Pick top songs to fill remaining slots (after encounter-locked songs), skipping songs that conflict with already-picked songs in the same buff category (v1/v2 haste, v3 overhaste, slow, single-resist psalm, multi-resist rhythm/chorus, mana regen, HP regen, AE regen)
- Optimal melody: 4 songs for constant twist coverage
- 3 runner-ups shown with displacement reasons

## Haste Stacking Rules

- **v1 (SE_AttackSpeed) and v2 (SE_AttackSpeed2) are the same slot.** They do NOT stack. Best source wins.
- **v3 (SE_AttackSpeed3) is overhaste.** Stacks on top of v1/v2. Bard-exclusive — no other class provides v3.
- Bard songs do NOT overwrite better external haste. Both buffs coexist in separate buff slots; the bonus calculation uses a max-wins accumulator (confirmed in Quarm codebase: `buffstacking.cpp` line 586-600, `bonuses.cpp` line 1124-1149).
- McVaxius' Rousing Rondo: even when external v1/v2 haste is present, the ATK +12 and DS 8 riders still fully apply. The haste component is simply outranked.
- v3 haste is high priority for melee groups with Warriors but not universally locked — SK/Pal tanks and caster groups don't need it.

## Song Data

### Scope
- Level 1-60 songs only (61-65 added later)
- ~49 melody candidates across all modes
- ~34 excluded (CC, utility, speed — cast reactively, not twisted)

### Categories
- **Haste v1/v2** (conditional — only if no external source): Anthem de Arms, Vilia's Verses/Chorus, McVaxius BC, Verses of Victory, McVaxius Rousing Rondo
- **v3 Overhaste** (bard-exclusive): Battlecry/Warsong of the Vah Shir
- **Mana/HP Regen**: Hymn of Restoration, Cassindra's Chant/Chorus, Cantata of Soothing/Replenishment, Chorus of Replenishment (raid), Ancient Lcea's (raid)
- **Resist + Damage Shield**: All Psalms (Warmth/Vitality/Cooling/Purity/Mystic Shielding), Elemental/Purifying Rhythms, Elemental/Purifying Chorus (raid)
- **AC / Defensive**: Chant of Battle, Niv's Melody of Preservation, Shield of Songs, Niv's Harmonic (all lower value in Luclin)
- **Slow**: Largo's Melodic/Absonant Binding, Selo's Consonant Chain/Chords of Cessation/Assonant Strane, Angstlich's Assonance
- **DoTs + Resist Debuffs**: Tuyen chants (raid use for resist debuffs), Denon's Dirge/Discord/Bereavement, Fufil's, Occlusion of Sound
- **Not candidates**: CC (mez/charm/fear/lull), Utility (locate/identify/lev/invis/etc.), Speed (Selo's — 3min duration, not twisted)
- **Removed**: Nillipus' March of the Wee (rune consumed immediately on tank damage)

### Level 60 Values (key songs, before instrument mod)
| Song | Effect | Lv60 Value | Moddable |
|------|--------|-----------|----------|
| Warsong of the Vah Shir | v3 Overhaste | 25% | No |
| Battlecry of the Vah Shir | v3 Overhaste | 15% | No |
| Vilia's Chorus of Celerity | v1 Haste | 45% | No |
| McVaxius' Rousing Rondo | v1 Haste 20%, STR +21, ATK +12, DS 8 | Mixed | DS/ATK yes, haste no |
| McVaxius' Berserker Crescendo | v1 Haste 23%, STR +21, AC +31 | Mixed | Haste no, rest yes |
| Cantata of Replenishment | HP +12, Mana +11 | Yes | Yes |
| Ancient: Lcea's Lament | HP +16, Mana +15 (AE) | Yes | Yes |
| Cassindra's Chorus of Clarity | Mana +7 | Flat | No |
| Psalm of Cooling | FR +70, DS 11, AC +20 | Mixed | DS/AC yes, resist yes |
| Psalm of Veeshan (future, lv63) | All Resist +10, DS 2, AC +10 | Mixed | Yes |
| Selo's Assonant Strane | 40% slow, Snare (AE) | No | No |
| Largo's Melodic Binding | 35% slow, AC -35 (AE) | No (slow) | AC debuff yes |
| Denon's Desperate Dirge | HP -485 (AE) | Yes | Yes |
| Tuyen's Chant of Flame | HP -31, FR -17 | Yes | HP yes |

## Output Display

### Recommended Melody (4 songs)
- Song name, level, instrument type
- Effective values with instrument mod applied
- Score bar showing relative contribution
- Tag explaining selection (e.g., "v3 overhaste for 3 melee", "FR +70 — encounter locked")

### Runner-ups (3 songs)
- Each tagged with displacement reason:
  - "Dropped — external haste from Enchanter"
  - "Displaced by Psalm of Cooling — encounter requires FR"
  - "Outscored by Cantata of Replenishment"

### Modifier Table
- Grid: Percussion / Stringed / Brass / Wind / Singing
- Shows calculated modifier for each based on current gear/AA/clicky selections
- Updates in real-time

## File Structure

```
/tools/melody/
  index.html    — page structure, nav, styling
  melody.js     — algorithm, UI logic, event handlers
  songs.js      — song database + class weight config (editable)
```

- `songs.js` is the config file for tuning weights. Simple object literal at the top, easy to modify without touching algorithm code.
- No build step. jQuery loaded from CDN. Pure static files for Cloudflare Pages.
- Styles in `<style>` block using existing CSS variables from the site theme.

## Tech Stack
- HTML5 + CSS3 (Tavern Hearth theme via CSS custom properties)
- jQuery 3.7.1 (matches existing site)
- No additional libraries
- LocalStorage: optionally save last-used gear/AA configuration

## Responsive
- Desktop: inputs and results within `--content-width: 780px`
- Mobile (600px): single column, full-width dropdowns
