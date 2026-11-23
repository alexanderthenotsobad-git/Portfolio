(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------------ *
   * Header state
   * ------------------------------------------------------------------ */
  const header = document.getElementById('site-header');

  function syncHeader() {
    if (!header) return;
    header.dataset.scrolled = window.scrollY > 8 ? 'true' : 'false';
  }

  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });

  /* ------------------------------------------------------------------ *
   * Mobile menu
   * ------------------------------------------------------------------ */
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuLinks = mobileMenu ? Array.from(mobileMenu.querySelectorAll('a[href]')) : [];
  let lastFocusedElement = null;

  function isMenuOpen() {
    return mobileMenu && !mobileMenu.hidden;
  }

  function openMenu() {
    if (!mobileMenu || !menuToggle || isMenuOpen()) return;
    lastFocusedElement = document.activeElement;
    mobileMenu.hidden = false;
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('menu-open');
    const firstLink = mobileMenu.querySelector('a[href], button:not([disabled])');
    if (firstLink) {
      window.requestAnimationFrame(function () {
        firstLink.focus();
      });
    }
  }

  function closeMenu(returnFocus) {
    if (!mobileMenu || !menuToggle || !isMenuOpen()) return;
    mobileMenu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('menu-open');
    if (returnFocus !== false) {
      const focusTarget =
        lastFocusedElement && document.contains(lastFocusedElement)
          ? lastFocusedElement
          : menuToggle;
      focusTarget.focus();
    }
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      if (isMenuOpen()) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    menuLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        closeMenu(false);
      });
    });

    document.addEventListener('keydown', function (event) {
      if (!isMenuOpen()) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        mobileMenu.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(function (element) {
        return element.offsetParent !== null;
      });

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    const desktopQuery = window.matchMedia('(min-width: 960px)');
    const handleDesktop = function (event) {
      if (event.matches && isMenuOpen()) {
        closeMenu(false);
      }
    };

    if (typeof desktopQuery.addEventListener === 'function') {
      desktopQuery.addEventListener('change', handleDesktop);
    } else if (typeof desktopQuery.addListener === 'function') {
      desktopQuery.addListener(handleDesktop);
    }
  }

  /* ------------------------------------------------------------------ *
   * Project filters
   * ------------------------------------------------------------------ */
  const filterButtons = Array.from(document.querySelectorAll('.filter'));
  const projectCards = Array.from(document.querySelectorAll('.project-card'));
  const workGrid = document.getElementById('work-grid');
  const filterCount = document.getElementById('filter-count');
  const emptyState = document.getElementById('empty-state');
  const totalProjects = projectCards.length;

  function applyFilter(filter) {
    if (!workGrid) return;

    let visibleCount = 0;

    projectCards.forEach(function (card) {
      const categories = (card.dataset.categories || '').split(/\s+/);
      const shouldShow = filter === 'all' || categories.indexOf(filter) !== -1;
      card.hidden = !shouldShow;
      if (shouldShow) {
        visibleCount += 1;
      }
    });

    workGrid.dataset.visible = String(visibleCount);

    filterButtons.forEach(function (button) {
      button.setAttribute(
        'aria-pressed',
        button.dataset.filter === filter ? 'true' : 'false'
      );
    });

    if (filterCount) {
      filterCount.textContent =
        'Showing ' +
        visibleCount +
        ' of ' +
        totalProjects +
        ' project' +
        (totalProjects === 1 ? '' : 's');
    }

    if (emptyState) {
      emptyState.hidden = visibleCount > 0;
    }
  }

  if (filterButtons.length && workGrid) {
    filterButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        applyFilter(button.dataset.filter || 'all');
      });
    });

    const resetButton = document.querySelector('[data-filter-reset]');
    if (resetButton) {
      resetButton.addEventListener('click', function () {
        applyFilter('all');
        const allButton = document.querySelector('.filter[data-filter="all"]');
        if (allButton) allButton.focus();
      });
    }

    applyFilter('all');
  }

  /* ------------------------------------------------------------------ *
   * Contact form — posts to Web3Forms (no backend required)
   * ------------------------------------------------------------------ */
  const contactForm = document.getElementById('contact-form');
  const formSuccess = document.getElementById('form-success');
  const successName = document.getElementById('success-name');
  const sendAnother = document.getElementById('send-another');
  const contactSubmit = document.getElementById('contact-submit');
  const formStatus = document.getElementById('form-status');
  const STATUS_DEFAULT = 'Sends securely. No tracking, no newsletter.';
  const SUBMIT_LABEL = contactSubmit ? contactSubmit.innerHTML : '';

  function setStatus(message, isError) {
    if (!formStatus) return;
    formStatus.textContent = message;
    // Inline styles only for transient states; the base note styling stays intact.
    if (isError) {
      formStatus.style.color = '#b3261e';
      formStatus.style.fontWeight = '700';
      formStatus.style.textTransform = 'none';
      formStatus.style.letterSpacing = '0';
    } else {
      formStatus.style.color = '';
      formStatus.style.fontWeight = '';
      formStatus.style.textTransform = '';
      formStatus.style.letterSpacing = '';
    }
  }

  function setSending(isSending) {
    if (!contactSubmit) return;
    contactSubmit.disabled = isSending;
    contactSubmit.setAttribute('aria-busy', isSending ? 'true' : 'false');
    contactSubmit.innerHTML = isSending ? 'Sending&hellip;' : SUBMIT_LABEL;
  }

  function showFormSuccess(name) {
    if (!contactForm || !formSuccess) return;
    if (successName) {
      successName.textContent = name || 'friend';
    }
    contactForm.hidden = true;
    formSuccess.hidden = false;
    formSuccess.focus({ preventScroll: true });
    formSuccess.scrollIntoView({ behavior: prefersReducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
  }

  function resetFormSuccess() {
    if (!contactForm || !formSuccess) return;
    formSuccess.hidden = true;
    contactForm.hidden = false;
    contactForm.reset();
    const nameInput = document.getElementById('name');
    if (nameInput) nameInput.focus();
  }

  if (contactForm && formSuccess) {
    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();

      // Always give visible feedback, even when the browser blocks submission.
      if (!contactForm.checkValidity()) {
        const messageField = contactForm.querySelector('#message');
        if (messageField && messageField.validity && messageField.validity.tooShort) {
          setStatus('Your message needs at least 10 characters.', true);
        } else {
          setStatus('Please fill in the highlighted fields.', true);
        }
        contactForm.reportValidity();
        return;
      }

      const formData = new FormData(contactForm);
      const name = String(formData.get('name') || '').trim();

      setSending(true);
      setStatus('Sending\u2026', false);

      function finish() {
        setSending(false);
      }

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(formData))
      })
        .then(function (response) {
          // A non-JSON body (proxy error page, outage) must not throw silently.
          return response
            .json()
            .catch(function () {
              return {};
            })
            .then(function (data) {
              return { ok: response.ok, status: response.status, data: data || {} };
            });
        })
        .then(function (result) {
          finish();

          if (result.ok && result.data.success) {
            showFormSuccess(name.split(/\s+/)[0]);
            return;
          }

          let message = result.data.message;
          if (!message) {
            message =
              'Could not send (error ' +
              result.status +
              '). Please try again in a moment.';
          }
          setStatus(message, true);
        })
        .catch(function (error) {
          finish();
          setStatus(
            'Network error \u2014 could not reach the form service. Check your connection and try again.',
            true
          );
          if (window.console && window.console.error) {
            window.console.error('Contact form submission failed:', error);
          }
        });
    });

    if (sendAnother) {
      sendAnother.addEventListener('click', resetFormSuccess);
    }
  }

  /* ------------------------------------------------------------------ *
   * Toast
   * ------------------------------------------------------------------ */
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  const toastClose = document.querySelector('.toast-close');
  let toastTimer = null;

  function hideToast() {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.hidden = true;
  }

  function showToast(message) {
    if (!toast || !toastMessage) return;
    window.clearTimeout(toastTimer);
    toastMessage.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(hideToast, 7000);
  }

  document.querySelectorAll('[data-book-call]').forEach(function (button) {
    button.addEventListener('click', function () {
      showToast(
        'Demo only — the booking calendar isn’t connected yet. Use the contact form to start a conversation.'
      );
    });
  });

  if (toastClose) {
    toastClose.addEventListener('click', hideToast);
  }

  if (toast) {
    toast.addEventListener('mouseenter', function () {
      window.clearTimeout(toastTimer);
    });
    toast.addEventListener('focusin', function () {
      window.clearTimeout(toastTimer);
    });
  }

  /* ------------------------------------------------------------------ *
   * Active section in the sticky navigation
   * ------------------------------------------------------------------ */
  const sectionIds = ['work', 'about', 'experience', 'contact'];
  const navLinks = Array.from(document.querySelectorAll('.desk-nav a[href^="#"]'));

  if ('IntersectionObserver' in window && navLinks.length) {
    const sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinks.forEach(function (link) {
            if (link.getAttribute('href') === '#' + id) {
              link.setAttribute('aria-current', 'location');
            } else {
              link.removeAttribute('aria-current');
            }
          });
        });
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0 }
    );

    sectionIds.forEach(function (id) {
      const section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });
  }

  /* ------------------------------------------------------------------ *
   * Footer year
   * ------------------------------------------------------------------ */
  const yearNode = document.getElementById('year');
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }
})();
