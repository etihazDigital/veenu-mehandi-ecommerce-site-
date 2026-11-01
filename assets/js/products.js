/* ------------------------------------------------------------------
   PRODUCTS: edit prices, names and weights here.

   Every product has one or more "variants" (pack sizes / types):
     id      short unique id
     label   what the customer sees ("250 g", "Big · 100 bags")
     price   in rupees. Use null for "price to be confirmed" (shows, but can't be bought)
     weight  SHIPPING weight in grams (product + packing). Shipping = Rs 70 per started kg.
     est     true  = weight is only an ESTIMATE, to be confirmed by Veenu. Remove after confirming.

   Optional "About this product" extras, per product:
     video: "https://www.instagram.com/reel/XXXXXXXX/"      shows the Instagram video on the product page
     faq:   [ { q: "Question?", a: "Answer." }, ... ]         shows a question/answer list (Hinglish is fine)

   Product photos: drop files into assets/img/products/ named
     <product id>-1.jpg, <product id>-2.jpg, <product id>-3.jpg ...
   e.g. henna-powder-1.jpg. They appear automatically (placeholders show until then).
------------------------------------------------------------------- */

window.CATEGORIES = [
  { id: "powder",   name: "Henna Powder",        blurb: "Henna powder in 250 g, 500 g and 1 kg packs" },
  { id: "oils",     name: "Oils",                blurb: "Mix oil, bride oil and clove essential oil" },
  { id: "sheets",   name: "Sheets & Bags",       blurb: "Cellophane sheets and piping bags" },
  { id: "tools",    name: "Tools & Accessories", blurb: "Pins, spatulas, stockings, pillow and tape" },
  { id: "practice", name: "Practice & Books",    blurb: "Acrylic practice hands, legs and mehandi books" }
];

window.PRODUCTS = [
  {
    id: "henna-powder", name: "Henna Powder", category: "powder", featured: true,
    desc: "Henna powder for preparing mehandi paste. Available in 250 g, 500 g and 1 kg packs.",
    variantLabel: "Pack size",
    variants: [
      { id: "250g", label: "250 g", price: 155, weight: 260 },
      { id: "500g", label: "500 g", price: 255, weight: 510 },
      { id: "1kg",  label: "1 kg",  price: 440, weight: 1000 }
    ]
  },
  {
    id: "mix-oil", name: "Mix Oil", category: "oils", featured: true,
    desc: "Mix oil for mehandi, available in 100 ml, 500 ml and 1 litre bottles.",
    variantLabel: "Bottle size",
    variants: [
      { id: "100ml", label: "100 ml", price: 130,  weight: 110 },
      { id: "500ml", label: "500 ml", price: 590,  weight: 540 },
      // CONFIRM WITH VEENU: 1 L price was sent as 1640, the same as Bride Oil 1 L
      { id: "1l",    label: "1 litre", price: 1640, weight: 1060 }
    ]
  },
  {
    id: "bride-oil", name: "Bride Oil", category: "oils", featured: true,
    desc: "Bride oil for mehandi, available in 100 ml, 500 ml and 1 litre bottles.",
    variantLabel: "Bottle size",
    variants: [
      { id: "100ml", label: "100 ml", price: 190,  weight: 110 },
      { id: "500ml", label: "500 ml", price: 860,  weight: 540 },
      { id: "1l",    label: "1 litre", price: 1640, weight: 1060 }
    ]
  },
  {
    id: "clove-essential-oil", featured: true, name: "Clove Essential Oil", category: "oils",
    desc: "Clove essential oil in a 50 ml bottle.",
    variantLabel: "Bottle size",
    variants: [
      { id: "50ml", label: "50 ml", price: 180, weight: 60 }
    ]
  },
  {
    id: "cellophane-sheets", name: "Cellophane Sheets", category: "sheets", featured: true,
    desc: "Cellophane sheets for mehandi work. Choose printed cellophane, frozen sheets or transparent cellophane.",
    variantLabel: "Type",
    variants: [
      { id: "print-100",       label: "Printed cellophane · 100 sheets",    price: 40,  weight: 100, est: true },
      { id: "frozen-100",      label: "Frozen sheets · 100 sheets",         price: 80,  weight: 150, est: true },
      { id: "transparent-500", label: "Transparent cellophane · 500 sheets", price: 170, weight: 400, est: true }
    ]
  },
  {
    id: "mehandi-pins", featured: true, name: "Mehandi Pins", category: "tools",
    desc: "Mehandi pins in packs of 5 or 100, available in three sizes: 0.27, 0.29 and 0.32.",
    variantLabel: "Pack",
    extra: { label: "Pin size", values: ["0.27", "0.29", "0.32"] },
    variants: [
      { id: "5",   label: "5 pins",   price: 40,  weight: 10,  est: true },
      { id: "100", label: "100 pins", price: 550, weight: 120, est: true }
    ]
  },
  {
    id: "piping-bags", featured: true, name: "Piping Bags", category: "sheets",
    desc: "Piping bags in small and big sizes, in packs of 10 or 100.",
    variantLabel: "Size & pack",
    variants: [
      { id: "small-10",  label: "Small · 10 bags",  price: 20,  weight: 20,  est: true },
      { id: "small-100", label: "Small · 100 bags", price: 120, weight: 120, est: true },
      { id: "big-10",    label: "Big · 10 bags",    price: 25,  weight: 30,  est: true },
      { id: "big-100",   label: "Big · 100 bags",   price: 150, weight: 200, est: true }
    ]
  },
  {
    id: "mehandi-book", name: "Mehandi Book", category: "practice",
    desc: "Mehandi book available in A6, A4 and A3 sizes.",
    variantLabel: "Size",
    variants: [
      { id: "a6", label: "A6", price: 50,   weight: 100, est: true },
      // CONFIRM WITH VEENU: A4 price was sent as "19p". Put the price here (e.g. 190) to enable it.
      { id: "a4", label: "A4", price: null, weight: 300, est: true },
      { id: "a3", label: "A3", price: 285,  weight: 600, est: true }
    ]
  },
  {
    id: "acrylic-practice", name: "Acrylic Practice Hand & Leg", category: "practice", featured: true,
    desc: "Acrylic practice hands and leg for practising your mehandi designs.",
    variantLabel: "Type",
    variants: [
      { id: "hand-big",   label: "Big acrylic hand",   price: 160, weight: 250, est: true },
      { id: "hand-small", label: "Small acrylic hand", price: 120, weight: 150, est: true },
      { id: "leg",        label: "Acrylic leg",        price: 120, weight: 300, est: true }
    ]
  },
  {
    id: "spatula", name: "Spatula", category: "tools",
    desc: "Spatula in small and big sizes.",
    variantLabel: "Size",
    variants: [
      { id: "small", label: "Small", price: 70, weight: 40, est: true },
      { id: "big",   label: "Big",   price: 90, weight: 60, est: true }
    ]
  },
  {
    id: "stockings", name: "Stockings (Pair)", category: "tools",
    desc: "Stockings sold by the pair, in small and big sizes.",
    variantLabel: "Size",
    variants: [
      { id: "small", label: "Small pair", price: 30, weight: 40, est: true },
      { id: "big",   label: "Big pair",   price: 40, weight: 60, est: true }
    ]
  },
  {
    id: "henna-pillow", name: "Henna Pillow", category: "tools",
    desc: "Henna pillow for comfortable support while applying mehandi.",
    variantLabel: "Option",
    variants: [
      { id: "standard", label: "Henna pillow", price: 280, weight: 350, est: true }
    ]
  },
  {
    id: "tape-dispenser", name: "Tape & Tape Dispenser", category: "tools",
    desc: "Small tape dispenser, and tape sold as a pack of 2.",
    variantLabel: "Option",
    variants: [
      { id: "dispenser", label: "Tape dispenser (small)", price: 65, weight: 150, est: true },
      { id: "tape-2",    label: "Tape · pack of 2",       price: 10, weight: 40,  est: true }
    ]
  }
];
