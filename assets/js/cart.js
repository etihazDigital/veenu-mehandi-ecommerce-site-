(function () {
  var VM = window.VM, S = window.STORE;
  var root = document.getElementById("cart-root");

  function render() {
    var lines = VM.cart.lines();
    if (!lines.length) {
      root.innerHTML = '<div class="empty"><h3>Your cart is empty</h3><p>Add a few products and they will show up here.</p><a class="btn" href="shop.html">Start shopping</a></div>';
      return;
    }
    var t = VM.totals(lines);
    var items = lines.map(function (l) {
      var extra = l.extra ? " · " + VM.esc(l.p.extra.label) + " " + VM.esc(l.extra) : "";
      var key = 'data-p="' + l.p.id + '" data-v="' + l.v.id + '" data-x="' + VM.esc(l.extra) + '"';
      return '<div class="line"><a class="line-img" href="product.html?id=' + l.p.id + '">' + VM.imgTag(l.p, 1) + "</a><div>" +
        '<a class="line-name" href="product.html?id=' + l.p.id + '">' + VM.esc(l.p.name) + "</a>" +
        '<div class="line-var">' + VM.esc(l.v.label) + extra + " · " + VM.money(l.unit) + " each</div>" +
        '<div class="line-ctrl"><div class="qty" ' + key + '><button type="button" data-act="minus" aria-label="Decrease quantity">−</button>' +
        '<input type="number" min="1" max="99" value="' + l.qty + '" aria-label="Quantity"><button type="button" data-act="plus" aria-label="Increase quantity">+</button></div>' +
        '<span class="line-total">' + VM.money(l.total) + "</span>" +
        '<button class="link-btn" type="button" data-act="remove" ' + key + ">Remove</button></div></div></div>";
    }).join("");

    root.innerHTML = '<div class="cart-wrap"><div>' + items + "</div>" +
      '<aside class="summary"><h3>Order summary</h3>' +
      '<div class="sum-row"><span>Subtotal</span><span>' + VM.money(t.subtotal) + "</span></div>" +
      '<div class="sum-row"><span>Shipping<small>' + t.kg + " kg × " + VM.money(S.shippingPerKg) + " (flat, all India)</small></span><span>" + VM.money(t.shipping) + "</span></div>" +
      '<div class="sum-row sum-total"><span>Total</span><span>' + VM.money(t.total) + "</span></div>" +
      '<a class="btn btn-block" href="checkout.html">Proceed to checkout</a>' +
      '<p class="fine">Shipping is calculated on the total weight of your order (about ' + (t.grams / 1000).toFixed(2) + " kg), charged per started kg.</p></aside></div>";
  }

  root.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b) return;
    var holder = b.closest("[data-p]") || b;
    var pid = holder.getAttribute("data-p"), vid = holder.getAttribute("data-v"), x = holder.getAttribute("data-x") || "";
    var act = b.getAttribute("data-act");
    var cur = VM.cart.lines().filter(function (l) { return l.p.id === pid && l.v.id === vid && l.extra === x; })[0];
    if (!cur) return;
    if (act === "remove") VM.cart.remove(pid, vid, x);
    if (act === "plus") VM.cart.setQty(pid, vid, x, cur.qty + 1);
    if (act === "minus") VM.cart.setQty(pid, vid, x, Math.max(1, cur.qty - 1));
    render();
  });
  root.addEventListener("change", function (e) {
    if (e.target.tagName !== "INPUT") return;
    var h = e.target.closest("[data-p]");
    var n = parseInt(e.target.value, 10);
    VM.cart.setQty(h.getAttribute("data-p"), h.getAttribute("data-v"), h.getAttribute("data-x") || "", isNaN(n) ? 1 : n);
    render();
  });
  render();
})();
