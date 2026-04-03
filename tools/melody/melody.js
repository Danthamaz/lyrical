/**
 * melody.js — Melody Recommender: Algorithm & UI Logic
 *
 * Depends on songs.js being loaded first (globals: CLASSES, INSTRUMENTS,
 * AA_MODS, SINGING_CLICKIES, INSTRUMENT_SOFT_CAP, SONGS).
 */

$(function () {

  // -------------------------------------------------------------------------
  // LOCAL STORAGE PERSISTENCE
  // -------------------------------------------------------------------------

  var STORAGE_KEY = 'lyrical_melody_gear';

  function saveGearState() {
    var state = {};

    // Checkboxes
    state['gear-epic'] = $('#gear-epic').is(':checked');
    state['gear-amplification'] = $('#gear-amplification').is(':checked');
    state['gear-puretone'] = $('#gear-puretone').is(':checked');

    // Instrument selects
    state['gear-percussion'] = $('#gear-percussion').val();
    state['gear-stringed'] = $('#gear-stringed').val();
    state['gear-brass'] = $('#gear-brass').val();
    state['gear-wind'] = $('#gear-wind').val();

    // AA/Skill selects
    state['gear-instrument-mastery'] = $('#gear-instrument-mastery').val();
    state['gear-singing-mastery'] = $('#gear-singing-mastery').val();
    state['gear-jam-fest'] = $('#gear-jam-fest').val();

    // Clicky select
    state['gear-clicky'] = $('#gear-clicky').val();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function restoreGearState() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      var state = JSON.parse(raw);

      // Restore checkboxes
      if (state['gear-epic'] !== undefined) {
        $('#gear-epic').prop('checked', state['gear-epic']);
      }
      if (state['gear-amplification'] !== undefined) {
        $('#gear-amplification').prop('checked', state['gear-amplification']);
      }
      if (state['gear-puretone'] !== undefined) {
        $('#gear-puretone').prop('checked', state['gear-puretone']);
      }

      // Restore instrument selects
      if (state['gear-percussion'] !== undefined) {
        $('#gear-percussion').val(state['gear-percussion']);
      }
      if (state['gear-stringed'] !== undefined) {
        $('#gear-stringed').val(state['gear-stringed']);
      }
      if (state['gear-brass'] !== undefined) {
        $('#gear-brass').val(state['gear-brass']);
      }
      if (state['gear-wind'] !== undefined) {
        $('#gear-wind').val(state['gear-wind']);
      }

      // Restore AA/Skill selects
      if (state['gear-instrument-mastery'] !== undefined) {
        $('#gear-instrument-mastery').val(state['gear-instrument-mastery']);
      }
      if (state['gear-singing-mastery'] !== undefined) {
        $('#gear-singing-mastery').val(state['gear-singing-mastery']);
      }
      if (state['gear-jam-fest'] !== undefined) {
        $('#gear-jam-fest').val(state['gear-jam-fest']);
      }

      // Restore clicky select
      if (state['gear-clicky'] !== undefined) {
        $('#gear-clicky').val(state['gear-clicky']);
      }
    } catch (e) {
      // Silently ignore corrupt state
    }
  }

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
    state['mp-angstlich'] = $('#mp-angstlich').is(':checked');
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
      if (state['mp-angstlich'] !== undefined) {
        $('#mp-angstlich').prop('checked', state['mp-angstlich']);
      }
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
      secDelay:   parseInt($('#mp-sec-delay').val(), 10) || 25,
      angstlichActive: $('#mp-angstlich').is(':checked')
    };
  }

  // -------------------------------------------------------------------------
  // NPC LOOKUP
  // -------------------------------------------------------------------------

  var npcData = null;
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

      if (isNumeric && matches.length === 1) {
        selectNpc(matches[0]);
        $('#npc-results').hide();
        return;
      }

      var html = '';
      matches.forEach(function (npc) {
        html += '<div class="npc-result-item" data-npc-id="' + npc.id + '">' +
                  '<strong>' + npc.name.replace(/_/g, ' ') + '</strong> ' +
                  '<span style="color:var(--text-muted)">Lv ' + npc.level + ' · ' + npc['class'] + ' · ' + npc.hp + ' HP</span>' +
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
      '<div class="npc-stat"><strong>Class:</strong> ' + npc['class'] + '</div>' +
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

  // -------------------------------------------------------------------------
  // MELEE MODE UI
  // -------------------------------------------------------------------------

  function isMeleeSolo() {
    return getActiveMode() === 'solo' && $('.solo-btn.active').data('style') === 'melee';
  }

  function updateMeleePanelVisibility() {
    var melee = isMeleeSolo();
    $('#melee-profile').toggle(melee);
    $('#melee-npc').toggle(melee);
    $('#melee-sim-output').toggle(melee);
    // Standard panels hide in melee mode
    // #melody-results stays visible (reused for top melody in both modes)
    $('.encounter-panel').toggle(!melee);
    $('#melody-runnerups').toggle(!melee).prev('.section-title').toggle(!melee);
  }

  // -------------------------------------------------------------------------
  // MELEE SIM RENDERING
  // -------------------------------------------------------------------------

  function formatTime(seconds) {
    if (seconds === Infinity) return '\u221e';
    if (seconds < 0) return '\u2014';
    var m = Math.floor(seconds / 60);
    var s = Math.round(seconds % 60);
    return m > 0 ? m + 'm ' + s + 's' : s + 's';
  }

  function renderMeleeResults(simResult, mods) {
    var $melody = $('#melody-results');
    var $summary = $('#melee-combat-summary');
    var $runnerUps = $('#melee-runnerups');

    $melody.empty();
    $('#melody-runnerups').empty();

    if (!simResult.best) {
      $summary.html('<div class="results-empty">No results \u2014 select an NPC target.</div>');
      $runnerUps.empty();
      return;
    }

    var best = simResult.best;

    // Top melody
    var melodyHtml = '';
    best.combo.forEach(function (song) {
      var contrib = getMeleeContribution(song, best);
      melodyHtml +=
        '<div class="melody-song">' +
          '<div class="melody-song-icon">&#9835;</div>' +
          '<div class="melody-song-info">' +
            '<div class="melody-song-name">' + song.name + '</div>' +
            '<div class="melody-song-meta">' + song.instrument.charAt(0).toUpperCase() + song.instrument.slice(1) + '</div>' +
            '<div class="sim-contribution">' + contrib + '</div>' +
          '</div>' +
        '</div>';
    });
    $melody.html(melodyHtml);

    // Combat summary
    var susClass = best.sustainable ? 'sustainable' : 'unsustainable';
    var susLabel = best.sustainable ? 'SUSTAINABLE' : 'UNSUSTAINABLE';
    var marginStr = best.survivalMargin === Infinity ? '\u221e' :
      (best.survivalMargin >= 0 ? '+' : '') + formatTime(best.survivalMargin);

    var summaryHtml =
      '<div class="sim-summary"><div class="sim-summary-grid">' +
        '<div class="sim-stat-label">Your DPS</div>' +
        '<div class="sim-stat-value">' + best.totalPlayerDps.toFixed(1) +
          ' <span style="font-size:0.75rem;color:var(--text-muted)">(melee ' + best.meleeDps.toFixed(1) +
          ' + DoT ' + best.dotDps.toFixed(1) + ' + DS ' + best.dsDps.toFixed(1) +
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
      '</div></div>';
    $summary.html(summaryHtml);

    // Runner-ups
    var ruHtml = '';
    simResult.runnerUps.forEach(function (r) {
      var names = r.combo.map(function (s) { return s.name; }).join(' \u00b7 ');
      var rSus = r.sustainable ? 'sustainable' : 'unsustainable';
      var rLabel = r.sustainable ? 'OK' : 'DIES';
      var rMargin = r.survivalMargin === Infinity ? '\u221e' :
        (r.survivalMargin >= 0 ? '+' : '') + formatTime(r.survivalMargin);
      ruHtml +=
        '<div class="melee-runnerup">' +
          '<div class="melee-runnerup-songs">' + names + '</div>' +
          '<div class="melee-runnerup-stats">' +
            'Kill: ' + formatTime(r.timeToKill) + ' \u00b7 DPS: ' + r.totalPlayerDps.toFixed(1) + ' \u00b7 ' +
            '<span class="' + rSus + '">' + rLabel + ' (' + rMargin + ')</span>' +
          '</div>' +
        '</div>';
    });
    if (!ruHtml) ruHtml = '<div class="results-empty">No runner-ups.</div>';
    $runnerUps.html(ruHtml);
  }

  function getMeleeContribution(song, result) {
    if (song.isAmplification) return 'Boosts singing modifier for other songs in melody';
    var lvl = parseInt($('#mp-level').val(), 10) || 60;
    var parts = [];
    if (song.hasteType === 'v3') parts.push('+' + song.hastePct + '% overhaste');
    if (song.hasteType === 'v1v2') {
      var h = meleeScaleValue(song.hastePct, lvl);
      parts.push(h + '% spell haste');
    }
    if (song.slowPct > 0) parts.push(song.slowPct + '% slow');
    if (song.dotPerTick) {
      var d = meleeScaleValue(song.dotPerTick, lvl);
      parts.push('DoT ' + d + '/tick');
    }
    if (song.dsValue) {
      var ds = meleeScaleValue(song.dsValue, lvl);
      parts.push('DS ' + ds);
    }
    if (song.stunSec > 0) parts.push(song.stunSec + 's stun');
    if (song.ddDmg > 0) parts.push(song.ddDmg + ' DD');
    if (song.hpRegenPerTick) {
      var r = meleeScaleValue(song.hpRegenPerTick, lvl);
      parts.push('+' + r + ' HP/tick');
    }
    if (song.acBonus) parts.push('+AC');
    if (song.absorbPerHit) parts.push('Absorb ' + song.absorbPerHit + '/hit');
    if (song.strBonus) parts.push('+STR');
    if (song.atkBonus) parts.push('+ATK');
    return parts.join(' \u00b7 ') || '\u2014';
  }

  // -------------------------------------------------------------------------
  // INIT
  // -------------------------------------------------------------------------

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

  function populateClassDropdowns() {
    // Build option HTML for all classes (plus an "Empty" placeholder)
    var options = '<option value="empty">Empty</option>';
    CLASSES.forEach(function (cls) {
      options += '<option value="' + cls.id + '">' + cls.name + '</option>';
    });

    // Populate all .class-select elements that are NOT the locked bard slot
    $('.class-select:not([disabled])').each(function () {
      $(this).html(options);
    });
  }

  function populateRaidGrid() {
    var $grid = $('#raid-class-grid');
    $grid.empty();

    CLASSES.forEach(function (cls) {
      if (cls.id === 'bard') return; // bard is always present, skip
      var $cell = $(
        '<div class="raid-class">' +
          '<label>' + cls.name + '</label>' +
          '<input type="number" class="raid-count" data-class="' + cls.id + '" ' +
                 'value="0" min="0" max="72">' +
        '</div>'
      );
      $grid.append($cell);
    });
  }

  function populateInstrumentDropdowns() {
    var types = ['percussion', 'stringed', 'brass', 'wind'];
    types.forEach(function (type) {
      var $sel = $('#gear-' + type);
      $sel.empty();
      var instruments = INSTRUMENTS[type];
      Object.keys(instruments).forEach(function (key) {
        $sel.append(
          '<option value="' + key + '">' + instruments[key].name + '</option>'
        );
      });
    });
  }

  function populateClickyDropdown() {
    var $sel = $('#gear-clicky');
    $sel.empty();
    Object.keys(SINGING_CLICKIES).forEach(function (key) {
      $sel.append(
        '<option value="' + key + '">' + SINGING_CLICKIES[key].name + '</option>'
      );
    });
  }

  // -------------------------------------------------------------------------
  // EVENT BINDINGS
  // -------------------------------------------------------------------------

  function bindEvents() {
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

    // Solo style buttons
    $(document).on('click', '.solo-btn', function () {
      $('.solo-btn').removeClass('active');
      $(this).addClass('active');
      updateMeleePanelVisibility();
      recalculate();
    });

    // Damage type toggles (multi-select)
    $(document).on('click', '.dmg-toggle', function () {
      $(this).toggleClass('active');
      recalculate();
    });

    // All change-driven inputs
    var changeSelectors = [
      '.class-select',
      '.raid-count',
      '#raid-role-select',
      '#slow-needed',
      '#slow-immune',
      '#resist-debuff',
      '#gear-epic',
      '#gear-amplification',
      '#gear-puretone',
      '#gear-percussion',
      '#gear-stringed',
      '#gear-brass',
      '#gear-wind',
      '#gear-instrument-mastery',
      '#gear-singing-mastery',
      '#gear-jam-fest',
      '#gear-clicky',
      // Melee profile fields
      '#mp-level', '#mp-hp', '#mp-regen', '#mp-item-haste', '#mp-buff-haste', '#mp-ds',
      '#mp-pri-dmg', '#mp-pri-bonus', '#mp-pri-delay',
      '#mp-sec-dmg', '#mp-sec-bonus', '#mp-sec-delay',
      '#mp-angstlich'
    ];
    $(document).on('change', changeSelectors.join(','), function () {
      recalculate();
    });

    // Weapon name save handler
    $(document).on('change', '#mp-pri-name, #mp-sec-name', function () {
      saveMeleeProfile();
    });

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
  }

  // -------------------------------------------------------------------------
  // MODIFIER CALCULATION
  // -------------------------------------------------------------------------

  function calcModifiers() {
    // Look up actual bonus values from rank indices
    var instMasteryRank = parseInt($('#gear-instrument-mastery').val(), 10) || 0;
    var instrumentMastery = AA_MODS.instrument_mastery[instMasteryRank] || 0;

    var singMasteryRank = parseInt($('#gear-singing-mastery').val(), 10) || 0;
    var singingMastery  = AA_MODS.singing_mastery[singMasteryRank] || 0;

    var epicActive    = $('#gear-epic').is(':checked');
    var puretone      = $('#gear-puretone').is(':checked');
    var amplification = $('#gear-amplification').is(':checked');
    var clickyKey     = $('#gear-clicky').val() || 'none';

    var mods = {};

    // Instrument skills: percussion, stringed, brass, wind
    // The Bard Epic (bardvalue=18, bardtype=51) acts as a floor of 18 for all
    // instrument mods when equipped.
    ['percussion', 'stringed', 'brass', 'wind'].forEach(function (type) {
      var selectedKey = $('#gear-' + type).val() || 'none';
      var itemMod = INSTRUMENTS[type][selectedKey] ? INSTRUMENTS[type][selectedKey].mod : 0;
      if (epicActive) itemMod = Math.max(itemMod, 18);
      var spellMod = puretone ? 10 : 0;
      var bestBase = Math.max(itemMod, spellMod);
      var total    = 10 + bestBase + instrumentMastery;
      var cap      = INSTRUMENT_SOFT_CAP + instrumentMastery;
      if (total > cap) total = cap;
      var multiplier = total / 10;

      mods[type] = {
        itemMod:    itemMod,
        aaMod:      instrumentMastery,
        ampMod:     spellMod,
        total:      total,
        multiplier: multiplier
      };
    });

    // Singing — the Epic is the singing item (bardtype=51 covers singing too)
    var singingItemMod = 0;
    if (epicActive) singingItemMod = Math.max(singingItemMod, 18);

    var ampBonus = 0;
    if (amplification) ampBonus += 9; // Amplification at lv60
    if (clickyKey && clickyKey !== 'none' && SINGING_CLICKIES[clickyKey]) {
      ampBonus += SINGING_CLICKIES[clickyKey].mod;
    }
    if (ampBonus > 28) ampBonus = 28;

    var singingTotal = 10 + Math.max(singingItemMod, ampBonus) + singingMastery;
    var singingCap   = INSTRUMENT_SOFT_CAP + singingMastery;
    if (singingTotal > singingCap) singingTotal = singingCap;
    var singingMultiplier = singingTotal / 10;

    mods['singing'] = {
      itemMod:    singingItemMod,
      aaMod:      singingMastery,
      ampMod:     ampBonus,
      total:      singingTotal,
      multiplier: singingMultiplier
    };

    return mods;
  }

  function updateModTable(mods) {
    var skills = ['percussion', 'stringed', 'brass', 'wind', 'singing'];
    skills.forEach(function (skill) {
      var m = mods[skill];
      $('#mod-' + skill + '-item').text(m.itemMod || '—');
      $('#mod-' + skill + '-aa').text(m.aaMod || '—');
      $('#mod-' + skill + '-amp').text(m.ampMod || '—');
      $('#mod-' + skill + '-total').text(m.total);
      $('#mod-' + skill + '-mult').text(m.multiplier.toFixed(2) + 'x');
    });
  }

  // -------------------------------------------------------------------------
  // GROUP COMPOSITION
  // -------------------------------------------------------------------------

  function getActiveMode() {
    return $('.mode-tab.active').data('mode') || 'group';
  }

  function hasClassType(classes, typeTag) {
    return classes.some(function (classId) {
      var cls = CLASSES.find(function (c) { return c.id === classId; });
      return cls && cls.type && cls.type.indexOf(typeTag) !== -1;
    });
  }

  function getGroupComposition() {
    var mode = getActiveMode();

    if (mode === 'solo') {
      return ['bard'];
    }

    if (mode === 'raid') {
      var classes = ['bard']; // bard always present
      $('.raid-count').each(function () {
        var classId = $(this).data('class');
        var count   = parseInt($(this).val(), 10) || 0;
        for (var i = 0; i < count; i++) {
          classes.push(classId);
        }
      });
      return classes;
    }

    // Group mode
    var classes = ['bard']; // slot-6 is always bard
    $('.class-select:not([disabled])').each(function () {
      var val = $(this).val();
      if (val && val !== 'empty') {
        classes.push(val);
      }
    });
    return classes;
  }

  // -------------------------------------------------------------------------
  // ENCOUNTER CONDITIONS
  // -------------------------------------------------------------------------

  function getEncounterConditions() {
    var dmgTypes = [];
    $('.dmg-toggle.active').each(function () {
      dmgTypes.push($(this).data('dmg'));
    });

    return {
      dmgTypes:    dmgTypes,
      slowNeeded:  $('#slow-needed').val() || 'auto',
      slowImmune:  $('#slow-immune').is(':checked'),
      resistDebuff: $('#resist-debuff').is(':checked')
    };
  }

  // -------------------------------------------------------------------------
  // SCORING
  // -------------------------------------------------------------------------

  function calcSongScore(song, classes, mods) {
    // Primary score: sum of class weights only.
    // Instrument mods are displayed in the modifier table and used as a
    // tiebreaker (higher instrument mod wins when class weight scores are equal),
    // but they do NOT affect the primary score. This prevents songs with large
    // raw effect numbers from outranking songs that are truly more valuable for
    // the group (e.g. Verses of Victory's 240 raw vs Warsong's 25 raw).
    var weightSum = 0;
    classes.forEach(function (classId) {
      var w = song.classWeights[classId];
      if (w) weightSum += w;
    });
    return weightSum;
  }

  function scoreSongs(classes, mods, encounter) {
    var mode = getActiveMode();
    var isRaid = (mode === 'raid');
    var isSolo = (mode === 'solo');

    // -----------------------------------------------------------------------
    // Step 1 — Filter candidates
    // -----------------------------------------------------------------------
    var candidates = SONGS.filter(function (song) {
      // raidOnly / soloOnly restrictions
      if (song.raidOnly && !isRaid) return false;
      if (song.soloOnly && !isSolo) return false;

      // eliminateIf logic
      if (song.eliminateIf && song.eliminateIf.length > 0) {
        var shouldEliminate = false;

        song.eliminateIf.forEach(function (typeTag) {
          if (hasClassType(classes, typeTag)) {
            // Special handling for slow songs
            if (typeTag === 'slower' && song.category === 'slow') {
              var slowNeeded = encounter.slowNeeded;
              if (slowNeeded === 'yes') {
                // Keep — explicit override
              } else {
                // 'auto' with slower present, or 'no' — eliminate
                shouldEliminate = true;
              }
            } else {
              shouldEliminate = true;
            }
          }
        });

        if (shouldEliminate) return false;
      }

      // slowImmune — remove all slow songs
      if (encounter.slowImmune && song.category === 'slow') return false;

      return true;
    });

    // -----------------------------------------------------------------------
    // Step 2 — Lock encounter-required songs
    // -----------------------------------------------------------------------
    var lockedSongs  = [];
    var lockedCategories = {};

    // Lock best resist song per active damage type
    encounter.dmgTypes.forEach(function (dmg) {
      // Find resist songs whose encounterTags include this dmg type
      var resistCandidates = candidates.filter(function (song) {
        return song.category && song.category.indexOf('resist_') === 0 &&
               song.encounterTags && song.encounterTags.indexOf(dmg) !== -1;
      });

      if (resistCandidates.length === 0) return;

      // Pick best scoring
      var best = null, bestScore = -1;
      resistCandidates.forEach(function (song) {
        var score = calcSongScore(song, classes, mods);
        if (score > bestScore) {
          bestScore = score;
          best = song;
        }
      });

      if (best && !lockedCategories[best.category]) {
        lockedSongs.push({ song: best, score: bestScore, reason: 'Resist: ' + dmg, locked: true });
        lockedCategories[best.category] = true;
      }
    });

    // Lock best slow song if slowNeeded === 'yes'
    if (encounter.slowNeeded === 'yes') {
      var slowCandidates = candidates.filter(function (song) {
        return song.category === 'slow';
      });

      if (slowCandidates.length > 0 && !lockedCategories['slow']) {
        var bestSlow = null, bestSlowScore = -1;
        slowCandidates.forEach(function (song) {
          var score = calcSongScore(song, classes, mods);
          if (score > bestSlowScore) {
            bestSlowScore = score;
            bestSlow = song;
          }
        });

        if (bestSlow) {
          lockedSongs.push({ song: bestSlow, score: bestSlowScore, reason: 'Slow: required', locked: true });
          lockedCategories['slow'] = true;
        }
      }
    }

    // -----------------------------------------------------------------------
    // Step 3 — Score remaining candidates
    // -----------------------------------------------------------------------
    var lockedIds = lockedSongs.map(function (e) { return e.song.id; });

    var scored = candidates
      .filter(function (song) { return lockedIds.indexOf(song.id) === -1; })
      .map(function (song) {
        return { song: song, score: calcSongScore(song, classes, mods), reason: null };
      })
      .sort(function (a, b) { return b.score - a.score; });

    // -----------------------------------------------------------------------
    // Step 4 — Build melody (greedy with category constraints)
    // -----------------------------------------------------------------------
    var MAX_SLOTS   = 4;
    var melody      = lockedSongs.slice();
    var usedCats    = {};
    var runnerUps   = [];

    // Mark locked categories as used
    lockedSongs.forEach(function (e) {
      usedCats[e.song.category] = true;
    });

    scored.forEach(function (entry) {
      if (melody.length >= MAX_SLOTS) {
        // All slots filled — displaced candidates become runner-ups
        if (runnerUps.length < 3) {
          runnerUps.push({
            song: entry.song,
            score: entry.score,
            reason: 'Melody full'
          });
        }
        return;
      }

      if (usedCats[entry.song.category]) {
        // Category already covered — runner-up
        if (runnerUps.length < 3) {
          runnerUps.push({
            song: entry.song,
            score: entry.score,
            reason: 'Category covered'
          });
        }
        return;
      }

      melody.push({ song: entry.song, score: entry.score, reason: null });
      usedCats[entry.song.category] = true;
    });

    return { melody: melody, runnerUps: runnerUps };
  }

  // -------------------------------------------------------------------------
  // RENDERING
  // -------------------------------------------------------------------------

  function renderResults(results) {
    var $melodyEl   = $('#melody-results');
    var $runnerUpsEl = $('#melody-runnerups');

    $melodyEl.empty();
    $runnerUpsEl.empty();

    if (results.melody.length === 0) {
      $melodyEl.html('<div class="results-empty">No songs match the current configuration.</div>');
      return;
    }

    // Find max score for bar scaling (across both melody + runner-ups)
    var allEntries = results.melody.concat(results.runnerUps);
    var maxScore = 0;
    allEntries.forEach(function (e) {
      if (e.score > maxScore) maxScore = e.score;
    });
    if (maxScore === 0) maxScore = 1; // avoid divide-by-zero

    function buildSongHtml(entry, isRunnerUp) {
      var song    = entry.song;
      var score   = Math.round(entry.score);
      var barPct  = maxScore > 0 ? Math.round((entry.score / maxScore) * 100) : 0;

      // Effects display
      var effectParts = song.effects.map(function (eff) {
        var label = eff.label || eff.type;
        var sign  = eff.value > 0 ? '+' : '';
        return label + ' ' + sign + eff.value;
      });
      var effectsHtml = effectParts.join(' &nbsp;·&nbsp; ');

      // Meta: level · instrument
      var instrName = INSTRUMENTS[song.instrument]
        ? Object.values(INSTRUMENTS[song.instrument])[0].name  // fallback
        : song.instrument;
      // Capitalize instrument name
      var instrLabel = song.instrument.charAt(0).toUpperCase() + song.instrument.slice(1);
      var metaHtml = 'Lv ' + song.level + ' &nbsp;·&nbsp; ' + instrLabel;

      // Reason tag
      var tagHtml = '';
      if (entry.reason) {
        tagHtml = '<div class="melody-song-tag">' + entry.reason + '</div>';
      }

      var wrapClass = 'melody-song' + (isRunnerUp ? ' runnerup-song' : '');

      return (
        '<div class="' + wrapClass + '">' +
          '<div class="melody-song-icon">&#9835;</div>' +
          '<div class="melody-song-info">' +
            '<div class="melody-song-name">' + song.name + '</div>' +
            '<div class="melody-song-meta">' + metaHtml + '</div>' +
            '<div class="melody-song-effects">' + effectsHtml + '</div>' +
            tagHtml +
          '</div>' +
          '<div class="melody-song-score">' +
            '<div class="score-value">' + score + '</div>' +
            '<div class="score-bar"><div class="score-bar-fill" style="width:' + barPct + '%"></div></div>' +
          '</div>' +
        '</div>'
      );
    }

    results.melody.forEach(function (entry) {
      $melodyEl.append(buildSongHtml(entry, false));
    });

    if (results.runnerUps.length > 0) {
      results.runnerUps.forEach(function (entry) {
        $runnerUpsEl.append(buildSongHtml(entry, true));
      });
    } else {
      $runnerUpsEl.html('<div class="results-empty">No runner-ups available.</div>');
    }
  }

  // -------------------------------------------------------------------------
  // MAIN LOOP
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // KICK OFF
  // -------------------------------------------------------------------------

  init();

}); // end $(function)
