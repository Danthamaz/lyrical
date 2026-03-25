$(function () {

  // === Nav Loader ===
  $('#nav-placeholder').load('/partials/nav.html', function () {
    initNavDropdowns();
    initMobileNav();
    initComingSoonModal();
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
