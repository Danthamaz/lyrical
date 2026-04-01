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
  // INIT
  // -------------------------------------------------------------------------

  function init() {
    populateClassDropdowns();
    populateRaidGrid();
    populateInstrumentDropdowns();
    populateClickyDropdown();
    restoreGearState();
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
      recalculate();
    });

    // Solo style buttons
    $(document).on('click', '.solo-btn', function () {
      $('.solo-btn').removeClass('active');
      $(this).addClass('active');
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
      '#gear-clicky'
    ];
    $(document).on('change', changeSelectors.join(','), function () {
      recalculate();
    });
  }

  // -------------------------------------------------------------------------
  // MODIFIER CALCULATION
  // -------------------------------------------------------------------------

  function calcModifiers() {
    var instrumentMastery = parseInt($('#gear-instrument-mastery').val(), 10) || 0;
    var singingMastery    = parseInt($('#gear-singing-mastery').val(), 10) || 0;
    var puretone          = $('#gear-puretone').is(':checked');
    var amplification     = $('#gear-amplification').is(':checked');
    var clickyKey         = $('#gear-clicky').val() || 'none';

    var mods = {};

    // Instrument skills: percussion, stringed, brass, wind
    ['percussion', 'stringed', 'brass', 'wind'].forEach(function (type) {
      var selectedKey = $('#gear-' + type).val() || 'none';
      var itemMod  = INSTRUMENTS[type][selectedKey] ? INSTRUMENTS[type][selectedKey].mod : 0;
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

    // Singing
    var ampBonus = 0;
    if (amplification) ampBonus += 9; // Amplification at lv60
    if (clickyKey && clickyKey !== 'none' && SINGING_CLICKIES[clickyKey]) {
      ampBonus += SINGING_CLICKIES[clickyKey].mod;
    }
    if (ampBonus > 28) ampBonus = 28;

    var singingTotal = 10 + singingMastery + ampBonus;
    var singingCap   = INSTRUMENT_SOFT_CAP + singingMastery;
    if (singingTotal > singingCap) singingTotal = singingCap;
    var singingMultiplier = singingTotal / 10;

    mods['singing'] = {
      itemMod:    0,
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
    var weightSum = 0;
    classes.forEach(function (classId) {
      var w = song.classWeights[classId];
      if (w) weightSum += w;
    });

    if (weightSum === 0) return 0;

    var mod = mods[song.instrument] || { multiplier: 1 };
    var effectiveValue = 0;

    song.effects.forEach(function (eff) {
      var val = Math.abs(eff.value);
      if (eff.moddable) val = val * mod.multiplier;
      effectiveValue += val;
    });

    return weightSum * effectiveValue;
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
    var classes   = getGroupComposition();
    var encounter = getEncounterConditions();
    var results   = scoreSongs(classes, mods, encounter);
    renderResults(results);
    saveGearState();
  }

  // -------------------------------------------------------------------------
  // KICK OFF
  // -------------------------------------------------------------------------

  init();

}); // end $(function)
