#!/usr/bin/env python3
"""
Extract NPC data from Quarm SQL dump for the melody recommender tool.
Parses npc_types INSERT rows and outputs filtered NPCs as compact JSON.
"""

import json
import re

SQL_FILE = "C:/Apps/quarm/db/quarm_2026-03-20-09_37.sql"
OUT_FILE = "C:/Apps/lyrical/tools/melody/npcs.json"

# EQ class IDs
CLASS_MAP = {
    1: "Warrior", 2: "Cleric", 3: "Paladin", 4: "Ranger",
    5: "Shadowknight", 6: "Druid", 7: "Monk", 8: "Bard",
    9: "Rogue", 10: "Shaman", 11: "Necromancer", 12: "Wizard",
    13: "Magician", 14: "Enchanter", 15: "Beastlord", 16: "Berserker",
}

# Column indices (0-based)
IDX_ID               = 0
IDX_NAME             = 1
IDX_LEVEL            = 3
IDX_CLASS            = 5
IDX_HP               = 7
IDX_HP_REGEN         = 13
IDX_MINDMG           = 20
IDX_MAXDMG           = 21
IDX_SPECIAL          = 23
IDX_MR               = 43
IDX_CR               = 44
IDX_DR               = 45
IDX_FR               = 46
IDX_PR               = 47
IDX_AC               = 51
IDX_ATTACK_DELAY     = 54
IDX_SLOW_MITIGATION  = 66
IDX_COMBAT_HP_REGEN  = 85


def parse_row_fields(row_text):
    """
    Parse a single row (without surrounding parentheses) into a list of
    field values. Handles quoted strings that may contain commas.
    Returns a list of strings (quotes stripped from string fields).
    """
    fields = []
    current = []
    in_quote = False

    for ch in row_text:
        if ch == "'":
            in_quote = not in_quote
            # Keep quotes in current so we can strip them later
            current.append(ch)
        elif ch == ',' and not in_quote:
            fields.append(''.join(current))
            current = []
        else:
            current.append(ch)

    if current or row_text.endswith(','):
        fields.append(''.join(current))

    # Strip surrounding single quotes from string fields
    result = []
    for f in fields:
        f = f.strip()
        if f.startswith("'") and f.endswith("'"):
            result.append(f[1:-1])
        else:
            result.append(f)
    return result


def safe_int(val, default=0):
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return default


def extract_npcs():
    npcs_by_id = {}

    # We need to find all INSERT INTO `npc_types` blocks and parse their rows.
    # Rows are separated by ),( and the whole block ends with );
    # Rows can span multiple lines.

    in_npc_block = False
    buffer = ""

    print(f"Reading {SQL_FILE} ...")

    with open(SQL_FILE, "r", encoding="latin-1", errors="replace") as f:
        for line in f:
            line_stripped = line.rstrip('\n')

            if not in_npc_block:
                # Check if this line starts an npc_types INSERT
                if re.match(r'INSERT INTO `npc_types` VALUES', line_stripped):
                    in_npc_block = True
                    buffer = ""
                continue

            # We're inside an npc_types INSERT block
            # Accumulate lines into buffer
            buffer += line_stripped

            # Check if the block ended (line ends with ; after stripping)
            # The end of an INSERT block is a line ending with ';'
            block_ended = line_stripped.rstrip().endswith(';')

            if block_ended:
                # Remove trailing semicolon
                if buffer.endswith(';'):
                    buffer = buffer[:-1]

                # Now buffer contains: (row1),(row2),...,(rowN)
                # Split on ),( boundaries while respecting quotes
                # We'll do a state-machine split
                rows = split_rows(buffer)

                for row in rows:
                    # Strip leading/trailing parens
                    row = row.strip()
                    if row.startswith('('):
                        row = row[1:]
                    if row.endswith(')'):
                        row = row[:-1]

                    fields = parse_row_fields(row)

                    if len(fields) <= IDX_COMBAT_HP_REGEN:
                        continue  # Row too short, skip

                    name = fields[IDX_NAME]

                    # Skip triggered/special spawns
                    if name.startswith('#'):
                        continue

                    try:
                        npc_id = int(fields[IDX_ID])
                        level = int(fields[IDX_LEVEL])
                        hp = safe_int(fields[IDX_HP])
                        max_dmg = safe_int(fields[IDX_MAXDMG])
                    except (ValueError, IndexError):
                        continue

                    # Filter: level 40-66, hp > 0, maxdmg > 0
                    if not (40 <= level <= 66):
                        continue
                    if hp <= 0 or max_dmg <= 0:
                        continue

                    class_id = safe_int(fields[IDX_CLASS])
                    class_name = CLASS_MAP.get(class_id, f"Unknown({class_id})")

                    npc = {
                        "id": npc_id,
                        "name": name,
                        "level": level,
                        "class": class_name,
                        "class_id": class_id,
                        "hp": hp,
                        "hp_regen": safe_int(fields[IDX_HP_REGEN]),
                        "min_dmg": safe_int(fields[IDX_MINDMG]),
                        "max_dmg": max_dmg,
                        "ac": safe_int(fields[IDX_AC]),
                        "attack_delay": safe_int(fields[IDX_ATTACK_DELAY]),
                        "slow_mitigation": safe_int(fields[IDX_SLOW_MITIGATION]),
                        "combat_hp_regen": safe_int(fields[IDX_COMBAT_HP_REGEN]),
                        "resists": {
                            "mr": safe_int(fields[IDX_MR]),
                            "cr": safe_int(fields[IDX_CR]),
                            "dr": safe_int(fields[IDX_DR]),
                            "fr": safe_int(fields[IDX_FR]),
                            "pr": safe_int(fields[IDX_PR]),
                        },
                        "special_abilities": fields[IDX_SPECIAL],
                    }

                    # Deduplicate by id (keep first occurrence)
                    if npc_id not in npcs_by_id:
                        npcs_by_id[npc_id] = npc

                in_npc_block = False
                buffer = ""

    # Sort by level then name
    npcs = sorted(npcs_by_id.values(), key=lambda n: (n["level"], n["name"].lower()))

    print(f"Total NPCs extracted: {len(npcs)}")

    # Write compact JSON
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(npcs, f, separators=(',', ':'))

    print(f"Written to {OUT_FILE}")

    # Verify blood_of_chottal
    target = next((n for n in npcs if n["id"] == 89018), None)
    if target:
        print("\nVerification - blood_of_chottal (id 89018):")
        for k, v in target.items():
            print(f"  {k}: {v}")
    else:
        print("\nWARNING: blood_of_chottal (id 89018) not found!")

    return npcs


def split_rows(buffer):
    """
    Split a buffer like (row1),(row2),(row3) into individual row strings
    including their surrounding parentheses. Respects quoted strings.
    """
    rows = []
    depth = 0
    in_quote = False
    start = 0
    i = 0

    while i < len(buffer):
        ch = buffer[i]

        if ch == "'" and not in_quote:
            in_quote = True
        elif ch == "'" and in_quote:
            in_quote = False
        elif not in_quote:
            if ch == '(':
                if depth == 0:
                    start = i
                depth += 1
            elif ch == ')':
                depth -= 1
                if depth == 0:
                    rows.append(buffer[start:i+1])

        i += 1

    return rows


if __name__ == "__main__":
    extract_npcs()
