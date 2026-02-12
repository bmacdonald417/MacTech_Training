/**
 * Triptych Training Player
 * State machine: intro → left → center → right → recap
 * Syncs panel focus with narration_timeline.json; supports autoplay and manual step.
 */

(function () {
  'use strict';

  const FOCUS_STATES = ['intro', 'left', 'center', 'right', 'recap'];
  const DEFAULT_PANELS = {
    left:   { x: 0, y: 0, w: 1 / 3, h: 1 },
    center: { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
    right:  { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
  };

  let config = { global: { dimOpacity: 0.52, transitionMs: 450 }, slides: [] };
  let currentSlideIndex = 0;
  let currentFocusState = 'intro';
  let segmentStartTime = 0;
  let calibrationOffset = 0;
  let isPlaying = false;
  let playbackStartReal = 0;
  let playbackStartSlideTime = 0;
  let rafId = null;
  let slideAudio = null;

  const el = {
    stage: null,
    slideImage: null,
    dimLeft: null,
    dimCenter: null,
    dimRight: null,
    activeBorder: null,
    btnPrev: null,
    btnNext: null,
    btnPlayPause: null,
    progressBar: null,
    progressFill: null,
    labelSlide: null,
    labelFocus: null,
    labelTime: null,
    showTimingMarkers: null,
  };

  function getSlide() {
    return config.slides[currentSlideIndex] || null;
  }

  function getSegments() {
    const slide = getSlide();
    return slide && slide.segments ? slide.segments : null;
  }

  /** Current time within the slide (seconds). When narration audio is playing, use it for perfect sync. */
  function getCurrentTime() {
    var s = getSlide();
    if (isPlaying && slideAudio && s && s.audioUrl && !isNaN(slideAudio.currentTime)) {
      return slideAudio.currentTime;
    }
    if (isPlaying) {
      return playbackStartSlideTime + (performance.now() / 1000 - playbackStartReal) + calibrationOffset;
    }
    return segmentStartTime + calibrationOffset;
  }

  /** Format seconds as mm:ss.s */
  function formatTimecode(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m + ':' + s.toFixed(1).padStart(3, '0');
  }

  /** Resolve panel bounds (normalized 0–1). Default equal thirds. */
  function getPanelBounds(slide) {
    if (slide.panels && typeof slide.panels.left === 'object') {
      return {
        left:   slide.panels.left,
        center: slide.panels.center,
        right:  slide.panels.right,
      };
    }
    return DEFAULT_PANELS;
  }

  /** Which focus state we should be in at time t (seconds). */
  function stateAtTime(segments, t) {
    if (!segments) return 'intro';
    const { introStart, leftStart, centerStart, rightStart, recapStart } = segments;
    if (t < leftStart) return 'intro';
    if (t < centerStart) return 'left';
    if (t < rightStart) return 'center';
    if (t < recapStart) return 'right';
    return 'recap';
  }

  function setDimOpacity(dimEl, active) {
    if (!dimEl) return;
    dimEl.classList.toggle('active', !!active);
  }

  function applyPanelBoundsToOverlays(bounds) {
    if (!bounds) return;
    const set = function (el, b) {
      if (!el || !b) return;
      el.style.left = (b.x * 100) + '%';
      el.style.top = (b.y * 100) + '%';
      el.style.width = (b.w * 100) + '%';
      el.style.height = (b.h * 100) + '%';
    };
    set(el.dimLeft, bounds.left);
    set(el.dimCenter, bounds.center);
    set(el.dimRight, bounds.right);
  }

  function resetOverlayDefaults() {
    [el.dimLeft, el.dimCenter, el.dimRight].forEach(function (d) {
      if (!d) return;
      d.style.left = d.style.top = d.style.width = d.style.height = '';
    });
  }

  function positionBorder(panel, bounds) {
    const border = el.activeBorder;
    const stage = el.stage;
    if (!border || !stage || !bounds) return;
    const r = stage.getBoundingClientRect();
    border.style.left   = (bounds.x * 100) + '%';
    border.style.top    = (bounds.y * 100) + '%';
    border.style.width  = (bounds.w * 100) + '%';
    border.style.height = (bounds.h * 100) + '%';
  }

  function render() {
    const slide = getSlide();
    const segments = getSegments();
    const t = getCurrentTime();
    const focus = segments ? stateAtTime(segments, t) : 'intro';
    const bounds = slide ? getPanelBounds(slide) : null;

    document.documentElement.style.setProperty('--dim-opacity', String(config.global.dimOpacity || 0.52));
    document.documentElement.style.setProperty('--transition-ms', String(config.global.transitionMs || 520));
    document.documentElement.style.setProperty('--transition-delay-ms', String(config.global.transitionDelayMs != null ? config.global.transitionDelayMs : 80));

    setDimOpacity(el.dimLeft,   focus === 'center' || focus === 'right');
    setDimOpacity(el.dimCenter, focus === 'left' || focus === 'right');
    setDimOpacity(el.dimRight,  focus === 'left' || focus === 'center');

    const showBorder = focus === 'left' || focus === 'center' || focus === 'right';
    el.activeBorder.classList.toggle('visible', showBorder);
    el.activeBorder.setAttribute('aria-hidden', showBorder ? 'false' : 'true');
    if (showBorder && bounds) {
      const panelName = focus === 'left' ? 'left' : focus === 'center' ? 'center' : 'right';
      positionBorder(panelName, bounds[panelName]);
    }

    const duration = segments ? (segments.end - segments.introStart) : 0;
    const progress = duration > 0 ? Math.min(100, Math.max(0, ((t - segments.introStart) / duration) * 100)) : 0;
    if (el.progressFill) el.progressFill.style.width = progress + '%';
    if (el.progressBar) el.progressBar.setAttribute('aria-valuenow', Math.round(progress));

    el.labelSlide.textContent = 'Slide ' + (currentSlideIndex + 1) + ' / ' + config.slides.length;
    el.labelFocus.textContent = focus.charAt(0).toUpperCase() + focus.slice(1);
    el.labelTime.textContent = formatTimecode(t);

    currentFocusState = focus;
  }

  function goToSlide(index) {
    if (index < 0 || index >= config.slides.length) return;
    if (slideAudio) slideAudio.pause();
    currentSlideIndex = index;
    const slide = getSlide();
    segmentStartTime = slide && slide.segments ? slide.segments.introStart : 0;
    calibrationOffset = 0;
    if (slide && slide.image) {
      el.slideImage.src = slide.image;
      el.slideImage.alt = slide.title || ('Slide ' + (index + 1));
    }
    const bounds = slide ? getPanelBounds(slide) : null;
    if (slide && slide.panels && bounds) applyPanelBoundsToOverlays(bounds);
    else resetOverlayDefaults();
    render();
  }

  function setFocusState(state) {
    const segments = getSegments();
    if (!segments) return;
    stopPlayback();
    const map = {
      intro:  segments.introStart,
      left:   segments.leftStart,
      center: segments.centerStart,
      right:  segments.rightStart,
      recap:  segments.recapStart,
    };
    const t = map[state];
    if (t != null) {
      segmentStartTime = t;
      calibrationOffset = 0;
      render();
    }
  }

  function tick() {
    const segments = getSegments();
    if (!isPlaying || !segments) {
      render();
      return;
    }
    const t = getCurrentTime();
    if (t >= segments.end) {
      isPlaying = false;
      segmentStartTime = segments.recapStart;
      if (el.btnPlayPause) el.btnPlayPause.textContent = 'Play';
      render();
      return;
    }
    render();
    rafId = requestAnimationFrame(tick);
  }

  function startPlayback() {
    const segments = getSegments();
    const slide = getSlide();
    if (!segments) return;
    isPlaying = true;
    playbackStartReal = performance.now() / 1000;
    playbackStartSlideTime = segmentStartTime + calibrationOffset;
    if (el.btnPlayPause) el.btnPlayPause.textContent = 'Pause';
    if (rafId) cancelAnimationFrame(rafId);
    if (slide && slide.audioUrl) {
      if (!slideAudio) slideAudio = new Audio();
      var base = (window.location.pathname.replace(/[^/]*$/, '') || '/');
      var audioSrc = base + slide.audioUrl.replace(/^\//, '');
      slideAudio.src = audioSrc;
      slideAudio.onended = function () {
        isPlaying = false;
        if (segments) segmentStartTime = segments.recapStart;
        if (el.btnPlayPause) el.btnPlayPause.textContent = 'Play';
        render();
      };
      slideAudio.currentTime = Math.max(0, playbackStartSlideTime);
      slideAudio.play().catch(function () {});
    }
    rafId = requestAnimationFrame(tick);
  }

  function stopPlayback() {
    isPlaying = false;
    if (slideAudio) {
      slideAudio.pause();
    }
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (el.btnPlayPause) el.btnPlayPause.textContent = 'Play';
    render();
  }

  function prevSlide() {
    stopPlayback();
    goToSlide(currentSlideIndex - 1);
  }

  function nextSlide() {
    stopPlayback();
    goToSlide(currentSlideIndex + 1);
  }

  function playPause() {
    if (isPlaying) stopPlayback();
    else startPlayback();
  }

  function nudgeSegment(delta) {
    calibrationOffset += delta;
    render();
  }

  function saveCalibratedTiming() {
    const slide = getSlide();
    const segments = getSegments();
    if (!slide || !segments) return;
    const t = getCurrentTime();
    const out = {
      global: config.global,
      slides: config.slides.map((s, i) => {
        if (i !== currentSlideIndex) return s;
        const seg = { ...s.segments };
        if (currentFocusState === 'intro') seg.introStart = t;
        else if (currentFocusState === 'left') seg.leftStart = t;
        else if (currentFocusState === 'center') seg.centerStart = t;
        else if (currentFocusState === 'right') seg.rightStart = t;
        else if (currentFocusState === 'recap') seg.recapStart = t;
        return { ...s, segments: seg };
      }),
    };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'narration_timeline_calibrated.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function onKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    switch (e.key) {
      case '1': setFocusState('left'); e.preventDefault(); break;
      case '2': setFocusState('center'); e.preventDefault(); break;
      case '3': setFocusState('right'); e.preventDefault(); break;
      case '0': setFocusState('recap'); e.preventDefault(); break;
      case 'n':
      case 'N':
      case 'ArrowRight': nextSlide(); e.preventDefault(); break;
      case 'p':
      case 'P':
      case 'ArrowLeft': prevSlide(); e.preventDefault(); break;
      case ' ': playPause(); e.preventDefault(); break;
      case '[': nudgeSegment(-0.25); e.preventDefault(); break;
      case ']': nudgeSegment(0.25); e.preventDefault(); break;
      case 's':
      case 'S': saveCalibratedTiming(); e.preventDefault(); break;
      default: break;
    }
  }

  function bindElements() {
    el.stage = document.getElementById('stage');
    el.slideImage = document.getElementById('slideImage');
    el.dimLeft = document.getElementById('dimLeft');
    el.dimCenter = document.getElementById('dimCenter');
    el.dimRight = document.getElementById('dimRight');
    el.activeBorder = document.getElementById('activeBorder');
    el.btnPrev = document.getElementById('btnPrev');
    el.btnNext = document.getElementById('btnNext');
    el.btnPlayPause = document.getElementById('btnPlayPause');
    el.progressBar = document.getElementById('progressBar');
    el.progressFill = document.getElementById('progressFill');
    el.labelSlide = document.getElementById('labelSlide');
    el.labelFocus = document.getElementById('labelFocus');
    el.labelTime = document.getElementById('labelTime');
    el.showTimingMarkers = document.getElementById('showTimingMarkers');
  }

  function bindEvents() {
    if (el.btnPrev) el.btnPrev.addEventListener('click', prevSlide);
    if (el.btnNext) el.btnNext.addEventListener('click', nextSlide);
    if (el.btnPlayPause) el.btnPlayPause.addEventListener('click', playPause);
    document.addEventListener('keydown', onKeyDown);

    if (el.showTimingMarkers) {
      el.showTimingMarkers.addEventListener('change', function () {
        const show = el.showTimingMarkers.checked;
        el.stage.classList.toggle('show-markers', show);
        if (show) renderTimingMarkers();
        else clearTimingMarkers();
      });
    }
  }

  let markerContainer = null;
  function renderTimingMarkers() {
    const segments = getSegments();
    if (!segments || !el.stage) return;
    if (!markerContainer) {
      markerContainer = document.createElement('div');
      markerContainer.className = 'timing-markers';
      markerContainer.setAttribute('aria-hidden', 'true');
      el.stage.appendChild(markerContainer);
    }
    markerContainer.innerHTML = '';
    const labels = [
      { t: segments.introStart, label: 'Intro' },
      { t: segments.leftStart, label: 'L' },
      { t: segments.centerStart, label: 'C' },
      { t: segments.rightStart, label: 'R' },
      { t: segments.recapStart, label: 'Recap' },
      { t: segments.end, label: 'End' },
    ];
    labels.forEach(function (item) {
      const span = document.createElement('span');
      span.className = 'timing-marker';
      span.textContent = item.label + ' ' + formatTimecode(item.t);
      span.style.left = '4px';
      span.style.top = (labels.indexOf(item) * 14 + 4) + 'px';
      markerContainer.appendChild(span);
    });
  }

  function clearTimingMarkers() {
    if (markerContainer && markerContainer.parentNode) markerContainer.remove();
    markerContainer = null;
  }

  function loadConfig(cb) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'narration_timeline.json');
    xhr.onload = function () {
      if (xhr.status !== 200) {
        console.error('Failed to load narration_timeline.json:', xhr.status);
        if (cb) cb(new Error('Failed to load timeline'));
        return;
      }
      try {
        config = JSON.parse(xhr.responseText);
        if (!config.slides || !Array.isArray(config.slides)) config.slides = [];
        if (cb) cb(null);
      } catch (err) {
        console.error('Invalid narration_timeline.json:', err);
        if (cb) cb(err);
      }
    };
    xhr.onerror = function () {
      if (cb) cb(new Error('Network error loading timeline'));
    };
    xhr.send();
  }

  function init() {
    bindElements();
    if (el.slideImage) {
      el.slideImage.onerror = function () {
        this.classList.add('load-error');
        if (el.labelFocus) el.labelFocus.textContent = 'Image failed to load';
      };
    }
    loadConfig(function (err) {
      if (err) {
        if (el.labelSlide) el.labelSlide.textContent = 'Load error: ' + (err.message || 'unknown');
        return;
      }
      bindEvents();
      goToSlide(0);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
