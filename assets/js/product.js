(function () {
  var VM = window.VM, S = window.STORE;
  var root = document.getElementById("pd-root");
  var id = new URLSearchParams(location.search).get("id");
  var p = VM.product(id);

  if (!p) {
    root.innerHTML = '<div class="empty"><h3>Product not found</h3><p>This product may have been removed.</p><a class="btn" href="shop.html">Back to shop</a></div>';
    return;
  }

  var cat = VM.category(p.category);
  var firstOk = p.variants.filter(function (v) { return v.price != null; })[0];
  var state = { vid: firstOk ? firstOk.id : null, extra: p.extra ? p.extra.values[0] : "", qty: 1 };

  document.title = p.name + " | Veenu Mehandi";
  var md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute("content", p.name + ": " + p.desc + " Delivery all over India from Delhi.");

  /* structured data for search engines */
  var prices = VM.priced(p).map(function (v) { return v.price; });
  if (prices.length) {
    var ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.desc,
      image: new URL(VM.photoUrl(p.id, 1), location.href).href,
      brand: { "@type": "Brand", name: S.name },
      offers: { "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: Math.min.apply(null, prices),
        highPrice: Math.max.apply(null, prices), offerCount: prices.length, availability: "https://schema.org/InStock" }
    });
    document.head.appendChild(ld);
  }


  /* "About this product": description + options + optional Instagram video + optional FAQ.
     In products.js a product can have:  video: "https://www.instagram.com/reel/XXXX/"
                                         faq: [{ q: "Question?", a: "Answer." }]            */
  function instagramEmbed(url) {
    var m = /instagram\.com\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/.exec(url || "");
    return m ? "https://www.instagram.com/" + (m[1] === "reels" ? "reel" : m[1]) + "/" + m[2] + "/embed" : "";
  }
  function aboutHtml() {
    var embed = instagramEmbed(p.video);
    var opts = p.variants.map(function (v) {
      return "<tr><td>" + VM.esc(v.label) + "</td><td>" + (v.price != null ? VM.money(v.price) : "Price soon") + "</td></tr>";
    }).join("");
    var faq = (p.faq && p.faq.length) ? '<h3>Questions &amp; answers</h3><div class="faq">' + p.faq.map(function (f) {
      return "<details><summary>" + VM.esc(f.q) + "</summary><p>" + VM.esc(f.a) + "</p></details>";
    }).join("") + "</div>" : "";
    return '<section class="about-prod"><h2>About this product</h2><div class="about-grid' + (embed ? " has-video" : "") + '"><div>' +
      "<p>" + VM.esc(p.desc) + "</p>" +
      "<h3>" + VM.esc(p.variantLabel) + ' &amp; price</h3><table class="opt-table"><tbody>' + opts + "</tbody></table>" + faq + "</div>" +
      (embed ? '<div class="video-box"><iframe src="' + embed + '" title="' + VM.esc(p.name) + ' video" loading="lazy" allowfullscreen></iframe></div>' : "") +
      "</div></section>";
  }

  root.innerHTML =
    '<nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> / <a href="shop.html">Shop</a> / ' +
      '<a href="shop.html?cat=' + p.category + '">' + VM.esc(cat.name) + "</a> / " + VM.esc(p.name) + "</nav>" +
    '<div class="pd"><div><div class="gallery-main"><img id="main-img" src="" alt="' + VM.esc(p.name) + '"></div><div class="thumbs" id="thumbs"></div></div>' +
    '<div><span class="pd-cat">' + VM.esc(cat.name) + "</span><h1>" + VM.esc(p.name) + "</h1>" +
      '<div class="pd-price" id="price"></div>' +
      "<p>" + VM.esc(p.desc) + "</p>" +
      '<span class="opt-label">' + VM.esc(p.variantLabel) + '</span><div class="pills" id="variants" role="radiogroup"></div>' +
      (p.extra ? '<span class="opt-label">' + VM.esc(p.extra.label) + '</span><div class="pills" id="extras" role="radiogroup"></div>' : "") +
      '<div class="buy-row"><div class="qty"><button type="button" id="minus" aria-label="Decrease quantity">−</button>' +
        '<input id="qty" type="number" min="1" max="99" value="1" aria-label="Quantity"><button type="button" id="plus" aria-label="Increase quantity">+</button></div>' +
        '<button class="btn" id="add" type="button">Add to cart</button>' +
        '<button class="btn btn-ghost" id="buy" type="button">Buy now</button></div>' +
      '<div id="unavail"></div>' +
    "</div></div>" +
    aboutHtml() +
    '<section class="section-tight"><div class="section-head"><h2>You may also like</h2><a class="link-arrow" href="shop.html">All products</a></div><div class="grid" id="related"></div></section>';

  var $ = function (s) { return document.getElementById(s); };

  function currentVariant() { return VM.variant(p, state.vid); }

  function renderVariants() {
    $("variants").innerHTML = p.variants.map(function (v) {
      var off = v.price == null;
      return '<button type="button" role="radio" class="pill' + (v.id === state.vid ? " on" : "") + '" data-v="' + v.id + '"' +
        (off ? " disabled" : "") + ' aria-checked="' + (v.id === state.vid) + '">' + VM.esc(v.label) +
        (off ? "<small>price soon</small>" : "<small>" + VM.money(v.price) + "</small>") + "</button>";
    }).join("");
    if (p.extra) {
      $("extras").innerHTML = p.extra.values.map(function (x) {
        return '<button type="button" role="radio" class="pill' + (x === state.extra ? " on" : "") + '" data-x="' + x + '" aria-checked="' + (x === state.extra) + '">' + VM.esc(x) + "</button>";
      }).join("");
    }
  }
  function renderPrice() {
    var v = currentVariant();
    $("price").textContent = v && v.price != null ? VM.money(v.price) : "Price on request";
    var ok = v && v.price != null;
    $("add").disabled = !ok; $("buy").disabled = !ok;
    $("unavail").innerHTML = ok ? "" : '<div class="notice">This option is not available to order online yet.</div>';
  }
  function refresh() { renderVariants(); renderPrice(); }

  $("variants").addEventListener("click", function (e) {
    var b = e.target.closest("[data-v]"); if (!b || b.disabled) return;
    state.vid = b.getAttribute("data-v"); refresh();
  });
  if (p.extra) $("extras").addEventListener("click", function (e) {
    var b = e.target.closest("[data-x]"); if (!b) return;
    state.extra = b.getAttribute("data-x"); refresh();
  });

  function readQty() { var n = parseInt($("qty").value, 10); n = isNaN(n) ? 1 : Math.max(1, Math.min(99, n)); $("qty").value = n; state.qty = n; return n; }
  $("minus").addEventListener("click", function () { $("qty").value = readQty() - 1; readQty(); });
  $("plus").addEventListener("click", function () { $("qty").value = readQty() + 1; readQty(); });
  $("qty").addEventListener("change", readQty);

  function addToCart() {
    var v = currentVariant(); if (!v || v.price == null) return false;
    VM.cart.add(p.id, v.id, state.extra, readQty());
    return true;
  }
  $("add").addEventListener("click", function () {
    if (addToCart()) VM.toast("Added to cart <a href=\"cart.html\">View cart</a>");
  });
  $("buy").addEventListener("click", function () { if (addToCart()) location.href = "checkout.html"; });

  /* gallery: show only photos that really exist, else the placeholder */
  var main = $("main-img"), thumbs = $("thumbs"), found = [];
  function show(src, i) {
    main.src = src;
    Array.prototype.forEach.call(thumbs.children, function (t, k) { t.classList.toggle("on", k === i); });
  }
  main.src = VM.placeholder(p.id);
  var pending = 5;
  [1, 2, 3, 4, 5].forEach(function (n) {
    var im = new Image();
    im.onload = function () { found[n] = VM.photoUrl(p.id, n); done(); };
    im.onerror = done;
    im.src = VM.photoUrl(p.id, n);
  });
  function done() {
    if (--pending) return;
    var list = found.filter(Boolean);
    if (!list.length) return;
    thumbs.innerHTML = list.length > 1 ? list.map(function (src, i) {
      return '<button class="thumb" type="button" aria-label="Photo ' + (i + 1) + '"><img src="' + src + '" alt=""></button>';
    }).join("") : "";
    Array.prototype.forEach.call(thumbs.children, function (t, i) { t.addEventListener("click", function () { show(list[i], i); }); });
    show(list[0], 0);
  }

  var rel = window.PRODUCTS.filter(function (x) { return x.id !== p.id && x.category === p.category; });
  if (rel.length < 4) rel = rel.concat(window.PRODUCTS.filter(function (x) { return x.id !== p.id && x.category !== p.category; }));
  $("related").innerHTML = rel.slice(0, 4).map(VM.productCard).join("");

  refresh();
})();
