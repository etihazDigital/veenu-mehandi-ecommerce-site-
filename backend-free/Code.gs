/**
 * Veenu Mehandi: free backend on Google Apps Script + Google Sheets.
 * - Website posts each order here -> saved as a row in the "Orders" sheet
 * - Customer gets an "order received" email at once, Veenu gets a "new order" email
 * - Veenu opens the sheet: sets Status = Paid -> customer gets "payment confirmed" email
 * - Veenu types Courier + Tracking ID and sets Status = Shipped -> customer gets tracking email
 * Run setup() once (see SETUP.md). Cost: Rs 0.
 */
var SHOP = "Veenu Mehandi";
var HEAD = ["Order ID","Time","Name","Phone","Email","Items","Subtotal","Shipping","Total","UTR","Address","Notes",
            "Status","Courier","Tracking ID","Tracking link (optional)","Emails sent"];
var COL = {}; HEAD.forEach(function (h, i) { COL[h] = i + 1; });

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName("Orders") || ss.insertSheet("Orders");
}

function setup() {
  var sh = sheet_();
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEAD);
    sh.getRange(1, 1, 1, HEAD.length).setFontWeight("bold").setBackground("#c87587").setFontColor("#ffffff");
    sh.setFrozenRows(1);
  }
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["New","Paid","Packed","Shipped","Delivered","Cancelled"], true).build();
  sh.getRange(2, COL["Status"], 1000, 1).setDataValidation(rule);
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("onSheetEdit").forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() { return json_({ ok: true, shop: SHOP }); }

function doPost(e) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
    if (!d.id || !d.email || !d.name || !d.phone || !d.items) return json_({ ok: false, error: "missing fields" });
    var sh = sheet_();
    var ids = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(function (r) { return r[0]; }) : [];
    if (ids.indexOf(d.id) > -1) return json_({ ok: true, duplicate: true });   // never double-process
    sh.appendRow([d.id, new Date(), d.name, "'" + d.phone, d.email, d.items, d.subtotal, d.shipping, d.total,
                  "'" + d.utr, d.address, d.notes || "", "New", "", "", "", ""]);
    var row = sh.getLastRow();
    var owner = Session.getEffectiveUser().getEmail();
    MailApp.sendEmail({ to: owner, subject: "New order " + d.id + " - Rs " + d.total + " (UTR " + d.utr + ")",
      body: "New order on the website.\n\nOrder: " + d.id + "\nName: " + d.name + "\nPhone: " + d.phone + "\nEmail: " + d.email +
        "\n\n" + d.items + "\n\nTotal: Rs " + d.total + "\nUPI transaction ID: " + d.utr + "  (check it in your UPI app)\n\nAddress: " + d.address +
        "\n\nOpen the Orders sheet, set Status to Paid once the money is in." });
    MailApp.sendEmail({ to: d.email, name: SHOP, subject: "Order received: " + d.id,
      body: "Thank you for your order with " + SHOP + "!\n\nOrder ID: " + d.id + "\n\n" + d.items + "\n\nSubtotal: Rs " + d.subtotal +
        "\nShipping: Rs " + d.shipping + "\nTotal: Rs " + d.total + "\n\nDelivery address: " + d.address +
        "\nUPI transaction ID: " + d.utr + "\n\nWe will confirm your payment shortly and email your tracking details after dispatch." });
    mark_(sh, row, "received");
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally { lock.releaseLock(); }
}

function mark_(sh, row, tag) {
  var c = sh.getRange(row, COL["Emails sent"]);
  var v = String(c.getValue()); if (v.indexOf(tag) < 0) c.setValue(v ? v + "," + tag : tag);
}
function sent_(sh, row, tag) { return String(sh.getRange(row, COL["Emails sent"]).getValue()).indexOf(tag) > -1; }

// Installable edit trigger: sends the status emails
function onSheetEdit(e) {
  var sh = e.range.getSheet(); if (sh.getName() !== "Orders" || e.range.getRow() < 2) return;
  var row = e.range.getRow(), r = sh.getRange(row, 1, 1, HEAD.length).getValues()[0];
  function g(h) { return r[COL[h] - 1]; }
  var status = g("Status"), to = g("Email"), id = g("Order ID"); if (!to) return;
  if (status === "Paid" && !sent_(sh, row, "paid")) {
    MailApp.sendEmail({ to: to, name: SHOP, subject: "Payment confirmed: " + id,
      body: "Hi " + g("Name") + ",\n\nWe have received your payment for order " + id + ". We are packing it now and will email your tracking details once it is dispatched.\n\nThank you,\n" + SHOP });
    mark_(sh, row, "paid");
  }
  if (status === "Shipped" && g("Tracking ID") && !sent_(sh, row, "shipped")) {
    var link = g("Tracking link (optional)");
    MailApp.sendEmail({ to: to, name: SHOP, subject: "Your order " + id + " has been shipped",
      body: "Hi " + g("Name") + ",\n\nYour order " + id + " is on its way.\n\nCourier: " + (g("Courier") || "-") +
        "\nTracking ID: " + g("Tracking ID") + (link ? "\nTrack here: " + link : "") + "\n\nThank you,\n" + SHOP });
    mark_(sh, row, "shipped");
  }
  if (status === "Cancelled" && !sent_(sh, row, "cancelled")) {
    MailApp.sendEmail({ to: to, name: SHOP, subject: "Order " + id + " cancelled",
      body: "Hi " + g("Name") + ",\n\nYour order " + id + " has been cancelled. If you have any question, reply to this email.\n\n" + SHOP });
    mark_(sh, row, "cancelled");
  }
}
