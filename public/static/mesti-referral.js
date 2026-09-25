/**
 * MestiDelivery - Native Luxury Referral Experience
 * - Design language: Obsidian Dark, Glassmorphism, Emerald #21EA7C accent
 * - Zero AI Slop: Restrained typography, micro-surfaces, unified layout
 * - Native mobile Web Share API integration + clipboard fallback
 * - Full localization: RU, EN, KA
 */
(function () {
  'use strict';

  var I18N = {
    ru: {
      badge: 'Реферальная программа',
      title: 'Приглашай друзей',
      subtitle: 'Получай <span class="mesti-bonus-val">5 GEL бонусами</span> за первый выполненный заказ каждого друга от 50 GEL.',
      balanceLabel: 'Бонусный баланс',
      invitedLabel: 'Приглашено',
      ordersLabel: 'Заказов',
      copy: 'Скопировать',
      copied: 'Скопировано',
      sharePrimary: 'Поделиться ссылкой',
      shareTg: 'Telegram',
      shareWa: 'WhatsApp',
      rule1: '<b>Другу:</b> бесплатная доставка при заказе от 100 GEL',
      rule2: '<b>Вам:</b> 5 GEL бонусами за первый доставленный заказ друга от 50 GEL',
      rule3: '<b>Бонусы:</b> действуют 30 дней и списываются в корзине',
      guestSubtitle: 'Получай бонусы за каждый первый заказ друзей и оплачивай ими доставку любимой еды.',
      guestNotice: 'Войдите по номеру телефона, чтобы получить персональную ссылку и копить бонусы.',
      loginBtn: 'Войти по номеру телефона',
      shareText: 'Привет! 👋 В Местии открылась доставка еды — MestiDelivery, первая в Сванетии.\n\nСам заказываю и рекомендую: привозят быстро, а для новых клиентов есть акции.\n\n🎁 Зарегистрируйся по моей ссылке, собери корзину от 100 GEL — и доставка будет полностью бесплатной.\n\nЕда из ресторанов Местии прямо до двери, заказ в пару кликов:',
      shareLinkAbove: 'Заказывай по ссылке выше ☝️',
      toastCopied: 'Ссылка скопирована в буфер обмена'
    },
    en: {
      badge: 'Referral Program',
      title: 'Invite Friends',
      subtitle: 'Get <span class="mesti-bonus-val">5 GEL in bonus points</span> for every friend\'s first completed order over 50 GEL.',
      balanceLabel: 'Bonus Balance',
      invitedLabel: 'Invited',
      ordersLabel: 'Orders',
      copy: 'Copy',
      copied: 'Copied',
      sharePrimary: 'Share Invite Link',
      shareTg: 'Telegram',
      shareWa: 'WhatsApp',
      rule1: '<b>For your friend:</b> Free delivery on orders over 100 GEL',
      rule2: '<b>For you:</b> 5 GEL reward on friend\'s first completed order (50+ GEL)',
      rule3: '<b>Bonuses:</b> Valid for 30 days and redeemable at checkout',
      guestSubtitle: 'Earn bonus rewards when your friends order delicious food in Mestia.',
      guestNotice: 'Sign in with your phone number to get your unique invite link and start earning.',
      loginBtn: 'Sign in with phone',
      shareText: 'Hi! 👋 Food delivery has launched in Mestia — MestiDelivery, the first one in Svaneti.\n\nI use it myself and recommend it: fast delivery and deals for new customers.\n\n🎁 Sign up with my link, fill your cart to 100+ GEL — and delivery is completely free.\n\nFood from Mestia’s restaurants right to your door, ordered in a couple of taps:',
      shareLinkAbove: 'Order via the link above ☝️',
      toastCopied: 'Invite link copied to clipboard'
    },
    ka: {
      badge: 'რეფერალური პროგრამა',
      title: 'მოიწვიე მეგობრები',
      subtitle: 'მიიღე <span class="mesti-bonus-val">5 ლარი ბონუსად</span> მეგობრის პირველ შეკვეთაზე 50 ლარიდან.',
      balanceLabel: 'ბონუს ბალანსი',
      invitedLabel: 'მოწვეული',
      ordersLabel: 'შეკვეთები',
      copy: 'კოპირება',
      copied: 'დაკოპირდა',
      sharePrimary: 'ლინკის გაზიარება',
      shareTg: 'Telegram',
      shareWa: 'WhatsApp',
      rule1: '<b>მეგობარს:</b> უფასო მიტანა 100 ლარიდან შეკვეთისას',
      rule2: '<b>შენ:</b> 5 ლარი ბონუსად მეგობრის პირველ შესრულებულ შეკვეთაზე (50+ ლარი)',
      rule3: '<b>ბონუსები:</b> მოქმედებს 30 დღე და აკლდება კალათაში',
      guestSubtitle: 'მიიღე ბონუსები მეგობრების შეკვეთებზე და გამოიყენე გადახდისას.',
      guestNotice: 'გაიარე ავტორიზაცია ტელეფონით, რომ მიიღო პირადი ლინკი და დაიწყო დაგროვება.',
      loginBtn: 'შესვლა ტელეფონით',
      shareText: 'გამარჯობა! 👋 მესტიაში საკვების მიტანა გაიხსნა — MestiDelivery, პირველი სვანეთში.\n\nთავად ვუკვეთავ და გირჩევ: სწრაფად მოაქვთ, ახალი კლიენტებისთვის კი აქციებია.\n\n🎁 დარეგისტრირდი ჩემი ბმულით, შეაგროვე კალათა 100 ლარიდან — და მიტანა სრულიად უფასო იქნება.\n\nმესტიის რესტორნების კერძები პირდაპირ კარამდე, შეკვეთა ორიოდე შეხებით:',
      shareLinkAbove: 'შეუკვეთე ზემოთ მოცემული ბმულით ☝️',
      toastCopied: 'ლინკი დაკოპირდა'
    }
  };

  function getLang() {
    // The app sets <html lang> for the active language; it wins over the URL
    var docLang = (document.documentElement.lang || '').slice(0, 2).toLowerCase();
    if (docLang && I18N[docLang]) return docLang;
    var p = window.location.pathname.toLowerCase();
    if (p.indexOf('/en') === 0) return 'en';
    if (p.indexOf('/ka') === 0) return 'ka';
    var saved = localStorage.getItem('app_language');
    if (saved && I18N[saved]) return saved;
    return 'ru';
  }

  // 1. Capture and persist ?ref= URL parameter
  function captureReferralCode() {
    try {
      var params = new URLSearchParams(window.location.search);
      var code = params.get('ref') || params.get('r');
      if (code) {
        code = code.trim().toUpperCase();
        localStorage.setItem('mesti_ref_code', code);
        document.cookie = 'mesti_ref_code=' + encodeURIComponent(code) + '; max-age=2592000; path=/';
      }
    } catch (e) {}
  }
  captureReferralCode();

  // 2. Bind referral if user authenticated
  function tryBindReferral(phone, userId) {
    var refCode = localStorage.getItem('mesti_ref_code');
    if (!refCode) return;
    fetch('/api/bot/v1/customer/referral/bind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref_code: refCode,
        phone: phone || localStorage.getItem('user_phone') || '',
        user_id: userId || localStorage.getItem('user_id') || ''
      })
    }).catch(function () {});
  }

  window.addEventListener('mesti_phone_auth_success', function (ev) {
    if (ev && ev.detail && ev.detail.phone) {
      tryBindReferral(ev.detail.phone, ev.detail.userId);
    }
  });

  // 3. UI Toast
  var toast = null;
  function showToast(text) {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'mesti-ref-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span>' + text + '</span>';
    toast.classList.add('mesti-toast-show');
    setTimeout(function () {
      if (toast) toast.classList.remove('mesti-toast-show');
    }, 2200);
  }

  // 4. Modal DOM Creation
  var overlay = null;
  function createModalDOM() {
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.className = 'mesti-ref-overlay';
    overlay.id = 'mesti-referral-overlay';

    overlay.innerHTML = [
      '<div class="mesti-ref-modal" id="mesti-referral-modal" role="dialog" aria-modal="true">',
      '  <button type="button" class="mesti-ref-btn-close" id="mesti-ref-btn-close" aria-label="Close">',
      '    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">',
      '      <line x1="18" y1="6" x2="6" y2="18"></line>',
      '      <line x1="6" y1="6" x2="18" y2="18"></line>',
      '    </svg>',
      '  </button>',
      '  <div id="mesti-ref-content"></div>',
      '</div>'
    ].join('\n');

    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        closeModal();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('mesti-ref-active')) {
        closeModal();
      }
    });

    var closeBtn = overlay.querySelector('#mesti-ref-btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    return overlay;
  }

  function closeModal() {
    if (overlay) {
      overlay.classList.remove('mesti-ref-active');
      document.body.style.overflow = '';
    }
  }

  function isAuthenticated() {
    var phone = localStorage.getItem('user_phone');
    var userId = localStorage.getItem('user_id');
    var token = localStorage.getItem('token');
    return Boolean(phone || userId || token);
  }

  function fetchReferralInfo(callback) {
    var phone = localStorage.getItem('user_phone') || '';
    var userId = localStorage.getItem('user_id') || '';
    var token = localStorage.getItem('token') || '';

    fetch('/api/bot/v1/customer/referral/info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? ('Bearer ' + token) : ''
      },
      body: JSON.stringify({ phone: phone, user_id: userId })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data && data.ok) {
        localStorage.setItem('mesti_cached_ref_info', JSON.stringify(data));
        callback(null, data);
      } else {
        callback(data ? data.error : 'Unknown error');
      }
    })
    .catch(function (err) {
      var cached = localStorage.getItem('mesti_cached_ref_info');
      if (cached) {
        try { return callback(null, JSON.parse(cached)); } catch (e) {}
      }
      callback(err);
    });
  }

  function renderModal() {
    createModalDOM();
    var t = I18N[getLang()] || I18N.ru;
    var container = overlay.querySelector('#mesti-ref-content');
    var authed = isAuthenticated();

    if (!authed) {
      container.innerHTML = [
        '<div class="mesti-ref-badge-wrap">',
        '  <span class="mesti-ref-badge"><span class="mesti-ref-badge-dot"></span>' + t.badge + '</span>',
        '</div>',
        '<h2 class="mesti-ref-title">' + t.title + '</h2>',
        '<p class="mesti-ref-subtitle">' + t.guestSubtitle + '</p>',
        '<div class="mesti-ref-guest-card">',
        '  <p class="mesti-ref-guest-text">' + t.guestNotice + '</p>',
        '  <button type="button" class="mesti-ref-guest-btn" id="mesti-ref-login-trigger">',
        '    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>',
        '    <span>' + t.loginBtn + '</span>',
        '  </button>',
        '</div>',
        '<div class="mesti-ref-terms">',
        '  <div class="mesti-ref-term-item"><span class="mesti-ref-term-bullet"></span><span>' + t.rule1 + '</span></div>',
        '  <div class="mesti-ref-term-item"><span class="mesti-ref-term-bullet"></span><span>' + t.rule2 + '</span></div>',
        '  <div class="mesti-ref-term-item"><span class="mesti-ref-term-bullet"></span><span>' + t.rule3 + '</span></div>',
        '</div>'
      ].join('\n');

      var loginBtn = container.querySelector('#mesti-ref-login-trigger');
      if (loginBtn) {
        loginBtn.addEventListener('click', function () {
          closeModal();
          if (window.MestiPhoneAuth && typeof window.MestiPhoneAuth.open === 'function') {
            window.MestiPhoneAuth.open();
          } else {
            var signin = document.querySelector('[data-testid="signin-btn"], .header-signin-btn, a[href*="login"]');
            if (signin) signin.click();
            else window.location.href = '/' + getLang() + '/login';
          }
        });
      }
      return;
    }

    // Authenticated state loading skeleton
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem('mesti_cached_ref_info')); } catch (e) {}

    var activePoints = cached && cached.points !== undefined ? cached.points : 0;
    var refUrl = cached && cached.referral_url ? cached.referral_url : ('https://mestidelivery.com/?ref=' + ((cached && cached.referral_code) || '...'));
    var invitedCount = cached && cached.stats ? cached.stats.invited_count : 0;
    var ordersCount = cached && cached.stats ? cached.stats.orders_completed : 0;

    container.innerHTML = [
      '<div class="mesti-ref-badge-wrap">',
      '  <span class="mesti-ref-badge"><span class="mesti-ref-badge-dot"></span>' + t.badge + '</span>',
      '</div>',
      '<h2 class="mesti-ref-title">' + t.title + '</h2>',
      '<p class="mesti-ref-subtitle">' + t.subtitle + '</p>',
      '<div class="mesti-ref-stat-card">',
      '  <div class="mesti-ref-stat-balance">',
      '    <span class="mesti-ref-stat-label">' + t.balanceLabel + '</span>',
      '    <span class="mesti-ref-stat-amount" id="mesti-ref-val-balance">' + activePoints + ' GEL</span>',
      '  </div>',
      '  <div class="mesti-ref-stat-divider"></div>',
      '  <div class="mesti-ref-stat-meta">',
      '    <div class="mesti-ref-meta-item">',
      '      <span class="mesti-ref-meta-num" id="mesti-ref-val-invited">' + invitedCount + '</span>',
      '      <span class="mesti-ref-meta-text">' + t.invitedLabel + '</span>',
      '    </div>',
      '    <div class="mesti-ref-meta-item">',
      '      <span class="mesti-ref-meta-num" id="mesti-ref-val-orders">' + ordersCount + '</span>',
      '      <span class="mesti-ref-meta-text">' + t.ordersLabel + '</span>',
      '    </div>',
      '  </div>',
      '</div>',
      '<div class="mesti-ref-link-group">',
      '  <div class="mesti-ref-link-box">',
      '    <span class="mesti-ref-link-url" id="mesti-ref-link-text">' + refUrl + '</span>',
      '    <button type="button" class="mesti-ref-copy-btn" id="mesti-ref-copy-btn">',
      '      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
      '      <span class="mesti-copy-label">' + t.copy + '</span>',
      '    </button>',
      '  </div>',
      '</div>',
      '<button type="button" class="mesti-ref-share-primary" id="mesti-ref-share-primary">',
      '  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>',
      '  <span>' + t.sharePrimary + '</span>',
      '</button>',
      '<div class="mesti-ref-messengers">',
      '  <a href="#" target="_blank" rel="noopener noreferrer" class="mesti-ref-messenger-btn" id="mesti-ref-tg">',
      '    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.93-1.28 4.88-2.12 5.86-2.54 2.79-1.16 3.37-1.36 3.75-1.36.08 0 .28.02.4.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>',
      '    <span>' + t.shareTg + '</span>',
      '  </a>',
      '  <a href="#" target="_blank" rel="noopener noreferrer" class="mesti-ref-messenger-btn" id="mesti-ref-wa">',
      '    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.22-.19-.47-.31z"/></svg>',
      '    <span>' + t.shareWa + '</span>',
      '  </a>',
      '</div>',
      '<div class="mesti-ref-terms">',
      '  <div class="mesti-ref-term-item"><span class="mesti-ref-term-bullet"></span><span>' + t.rule1 + '</span></div>',
      '  <div class="mesti-ref-term-item"><span class="mesti-ref-term-bullet"></span><span>' + t.rule2 + '</span></div>',
      '  <div class="mesti-ref-term-item"><span class="mesti-ref-term-bullet"></span><span>' + t.rule3 + '</span></div>',
      '</div>'
    ].join('\n');

    // Attach copy & share handlers
    function localizeUrl(u) {
      try {
        var lang = getLang();
        var parsed = new URL(u, window.location.origin);
        if (!/^\/(ru|en|ka)(\/|$)/.test(parsed.pathname)) parsed.pathname = '/' + lang + (parsed.pathname === '/' ? '/' : parsed.pathname);
        return parsed.toString();
      } catch (e) { return u; }
    }

    function setupActions(rawUrl) {
      var url = localizeUrl(rawUrl);
      var copyBtn = container.querySelector('#mesti-ref-copy-btn');
      var shareBtn = container.querySelector('#mesti-ref-share-primary');
      var tgBtn = container.querySelector('#mesti-ref-tg');
      var waBtn = container.querySelector('#mesti-ref-wa');

      function copyToClipboard() {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () {
            onCopied();
          }).catch(function () {
            fallbackCopy(url);
          });
        } else {
          fallbackCopy(url);
        }
      }

      function onCopied() {
        showToast(t.toastCopied);
        if (copyBtn) {
          copyBtn.classList.add('mesti-copied');
          var label = copyBtn.querySelector('.mesti-copy-label');
          if (label) label.textContent = t.copied;
          setTimeout(function () {
            copyBtn.classList.remove('mesti-copied');
            if (label) label.textContent = t.copy;
          }, 2000);
        }
      }

      function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
          onCopied();
        } catch (e) {}
        document.body.removeChild(ta);
      }

      if (copyBtn) copyBtn.onclick = copyToClipboard;

      if (shareBtn) {
        shareBtn.onclick = function () {
          if (navigator.share) {
            navigator.share({
              title: 'MestiDelivery',
              text: t.shareText,
              url: url
            }).catch(function () {});
          } else {
            copyToClipboard();
          }
        };
      }

      if (tgBtn) {
        // Telegram puts the link above the text, so the trailing pointer line is dropped there
        var tgUrl = 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(t.shareText.replace(/[^\n]*$/, t.shareLinkAbove));
        tgBtn.setAttribute('href', tgUrl);
      }

      if (waBtn) {
        var waUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(t.shareText + ' ' + url);
        waBtn.setAttribute('href', waUrl);
      }
    }

    setupActions(refUrl);

    // Fetch live fresh stats in background
    fetchReferralInfo(function (err, info) {
      if (!err && info) {
        var balEl = container.querySelector('#mesti-ref-val-balance');
        var invEl = container.querySelector('#mesti-ref-val-invited');
        var ordEl = container.querySelector('#mesti-ref-val-orders');
        var urlEl = container.querySelector('#mesti-ref-link-text');

        if (balEl && info.points !== undefined) balEl.textContent = info.points + ' GEL';
        if (invEl && info.stats) invEl.textContent = info.stats.invited_count || 0;
        if (ordEl && info.stats) ordEl.textContent = info.stats.orders_completed || 0;
        if (urlEl && info.referral_url) {
          urlEl.textContent = info.referral_url;
          setupActions(info.referral_url);
        }
      }
    });
  }

  function openModal() {
    renderModal();
    if (overlay) {
      overlay.classList.add('mesti-ref-active');
      document.body.style.overflow = 'hidden';
    }
  }

  // Global API
  window.MestiReferral = {
    open: openModal,
    close: closeModal
  };

  // Global click delegate for referral banners
  document.addEventListener('click', function (e) {
    var target = e.target;
    var banner = target.closest && target.closest('img[src*="skidka-za-druga"], img[src*="refer-a-friend"], [data-referral-banner]');
    if (banner) {
      e.preventDefault();
      e.stopPropagation();
      openModal();
    }
  }, true);

})();
