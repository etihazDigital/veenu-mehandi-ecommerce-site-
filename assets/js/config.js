/* ------------------------------------------------------------------
   STORE SETTINGS: change shop details here (no other file needed)
------------------------------------------------------------------- */
window.STORE = {
  name: "Veenu Mehandi",
  tagline: "Henna & mehandi supplies",
  city: "Delhi",

  // Contact. WhatsApp is only an EMERGENCY contact (not used for orders). Digits only, with country code.
  phoneDisplay: "+91 98128 56568",
  phone: "919812856568",
  whatsapp: "919812856568",
  email: "veenumehandiproducts@gmail.com",
  instagram: "",            // e.g. "https://instagram.com/yourhandle" (icon is hidden while empty)

  // UPI payment (customer pays after placing the order)
    upiId: "9812856568@ptsbi",                // e.g. "9812856568@ybl"  <-- ADD VEENU'S UPI ID HERE
  upiName: "Veenu Mehandi",
  // A QR code with the exact order amount is generated automatically from this UPI ID.

  // Shipping: flat rate per started kg, all India
  shippingPerKg: 70,
  dispatchHours: 48,
  returnWindowHours: 48,    // damaged-item claims (with unboxing video) must be reported within this time

  // New-order email. Uses the free FormSubmit service; the first order triggers a
  // one-time confirmation email to the address below, click "Activate" once.
  // Leave empty ("") to turn email off (then orders cannot be placed, so keep it on).
  orderEndpoint: "", /* paste the Google Apps Script web-app URL here (see backend-free/SETUP.md) */
  orderEmailEndpoint: "https://formsubmit.co/ajax/veenumehandiproducts@gmail.com"
};
