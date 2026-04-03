/**
 * melee-sim.js — Melody Recommender: Melee Solo Simulation Engine
 *
 * Defines 16 melee-relevant song candidates and a brute-force combat simulator
 * that evaluates all C(16,5) = 4368 song combos against a given NPC profile.
 *
 * Globals required (loaded before this file):
 *   INSTRUMENT_SOFT_CAP  — from songs.js
 *
 * This file itself exposes globals:
 *   MELEE_SONGS, meleeScaleValue, meleeGetInstMod, meleeResolveEffect,
 *   simCombo, runMeleeSim
 */

// ---------------------------------------------------------------------------
// SONG CANDIDATES
// ---------------------------------------------------------------------------

var MELEE_SONGS = [
  // --- Haste ---
  {
    id: 2610, name: "Warsong of the Vah Shir", instrument: 'brass',
    hasteType: 'v3', hastePct: 25,
    slowPct: 0, dotPerTick: 0, dsValue: 0, stunSec: 0, ddDmg: 0,
    hpRegenPerTick: 0, acBonus: 0, absorbPerHit: 0, strBonus: 0, atkBonus: 0,
    isAmplification: false, levelScaled: false
  },
  {
    id: 1762, name: "Jonthan's Inspiration", instrument: 'singing',
    hasteType: 'v1v2', hastePct: { min: 61, max: 66, minLvl: 58, maxLvl: 63 },
    slowPct: 0, dotPerTick: 0, dsValue: 0, stunSec: 0, ddDmg: 0,
    hpRegenPerTick: 0, acBonus: 0, absorbPerHit: 0,
    strBonus: { min: 17, max: 19, minLvl: 58, maxLvl: 65 },
    atkBonus: { min: 13, max: 14, minLvl: 58, maxLvl: 65 },
    isAmplification: false, levelScaled: true
  },
  {
    id: 1760, name: "McVaxius' Rousing Rondo", instrument: 'brass',
    hasteType: 'v1v2', hastePct: { min: 19, max: 20, minLvl: 57, maxLvl: 65 },
    slowPct: 0, dotPerTick: 0,
    dsValue: { min: 8, max: 8, minLvl: 57, maxLvl: 65, moddable: true },
    stunSec: 0, ddDmg: 0, hpRegenPerTick: 0, acBonus: 0, absorbPerHit: 0,
    strBonus: { min: 20, max: 22, minLvl: 57, maxLvl: 65 },
    atkBonus: { min: 11, max: 12, minLvl: 57, maxLvl: 65 },
    isAmplification: false, levelScaled: true
  },
  // --- Slow ---
  {
    id: 738, name: "Selo's Consonant Chain", instrument: 'singing',
    hasteType: null, hastePct: 0, slowPct: 40,
    dotPerTick: 0, dsValue: 0, stunSec: 0, ddDmg: 0,
    hpRegenPerTick: 0, acBonus: 0, absorbPerHit: 0, strBonus: 0, atkBonus: 0,
    isAmplification: false, levelScaled: false
  },
  {
    id: 1758, name: "Selo's Assonant Strane", instrument: 'stringed',
    hasteType: null, hastePct: 0, slowPct: 40,
    dotPerTick: 0, dsValue: 0, stunSec: 0, ddDmg: 0,
    hpRegenPerTick: 0, acBonus: 0, absorbPerHit: 0, strBonus: 0, atkBonus: 0,
    isAmplification: false, levelScaled: false
  },
  {
    id: 705, name: "Largo's Melodic Binding", instrument: 'singing',
    hasteType: null, hastePct: 0, slowPct: 35,
    dotPerTick: 0, dsValue: 0, stunSec: 0, ddDmg: 0,
    hpRegenPerTick: 0, acBonus: 0, absorbPerHit: 0, strBonus: 0, atkBonus: 0,
    isAmplification: false, levelScaled: false
  },
  {
    id: 1751, name: "Largo's Absonant Binding", instrument: 'singing',
    hasteType: null, hastePct: 0, slowPct: 35,
    dotPerTick: 0, dsValue: 0, stunSec: 0, ddDmg: 0,
    hpRegenPerTick: 0, acBonus: 0, absorbPerHit: 0, strBonus: 0, atkBonus: 0,
    isAmplification: false, levelScaled: false
  },
  {
    id: 746, name: "Selo's Chords of Cessation", instrument: 'stringed',
    hasteType: null, hastePct: 0, slowPct: 25,
    dotPerTick: { min: 26, max: 35, minLvl: 48, maxLvl: 65, moddable: true },
    dsValue: 0, stunSec: 0, ddDmg: 0,
    hpRegenPerTick: 0, acBonus: 0, absorbPerHit: 0, strBonus: 0, atkBonus: 0,
    isAmplification: false, levelScaled: true
  },
  // --- DoTs ---
  {
    id: 744, name: "Tuyen's Chant of Frost", instrument: 'percussion',
    hasteType: null, hastePct: 0, slowPct: 0,
    dotPerTick: { min: 24, max: 34, minLvl: 46, maxLvl: 65, moddable: true },
    dsValue: 0, stunSec: 0, ddDmg: 0,
    hpRegenPerTick: 0, acBonus: 0, absorbPerHit: 0, strBonus: 0, atkBonus: 0,
    isAmplification: false, levelScaled: true
  },
  {
    id: 743, name: "Tuyen's Chant of Flame", instrument: 'percussion',
    hasteType: null, hastePct: 0, slowPct: 0,
    dotPerTick: { min: 20, max: 34, minLvl: 38, maxLvl: 65, moddable: true },
    dsValue: 0, stunSec: 0, ddDmg: 0,
    hpRegenPerTick: 0, acBonus: 0, absorbPerHit: 0, strBonus: 0, atkBonus: 0,
    isAmplification: false, levelScaled: true
  },
  // --- Defensive / Regen ---
  {
    id: 1196, name: "Ancient: Lcea's Lament", instrument: 'stringed',
    hasteType: null, hastePct: 0, slowPct: 0, dotPerTick: 0, dsValue: 0,
    stunSec: 0, ddDmg: 0,
    hpRegenPerTick: { min: 16, max: 17, minLvl: 60, maxLvl: 65, moddable: true },
    acBonus: 0, absorbPerHit: 0, strBonus: 0, atkBonus: 0,
    isAmplification: false, levelScaled: true
  },
  {
    id: 1763, name: "Niv's Harmonic", instrument: 'singing',
    hasteType: null, hastePct: 0, slowPct: 0, dotPerTick: 0, dsValue: 0,
    stunSec: 0, ddDmg: 0, hpRegenPerTick: 0,
    acBonus: 23, absorbPerHit: 10, strBonus: 0, atkBonus: 0,
    isAmplification: false, levelScaled: false
  },
  {
    id: 748, name: "Niv's Melody of Preservation", instrument: 'stringed',
    hasteType: null, hastePct: 0, slowPct: 0, dotPerTick: 0, dsValue: 0,
    stunSec: 0, ddDmg: 0,
    hpRegenPerTick: { min: 6, max: 9, minLvl: 47, maxLvl: 65, moddable: true },
    acBonus: 0, absorbPerHit: 10, strBonus: 10, atkBonus: 0,
    isAmplification: false, levelScaled: true
  },
  {
    id: 713, name: "Psalm of Cooling", instrument: 'singing',
    hasteType: null, hastePct: 0, slowPct: 0, dotPerTick: 0,
    dsValue: { min: 7, max: 12, minLvl: 33, maxLvl: 65, moddable: true },
    stunSec: 0, ddDmg: 0, hpRegenPerTick: 0,
    acBonus: { min: 3, max: 5, minLvl: 33, maxLvl: 65 },
    absorbPerHit: 0, strBonus: 0, atkBonus: 0,
    isAmplification: false, levelScaled: true
  },
  // --- Utility ---
  {
    id: 1754, name: "Brusco's Bombastic Bellow", instrument: 'singing',
    hasteType: null, hastePct: 0, slowPct: 0, dotPerTick: 0, dsValue: 0,
    stunSec: 8, ddDmg: 222,
    hpRegenPerTick: 0, acBonus: 0, absorbPerHit: 0, strBonus: 0, atkBonus: 0,
    isAmplification: false, levelScaled: false
  },
  // --- Amplification (takes a melody slot) ---
  {
    id: 9999, name: "Amplification", instrument: 'singing',
    hasteType: null, hastePct: 0, slowPct: 0, dotPerTick: 0, dsValue: 0,
    stunSec: 0, ddDmg: 0, hpRegenPerTick: 0, acBonus: 0, absorbPerHit: 0,
    strBonus: 0, atkBonus: 0,
    isAmplification: true, levelScaled: false
  }
];

// ---------------------------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Interpolate a level-scaled value.
 * Plain number → return it. Object with minLvl/maxLvl → interpolate.
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
 * Get the instrument modifier multiplier from a mods object.
 * mods comes from melody.js calcModifiers().
 */
function meleeGetInstMod(mods, instrumentType) {
  if (mods[instrumentType]) return mods[instrumentType].multiplier;
  return 1.0;
}

/**
 * Resolve a song effect value applying level scaling and instrument mod
 * if the effect is marked moddable.
 */
function meleeResolveEffect(val, playerLevel, mods, instrumentType) {
  var base = meleeScaleValue(val, playerLevel);
  if (typeof val === 'object' && val !== null && val.moddable) {
    base = base * meleeGetInstMod(mods, instrumentType);
  }
  return base;
}

// ---------------------------------------------------------------------------
// COMBAT SIMULATION
// ---------------------------------------------------------------------------

/**
 * simCombo — Simulate one 5-song combo vs an NPC.
 *
 * @param {Array}  combo   5 song objects from MELEE_SONGS
 * @param {Object} profile { level, maxHp, hpPerTick, itemHaste, buffHaste,
 *                           priDmg, priBonus, priDelay,
 *                           secDmg, secBonus, secDelay, alwaysOnDs }
 * @param {Object} npc     { level, hp, min_dmg, max_dmg, attack_delay, ac,
 *                           resists, slow_mitigation, combat_hp_regen, hp_regen }
 * @param {Object} mods    Instrument modifier map from calcModifiers()
 * @returns {Object} Simulation result object
 */
function simCombo(combo, profile, npc, mods) {
  var playerLevel = profile.level || 65;

  // -------------------------------------------------------------------------
  // 1. Amplification: clone mods and boost singing multiplier by +9
  // -------------------------------------------------------------------------
  var effectiveMods = mods;
  var hasAmp = combo.some(function (s) { return s.isAmplification; });
  if (hasAmp) {
    effectiveMods = {};
    var skills = ['percussion', 'stringed', 'brass', 'wind', 'singing'];
    skills.forEach(function (skill) {
      effectiveMods[skill] = {
        itemMod:    mods[skill] ? mods[skill].itemMod    : 0,
        aaMod:      mods[skill] ? mods[skill].aaMod      : 0,
        ampMod:     mods[skill] ? mods[skill].ampMod     : 0,
        total:      mods[skill] ? mods[skill].total      : 10,
        multiplier: mods[skill] ? mods[skill].multiplier : 1.0
      };
    });
    // Boost singing by +9, capped at INSTRUMENT_SOFT_CAP + aaMod
    var singingAaMod = (mods['singing'] ? mods['singing'].aaMod : 0);
    var cap = INSTRUMENT_SOFT_CAP + singingAaMod;
    var currentTotal = effectiveMods['singing'].total;
    var boostedTotal = Math.min(currentTotal + 9, cap);
    effectiveMods['singing'].total      = boostedTotal;
    effectiveMods['singing'].multiplier = boostedTotal / 10;
    effectiveMods['singing'].ampMod     = effectiveMods['singing'].ampMod + 9;
  }

  // -------------------------------------------------------------------------
  // 2. Haste calculation
  // -------------------------------------------------------------------------
  var v3Haste    = 0;
  var bestV1V2   = 0;

  combo.forEach(function (song) {
    if (song.hasteType === 'v3') {
      var h = meleeScaleValue(song.hastePct, playerLevel);
      if (h > v3Haste) v3Haste = h;
    } else if (song.hasteType === 'v1v2') {
      var h = meleeScaleValue(song.hastePct, playerLevel);
      if (h > bestV1V2) bestV1V2 = h;
    }
  });

  var buffHaste   = profile.buffHaste || 0;
  var itemHaste   = profile.itemHaste || 0;
  var totalHaste  = itemHaste + Math.max(buffHaste, bestV1V2) + v3Haste;
  var hasteMult   = 1 + totalHaste / 100;

  // -------------------------------------------------------------------------
  // 3. STR / ATK song bonuses (best of each from combo)
  // -------------------------------------------------------------------------
  var bestStr = 0;
  var bestAtk = 0;

  combo.forEach(function (song) {
    var str = meleeScaleValue(song.strBonus, playerLevel);
    var atk = meleeScaleValue(song.atkBonus, playerLevel);
    if (str > bestStr) bestStr = str;
    if (atk > bestAtk) bestAtk = atk;
  });

  // -------------------------------------------------------------------------
  // 4. Player melee DPS
  // -------------------------------------------------------------------------
  var AVG_MIT_FACTOR  = 1.55;
  var DUAL_WIELD_RATE = 0.62;

  var priDelay   = profile.priDelay  || 28;
  var secDelay   = profile.secDelay  || 25;
  var priDmg     = profile.priDmg    || 0;
  var priBonus   = profile.priBonus  || 0;
  var secDmg     = profile.secDmg    || 0;
  var secBonus   = profile.secBonus  || 0;

  var priSwingTime = (priDelay / 10) / hasteMult;
  var secSwingTime = (secDelay / 10) / hasteMult;

  // Average damage includes ATK/STR bonuses added to the bonus component
  var priAvgDmg = (priBonus + bestAtk + bestStr / 10) + priDmg * AVG_MIT_FACTOR;
  var secAvgDmg = (secBonus + bestAtk + bestStr / 10) + secDmg * AVG_MIT_FACTOR;

  var priDps     = priAvgDmg / priSwingTime;
  var secDps     = secAvgDmg / secSwingTime;
  var meleeDps   = priDps + secDps * DUAL_WIELD_RATE;

  // -------------------------------------------------------------------------
  // 5. Song DPS (DoT, DS, DD stun)
  // -------------------------------------------------------------------------
  var TWIST_CYCLE = 15; // 5 songs * 3 sec each

  var attackDelay  = npc.attack_delay || 30;
  var mobAttackSec = 1 / (attackDelay / 10);

  var dotDps = 0;
  var dsDps  = 0;
  var ddDps  = 0;

  // Stun resist rate
  var npcLevel    = npc.level || 60;
  var levelDelta  = Math.max(0, npcLevel - playerLevel);
  var resistRate  = Math.min(0.80, 0.30 + levelDelta * 0.04);

  combo.forEach(function (song) {
    if (song.isAmplification) return;

    // DoT DPS
    if (song.dotPerTick) {
      var dotVal = meleeResolveEffect(song.dotPerTick, playerLevel, effectiveMods, song.instrument);
      dotDps += dotVal / 6; // per tick → per second
    }

    // DS DPS (mob attacks * ds value)
    if (song.dsValue) {
      var dsVal = meleeResolveEffect(song.dsValue, playerLevel, effectiveMods, song.instrument);
      dsDps += dsVal * mobAttackSec;
    }

    // Brusco's: stun DD + melee lockout
    if (song.stunSec > 0 || song.ddDmg > 0) {
      if (song.ddDmg > 0) {
        ddDps += song.ddDmg * (1 - resistRate) / TWIST_CYCLE;
      }
    }
  });

  // Always-on DS from gear/buffs
  var alwaysOnDs = profile.alwaysOnDs || 0;
  dsDps += alwaysOnDs * mobAttackSec;

  var totalPlayerDps = meleeDps + dotDps + dsDps + ddDps;

  // -------------------------------------------------------------------------
  // 6. Stun uptime
  // -------------------------------------------------------------------------
  var stunUptimeRatio = 0;
  combo.forEach(function (song) {
    if (song.stunSec > 0) {
      stunUptimeRatio = song.stunSec * (1 - resistRate) / TWIST_CYCLE;
    }
  });

  // -------------------------------------------------------------------------
  // 7. Incoming mob DPS
  // -------------------------------------------------------------------------
  var minDmg = npc.min_dmg || 10;
  var maxDmg = npc.max_dmg || 30;
  var mobAvgDmg = (minDmg + maxDmg) / 2;

  // Best slow from combo
  var bestSlow = 0;
  combo.forEach(function (song) {
    if (song.slowPct > bestSlow) bestSlow = song.slowPct;
  });

  var slowMitigation = npc.slow_mitigation || 0;
  var effectiveSlow  = bestSlow * (1 - slowMitigation / 100);

  // mob base DPS before reductions
  var mobBaseDps = mobAvgDmg * mobAttackSec;

  // Apply slow
  var mobSlowedDps = mobBaseDps * (1 - effectiveSlow / 100);

  // Apply stun uptime (mob attacks are locked out during stun)
  var mobStunnedDps = mobSlowedDps * (1 - stunUptimeRatio);

  // AC reduction: per 10 AC ~1 dmg reduction per hit
  var acBonus = 0;
  combo.forEach(function (song) {
    var ac = meleeScaleValue(song.acBonus, playerLevel);
    if (ac > acBonus) acBonus = ac;
  });
  var acReduction = (acBonus / 10) * mobAttackSec;

  // Absorb reduction (flat per hit)
  var absorbPerHit = 0;
  combo.forEach(function (song) {
    if (song.absorbPerHit > absorbPerHit) absorbPerHit = song.absorbPerHit;
  });
  var absorbReduction = absorbPerHit * mobAttackSec;

  var mobEffectiveDps = mobStunnedDps - acReduction - absorbReduction;
  if (mobEffectiveDps < 0) mobEffectiveDps = 0;

  // DS return on mob hits (add to player side — mob loses HP to DS)
  // Already counted in dsDps above

  var mobReducedDps = mobEffectiveDps;

  // -------------------------------------------------------------------------
  // 8. Survivability
  // -------------------------------------------------------------------------
  var songRegen = 0;
  combo.forEach(function (song) {
    if (song.hpRegenPerTick) {
      var r = meleeResolveEffect(song.hpRegenPerTick, playerLevel, effectiveMods, song.instrument);
      songRegen += r;
    }
  });

  var regenPerSec    = ((profile.hpPerTick || 0) + songRegen) / 6;
  var netIncomingDps = mobReducedDps - regenPerSec;

  var maxHp = profile.maxHp || 3000;
  var timeToDie = (netIncomingDps > 0) ? maxHp / netIncomingDps : Infinity;

  var npcHp       = npc.hp || 5000;
  var mobRegenSec = ((npc.combat_hp_regen || 0) + (npc.hp_regen || 0)) / 6;
  var netPlayerDps = totalPlayerDps - mobRegenSec;
  if (netPlayerDps <= 0) netPlayerDps = 0.001; // avoid divide by zero / infinite kill time

  var timeToKill     = npcHp / netPlayerDps;
  var sustainable    = timeToKill < timeToDie;
  var survivalMargin = timeToDie - timeToKill;

  return {
    combo:            combo,
    totalHaste:       totalHaste,
    hasteMult:        hasteMult,
    slowPct:          effectiveSlow,
    stunUptimeRatio:  stunUptimeRatio,
    meleeDps:         meleeDps,
    dotDps:           dotDps,
    dsDps:            dsDps,
    ddDps:            ddDps,
    totalPlayerDps:   totalPlayerDps,
    mobBaseDps:       mobBaseDps,
    mobSlowedDps:     mobSlowedDps,
    mobEffectiveDps:  mobEffectiveDps,
    mobReducedDps:    mobReducedDps,
    regenPerSec:      regenPerSec,
    netIncomingDps:   netIncomingDps,
    timeToDie:        timeToDie,
    timeToKill:       timeToKill,
    sustainable:      sustainable,
    survivalMargin:   survivalMargin
  };
}

// ---------------------------------------------------------------------------
// BRUTE-FORCE EVALUATOR
// ---------------------------------------------------------------------------

/**
 * runMeleeSim — Evaluate all C(16,5) = 4368 combos and return the best.
 *
 * @param {Object} profile  Player profile (see simCombo)
 * @param {Object} npc      NPC profile (see simCombo)
 * @param {Object} mods     Instrument modifier map from calcModifiers()
 * @returns {{ best: Object, runnerUps: Array }}
 */
function runMeleeSim(profile, npc, mods) {
  var n       = MELEE_SONGS.length; // 16
  var results = [];

  // 5 nested loops over distinct indices i < j < k < l < m
  for (var i = 0; i < n - 4; i++) {
    for (var j = i + 1; j < n - 3; j++) {
      for (var k = j + 1; k < n - 2; k++) {
        for (var l = k + 1; l < n - 1; l++) {
          for (var m = l + 1; m < n; m++) {
            var combo = [
              MELEE_SONGS[i],
              MELEE_SONGS[j],
              MELEE_SONGS[k],
              MELEE_SONGS[l],
              MELEE_SONGS[m]
            ];
            results.push(simCombo(combo, profile, npc, mods));
          }
        }
      }
    }
  }

  // Sort: sustainable combos first (desc), then by timeToKill (asc = faster kill).
  // Among unsustainable: larger survivalMargin first (closer to surviving).
  results.sort(function (a, b) {
    if (a.sustainable !== b.sustainable) {
      return a.sustainable ? -1 : 1; // sustainable first
    }
    if (a.sustainable && b.sustainable) {
      return a.timeToKill - b.timeToKill; // faster kill wins
    }
    // Both unsustainable: larger survivalMargin (less negative) wins
    return b.survivalMargin - a.survivalMargin;
  });

  return {
    best:      results[0] || null,
    runnerUps: results.slice(1, 6)
  };
}
