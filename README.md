# Veenu Mehandi: Online Store (version 2)

Plain HTML, CSS and JavaScript. Nothing to install or build. Upload the folder to any static host (GitHub Pages, Netlify, ...).

## What changed in version 2 (from Veenu's voice notes)
- Top bar, hero badges and the "delivery / dispatch / UPI" strip removed. Home page now goes straight to the products.
- Category tiles removed from the home page (categories remain as filters on the Shop page).
- WhatsApp is no longer used for orders. It is only an **emergency contact** (footer and About & Contact).
- Product page: no delivery text. New **About this product** section: description, options and prices, optional **Instagram video** and optional **FAQ** (see below).
- Checkout: delivery details (email is now required) -> pay by UPI -> enter the 12-digit UPI transaction ID -> order received. The order is emailed to the store and a confirmation is emailed to the customer.
- Header fixed on narrow phones (cart icon was cut off).

## IMPORTANT: what is still manual until a backend exists
The site has no server, so it cannot verify a UPI payment by itself and cannot send tracking IDs automatically. Today:
- Veenu gets an email per order with the customer's UPI transaction ID and checks it in her UPI app.
- Tracking details must be emailed to the customer by hand.
Automatic payment confirmation and automatic tracking emails need the backend described in `BACKEND_PLAN.md`.

## Things to fill in before going live
| What | Where |
|---|---|
| Veenu's **UPI ID** (checkout is blocked until set) | `assets/js/config.js` -> `upiId` |
| **Logo** | save as `assets/img/logo.png` |
| **Site colours** (match the logo) | variables at the top of `assets/css/style.css` (`:root`) |
| **Weights** for items marked `est: true` | `assets/js/products.js` |
| **A4 Mehandi Book price** (`null` now) and **Mix Oil 1 L price** (check) | `assets/js/products.js` |
| **Price list with categories** (Veenu will resend) | `assets/js/products.js` |
| Instagram link | `assets/js/config.js` -> `instagram` |

## Product photos
Save in `assets/img/products/` as `<product-id>-1.jpg`, `-2.jpg`, ... They appear automatically.
Ids: henna-powder, mix-oil, bride-oil, clove-essential-oil, cellophane-sheets, mehandi-pins, piping-bags, mehandi-book, acrylic-practice, spatula, stockings, henna-pillow, tape-dispenser.

## "About this product": Instagram video and FAQ
In `assets/js/products.js`, add to any product:
```js
video: "https://www.instagram.com/reel/XXXXXXXX/",
faq: [ { q: "Kitna powder lagta hai?", a: "..." } ],
```
The video shows on the product page; the FAQ shows as a question/answer list. Both are optional.

## Order emails (one-time setup)
Orders use the free FormSubmit service. After the site is live, place one test order. FormSubmit emails `veenumehandiproducts@gmail.com` once and Veenu must click **Activate**. Until then orders are NOT delivered, so do this before sharing the site with customers.

## Pages
index, shop, product?id=..., cart, checkout, about (About & Contact), shipping-returns, privacy-terms.
