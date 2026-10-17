import type { AttachedDocument, KlxAppointment, KlxService, KlxSettings } from "./db/types";

export function escapeHtml(text: string): string {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCents(cents?: number): string {
  if (typeof cents !== "number" || cents <= 0) return "$0.00";
  return `$${(cents / 100).toFixed(2)}`;
}

function formatTimeSlot(time: string): string {
  if (!time) return "";
  const parts = time.split(":");
  const h = Number(parts[0]);
  const m = parts[1] || "00";
  if (Number.isNaN(h)) return time;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

// -----------------------------------------------------------------------------
// Service Details & Attachments Builder Helper
// -----------------------------------------------------------------------------
function buildServiceDetails(appointment: KlxAppointment, siteUrl: string, adminToken?: string) {
  const serviceDetailsRows: string[] = [];
  const textDetails: string[] = [];

  if (appointment.sourceLanguage || appointment.targetLanguage) {
    const pair = `${appointment.sourceLanguage || "Specified"} → ${appointment.targetLanguage || "Specified"}`;
    serviceDetailsRows.push(`
      <tr>
        <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;width:140px;">Language Pair:</td>
        <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${escapeHtml(pair)}</td>
      </tr>
    `);
    textDetails.push(`Language Pair: ${pair}`);
  }

  if (appointment.interpretationSetting) {
    serviceDetailsRows.push(`
      <tr>
        <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;">Setting:</td>
        <td style="padding:6px 0;color:#0f172a;font-size:14px;">${escapeHtml(appointment.interpretationSetting)}</td>
      </tr>
    `);
    textDetails.push(`Setting: ${appointment.interpretationSetting}`);
  }

  if (appointment.translationReason) {
    serviceDetailsRows.push(`
      <tr>
        <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;">Reason:</td>
        <td style="padding:6px 0;color:#0f172a;font-size:14px;">${escapeHtml(appointment.translationReason)}</td>
      </tr>
    `);
    textDetails.push(`Reason: ${appointment.translationReason}`);
  }

  if (appointment.documentTypes && appointment.documentTypes.length > 0) {
    const docTypesStr = appointment.documentTypes.join(", ");
    serviceDetailsRows.push(`
      <tr>
        <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;">Doc Categories:</td>
        <td style="padding:6px 0;color:#0f172a;font-size:14px;">${escapeHtml(docTypesStr)}</td>
      </tr>
    `);
    textDetails.push(`Doc Categories: ${docTypesStr}`);
  }

  if (appointment.pickupLocation || appointment.dropoffLocation) {
    serviceDetailsRows.push(`
      <tr>
        <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;">Pickup:</td>
        <td style="padding:6px 0;color:#0f172a;font-size:14px;">${escapeHtml(appointment.pickupLocation || "N/A")}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;">Drop-off:</td>
        <td style="padding:6px 0;color:#0f172a;font-size:14px;">${escapeHtml(appointment.dropoffLocation || "N/A")}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;">Vehicle Class:</td>
        <td style="padding:6px 0;color:#0f172a;font-size:14px;">${escapeHtml(appointment.vehicleClass || "Standard")} (${appointment.passengers || 1} passenger(s))</td>
      </tr>
    `);
    textDetails.push(`Pickup: ${appointment.pickupLocation || "N/A"}`);
    textDetails.push(`Drop-off: ${appointment.dropoffLocation || "N/A"}`);
    textDetails.push(
      `Vehicle Tier: ${appointment.vehicleClass || "Standard"} (${appointment.passengers || 1} passengers)`
    );
    if (appointment.estimatedFareCents) {
      serviceDetailsRows.push(`
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;">Estimated Fare:</td>
          <td style="padding:6px 0;color:#047857;font-size:14px;font-weight:700;">${formatCents(appointment.estimatedFareCents)} (${appointment.payNow ? "Online Card Payment" : "Invoice"})</td>
        </tr>
      `);
      textDetails.push(
        `Estimated Fare: ${formatCents(appointment.estimatedFareCents)} (${appointment.payNow ? "Online Card Payment" : "Invoice"})`
      );
    }
  }

  // Attached files block
  let attachedHtml = "";
  if (appointment.attachedDocuments && appointment.attachedDocuments.length > 0) {
    textDetails.push(`Attached Documents:`);
    const docItems = appointment.attachedDocuments
      .map((doc: AttachedDocument) => {
        const directDocUrl = `${siteUrl}${doc.url}`;
        const clickDocUrl = adminToken
          ? `${siteUrl}/api/auth/magic?token=${encodeURIComponent(adminToken)}&next=${doc.url}`
          : directDocUrl;
        textDetails.push(`  • ${doc.name} (${(doc.size / 1024).toFixed(0)} KB): ${clickDocUrl}`);
        return `
          <div style="margin:8px 0;padding:10px 14px;background:#ffffff;border:1px solid #cbd5e1;border-radius:8px;display:flex;align-items:center;justify-content:space-between;">
            <div style="font-size:13px;font-weight:600;color:#0f172a;">
              <span style="font-size:16px;margin-right:6px;">📄</span> ${escapeHtml(doc.name)}
              <span style="font-size:11px;color:#64748b;margin-left:6px;font-weight:400;">(${(doc.size / 1024).toFixed(0)} KB)</span>
            </div>
            <a href="${clickDocUrl}" target="_blank" style="display:inline-block;padding:5px 12px;background:#0284c7;color:#ffffff;text-decoration:none;border-radius:6px;font-size:12px;font-weight:600;">Download</a>
          </div>
        `;
      })
      .join("");

    attachedHtml = `
      <div style="margin-top:16px;padding:16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;">
        <div style="font-size:13px;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">
          📎 Attached Client Documents (${appointment.attachedDocuments.length})
        </div>
        ${docItems}
      </div>
    `;
  }

  return { serviceDetailsRows, textDetails, attachedHtml };
}

// -----------------------------------------------------------------------------
// 1. Admin Email: New Appointment Request (with Approve & Reject CTAs)
// -----------------------------------------------------------------------------
export function renderAdminAppointmentRequestEmail({
  appointment,
  service,
  settings,
  siteUrl
}: {
  appointment: KlxAppointment;
  service: KlxService;
  settings: KlxSettings;
  siteUrl: string;
}): { html: string; text: string; subject: string } {
  const subject = `New Appointment Request: ${service.name} — ${appointment.customerName} (${appointment.requestedDate}) [${appointment.reference}]`;
  const adminToken = appointment.adminToken || "";
  const buildActionUrl = (path: string) => {
    if (!adminToken) return `${siteUrl}${path}`;
    return `${siteUrl}/api/auth/magic?token=${encodeURIComponent(adminToken)}&next=${encodeURIComponent(path)}`;
  };

  const approveUrl = buildActionUrl(
    `/admin/appointments?appointment=${appointment.id}&decision=confirmed`
  );
  const rejectUrl = buildActionUrl(
    `/admin/appointments?appointment=${appointment.id}&decision=declined`
  );
  const dashboardUrl = buildActionUrl(`/admin/appointments`);

  const timeFormatted = formatTimeSlot(appointment.requestedTimeSlot);

  // Build service-specific details
  const { serviceDetailsRows, textDetails, attachedHtml } = buildServiceDetails(
    appointment,
    siteUrl,
    adminToken
  );

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <div style="max-width:600px;margin:24px auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">

    <!-- Luxury Header -->
    <div style="background:linear-gradient(135deg, #0f172a 0%, #14283b 100%);padding:28px 32px;border-bottom:3px solid #38bdf8;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <div style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:0.12em;text-transform:uppercase;">
              KLX <span style="color:#38bdf8;">LUXE</span> PLUS
            </div>
            <div style="font-size:11px;color:#94a3b8;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;margin-top:2px;">
              Executive Client Operations
            </div>
          </td>
          <td align="right">
            <span style="display:inline-block;padding:5px 12px;background:#ef4444;color:#ffffff;border-radius:20px;font-size:10px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;margin-right:6px;">
              🚫 Do Not Reply
            </span>
            <span style="display:inline-block;padding:6px 12px;background:rgba(245,158,11,0.15);border:1px solid #f59e0b;color:#fbbf24;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">
              Pending Review
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Main Body Container -->
    <div style="padding:32px 32px 24px 32px;">

      <!-- Do-Not-Reply Warning Callout -->
      <div style="margin-bottom:20px;padding:14px 18px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="28" style="vertical-align:top;font-size:22px;line-height:1;">⛔</td>
            <td style="vertical-align:top;padding-left:12px;">
              <div style="font-size:12px;font-weight:800;color:#991b1b;text-transform:uppercase;letter-spacing:0.05em;">
                Automated Notification — Direct Replies Blocked
              </div>
              <div style="font-size:13px;color:#7f1d1d;margin-top:3px;line-height:1.4;">
                This message was automatically generated by the booking system. Replies sent to this email address are <strong>unmonitored and blocked</strong>. To approve, reject, or manage this booking without manually entering your credentials, use the one-click options below.
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Subject Card -->
      <div style="margin-bottom:20px;padding:14px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #0284c7;border-radius:10px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">
              Email Subject
            </td>
          </tr>
          <tr>
            <td style="font-size:15px;font-weight:800;color:#0f172a;padding-top:3px;line-height:1.4;">
              ${escapeHtml(subject)}
            </td>
          </tr>
        </table>
      </div>

      <h1 style="margin:0 0 6px 0;font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">
        New Appointment Request
      </h1>
      <p style="margin:0 0 20px 0;font-size:14px;color:#64748b;">
        A new booking request has been submitted and is holding calendar availability. Please review the details below and select your decision:
      </p>

      <!-- Key Booking Banner -->
      <div style="margin-bottom:24px;padding:18px 20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle;">
              <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Service Requested</div>
              <div style="font-size:18px;font-weight:800;color:#0f172a;margin-top:2px;">${escapeHtml(service.name)}</div>
            </td>
            <td align="right" style="vertical-align:middle;">
              <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Reference</div>
              <div style="font-family:monospace;font-size:14px;font-weight:700;color:#0284c7;background:#e0f2fe;padding:3px 10px;border-radius:6px;display:inline-block;margin-top:2px;">
                ${escapeHtml(appointment.reference)}
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Schedule Callout Box -->
      <div style="margin-bottom:24px;padding:16px 20px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="36" style="vertical-align:middle;font-size:24px;">🗓️</td>
            <td style="vertical-align:middle;padding-left:10px;">
              <div style="font-size:12px;font-weight:700;color:#047857;text-transform:uppercase;letter-spacing:0.05em;">Requested Schedule</div>
              <div style="font-size:16px;font-weight:800;color:#064e3b;margin-top:2px;">
                ${escapeHtml(appointment.requestedDate)} at ${escapeHtml(timeFormatted)}
              </div>
              <div style="font-size:12px;color:#047857;margin-top:2px;">
                Timezone: ${escapeHtml(appointment.timezone)} · Expected Duration: ${service.durationMinutes} min
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Client Information Box -->
      <div style="margin-bottom:24px;padding:20px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
        <div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;border-bottom:1px solid #f1f5f9;padding-bottom:6px;">
          👤 Client Contact Information
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;width:120px;">Full Name:</td>
            <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:700;">${escapeHtml(appointment.customerName)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;">Email:</td>
            <td style="padding:6px 0;color:#0284c7;font-size:14px;">
              <a href="mailto:${escapeHtml(appointment.customerEmail)}" style="color:#0284c7;text-decoration:none;font-weight:600;">${escapeHtml(appointment.customerEmail)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;">Phone:</td>
            <td style="padding:6px 0;color:#0f172a;font-size:14px;">
              <a href="tel:${escapeHtml(appointment.customerPhone)}" style="color:#0f172a;text-decoration:none;font-weight:600;">${escapeHtml(appointment.customerPhone)}</a>
            </td>
          </tr>
          ${
            appointment.customerNotes
              ? `
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;vertical-align:top;">Client Notes:</td>
            <td style="padding:6px 0;color:#334155;font-size:13px;line-height:1.5;">${escapeHtml(appointment.customerNotes)}</td>
          </tr>`
              : ""
          }
        </table>
      </div>

      <!-- Service Specifications & Files (if any) -->
      ${
        serviceDetailsRows.length > 0
          ? `
      <div style="margin-bottom:24px;padding:20px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
        <div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;border-bottom:1px solid #f1f5f9;padding-bottom:6px;">
          ⚙️ Service Custom Details
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${serviceDetailsRows.join("")}
        </table>
      </div>`
          : ""
      }

      ${attachedHtml}

      <!-- Call to Action Buttons -->
      <div style="margin-top:32px;padding:24px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;text-align:center;">
        <div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">
          Immediate Action Required
        </div>
        <div style="font-size:13px;color:#64748b;margin-bottom:12px;">
          Approving will confirm the schedule and block the calendar duration. Rejecting will release the reserved time slot.
        </div>
        <div style="margin-bottom:18px;display:inline-block;padding:6px 14px;background:#e0f2fe;border:1px solid #bae6fd;border-radius:20px;font-size:11px;font-weight:700;color:#0369a1;letter-spacing:0.04em;">
          ⚡ One-Click Auto-Login: Clicking any action automatically signs you into your admin workspace.
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="padding-bottom:12px;">
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <!-- Approve Button -->
                  <td style="border-radius:10px;background:#059669;box-shadow:0 4px 12px rgba(5,150,105,0.25);">
                    <a href="${approveUrl}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">
                      ✓ Approve Appointment
                    </a>
                  </td>
                  <td width="16">&nbsp;</td>
                  <!-- Reject Button -->
                  <td style="border-radius:10px;background:#dc2626;box-shadow:0 4px 12px rgba(220,38,38,0.25);">
                    <a href="${rejectUrl}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">
                      ✕ Reject Request
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:8px;">
              <a href="${dashboardUrl}" target="_blank" style="color:#0284c7;font-size:13px;font-weight:600;text-decoration:underline;">
                Open Full Appointments Dashboard (Auto-Login) →
              </a>
            </td>
          </tr>
        </table>
      </div>

    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:24px 32px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;text-align:center;">
      <div style="display:inline-block;padding:6px 14px;background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;color:#991b1b;font-weight:700;font-size:11px;margin-bottom:12px;">
        ⚠️ REPLIES CANNOT BE PROCESSED · DO NOT REPLY DIRECTLY TO THIS EMAIL
      </div>
      <div style="font-weight:700;color:#334155;margin-bottom:4px;">KLX LUXE PLUS LLC</div>
      <div>Support: ${escapeHtml(settings.supportEmail || "support@klxluxeplus.poolpay.space")} · Phone: ${escapeHtml(settings.phone || "+1 (607) 900-4569")}</div>
      <div style="margin-top:8px;color:#94a3b8;font-size:11px;">This automated dispatch was generated by the KLX Luxe Plus booking engine. Direct email replies are blocked.</div>
    </div>

  </div>
</body>
</html>
  `.trim();

  const text = `
============================================================
KLX LUXE PLUS LLC — NEW APPOINTMENT REQUEST
SUBJECT: ${subject}
[DO NOT REPLY — AUTOMATED NOTIFICATION · DIRECT REPLIES BLOCKED]
============================================================

A new appointment booking requires review.

SERVICE: ${service.name}
REFERENCE: ${appointment.reference}
SCHEDULE: ${appointment.requestedDate} at ${timeFormatted} (${appointment.timezone})
EXPECTED DURATION: ${service.durationMinutes} minutes

CLIENT DETAILS:
- Name: ${appointment.customerName}
- Email: ${appointment.customerEmail}
- Phone: ${appointment.customerPhone}
${appointment.customerNotes ? `- Notes: ${appointment.customerNotes}` : ""}

${textDetails.length > 0 ? `DETAILS:\n${textDetails.join("\n")}\n` : ""}
DECISION ACTIONS (ONE-CLICK AUTO-LOGIN):
• APPROVE (Confirm & Block Time):
  ${approveUrl}

• REJECT (Decline & Release Slot):
  ${rejectUrl}

• FULL DASHBOARD (Auto-Login):
  ${dashboardUrl}

*** DO NOT REPLY TO THIS EMAIL ***
Direct email replies to this address are unmonitored and blocked.
All management must be done via the one-click secure links above.

KLX LUXE PLUS LLC · ${settings.supportEmail}
============================================================
  `.trim();

  return { html, text, subject };
}

// -----------------------------------------------------------------------------
// 2. Customer Email: Appointment Request Received (Acknowledgment)
// -----------------------------------------------------------------------------
export function renderCustomerAppointmentReceivedEmail({
  appointment,
  service,
  settings,
  siteUrl
}: {
  appointment: KlxAppointment;
  service: KlxService;
  settings: KlxSettings;
  siteUrl: string;
}): { html: string; text: string; subject: string } {
  const subject = `Appointment Request Received: ${service.name} — KLX LUXE PLUS LLC [${appointment.reference}]`;
  const trackingUrl = `${siteUrl}/appointments/${appointment.token}`;
  const timeFormatted = formatTimeSlot(appointment.requestedTimeSlot);
  const { serviceDetailsRows, textDetails, attachedHtml } = buildServiceDetails(
    appointment,
    siteUrl
  );

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <div style="max-width:600px;margin:24px auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">

    <!-- Luxury Header -->
    <div style="background:linear-gradient(135deg, #0f172a 0%, #14283b 100%);padding:28px 32px;border-bottom:3px solid #38bdf8;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <div style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:0.12em;text-transform:uppercase;">
              KLX <span style="color:#38bdf8;">LUXE</span> PLUS
            </div>
            <div style="font-size:11px;color:#94a3b8;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;margin-top:2px;">
              Executive Professional Services
            </div>
          </td>
          <td align="right">
            <span style="display:inline-block;padding:6px 12px;background:rgba(56,189,248,0.15);border:1px solid #38bdf8;color:#38bdf8;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">
              Request Received
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Main Content -->
    <div style="padding:32px 32px 24px 32px;">

      <!-- Subject Card -->
      <div style="margin-bottom:20px;padding:14px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #0284c7;border-radius:10px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">
              Email Subject
            </td>
          </tr>
          <tr>
            <td style="font-size:15px;font-weight:800;color:#0f172a;padding-top:3px;line-height:1.4;">
              ${escapeHtml(subject)}
            </td>
          </tr>
        </table>
      </div>

      <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#0f172a;">
        Thank you, ${escapeHtml(appointment.customerName)}!
      </h1>
      <p style="margin:0 0 24px 0;font-size:14px;color:#475569;line-height:1.6;">
        We have received your appointment request for <strong>${escapeHtml(service.name)}</strong>. Our administration team is reviewing your schedule and details. You will receive an official confirmation email as soon as your booking is approved.
      </p>

      <!-- Booking Card -->
      <div style="margin-bottom:24px;padding:20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;width:140px;">Booking Reference:</td>
            <td style="padding:6px 0;color:#0284c7;font-size:14px;font-family:monospace;font-weight:700;">${escapeHtml(appointment.reference)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;">Service:</td>
            <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:700;">${escapeHtml(service.name)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;">Requested Date:</td>
            <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${escapeHtml(appointment.requestedDate)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;">Requested Time:</td>
            <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${escapeHtml(timeFormatted)} (${escapeHtml(appointment.timezone)})</td>
          </tr>
          ${serviceDetailsRows.join("")}
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;">Current Status:</td>
            <td style="padding:6px 0;color:#d97706;font-size:13px;font-weight:700;">Awaiting Administrator Confirmation</td>
          </tr>
        </table>
        ${attachedHtml}
      </div>

      <!-- Action Button -->
      <div style="margin:28px 0;text-align:center;">
        <a href="${trackingUrl}" target="_blank" style="display:inline-block;padding:14px 32px;background:#14283b;color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;box-shadow:0 4px 12px rgba(20,40,59,0.25);">
          View Live Appointment Status →
        </a>
      </div>

      <p style="margin:20px 0 0 0;font-size:13px;color:#64748b;line-height:1.5;">
        Need to update your requested time or share additional details? Reply directly to this email or call us at <strong>${escapeHtml(settings.phone || "+1 (607) 900-4569")}</strong>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;text-align:center;">
      <div style="font-weight:700;color:#334155;margin-bottom:4px;">KLX LUXE PLUS LLC</div>
      <div>Support: ${escapeHtml(settings.supportEmail || "support@klxluxeplus.poolpay.space")} · Phone: ${escapeHtml(settings.phone || "+1 (607) 900-4569")}</div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
============================================================
KLX LUXE PLUS LLC — APPOINTMENT REQUEST RECEIVED
SUBJECT: ${subject}
============================================================

Dear ${appointment.customerName},

Thank you for booking with KLX LUXE PLUS LLC. We have received your appointment request for ${service.name}.

REQUESTED SCHEDULE & DETAILS:
- Service: ${service.name}
- Date: ${appointment.requestedDate}
- Time: ${timeFormatted} (${appointment.timezone})
- Reference: ${appointment.reference}
- Status: Awaiting Administrator Confirmation
${textDetails.length > 0 ? textDetails.map((t) => `- ${t}`).join("\n") + "\n" : ""}
You can track your appointment status at any time:
${trackingUrl}

Best regards,
KLX LUXE PLUS LLC
${settings.supportEmail || "support@klxluxeplus.poolpay.space"}
  `.trim();

  return { html, text, subject };
}

// -----------------------------------------------------------------------------
// 3. Customer Email: Appointment Confirmed & Approved (Time Blocked)
// -----------------------------------------------------------------------------
export function renderCustomerAppointmentConfirmedEmail({
  appointment,
  durationMinutes,
  adminNotes,
  settings,
  siteUrl
}: {
  appointment: KlxAppointment;
  durationMinutes: number;
  adminNotes?: string;
  settings: KlxSettings;
  siteUrl: string;
}): { html: string; text: string; subject: string } {
  const timeFormatted = formatTimeSlot(appointment.requestedTimeSlot);
  const subject = `Appointment Confirmed: ${appointment.serviceName} on ${appointment.requestedDate} at ${timeFormatted} — KLX LUXE PLUS LLC [${appointment.reference}]`;
  const trackingUrl = `${siteUrl}/appointments/${appointment.token}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <div style="max-width:600px;margin:24px auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">

    <!-- Luxury Header -->
    <div style="background:linear-gradient(135deg, #064e3b 0%, #047857 100%);padding:28px 32px;border-bottom:3px solid #34d399;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <div style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:0.12em;text-transform:uppercase;">
              KLX <span style="color:#a7f3d0;">LUXE</span> PLUS
            </div>
            <div style="font-size:11px;color:#d1fae5;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;margin-top:2px;">
              Booking Confirmation
            </div>
          </td>
          <td align="right">
            <span style="display:inline-block;padding:6px 14px;background:rgba(255,255,255,0.2);border:1px solid #ffffff;color:#ffffff;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;">
              ✓ Confirmed
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Main Content -->
    <div style="padding:32px 32px 24px 32px;">

      <!-- Subject Card -->
      <div style="margin-bottom:20px;padding:14px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #059669;border-radius:10px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">
              Email Subject
            </td>
          </tr>
          <tr>
            <td style="font-size:15px;font-weight:800;color:#0f172a;padding-top:3px;line-height:1.4;">
              ${escapeHtml(subject)}
            </td>
          </tr>
        </table>
      </div>

      <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#0f172a;">
        Your Appointment is Confirmed!
      </h1>
      <p style="margin:0 0 24px 0;font-size:14px;color:#475569;line-height:1.6;">
        Great news, <strong>${escapeHtml(appointment.customerName)}</strong>. Your appointment has been officially approved and scheduled. We look forward to working with you.
      </p>

      <!-- Confirmed Highlight Card -->
      <div style="margin-bottom:24px;padding:24px;background:#ecfdf5;border:2px solid #10b981;border-radius:14px;text-align:center;">
        <div style="font-size:12px;font-weight:700;color:#047857;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">
          Confirmed Appointment Time
        </div>
        <div style="font-size:22px;font-weight:800;color:#064e3b;margin:4px 0;">
          ${escapeHtml(appointment.requestedDate)} at ${escapeHtml(timeFormatted)}
        </div>
        <div style="font-size:13px;color:#047857;font-weight:600;">
          Duration: ${durationMinutes} Minutes · Timezone: ${escapeHtml(appointment.timezone)}
        </div>
        <div style="margin-top:12px;font-size:12px;color:#065f46;background:#d1fae5;padding:4px 12px;border-radius:20px;display:inline-block;font-weight:600;">
          Reference: ${escapeHtml(appointment.reference)}
        </div>
      </div>

      <!-- Service Summary -->
      <div style="margin-bottom:24px;padding:18px 20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;width:120px;">Service:</td>
            <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:700;">${escapeHtml(appointment.serviceName)}</td>
          </tr>
          ${
            adminNotes
              ? `
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:600;vertical-align:top;">Advisor Note:</td>
            <td style="padding:6px 0;color:#0f172a;font-size:14px;line-height:1.5;">${escapeHtml(adminNotes)}</td>
          </tr>`
              : ""
          }
        </table>
      </div>

      <!-- Action Button -->
      <div style="margin:28px 0;text-align:center;">
        <a href="${trackingUrl}" target="_blank" style="display:inline-block;padding:14px 32px;background:#059669;color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;box-shadow:0 4px 12px rgba(5,150,105,0.3);">
          View Appointment Details →
        </a>
      </div>

      <p style="margin:20px 0 0 0;font-size:13px;color:#64748b;line-height:1.5;">
        Need to reschedule or have questions? Contact us at <strong>${escapeHtml(settings.supportEmail || "support@klxluxeplus.poolpay.space")}</strong> or call <strong>${escapeHtml(settings.phone || "+1 (607) 900-4569")}</strong>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;text-align:center;">
      <div style="font-weight:700;color:#334155;margin-bottom:4px;">KLX LUXE PLUS LLC</div>
      <div>Support: ${escapeHtml(settings.supportEmail || "support@klxluxeplus.poolpay.space")} · Phone: ${escapeHtml(settings.phone || "+1 (607) 900-4569")}</div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
============================================================
KLX LUXE PLUS LLC — APPOINTMENT CONFIRMED
SUBJECT: ${subject}
============================================================

Dear ${appointment.customerName},

Your appointment for ${appointment.serviceName} has been officially confirmed!

CONFIRMED SCHEDULE:
- Date: ${appointment.requestedDate}
- Time: ${timeFormatted} (${appointment.timezone})
- Duration: ${durationMinutes} minutes
- Reference: ${appointment.reference}
${adminNotes ? `- Advisor Note: ${adminNotes}` : ""}

View your appointment details anytime:
${trackingUrl}

Best regards,
KLX LUXE PLUS LLC
${settings.supportEmail || "support@klxluxeplus.poolpay.space"}
  `.trim();

  return { html, text, subject };
}

// -----------------------------------------------------------------------------
// 4. Customer Email: Appointment Declined (Time Slot Released)
// -----------------------------------------------------------------------------
export function renderCustomerAppointmentDeclinedEmail({
  appointment,
  rejectionReason,
  settings,
  siteUrl
}: {
  appointment: KlxAppointment;
  rejectionReason: string;
  settings: KlxSettings;
  siteUrl: string;
}): { html: string; text: string; subject: string } {
  const subject = `Appointment Request Update: ${appointment.serviceName} — KLX LUXE PLUS LLC [${appointment.reference}]`;
  const rebookUrl = `${siteUrl}/#appointments`;
  const timeFormatted = formatTimeSlot(appointment.requestedTimeSlot);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <div style="max-width:600px;margin:24px auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">

    <!-- Luxury Header -->
    <div style="background:linear-gradient(135deg, #1e293b 0%, #334155 100%);padding:28px 32px;border-bottom:3px solid #94a3b8;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <div style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:0.12em;text-transform:uppercase;">
              KLX <span style="color:#38bdf8;">LUXE</span> PLUS
            </div>
            <div style="font-size:11px;color:#cbd5e1;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;margin-top:2px;">
              Schedule Notification
            </div>
          </td>
          <td align="right">
            <span style="display:inline-block;padding:6px 12px;background:rgba(239,68,68,0.15);border:1px solid #ef4444;color:#fca5a5;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">
              Status Update
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Main Content -->
    <div style="padding:32px 32px 24px 32px;">

      <!-- Subject Card -->
      <div style="margin-bottom:20px;padding:14px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #dc2626;border-radius:10px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">
              Email Subject
            </td>
          </tr>
          <tr>
            <td style="font-size:15px;font-weight:800;color:#0f172a;padding-top:3px;line-height:1.4;">
              ${escapeHtml(subject)}
            </td>
          </tr>
        </table>
      </div>

      <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#0f172a;">
        Dear ${escapeHtml(appointment.customerName)},
      </h1>
      <p style="margin:0 0 20px 0;font-size:14px;color:#475569;line-height:1.6;">
        Thank you for your interest in <strong>${escapeHtml(appointment.serviceName)}</strong> with KLX LUXE PLUS LLC. We have reviewed your request for <strong>${escapeHtml(appointment.requestedDate)} at ${escapeHtml(timeFormatted)}</strong>.
      </p>

      <!-- Reason Box -->
      <div style="margin-bottom:24px;padding:20px;background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;">
        <div style="font-size:12px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">
          Note from Administration:
        </div>
        <div style="font-size:14px;color:#7f1d1d;line-height:1.5;">
          ${escapeHtml(rejectionReason || "We are currently unavailable at the requested time slot.")}
        </div>
      </div>

      <p style="margin:0 0 24px 0;font-size:14px;color:#475569;line-height:1.6;">
        We welcome you to choose another available time on our online calendar that fits your schedule, or contact us directly to coordinate alternative arrangements:
      </p>

      <!-- Action Button -->
      <div style="margin:28px 0;text-align:center;">
        <a href="${rebookUrl}" target="_blank" style="display:inline-block;padding:14px 32px;background:#14283b;color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:700;box-shadow:0 4px 12px rgba(20,40,59,0.25);">
          Choose Another Available Time →
        </a>
      </div>

      <p style="margin:20px 0 0 0;font-size:13px;color:#64748b;line-height:1.5;">
        You may also reply directly to this email or call our team at <strong>${escapeHtml(settings.phone || "+1 (607) 900-4569")}</strong>. We apologize for any inconvenience and look forward to assisting you.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;text-align:center;">
      <div style="font-weight:700;color:#334155;margin-bottom:4px;">KLX LUXE PLUS LLC</div>
      <div>Support: ${escapeHtml(settings.supportEmail || "support@klxluxeplus.poolpay.space")} · Phone: ${escapeHtml(settings.phone || "+1 (607) 900-4569")}</div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
============================================================
KLX LUXE PLUS LLC — APPOINTMENT REQUEST UPDATE
SUBJECT: ${subject}
============================================================

Dear ${appointment.customerName},

Thank you for your appointment request for ${appointment.serviceName} on ${appointment.requestedDate} at ${timeFormatted}.

Unfortunately, we are unable to confirm your booking for this specific time.

Reason: ${rejectionReason || "Time slot unavailable."}

Please select another available time on our schedule:
${rebookUrl}

Or reach out directly:
Email: ${settings.supportEmail || "support@klxluxeplus.poolpay.space"}
Phone: ${settings.phone || "+1 (607) 900-4569"}

Best regards,
KLX LUXE PLUS LLC
  `.trim();

  return { html, text, subject };
}
