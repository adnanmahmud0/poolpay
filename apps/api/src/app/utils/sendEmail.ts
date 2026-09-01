import nodemailer from "nodemailer";
import { Resend } from "resend";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { emailTemplates, TEmailTemplateName } from "./emailTemplates";
import { Settings } from "../modules/settings/settings.model";

// SMTP Transporter
const smtpTransporter = nodemailer.createTransport({
  host: envVars.EMAIL_SENDER.SMTP_HOST,
  port: Number(envVars.EMAIL_SENDER.SMTP_PORT),
  secure: true,
  auth: {
    user: envVars.EMAIL_SENDER.SMTP_USER,
    pass: envVars.EMAIL_SENDER.SMTP_PASS,
  },
});

// Resend Client
const resendClient = envVars.EMAIL_SENDER.RESEND_API_KEY 
  ? new Resend(envVars.EMAIL_SENDER.RESEND_API_KEY)
  : null;

// SES Client
const sesClient = new SESv2Client({
  region: envVars.AWS.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: envVars.AWS.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: envVars.AWS.AWS_SECRET_ACCESS_KEY || "",
  },
});

const sesTransporter = nodemailer.createTransport({
  SES: { sesClient, SendEmailCommand },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  templateName: TEmailTemplateName;
  templateData?: Record<string, unknown>;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[];
}

export const sendEmail = async ({
  to,
  subject,
  templateName,
  templateData,
  attachments,
}: SendEmailOptions) => {
  try {
    const settings = await Settings.findOne();
    const criticalTemplates: TEmailTemplateName[] = ["verifyEmail", "forgetPassword", "otp", "adminAlert"];

    if (
      settings &&
      !settings.isEmailNotificationEnabled &&
      !criticalTemplates.includes(templateName)
    ) {
      console.log(
        `[NOTIFICATION_DISABLED] Skipping non-critical email (${templateName}) to ${to}`
      );
      return;
    }

    const templateFn = emailTemplates[templateName];
    if (!templateFn) {
      throw new AppError(404, `Template ${templateName} not found`);
    }

    // Call the template function with data
    let html = "";
    if (templateName === "forgetPassword" && templateData) {
      html = (templateFn as (name: string, code: string) => string)(
        templateData.name as string,
        templateData.code as string
      );
    } else if (templateName === "verifyEmail" && templateData) {
      html = (templateFn as (name: string, code: string) => string)(
        templateData.name as string,
        templateData.code as string
      );
    } else if (templateName === "otp" && templateData) {
      html = (templateFn as (name: string, otp: string) => string)(
        templateData.name as string,
        templateData.otp as string
      );
    } else if (templateName === "invoice" && templateData) {
      html = (templateFn as (name: string, amount: string, id: string) => string)(
        templateData.name as string,
        templateData.amount as string,
        templateData.paymentId as string
      );
    } else if (templateName === "paymentReminderEmail" && templateData) {
      html = (templateFn as (name: string, amount: string, groupName: string, deadline: string) => string)(
        templateData.name as string,
        templateData.amount as string,
        templateData.groupName as string,
        templateData.deadline as string
      );
    } else if (templateName === "lateFeeEmail" && templateData) {
      html = (templateFn as (name: string, amount: string, lateFee: string, groupName: string) => string)(
        templateData.name as string,
        templateData.amount as string,
        templateData.lateFee as string,
        templateData.groupName as string
      );
    } else if (templateName === "removalWarningEmail" && templateData) {
      html = (templateFn as (name: string, groupName: string, deadline: string) => string)(
        templateData.name as string,
        templateData.groupName as string,
        templateData.deadline as string
      );
    } else if (templateName === "removalEmail" && templateData) {
      html = (templateFn as (name: string, groupName: string, reason: string) => string)(
        templateData.name as string,
        templateData.groupName as string,
        templateData.reason as string
      );
    } else if (templateName === "adminAlert" && templateData) {
      html = (templateFn as (message: string) => string)(
        templateData.message as string
      );
    } else {
      html = (templateFn as () => string)();
    }

    const fromEmail = envVars.EMAIL_SENDER.SMTP_FORM || "no-reply@yourapp.com";
    const provider = envVars.EMAIL_SENDER.PROVIDER;

    const formattedAttachments = attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.contentType,
    }));

    if (provider === "resend" && resendClient) {
      const resendAttachments = attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
      }));

      const { data, error } = await resendClient.emails.send({
        from: fromEmail,
        to: [to],
        subject: subject,
        html: html,
        attachments: resendAttachments,
      });

      if (error) {
        throw new Error(error.message);
      }
      console.log(`\u2709\uFE0F Email sent to ${to} via Resend: ${data?.id}`);
    } else if (provider === "ses") {
      const info = await sesTransporter.sendMail({
        from: fromEmail,
        to: to,
        subject: subject,
        html: html,
        attachments: formattedAttachments,
      });
      console.log(`\u2709\uFE0F Email sent to ${to} via SES: ${info.messageId}`);
    } else {
      // default: smtp
      const info = await smtpTransporter.sendMail({
        from: fromEmail,
        to: to,
        subject: subject,
        html: html,
        attachments: formattedAttachments,
      });
      console.log(`\u2709\uFE0F Email sent to ${to} via SMTP: ${info.messageId}`);
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.log("email sending error: ", err.message);
    throw new AppError(401, "Email Error!");
  }
};
