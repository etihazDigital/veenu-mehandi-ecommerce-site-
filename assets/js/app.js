/* Shared code: cart, shipping, header/footer, product cards, placeholders */
(function () {
  "use strict";
  var S = window.STORE, P = window.PRODUCTS, C = window.CATEGORIES;

  /* ---------- helpers ---------- */
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function money(n) { return "₹" + Number(n).toLocaleString("en-IN"); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function product(id) { for (var i = 0; i < P.length; i++) if (P[i].id === id) return P[i]; return null; }
  function category(id) { for (var i = 0; i < C.length; i++) if (C[i].id === id) return C[i]; return null; }
  function variant(p, vid) { for (var i = 0; i < p.variants.length; i++) if (p.variants[i].id === vid) return p.variants[i]; return null; }
  function priced(p) { return p.variants.filter(function (v) { return v.price != null; }); }
  function priceText(p) {
    var v = priced(p);
    if (!v.length) return "Price on request";
    var min = Math.min.apply(null, v.map(function (x) { return x.price; }));
    var max = Math.max.apply(null, v.map(function (x) { return x.price; }));
    return min === max ? money(min) : "From " + money(min);
  }
  function waLink(text) {
    return "https://wa.me/" + S.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");
  }

  /* ---------- decorative mandala (used in logo, hero, placeholders) ---------- */
  function mandalaInner() {
    var s = '<circle cx="50" cy="50" r="3.5" fill="currentColor"/><circle cx="50" cy="50" r="46" stroke-dasharray="1 3.2"/><circle cx="50" cy="50" r="36"/>', i;
    for (i = 0; i < 12; i++) s += '<path d="M50 11c6 7 6 16 0 24-6-8-6-17 0-24z" transform="rotate(' + (i * 30) + ' 50 50)"/>';
    for (i = 0; i < 8; i++) s += '<path d="M50 29c4 4 4 9 0 13-4-4-4-9 0-13z" transform="rotate(' + (i * 45) + ' 50 50)"/>';
    for (i = 0; i < 12; i++) s += '<circle cx="50" cy="4.5" r="1.3" fill="currentColor" stroke="none" transform="rotate(' + (i * 30 + 15) + ' 50 50)"/>';
    return s;
  }
  function mandalaSVG(cls) {
    return '<svg class="' + (cls || "") + '" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">' + mandalaInner() + "</svg>";
  }

  /* ---------- placeholder image for products without photos ---------- */
  var TINT = { powder: "#6f6f2f", oils: "#c87587", sheets: "#8a8a45", tools: "#a4526a", practice: "#c87587" };
  function placeholder(pid) {
    var p = product(pid), t = (p && TINT[p.category]) || "#c87587";
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fdfcf3"/><stop offset="1" stop-color="#f1eecb"/></linearGradient></defs>' +
      '<rect width="600" height="600" fill="url(#g)"/>' +
      '<g transform="translate(110 90) scale(3.8)" color="' + t + '" fill="none" stroke="' + t + '" stroke-width="1" opacity=".55">' + mandalaInner() + "</g>" +
      '<text x="300" y="548" text-anchor="middle" font-family="Georgia,serif" font-size="22" letter-spacing="3" fill="' + t + '" opacity=".9">PHOTO COMING SOON</text></svg>';
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }
  function photoUrl(pid, n) { return "assets/img/products/" + pid + "-" + n + ".jpg"; }
  function imgTag(p, n, alt) {
    return '<img src="' + photoUrl(p.id, n || 1) + '" alt="' + esc(alt || p.name) + '" loading="lazy" ' +
      "onerror=\"this.onerror=null;this.src=VM.placeholder('" + p.id + "')\">";
  }

  /* ---------- cart (localStorage, with in-memory fallback) ---------- */
  var KEY = "vm_cart_v1", mem = [];
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return mem; }
  }
  function save(items) {
    mem = items;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* private mode */ }
    updateBadge();
  }
  function sameLine(a, pid, vid, extra) { return a.pid === pid && a.vid === vid && (a.extra || "") === (extra || ""); }
  var cart = {
    add: function (pid, vid, extra, qty) {
      var items = load(), found = false;
      qty = Math.max(1, Math.min(99, parseInt(qty, 10) || 1));
      items.forEach(function (it) {
        if (sameLine(it, pid, vid, extra)) { it.qty = Math.min(99, it.qty + qty); found = true; }
      });
      if (!found) items.push({ pid: pid, vid: vid, extra: extra || "", qty: qty });
      save(items);
    },
    setQty: function (pid, vid, extra, qty) {
      var items = load();
      items.forEach(function (it) { if (sameLine(it, pid, vid, extra)) it.qty = Math.max(1, Math.min(99, qty)); });
      save(items);
    },
    remove: function (pid, vid, extra) {
      save(load().filter(function (it) { return !sameLine(it, pid, vid, extra); }));
    },
    clear: function () { save([]); },
    count: function () { return load().reduce(function (n, it) { return n + it.qty; }, 0); },
    /* lines with product data attached; silently drops anything no longer in the catalogue */
    lines: function () {
      var out = [];
      load().forEach(function (it) {
        var p = product(it.pid), v = p && variant(p, it.vid);
        if (!p || !v || v.price == null) return;
        out.push({ p: p, v: v, extra: it.extra || "", qty: it.qty, unit: v.price, total: v.price * it.qty, grams: v.weight * it.qty });
      });
      return out;
    }
  };

  /* shipping: flat Rs/kg, charged per started kg */
  function totals(lines) {
    var subtotal = 0, grams = 0;
    lines.forEach(function (l) { subtotal += l.total; grams += l.grams; });
    var kg = lines.length ? Math.max(1, Math.ceil(grams / 1000)) : 0;
    var shipping = kg * S.shippingPerKg;
    return { subtotal: subtotal, grams: grams, kg: kg, shipping: shipping, total: subtotal + shipping };
  }
  function lineName(l) {
    return l.p.name + " (" + l.v.label + (l.extra ? ", " + l.p.extra.label + " " + l.extra : "") + ")";
  }

  /* ---------- header / footer ---------- */
  var ICON = {
    search: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    bag: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    wa: '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M12.04 2a9.9 9.9 0 00-8.46 15.04L2 22l5.1-1.34A9.9 9.9 0 1012.04 2zm0 1.8a8.1 8.1 0 11-4.2 15.03l-.3-.18-3.02.8.8-2.94-.2-.31A8.1 8.1 0 0112.04 3.8zm-3 3.9c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.08 3.3 5.1 4.5 2.5 1 3.02.8 3.56.75.55-.05 1.76-.72 2-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35s-1.76-.87-2.03-.97c-.27-.1-.47-.15-.67.15s-.77.97-.94 1.17c-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.52-.08-.15-.67-1.62-.92-2.2-.24-.58-.5-.5-.67-.5z"/></svg>'
  };
  function current() {
    var f = location.pathname.split("/").pop() || "index.html";
    return f === "product.html" || f === "cart.html" || f === "checkout.html" ? "shop.html" : f;
  }
  function nav(href, label) {
    return '<a href="' + href + '"' + (current() === href ? ' class="active" aria-current="page"' : "") + ">" + label + "</a>";
  }
  function renderHeader() {
    var el = $("#site-header"); if (!el) return;
    var logo = '<img class="brand-logo" src="assets/img/logo.png" alt="" onerror="this.remove()">';
    el.innerHTML =
      '<header class="header"><div class="wrap header-in">' +
      '<button class="icon-btn burger" aria-label="Open menu" aria-expanded="false">' + ICON.menu + "</button>" +
      '<a class="brand" href="index.html" aria-label="' + esc(S.name) + ' home">' + logo +
        '<span class="brand-mark">' + mandalaSVG() + "</span>" +
        '<span class="brand-text"><span class="bn">Veenu <em>Mehandi</em></span><small>Henna &amp; Mehandi Supplies</small></span></a>' +
      '<nav class="nav" id="main-nav" aria-label="Main">' + nav("index.html", "Home") + nav("shop.html", "Shop") + nav("about.html", "About &amp; Contact") + "</nav>" +
      '<div class="hdr-actions">' +
        '<button class="icon-btn" id="search-toggle" aria-label="Search products">' + ICON.search + "</button>" +
        '<a class="icon-btn cart-link" href="cart.html" aria-label="Cart">' + ICON.bag + '<span class="cart-count" id="cart-count" hidden>0</span></a>' +
      "</div></div>" +
      '<form class="searchbar" id="searchbar" action="shop.html" role="search" hidden><div class="wrap">' +
        '<input type="search" name="q" placeholder="Search henna powder, oils, sheets..." aria-label="Search products"><button class="btn btn-sm" type="submit">Search</button></div></form>' +
      "</header>";

    var burger = $(".burger", el), navEl = $("#main-nav", el);
    burger.addEventListener("click", function () {
      var open = navEl.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    var sb = $("#searchbar", el);
    $("#search-toggle", el).addEventListener("click", function () {
      sb.hidden = !sb.hidden;
      if (!sb.hidden) $("input", sb).focus();
    });
    updateBadge();
  }
  function updateBadge() {
    var b = $("#cart-count"); if (!b) return;
    var n = cart.count();
    b.textContent = n > 99 ? "99+" : n;
    b.hidden = n === 0;
  }
  function renderFooter() {
    var el = $("#site-footer"); if (!el) return;
    var cats = C.map(function (c) { return '<li><a href="shop.html?cat=' + c.id + '">' + esc(c.name) + "</a></li>"; }).join("");
    var insta = S.instagram ? '<li><a href="' + esc(S.instagram) + '" target="_blank" rel="noopener">Instagram</a></li>' : "";
    el.innerHTML =
      '<footer class="footer"><div class="wrap footer-grid">' +
      '<div><img class="footer-logo" src="assets/img/logo-light.png" alt="Veenu Mehandi"><p>' + esc(S.tagline) + ". Based in " + esc(S.city) + ".</p></div>" +
      "<div><h4>Shop</h4><ul>" + cats + "</ul></div>" +
      '<div><h4>Help</h4><ul><li><a href="shipping-returns.html">Shipping &amp; Returns</a></li><li><a href="privacy-terms.html">Privacy &amp; Terms</a></li><li><a href="about.html">About &amp; Contact</a></li><li><a href="cart.html">Your cart</a></li></ul></div>' +
      '<div><h4>Contact</h4><ul><li class="muted-li">For any emergency:</li><li><a href="' + waLink("Hello! I need urgent help with my order.") + '" target="_blank" rel="noopener">WhatsApp ' + esc(S.phoneDisplay) + "</a></li>" +
        '<li><a href="tel:+' + S.phone + '">Call ' + esc(S.phoneDisplay) + "</a></li>" +
        '<li><a href="mailto:' + esc(S.email) + '">' + esc(S.email) + "</a></li>" + insta + "</ul></div>" +
      "</div>" +
      '<div class="wrap footer-bottom"><span>© ' + new Date().getFullYear() + " " + esc(S.name) + ". All rights reserved.</span>" +
      '<span>Website by <a href="https://github.com/etihazDigital" target="_blank" rel="noopener">Web Foundry</a></span></div></footer>' +
      '<div class="toast" id="toast" role="status" aria-live="polite"></div>';
  }

  var toastTimer;
  function toast(html) {
    var t = $("#toast"); if (!t) return;
    t.innerHTML = html; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 3500);
  }

  /* ---------- product card ---------- */
  function productCard(p) {
    var cat = category(p.category);
    var n = p.variants.length;
    return '<a class="card" href="product.html?id=' + p.id + '">' +
      '<div class="card-img">' + imgTag(p, 1) + "</div>" +
      '<div class="card-body"><span class="card-cat">' + esc(cat ? cat.name : "") + "</span>" +
      '<h3 class="card-name">' + esc(p.name) + "</h3>" +
      '<div class="card-foot"><span class="price">' + priceText(p) + "</span>" +
      '<span class="card-opts">' + (n > 1 ? n + " options" : "1 option") + "</span></div></div></a>";
  }

  /* inject SVG sprite once so pages can reuse the mandala motif */
  window.VM = {
    $: $, $$: $$, money: money, esc: esc, product: product, category: category, variant: variant,
    priceText: priceText, priced: priced, waLink: waLink, mandalaSVG: mandalaSVG,
    placeholder: placeholder, photoUrl: photoUrl, imgTag: imgTag, cart: cart, totals: totals,
    lineName: lineName, toast: toast, productCard: productCard, config: S
  };

  document.addEventListener("DOMContentLoaded", function () {
    renderHeader(); renderFooter();
    $$("[data-mandala]").forEach(function (el) { el.innerHTML = mandalaSVG(); });
    $$("[data-wa]").forEach(function (a) { a.href = waLink(a.getAttribute("data-wa")); a.target = "_blank"; a.rel = "noopener"; });
    $$("[data-phone]").forEach(function (a) { a.textContent = S.phoneDisplay; a.href = "tel:+" + S.phone; });
    $$("[data-email]").forEach(function (a) { a.textContent = S.email; a.href = "mailto:" + S.email; });
    $$("[data-ship]").forEach(function (el) { el.textContent = money(S.shippingPerKg); });
    $$("[data-hours]").forEach(function (el) { el.textContent = S.dispatchHours; });
    $$("[data-return-hours]").forEach(function (el) { el.textContent = S.returnWindowHours; });
    window.addEventListener("storage", updateBadge);
  });
})();
