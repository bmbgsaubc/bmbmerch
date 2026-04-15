/*
Google Apps Script backend for BMB-GSA merch order capture.

Setup:
1) Create a Google Sheet with headers in row 1:
   Name | Phone number/email address | Lab | Pickup/Dropoff preference | Item name | Size (small) | Size (medium) | Size (large) | Size (XL)
2) Open Extensions > Apps Script and paste this file.
3) Set SHEET_NAME if needed.
4) Deploy > New deployment > Web app:
   - Execute as: Me
   - Who has access: Anyone
5) Copy the Web app URL and paste it into SHEETS_WEBHOOK_URL in script.js.
*/

const SHEET_NAME = "Sheet1";

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const orders = Array.isArray(payload.orders) ? payload.orders : [];
    if (!orders.length) {
      return jsonResponse({ ok: false, error: "No orders provided" });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return jsonResponse({ ok: false, error: `Sheet '${SHEET_NAME}' not found` });
    }

    const rows = orders.map((order) => [
      order.name || "",
      order.contact || "",
      order.lab || "",
      order.fulfillment || "",
      order.itemName || "",
      Number(order.sizeSmall || 0),
      Number(order.sizeMedium || 0),
      Number(order.sizeLarge || 0),
      Number(order.sizeXL || 0),
    ]);

    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    return jsonResponse({ ok: true, rowsWritten: rows.length });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
