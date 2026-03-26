$(function () {

  // === Nav Loader ===
  $('#nav-placeholder').load('/partials/nav.html', function () {
    initNavDropdowns();
    initMobileNav();
    initComingSoonModal();
    initSearch();
  });

  // === Nav Dropdowns (desktop) ===
  function initNavDropdowns() {
    $('.nav-has-dropdown').on('click', function (e) {
      e.preventDefault();
      var dropdownId = '#dropdown-' + $(this).data('dropdown');
      var $dropdown = $(dropdownId);
      // Close others
      $('.nav-dropdown').not($dropdown).removeClass('open');
      $dropdown.toggleClass('open');
    });

    // Close on click outside
    $(document).on('click', function (e) {
      if (!$(e.target).closest('.nav-links').length) {
        $('.nav-dropdown').removeClass('open');
      }
    });
  }

  // === Mobile Nav ===
  function initMobileNav() {
    $('.hamburger').on('click', function () {
      $('.mobile-nav').toggleClass('open');
    });

    $('.mobile-category').on('click', function () {
      var cat = $(this).data('mobile-cat');
      $('#mobile-' + cat).toggleClass('open');
    });

    // Close button
    $('.mobile-nav-close').on('click', function () {
      $('.mobile-nav').removeClass('open');
    });

    // Close mobile nav when a link is clicked
    $('.mobile-nav a').on('click', function () {
      $('.mobile-nav').removeClass('open');
    });
  }

  // === Collapsible Sections ===
  $('.collapsible-header').on('click', function () {
    var $header = $(this);
    var $body = $header.next('.collapsible-body');
    $header.toggleClass('open');
    $body.slideToggle(200);
  });

  // === Quest Step Checkboxes ===
  var pageKey = 'lyrical_' + window.location.pathname.replace(/[^a-z0-9]/gi, '_');

  // Restore saved state
  $('.quest-step-checkbox').each(function () {
    var stepId = $(this).data('step');
    var key = pageKey + '_' + stepId;
    if (localStorage.getItem(key) === 'true') {
      $(this).prop('checked', true);
      $(this).closest('.quest-step').addClass('checked');
    }
  });

  // Save on change
  $('.quest-step-checkbox').on('change', function (e) {
    e.stopPropagation();
    var stepId = $(this).data('step');
    var key = pageKey + '_' + stepId;
    var checked = $(this).is(':checked');
    localStorage.setItem(key, checked);
    $(this).closest('.quest-step').toggleClass('checked', checked);
  });

  // Quest step collapsible (click header to expand, but not checkbox)
  $('.quest-step-header').on('click', function (e) {
    if ($(e.target).is('.quest-step-checkbox')) return;
    var $step = $(this).closest('.quest-step');
    $step.find('.arrow').toggleClass('open');
    $step.find('.quest-step-body').slideToggle(200);
  });

  // === Coming Soon Modal ===
  function initComingSoonModal() {
    $(document).on('click', '[data-coming-soon]', function (e) {
      e.preventDefault();
      $('#coming-soon-modal').addClass('open');
    });

    // Close on X button
    $(document).on('click', '.modal-close', function () {
      $('#coming-soon-modal').removeClass('open');
    });

    // Close on overlay click (not modal box)
    $(document).on('click', '.modal-overlay', function (e) {
      if ($(e.target).hasClass('modal-overlay')) {
        $(this).removeClass('open');
      }
    });

    // Close on Escape
    $(document).on('keydown', function (e) {
      if (e.key === 'Escape') {
        $('#coming-soon-modal').removeClass('open');
      }
    });
  }

  // === Site Search ===
  function initSearch() {
    var fuseInstance = null;
    var searchData = [];
    var debounceTimer = null;

    // Load Fuse.js dynamically, then fetch index
    $.getScript('https://cdn.jsdelivr.net/npm/fuse.js@7.0.0').done(function () {
      $.getJSON('/search-index.json').done(function (data) {
        searchData = data;
        fuseInstance = new Fuse(data, {
          keys: [
            { name: 'title', weight: 2 },
            { name: 'tags', weight: 1.5 },
            { name: 'description', weight: 1 },
            { name: 'category', weight: 0.5 }
          ],
          threshold: 0.4,
          includeScore: true
        });
      });
    });

    function openSearch() {
      $('#search-overlay').addClass('open');
      $('#search-input').val('').focus();
      $('#search-results').html('<div class="search-placeholder">Start typing to search guides...</div>');
    }

    function closeSearch() {
      $('#search-overlay').removeClass('open');
    }

    function renderResults(query) {
      if (!query.trim()) {
        $('#search-results').html('<div class="search-placeholder">Start typing to search guides...</div>');
        return;
      }

      if (!fuseInstance) {
        $('#search-results').html('<div class="search-placeholder">Search is loading...</div>');
        return;
      }

      var results = fuseInstance.search(query);

      if (results.length === 0) {
        $('#search-results').html('<div class="search-placeholder">No guides found</div>');
        return;
      }

      var html = '';
      for (var i = 0; i < results.length; i++) {
        var item = results[i].item;
        html += '<a href="' + item.url + '" class="search-result-item"' +
          (item.url !== '/songs/twisting.html' ? ' data-coming-soon' : '') + '>' +
          '<div class="search-result-category">' + item.category + '</div>' +
          '<div class="search-result-title">' + item.title + '</div>' +
          '<div class="search-result-desc">' + item.description + '</div>' +
          '</a>';
      }
      $('#search-results').html(html);
    }

    // Open search
    $(document).on('click', '.nav-search-btn', function () {
      openSearch();
    });

    // Close search
    $(document).on('click', '.search-close', function () {
      closeSearch();
    });

    $(document).on('click', '.search-overlay', function (e) {
      if ($(e.target).hasClass('search-overlay')) {
        closeSearch();
      }
    });

    // Live search with debounce
    $(document).on('input', '#search-input', function () {
      var query = $(this).val();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        renderResults(query);
      }, 150);
    });

    // Keyboard shortcuts
    $(document).on('keydown', function (e) {
      // Ctrl+K or / to open (when not in input)
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !$(e.target).is('input, textarea'))) {
        e.preventDefault();
        openSearch();
      }
      // Escape to close search (search takes priority over modal)
      if (e.key === 'Escape' && $('#search-overlay').hasClass('open')) {
        e.stopImmediatePropagation();
        closeSearch();
      }
    });

    // Click result — close search, let navigation happen (or coming-soon modal)
    $(document).on('click', '.search-result-item', function () {
      closeSearch();
    });
  }

  // === Back to Top ===
  $(window).on('scroll', function () {
    if ($(window).scrollTop() > 300) {
      $('.back-to-top').addClass('visible');
    } else {
      $('.back-to-top').removeClass('visible');
    }
  });

  $('.back-to-top').on('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

});
