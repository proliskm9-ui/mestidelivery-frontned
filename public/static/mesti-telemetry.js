(function () {
  'use strict';

  // Do not run in non-browser environments
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

  var STORAGE_KEY_VID = '_mesti_vid';
  var STORAGE_KEY_SID = '_mesti_sid';
  var STORAGE_KEY_LAST_ACTIVE = '_mesti_last_active';
  var SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  var HEARTBEAT_INTERVAL_MS = 25 * 1000; // 25 seconds
  var API_ENDPOINT = '/api/bot/v1/analytics/collect';

  // Unique ID generator
  function uid(prefix) {
    return (prefix || '') + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
  }

  // Persistent Visitor ID
  var visitorId = '';
  try {
    visitorId = localStorage.getItem(STORAGE_KEY_VID);
    if (!visitorId) {
      visitorId = uid('v_');
      localStorage.setItem(STORAGE_KEY_VID, visitorId);
    }
  } catch (e) {
    visitorId = uid('v_tmp_');
  }

  // Session ID & Active Time
  var sessionId = '';
  var sessionStart = Date.now();
  try {
    var lastActive = parseInt(localStorage.getItem(STORAGE_KEY_LAST_ACTIVE) || '0', 10);
    sessionId = sessionStorage.getItem(STORAGE_KEY_SID);
    if (!sessionId || Date.now() - lastActive > SESSION_TIMEOUT_MS) {
      sessionId = uid('s_');
      sessionStorage.setItem(STORAGE_KEY_SID, sessionId);
      sessionStart = Date.now();
    }
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, Date.now().toString());
  } catch (e) {
    sessionId = uid('s_tmp_');
  }

  // Device & Environment Info
  var ua = navigator.userAgent || '';
  var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || (window.innerWidth <= 768);
  var isTablet = /(iPad|Tablet|(Android(?!.*Mobile)))/i.test(ua);
  var deviceType = isTablet ? 'tablet' : (isMobile ? 'mobile' : 'desktop');

  var os = 'Unknown';
  if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  var isTg = false;
  try {
    if ((window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) || /Telegram/i.test(ua)) {
      isTg = true;
    }
  } catch (e) {}

  var browser = 'Unknown';
  if (isTg) browser = 'Telegram WebApp';
  else if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua)) browser = 'Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';

  var screenRes = window.screen ? (window.screen.width + 'x' + window.screen.height) : '';
  var initialReferrer = document.referrer || '';

  // Event Queue
  var eventQueue = [];
  var lastSentDuration = 0;

  function getDurationSec() {
    return Math.max(1, Math.floor((Date.now() - sessionStart) / 1000));
  }

  function flushEvents() {
    var dur = getDurationSec();
    if (eventQueue.length === 0 && dur === lastSentDuration) return;

    var eventsToSend = eventQueue.slice();
    eventQueue = [];
    lastSentDuration = dur;

    try {
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, Date.now().toString());
    } catch (e) {}

    var payload = {
      session_id: sessionId,
      visitor_id: visitorId,
      device_type: deviceType,
      os: os,
      browser: browser,
      screen_res: screenRes,
      referrer: initialReferrer,
      is_telegram: isTg,
      duration_sec: dur,
      events: eventsToSend
    };

    var jsonStr = JSON.stringify(payload);

    // Prefer navigator.sendBeacon for non-blocking standard delivery
    if (navigator.sendBeacon) {
      try {
        var blob = new Blob([jsonStr], { type: 'application/json' });
        var sent = navigator.sendBeacon(API_ENDPOINT, blob);
        if (sent) return;
      } catch (err) {}
    }

    // Fallback to fetch with keepalive
    try {
      fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr,
        keepalive: true
      }).catch(function () {});
    } catch (err) {}
  }

  // Public track API
  window.mestiTrack = function (eventType, entityName, entityId, extra) {
    var ev = {
      event_type: eventType,
      page_url: window.location.pathname + window.location.search,
      entity_id: entityId ? String(entityId) : '',
      entity_name: entityName ? String(entityName) : '',
      extra_data: extra || {},
      created_at: new Date().toISOString()
    };
    eventQueue.push(ev);
    // Flush immediately for key interaction events
    if (eventType === 'page_view' || eventType === 'add_to_cart' || eventType === 'checkout_start') {
      flushEvents();
    }
  };

  // Track initial page view
  window.mestiTrack('page_view', document.title || 'Page View');

  // SPA Navigation tracking
  var lastPath = window.location.pathname + window.location.search;
  function handleUrlChange() {
    var currentPath = window.location.pathname + window.location.search;
    if (currentPath !== lastPath) {
      lastPath = currentPath;
      window.mestiTrack('page_view', document.title || currentPath);
    }
  }

  // Monkey-patch history API
  var origPushState = history.pushState;
  if (origPushState) {
    history.pushState = function () {
      origPushState.apply(this, arguments);
      setTimeout(handleUrlChange, 50);
    };
  }

  var origReplaceState = history.replaceState;
  if (origReplaceState) {
    history.replaceState = function () {
      origReplaceState.apply(this, arguments);
      setTimeout(handleUrlChange, 50);
    };
  }

  window.addEventListener('popstate', handleUrlChange);

  // Periodic heartbeat
  setInterval(function () {
    if (!document.hidden) {
      flushEvents();
    }
  }, HEARTBEAT_INTERVAL_MS);

  // Exit / Background flushing
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      flushEvents();
    }
  });

  window.addEventListener('pagehide', flushEvents);
  window.addEventListener('beforeunload', flushEvents);

  // Click listener for smart UI event tracking
  document.addEventListener('click', function (e) {
    try {
      var target = e.target;
      if (!target) return;

      // Check for restaurant card click
      var restCard = target.closest('[data-restaurant-name], a[href*="/restaurant/"]');
      if (restCard) {
        var rName = restCard.getAttribute('data-restaurant-name') || restCard.innerText.split('\n')[0].trim();
        var rId = restCard.getAttribute('data-restaurant-id') || '';
        if (rName && rName.length < 50) {
          window.mestiTrack('view_restaurant', rName, rId);
          return;
        }
      }

      // Check for dish card click
      var dishCard = target.closest('[data-dish-name]');
      if (dishCard) {
        var dName = dishCard.getAttribute('data-dish-name');
        var dId = dishCard.getAttribute('data-dish-id') || '';
        if (dName) {
          window.mestiTrack('view_dish', dName, dId);
          return;
        }
      }

      // Check for Add to cart button
      var cartBtn = target.closest('button, [role="button"]');
      if (cartBtn) {
        var text = (cartBtn.innerText || cartBtn.textContent || '').trim().toLowerCase();
        if (text.includes('в корзину') || text.includes('add to cart') || text.includes('დამატება') || text === '+') {
          // Look for parent dish title
          var parentItem = cartBtn.closest('.dish-card, [data-dish-name], .menu-item');
          var itemName = parentItem ? (parentItem.getAttribute('data-dish-name') || parentItem.querySelector('h3, h4, .dish-title, .title')?.innerText || '') : '';
          window.mestiTrack('add_to_cart', itemName.trim() || 'Dish', '', { button_text: text });
          return;
        }
        if (text.includes('оформить') || text.includes('checkout') || text.includes('შეკვეთა')) {
          window.mestiTrack('checkout_start', 'Checkout Button Click');
          return;
        }
      }
    } catch (err) {}
  }, true);

})();
