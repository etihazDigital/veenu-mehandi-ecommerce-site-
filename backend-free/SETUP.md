# Free backend setup (about 10 minutes, Rs 0)

Use the store's Gmail (veenumehandiproducts@gmail.com) so emails come from it.

1. Go to sheets.google.com, create a blank sheet named "Veenu Mehandi Orders".
2. Menu: Extensions > Apps Script. Delete the sample code, paste all of `Code.gs`, click Save.
3. In the function dropdown choose `setup`, press Run, allow the permissions
   (Advanced > Go to project (unsafe) > Allow; it only needs your sheet and Gmail sending).
4. Click Deploy > New deployment > type "Web app". Execute as: Me. Who has access: Anyone. Deploy. Copy the Web app URL.
5. In the website file `assets/js/config.js` paste it: `orderEndpoint: "THE_URL",` then upload the site again.
6. Place a test order. The sheet gets a row, the customer email and your email arrive.

Daily use: open the sheet on phone or laptop.
- Money received? Set Status = Paid (customer gets "payment confirmed").
- Parcel sent? Type Courier + Tracking ID, set Status = Shipped (customer gets the tracking email).
Each email is sent only once per order.

Limits: a normal Gmail can send about 100 emails a day (roughly 30 orders a day with 3 emails each); a Google Workspace address about 1,500.
