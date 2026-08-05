// Type-only import — erased at build time, so it doesn't pull pdf-lib's
// ~440KB runtime into the main bundle. The real module is loaded lazily
// inside generateInvoicePdf, only once someone actually generates a PDF.
import type { PDFFont } from "pdf-lib";
import type { InvoiceBatchDetail } from "./api";

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function dayLabel(dateStr: string): string {
  const year = Number(dateStr.slice(0, 4));
  const month = Number(dateStr.slice(5, 7));
  const day = Number(dateStr.slice(8, 10));
  return dateFmt.format(new Date(Date.UTC(year, month - 1, day)));
}

// Matches the layout of the original spreadsheet's INVOICE tab: title +
// ref/date up top, a From/Bill-to two-column block, an itemised table of
// the invoices being billed, totals, and bank details for payment.
const PAGE_SIZE: [number, number] = [595.28, 841.89]; // A4

export async function generateInvoicePdf(batch: InvoiceBatchDetail): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const INK = rgb(0.11, 0.094, 0.082);
  const INK_SOFT = rgb(0.33, 0.31, 0.29);
  const LINE = rgb(0.78, 0.75, 0.71);

  const doc = await PDFDocument.create();
  // `page` is reassigned (not const) when a table overflows onto a new
  // page — every draw helper below closes over this binding, so once it's
  // reassigned, later calls automatically target the new page.
  let page = doc.addPage(PAGE_SIZE);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 44;
  const width = page.getWidth();
  const contentRight = width - margin;
  let y = page.getHeight() - margin;

  function text(str: string, x: number, useFont: PDFFont, size = 10, color = INK) {
    page.drawText(str, { x, y, size, font: useFont, color });
  }

  function textRight(str: string, rightX: number, useFont: PDFFont, size = 10, color = INK) {
    const w = useFont.widthOfTextAtSize(str, size);
    page.drawText(str, { x: rightX - w, y, size, font: useFont, color });
  }

  function hLine(fromY: number, color = LINE, thickness = 0.75) {
    page.drawLine({ start: { x: margin, y: fromY }, end: { x: contentRight, y: fromY }, thickness, color });
  }

  // --- Title, reference, date -----------------------------------------
  text("INVOICE", margin, bold, 20);
  textRight(`Invoice Date: ${dayLabel(batch.invoiceDate)}`, contentRight, font, 10, INK_SOFT);
  y -= 16;
  textRight(`Invoice Ref: ${batch.reference}`, contentRight, bold, 11);
  y -= 22;
  hLine(y);
  y -= 22;

  // --- From / Bill to ----------------------------------------------------
  const colWidth = (contentRight - margin) / 2;
  const rightColX = margin + colWidth + 20;
  const blockTop = y;

  function addressBlock(x: number, heading: string, party: InvoiceBatchDetail["from"]) {
    let blockY = blockTop;
    const draw = (str: string, useFont: PDFFont, size: number, color = INK) => {
      page.drawText(str, { x, y: blockY, size, font: useFont, color });
      blockY -= size + 6;
    };
    draw(heading, bold, 11);
    draw(party.name, font, 10);
    if (party.email) draw(party.email, font, 10, INK_SOFT);
    if (party.address) draw(party.address, font, 10);
    if (party.postcode) draw(party.postcode, font, 10);
    if (party.phone) draw(party.phone, font, 10, INK_SOFT);
    return blockY;
  }

  const fromBottom = addressBlock(margin, "From", batch.from);
  const billBottom = addressBlock(rightColX, "Bill to", batch.billTo);
  y = Math.min(fromBottom, billBottom) - 10;
  hLine(y);
  y -= 24;

  // --- Line items table ---------------------------------------------------
  const colDate = margin;
  const colFileNo = margin + 62;
  const colMatter = margin + 122;
  const colFeeRight = contentRight - 95;
  const colDueRight = contentRight;

  function tableHeader() {
    text("Date", colDate, bold, 9, INK_SOFT);
    text("File No.", colFileNo, bold, 9, INK_SOFT);
    text("Client & Matter", colMatter, bold, 9, INK_SOFT);
    textRight("Total Fee (exc. VAT)", colFeeRight, bold, 9, INK_SOFT);
    textRight("Amount Due (£)", colDueRight, bold, 9, INK_SOFT);
    y -= 8;
    hLine(y, INK, 1);
    y -= 16;
  }

  tableHeader();

  const rowHeight = 20;
  const bottomLimit = 130; // leaves room for totals + bank details

  for (const item of batch.lineItems) {
    if (y < bottomLimit) {
      page = doc.addPage(PAGE_SIZE);
      y = page.getHeight() - margin;
      tableHeader();
    }

    const clientMatter = item.matter ? `${item.clientName} - ${item.matter}` : item.clientName;
    text(dayLabel(item.invoiceDate), colDate, font, 10);
    text(item.fileNo ?? "—", colFileNo, font, 10);
    text(clientMatter, colMatter, font, 10);
    textRight(money.format(item.totalAmount), colFeeRight, font, 10);
    textRight(money.format(item.anitaIncome), colDueRight, font, 10);
    y -= rowHeight;
  }

  y -= 4;
  hLine(y);
  y -= 20;

  // --- Totals ---------------------------------------------------------
  text("Total Fee (exc. VAT) (£)", colMatter, bold, 10);
  textRight(money.format(batch.totalFee), colFeeRight, font, 10);
  y -= 18;
  text("Total Amount Due (£)", colMatter, bold, 10);
  textRight(money.format(batch.totalAmountDue), colDueRight, bold, 10);
  y -= 30;

  // --- Bank details -----------------------------------------------------
  hLine(y);
  y -= 20;
  text("Bank details", margin, bold, 10);
  y -= 16;
  text(`Account name: ${batch.bank.accountName}`, margin, font, 10);
  y -= 14;
  text(`Sort code: ${batch.bank.sortCode}`, margin, font, 10);
  y -= 14;
  text(`Account no: ${batch.bank.accountNumber}`, margin, font, 10);

  return doc.save();
}

export async function downloadInvoicePdf(batch: InvoiceBatchDetail): Promise<void> {
  const bytes = await generateInvoicePdf(batch);
  // pdf-lib's Uint8Array is typed against ArrayBufferLike (which includes
  // SharedArrayBuffer), which BlobPart doesn't accept — the bytes are
  // always a plain, freshly-allocated ArrayBuffer in practice.
  const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${batch.reference}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
