/**
 * MestiDelivery — BBQ Garden Yandex-Style Modifiers Engine
 * Full replica of Yandex Eats modifier system:
 * - Checkbox groups with selection limits ("Выбери соус", "Хлеб к блюду")
 * - Dynamic price recalculation on the bottom button
 * - Sticky modal footer with quantity and action button
 * - Native cart dispatch for main dish + all selected modifiers
 * - Full multilingual support (RU, EN, KA)
 * - Supports BOTH Mobile (iPhone / Telegram WebApp) and Desktop
 */
(function () {
  if (window.__MestiBBQModifiers && window.__MestiBBQModifiers._yandexActive) return;

  var BBQ_ID = "rest-1785110335267403964";

  var I18N = {
    ru: {
      sauceTitle: "Добавить к блюду",
      sauceSub: "По желанию",
      breadTitle: "Хлеб к блюду",
      breadSub: "Необязательно, выберите 1",
      tkemali: "Ткемали",
      ketchup: "Кетчуп",
      bread: "Хлеб (Шоти)",
      add: "Добавить",
      cartUpsellTitle: "Не забудьте к заказу:"
    },
    en: {
      sauceTitle: "Add to your dish",
      sauceSub: "Optional",
      breadTitle: "Bread with dish",
      breadSub: "Optional, choose 1",
      tkemali: "Tkemali",
      ketchup: "Ketchup",
      bread: "Bread (Shoti)",
      add: "Add",
      cartUpsellTitle: "Don't forget with your order:"
    },
    ka: {
      sauceTitle: "დაამატეთ კერძს",
      sauceSub: "სურვილისამებრ",
      breadTitle: "პური კერძთან",
      breadSub: "არასავალდებულო, აირჩიეთ 1",
      tkemali: "ტყემალი",
      ketchup: "კეტჩუპი",
      bread: "პური (შოთი)",
      add: "დამატება",
      cartUpsellTitle: "არ დაგავიწყდეთ შეკვეთასთან:"
    }
  };

  var MestiBBQ = {
    _yandexActive: true,

    isBBQPage: function () {
      var p = window.location.pathname.toLowerCase();
      var h = window.location.hash.toLowerCase();
      var t = (document.title || "").toLowerCase();
      if (p.indexOf("bbq-garden") !== -1 || p.indexOf(BBQ_ID) !== -1) return true;
      if (h.indexOf("bbq-garden") !== -1 || h.indexOf(BBQ_ID) !== -1) return true;
      if (t.indexOf("bbq garden") !== -1) return true;
      var titleEl = document.querySelector(".ric-title, .restaurant-name, .v2-header-title, h1");
      if (titleEl && (titleEl.textContent || "").toLowerCase().indexOf("bbq") !== -1) return true;
      return false;
    },

    getLang: function () {
      var p = window.location.pathname.toLowerCase();
      if (p.startsWith("/ka")) return "ka";
      if (p.startsWith("/en")) return "en";
      var l = (localStorage.getItem("app_language") || "ru").toLowerCase();
      if (l.indexOf("ka") !== -1 || l.indexOf("ge") !== -1) return "ka";
      if (l.indexOf("en") !== -1) return "en";
      return "ru";
    },

    getText: function (key) {
      var lang = this.getLang();
      var dict = I18N[lang] || I18N.ru;
      return dict[key] || I18N.ru[key] || "";
    },

    triggerNativeAdd: function (keyword) {
      // Find cards across both Mobile (.dish-card) and Desktop (.dish-card-new)
      var cards = document.querySelectorAll(".dish-card, .dish-card-new");
      for (var i = 0; i < cards.length; i++) {
        var txt = (cards[i].textContent || "").toLowerCase();
        if (txt.indexOf(keyword.toLowerCase()) !== -1) {
          var btn = cards[i].querySelector(".qty-btn.qty-plus, .qty-plus, .dcn-qty-plus, button.qty-plus, button[aria-label='increase']");
          if (btn) {
            btn.click();
            return true;
          }
        }
      }
      return false;
    }
  };

  window.__MestiBBQModifiers = MestiBBQ;

  // Inject Styles for Yandex-Eats-style Modifiers
  function injectStyles() {
    if (document.getElementById("bbq-yandex-modifiers-styles")) return;
    var style = document.createElement("style");
    style.id = "bbq-yandex-modifiers-styles";
    style.textContent = [
      "/* HIDE FLOATING DELIVERY BAR WHEN ANY DISH MODAL IS OPEN */",
      "body:has(.dish-modal-overlay) .glass-panel-container,",
      "body:has(.dish-modal-content) .glass-panel-container,",
      "body:has(.pc-dish-modal-overlay) .glass-panel-container,",
      "body:has(.pc-dish-modal) .glass-panel-container,",
      "body:has([class*='dish-modal']) .glass-panel-container,",
      "body.dish-modal-open .glass-panel-container,",
      ".dish-modal-open .glass-panel-container {",
      "  display: none !important;",
      "  visibility: hidden !important;",
      "  opacity: 0 !important;",
      "  pointer-events: none !important;",
      "}",
      "/* Ensure dish modal overlay and footer sit firmly above anything else */",
      ".dish-modal-overlay, .pc-dish-modal-overlay {",
      "  z-index: 10000 !important;",
      "}",
      ".dish-modal-content {",
      "  z-index: 10001 !important;",
      "}",
      ".modal-footer-v3 {",
      "  z-index: 10002 !important;",
      "}",
      "/* Hide Modifiers tab and section from menu grid */",
      ".bbq-hide-section {",
      "  display: none !important;",
      "}",
      "/* Mobile Modal Hero Image full height */",
      ".mobile-restaurant-page .modal-hero-img {",
      "  height: 340px !important;",
      "  max-height: none !important;",
      "}",
      "@media (max-width: 380px) {",
      "  .mobile-restaurant-page .modal-hero-img {",
      "    height: 300px !important;",
      "  }",
      "}",
      "/* Description strictly max 2 lines */",
      ".mobile-restaurant-page .modal-description, .pc-dish-modal-desc {",
      "  display: -webkit-box !important;",
      "  -webkit-line-clamp: 2 !important;",
      "  -webkit-box-orient: vertical !important;",
      "  overflow: hidden !important;",
      "  text-overflow: ellipsis !important;",
      "  line-height: 1.4 !important;",
      "  margin-bottom: 14px !important;",
      "}",
      ".mobile-restaurant-page .kbju-section-v2 {",
      "  margin-bottom: 14px !important;",
      "}",
      ".mobile-restaurant-page .modal-body {",
      "  overflow-y: auto !important;",
      "  -webkit-overflow-scrolling: touch !important;",
      "  padding: 20px !important;",
      "  padding-bottom: 30px !important;",
      "}",
      "/* Desktop Modal Tweaks */",
      ".pc-dish-modal {",
      "  max-height: 88vh !important;",
      "  display: flex !important;",
      "  flex-direction: column !important;",
      "  overflow: hidden !important;",
      "  position: relative !important;",
      "}",
      ".pc-dish-modal-body {",
      "  overflow-y: auto !important;",
      "  max-height: calc(88vh - 260px) !important;",
      "  padding-bottom: 74px !important;",
      "  -webkit-overflow-scrolling: touch !important;",
      "}",
      ".pc-dish-modal-add {",
      "  position: absolute !important;",
      "  bottom: 16px !important;",
      "  left: 20px !important;",
      "  right: 20px !important;",
      "  width: calc(100% - 40px) !important;",
      "  z-index: 25 !important;",
      "  box-shadow: 0 -8px 24px rgba(21, 21, 20, 0.9) !important;",
      "}",
      "/* Yandex Modifier Container */",
      ".ym-container {",
      "  margin: 16px 0 16px 0 !important;",
      "  display: flex !important;",
      "  flex-direction: column !important;",
      "  gap: 14px !important;",
      "  user-select: none !important;",
      "}",
      ".ym-section {",
      "  background: rgba(255, 255, 255, 0.04) !important;",
      "  border: 1px solid rgba(255, 255, 255, 0.08) !important;",
      "  border-radius: 18px !important;",
      "  padding: 16px !important;",
      "  box-sizing: border-box !important;",
      "}",
      ".ym-header {",
      "  margin-bottom: 12px !important;",
      "}",
      ".ym-title {",
      "  font-size: 16px !important;",
      "  font-weight: 700 !important;",
      "  color: #ffffff !important;",
      "  line-height: 1.2 !important;",
      "}",
      ".ym-subtitle {",
      "  font-size: 13px !important;",
      "  color: rgba(255, 255, 255, 0.45) !important;",
      "  margin-top: 4px !important;",
      "}",
      ".ym-list {",
      "  display: flex !important;",
      "  flex-direction: column !important;",
      "}",
      ".ym-row {",
      "  display: flex !important;",
      "  align-items: center !important;",
      "  justify-content: space-between !important;",
      "  padding: 12px 0 !important;",
      "  border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;",
      "  cursor: pointer !important;",
      "  transition: all 0.15s ease !important;",
      "}",
      ".ym-row:first-child {",
      "  padding-top: 2px !important;",
      "}",
      ".ym-row:last-child {",
      "  border-bottom: none !important;",
      "  padding-bottom: 2px !important;",
      "}",
      ".ym-left {",
      "  display: flex !important;",
      "  align-items: center !important;",
      "  gap: 12px !important;",
      "}",
      ".ym-checkbox {",
      "  width: 22px !important;",
      "  height: 22px !important;",
      "  border-radius: 6px !important;",
      "  border: 2px solid rgba(255, 255, 255, 0.28) !important;",
      "  background: rgba(255, 255, 255, 0.06) !important;",
      "  display: flex !important;",
      "  align-items: center !important;",
      "  justify-content: center !important;",
      "  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;",
      "  flex-shrink: 0 !important;",
      "}",
      ".ym-row.selected .ym-checkbox {",
      "  background: #21ea7c !important;",
      "  border-color: #21ea7c !important;",
      "}",
      ".ym-checkbox svg {",
      "  display: none !important;",
      "  stroke: #0c1c11 !important;",
      "  stroke-width: 3 !important;",
      "}",
      ".ym-row.selected .ym-checkbox svg {",
      "  display: block !important;",
      "}",
      ".ym-name {",
      "  font-size: 15px !important;",
      "  font-weight: 500 !important;",
      "  color: #ffffff !important;",
      "}",
      ".ym-price {",
      "  font-size: 14px !important;",
      "  font-weight: 600 !important;",
      "  color: rgba(255, 255, 255, 0.6) !important;",
      "}",
      ".ym-row.selected .ym-price {",
      "  color: #21ea7c !important;",
      "}",
      "/* Modifiers as tiles: same material as the tip / delivery-mode buttons */",
      ".ym-container { margin: 8px 0 28px 0 !important; gap: 0 !important; }",
      ".ym-section { background: none !important; border: 0 !important; border-radius: 0 !important; padding: 0 !important; }",
      ".ym-header { margin: 0 0 12px 0 !important; padding: 0 !important; }",
      ".ym-title { font-size: 14px !important; font-weight: 700 !important; color: rgba(255, 255, 255, 0.3) !important; text-transform: uppercase !important; letter-spacing: 0.5px !important; line-height: 1.2 !important; }",
      ".ym-subtitle { display: none !important; }",
      ".ym-list { display: grid !important; grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 8px !important; }",
      ".ym-row, .ym-row:first-child, .ym-row:last-child { position: relative !important; display: flex !important; flex-direction: column !important; align-items: flex-start !important; justify-content: center !important; gap: 3px !important; min-height: 64px !important; padding: 10px 12px !important; border: 2px solid rgba(255, 255, 255, 0.1) !important; border-radius: 16px !important; background: transparent !important; box-sizing: border-box !important; -webkit-tap-highlight-color: transparent !important; transition: border-color 0.2s ease, background-color 0.2s ease !important; }",
      ".ym-row.selected { border-color: rgba(33, 234, 124, 0.85) !important; background: #1F1F1E !important; }",
      ".ym-row:active { transform: scale(0.97) !important; }",
      ".ym-left { display: block !important; min-width: 0 !important; max-width: 100% !important; }",
      ".ym-checkbox { position: absolute !important; top: auto !important; bottom: 10px !important; right: 10px !important; width: 18px !important; height: 18px !important; border: 0 !important; border-radius: 50% !important; background: #21ea7c !important; opacity: 0 !important; transform: scale(0.6) !important; transition: opacity 0.15s ease, transform 0.15s ease !important; }",
      ".ym-row.selected .ym-checkbox { opacity: 1 !important; transform: scale(1) !important; }",
      ".ym-checkbox svg { width: 10px !important; height: 10px !important; }",
      ".ym-name { display: block !important; font-size: 14px !important; font-weight: 600 !important; color: #ffffff !important; line-height: 1.25 !important; white-space: normal !important; overflow-wrap: anywhere !important; }",
      ".ym-price { font-size: 13px !important; font-weight: 600 !important; color: rgba(255, 255, 255, 0.45) !important; }",
      ".ym-row.selected .ym-price { color: #21ea7c !important; }",
      "/* Cart Upsell Strip */",
      ".bbq-cart-upsell {",
      "  margin: 12px 0 16px 0 !important;",
      "  padding: 14px !important;",
      "  background: rgba(255, 255, 255, 0.04) !important;",
      "  border: 1px solid rgba(255, 255, 255, 0.08) !important;",
      "  border-radius: 14px !important;",
      "}",
      ".bbq-cart-upsell-title {",
      "  font-size: 12px !important;",
      "  font-weight: 700 !important;",
      "  color: rgba(255, 255, 255, 0.65) !important;",
      "  margin-bottom: 10px !important;",
      "  text-transform: uppercase !important;",
      "  letter-spacing: 0.5px !important;",
      "}",
      ".bbq-mod-chips {",
      "  display: flex !important;",
      "  gap: 8px !important;",
      "  flex-wrap: wrap !important;",
      "}",
      ".bbq-mod-chip {",
      "  display: inline-flex !important;",
      "  align-items: center !important;",
      "  gap: 6px !important;",
      "  padding: 8px 14px !important;",
      "  background: rgba(33, 234, 124, 0.08) !important;",
      "  border: 1px solid rgba(33, 234, 124, 0.28) !important;",
      "  border-radius: 20px !important;",
      "  color: #fff !important;",
      "  font-size: 13px !important;",
      "  font-weight: 600 !important;",
      "  cursor: pointer !important;",
      "  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;",
      "}",
      ".bbq-mod-chip .chip-price {",
      "  color: #21ea7c !important;",
      "  font-weight: 700 !important;",
      "}"
    ].join("\n");
    document.head.appendChild(style);
  }

  // 1. Hide Modifiers tab and section from menu grid (Mobile + Desktop)
  function updateMenuDisplay() {
    if (!MestiBBQ.isBBQPage()) return;

    var forbiddenWords = ["модификаторы", "modifiers", "მოდიფიკატორები", "дополнения"];

    // Mobile tabs
    var mobileTabs = document.querySelectorAll(".category-item, .category-name");
    for (var i = 0; i < mobileTabs.length; i++) {
      var txtM = (mobileTabs[i].textContent || "").toLowerCase();
      for (var f = 0; f < forbiddenWords.length; f++) {
        if (txtM.indexOf(forbiddenWords[f]) !== -1) {
          var item = mobileTabs[i].closest(".category-item") || mobileTabs[i];
          item.classList.add("bbq-hide-section");
          item.style.setProperty("display", "none", "important");
          break;
        }
      }
    }

    // Mobile sections
    var mobileSections = document.querySelectorAll(".category-section, [data-category]");
    for (var j = 0; j < mobileSections.length; j++) {
      var catM = (mobileSections[j].getAttribute("data-category") || mobileSections[j].textContent || "").toLowerCase();
      for (var f2 = 0; f2 < forbiddenWords.length; f2++) {
        if (catM.indexOf(forbiddenWords[f2]) !== -1) {
          mobileSections[j].classList.add("bbq-hide-section");
          mobileSections[j].style.setProperty("display", "none", "important");
          break;
        }
      }
    }

    // Desktop tabs
    var deskTabs = document.querySelectorAll(".mn-item, .pc-category-item, [class*='tab']");
    for (var k = 0; k < deskTabs.length; k++) {
      var txtD = (deskTabs[k].textContent || "").toLowerCase();
      for (var f3 = 0; f3 < forbiddenWords.length; f3++) {
        if (txtD.indexOf(forbiddenWords[f3]) !== -1) {
          deskTabs[k].classList.add("bbq-hide-section");
          deskTabs[k].style.setProperty("display", "none", "important");
          break;
        }
      }
    }

    // Desktop sections
    var deskSections = document.querySelectorAll(".menu-section");
    for (var m = 0; m < deskSections.length; m++) {
      var titleD = (deskSections[m].querySelector(".ms-title, h2, h3") || deskSections[m]).textContent.toLowerCase();
      for (var f4 = 0; f4 < forbiddenWords.length; f4++) {
        if (titleD.indexOf(forbiddenWords[f4]) !== -1) {
          deskSections[m].classList.add("bbq-hide-section");
          deskSections[m].style.setProperty("display", "none", "important");
          break;
        }
      }
    }
  }

  // 2. Enhance Dish Modal with Yandex Eats UI (Mobile + Desktop)
  function enhanceDishModal() {
    if (!MestiBBQ.isBBQPage()) return;

    // Detect Modal: either Desktop (.pc-dish-modal) or Mobile (.dish-modal-content)
    var desktopModal = document.querySelector(".pc-dish-modal");
    var mobileModal = document.querySelector(".dish-modal-content");

    if (!desktopModal && !mobileModal) return;

    var isMobile = !!mobileModal;
    var modal = isMobile ? mobileModal : desktopModal;

    var body = isMobile ? modal.querySelector(".modal-body") : modal.querySelector(".pc-dish-modal-body");
    var addBtn = isMobile ? modal.querySelector(".modal-main-add-btn") : modal.querySelector(".pc-dish-modal-add");

    if (!body || !addBtn) return;

    // Check if already injected
    if (body.querySelector(".ym-container")) return;

    // Remove legacy wrapper if present
    var legacy = body.querySelector(".bbq-mod-wrapper");
    if (legacy) legacy.remove();

    // Check dish title: don't show modifiers on drinks, desserts, or snacks
    var dishTitleEl = modal.querySelector("h2, .footer-dish-name, .pc-dish-modal-header h2");
    var dishTitle = (dishTitleEl ? dishTitleEl.textContent : "").toLowerCase();

    var forbiddenTitles = [
      "чай", "кофе", "вода", "лимонад", "кола", "coca", "fanta", "sprite", "минеральн",
      "торт", "тирамису", "мороженое", "десерт", "чипсы", "арахис", "снек", "напиток",
      "ткемали", "кетчуп", "шоти", "sauce", "bread", "water", "tea", "coffee", "dessert"
    ];
    for (var t = 0; t < forbiddenTitles.length; t++) {
      if (dishTitle.indexOf(forbiddenTitles[t]) !== -1) {
        return;
      }
    }

    // Extract base price
    var basePrice = 0;
    var priceEl = isMobile ? modal.querySelector(".footer-dish-price") : modal.querySelector(".pc-dish-modal-header span");
    var priceMatch = ((priceEl ? priceEl.textContent : "") || (addBtn.textContent || "")).match(/([0-9]+(?:\.[0-9]+)?)/);
    if (priceMatch) {
      basePrice = parseFloat(priceMatch[1]);
    }

    // Build Yandex modifier container
    var container = document.createElement("div");
    container.className = "ym-container";

    // Section 1: Sauces (Choose up to 2)
    var secSauces = document.createElement("div");
    secSauces.className = "ym-section";
    secSauces.innerHTML = [
      '<div class="ym-header">',
      '  <div class="ym-title">' + MestiBBQ.getText("sauceTitle") + '</div>',
      '  <div class="ym-subtitle">' + MestiBBQ.getText("sauceSub") + '</div>',
      '</div>',
      '<div class="ym-list">',
      '  <div class="ym-row" data-id="prod-1785110345912098419" data-group="sauce" data-search="Ткемали" data-price="3">',
      '    <div class="ym-left">',
      '      <div class="ym-checkbox"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5"/></svg></div>',
      '      <div class="ym-name">' + MestiBBQ.getText("tkemali") + '</div>',
      '    </div>',
      '    <div class="ym-price">+3 ₾</div>',
      '  </div>',
      '  <div class="ym-row" data-id="prod-1785110346312175981" data-group="sauce" data-search="Кетчуп" data-price="3">',
      '    <div class="ym-left">',
      '      <div class="ym-checkbox"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5"/></svg></div>',
      '      <div class="ym-name">' + MestiBBQ.getText("ketchup") + '</div>',
      '    </div>',
      '    <div class="ym-price">+3 ₾</div>',
      '  </div>',
      '</div>'
    ].join("");
    container.appendChild(secSauces);
    secSauces.querySelector(".ym-list").insertAdjacentHTML("beforeend", [
      '  <div class="ym-row" data-id="prod-1785110345515266453" data-group="bread" data-search="Хлеб" data-price="5">',
      '    <div class="ym-left">',
      '      <div class="ym-checkbox"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5"/></svg></div>',
      '      <div class="ym-name">' + MestiBBQ.getText("bread") + '</div>',
      '    </div>',
      '    <div class="ym-price">+5 ₾</div>',
      '  </div>'
    ].join(""));

    // Insertion:
    if (isMobile) {
      // Right under the description, not below the nutrition facts
      var kbju = body.querySelector(".kbju-section-v2, .section-label-v3, .kbju-grid-modal");
      if (kbju && kbju.parentElement === body) body.insertBefore(container, kbju);
      else body.appendChild(container);
    } else {
      // Same order as on the phone: add-ons first, nutrition after
      var kbjuPc = body.querySelector(".kbju-section-v2");
      body.insertBefore(container, kbjuPc && kbjuPc.parentElement === body ? kbjuPc : addBtn);
    }

    // Dynamic Price Calculator
    function updateTotalPrice() {
      var qty = 1;
      var qtyEl = modal.querySelector(".modal-qty-val");
      if (qtyEl) {
        qty = parseInt(qtyEl.textContent || "1") || 1;
      }

      var extra = 0;
      var selected = container.querySelectorAll(".ym-row.selected");
      selected.forEach(function (r) {
        extra += parseFloat(r.getAttribute("data-price") || 0);
      });

      var total = (basePrice + extra) * qty;

      if (isMobile) {
        if (priceEl) {
          priceEl.textContent = total.toFixed(2) + " ₾";
        }
        addBtn.innerHTML = MestiBBQ.getText("add") + ' • ' + total.toFixed(2) + ' ₾';
      } else {
        addBtn.innerHTML = MestiBBQ.getText("add") + ' • ' + total.toFixed(2) + ' ₾';
      }
    }

    // Checkbox toggling
    var rows = container.querySelectorAll(".ym-row");
    rows.forEach(function (r) {
      r.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        r.classList.toggle("selected");
        updateTotalPrice();
      });
    });

    // Observe quantity changes on Mobile
    var qtyValEl = modal.querySelector(".modal-qty-val");
    if (qtyValEl && window.MutationObserver) {
      var obs = new MutationObserver(function () {
        updateTotalPrice();
      });
      obs.observe(qtyValEl, { childList: true, characterData: true, subtree: true });
    }

    // Intercept Add Button
    var originalOnClick = addBtn.onclick;
    addBtn.onclick = function (e) {
      var selected = container.querySelectorAll(".ym-row.selected");
      var qty = 1;
      var qEl = modal.querySelector(".modal-qty-val");
      if (qEl) {
        qty = parseInt(qEl.textContent || "1") || 1;
      }

      selected.forEach(function (r) {
        var search = r.getAttribute("data-search");
        for (var k = 0; k < qty; k++) {
          MestiBBQ.triggerNativeAdd(search);
        }
      });

      if (typeof originalOnClick === "function") {
        originalOnClick.call(addBtn, e);
      } else if (isMobile) {
        // Trigger close button if originalOnClick wasn't bound directly
        var closeBtn = modal.querySelector(".modal-close-btn");
        if (closeBtn) closeBtn.click();
      }
    };

    // Initial price sync
    updateTotalPrice();
  }

  // 3. Enhance Cart Drawer / Panel (Mobile + Desktop)
  function enhanceCartDrawer() {
    if (!MestiBBQ.isBBQPage()) return;

    var cart = document.querySelector(".cart-widget, .mobile-cart, [class*='cart-content'], .v2-compact-cart-summary");
    if (!cart) return;

    if (cart.querySelector(".bbq-cart-upsell")) return;
    var cartText = cart.textContent.toLowerCase();
    if (cartText.indexOf("пусто") !== -1 || cartText.indexOf("empty") !== -1) return;

    var submitBtn = cart.querySelector("button[class*='submit'], button[class*='checkout'], button[class*='order'], .cw-submit-btn, .cw-checkout-btn");
    if (!submitBtn) return;

    var upsell = document.createElement("div");
    upsell.className = "bbq-cart-upsell";
    upsell.innerHTML = '<div class="bbq-cart-upsell-title">' + MestiBBQ.getText("cartUpsellTitle") + '</div>';

    var chips = document.createElement("div");
    chips.className = "bbq-mod-chips";

    var items = [
      { key: "tkemali", name: MestiBBQ.getText("tkemali"), price: "3 ₾", search: "Ткемали" },
      { key: "ketchup", name: MestiBBQ.getText("ketchup"), price: "3 ₾", search: "Кетчуп" },
      { key: "bread", name: MestiBBQ.getText("bread"), price: "5 ₾", search: "Хлеб" }
    ];

    items.forEach(function (it) {
      if (cartText.indexOf(it.search.toLowerCase()) !== -1) return;

      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "bbq-mod-chip";
      chip.innerHTML = '+ ' + it.name + ' <span class="chip-price">' + it.price + '</span>';

      chip.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var ok = MestiBBQ.triggerNativeAdd(it.search);
        if (ok) {
          chip.remove();
          if (chips.children.length === 0) upsell.remove();
        }
      });

      chips.appendChild(chip);
    });

    if (chips.children.length > 0) {
      upsell.appendChild(chips);
      submitBtn.parentNode.insertBefore(upsell, submitBtn);
    }
  }

  // 4. Hide Floating Delivery Bar whenever ANY dish modal is open
  function updateGlassPanelVisibility() {
    var isModal = !!document.querySelector(
      '.dish-modal-overlay, .dish-modal-content, .pc-dish-modal-overlay, .pc-dish-modal, [class*="dish-modal-overlay"], [class*="dish-modal-content"]'
    );
    if (document.body) {
      if (isModal) {
        document.body.classList.add("dish-modal-open");
      } else {
        document.body.classList.remove("dish-modal-open");
      }
    }
    var panels = document.querySelectorAll(".glass-panel-container");
    for (var i = 0; i < panels.length; i++) {
      if (isModal) {
        panels[i].style.setProperty("display", "none", "important");
        panels[i].style.setProperty("visibility", "hidden", "important");
        panels[i].style.setProperty("opacity", "0", "important");
        panels[i].style.setProperty("pointer-events", "none", "important");
      } else {
        panels[i].style.removeProperty("display");
        panels[i].style.removeProperty("visibility");
        panels[i].style.removeProperty("opacity");
        panels[i].style.removeProperty("pointer-events");
      }
    }
  }

  // Active loop & observer
  injectStyles();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      injectStyles();
      updateGlassPanelVisibility();
    });
  } else {
    updateGlassPanelVisibility();
  }

  if (window.MutationObserver) {
    try {
      var mo = new MutationObserver(function () {
        updateGlassPanelVisibility();
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
  }

  setInterval(function () {
    updateGlassPanelVisibility();
    updateMenuDisplay();
    enhanceDishModal();
    enhanceCartDrawer();
  }, 100);

})();


