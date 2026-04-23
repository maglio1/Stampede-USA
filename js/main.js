/**
 * STAMPEDE USA — main.js
 * Standalone version for GitHub/Netlify/Vercel deploy
 *
 * Audit fixes applied:
 * - Acuity + Google Maps iframes lazy-loaded via IntersectionObserver
 * - Modal focus trap (Tab/Shift+Tab cycles within modal)
 * - Email obfuscation: decoded at runtime, never in HTML source
 * - Escape key closes modal AND mobile menu
 * - ARIA expanded states maintained on nav toggle
 * - Smooth scroll accounts for fixed nav height
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     CONFIG — update these without hunting through the code
  ══════════════════════════════════════════════════════════ */
  var CONFIG = {
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzH5_3OAvMgQuBhQ3ovT8M5s51SeqfqFgtsmWWvmpkfq6OoC0VhDQuWq3tKC1KXl8KS/exec',
    EMAIL_PARTS: ['charge', 'stampedeusa.com'],  // obfuscated — joined at runtime
    EMAIL_DISPLAY: 'Charge@StampedeUSA.com',     // branded display casing
    PHONE: 'tel:+17034362716',
    SMS: 'sms:+17033014733',                     // text-capable burner line
    NAV_HEIGHT: 80,
    STICKY_BAR_THRESHOLD: 400
  };

  /* ══════════════════════════════════════════════════════════
     EMAIL OBFUSCATION
     Decoded at runtime — bots scraping static HTML get nothing.
     All email-displaying elements use id/class hooks, not href.
  ══════════════════════════════════════════════════════════ */
  function initEmailObfuscation() {
    var email = CONFIG.EMAIL_PARTS[0] + '@' + CONFIG.EMAIL_PARTS[1];

    // Footer display span — use branded casing if defined
    var displayEl = document.getElementById('stmp-email-display');
    if (displayEl) displayEl.textContent = CONFIG.EMAIL_DISPLAY || email;

    // Footer mailto link
    var emailLink = document.getElementById('stmp-footer-email-link');
    if (emailLink) emailLink.setAttribute('href', 'mailto:' + email);
  }

  /* ══════════════════════════════════════════════════════════
     NAVIGATION — scroll state + sticky bar
  ══════════════════════════════════════════════════════════ */
  function initNav() {
    var nav = document.getElementById('stmp-nav');
    var stickyBar = document.getElementById('stmp-sticky-bar');

    window.addEventListener('scroll', function () {
      if (nav) nav.classList.toggle('scrolled', window.scrollY > CONFIG.NAV_HEIGHT);
      if (stickyBar) stickyBar.classList.toggle('visible', window.scrollY > CONFIG.STICKY_BAR_THRESHOLD);
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════════════
     MOBILE MENU
  ══════════════════════════════════════════════════════════ */
  function initMobileMenu() {
    var navToggle = document.getElementById('stmpNavToggle');
    var mobileMenu = document.getElementById('stmp-mobile-menu');
    var mobileClose = document.getElementById('stmpMobileClose');

    function openMobileMenu() {
      if (!mobileMenu) return;
      mobileMenu.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
    }

    function closeMobileMenu() {
      if (!mobileMenu) return;
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
      if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    }

    if (navToggle) navToggle.addEventListener('click', function () {
      mobileMenu && mobileMenu.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
    });

    if (mobileClose) mobileClose.addEventListener('click', closeMobileMenu);

    if (mobileMenu) {
      mobileMenu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMobileMenu);
      });
    }

    // Expose for ESC key handler
    window._stmpCloseMobileMenu = closeMobileMenu;
  }

  /* ══════════════════════════════════════════════════════════
     SMOOTH SCROLL
     Accounts for fixed nav height, skips audit-trigger links
  ══════════════════════════════════════════════════════════ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var href = this.getAttribute('href');
        if (!href || href === '#') return;

        // Let modal triggers handle themselves
        if (
          this.classList.contains('audit-trigger') ||
          this.classList.contains('stmp-nav-cta') ||
          this.classList.contains('mobileAuditBtn')
        ) return;

        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          window.scrollTo({
            top: target.offsetTop - CONFIG.NAV_HEIGHT,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     REVEAL ANIMATIONS — IntersectionObserver
  ══════════════════════════════════════════════════════════ */
  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.stmp-reveal').forEach(function (el) {
        el.classList.add('revealed');
      });
      return;
    }

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.stmp-reveal').forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ══════════════════════════════════════════════════════════
     LAZY IFRAMES
     Google Maps loads only when scrolled into view.
     (Acuity iframe removed in favor of native strategy-call form.)
  ══════════════════════════════════════════════════════════ */
  function initLazyIframes() {
    var map = document.getElementById('mapIframe');
    var mapContainer = document.getElementById('mapContainer');
    if (!map || !mapContainer) return;

    if (!('IntersectionObserver' in window)) {
      loadIframe('mapIframe', 'mapPlaceholder');
      return;
    }

    // IntersectionObserver on a display:none element never fires. Observe the
    // visible wrapper instead, and swap in the iframe when it scrolls close.
    var iframeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          loadIframe('mapIframe', 'mapPlaceholder');
          iframeObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px' });

    iframeObserver.observe(mapContainer);
  }

  function loadIframe(iframeId, placeholderId) {
    var iframe = document.getElementById(iframeId);
    var placeholder = document.getElementById(placeholderId);
    if (!iframe) return;
    var src = iframe.getAttribute('data-src');
    if (!src) return;
    iframe.setAttribute('src', src);
    iframe.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
    if (iframeId === 'mapIframe') iframe.style.height = '300px';
  }

  /* ══════════════════════════════════════════════════════════
     TESTIMONIAL CAROUSEL
  ══════════════════════════════════════════════════════════ */
  function initCarousel() {
    var track = document.getElementById('stmpResultsTrack');
    var dots = document.querySelectorAll('.stmp-carousel-dot');
    var currentSlide = 0;
    var totalSlides = dots.length;
    var autoplayInterval;
    var touchStartX = 0;

    if (!track || !totalSlides) return;

    function goToSlide(i) {
      currentSlide = i;
      track.style.transform = 'translateX(-' + (i * 100) + '%)';
      dots.forEach(function (d, idx) {
        d.classList.toggle('active', idx === i);
        d.setAttribute('aria-selected', String(idx === i));
      });
    }

    function startAutoplay() {
      autoplayInterval = setInterval(function () {
        goToSlide((currentSlide + 1) % totalSlides);
      }, 5000);
    }

    function stopAutoplay() {
      clearInterval(autoplayInterval);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        stopAutoplay();
        goToSlide(i);
        startAutoplay();
      });
    });

    track.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
      stopAutoplay();
    }, { passive: true });

    track.addEventListener('touchend', function (e) {
      var diff = touchStartX - e.changedTouches[0].screenX;
      if (diff > 50) goToSlide((currentSlide + 1) % totalSlides);
      else if (diff < -50) goToSlide((currentSlide - 1 + totalSlides) % totalSlides);
      startAutoplay();
    }, { passive: true });

    // Pause on hover
    track.addEventListener('mouseenter', stopAutoplay);
    track.addEventListener('mouseleave', startAutoplay);

    startAutoplay();
  }

  /* ══════════════════════════════════════════════════════════
     AUDIT MODAL — AUDIT FIX
     Proper focus trap: Tab cycles through focusable elements.
     Focus returns to trigger element on close.
     aria-hidden toggled on body content while modal is open.
  ══════════════════════════════════════════════════════════ */
  var lastFocusedElement = null;

  function initModal() {
    var modal = document.getElementById('stmp-audit-modal');
    var backdrop = document.getElementById('modalBackdrop');
    var closeBtn = document.getElementById('modalClose');
    var auditForm = document.getElementById('auditForm');
    var formView = document.getElementById('modal-form-view');
    var successView = document.getElementById('modal-success-view');
    var submitBtn = document.getElementById('auditSubmitBtn');

    if (!modal) return;

    function openModal() {
      lastFocusedElement = document.activeElement;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      // Focus first field after animation
      setTimeout(function () {
        var firstField = modal.querySelector('input, select, button');
        if (firstField) firstField.focus();
      }, 100);
    }

    function closeModal() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      // Return focus to trigger element
      if (lastFocusedElement) lastFocusedElement.focus();
    }

    // FOCUS TRAP — keeps Tab key cycling within modal
    modal.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;

      var focusable = modal.querySelectorAll(
        'input, select, textarea, button, a[href], [tabindex]:not([tabindex="-1"])'
      );
      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Open triggers — all .audit-trigger elements + nav CTA + mobile CTA
    document.querySelectorAll('.audit-trigger, #navAuditBtn, .mobileAuditBtn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        // Close mobile menu if open
        if (window._stmpCloseMobileMenu) window._stmpCloseMobileMenu();
        openModal();
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    // FORM SUBMISSION
    if (auditForm) {
      auditForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Honeypot: if the hidden field is populated, it's a bot.
        // Show fake success, don't send, don't tell.
        var hp = auditForm.querySelector('input[name="website_confirm"]');
        if (hp && hp.value) {
          if (formView) formView.hidden = true;
          if (successView) successView.hidden = false;
          return;
        }

        var firstNameEl = auditForm.querySelector('#auditFirstName');
        var emailEl = auditForm.querySelector('#auditEmail');
        var websiteEl = auditForm.querySelector('#auditWebsite');

        // Basic validation
        if (!firstNameEl.value.trim() || !emailEl.value.trim() || !websiteEl.value.trim()) {
          var missing = [firstNameEl, emailEl, websiteEl].find(function (el) {
            return !el.value.trim();
          });
          if (missing) {
            missing.focus();
            missing.style.borderColor = '#EF4444';
            missing.addEventListener('input', function () {
              missing.style.borderColor = '';
            }, { once: true });
          }
          return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
          emailEl.focus();
          emailEl.style.borderColor = '#EF4444';
          return;
        }

        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        var payload = {
          form_type: 'audit_request',
          firstName: firstNameEl.value.trim(),
          lastName: (auditForm.querySelector('#auditLastName') || {}).value || '',
          email: emailEl.value.trim(),
          phone: (auditForm.querySelector('#auditPhone') || {}).value || '',
          website: websiteEl.value.trim(),
          employees: (auditForm.querySelector('#auditEmployees') || {}).value || '',
          adSpend: (auditForm.querySelector('#auditAdSpend') || {}).value || '',
          challenge: (auditForm.querySelector('#auditChallenge') || {}).value || '',
          page_url: location.href,
          timestamp: new Date().toISOString()
        };

        fetch(CONFIG.APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload)
        }).catch(function () {
          // no-cors mode always throws — this is expected
        });

        // Show success after brief delay (no-cors gives no confirmation)
        setTimeout(function () {
          if (formView) formView.hidden = true;
          if (successView) successView.hidden = false;
        }, 700);
      });
    }

    // Expose for ESC key handler
    window._stmpCloseModal = closeModal;
  }

  /* ══════════════════════════════════════════════════════════
     NEWSLETTER FORM
  ══════════════════════════════════════════════════════════ */
  function initNewsletter() {
    var form = document.getElementById('footerNewsletter');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot: populated hidden field = bot. Fake success, silent drop.
      var hp = this.querySelector('input[name="website_confirm"]');
      if (hp && hp.value) {
        var btnEl = this.querySelector('button');
        if (btnEl) {
          btnEl.textContent = 'Done!';
          btnEl.disabled = true;
        }
        return;
      }

      var emailInput = this.querySelector('input[name="email"]');
      var btn = this.querySelector('button');
      var email = emailInput.value.trim();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailInput.style.borderColor = '#EF4444';
        emailInput.focus();
        emailInput.addEventListener('input', function () {
          emailInput.style.borderColor = '';
        }, { once: true });
        return;
      }

      btn.textContent = '...';
      btn.disabled = true;

      fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          form_type: 'newsletter',
          email: email,
          page_url: location.href
        })
      }).catch(function () {});

      setTimeout(function () {
        btn.textContent = 'Done!';
        emailInput.value = '';
        setTimeout(function () {
          btn.textContent = 'Charge';
          btn.disabled = false;
        }, 2500);
      }, 600);
    });
  }

  /* ══════════════════════════════════════════════════════════
     COOKIE CONSENT — Consent Mode v2 banner
     Default state is 'denied' (set inline in each page's <head>).
     Accept upgrades storage consents + sets localStorage flag.
     Decline just records the choice. Banner never reappears either way.
  ══════════════════════════════════════════════════════════ */
  function initConsentBanner() {
    var stored;
    try { stored = localStorage.getItem('stmp_consent'); } catch(e) { stored = null; }
    if (stored === 'granted' || stored === 'denied') return;

    var banner = document.createElement('div');
    banner.className = 'stmp-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie preferences');
    banner.innerHTML =
      '<div class="stmp-consent-text">' +
        'We use cookies for basic analytics so we can see what works and what doesn\'t. ' +
        'You can turn that off and still use the site just fine. ' +
        '<a href="privacy-policy.html">Privacy Policy</a>.' +
      '</div>' +
      '<div class="stmp-consent-actions">' +
        '<button type="button" class="stmp-consent-btn" data-consent="denied">Decline</button>' +
        '<button type="button" class="stmp-consent-btn stmp-consent-btn--accept" data-consent="granted">Accept</button>' +
      '</div>';
    document.body.appendChild(banner);

    // Slight delay so transform transition plays
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        banner.classList.add('is-visible');
      });
    });

    banner.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-consent]');
      if (!btn) return;
      var choice = btn.getAttribute('data-consent');
      try { localStorage.setItem('stmp_consent', choice); } catch(e) {}
      if (choice === 'granted' && typeof gtag === 'function') {
        gtag('consent', 'update', {
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted',
          analytics_storage: 'granted'
        });
      }
      banner.classList.remove('is-visible');
      setTimeout(function() { banner.remove(); }, 400);
    });
  }

  /* ══════════════════════════════════════════════════════════
     SCHEDULER — calendar picker + time slot + contact form
     Visually mirrors Calendly/Acuity. Availability is universal
     (any weekday slot in the next ~8 weeks). Double-booking is
     intentionally possible; Matt confirms the actual slot via email.
  ══════════════════════════════════════════════════════════ */
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var TIME_SLOTS = [
    '9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
    '1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM'
  ];

  function initScheduler() {
    var root = document.getElementById('stmpScheduler');
    if (!root) return;

    var form = root.querySelector('#strategyCallForm');
    var submitBtn = root.querySelector('#scSubmitBtn');
    var calGrid = root.querySelector('#stmpCalGrid');
    var calTitle = root.querySelector('#stmpCalTitle');
    var prevBtn = root.querySelector('#stmpCalPrev');
    var nextBtn = root.querySelector('#stmpCalNext');
    var timeGrid = root.querySelector('#stmpTimeGrid');
    var timeDateLabel = root.querySelector('#stmpTimeDateLabel');
    var formWhenLabel = root.querySelector('#stmpFormWhenLabel');
    var successWhen = root.querySelector('#stmpSuccessWhen');
    var window1Hidden = root.querySelector('#scWindow1');
    var steps = root.querySelectorAll('.stmp-sched-step');
    var dots = root.querySelectorAll('.stmp-sched-step-dot');
    var lines = root.querySelectorAll('.stmp-sched-step-line');

    var today = new Date();
    today.setHours(0,0,0,0);
    var viewMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    var selectedDate = null;  // Date
    var selectedTime = null;  // string

    // How far forward can a user book. 8 weeks is generous and honest.
    var bookingHorizon = new Date(today);
    bookingHorizon.setDate(today.getDate() + 56);

    function goToStep(name) {
      steps.forEach(function(s) { s.hidden = s.getAttribute('data-step') !== name; });
      var stepIndex = { calendar:1, time:2, form:3, success:3 }[name] || 1;
      dots.forEach(function(d) {
        var idx = parseInt(d.getAttribute('data-dot'), 10);
        d.classList.toggle('is-active', idx === stepIndex);
        d.classList.toggle('is-done', idx < stepIndex);
      });
      lines.forEach(function(l, i) {
        l.classList.toggle('is-done', (i + 1) < stepIndex);
      });
    }

    function sameDay(a, b) {
      return a && b && a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
    }

    function formatLongDate(d) {
      return WEEKDAYS[d.getDay()].replace('Sun','Sunday').replace('Mon','Monday').replace('Tue','Tuesday').replace('Wed','Wednesday').replace('Thu','Thursday').replace('Fri','Friday').replace('Sat','Saturday')
        + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate();
    }

    function renderCalendar() {
      calTitle.textContent = MONTHS[viewMonth.getMonth()] + ' ' + viewMonth.getFullYear();
      calGrid.innerHTML = '';

      var firstDow = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
      var daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();

      // Empty cells before day 1
      for (var i = 0; i < firstDow; i++) {
        var empty = document.createElement('div');
        empty.className = 'stmp-cal-cell is-empty';
        empty.setAttribute('aria-hidden', 'true');
        calGrid.appendChild(empty);
      }

      for (var d = 1; d <= daysInMonth; d++) {
        var cellDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'stmp-cal-cell';
        btn.textContent = String(d);
        btn.setAttribute('role', 'gridcell');

        var isPast = cellDate < today;
        var isBeyondHorizon = cellDate > bookingHorizon;
        var isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;

        if (sameDay(cellDate, today))       btn.classList.add('is-today');
        if (sameDay(cellDate, selectedDate)) btn.classList.add('is-selected');
        if (isPast || isBeyondHorizon || isWeekend) {
          btn.disabled = true;
          if (isWeekend && !isPast) btn.title = 'Weekdays only';
        } else {
          (function(cd) {
            btn.addEventListener('click', function() { onDateSelect(cd); });
          })(cellDate);
        }
        calGrid.appendChild(btn);
      }

      // Prev disabled if current month is viewed
      prevBtn.disabled = viewMonth.getFullYear() === today.getFullYear()
        && viewMonth.getMonth() === today.getMonth();
      // Next disabled past horizon month
      var horizonMonth = new Date(bookingHorizon.getFullYear(), bookingHorizon.getMonth(), 1);
      nextBtn.disabled = viewMonth.getFullYear() === horizonMonth.getFullYear()
        && viewMonth.getMonth() === horizonMonth.getMonth();
    }

    function onDateSelect(date) {
      selectedDate = date;
      renderCalendar();
      timeDateLabel.textContent = formatLongDate(date);
      renderTimes();
      goToStep('time');
    }

    function renderTimes() {
      timeGrid.innerHTML = '';
      TIME_SLOTS.forEach(function(slot) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'stmp-time-slot';
        btn.textContent = slot;
        btn.setAttribute('role', 'listitem');
        btn.addEventListener('click', function() { onTimeSelect(slot); });
        timeGrid.appendChild(btn);
      });
    }

    function onTimeSelect(time) {
      selectedTime = time;
      var label = formatLongDate(selectedDate) + ' at ' + time + ' ET';
      formWhenLabel.textContent = label;
      if (window1Hidden) window1Hidden.value = label;
      goToStep('form');
    }

    // Back buttons
    root.querySelectorAll('[data-back]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        goToStep(btn.getAttribute('data-back'));
      });
    });

    prevBtn.addEventListener('click', function() {
      viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
      renderCalendar();
    });
    nextBtn.addEventListener('click', function() {
      viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
      renderCalendar();
    });

    // Form submission
    function showSuccess() {
      var label = selectedDate && selectedTime
        ? formatLongDate(selectedDate) + ' at ' + selectedTime + ' ET'
        : 'your call';
      if (successWhen) successWhen.textContent = label;
      goToStep('success');
    }

    form.addEventListener('submit', function(e) {
      e.preventDefault();

      // Honeypot: silent fake success
      var hp = form.querySelector('input[name="website_confirm"]');
      if (hp && hp.value) { showSuccess(); return; }

      function clearErrors() {
        form.querySelectorAll('.has-error').forEach(function(g) {
          g.classList.remove('has-error');
        });
      }
      function flagError(selector) {
        var el = form.querySelector(selector);
        if (!el) return;
        var group = el.closest('.stmp-form-group');
        if (group) group.classList.add('has-error');
        el.focus();
      }

      clearErrors();

      var firstName = form.querySelector('#scFirstName').value.trim();
      var email = form.querySelector('#scEmail').value.trim();
      var phone = form.querySelector('#scPhone').value.trim();

      if (!firstName) { flagError('#scFirstName'); return; }
      if (!email)     { flagError('#scEmail'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { flagError('#scEmail'); return; }
      if (!phone)     { flagError('#scPhone'); return; }

      submitBtn.textContent = 'Booking...';
      submitBtn.disabled = true;

      var when = selectedDate && selectedTime
        ? formatLongDate(selectedDate) + ' at ' + selectedTime + ' ET'
        : '';

      var payload = {
        form_type: 'strategy_call',
        firstName: firstName,
        lastName: form.querySelector('#scLastName').value.trim(),
        email: email,
        phone: phone,
        business: form.querySelector('#scBusiness').value.trim(),
        window1: when,
        note: form.querySelector('#scNote').value.trim(),
        page_url: location.href,
        timestamp: new Date().toISOString()
      };

      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead', {
          form_type: 'strategy_call',
          page_location: location.href,
          value: 75
        });
      }

      fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      }).catch(function() {});

      setTimeout(showSuccess, 700);
    });

    // Initial render
    renderCalendar();
    goToStep('calendar');
  }

  /* ══════════════════════════════════════════════════════════
     KEYBOARD HANDLERS — ESC closes modal and mobile menu
  ══════════════════════════════════════════════════════════ */
  function initKeyboard() {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var modal = document.getElementById('stmp-audit-modal');
        var mobileMenu = document.getElementById('stmp-mobile-menu');

        if (modal && modal.classList.contains('open')) {
          if (window._stmpCloseModal) window._stmpCloseModal();
        } else if (mobileMenu && mobileMenu.classList.contains('open')) {
          if (window._stmpCloseMobileMenu) window._stmpCloseMobileMenu();
        }
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     INIT — run all modules on DOMContentLoaded
  ══════════════════════════════════════════════════════════ */
  function init() {
    initEmailObfuscation();
    initNav();
    initMobileMenu();
    initSmoothScroll();
    initReveal();
    initLazyIframes();
    initCarousel();
    initModal();
    initNewsletter();
    initScheduler();
    // initConsentBanner();  // disabled while Stampede is too small to hit
                             // VCDPA/CCPA thresholds. Re-enable when we scale
                             // by uncommenting this AND restoring the Consent
                             // Mode v2 defaults in each page's head gtag snippet.
    initKeyboard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init(); // DOM already ready
  }

})();
