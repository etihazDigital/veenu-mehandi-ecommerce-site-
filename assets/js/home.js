(function () {
  var VM = window.VM;
  var cats = document.getElementById("home-cats");
  if (cats) {
    cats.innerHTML = window.CATEGORIES.map(function (c) {
      return '<a class="cat-tile" href="shop.html?cat=' + c.id + '">' + VM.mandalaSVG() +
        "<b>" + VM.esc(c.name) + "</b><span>" + VM.esc(c.blurb) + "</span></a>";
    }).join("");
  }
  var feat = document.getElementById("featured");
  if (feat) {
    var list = window.PRODUCTS.filter(function (p) { return p.featured; }).slice(0, 8);
    feat.innerHTML = list.map(VM.productCard).join("");
  }
})();
