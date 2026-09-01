import PDFDocument from "pdfkit";
import { Buffer } from "buffer";

interface ReceiptData {
  userName: string;
  userEmail: string;
  amount: string;
  tier: string;
  transactionId: string;
  date: string;
}

export const generateReceiptPDF = (data: ReceiptData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on("error", reject);

    // Branding Colors
    const primaryColor = "#111827"; // Navy
    const accentColor = "#10b981"; // Emerald Green
    const secondaryColor = "#6b7280"; // Gray

    // Header - PoolPay Branding
    doc
      .fillColor(primaryColor)
      .fontSize(24)
      .text("PoolPay", { align: "left" })
      .fontSize(10)
      .fillColor(secondaryColor)
      .text("Secure Community Savings Platform", { align: "left" })
      .moveDown();

    // Divider
    doc
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .strokeColor("#e5e7eb")
      .stroke();

    doc.moveDown(2);

    // Title
    doc
      .fillColor(primaryColor)
      .fontSize(20)
      .text("MEMBERSHIP RECEIPT", { align: "center", characterSpacing: 1 })
      .moveDown(2);

    // Receipt Information Table-like Layout
    const startX = 50;
    let currentY = doc.y;

    // Helper function for rows
    const drawRow = (label: string, value: string, y: number) => {
      doc
        .fillColor(secondaryColor)
        .fontSize(10)
        .text(label, startX, y)
        .fillColor(primaryColor)
        .fontSize(12)
        .text(value, startX + 150, y, { align: "left" });
      return y + 25;
    };

    currentY = drawRow("Customer Name:", data.userName, currentY);
    currentY = drawRow("Email Address:", data.userEmail, currentY);
    currentY = drawRow("Transaction ID:", data.transactionId, currentY);
    currentY = drawRow("Date:", data.date, currentY);
    currentY = drawRow("Membership Tier:", data.tier.toUpperCase(), currentY);
    
    doc.moveDown(1);
    
    // Amount Highlight Box
    doc
      .rect(startX, currentY, 500, 50)
      .fill("#f9fafb");
    
    doc
      .fillColor(primaryColor)
      .fontSize(14)
      .text("Total Paid:", startX + 20, currentY + 18)
      .fillColor(accentColor)
      .fontSize(18)
      .text(data.amount, startX + 380, currentY + 15, { align: "right", width: 100 });

    doc.moveDown(4);

    // Decorative Footer Line
    doc
      .moveTo(startX, doc.y)
      .lineTo(startX + 500, doc.y)
      .strokeColor("#f3f4f6")
      .lineWidth(2)
      .stroke();
    
    doc.moveDown(1.5);

    // Footer Info
    doc
      .fillColor(secondaryColor)
      .fontSize(9)
      .text("This is an electronically generated receipt for your PoolPay membership. No signature is required.", {
        align: "center",
        width: 500
      })
      .moveDown(0.6)
      .text("If you have any questions, please contact our support team at support@poolpay.com", {
        align: "center",
        width: 500
      });

    doc.end();
  });
};
