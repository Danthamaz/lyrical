# Melee Solo Sim Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a melee solo combat simulator to the Melody Recommender that brute-forces all 5-song combinations against a specific NPC to find the optimal sustainable DPS twist.

**Architecture:** A new `melee-sim.js` file contains the 16 song candidates and combat sim engine as a self-contained module (globals, no build step). The existing `melody.js` is extended with profile persistence, NPC search, and sim-result rendering. NPC data is a static JSON file extracted once from the Quarm DB via a Python script. The melee solo path completely bypasses the existing classWeight scoring.

**Tech Stack:** jQuery (existing), vanilla JS, Python 3 (one-time extraction script)

**Spec:** `docs/superpowers/specs/2026-04-03-melee-solo-sim-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `tools/melody/extract_npcs.py` | Create (temp) | One-time script: parse Quarm SQL, emit filtered NPC JSON |
| `tools/melody/npcs.json` | Create | Static NPC data for lookup (level 40–66, valid combat stats) |
| `tools/melody/melee-sim.js` | Create | 16 song candidates + combat sim engine (`runMeleeSim()`) |
| `tools/melody/index.html` | Modify | Add Melee button, profile panel, NPC panel, sim results, CSS, script tag |
| `tools/melody/melody.js` | Modify | Melee profile persistence, NPC loading/search, melee mode routing, sim rendering |
| `tools/melody/songs.js` | Modify | Add Jonthan's Inspiration + Brusco's Bombastic Bellow for non-melee modes |

---

### Task 1: Extract NPC JSON from Quarm DB

**Files:**
- Create: `tools/melody/extract_npcs.py`
- Create: `tools/melody/npcs.json`

The Quarm DB schema for `npc_types` has these relevant columns (0-indexed):

| Index | Column | Use |
|-------|--------|-----|
| 0 | id | NPC ID |
| 1 | name | NPC name |
| 3 | level | Level |
| 5 | class | EQ class ID |
| 7 | hp | Hit points |
| 13 | hp_regen_rate | HP regen/tick |
| 20 | mindmg | Minimum melee damage |
| 21 | maxdmg | Maximum melee damage |
| 23 | special_abilities | Encoded ability string |
| 43 | MR | Magic resist |
| 44 | CR | Cold resist |
| 45 | DR | Disease resist |
| 46 | FR | Fire resist |
| 47 | PR | Poison resist |
| 51 | AC | Armor class |
| 54 | attack_delay | Attack delay (lower = faster) |
| 66 | slow_mitigation | Slow mitigation % |
| 84 | combat_hp_regen | In-combat HP regen |

- [ ] **Step 1: Create the extraction script**

```python
# tools/melody/extract_npcs.py
"""
One-time script: extract solo-target NPCs from Quarm DB SQL into npcs.json.
Run from project root:  python tools/melody/extract_npcs.py

Reads:  C:/Apps/quarm/db/quarm_2026-03-20-09_37.sql
Writes: tools/melody/npcs.json
"""
import re, json

SQL_PATH = r'C:\Apps\quarm\db\quarm_2026-03-20-09_37.sql'
OUT_PATH = r'tools/melody/npcs.json'

# EQ class ID -> name
EQ_CLASSES = {
    1: 'Warrior', 2: 'Cleric', 3: 'Paladin', 4: 'Ranger',
    5: 'Shadowknight', 6: 'Druid', 7: 'Monk', 8: 'Bard',
    9: 'Rogue', 10: 'Shaman', 11: 'Necromancer', 12: 'Wizard',
    13: 'Magician', 14: 'Enchanter', 15: 'Beastlord',
    16: 'Berserker',
}

# Regex to capture each parenthesized row in INSERT INTO npc_types VALUES ...
ROW_RE = re.compile(r"\((\d+),'([^']*)',")

npcs = []
in_npc_types = False

with open(SQL_PATH, 'r', encoding='utf-8', errors='replace') as f:
    for line in f:
        if 'INSERT INTO `npc_types` VALUES' in line:
            in_npc_types = True
        if not in_npc_types:
            continue
        if line.startswith('INSERT INTO') and 'npc_types' not in line:
            in_npc_types = False
            continue

        # Split rows by '),(' but handle quoted strings with commas
        # Simpler: find each (id,'name', and parse from there
        # We process one INSERT block at a time; rows are separated by '),\n('
        # But they can also be on one massive line. Use a state-machine CSV approach.

        # Actually, just split the whole line by the row boundary pattern
        rows = re.split(r'\),\s*\(', line)
        for raw_row in rows:
            raw_row = raw_row.strip().lstrip('(').rstrip(');').rstrip(')')
            if not raw_row:
                continue

            # Parse fields respecting quoted strings
            fields = []
            i = 0
            current = ''
            in_quote = False
            while i < len(raw_row):
                ch = raw_row[i]
                if ch == "'" and not in_quote:
                    in_quote = True
                    current += ch
                elif ch == "'" and in_quote:
                    # Check for escaped quote ''
                    if i + 1 < len(raw_row) and raw_row[i + 1] == "'":
                        current += "''"
                        i += 2
                        continue
                    in_quote = False
                    current += ch
                elif ch == ',' and not in_quote:
                    fields.append(current.strip())
                    current = ''
                else:
                    current += ch
                i += 1
            if current.strip():
                fields.append(current.strip())

            if len(fields) < 85:
                continue

            def to_int(s):
                s = s.strip().strip("'")
                if s in ('NULL', ''):
                    return 0
                try:
                    return int(s)
                except ValueError:
                    return 0

            def to_float(s):
                s = s.strip().strip("'")
                if s in ('NULL', ''):
                    return 0.0
                try:
                    return float(s)
                except ValueError:
                    return 0.0

            npc_id = to_int(fields[0])
            name = fields[1].strip("'")
            level = to_int(fields[3])
            npc_class = to_int(fields[5])
            hp = to_int(fields[7])
            hp_regen = to_int(fields[13])
            mindmg = to_int(fields[20])
            maxdmg = to_int(fields[21])
            special = fields[23].strip("'") if len(fields) > 23 else ''
            mr = to_int(fields[43])
            cr = to_int(fields[44])
            dr = to_int(fields[45])
            fr = to_int(fields[46])
            pr = to_int(fields[47])
            ac = to_int(fields[51])
            attack_delay = to_int(fields[54])
            slow_mitigation = to_int(fields[66])
            combat_hp_regen = to_int(fields[84])

            # Filter: level 40-66, has HP and max damage, not a merchant/quest NPC
            if level < 40 or level > 66:
                continue
            if hp <= 0 or maxdmg <= 0:
                continue
            # Skip names starting with '#' (triggered/special spawns)
            if name.startswith('#'):
                continue

            class_name = EQ_CLASSES.get(npc_class, 'Unknown ({})'.format(npc_class))

            npcs.append({
                'id': npc_id,
                'name': name,
                'level': level,
                'class': class_name,
                'class_id': npc_class,
                'hp': hp,
                'hp_regen': hp_regen,
                'min_dmg': mindmg,
                'max_dmg': maxdmg,
                'ac': ac,
                'attack_delay': attack_delay,
                'slow_mitigation': slow_mitigation,
                'combat_hp_regen': combat_hp_regen,
                'resists': {'mr': mr, 'cr': cr, 'dr': dr, 'fr': fr, 'pr': pr},
                'special_abilities': special,
            })

# Sort by level then name
npcs.sort(key=lambda n: (n['level'], n['name']))

# Remove duplicates by id (keep first occurrence)
seen = set()
unique = []
for npc in npcs:
    if npc['id'] not in seen:
        seen.add(npc['id'])
        unique.append(npc)

print(f'Extracted {len(unique)} NPCs (level 40-66)')
with open(OUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(unique, f, separators=(',', ':'))
print(f'Written to {OUT_PATH}')
```

- [ ] **Step 2: Run the extraction**

Run: `cd C:/Apps/lyrical && python tools/melody/extract_npcs.py`

Expected: prints count of NPCs and creates `tools/melody/npcs.json`.

- [ ] **Step 3: Verify blood_of_chottal is correct**

Run: `python -c "import json; d=json.load(open('tools/melody/npcs.json')); npc=[n for n in d if n['id']==89018]; print(json.dumps(npc,indent=2))"`

Expected output should show:
- name: blood_of_chottal
- level: 55, hp: 14275, min_dmg: 41, max_dmg: 147
- resists: mr: 35, cr: 35, dr: 25, fr: 35, pr: 25

- [ ] **Step 4: Check file size**

Run: `ls -lh tools/melody/npcs.json`

Should be a few MB at most. If over 5MB, add more aggressive filtering.

- [ ] **Step 5: Commit**

```bash
git add tools/melody/extract_npcs.py tools/melody/npcs.json
git commit -m "feat(melody): extract NPC data for melee solo sim"
```

---

### Task 2: Add Jonthan's Inspiration and Brusco's Bombastic Bellow to songs.js

**Files:**
- Modify: `tools/melody/songs.js` (append before closing `];` at line 1040)

These two songs are needed in songs.js for the non-melee modes (they'll appear with classWeights). They're also defined separately in the melee sim candidates with sim-specific properties.

- [ ] **Step 1: Add Jonthan's Inspiration**

Add before the closing `];` of the SONGS array in `tools/melody/songs.js`:

```javascript
  // -------------------------------------------------------------------------
  // Self Haste (Jonthan's Inspiration)
  // -------------------------------------------------------------------------

  {
    id: 1762,
    name: "Jonthan's Inspiration",
    level: 58,
    instrument: 'singing',
    category: 'haste_v1v2',
    eliminateIf: ['haster'],
    effects: [
      { type: 'AttackSpeed', value: 161, moddable: false, label: '61% haste' },
      { type: 'STR',         value: 17,  moddable: true  },
      { type: 'ATK',         value: 13,  moddable: true  }
    ],
    classWeights: {
      warrior: 0.90, rogue: 0.85, monk: 0.85, ranger: 0.75,
      beastlord: 0.70, bard: 0.70, paladin: 0.50, shadowknight: 0.50,
      cleric: 0.05, druid: 0.05, shaman: 0.05, necromancer: 0.0,
      wizard: 0.0, magician: 0.0, enchanter: 0.0
    }
  },
```

- [ ] **Step 2: Add Brusco's Bombastic Bellow**

Add immediately after Jonthan's:

```javascript
  // -------------------------------------------------------------------------
  // Stun DD (Brusco's Bombastic Bellow)
  // -------------------------------------------------------------------------

  {
    id: 1754,
    name: "Brusco's Bombastic Bellow",
    level: 53,
    instrument: 'singing',
    category: 'stun_dd',
    soloOnly: true,
    effects: [
      { type: 'Stun',    value: 8, moddable: false, label: '8s stun' },
      { type: 'HP', value: -222, moddable: false, label: '222 DD' }
    ],
    classWeights: {
      warrior: 0.0, cleric: 0.0, paladin: 0.0, ranger: 0.0,
      shadowknight: 0.0, druid: 0.0, monk: 0.0, bard: 0.80,
      rogue: 0.0, shaman: 0.0, necromancer: 0.0, wizard: 0.0,
      magician: 0.0, enchanter: 0.0, beastlord: 0.0
    }
  },
```

- [ ] **Step 3: Verify existing modes still work**

Open `http://localhost:8080/tools/melody/` in a browser. Switch between Group, Raid, Solo modes. Confirm no JS errors in console and results still render.

- [ ] **Step 4: Commit**

```bash
git add tools/melody/songs.js
git commit -m "feat(melody): add Jonthan's Inspiration and Brusco's Bombastic Bellow"
```

---

### Task 3: Add Melee button and UI scaffolding to index.html

**Files:**
- Modify: `tools/melody/index.html`

- [ ] **Step 1: Add Melee button to solo panel**

In `tools/melody/index.html`, find the solo style buttons (line 178-182):
```html
      <div class="solo-style">
        <button class="solo-btn active" data-style="kiting">Kiting</button>
        <button class="solo-btn" data-style="swarming">Swarming</button>
        <button class="solo-btn" data-style="charm">Charm</button>
      </div>
```

Replace with:
```html
      <div class="solo-style">
        <button class="solo-btn active" data-style="kiting">Kiting</button>
        <button class="solo-btn" data-style="swarming">Swarming</button>
        <button class="solo-btn" data-style="charm">Charm</button>
        <button class="solo-btn" data-style="melee">Melee</button>
      </div>
```

- [ ] **Step 2: Add character profile panel HTML**

Add immediately after the closing `</div>` of `#mode-solo` (after line 183), before the encounter panel:

```html
    <!-- Melee Solo: Character Profile -->
    <div class="melee-panel" id="melee-profile" style="display:none;">
      <h3 class="melee-panel-title">Character Profile</h3>
      <div class="melee-profile-grid">
        <div class="melee-field">
          <label for="mp-level">Level</label>
          <input type="number" id="mp-level" value="60" min="1" max="65">
        </div>
        <div class="melee-field">
          <label for="mp-hp">Max HP</label>
          <input type="number" id="mp-hp" value="3353" min="1">
        </div>
        <div class="melee-field">
          <label for="mp-regen">HP / Tick</label>
          <input type="number" id="mp-regen" value="13" min="0">
        </div>
        <div class="melee-field">
          <label for="mp-item-haste">Item Haste %</label>
          <input type="number" id="mp-item-haste" value="36" min="0" max="100">
        </div>
        <div class="melee-field">
          <label for="mp-buff-haste">Buff Haste %</label>
          <input type="number" id="mp-buff-haste" value="40" min="0" max="100">
        </div>
        <div class="melee-field">
          <label for="mp-ds">Always-on DS</label>
          <input type="number" id="mp-ds" value="0" min="0">
        </div>
      </div>
      <h3 class="melee-panel-title" style="margin-top:1rem;">Weapons</h3>
      <div class="melee-weapon-grid">
        <div class="melee-weapon">
          <div class="melee-weapon-label">Primary</div>
          <div class="melee-field">
            <label for="mp-pri-name">Name</label>
            <input type="text" id="mp-pri-name" value="Scimitar of Shissar Slaying">
          </div>
          <div class="melee-field-row">
            <div class="melee-field">
              <label for="mp-pri-dmg">Base Dmg</label>
              <input type="number" id="mp-pri-dmg" value="15" min="0">
            </div>
            <div class="melee-field">
              <label for="mp-pri-bonus">Bonus Dmg</label>
              <input type="number" id="mp-pri-bonus" value="11" min="0">
            </div>
            <div class="melee-field">
              <label for="mp-pri-delay">Delay</label>
              <input type="number" id="mp-pri-delay" value="19" min="1">
            </div>
          </div>
        </div>
        <div class="melee-weapon">
          <div class="melee-weapon-label">Secondary</div>
          <div class="melee-field">
            <label for="mp-sec-name">Name</label>
            <input type="text" id="mp-sec-name" value="Singing Short Sword">
          </div>
          <div class="melee-field-row">
            <div class="melee-field">
              <label for="mp-sec-dmg">Base Dmg</label>
              <input type="number" id="mp-sec-dmg" value="16" min="0">
            </div>
            <div class="melee-field">
              <label for="mp-sec-bonus">Bonus Dmg</label>
              <input type="number" id="mp-sec-bonus" value="0" min="0">
            </div>
            <div class="melee-field">
              <label for="mp-sec-delay">Delay</label>
              <input type="number" id="mp-sec-delay" value="25" min="1">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Melee Solo: NPC Lookup -->
    <div class="melee-panel" id="melee-npc" style="display:none;">
      <h3 class="melee-panel-title">NPC Target</h3>
      <div class="melee-field" style="margin-bottom:0.75rem;">
        <label for="npc-search">Search by ID or Name</label>
        <input type="text" id="npc-search" placeholder="e.g. 89018 or blood_of_chottal">
      </div>
      <div id="npc-results" style="display:none;"></div>
      <div id="npc-selected" style="display:none;">
        <div class="npc-stat-grid" id="npc-stat-grid"></div>
      </div>
    </div>
```

- [ ] **Step 3: Add sim results HTML below existing results**

Find the runner-ups div (line 350):
```html
    <div id="melody-runnerups"></div>
```

Add after it:
```html
    <!-- Melee Sim Results (hidden unless melee mode) -->
    <div id="melee-sim-output" style="display:none;">
      <div class="section-title"><h2>Combat Summary</h2></div>
      <div id="melee-combat-summary"></div>
      <div class="section-title"><h2>Runner-Up Melodies</h2></div>
      <div id="melee-runnerups"></div>
    </div>
```

- [ ] **Step 4: Add CSS for melee panels**

Add to the `<style>` block in `index.html` (before the closing `</style>` tag):

```css
    /* Melee panels */
    .melee-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 5px; padding: 1rem; margin-bottom: 1.5rem; }
    .melee-panel-title { color: var(--accent); font-family: Georgia, serif; font-size: 0.85rem; font-weight: normal; letter-spacing: 0.06em; text-transform: uppercase; margin: 0 0 0.75rem; }
    .melee-profile-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
    .melee-weapon-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .melee-weapon-label { color: var(--accent); font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 0.5rem; }
    .melee-field label { display: block; color: var(--text-muted); font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 0.3rem; }
    .melee-field input[type="number"], .melee-field input[type="text"] {
      width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: 4px;
      color: var(--text); font-size: 0.85rem; padding: 0.4rem 0.5rem; font-family: inherit;
      box-sizing: border-box;
    }
    .melee-field input:focus { border-color: var(--accent-muted); outline: none; }
    .melee-field-row { display: flex; gap: 0.5rem; }
    .melee-field-row .melee-field { flex: 1; }

    /* NPC lookup */
    #npc-search { width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: 4px; color: var(--text); font-size: 0.85rem; padding: 0.5rem 0.6rem; font-family: inherit; box-sizing: border-box; }
    #npc-search:focus { border-color: var(--accent-muted); outline: none; }
    #npc-results { max-height: 200px; overflow-y: auto; border: 1px solid var(--border); border-radius: 4px; margin-bottom: 0.75rem; }
    .npc-result-item { padding: 0.4rem 0.6rem; cursor: pointer; font-size: 0.85rem; color: var(--text-body); border-bottom: 1px solid var(--border-subtle); }
    .npc-result-item:hover { background: rgba(212,130,74,0.08); color: var(--accent); }
    .npc-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem; font-size: 0.82rem; }
    .npc-stat { color: var(--text-body); }
    .npc-stat strong { color: var(--accent); }

    /* Melee sim results */
    .sim-summary { background: var(--surface); border: 1px solid var(--border); border-radius: 5px; padding: 1rem; margin-bottom: 1rem; }
    .sim-summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.3rem; font-size: 0.85rem; }
    .sim-stat-label { color: var(--text-muted); }
    .sim-stat-value { color: var(--text-body); text-align: right; font-variant-numeric: tabular-nums; }
    .sim-stat-value.sustainable { color: #6a9955; }
    .sim-stat-value.unsustainable { color: #d4564a; }
    .sim-contribution { color: var(--text-muted); font-size: 0.78rem; margin-top: 0.15rem; }
    .melee-runnerup { background: var(--surface); border: 1px solid var(--border); border-radius: 5px; padding: 0.6rem 0.8rem; margin-bottom: 0.4rem; opacity: 0.7; font-size: 0.82rem; }
    .melee-runnerup-songs { color: var(--text-body); }
    .melee-runnerup-stats { color: var(--text-muted); font-size: 0.78rem; margin-top: 0.2rem; }
    .melee-runnerup .sustainable { color: #6a9955; }
    .melee-runnerup .unsustainable { color: #d4564a; }

    @media (max-width: 600px) {
      .melee-profile-grid { grid-template-columns: repeat(2, 1fr); }
      .melee-weapon-grid { grid-template-columns: 1fr; }
      .npc-stat-grid { grid-template-columns: repeat(2, 1fr); }
    }
```

- [ ] **Step 5: Add melee-sim.js script tag**

Find the script tags at the bottom of `index.html` (line 358-359):
```html
  <script src="/tools/melody/songs.js"></script>
  <script src="/tools/melody/melody.js"></script>
```

Replace with:
```html
  <script src="/tools/melody/songs.js"></script>
  <script src="/tools/melody/melee-sim.js"></script>
  <script src="/tools/melody/melody.js"></script>
```

- [ ] **Step 6: Verify page loads without errors**

Open `http://localhost:8080/tools/melody/`. Console should show no errors (melee-sim.js doesn't exist yet, so expect a 404 — that's fine for now, it won't break anything since script loading is non-blocking and nothing references it yet).

- [ ] **Step 7: Commit**

```bash
git add tools/melody/index.html
git commit -m "feat(melody): add melee solo UI scaffolding"
```

---

### Task 4: Create melee-sim.js — song candidates and sim engine

**Files:**
- Create: `tools/melody/melee-sim.js`

This is the core of the feature. It defines the 16 melee song candidates with sim-specific data and the combat simulation engine.

- [ ] **Step 1: Create melee-sim.js with song candidates**

Create `tools/melody/melee-sim.js`:

```javascript
/**
 * melee-sim.js — Melee Solo Combat Simulator
 *
 * Self-contained module for the melee solo mode. Defines the 16 song
 * candidates with sim-specific properties and the combat simulation
 * engine that brute-forces all C(16,5) = 4368 five-song combinations.
 *
 * Depends on songs.js globals for INSTRUMENTS, INSTRUMENT_SOFT_CAP,
 * AA_MODS only (for instrument modifier lookups).
 * Called from melody.js when mode=solo, style=melee.
 */

// -------------------------------------------------------------------------
// MELEE SONG CANDIDATES
// -------------------------------------------------------------------------
//
// Each song has sim-specific properties rather than classWeights.
// Effect values that scale with level use {min, max, minLvl, maxLvl}.
// The sim interpolates based on the player's level.
//
// hasteType: 'v3' | 'v1v2' | null
// slowPct:   0-100 (attack speed reduction on mob)
// Tags help the sim categorize contributions.

var MELEE_SONGS = [

  // --- Haste ---

  {
    id: 2610,
    name: "Warsong of the Vah Shir",
    instrument: 'brass',
    hasteType: 'v3',
    hastePct: 25,
    slowPct: 0,
    dotPerTick: 0,
    dsValue: 0,
    stunSec: 0,
    ddDmg: 0,
    hpRegenPerTick: 0,
    acBonus: 0,
    absorbPerHit: 0,
    strBonus: 0,
    atkBonus: 0,
    isAmplification: false,
    levelScaled: false
  },

  {
    id: 1762,
    name: "Jonthan's Inspiration",
    instrument: 'singing',
    hasteType: 'v1v2',
    hastePct: { min: 61, max: 66, minLvl: 58, maxLvl: 63 },
    slowPct: 0,
    dotPerTick: 0,
    dsValue: 0,
    stunSec: 0,
    ddDmg: 0,
    hpRegenPerTick: 0,
    acBonus: 0,
    absorbPerHit: 0,
    strBonus: { min: 17, max: 19, minLvl: 58, maxLvl: 65 },
    atkBonus: { min: 13, max: 14, minLvl: 58, maxLvl: 65 },
    isAmplification: false,
    levelScaled: true
  },

  {
    id: 1760,
    name: "McVaxius' Rousing Rondo",
    instrument: 'brass',
    hasteType: 'v1v2',
    hastePct: { min: 19, max: 20, minLvl: 57, maxLvl: 65 },
    slowPct: 0,
    dotPerTick: 0,
    dsValue: { min: 8, max: 8, minLvl: 57, maxLvl: 65, moddable: true },
    stunSec: 0,
    ddDmg: 0,
    hpRegenPerTick: 0,
    acBonus: 0,
    absorbPerHit: 0,
    strBonus: { min: 20, max: 22, minLvl: 57, maxLvl: 65 },
    atkBonus: { min: 11, max: 12, minLvl: 57, maxLvl: 65 },
    isAmplification: false,
    levelScaled: true
  },

  // --- Slow ---

  {
    id: 738,
    name: "Selo's Consonant Chain",
    instrument: 'singing',
    hasteType: null,
    hastePct: 0,
    slowPct: 40,
    dotPerTick: 0,
    dsValue: 0,
    stunSec: 0,
    ddDmg: 0,
    hpRegenPerTick: 0,
    acBonus: 0,
    absorbPerHit: 0,
    strBonus: 0,
    atkBonus: 0,
    isAmplification: false,
    levelScaled: false
  },

  {
    id: 1758,
    name: "Selo's Assonant Strane",
    instrument: 'stringed',
    hasteType: null,
    hastePct: 0,
    slowPct: 40,
    dotPerTick: 0,
    dsValue: 0,
    stunSec: 0,
    ddDmg: 0,
    hpRegenPerTick: 0,
    acBonus: 0,
    absorbPerHit: 0,
    strBonus: 0,
    atkBonus: 0,
    isAmplification: false,
    levelScaled: false
  },

  {
    id: 705,
    name: "Largo's Melodic Binding",
    instrument: 'singing',
    hasteType: null,
    hastePct: 0,
    slowPct: 35,
    dotPerTick: 0,
    dsValue: 0,
    stunSec: 0,
    ddDmg: 0,
    hpRegenPerTick: 0,
    acBonus: 0,
    absorbPerHit: 0,
    strBonus: 0,
    atkBonus: 0,
    isAmplification: false,
    levelScaled: false
  },

  {
    id: 1751,
    name: "Largo's Absonant Binding",
    instrument: 'singing',
    hasteType: null,
    hastePct: 0,
    slowPct: 35,
    dotPerTick: 0,
    dsValue: 0,
    stunSec: 0,
    ddDmg: 0,
    hpRegenPerTick: 0,
    acBonus: 0,
    absorbPerHit: 0,
    strBonus: 0,
    atkBonus: 0,
    isAmplification: false,
    levelScaled: false
  },

  {
    id: 746,
    name: "Selo's Chords of Cessation",
    instrument: 'stringed',
    hasteType: null,
    hastePct: 0,
    slowPct: 25,
    dotPerTick: { min: 26, max: 35, minLvl: 48, maxLvl: 65, moddable: true },
    dsValue: 0,
    stunSec: 0,
    ddDmg: 0,
    hpRegenPerTick: 0,
    acBonus: 0,
    absorbPerHit: 0,
    strBonus: 0,
    atkBonus: 0,
    isAmplification: false,
    levelScaled: true
  },

  // --- DoTs ---

  {
    id: 744,
    name: "Tuyen's Chant of Frost",
    instrument: 'percussion',
    hasteType: null,
    hastePct: 0,
    slowPct: 0,
    dotPerTick: { min: 24, max: 34, minLvl: 46, maxLvl: 65, moddable: true },
    dsValue: 0,
    stunSec: 0,
    ddDmg: 0,
    hpRegenPerTick: 0,
    acBonus: 0,
    absorbPerHit: 0,
    strBonus: 0,
    atkBonus: 0,
    isAmplification: false,
    levelScaled: true
  },

  {
    id: 743,
    name: "Tuyen's Chant of Flame",
    instrument: 'percussion',
    hasteType: null,
    hastePct: 0,
    slowPct: 0,
    dotPerTick: { min: 20, max: 34, minLvl: 38, maxLvl: 65, moddable: true },
    dsValue: 0,
    stunSec: 0,
    ddDmg: 0,
    hpRegenPerTick: 0,
    acBonus: 0,
    absorbPerHit: 0,
    strBonus: 0,
    atkBonus: 0,
    isAmplification: false,
    levelScaled: true
  },

  // --- Defensive / Regen ---

  {
    id: 1196,
    name: "Ancient: Lcea's Lament",
    instrument: 'stringed',
    hasteType: null,
    hastePct: 0,
    slowPct: 0,
    dotPerTick: 0,
    dsValue: 0,
    stunSec: 0,
    ddDmg: 0,
    hpRegenPerTick: { min: 16, max: 17, minLvl: 60, maxLvl: 65, moddable: true },
    acBonus: 0,
    absorbPerHit: 0,
    strBonus: 0,
    atkBonus: 0,
    isAmplification: false,
    levelScaled: true
  },

  {
    id: 1763,
    name: "Niv's Harmonic",
    instrument: 'singing',
    hasteType: null,
    hastePct: 0,
    slowPct: 0,
    dotPerTick: 0,
    dsValue: 0,
    stunSec: 0,
    ddDmg: 0,
    hpRegenPerTick: 0,
    acBonus: 23,
    absorbPerHit: 10,
    strBonus: 0,
    atkBonus: 0,
    isAmplification: false,
    levelScaled: false
  },

  {
    id: 748,
    name: "Niv's Melody of Preservation",
    instrument: 'stringed',
    hasteType: null,
    hastePct: 0,
    slowPct: 0,
    dotPerTick: 0,
    dsValue: 0,
    stunSec: 0,
    ddDmg: 0,
    hpRegenPerTick: { min: 6, max: 9, minLvl: 47, maxLvl: 65, moddable: true },
    acBonus: 0,
    absorbPerHit: 10,
    strBonus: 10,
    atkBonus: 0,
    isAmplification: false,
    levelScaled: true
  },

  {
    id: 713,
    name: "Psalm of Cooling",
    instrument: 'singing',
    hasteType: null,
    hastePct: 0,
    slowPct: 0,
    dotPerTick: 0,
    dsValue: { min: 7, max: 12, minLvl: 33, maxLvl: 65, moddable: true },
    stunSec: 0,
    ddDmg: 0,
    hpRegenPerTick: 0,
    acBonus: { min: 3, max: 5, minLvl: 33, maxLvl: 65 },
    absorbPerHit: 0,
    strBonus: 0,
    atkBonus: 0,
    isAmplification: false,
    levelScaled: true
  },

  // --- Utility ---

  {
    id: 1754,
    name: "Brusco's Bombastic Bellow",
    instrument: 'singing',
    hasteType: null,
    hastePct: 0,
    slowPct: 0,
    dotPerTick: 0,
    dsValue: 0,
    stunSec: 8,
    ddDmg: 222,
    hpRegenPerTick: 0,
    acBonus: 0,
    absorbPerHit: 0,
    strBonus: 0,
    atkBonus: 0,
    isAmplification: false,
    levelScaled: false
  },

  // --- Amplification (takes a melody slot) ---

  {
    id: 9999,
    name: "Amplification",
    instrument: 'singing',
    hasteType: null,
    hastePct: 0,
    slowPct: 0,
    dotPerTick: 0,
    dsValue: 0,
    stunSec: 0,
    ddDmg: 0,
    hpRegenPerTick: 0,
    acBonus: 0,
    absorbPerHit: 0,
    strBonus: 0,
    atkBonus: 0,
    isAmplification: true,
    levelScaled: false
  }

];

// -------------------------------------------------------------------------
// HELPERS
// -------------------------------------------------------------------------

/**
 * Interpolate a level-scaled value. If val is a plain number, return it.
 * If val is {min, max, minLvl, maxLvl}, interpolate linearly and clamp.
 */
function meleeScaleValue(val, playerLevel) {
  if (typeof val === 'number') return val;
  if (!val || !val.minLvl) return 0;
  if (playerLevel <= val.minLvl) return val.min;
  if (playerLevel >= val.maxLvl) return val.max;
  var t = (playerLevel - val.minLvl) / (val.maxLvl - val.minLvl);
  return Math.round(val.min + t * (val.max - val.min));
}

/**
 * Get the instrument modifier multiplier for a given instrument type.
 * Uses the global calcModifiers() result from melody.js.
 */
function meleeGetInstMod(mods, instrumentType) {
  if (mods[instrumentType]) return mods[instrumentType].multiplier;
  return 1.0;
}

/**
 * Resolve a song effect value, applying level scaling and instrument mod.
 */
function meleeResolveEffect(val, playerLevel, mods, instrumentType) {
  var base = meleeScaleValue(val, playerLevel);
  if (typeof val === 'object' && val.moddable) {
    base = base * meleeGetInstMod(mods, instrumentType);
  }
  return base;
}

// -------------------------------------------------------------------------
// COMBAT SIMULATION
// -------------------------------------------------------------------------

/**
 * Simulate one 5-song combo vs an NPC. Returns a result object.
 *
 * @param {Array} combo - Array of 5 song objects from MELEE_SONGS
 * @param {Object} profile - Player profile {level, maxHp, hpPerTick, itemHaste,
 *                           buffHaste, priDmg, priBonus, priDelay, secDmg,
 *                           secBonus, secDelay, alwaysOnDs}
 * @param {Object} npc - NPC data {level, hp, min_dmg, max_dmg, attack_delay,
 *                       ac, resists, slow_mitigation, combat_hp_regen, hp_regen}
 * @param {Object} mods - Instrument modifier map from calcModifiers()
 */
function simCombo(combo, profile, npc, mods) {
  var lvl = profile.level;

  // Check if Amplification is in the combo — if so, boost singing mods
  var hasAmp = combo.some(function (s) { return s.isAmplification; });
  var effectiveMods = mods;
  if (hasAmp) {
    // Clone mods and boost singing multiplier by Amplification's effect
    // Amplification adds +9 to singing modifier (at level 60)
    effectiveMods = {};
    for (var k in mods) {
      effectiveMods[k] = { multiplier: mods[k].multiplier };
    }
    if (effectiveMods.singing) {
      var ampBonus = 9; // Amplification effect at lv60
      var newTotal = mods.singing.total + ampBonus;
      var cap = INSTRUMENT_SOFT_CAP + (mods.singing.aaMod || 0);
      if (newTotal > cap) newTotal = cap;
      effectiveMods.singing = { multiplier: newTotal / 10, total: newTotal, aaMod: mods.singing.aaMod };
    }
  }

  // --- 1. Haste calculation ---
  var v3Haste = 0;
  var bestV1V2Haste = profile.buffHaste;

  combo.forEach(function (song) {
    if (song.hasteType === 'v3') {
      v3Haste = Math.max(v3Haste, song.hastePct);
    } else if (song.hasteType === 'v1v2') {
      var h = meleeScaleValue(song.hastePct, lvl);
      bestV1V2Haste = Math.max(bestV1V2Haste, h);
    }
  });

  var totalHaste = profile.itemHaste + bestV1V2Haste + v3Haste;
  var hasteMult = 1 + totalHaste / 100;

  // --- 2. Player melee DPS ---
  // DPS = (bonusDmg + baseDmg) / (delay / 10 / hasteMult)
  // EQ delay is in tenths of a second, so delay 19 = 1.9 seconds base
  var priSwingTime = (profile.priDelay / 10) / hasteMult;
  var secSwingTime = (profile.secDelay / 10) / hasteMult;

  // Gather song bonuses
  var totalStr = 0;
  var totalAtk = 0;
  combo.forEach(function (song) {
    totalStr += meleeResolveEffect(song.strBonus, lvl, effectiveMods, song.instrument);
    totalAtk += meleeResolveEffect(song.atkBonus, lvl, effectiveMods, song.instrument);
  });

  // Simplified damage model: avg damage = bonusDmg + baseDmg * avgMitFactor
  // avgMitFactor approximation: ~1.55 (from /mystats average)
  var AVG_MIT_FACTOR = 1.55;
  var priAvgDmg = profile.priBonus + profile.priDmg * AVG_MIT_FACTOR;
  var secAvgDmg = profile.secBonus + profile.secDmg * AVG_MIT_FACTOR;

  // ATK/STR bonus: approximate as +1 avg dmg per 15 ATK, +1 per 20 STR
  var atkDmgBonus = totalAtk / 15 + totalStr / 20;
  priAvgDmg += atkDmgBonus;
  secAvgDmg += atkDmgBonus;

  var priDps = priAvgDmg / priSwingTime;
  // Secondary has reduced hit rate: ~62% at level 60
  var DUAL_WIELD_RATE = 0.62;
  var secDps = (secAvgDmg / secSwingTime) * DUAL_WIELD_RATE;
  var meleeDps = priDps + secDps;

  // --- 3. Song DPS (DoTs + DS + DD) ---
  var totalDotPerTick = 0;
  var totalDs = profile.alwaysOnDs;
  var stunSec = 0;
  var ddDmg = 0;

  combo.forEach(function (song) {
    totalDotPerTick += meleeResolveEffect(song.dotPerTick, lvl, effectiveMods, song.instrument);
    totalDs += meleeResolveEffect(song.dsValue, lvl, effectiveMods, song.instrument);
    if (song.stunSec > 0) stunSec = song.stunSec;
    if (song.ddDmg > 0) ddDmg = song.ddDmg;
  });

  // DoT DPS: ticks are 6 seconds apart
  var dotDps = totalDotPerTick / 6;

  // DS DPS: damage shield fires on every mob melee hit
  // Mob attacks per second = 1 / (attack_delay / 10) — delay is in tenths
  var mobDelay = npc.attack_delay > 0 ? npc.attack_delay : 30; // default 30 = 3.0s
  var mobAttacksPerSec = 1 / (mobDelay / 10);
  var dsDps = totalDs * mobAttacksPerSec;

  // --- 4. Stun / DD contribution (Brusco's) ---
  // Twist cycle: 5 songs * 3 sec each = 15 sec
  var TWIST_CYCLE = 15;
  // Stun uptime: stun fires once per cycle, lasts stunSec
  // But mobs can resist. Rough resist rate based on level diff:
  // Same level: ~30% resist. +5 levels: ~50% resist.
  var stunResistRate = 0.30 + Math.max(0, npc.level - lvl) * 0.04;
  stunResistRate = Math.min(stunResistRate, 0.80);
  var effectiveStunSec = stunSec * (1 - stunResistRate);
  var stunUptimeRatio = effectiveStunSec / TWIST_CYCLE;

  var ddDps = ddDmg * (1 - stunResistRate) / TWIST_CYCLE;

  // --- 5. Incoming mob DPS ---
  var mobAvgDmg = (npc.min_dmg + npc.max_dmg) / 2;
  var mobBaseDps = mobAvgDmg * mobAttacksPerSec;

  // Apply slow
  var bestSlow = 0;
  combo.forEach(function (song) {
    if (song.slowPct > bestSlow) bestSlow = song.slowPct;
  });
  // Apply mob slow mitigation
  var effectiveSlow = bestSlow * (1 - (npc.slow_mitigation || 0) / 100);
  var mobSlowedDps = mobBaseDps * (1 - effectiveSlow / 100);

  // Reduce by stun uptime
  var mobEffectiveDps = mobSlowedDps * (1 - stunUptimeRatio);

  // AC / absorb reduction
  var totalAcBonus = 0;
  var totalAbsorb = 0;
  combo.forEach(function (song) {
    totalAcBonus += meleeResolveEffect(song.acBonus, lvl, effectiveMods, song.instrument);
    totalAbsorb += meleeResolveEffect(song.absorbPerHit, lvl, effectiveMods, song.instrument);
  });
  // Rough AC model: each 10 AC reduces avg hit by ~1
  var acReduction = totalAcBonus / 10;
  // Absorb: flat reduction per hit
  var perHitReduction = acReduction + totalAbsorb;
  var mobReducedDps = mobEffectiveDps - (perHitReduction * mobAttacksPerSec);
  if (mobReducedDps < 0) mobReducedDps = 0;

  // --- 6. Survivability ---
  var totalHpRegenPerTick = profile.hpPerTick;
  combo.forEach(function (song) {
    totalHpRegenPerTick += meleeResolveEffect(song.hpRegenPerTick, lvl, effectiveMods, song.instrument);
  });
  var regenPerSec = totalHpRegenPerTick / 6;

  var netIncomingDps = mobReducedDps - regenPerSec;
  var timeToDie = netIncomingDps > 0 ? profile.maxHp / netIncomingDps : Infinity;

  var totalPlayerDps = meleeDps + dotDps + dsDps + ddDps;

  // Account for mob regen
  var mobRegenPerSec = ((npc.combat_hp_regen || 0) + (npc.hp_regen || 0)) / 6;
  var netPlayerDps = totalPlayerDps - mobRegenPerSec;
  if (netPlayerDps < 0) netPlayerDps = 0;

  var timeToKill = netPlayerDps > 0 ? npc.hp / netPlayerDps : Infinity;

  var sustainable = timeToKill < timeToDie;
  var survivalMargin = timeToDie - timeToKill;

  return {
    combo: combo,
    totalHaste: totalHaste,
    meleeDps: meleeDps,
    dotDps: dotDps,
    dsDps: dsDps,
    ddDps: ddDps,
    totalPlayerDps: totalPlayerDps,
    mobBaseDps: mobBaseDps,
    mobSlowedDps: mobSlowedDps,
    mobEffectiveDps: mobEffectiveDps,
    mobReducedDps: mobReducedDps,
    regenPerSec: regenPerSec,
    netIncomingDps: netIncomingDps,
    slowPct: effectiveSlow,
    stunUptimeRatio: stunUptimeRatio,
    timeToDie: timeToDie,
    timeToKill: timeToKill,
    sustainable: sustainable,
    survivalMargin: survivalMargin
  };
}

/**
 * Run the full melee sim: brute-force all C(16,5) combos and rank them.
 *
 * @returns {Object} { best: result, runnerUps: [result, ...] }
 */
function runMeleeSim(profile, npc, mods) {
  var songs = MELEE_SONGS;
  var n = songs.length;
  var results = [];

  // Generate all C(n,5) combinations
  for (var a = 0; a < n - 4; a++) {
    for (var b = a + 1; b < n - 3; b++) {
      for (var c = b + 1; c < n - 2; c++) {
        for (var d = c + 1; d < n - 1; d++) {
          for (var e = d + 1; e < n; e++) {
            var combo = [songs[a], songs[b], songs[c], songs[d], songs[e]];
            results.push(simCombo(combo, profile, npc, mods));
          }
        }
      }
    }
  }

  // Sort: sustainable first (desc), then by timeToKill (asc = faster kill)
  results.sort(function (x, y) {
    if (x.sustainable && !y.sustainable) return -1;
    if (!x.sustainable && y.sustainable) return 1;
    if (x.sustainable && y.sustainable) return x.timeToKill - y.timeToKill;
    // Both unsustainable: higher survival margin (less negative) first
    return y.survivalMargin - x.survivalMargin;
  });

  return {
    best: results[0] || null,
    runnerUps: results.slice(1, 6)
  };
}
```

- [ ] **Step 2: Verify file loads without errors**

Open `http://localhost:8080/tools/melody/` in browser. Check console — no JS errors. Type `MELEE_SONGS.length` in console, expect `16`. Type `typeof runMeleeSim` in console, expect `"function"`.

- [ ] **Step 3: Commit**

```bash
git add tools/melody/melee-sim.js
git commit -m "feat(melody): add melee sim engine with 16 song candidates"
```

---

### Task 5: Character profile persistence in melody.js

**Files:**
- Modify: `tools/melody/melody.js`

- [ ] **Step 1: Add profile save/restore functions**

In `tools/melody/melody.js`, add after the `restoreGearState()` function (after line 90), before the `// INIT` section:

```javascript
  // -------------------------------------------------------------------------
  // MELEE PROFILE PERSISTENCE
  // -------------------------------------------------------------------------

  var MELEE_STORAGE_KEY = 'lyrical_melody_melee_profile';

  var MELEE_FIELDS = [
    'mp-level', 'mp-hp', 'mp-regen', 'mp-item-haste', 'mp-buff-haste', 'mp-ds',
    'mp-pri-name', 'mp-pri-dmg', 'mp-pri-bonus', 'mp-pri-delay',
    'mp-sec-name', 'mp-sec-dmg', 'mp-sec-bonus', 'mp-sec-delay'
  ];

  function saveMeleeProfile() {
    var state = {};
    MELEE_FIELDS.forEach(function (id) {
      state[id] = $('#' + id).val();
    });
    localStorage.setItem(MELEE_STORAGE_KEY, JSON.stringify(state));
  }

  function restoreMeleeProfile() {
    var raw = localStorage.getItem(MELEE_STORAGE_KEY);
    if (!raw) return;
    try {
      var state = JSON.parse(raw);
      MELEE_FIELDS.forEach(function (id) {
        if (state[id] !== undefined) {
          $('#' + id).val(state[id]);
        }
      });
    } catch (e) { /* ignore corrupt state */ }
  }

  function getMeleeProfile() {
    return {
      level:      parseInt($('#mp-level').val(), 10) || 60,
      maxHp:      parseInt($('#mp-hp').val(), 10) || 1,
      hpPerTick:  parseInt($('#mp-regen').val(), 10) || 0,
      itemHaste:  parseInt($('#mp-item-haste').val(), 10) || 0,
      buffHaste:  parseInt($('#mp-buff-haste').val(), 10) || 0,
      alwaysOnDs: parseInt($('#mp-ds').val(), 10) || 0,
      priDmg:     parseInt($('#mp-pri-dmg').val(), 10) || 0,
      priBonus:   parseInt($('#mp-pri-bonus').val(), 10) || 0,
      priDelay:   parseInt($('#mp-pri-delay').val(), 10) || 19,
      secDmg:     parseInt($('#mp-sec-dmg').val(), 10) || 0,
      secBonus:   parseInt($('#mp-sec-bonus').val(), 10) || 0,
      secDelay:   parseInt($('#mp-sec-delay').val(), 10) || 25
    };
  }
```

- [ ] **Step 2: Call restoreMeleeProfile in init()**

In the `init()` function (around line 96), add `restoreMeleeProfile();` after `restoreGearState();`:

```javascript
  function init() {
    populateClassDropdowns();
    populateRaidGrid();
    populateInstrumentDropdowns();
    populateClickyDropdown();
    restoreGearState();
    restoreMeleeProfile();
    bindEvents();
    recalculate();
  }
```

- [ ] **Step 3: Bind melee profile change events**

In the `bindEvents()` function, add the melee profile fields to the change selectors array (around line 206). Add after the `'#gear-clicky'` entry:

```javascript
      // Melee profile fields
      '#mp-level', '#mp-hp', '#mp-regen', '#mp-item-haste', '#mp-buff-haste', '#mp-ds',
      '#mp-pri-dmg', '#mp-pri-bonus', '#mp-pri-delay',
      '#mp-sec-dmg', '#mp-sec-bonus', '#mp-sec-delay'
```

Also add a separate handler for the text fields (weapon names) that only saves but doesn't recalculate:

```javascript
    // Melee weapon name fields — save but don't recalculate
    $(document).on('change', '#mp-pri-name, #mp-sec-name', function () {
      saveMeleeProfile();
    });
```

- [ ] **Step 4: Call saveMeleeProfile in recalculate()**

In the `recalculate()` function (around line 618), add `saveMeleeProfile();` after `saveGearState();`:

```javascript
  function recalculate() {
    var mods      = calcModifiers();
    updateModTable(mods);
    var classes   = getGroupComposition();
    var encounter = getEncounterConditions();
    var results   = scoreSongs(classes, mods, encounter);
    renderResults(results);
    saveGearState();
    saveMeleeProfile();
  }
```

- [ ] **Step 5: Verify persistence**

Open `http://localhost:8080/tools/melody/`, switch to Solo → Melee. Change the Level field to 55. Reload the page, switch to Solo → Melee again. The Level field should show 55.

- [ ] **Step 6: Commit**

```bash
git add tools/melody/melody.js
git commit -m "feat(melody): add melee profile persistence"
```

---

### Task 6: NPC loading and search in melody.js

**Files:**
- Modify: `tools/melody/melody.js`

- [ ] **Step 1: Add NPC loading and search functions**

Add after the `getMeleeProfile()` function in `melody.js`:

```javascript
  // -------------------------------------------------------------------------
  // NPC LOOKUP
  // -------------------------------------------------------------------------

  var npcData = null;       // loaded on demand
  var npcLoading = false;
  var selectedNpc = null;

  function loadNpcData(callback) {
    if (npcData) { callback(npcData); return; }
    if (npcLoading) return;
    npcLoading = true;
    $.getJSON('/tools/melody/npcs.json', function (data) {
      npcData = data;
      npcLoading = false;
      callback(data);
    }).fail(function () {
      npcLoading = false;
      $('#npc-results').html('<div class="results-empty">Failed to load NPC data.</div>').show();
    });
  }

  function searchNpcs(query) {
    if (!query || query.length < 2) {
      $('#npc-results').hide();
      return;
    }
    loadNpcData(function (data) {
      var q = query.toLowerCase();
      var isNumeric = /^\d+$/.test(q);
      var matches = data.filter(function (npc) {
        if (isNumeric) return String(npc.id) === q;
        return npc.name.toLowerCase().indexOf(q) !== -1;
      }).slice(0, 20);

      if (matches.length === 0) {
        $('#npc-results').html('<div class="results-empty" style="padding:0.4rem 0.6rem;">No matches</div>').show();
        return;
      }

      // If exact ID match, auto-select
      if (isNumeric && matches.length === 1) {
        selectNpc(matches[0]);
        $('#npc-results').hide();
        return;
      }

      var html = '';
      matches.forEach(function (npc) {
        html += '<div class="npc-result-item" data-npc-id="' + npc.id + '">' +
                  '<strong>' + npc.name.replace(/_/g, ' ') + '</strong> ' +
                  '<span style="color:var(--text-muted)">Lv ' + npc.level + ' · ' + npc.class + ' · ' + npc.hp + ' HP</span>' +
                '</div>';
      });
      $('#npc-results').html(html).show();
    });
  }

  function selectNpc(npc) {
    selectedNpc = npc;
    var html =
      '<div class="npc-stat"><strong>Name:</strong> ' + npc.name.replace(/_/g, ' ') + '</div>' +
      '<div class="npc-stat"><strong>Level:</strong> ' + npc.level + '</div>' +
      '<div class="npc-stat"><strong>Class:</strong> ' + npc.class + '</div>' +
      '<div class="npc-stat"><strong>HP:</strong> ' + npc.hp.toLocaleString() + '</div>' +
      '<div class="npc-stat"><strong>Damage:</strong> ' + npc.min_dmg + '–' + npc.max_dmg + '</div>' +
      '<div class="npc-stat"><strong>Atk Delay:</strong> ' + npc.attack_delay + '</div>' +
      '<div class="npc-stat"><strong>AC:</strong> ' + npc.ac + '</div>' +
      '<div class="npc-stat"><strong>Slow Mit:</strong> ' + (npc.slow_mitigation || 0) + '%</div>' +
      '<div class="npc-stat"><strong>Resists:</strong> MR ' + npc.resists.mr + ' CR ' + npc.resists.cr +
        ' DR ' + npc.resists.dr + ' FR ' + npc.resists.fr + ' PR ' + npc.resists.pr + '</div>';
    $('#npc-stat-grid').html(html);
    $('#npc-selected').show();
    $('#npc-results').hide();
    recalculate();
  }
```

- [ ] **Step 2: Bind NPC search events**

In the `bindEvents()` function, add:

```javascript
    // NPC search
    var npcSearchTimer = null;
    $(document).on('input', '#npc-search', function () {
      clearTimeout(npcSearchTimer);
      var val = $(this).val();
      npcSearchTimer = setTimeout(function () { searchNpcs(val); }, 200);
    });

    // NPC result click
    $(document).on('click', '.npc-result-item', function () {
      var npcId = parseInt($(this).data('npc-id'), 10);
      loadNpcData(function (data) {
        var npc = data.find(function (n) { return n.id === npcId; });
        if (npc) selectNpc(npc);
      });
    });
```

- [ ] **Step 3: Verify NPC search works**

Open page, switch to Solo → Melee. Type "89018" in NPC search. Should show blood_of_chottal stats. Type "blood" — should show dropdown matches.

- [ ] **Step 4: Commit**

```bash
git add tools/melody/melody.js
git commit -m "feat(melody): add NPC lookup with search"
```

---

### Task 7: Melee mode routing and panel show/hide

**Files:**
- Modify: `tools/melody/melody.js`

- [ ] **Step 1: Add panel visibility logic**

Add a function after the NPC code in `melody.js`:

```javascript
  // -------------------------------------------------------------------------
  // MELEE MODE UI
  // -------------------------------------------------------------------------

  function isMeleeSolo() {
    return getActiveMode() === 'solo' && $('.solo-btn.active').data('style') === 'melee';
  }

  function updateMeleePanelVisibility() {
    var melee = isMeleeSolo();
    // Melee-only panels
    $('#melee-profile').toggle(melee);
    $('#melee-npc').toggle(melee);
    $('#melee-sim-output').toggle(melee);
    // Standard panels — hide in melee mode
    // #melody-results stays visible (reused for top melody in both modes)
    // Standard runner-ups and encounter panel hide
    $('.encounter-panel').toggle(!melee);
    $('#melody-runnerups').toggle(!melee).prev('.section-title').toggle(!melee);
  }
```

- [ ] **Step 2: Call visibility update from solo button handler**

In `bindEvents()`, modify the solo button click handler (around line 176-180):

```javascript
    // Solo style buttons
    $(document).on('click', '.solo-btn', function () {
      $('.solo-btn').removeClass('active');
      $(this).addClass('active');
      updateMeleePanelVisibility();
      recalculate();
    });
```

Also call it from the mode tab handler (around line 166-173):

```javascript
    // Mode tabs
    $(document).on('click', '.mode-tab', function () {
      var mode = $(this).data('mode');
      $('.mode-tab').removeClass('active');
      $(this).addClass('active');
      $('.mode-panel').removeClass('active');
      $('#mode-' + mode).addClass('active');
      updateMeleePanelVisibility();
      recalculate();
    });
```

- [ ] **Step 3: Verify panel toggling**

Switch between Solo → Kiting and Solo → Melee. The character profile and NPC panels should appear/disappear. The encounter conditions panel should hide in melee mode. Standard results should hide, melee output should show.

- [ ] **Step 5: Commit**

```bash
git add tools/melody/melody.js
git commit -m "feat(melody): wire melee mode panel visibility and sim routing"
```

---

### Task 8: Render melee sim results

**Files:**
- Modify: `tools/melody/melody.js`

- [ ] **Step 1: Add renderMeleeResults function**

Add after the `updateMeleePanelVisibility()` function:

```javascript
  // -------------------------------------------------------------------------
  // MELEE SIM RENDERING
  // -------------------------------------------------------------------------

  function formatTime(seconds) {
    if (seconds === Infinity) return '∞';
    if (seconds < 0) return '—';
    var m = Math.floor(seconds / 60);
    var s = Math.round(seconds % 60);
    return m > 0 ? m + 'm ' + s + 's' : s + 's';
  }

  function renderMeleeResults(simResult, mods) {
    var $melody = $('#melody-results');
    var $summary = $('#melee-combat-summary');
    var $runnerUps = $('#melee-runnerups');

    // Clear standard results
    $melody.empty();
    $('#melody-runnerups').empty();

    if (!simResult.best) {
      $summary.html('<div class="results-empty">No results — select an NPC target.</div>');
      $runnerUps.empty();
      return;
    }

    var best = simResult.best;

    // --- Top melody ---
    var melodyHtml = '';
    best.combo.forEach(function (song, i) {
      var contrib = getMeleeContribution(song, best);
      melodyHtml +=
        '<div class="melody-song">' +
          '<div class="melody-song-icon">&#9835;</div>' +
          '<div class="melody-song-info">' +
            '<div class="melody-song-name">' + song.name + '</div>' +
            '<div class="melody-song-meta">' + (song.instrument.charAt(0).toUpperCase() + song.instrument.slice(1)) + '</div>' +
            '<div class="sim-contribution">' + contrib + '</div>' +
          '</div>' +
        '</div>';
    });
    $melody.html(melodyHtml);

    // --- Combat summary ---
    var susClass = best.sustainable ? 'sustainable' : 'unsustainable';
    var susLabel = best.sustainable ? 'SUSTAINABLE' : 'UNSUSTAINABLE';
    var marginStr = best.survivalMargin === Infinity ? '∞' :
      (best.survivalMargin >= 0 ? '+' : '') + formatTime(best.survivalMargin);

    var summaryHtml =
      '<div class="sim-summary">' +
        '<div class="sim-summary-grid">' +
          '<div class="sim-stat-label">Your DPS</div>' +
          '<div class="sim-stat-value">' + best.totalPlayerDps.toFixed(1) +
            ' <span style="font-size:0.75rem;color:var(--text-muted)">(melee ' + best.meleeDps.toFixed(1) +
            ' + DoT ' + best.dotDps.toFixed(1) +
            ' + DS ' + best.dsDps.toFixed(1) +
            (best.ddDps > 0 ? ' + DD ' + best.ddDps.toFixed(1) : '') + ')</span></div>' +

          '<div class="sim-stat-label">Total Haste</div>' +
          '<div class="sim-stat-value">' + best.totalHaste + '%</div>' +

          '<div class="sim-stat-label">Mob DPS (raw)</div>' +
          '<div class="sim-stat-value">' + best.mobBaseDps.toFixed(1) + '</div>' +

          '<div class="sim-stat-label">Mob DPS (after slow/stun)</div>' +
          '<div class="sim-stat-value">' + best.mobReducedDps.toFixed(1) +
            (best.slowPct > 0 ? ' <span style="font-size:0.75rem;color:var(--text-muted)">(' + Math.round(best.slowPct) + '% slow)</span>' : '') + '</div>' +

          '<div class="sim-stat-label">HP Regen / sec</div>' +
          '<div class="sim-stat-value">' + best.regenPerSec.toFixed(1) + '</div>' +

          '<div class="sim-stat-label">Net Incoming DPS</div>' +
          '<div class="sim-stat-value">' + best.netIncomingDps.toFixed(1) + '</div>' +

          '<div class="sim-stat-label">Time to Kill</div>' +
          '<div class="sim-stat-value">' + formatTime(best.timeToKill) + '</div>' +

          '<div class="sim-stat-label">Time to Die</div>' +
          '<div class="sim-stat-value">' + formatTime(best.timeToDie) + '</div>' +

          '<div class="sim-stat-label">Verdict</div>' +
          '<div class="sim-stat-value ' + susClass + '">' + susLabel + ' (' + marginStr + ')</div>' +
        '</div>' +
      '</div>';
    $summary.html(summaryHtml);

    // --- Runner-ups ---
    var ruHtml = '';
    simResult.runnerUps.forEach(function (r) {
      var names = r.combo.map(function (s) { return s.name; }).join(' · ');
      var rSus = r.sustainable ? 'sustainable' : 'unsustainable';
      var rLabel = r.sustainable ? 'OK' : 'DIES';
      var rMargin = r.survivalMargin === Infinity ? '∞' :
        (r.survivalMargin >= 0 ? '+' : '') + formatTime(r.survivalMargin);
      ruHtml +=
        '<div class="melee-runnerup">' +
          '<div class="melee-runnerup-songs">' + names + '</div>' +
          '<div class="melee-runnerup-stats">' +
            'Kill: ' + formatTime(r.timeToKill) + ' · ' +
            'DPS: ' + r.totalPlayerDps.toFixed(1) + ' · ' +
            '<span class="' + rSus + '">' + rLabel + ' (' + rMargin + ')</span>' +
          '</div>' +
        '</div>';
    });
    if (!ruHtml) ruHtml = '<div class="results-empty">No runner-ups.</div>';
    $runnerUps.html(ruHtml);
  }

  function getMeleeContribution(song, result) {
    if (song.isAmplification) return 'Boosts singing modifier for other songs in melody';
    var parts = [];
    if (song.hasteType === 'v3') parts.push('+' + song.hastePct + '% overhaste');
    if (song.hasteType === 'v1v2') {
      var h = meleeScaleValue(song.hastePct, parseInt($('#mp-level').val(), 10) || 60);
      parts.push(h + '% spell haste');
    }
    if (song.slowPct > 0) parts.push(song.slowPct + '% slow');
    if (song.dotPerTick) {
      var d = meleeScaleValue(song.dotPerTick, parseInt($('#mp-level').val(), 10) || 60);
      parts.push('DoT ' + d + '/tick');
    }
    if (song.dsValue) {
      var ds = meleeScaleValue(song.dsValue, parseInt($('#mp-level').val(), 10) || 60);
      parts.push('DS ' + ds);
    }
    if (song.stunSec > 0) parts.push(song.stunSec + 's stun');
    if (song.ddDmg > 0) parts.push(song.ddDmg + ' DD');
    if (song.hpRegenPerTick) {
      var r = meleeScaleValue(song.hpRegenPerTick, parseInt($('#mp-level').val(), 10) || 60);
      parts.push('+' + r + ' HP/tick');
    }
    if (song.acBonus) parts.push('+AC');
    if (song.absorbPerHit) parts.push('Absorb ' + song.absorbPerHit + '/hit');
    if (song.strBonus) parts.push('+STR');
    if (song.atkBonus) parts.push('+ATK');
    return parts.join(' · ') || '—';
  }
```

- [ ] **Step 2: Route recalculate() to melee sim**

Modify the `recalculate()` function in `melody.js` to branch on melee mode:

```javascript
  function recalculate() {
    var mods      = calcModifiers();
    updateModTable(mods);

    if (isMeleeSolo()) {
      saveMeleeProfile();
      saveGearState();
      if (!selectedNpc) return;
      var profile = getMeleeProfile();
      var simResult = runMeleeSim(profile, selectedNpc, mods);
      renderMeleeResults(simResult, mods);
      return;
    }

    var classes   = getGroupComposition();
    var encounter = getEncounterConditions();
    var results   = scoreSongs(classes, mods, encounter);
    renderResults(results);
    saveGearState();
    saveMeleeProfile();
  }
```

- [ ] **Step 3: Verify full end-to-end**

1. Open `http://localhost:8080/tools/melody/`
2. Switch to Solo → Melee
3. Profile fields should show saved values
4. Type `89018` in NPC search — blood_of_chottal loads
5. Results should render: top 5-song melody, combat summary, runner-ups
6. Verify the numbers look reasonable (DPS, time-to-kill, etc.)

- [ ] **Step 4: Commit**

```bash
git add tools/melody/melody.js
git commit -m "feat(melody): add melee sim result rendering and routing"
```

---

### Task 9: End-to-end verification and cleanup

- [ ] **Step 1: Full walkthrough**

1. Open `http://localhost:8080/tools/melody/`
2. Verify Group mode still works (pick classes → results render)
3. Verify Raid mode still works
4. Verify Solo → Kiting/Swarming/Charm still work
5. Switch to Solo → Melee:
   - Character profile panel appears with saved values
   - NPC panel appears
   - Encounter conditions panel hides
   - Standard results hide
6. Search for NPC `89018` — blood_of_chottal appears
7. Sim runs, shows: top melody (5 songs), combat summary, runner-ups
8. Change a profile value (e.g., HP to 4000) — sim re-runs
9. Reload page — profile values persist
10. Switch to Group mode and back — panels toggle correctly

- [ ] **Step 2: Console error check**

Open browser console — confirm no JS errors in any mode.

- [ ] **Step 3: Commit any final fixes**

```bash
git add -A
git commit -m "feat(melody): complete melee solo combat simulator"
```
