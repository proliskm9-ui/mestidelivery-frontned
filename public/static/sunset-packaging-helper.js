/**
 * MestiDelivery — Sunset Restaurant Packaging Logic & UI Badges
 * Exclusively for Sunset Restaurant (rest-1785108442716453469 / slug: sunset)
 * 
 * Rules:
 * - Combinable dishes (шашлык, кубдари, хачапури, чвиштари, картофель фри, хлеб, хинкали) -> 1 box (2 GEL) on repeat
 * - Free items (напитки, соусы) -> 0 GEL
 * - All other dishes (супы, соусные горячие блюда, салаты и т.д.) -> 2 GEL per portion (individual container)
 * - Clean SVG icons on the website; custom Telegram Premium emoji in bot.
 * - NO header banner on restaurant page.
 */
(function () {
  if (window.__MestiSunset && window.__MestiSunset._active) return;

  var SUNSET_ID = "rest-1785108442716453469";

  var COMBINABLE_KEYWORDS = [
    "мწვადი", "шашлык", "barbecue", "mtsvadi",
    "კუბდარი", "кубдари", "kubdari",
    "ხაჭაპური", "хачапури", "khachapuri",
    "ჭვიშტარი", "чвиштари", "chvishtari",
    "ფრი", "фри", "fries",
    "პური", "хлеб", "bread",
    "ხინკალი", "хинкали", "khinkali"
  ];

  var FREE_KEYWORDS = [
    "borjomi", "боржоми", "coca", "кола", "вода", "water", "წყალი",
    "лимонад", "lemonade", "ლიმონათი", "чай", "tea", "ჩაი",
    "кофе", "coffee", "ყავა", "соус", "sauce", "სოუსი",
    "ткемали", "ტყემალი", "сацебели", "საწებელი", "баже", "ბაჟე",
    "кетчуп", "кетчупи", "сметана", "არაჟანი", "набеглави", "ნაბეღლავი",
    "ნაბეგლავი", "сок", "juice", "წვენი"
  ];

  var SVG_BOX = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sunset-svg-box"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>';

  var MestiSunset = {
    isSunsetRestaurant: function (id, name) {
      var sId = String(id || "").toLowerCase();
      var sName = String(name || "").toLowerCase();
      if (sId === SUNSET_ID || sId === "sunset-restaurant" || sId.indexOf("sunset") !== -1) return true;
      if (sName.indexOf("sunset") !== -1) return true;
      return false;
    },

    isCurrentPageSunset: function () {
      var path = window.location.pathname.toLowerCase();
      var hash = window.location.hash.toLowerCase();
      var title = (document.title || "").toLowerCase();
      if (path.indexOf("sunset") !== -1 || path.indexOf(SUNSET_ID) !== -1) return true;
      if (hash.indexOf("sunset") !== -1 || hash.indexOf(SUNSET_ID) !== -1) return true;
      if (title.indexOf("sunset") !== -1) return true;
      var restNameEl = document.querySelector(".restaurant-name, .rest-title, .rn-title, h1");
      if (restNameEl && (restNameEl.textContent || "").toLowerCase().indexOf("sunset") !== -1) return true;
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

    getItemType: function (name, category) {
      var n = String(name || "").toLowerCase();
      var c = String(category || "").toLowerCase();
      for (var i = 0; i < FREE_KEYWORDS.length; i++) {
        if (n.indexOf(FREE_KEYWORDS[i]) !== -1) return "free";
      }
      if (c === "напитки" || c === "соусы" || c === "drinks" || c === "sauces") return "free";
      for (var j = 0; j < COMBINABLE_KEYWORDS.length; j++) {
        if (n.indexOf(COMBINABLE_KEYWORDS[j]) !== -1) return "combinable";
      }
      return "individual";
    },

    getBadgeInfo: function (dishName, category) {
      var type = this.getItemType(dishName, category);
      if (type === "free") return null;
      var lang = this.getLang();
      if (type === "combinable") {
        var text = "Упаковка: 2 ₾ (при повторе — один бокс)";
        if (lang === "ka") text = "შეფუთვა: 2 ₾ (გამეორებისას — ერთი ბოქსი)";
        if (lang === "en") text = "Packaging: 2 ₾ (shared box on repeats)";
        return { type: "combinable", text: text };
      } else {
        var text = "Индивидуальный контейнер: +2 ₾";
        if (lang === "ka") text = "ინდივიდუალური კონტეინერი: +2 ₾";
        if (lang === "en") text = "Individual container: +2 ₾";
        return { type: "individual", text: text };
      }
    },

    calculatePackagingFee: function (items) {
      if (!items || !items.length) return 0;
      var boxes = 0;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var prod = it.product || it;
        var name = prod.name || it.name || "";
        var cat = prod.category || it.category || "";
        var qty = Number(it.quantity || prod.quantity || 1);
        var type = this.getItemType(name, cat);
        if (type === "free") continue;
        if (type === "combinable") {
          boxes += 1;
        } else {
          boxes += qty;
        }
      }
      return boxes * 2.0;
    },

    getPackagingRowLabel: function () {
      var lang = this.getLang();
      if (lang === "ka") return "შეფუთვა (Sunset)";
      if (lang === "en") return "Packaging (Sunset)";
      return "Упаковка (Sunset)";
    }
  };

  window.__MestiSunset = MestiSunset;

  // Inject Styles
  function injectStyles() {
    if (document.getElementById("sunset-packaging-styles")) return;
    var style = document.createElement("style");
    style.id = "sunset-packaging-styles";
    style.textContent = [
      ".sunset-pkg-badge {",
      "  display: flex !important;",
      "  align-items: center !important;",
      "  gap: 10px !important;",
      "  margin: 12px 0 16px 0 !important;",
      "  padding: 9px 14px !important;",
      "  border-radius: 12px !important;",
      "  font-size: 13px !important;",
      "  font-weight: 600 !important;",
      "  line-height: 1.35 !important;",
      "  box-shadow: 0 4px 14px rgba(0,0,0,0.2) !important;",
      "  width: 100% !important;",
      "  max-width: fit-content !important;",
      "  box-sizing: border-box !important;",
      "  transition: all 0.2s ease !important;",
      "}",
      ".sunset-pkg-badge.combinable {",
      "  background: linear-gradient(135deg, rgba(33, 234, 124, 0.14) 0%, rgba(33, 234, 124, 0.04) 100%) !important;",
      "  border: 1px solid rgba(33, 234, 124, 0.35) !important;",
      "  color: #21ea7c !important;",
      "}",
      ".sunset-pkg-badge.combinable svg {",
      "  stroke: #21ea7c !important;",
      "  flex-shrink: 0 !important;",
      "}",
      ".sunset-pkg-badge.individual {",
      "  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%) !important;",
      "  border: 1px solid rgba(255, 255, 255, 0.18) !important;",
      "  color: rgba(255, 255, 255, 0.92) !important;",
      "}",
      ".sunset-pkg-badge.individual svg {",
      "  stroke: #21ea7c !important;",
      "  flex-shrink: 0 !important;",
      "}",
      ".summary-line.sunset-pkg-row {",
      "  display: flex !important;",
      "  justify-content: space-between !important;",
      "  align-items: center !important;",
      "  color: #21ea7c !important;",
      "  font-weight: 600 !important;",
      "  font-size: 14px !important;",
      "  padding: 4px 0 !important;",
      "}",
      ".summary-line.sunset-pkg-row .sunset-pkg-label {",
      "  display: inline-flex !important;",
      "  align-items: center !important;",
      "  gap: 7px !important;",
      "  color: #21ea7c !important;",
      "}",
      ".summary-line.sunset-pkg-row .sunset-pkg-label svg {",
      "  stroke: #21ea7c !important;",
      "  flex-shrink: 0 !important;",
      "}",
      ".cw-sunset-pkg-row {",
      "  display: flex !important;",
      "  justify-content: space-between !important;",
      "  align-items: center !important;",
      "  margin: 12px 0 8px 0 !important;",
      "  padding: 10px 14px !important;",
      "  background: rgba(33, 234, 124, 0.08) !important;",
      "  border: 1px solid rgba(33, 234, 124, 0.25) !important;",
      "  border-radius: 12px !important;",
      "  font-size: 13px !important;",
      "  font-weight: 600 !important;",
      "  color: #21ea7c !important;",
      "  box-sizing: border-box !important;",
      "}",
      ".cw-sunset-pkg-row .cw-pkg-left {",
      "  display: inline-flex !important;",
      "  align-items: center !important;",
      "  gap: 8px !important;",
      "}",
      ".cw-sunset-pkg-row .cw-pkg-left svg {",
      "  stroke: #21ea7c !important;",
      "  flex-shrink: 0 !important;",
      "}",
      ".cw-sunset-pkg-row .cw-pkg-val {",
      "  font-weight: 700 !important;",
      "  color: #21ea7c !important;",
      "}",
      ".sunset-modal-footnote {",
      "  display: flex !important;",
      "  align-items: center !important;",
      "  gap: 12px !important;",
      "  min-height: 60px !important;",
      "  margin: 4px 0 20px 0 !important;",
      "  padding: 10px 16px !important;",
      "  background: rgba(255, 255, 255, 0.04) !important;",
      "  border-radius: 20px !important;",
      "  box-sizing: border-box !important;",
      "  width: 100% !important;",
      "  text-align: left !important;",
      "}",
      ".sunset-modal-footnote svg {",
      "  width: 22px !important;",
      "  height: 22px !important;",
      "  stroke: #21ea7c !important;",
      "  flex-shrink: 0 !important;",
      "}",
      ".sunset-fn-text {",
      "  flex: 1 !important;",
      "  display: grid !important;",
      "  grid-template-columns: 1fr auto !important;",
      "  column-gap: 12px !important;",
      "  align-items: center !important;",
      "}",
      ".sunset-fn-title {",
      "  font-size: 15px !important;",
      "  font-weight: 500 !important;",
      "  color: #ffffff !important;",
      "  line-height: 1.3 !important;",
      "}",
      ".sunset-fn-sub {",
      "  grid-column: 1 !important;",
      "  font-size: 13px !important;",
      "  color: rgba(255, 255, 255, 0.45) !important;",
      "  line-height: 1.3 !important;",
      "}",
      ".sunset-fn-price {",
      "  grid-column: 2 !important;",
      "  grid-row: 1 / span 2 !important;",
      "  font-size: 15px !important;",
      "  font-weight: 600 !important;",
      "  color: rgba(255, 255, 255, 0.5) !important;",
      "}",
      "body.light-theme .sunset-modal-footnote, [data-theme='light'] .sunset-modal-footnote {",
      "  background: rgba(0, 0, 0, 0.04) !important;",
      "}",
      "body.light-theme .sunset-fn-title, [data-theme='light'] .sunset-fn-title {",
      "  color: #111111 !important;",
      "}",
      "body.light-theme .sunset-fn-sub, [data-theme='light'] .sunset-fn-sub {",
      "  color: rgba(0, 0, 0, 0.5) !important;",
      "}"
    ].join("\n");
    (document.head || document.documentElement).appendChild(style);
  }

  // ── Modal Footnote Insertion (Option 1) ───────────────────────────
  function updateDishModal() {
    var oldBadges = document.querySelectorAll(".sunset-pkg-badge");
    if (oldBadges.length > 0) {
      oldBadges.forEach(function (el) { el.remove(); });
    }

    if (!MestiSunset.isCurrentPageSunset()) {
      var oldFootnotes = document.querySelectorAll(".sunset-modal-footnote");
      if (oldFootnotes.length > 0) {
        oldFootnotes.forEach(function (el) { el.remove(); });
      }
      return;
    }

    // Clean up any legacy footnotes in modal footer
    var footerFns = document.querySelectorAll(".modal-footer-v3 .sunset-modal-footnote");
    if (footerFns.length > 0) {
      footerFns.forEach(function (el) { el.remove(); });
    }

    // Desktop modal check
    var pcModalBody = document.querySelector(".pc-dish-modal-body");
    var titleEl = pcModalBody ? pcModalBody.querySelector(".pc-dish-modal-header h2") : null;

    // Mobile / Standard modal check (prod design)
    var mobileBody = document.querySelector(".dish-modal-content .modal-body, .mobile-restaurant-page .modal-body");
    if (!pcModalBody) {
      titleEl = document.querySelector(".footer-dish-name, .dish-modal-title, .modal-v3 h2");
    }

    if ((!pcModalBody && !mobileBody) || !titleEl) {
      return;
    }

    var dishName = titleEl.textContent.trim();
    var itemType = MestiSunset.getItemType(dishName);

    var container = mobileBody || pcModalBody;
    if (itemType === "free") {
      var fn = container.querySelector(".sunset-modal-footnote");
      if (fn) fn.remove();
      return;
    }

    var lang = MestiSunset.getLang();
    var copy = {
      combinable: {
        ru: ["Упаковка", "Повторные порции без доплаты"],
        en: ["Packaging", "No charge for extra portions"],
        ka: ["შეფუთვა", "დამატებითი პორციები უფასოდ"]
      },
      individual: {
        ru: ["Отдельный контейнер", "На каждую порцию"],
        en: ["Separate container", "For each portion"],
        ka: ["ცალკე კონტეინერი", "თითოეულ პორციაზე"]
      }
    };
    var c = copy[itemType === "combinable" ? "combinable" : "individual"][lang] || copy.individual.ru;
    // Plain spans only: the observer compares innerHTML, so the markup must serialise back unchanged
    var textHtml = '<span class="sunset-fn-title">' + c[0] + '</span><span class="sunset-fn-price">+2 ₾</span><span class="sunset-fn-sub">' + c[1] + '</span>';

    // Determine insertion target (above KBJU section or before meta/add button)
    var targetBefore = null;
    if (mobileBody) {
      targetBefore = mobileBody.querySelector(".kbju-section-v2, .section-label-v3, .kbju-grid-modal");
    } else if (pcModalBody) {
      targetBefore = pcModalBody.querySelector(".pc-dish-modal-meta, .pc-dish-modal-add");
    }

    var existingFn = container.querySelector(".sunset-modal-footnote");
    if (existingFn) {
      var span = existingFn.querySelector(".sunset-fn-text");
      if (span && span.innerHTML !== textHtml) {
        span.innerHTML = textHtml;
      }
      return;
    }

    var footnote = document.createElement("div");
    footnote.className = "sunset-modal-footnote";
    footnote.innerHTML = SVG_BOX + "<span class=\"sunset-fn-text\">" + textHtml + "</span>";

    if (targetBefore && targetBefore.parentElement === container) {
      container.insertBefore(footnote, targetBefore);
    } else {
      container.appendChild(footnote);
    }
  }

  // ── Cart / Checkout Summary Line ──────────────────────────────────
  function getActiveSunsetCartItems() {
    var items = [];
    var itemRows = document.querySelectorAll(".cart-item, .checkout-item, .order-item, .cw-item, .cart-row");
    if (itemRows.length > 0) {
      itemRows.forEach(function (row) {
        var nameEl = row.querySelector(".item-name, .dish-title, .name, strong, h4, .cw-item-name");
        var qtyEl = row.querySelector(".qty-control span, .item-qty, .qty, [class*='quantity'], .cw-count-val");
        var name = nameEl ? nameEl.textContent.trim() : "";
        var qty = qtyEl ? parseInt(qtyEl.textContent) || 1 : 1;
        if (name) items.push({ name: name, quantity: qty });
      });
    }
    return items;
  }

  function updateSummaryRows() {
    var cartItems = getActiveSunsetCartItems();
    // The app publishes which restaurant the cart belongs to. Without it we only
    // trust the page itself: "any cart with a non-free dish" matched every restaurant.
    var cartRest = window.__mestiCartRestaurant;
    var isSunset = cartRest
      ? MestiSunset.isSunsetRestaurant(cartRest.id, cartRest.name)
      : MestiSunset.isCurrentPageSunset();

    if (!isSunset) {
      document.querySelectorAll(".sunset-pkg-row, .cw-sunset-pkg-row").forEach(function (el) { el.remove(); });
      return;
    }

    var fee = MestiSunset.calculatePackagingFee(cartItems);
    if (fee <= 0 && cartItems.length > 0) return;
    if (fee <= 0 && cartItems.length === 0) fee = 2.0;

    // 1. Desktop Cart Widget (.cart-widget)
    var cartWidget = document.querySelector(".cart-widget");
    if (cartWidget) {
      var existingCwRow = cartWidget.querySelector(".cw-sunset-pkg-row");
      if (existingCwRow) {
        var valSpan = existingCwRow.querySelector(".cw-pkg-val");
        var cwText = "+" + fee.toFixed(2) + " ₾";
        if (valSpan && valSpan.textContent !== cwText) valSpan.textContent = cwText;
      } else {
        var cwRow = document.createElement("div");
        cwRow.className = "cw-sunset-pkg-row";
        cwRow.innerHTML = '<div class="cw-pkg-left">' + SVG_BOX + '<span>' + MestiSunset.getPackagingRowLabel() + '</span></div><div class="cw-pkg-val">+' + fee.toFixed(2) + " ₾</div>";
        var bottomInfo = cartWidget.querySelector(".cw-bottom-info");
        if (bottomInfo) {
          cartWidget.insertBefore(cwRow, bottomInfo);
        } else {
          var btn = cartWidget.querySelector(".cw-checkout-btn");
          if (btn) cartWidget.insertBefore(cwRow, btn);
        }
      }
    }

    // 2. Checkout / Cart Summary Lists (.summary-details)
    var summaryDetailsList = document.querySelectorAll(".summary-details, .checkout-summary, .cart-summary");
    summaryDetailsList.forEach(function (container) {
      var existingRow = container.querySelector(".sunset-pkg-row");
      if (existingRow) {
        var valSpan = existingRow.querySelector(".sunset-pkg-val");
        var rowText = "+" + fee.toFixed(2) + " ₾";
        if (valSpan && valSpan.textContent !== rowText) valSpan.textContent = rowText;
      } else {
        var row = document.createElement("div");
        row.className = "summary-line sunset-pkg-row";
        row.innerHTML = '<span class="sunset-pkg-label">' + SVG_BOX + '<span>' + MestiSunset.getPackagingRowLabel() + '</span></span><span class="sunset-pkg-val">+' + fee.toFixed(2) + " ₾</span>";
        var serviceRow = container.querySelector(".service, .summary-line:last-child");
        if (serviceRow && serviceRow.nextSibling) {
          container.insertBefore(row, serviceRow.nextSibling);
        } else {
          container.appendChild(row);
        }
      }
    });
  }

  // Intercept fetch for /orders to ensure packaging fee is added to order body
  var originalFetch = window.fetch;
  window.fetch = function (url, options) {
    try {
      if (url && typeof url === "string" && (url.indexOf("/orders") !== -1 || url.indexOf("/api/orders") !== -1) && options && options.method === "POST" && options.body) {
        var body = JSON.parse(options.body);
        if (MestiSunset.isSunsetRestaurant(body.restaurant_id, body.restaurant_name)) {
          var pkgFee = MestiSunset.calculatePackagingFee(body.items);
          if (pkgFee > 0) {
            var itemsSum = 0;
            if (body.items) {
              body.items.forEach(function (it) { itemsSum += (Number(it.price) || 0) * (Number(it.quantity) || 1); });
            }
            var deliveryFee = Number(body.delivery_fee || 0);
            var serviceFee = Number(body.service_fee || 0);
            var tips = Number(body.tips || 0);
            var discount = Number(body.discount || 0);
            var baseExpected = itemsSum - discount + deliveryFee + serviceFee + tips;
            if (body.total <= baseExpected + 0.05) {
              body.total = baseExpected + pkgFee;
              options.body = JSON.stringify(body);
              console.log("[MestiSunset] Packaging fee added +" + pkgFee + " GEL. Total:", body.total);
            }
          }
        }
      }
    } catch (e) {
      console.warn("[MestiSunset] Interceptor:", e);
    }
    return originalFetch.apply(this, arguments);
  };

  MestiSunset.updateDishModal = updateDishModal;
  MestiSunset.updateSummaryRows = updateSummaryRows;
  MestiSunset._active = true;
  window.__MestiSunset = MestiSunset;

  // Safe Observer Initialization
  function initObserver() {
    try {
      injectStyles();
    } catch (e) {
      console.error("[MestiSunset] injectStyles error:", e);
    }

    try {
      updateDishModal();
      updateSummaryRows();
    } catch (e) {
      console.error("[MestiSunset] initial update error:", e);
    }

    if (document.body) {
      try {
        var observer = new MutationObserver(function () {
          try {
            updateDishModal();
            updateSummaryRows();
          } catch (e) {
            console.error("[MestiSunset] observer tick error:", e);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      } catch (e) {
        console.error("[MestiSunset] observer.observe error:", e);
      }
    }

    setInterval(function () {
      try {
        updateDishModal();
        updateSummaryRows();
      } catch (e) {
        console.error("[MestiSunset] interval tick error:", e);
      }
    }, 300);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initObserver);
  } else {
    initObserver();
  }
})();
