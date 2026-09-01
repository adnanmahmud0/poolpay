export const emailTemplates = {
  forgetPassword: (name: string, code: string) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f9; }
        .wrapper { width: 100%; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { background-color: #1a73e8; padding: 30px; text-align: center; color: #ffffff; }
        .content { padding: 40px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 13px; color: #777; border-top: 1px solid #eee; }
        h1 { margin: 0; font-size: 24px; letter-spacing: 0.5px; }
        h2 { color: #1a73e8; margin-top: 0; }
        p { margin-bottom: 20px; color: #555; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>Password Security</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hello <strong>${name}</strong>,</p>
            <p>We received a request to reset the password associated with your account. If you made this request, please use the following 6-digit code to reset your password:</p>
            <div style="text-align: center; font-size: 32px; font-weight: bold; color: #1a73e8; letter-spacing: 10px; margin: 30px 0; background: #f8f9fa; padding: 20px; border-radius: 8px;">
              ${code}
            </div>
            <p style="margin-top: 30px; font-size: 14px; color: #888;">This code will expire in 10 minutes for your security. If you didn't request this change, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} POOLPAY. All rights reserved.<br>
            Made with excellence.
          </div>
        </div>
      </div>
    </body>
    </html>
  `,

  otp: (name: string, otp: string) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f0f2f5; }
        .wrapper { width: 100%; padding: 40px 0; }
        .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .header { background-color: #111827; padding: 30px; text-align: center; color: #ffffff; }
        .content { padding: 40px; text-align: center; }
        .otp-box { background-color: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 12px; padding: 20px; margin: 30px 0; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111827; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
        h1 { margin: 0; font-size: 22px; font-weight: 600; }
        p { color: #4b5563; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>Verification Required</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>To complete your authentication, please use the following one-time password (OTP):</p>
            <div class="otp-box">${otp}</div>
            <p style="font-size: 14px;">This code is valid for <strong>2 minutes</strong>. Please do not share this code with anyone.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} POOLPAY. Secure Auth System.
          </div>
        </div>
      </div>
    </body>
    </html>
  `,

  invoice: (name: string, amount: string, paymentId: string) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0; }
        .wrapper { width: 100%; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .header { background-color: #111827; padding: 40px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em; }
        .content { padding: 40px; }
        .status-badge { display: inline-block; padding: 6px 12px; background-color: #ecfdf5; color: #059669; border-radius: 9999px; font-size: 14px; font-weight: 600; margin-bottom: 24px; }
        .details-box { background-color: #f3f4f6; border-radius: 12px; padding: 24px; margin-bottom: 32px; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
        .detail-label { color: #6b7280; }
        .detail-value { color: #111827; font-weight: 600; }
        .amount-highlight { border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 16px; font-size: 20px; font-weight: 700; color: #10b981; }
        .footer { padding: 30px; text-align: center; font-size: 13px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
        .cta-button { display: inline-block; padding: 12px 24px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>PoolPay</h1>
            <p style="margin-top: 8px; color: #9ca3af; font-size: 14px;">Membership Receipt</p>
          </div>
          <div class="content">
            <div class="status-badge">Payment Successful</div>
            <p>Hello <strong>${name}</strong>,</p>
            <p>Thank you for choosing PoolPay! Your membership payment has been processed successfully. You can find your receipt details below and a downloadable PDF copy is attached to this email.</p>
            
            <div class="details-box">
              <div class="detail-row">
                <span class="detail-label">Transaction ID:</span>
                <span class="detail-value">${paymentId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date().toLocaleDateString()}</span>
              </div>
              <div class="amount-highlight">
                <span style="color: #6b7280; font-size: 16px; font-weight: 400;">Total Paid:</span>
                <span style="float: right;">${amount}</span>
              </div>
            </div>

            <p style="font-size: 14px; color: #6b7280;">If you have any questions regarding this charge, please don't hesitate to contact our support team.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} PoolPay. All rights reserved.<br>
            Silicon Valley, CA • support@poolpay.com
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
  verifyEmail: (name: string, code: string) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f9; }
        .wrapper { width: 100%; padding: 40px 0; }
        .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { background-color: #10b981; padding: 30px; text-align: center; color: #ffffff; }
        .content { padding: 40px; text-align: center; }
        .code-box { background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 30px 0; font-size: 32px; font-weight: 700; letter-spacing: 10px; color: #059669; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 13px; color: #777; border-top: 1px solid #eee; }
        h1 { margin: 0; font-size: 24px; }
        p { color: #555; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>Thank you for registering! Please use the 4-digit code below to verify your email address:</p>
            <div class="code-box">${code}</div>
            <p style="font-size: 14px; color: #888;">This code will expire in 10 minutes. If you didn't create an account, you can ignore this email.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} POOLPAY. All rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
  `,

  paymentReminderEmail: (name: string, amount: string, groupName: string, deadline: string) => `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif;">
      <h2>Payment Reminder</h2>
      <p>Hello ${name},</p>
      <p>This is a reminder that your contribution of <strong>$${amount}</strong> for the group <strong>${groupName}</strong> is due.</p>
      <p>Please complete your payment by <strong>${deadline}</strong> to avoid late fees.</p>
      <p>Thank you!</p>
    </body>
    </html>
  `,

  lateFeeEmail: (name: string, amount: string, lateFee: string, groupName: string) => `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif;">
      <h2>Late Fee Applied</h2>
      <p>Hello ${name},</p>
      <p>Your payment for <strong>${groupName}</strong> was not received within the grace period.</p>
      <p>A late fee of <strong>$${lateFee}</strong> has been applied to your balance of $${amount}.</p>
      <p>Total due: <strong>$${(Number(amount) + Number(lateFee)).toFixed(2)}</strong></p>
      <p>Please pay as soon as possible to avoid removal from the group.</p>
    </body>
    </html>
  `,

  removalWarningEmail: (name: string, groupName: string, deadline: string) => `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif;">
      <h2 style="color: #d9534f;">FINAL WARNING: Removal in 24 Hours</h2>
      <p>Hello ${name},</p>
      <p>This is your final warning regarding your missed payment for <strong>${groupName}</strong>.</p>
      <p>If the payment is not completed by <strong>${deadline}</strong>, you will be automatically removed from the group.</p>
      <p>Please take action immediately to retain your position in the group.</p>
    </body>
    </html>
  `,

  removalEmail: (name: string, groupName: string, reason: string) => `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif;">
      <h2 style="color: #d9534f;">Membership Removed</h2>
      <p>Hello ${name},</p>
      <p>We regret to inform you that you have been removed from the group <strong>${groupName}</strong>.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>If you believe this is an error, please contact the group administrator.</p>
    </body>
    </html>
  `,
  adminAlert: (message: string) => `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif;">
      <h2 style="color: #d9534f;">⚠️ URGENT: Admin System Alert</h2>
      <p>Dear Administrator,</p>
      <p>${message}</p>
      <p>Please log in to the admin dashboard to take immediate action.</p>
      <hr>
      <p style="font-size: 12px; color: #888;">System generated alert from PoolPay Backend.</p>
    </body>
    </html>
  `,
};

export type TEmailTemplateName = keyof typeof emailTemplates;
