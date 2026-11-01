/* Checkout: 1) delivery details  2) pay by UPI + enter transaction ID  3) order received.
   NOTE: without a backend the site cannot verify the payment itself. The order (with the customer's
   UPI transaction ID) is emailed to the store, and a confirmation is emailed to the customer. */
(function () {
  var VM = window.VM, S = window.STORE;
  var root = document.getElementById("checkout-root");
  var STATES = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand",
    "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
    "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

  /* ---------- storage ---------- */
  function get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } }
  function put(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }

  /* ---------- order helpers ---------- */
  function orderId() {
    var d = new Date(), c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", r = "";
    for (var i = 0; i < 4; i++) r += c.charAt(Math.floor(Math.random() * c.length));
    var yy = String(d.getFullYear()).slice(2), mm = ("0" + (d.getMonth() + 1)).slice(-2), dd = ("0" + d.getDate()).slice(-2);
    return "VM-" + yy + mm + dd + "-" + r;
  }
  function signature(lines, total) {
    return lines.map(function (l) { return l.p.id + ":" + l.v.id + ":" + l.extra + ":" + l.qty; }).join("|") + "=" + total;
  }
  function itemsText(o) {
    return o.items.map(function (i) { return "- " + i.name + " x " + i.qty + " = Rs " + i.total; }).join("\n");
  }
  function addressText(o) { return o.address + ", " + o.city + ", " + o.state + " - " + o.pin; }

  /* sends the order to the store by email and a confirmation to the customer. Resolves true/false. */
  function sendToSheet(o) {
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 20000);
    return fetch(S.orderEndpoint, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ id: o.id, name: o.name, phone: o.phone, email: o.email, items: itemsText(o), subtotal: o.subtotal,
        shipping: o.shipping, total: o.total, utr: o.utr, address: addressText(o), notes: o.notes || "" }),
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) { return r.json(); }).then(function (j) { clearTimeout(timer); return !!(j && j.ok); })
      .catch(function () { clearTimeout(timer); return false; });
  }
  function sendOrder(o) {
    if (S.orderEndpoint && window.fetch) return sendToSheet(o);
    if (!S.orderEmailEndpoint || !window.fetch) return Promise.resolve(false);
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 12000);
    var body = {
      _subject: "New order " + o.id + " - Rs " + o.total + " (UTR " + o.utr + ")", _template: "table", _captcha: "false",
      "Order ID": o.id, Name: o.name, Phone: o.phone, email: o.email, Items: itemsText(o),
      Subtotal: "Rs " + o.subtotal, Shipping: "Rs " + o.shipping + " (" + o.kg + " kg)", Total: "Rs " + o.total,
      "UPI transaction ID (UTR)": o.utr + "  <- check this in your UPI app", Address: addressText(o), Notes: o.notes || "-",
      _autoresponse: "Thank you for your order with " + S.name + "!\n\nOrder ID: " + o.id + "\n\n" + itemsText(o) +
        "\n\nSubtotal: Rs " + o.subtotal + "\nShipping: Rs " + o.shipping + "\nTotal: Rs " + o.total +
        "\n\nDelivery address: " + addressText(o) + "\nUPI transaction ID: " + o.utr +
        "\n\nWe have received your order. Your tracking details will be sent to this email after dispatch."
    };
    return fetch(S.orderEmailEndpoint, {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined
    }).then(function (r) { clearTimeout(timer); return r.ok; }).catch(function () { clearTimeout(timer); return false; });
  }

  /* ---------- views ---------- */
  function emptyView() {
    root.innerHTML = '<div class="empty"><h3>Your cart is empty</h3><p>Add products to your cart before checking out.</p><a class="btn" href="shop.html">Start shopping</a></div>';
  }

  function miniLines(items) {
    return items.map(function (i) {
      return '<div class="mini-line"><span>' + VM.esc(i.name) + " × " + i.qty + "</span><span>" + VM.money(i.total) + "</span></div>";
    }).join("");
  }
  function sumRows(o) {
    return '<div class="sum-row" style="margin-top:8px"><span>Subtotal</span><span>' + VM.money(o.subtotal) + "</span></div>" +
      '<div class="sum-row"><span>Shipping<small>' + o.kg + " kg × " + VM.money(S.shippingPerKg) + "</small></span><span>" + VM.money(o.shipping) + "</span></div>" +
      '<div class="sum-row sum-total"><span>Total</span><span>' + VM.money(o.total) + "</span></div>";
  }

  /* step 1: delivery details */
  function formView(lines) {
    var t = VM.totals(lines);
    var items = lines.map(function (l) { return { name: VM.lineName(l), qty: l.qty, total: l.total }; });
    var opts = '<option value="">Select state</option>' + STATES.map(function (s) { return "<option>" + s + "</option>"; }).join("");

    root.innerHTML = '<div class="cart-wrap"><form class="panel" id="co-form" novalidate><h2>Delivery details</h2>' +
      '<div class="form-grid">' +
      '<div class="f"><label for="name">Full name</label><input class="field" id="name" autocomplete="name"><div class="err"></div></div>' +
      '<div class="f"><label for="phone">Mobile number</label><input class="field" id="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="10-digit number"><div class="err"></div></div>' +
      '<div class="f span2"><label for="email">Email</label><input class="field" id="email" type="email" autocomplete="email" placeholder="Your order confirmation and tracking details are sent here"><div class="err"></div></div>' +
      '<div class="f span2"><label for="address">Full address</label><textarea class="field" id="address" rows="2" autocomplete="street-address" placeholder="House no., street, area, landmark"></textarea><div class="err"></div></div>' +
      '<div class="f"><label for="city">City</label><input class="field" id="city" autocomplete="address-level2"><div class="err"></div></div>' +
      '<div class="f"><label for="state">State</label><select class="field" id="state">' + opts + '</select><div class="err"></div></div>' +
      '<div class="f"><label for="pin">PIN code</label><input class="field" id="pin" inputmode="numeric" maxlength="6" autocomplete="postal-code"><div class="err"></div></div>' +
      '<div class="f"><label for="notes">Note <i>(optional)</i></label><input class="field" id="notes" placeholder="Anything we should know?"></div>' +
      "</div>" +
      '<button class="btn btn-block" id="go" type="submit" style="margin-top:22px">Continue to payment</button></form>' +
      '<aside class="summary"><h3>Your order</h3>' + miniLines(items) + sumRows({ subtotal: t.subtotal, kg: t.kg, shipping: t.shipping, total: t.total }) +
      '<p class="fine"><a href="cart.html">Edit cart</a></p></aside></div>';

    var form = document.getElementById("co-form");
    function val(id) { return document.getElementById(id).value.trim(); }
    function setErr(id, msg) {
      var el = document.getElementById(id), box = el.parentNode.querySelector(".err");
      el.classList.toggle("bad", !!msg); if (box) box.textContent = msg || "";
      return !msg;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var phone = val("phone").replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "");
      var ok = true, first = null;
      function chk(id, msg) { var good = setErr(id, msg); if (!good && !first) first = id; ok = ok && good; }
      chk("name", val("name").length < 2 ? "Please enter your name" : "");
      chk("phone", /^[6-9]\d{9}$/.test(phone) ? "" : "Enter a valid 10-digit mobile number");
      chk("email", /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val("email")) ? "" : "Enter a valid email, we send your order details here");
      chk("address", val("address").length < 8 ? "Please enter your full address" : "");
      chk("city", val("city").length < 2 ? "Please enter your city" : "");
      chk("state", val("state") ? "" : "Please select your state");
      chk("pin", /^\d{6}$/.test(val("pin")) ? "" : "Enter a 6-digit PIN code");
      if (!ok) { document.getElementById(first).focus(); return; }

      var cur = VM.cart.lines(), tt = VM.totals(cur);
      var order = {
        id: orderId(), name: val("name"), phone: phone, email: val("email"), address: val("address"),
        city: val("city"), state: val("state"), pin: val("pin"), notes: val("notes"),
        items: cur.map(function (l) { return { name: VM.lineName(l), qty: l.qty, total: l.total }; }),
        subtotal: tt.subtotal, shipping: tt.shipping, kg: tt.kg, total: tt.total, sig: signature(cur, tt.total)
      };
      put("vm_pending", order);
      payView(order);
      window.scrollTo(0, 0);
    });
  }

  /* step 2: pay by UPI, then enter the UPI transaction ID */
  function payView(o) {
    var upi = S.upiId;
    var upiLink = upi ? "upi://pay?pa=" + encodeURIComponent(upi) + "&pn=" + encodeURIComponent(S.upiName) +
      "&am=" + o.total + "&cu=INR&tn=" + encodeURIComponent(o.id) : "";
    var pay;
    if (upi) {
      pay = '<p>Pay <b>' + VM.money(o.total) + '</b> using any UPI app (GPay, PhonePe, Paytm...).</p>' +
        '<div class="upi-id"><span id="upi-text"></span><button class="btn btn-sm btn-ghost" type="button" id="copy">Copy</button></div>' +
        '<a class="btn" id="upi-open" href="' + upiLink + '">Open UPI app</a>' +
        '<div id="qr" class="qr" aria-label="UPI QR code"></div>' +
        '<p class="hint">On a computer, scan the QR code with any UPI app on your phone. The amount is filled in for you.</p>';
    } else {
      pay = '<div class="notice">Online payment is being set up and will be available soon. Please try again shortly.</div>';
    }
    root.innerHTML = '<div class="cart-wrap"><div class="panel"><h2>Pay by UPI</h2>' +
      '<p class="muted">Order <b>' + VM.esc(o.id) + '</b> for ' + VM.esc(o.name) + '.</p>' +
      '<div class="pay-box"><div class="pay-step" data-n="1"><h3>Make the payment</h3>' + pay + "</div>" +
      '<div class="pay-step" data-n="2"><h3>Enter your UPI transaction ID</h3>' +
        '<p>After paying, open the payment in your UPI app and copy the <b>12-digit UPI reference / UTR number</b>.</p>' +
        '<div class="f"><input class="field" id="utr" inputmode="numeric" maxlength="12" placeholder="12-digit number" autocomplete="off"' + (upi ? "" : " disabled") + '><div class="err" id="utr-err"></div></div>' +
        '<button class="btn btn-block" id="confirm" type="button" style="margin-top:12px"' + (upi ? "" : " disabled") + '>Confirm payment &amp; place order</button>' +
        '<div class="err" id="send-err" style="margin-top:8px"></div></div></div>' +
      '<p><button class="link-btn" type="button" id="back" style="color:var(--henna)">← Change delivery details</button></p></div>' +
      '<aside class="summary"><h3>Your order</h3>' + miniLines(o.items) + sumRows(o) +
      '<p class="fine">Deliver to: ' + VM.esc(o.address + ", " + o.city + ", " + o.state + " - " + o.pin) + "</p></aside></div>";

    if (upi) {
      try {
        var qr = qrcode(0, "M"); qr.addData(upiLink); qr.make();
        document.getElementById("qr").innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
      } catch (err) { var q = document.getElementById("qr"); if (q) q.remove(); }
      document.getElementById("upi-text").textContent = upi;
      document.getElementById("copy").addEventListener("click", function () {
        var done = function () { VM.toast("UPI ID copied"); };
        if (navigator.clipboard) navigator.clipboard.writeText(upi).then(done, done); else done();
      });
    }
    document.getElementById("back").addEventListener("click", function () { put("vm_pending", null); formView(VM.cart.lines()); window.scrollTo(0, 0); });

    document.getElementById("confirm").addEventListener("click", function () {
      var u = document.getElementById("utr"), uerr = document.getElementById("utr-err"), serr = document.getElementById("send-err"), btn = this;
      var v = u.value.replace(/\s/g, "");
      serr.textContent = "";
      if (!/^\d{12}$/.test(v)) { u.classList.add("bad"); uerr.textContent = "Enter the 12-digit UPI reference number from your payment"; u.focus(); return; }
      u.classList.remove("bad"); uerr.textContent = "";
      o.utr = v;
      btn.disabled = true; btn.textContent = "Placing your order...";
      sendOrder(o).then(function (ok) {
        if (!ok) {
          btn.disabled = false; btn.innerHTML = "Confirm payment &amp; place order";
          serr.textContent = "We could not place your order. Please check your internet and try again. If you have already paid, do not pay again: contact us on " + S.phoneDisplay + ".";
          return;
        }
        VM.cart.clear(); put("vm_pending", null); put("vm_last_order", o);
        doneView(o); window.scrollTo(0, 0);
      });
    });
  }

  /* step 3: order received */
  function doneView(o) {
    root.innerHTML = '<div class="panel" style="max-width:760px;margin:30px auto 60px"><div class="big-ok">✓</div>' +
      '<h2>Thank you, <span id="nm"></span>!</h2>' +
      "<p>We have received your order <b>" + VM.esc(o.id) + "</b>. Total paid: <b>" + VM.money(o.total) + "</b> (including " + VM.money(o.shipping) + " shipping).</p>" +
      "<p>A confirmation has been sent to <b id=\"em\"></b>. Your tracking details will be sent to the same email after your order is shipped.</p>" +
      '<div class="summary" style="margin:18px 0">' + miniLines(o.items) + "</div>" +
      '<a class="btn" href="shop.html">Continue shopping</a>' +
      '<p class="hint" style="margin-top:18px">For any emergency: <a href="tel:+' + S.phone + '">' + VM.esc(S.phoneDisplay) + "</a></p></div>";
    document.getElementById("nm").textContent = o.name.split(" ")[0];
    document.getElementById("em").textContent = o.email;
  }

  /* ---------- start ---------- */
  var lines = VM.cart.lines();
  if (lines.length) {
    var pending = get("vm_pending"), t = VM.totals(lines);
    if (pending && pending.sig === signature(lines, t.total)) payView(pending); else formView(lines);
  } else {
    var last = get("vm_last_order");
    if (last && last.id) doneView(last); else emptyView();
  }
})();
