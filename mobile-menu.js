// Mobile menu toggle

document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (!menuToggle || !mobileMenu) return;

  function closeMobileMenu() {
    mobileMenu.classList.add('hidden');
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  function focusHashTarget(hash) {
    const target = hash ? document.querySelector(hash) : null;
    if (target) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    } else {
      menuToggle.focus();
    }
  }

  menuToggle.addEventListener('click', function(event) {
    event.stopPropagation(); // Prevent click from bubbling to document
    mobileMenu.classList.toggle('hidden');
    const isExpanded = !mobileMenu.classList.contains('hidden');
    menuToggle.setAttribute('aria-expanded', isExpanded.toString());
  });

  // Auto-close mobile menu on link click
  const mobileMenuLinks = mobileMenu.querySelectorAll('a');
  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Only handle anchor links (not external)
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        closeMobileMenu();
        setTimeout(() => {
          window.location.hash = href;
          focusHashTarget(href);
        }, 150); // Adjust delay as needed for your animation
      } else {
        // For external links, just close the menu
        closeMobileMenu();
      }
    });
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', function(event) {
    // If menu is open and click is outside both menu and toggle button
    if (!mobileMenu.classList.contains('hidden') &&
        !mobileMenu.contains(event.target) &&
        !menuToggle.contains(event.target)) {
      closeMobileMenu();
    }
  });

  // Close mobile menu on Escape and return focus to the toggle button
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
      closeMobileMenu();
      menuToggle.focus();
    }
  });
});

// Homepage carousels and embeds
(function () {
  var carouselLiveRegion = document.createElement('div');
  carouselLiveRegion.setAttribute('aria-live', 'polite');
  carouselLiveRegion.setAttribute('aria-atomic', 'true');
  carouselLiveRegion.className = 'sr-only';
  document.body.appendChild(carouselLiveRegion);

  function announceSlide(message) {
    carouselLiveRegion.textContent = message;
  }

  function markCloneInert(clone) {
    clone.setAttribute('aria-hidden', 'true');
    clone.setAttribute('inert', '');
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(function (el) { el.removeAttribute('id'); });
  }

  function initYouTubeCarousel() {
    let currentIndex = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let isTouchingVideo = false;
    let cardWidth = 0;
    let resizeTimer;
    let isLooping = false;

    const track = document.getElementById('yt-track');
    const dotsEl = document.getElementById('yt-dots');
    const ytSection = document.getElementById('yt-section');
    const prevButton = document.getElementById('yt-prev');
    const nextButton = document.getElementById('yt-next');
    const cards = Array.prototype.slice.call(document.querySelectorAll('.yt-card'));

    if (!track || !dotsEl || !ytSection || !prevButton || !nextButton || !cards.length) return;

    function visibleCount() {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 768) return 2;
      return 1;
    }

    function totalSlides() {
      return Math.max(1, cards.length - visibleCount() + 1);
    }

    function setCardWidths() {
      cardWidth = track.parentElement.offsetWidth / visibleCount();
      track.querySelectorAll('.yt-card').forEach(function (card) { card.style.width = cardWidth + 'px'; });
    }

    function prepareLoopClones() {
      track.querySelectorAll('[data-carousel-clone]').forEach(function (clone) { clone.remove(); });
      const firstClone = cards[0].cloneNode(true);
      const lastClone = cards[cards.length - 1].cloneNode(true);
      firstClone.setAttribute('data-carousel-clone', 'true');
      lastClone.setAttribute('data-carousel-clone', 'true');
      markCloneInert(firstClone);
      markCloneInert(lastClone);
      track.appendChild(firstClone);
      track.insertBefore(lastClone, track.firstChild);
    }

    function buildDots() {
      dotsEl.innerHTML = '';
      const n = totalSlides();
      for (let i = 0; i < n; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === currentIndex ? ' is-active' : '');
        dot.setAttribute('aria-label', 'Go to video ' + (i + 1));
        if (i === currentIndex) dot.setAttribute('aria-current', 'true');
        dot.addEventListener('click', function () { goTo(i); });
        dotsEl.appendChild(dot);
      }
    }

    function updateDots() {
      dotsEl.querySelectorAll('button').forEach(function (dot, i) {
        dot.className = 'carousel-dot' + (i === currentIndex ? ' is-active' : '');
        if (i === currentIndex) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });
    }

    function pauseAllVideos() {
      document.querySelectorAll('.yt-card iframe').forEach(function (iframe) {
        try {
          iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', 'https://www.youtube.com');
        } catch (e) {}
      });
    }

    function updateSlideVisibility() {
      var vc = visibleCount();
      cards.forEach(function (card, i) {
        if (i >= currentIndex && i < currentIndex + vc) {
          card.removeAttribute('aria-hidden');
          card.removeAttribute('inert');
        } else {
          card.setAttribute('aria-hidden', 'true');
          card.setAttribute('inert', '');
        }
      });
    }

    function buildIframe(videoId) {
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&playsinline=1&rel=0&enablejsapi=1';
      iframe.className = 'w-full h-full';
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('title', 'YouTube video player');
      return iframe;
    }

    function goTo(index) {
      const n = totalSlides();
      if (isLooping) return;
      pauseAllVideos();
      if (index >= n) {
        isLooping = true;
        currentIndex = 0;
        track.style.transition = 'transform 300ms ease-in-out';
        track.style.transform = 'translateX(-' + ((n + 1) * cardWidth) + 'px)';
      } else if (index < 0) {
        isLooping = true;
        currentIndex = n - 1;
        track.style.transition = 'transform 300ms ease-in-out';
        track.style.transform = 'translateX(0px)';
      } else {
        currentIndex = index;
        track.style.transition = 'transform 300ms ease-in-out';
        track.style.transform = 'translateX(-' + ((currentIndex + 1) * cardWidth) + 'px)';
      }
      updateDots();
      updateSlideVisibility();
      announceSlide('Video ' + (currentIndex + 1) + ' of ' + n);
    }

    track.addEventListener('transitionend', function (event) {
      if (event.target !== track) return;
      if (!isLooping) return;
      track.style.transition = 'none';
      track.style.transform = 'translateX(-' + ((currentIndex + 1) * cardWidth) + 'px)';
      track.offsetHeight;
      track.style.transition = 'transform 300ms ease-in-out';
      isLooping = false;
    });

    function init() {
      track.style.display = 'flex';
      track.style.gap = '0';
      document.querySelectorAll('.yt-js-only').forEach(function (el) { el.style.display = 'flex'; });
      ytSection.setAttribute('role', 'region');
      ytSection.setAttribute('aria-roledescription', 'carousel');
      ytSection.setAttribute('aria-label', 'YouTube videos');

      prepareLoopClones();
      setCardWidths();
      currentIndex = 0;
      isLooping = false;
      buildDots();
      track.style.transition = 'none';
      track.style.transform = 'translateX(-' + cardWidth + 'px)';
      track.offsetHeight;
      track.style.transition = 'transform 300ms ease-in-out';
      updateDots();
      updateSlideVisibility();
    }

    prevButton.addEventListener('click', function () { goTo(currentIndex - 1); });
    nextButton.addEventListener('click', function () { goTo(currentIndex + 1); });

    track.addEventListener('click', function (e) {
      const trigger = e.target.closest('.yt-player-trigger');
      if (!trigger) return;

      e.preventDefault();
      const videoContainer = trigger.closest('.yt-player-host');
      if (!videoContainer) return;

      pauseAllVideos();
      videoContainer.innerHTML = '';
      videoContainer.appendChild(buildIframe(trigger.dataset.videoId));
    });

    ytSection.addEventListener('touchstart', function (e) {
      isTouchingVideo = !!e.target.closest('iframe');
      if (isTouchingVideo) return;
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    ytSection.addEventListener('touchend', function (e) {
      if (isTouchingVideo) {
        isTouchingVideo = false;
        return;
      }
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;

      const deltaX = touchStartX - touchEndX;
      const deltaY = touchStartY - touchEndY;

      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
        goTo(touchStartX > touchEndX ? currentIndex + 1 : currentIndex - 1);
      }
    }, { passive: true });

    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(init, 150);
    });

    window.addEventListener('load', init);
    init();
  }

  function initTweetsCarousel() {
    let twIndex = 0;
    let twTouchStartX = 0;
    let twTouchStartY = 0;
    let twCardWidth = 0;
    let twResizeTimer;
    let twIsLooping = false;

    const twTrack = document.getElementById('tw-track');
    const twDotsEl = document.getElementById('tw-dots');
    const twPrev = document.getElementById('tw-prev');
    const twNext = document.getElementById('tw-next');
    const twCarousel = document.getElementById('tw-carousel');
    const twCards = Array.prototype.slice.call(document.querySelectorAll('.tw-card'));

    if (!twTrack || !twDotsEl || !twPrev || !twNext || !twCarousel || !twCards.length) return;

    function twVisibleCount() {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 768) return 2;
      return 1;
    }

    function twTotalSlides() {
      return Math.max(1, twCards.length - twVisibleCount() + 1);
    }

    function twSetCardWidths() {
      twCardWidth = twTrack.parentElement.offsetWidth / twVisibleCount();
      twTrack.querySelectorAll('.tw-card').forEach(function (card) { card.style.width = twCardWidth + 'px'; });
    }

    function twPrepareLoopClones() {
      twTrack.querySelectorAll('[data-carousel-clone]').forEach(function (clone) { clone.remove(); });
      var firstClone = twCards[0].cloneNode(true);
      var lastClone = twCards[twCards.length - 1].cloneNode(true);
      firstClone.setAttribute('data-carousel-clone', 'true');
      lastClone.setAttribute('data-carousel-clone', 'true');
      markCloneInert(firstClone);
      markCloneInert(lastClone);
      twTrack.appendChild(firstClone);
      twTrack.insertBefore(lastClone, twTrack.firstChild);
    }

    function twBuildDots() {
      twDotsEl.innerHTML = '';
      var n = twTotalSlides();
      for (var i = 0; i < n; i++) {
        var dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === twIndex ? ' is-active' : '');
        dot.setAttribute('aria-label', 'Go to tweet ' + (i + 1));
        if (i === twIndex) dot.setAttribute('aria-current', 'true');
        dot.addEventListener('click', (function (idx) { return function () { twGoTo(idx); }; })(i));
        twDotsEl.appendChild(dot);
      }
    }

    function twUpdateDots() {
      twDotsEl.querySelectorAll('button').forEach(function (dot, i) {
        dot.className = 'carousel-dot' + (i === twIndex ? ' is-active' : '');
        if (i === twIndex) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });
    }

    function twUpdateSlideVisibility() {
      var vc = twVisibleCount();
      twCards.forEach(function (card, i) {
        if (i >= twIndex && i < twIndex + vc) {
          card.removeAttribute('aria-hidden');
          card.removeAttribute('inert');
        } else {
          card.setAttribute('aria-hidden', 'true');
          card.setAttribute('inert', '');
        }
      });
    }

    function twGoTo(index) {
      var n = twTotalSlides();
      if (twIsLooping) return;
      if (index >= n) {
        twIsLooping = true;
        twIndex = 0;
        twTrack.style.transition = 'transform 300ms ease-in-out';
        twTrack.style.transform = 'translateX(-' + ((n + 1) * twCardWidth) + 'px)';
      } else if (index < 0) {
        twIsLooping = true;
        twIndex = n - 1;
        twTrack.style.transition = 'transform 300ms ease-in-out';
        twTrack.style.transform = 'translateX(0px)';
      } else {
        twIndex = index;
        twTrack.style.transition = 'transform 300ms ease-in-out';
        twTrack.style.transform = 'translateX(-' + ((twIndex + 1) * twCardWidth) + 'px)';
      }
      twUpdateDots();
      twUpdateSlideVisibility();
      announceSlide('Tweet ' + (twIndex + 1) + ' of ' + n);
    }

    twTrack.addEventListener('transitionend', function (event) {
      if (event.target !== twTrack) return;
      if (!twIsLooping) return;
      twTrack.style.transition = 'none';
      twTrack.style.transform = 'translateX(-' + ((twIndex + 1) * twCardWidth) + 'px)';
      twTrack.offsetHeight;
      twTrack.style.transition = 'transform 300ms ease-in-out';
      twIsLooping = false;
    });

    function twInit() {
      twTrack.style.display = 'flex';
      twTrack.style.gap = '0';
      twTrack.style.transition = 'transform 300ms ease-in-out';
      document.querySelectorAll('.tw-js-only').forEach(function (el) { el.style.display = 'flex'; });
      twCarousel.setAttribute('role', 'region');
      twCarousel.setAttribute('aria-roledescription', 'carousel');
      twCarousel.setAttribute('aria-label', 'Tweets');
      twPrepareLoopClones();
      twSetCardWidths();
      twIndex = 0;
      twIsLooping = false;
      twBuildDots();
      twTrack.style.transition = 'none';
      twTrack.style.transform = 'translateX(-' + twCardWidth + 'px)';
      twTrack.offsetHeight;
      twTrack.style.transition = 'transform 300ms ease-in-out';
      twUpdateDots();
      twUpdateSlideVisibility();
    }

    twPrev.addEventListener('click', function () { twGoTo(twIndex - 1); });
    twNext.addEventListener('click', function () { twGoTo(twIndex + 1); });

    twCarousel.addEventListener('touchstart', function (e) {
      twTouchStartX = e.changedTouches[0].screenX;
      twTouchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    twCarousel.addEventListener('touchend', function (e) {
      var dx = twTouchStartX - e.changedTouches[0].screenX;
      var dy = twTouchStartY - e.changedTouches[0].screenY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        twGoTo(dx > 0 ? twIndex + 1 : twIndex - 1);
      }
    }, { passive: true });

    window.addEventListener('resize', function () {
      clearTimeout(twResizeTimer);
      twResizeTimer = setTimeout(twInit, 150);
    });

    window.addEventListener('load', twInit);
    twInit();
  }

  function initSmallcaseCarousel() {
    var scIndex = 0;
    var scTouchStartX = 0;
    var scTouchStartY = 0;
    var scCardWidth = 0;
    var scResizeTimer;
    var scIsLooping = false;

    var scTrack = document.getElementById('sc-track');
    var scDotsEl = document.getElementById('sc-dots');
    var scPrev = document.getElementById('sc-prev');
    var scNext = document.getElementById('sc-next');
    var scCarousel = document.getElementById('sc-carousel');
    var scCards = Array.prototype.slice.call(document.querySelectorAll('.sc-card'));
    var scTitle = document.getElementById('smallcase-plan-title');
    var scCopy = document.getElementById('smallcase-plan-copy');
    var scSubscribeLink = document.getElementById('smallcase-subscribe-link');

    if (!scTrack || !scDotsEl || !scPrev || !scNext || !scCarousel || !scTitle || !scCopy || !scSubscribeLink || !scCards.length) return;

    function scTotalSlides() {
      return Math.max(1, scCards.length);
    }

    function scSetCardWidths() {
      scCardWidth = scTrack.parentElement.offsetWidth;
      scTrack.querySelectorAll('.sc-card').forEach(function (card) { card.style.width = scCardWidth + 'px'; });
    }

    function scPrepareLoopClones() {
      scTrack.querySelectorAll('[data-carousel-clone]').forEach(function (clone) { clone.remove(); });
      var firstClone = scCards[0].cloneNode(true);
      var lastClone = scCards[scCards.length - 1].cloneNode(true);
      firstClone.setAttribute('data-carousel-clone', 'true');
      lastClone.setAttribute('data-carousel-clone', 'true');
      markCloneInert(firstClone);
      markCloneInert(lastClone);
      scTrack.appendChild(firstClone);
      scTrack.insertBefore(lastClone, scTrack.firstChild);
    }

    function scBuildDots() {
      scDotsEl.innerHTML = '';
      for (var i = 0; i < scTotalSlides(); i++) {
        var dot = document.createElement('button');
        dot.className = 'carousel-dot carousel-dot-light' + (i === scIndex ? ' is-active' : '');
        dot.setAttribute('aria-label', 'Go to plan ' + (i + 1));
        if (i === scIndex) dot.setAttribute('aria-current', 'true');
        dot.addEventListener('click', (function (idx) { return function () { scGoTo(idx); }; })(i));
        scDotsEl.appendChild(dot);
      }
    }

    function scUpdateDots() {
      scDotsEl.querySelectorAll('button').forEach(function (dot, i) {
        dot.className = 'carousel-dot carousel-dot-light' + (i === scIndex ? ' is-active' : '');
        if (i === scIndex) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });
    }

    function scUpdateContent() {
      var activeCard = scCards[scIndex];
      scTitle.textContent = activeCard.dataset.title;
      scCopy.textContent = activeCard.dataset.copy;
      scSubscribeLink.href = activeCard.dataset.href;
    }

    function scUpdateSlideVisibility() {
      scCards.forEach(function (card, i) {
        if (i === scIndex) {
          card.removeAttribute('aria-hidden');
          card.removeAttribute('inert');
        } else {
          card.setAttribute('aria-hidden', 'true');
          card.setAttribute('inert', '');
        }
      });
    }

    function scGoTo(index) {
      var n = scTotalSlides();
      if (scIsLooping) return;
      if (index >= n) {
        scIsLooping = true;
        scIndex = 0;
        scTrack.style.transition = 'transform 300ms ease-in-out';
        scTrack.style.transform = 'translateX(-' + ((n + 1) * scCardWidth) + 'px)';
      } else if (index < 0) {
        scIsLooping = true;
        scIndex = n - 1;
        scTrack.style.transition = 'transform 300ms ease-in-out';
        scTrack.style.transform = 'translateX(0px)';
      } else {
        scIndex = index;
        scTrack.style.transition = 'transform 300ms ease-in-out';
        scTrack.style.transform = 'translateX(-' + ((scIndex + 1) * scCardWidth) + 'px)';
      }
      scUpdateDots();
      scUpdateContent();
      scUpdateSlideVisibility();
      announceSlide('Plan ' + (scIndex + 1) + ' of ' + n + ': ' + scCards[scIndex].dataset.title);
    }

    scTrack.addEventListener('transitionend', function (event) {
      if (event.target !== scTrack) return;
      if (!scIsLooping) return;
      scTrack.style.transition = 'none';
      scTrack.style.transform = 'translateX(-' + ((scIndex + 1) * scCardWidth) + 'px)';
      scTrack.offsetHeight;
      scTrack.style.transition = 'transform 300ms ease-in-out';
      scIsLooping = false;
    });

    function scInit() {
      scTrack.style.display = 'flex';
      scTrack.style.gap = '0';
      scTrack.style.transition = 'transform 300ms ease-in-out';
      document.querySelectorAll('.sc-js-only').forEach(function (el) { el.style.display = 'flex'; });
      scCarousel.setAttribute('role', 'region');
      scCarousel.setAttribute('aria-roledescription', 'carousel');
      scCarousel.setAttribute('aria-label', 'Smallcase plans');
      scPrepareLoopClones();
      scSetCardWidths();
      scIndex = 0;
      scIsLooping = false;
      scBuildDots();
      scTrack.style.transition = 'none';
      scTrack.style.transform = 'translateX(-' + scCardWidth + 'px)';
      scTrack.offsetHeight;
      scTrack.style.transition = 'transform 300ms ease-in-out';
      scUpdateDots();
      scUpdateContent();
      scUpdateSlideVisibility();
    }

    scPrev.addEventListener('click', function () { scGoTo(scIndex - 1); });
    scNext.addEventListener('click', function () { scGoTo(scIndex + 1); });

    scCarousel.addEventListener('touchstart', function (e) {
      scTouchStartX = e.changedTouches[0].screenX;
      scTouchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    scCarousel.addEventListener('touchend', function (e) {
      var dx = scTouchStartX - e.changedTouches[0].screenX;
      var dy = scTouchStartY - e.changedTouches[0].screenY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        scGoTo(dx > 0 ? scIndex + 1 : scIndex - 1);
      }
    }, { passive: true });

    window.addEventListener('resize', function () {
      clearTimeout(scResizeTimer);
      scResizeTimer = setTimeout(scInit, 150);
    });

    window.addEventListener('load', scInit);
    scInit();
  }

  function onTweetsRendered() {
    document.querySelectorAll('.tw-skeleton').forEach(function (s) { s.remove(); });
    document.querySelectorAll('.tw-card blockquote').forEach(function (b) { b.style.display = ''; });
    equalizeTweetCards();
  }

  function equalizeTweetCards() {
    var cards = document.querySelectorAll('.tw-card > div');
    var maxH = 0;
    cards.forEach(function (card) {
      card.style.height = 'auto';
      if (card.offsetHeight > maxH) maxH = card.offsetHeight;
    });
    cards.forEach(function (card) { card.style.height = maxH + 'px'; });
  }

  function initTwitterWidgets() {
    if (!document.querySelector('.tw-card')) return;

    var twCheck = setInterval(function () {
      if (typeof twttr !== 'undefined' && twttr.events) {
        clearInterval(twCheck);
        twttr.events.bind('loaded', onTweetsRendered);
      }
    }, 200);

    setTimeout(onTweetsRendered, 6000);
    window.addEventListener('resize', function () {
      setTimeout(equalizeTweetCards, 300);
    });
  }

  function titleSmallcaseIframes() {
    function applyTitle(iframe) {
      if (iframe.title) return;
      var card = iframe.closest('.sc-card');
      var planName = card && card.dataset.title;
      iframe.title = planName ? 'Smallcase portfolio: ' + planName : 'Smallcase investment portfolio';
    }
    document.querySelectorAll('.smallcase-embed-frame iframe').forEach(applyTitle);
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.tagName === 'IFRAME' && node.closest('.smallcase-embed-frame')) applyTitle(node);
          if (node.querySelectorAll) node.querySelectorAll('.smallcase-embed-frame iframe').forEach(applyTitle);
        });
      });
    });
    document.querySelectorAll('.smallcase-embed-frame').forEach(function (container) {
      observer.observe(container, { childList: true, subtree: true });
    });
  }

  initYouTubeCarousel();
  initTweetsCarousel();
  initSmallcaseCarousel();
  initTwitterWidgets();
  titleSmallcaseIframes();
})();
