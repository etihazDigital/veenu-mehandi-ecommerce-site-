(function () {
  var VM = window.VM, P = window.PRODUCTS, C = window.CATEGORIES;
  var params = new URLSearchParams(location.search);
  var state = { cat: params.get("cat") || "all", q: (params.get("q") || "").trim(), sort: "featured" };
  if (state.cat !== "all" && !VM.category(state.cat)) state.cat = "all";

  var chips = document.getElementById("chips"),
      grid = document.getElementById("grid"),
      q = document.getElementById("q"),
      sort = document.getElementById("sort"),
      count = document.getElementById("count"),
      title = document.getElementById("shop-title");
  q.value = state.q;

  function minPrice(p) {
    var v = VM.priced(p);
    return v.length ? Math.min.apply(null, v.map(function (x) { return x.price; })) : Infinity;
  }
  function matches(p) {
    if (state.cat !== "all" && p.category !== state.cat) return false;
    if (!state.q) return true;
    var hay = (p.name + " " + p.desc + " " + VM.category(p.category).name + " " +
      p.variants.map(function (v) { return v.label; }).join(" ")).toLowerCase();
    return state.q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
  }
  function render() {
    var list = P.filter(matches);
    if (state.sort === "low") list.sort(function (a, b) { return minPrice(a) - minPrice(b); });
    if (state.sort === "high") list.sort(function (a, b) { return minPrice(b) - minPrice(a); });
    if (state.sort === "name") list.sort(function (a, b) { return a.name.localeCompare(b.name); });

    chips.innerHTML = [{ id: "all", name: "All products" }].concat(C).map(function (c) {
      return '<button class="chip' + (state.cat === c.id ? " on" : "") + '" data-cat="' + c.id + '">' + VM.esc(c.name) + "</button>";
    }).join("");

    grid.innerHTML = list.length ? list.map(VM.productCard).join("") :
      '<div class="empty" style="grid-column:1/-1"><h3>No products found</h3><p>Try a different word, or <a href="shop.html">see all products</a>.</p>' +
      '</div>';

    count.textContent = list.length + (list.length === 1 ? " product" : " products");
    title.textContent = state.cat === "all" ? "Shop all products" : VM.category(state.cat).name;
    document.title = (state.cat === "all" ? "Shop" : VM.category(state.cat).name) + " | Veenu Mehandi";

    var url = new URLSearchParams();
    if (state.cat !== "all") url.set("cat", state.cat);
    if (state.q) url.set("q", state.q);
    history.replaceState(null, "", location.pathname + (url.toString() ? "?" + url : ""));
  }

  chips.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cat]"); if (!b) return;
    state.cat = b.getAttribute("data-cat"); render();
  });
  q.addEventListener("input", function () { state.q = q.value.trim(); render(); });
  sort.addEventListener("change", function () { state.sort = sort.value; render(); });
  render();
})();
