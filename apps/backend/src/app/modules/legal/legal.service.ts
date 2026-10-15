import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { LegalPolicy } from "./legal.model";
import { ILegalPolicy } from "./legal.interface";
import logger from "../../utils/logger";

const DEFAULT_POLICIES: {
  slug: string;
  title: string;
  summary: string;
  content: string;
  version: string;
}[] = [
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    summary:
      "How PoolPay collects, uses, protects, and discloses your personal and financial information.",
    version: "1.0.0",
    content: `## 1. Information We Collect
We collect information you provide directly to us when you create an account, participate in group pools, make payments, request payouts, or communicate with our support team.

- **Account Information:** Name, email address, phone number, and password.
- **Identity & Compliance Information:** Date of birth, residential address, government ID (where legally mandated for KYC/AML compliance).
- **Financial & Payment Information:** Payment card details and bank account numbers are tokenized and processed securely via PCI-DSS compliant providers such as Stripe.
- **Usage & Device Information:** IP addresses, browser/device types, operating system details, and interaction logs.

## 2. How We Use Your Information
We use the information we collect to:
- Create, manage, and secure your PoolPay account.
- Facilitate group savings pools (ROSCAs), track scheduled contributions, and automate pot disbursements.
- Process transactions, prevent fraudulent activities, and maintain internal audit records.
- Send administrative updates, contribution reminders, and security alerts.
- Comply with applicable financial regulations, AML laws, and reporting obligations.

## 3. Sharing and Disclosure
We respect your privacy and never sell your personal information. We may disclose your information:
- **With Group Members:** Your display name, membership tier, and contribution status are visible to members of shared pools.
- **With Service Providers:** Trusted partners providing cloud hosting (AWS), payment processing (Stripe), email delivery, and SMS notifications under confidentiality agreements.
- **For Legal Compliance:** When required by subpoena, court order, or applicable law to protect our rights or the safety of users.

## 4. Data Security
We implement industry-standard administrative, technical, and physical safeguards, including 256-bit TLS encryption in transit and AES encryption at rest, to protect against unauthorized access, loss, or alteration.

## 5. Your Rights and Choices
You have the right to access, correct, export, or request deletion of your personal data. You may also adjust your notification preferences within your app settings. For complete data deletion requests, refer to our Data Deletion policy.

## 6. Contact Us
For questions or concerns regarding this Privacy Policy, please contact our Data Protection Officer at:
- **Email:** privacy@poolpay.space / support@poolpay.space
- **Phone:** +1 (607) 900-4569`,
  },
  {
    slug: "terms-and-conditions",
    title: "Terms & Conditions",
    summary:
      "User agreement and binding terms governing participation in PoolPay pools and services.",
    version: "1.0.0",
    content: `## 1. Acceptance of Terms
By accessing or using PoolPay (the "Platform"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to all terms, you must not access or use the Platform.

## 2. Platform Nature & Disclaimer
**PoolPay is a financial collaboration technology platform, not a chartered bank or deposit institution.** We provide software tools to organize, schedule, and automate peer-to-peer rotating savings and credit associations (ROSCAs/pools). Funds transferred through the platform are processed by regulated payment partners (such as Stripe).

## 3. Eligibility & Account Responsibilities
- You must be at least 18 years old and legally competent to enter into binding agreements.
- You agree to provide accurate, complete, and updated registration details.
- You are solely responsible for maintaining the confidentiality of your account credentials.

## 4. Group Pool Participation & Obligations
- **Binding Contribution Commitment:** By joining a pool, you irrevocably commit to paying your scheduled contribution amounts on or before each designated cycle deadline.
- **Late Contributions & Penalties:** Failure to pay contributions by the scheduled date may result in automated late fees, temporary account restrictions, or adverse impact on your internal reputation rating.
- **Payout Disbursement:** Pot payouts are issued according to the predetermined group schedule and verified payment method.

## 5. Fees & Charges
PoolPay may assess transaction fees or platform service fees as displayed prior to transaction confirmation. All applicable platform and creator commissions are clearly itemized in the group summary before you join.

## 6. Prohibited Activities
You agree not to use PoolPay for:
- Any unlawful purpose, money laundering, or terrorist financing.
- Operating unregulated pyramid schemes or fraudulent investment arrangements.
- Attempting to exploit, bypass, or reverse engineer platform security or payment flows.

## 7. Termination
We reserve the right to suspend or terminate accounts that breach these Terms or exhibit patterns of suspicious or fraudulent behavior.

## 8. Governing Law
These Terms shall be governed by and construed in accordance with the applicable laws of the operating jurisdiction, without regard to conflict of law principles.`,
  },
  {
    slug: "cookie-policy",
    title: "Cookie Policy",
    summary:
      "Details on how cookies, local storage, and similar tracking technologies are used.",
    version: "1.0.0",
    content: `## 1. What Are Cookies?
Cookies are small text files placed on your device by websites and mobile web views to store user preferences, enable essential functionalities, and gather analytics data.

## 2. Categories of Cookies We Use
- **Strictly Necessary Cookies:** Essential for platform operation, authentication sessions, and security verification. The platform cannot function properly without these.
- **Functional Cookies:** Remember your settings, such as theme preferences, language, and selected currency.
- **Performance & Analytics Cookies:** Help us understand how visitors interact with the dashboard and public pages so we can measure performance and optimize usability.

## 3. Managing Your Cookie Preferences
Most web browsers allow you to control cookies through their settings. You can set your browser to refuse cookies or alert you when cookies are being sent. Note that disabling strictly necessary cookies may prevent you from accessing dashboard features.

## 4. Updates to This Policy
We may periodically update this Cookie Policy to reflect technical or legal modifications. Updates will be reflected with an updated revision date at the top of this page.`,
  },
  {
    slug: "data-deletion",
    title: "Data Deletion Instructions",
    summary:
      "Step-by-step instructions for requesting complete account and personal data erasure.",
    version: "1.0.0",
    content: `## How to Request Account and Data Deletion
PoolPay respects your right to have your personal data erased in accordance with GDPR, CCPA, and applicable privacy regulations.

### Option 1: In-App Account Deletion
1. Open the PoolPay mobile application.
2. Navigate to **Profile** ➔ **Settings** ➔ **Security & Privacy**.
3. Tap **Delete Account**.
4. Confirm your choice with your account password.

### Option 2: Email Deletion Request
If you cannot access the app, you can submit a deletion request directly to our security team:
1. Send an email to **privacy@poolpay.space** from the email address registered with your PoolPay account.
2. Include the subject line: \`Data Erasure Request - [Your Full Name]\`.
3. Our compliance team will verify your identity and process the deletion within 30 business days.

### Retention Exceptions
Note that certain transaction logs and KYC audit data must be retained for mandatory statutory periods under applicable anti-money laundering (AML) and financial recordkeeping laws.`,
  },
  {
    slug: "sms-consent",
    title: "SMS & Communication Consent",
    summary:
      "Terms and conditions governing SMS, WhatsApp, and automated notification alerts.",
    version: "1.0.0",
    content: `## 1. Program Description
By providing your mobile phone number to PoolPay, you consent to receive transactional and account-related text messages (SMS) and WhatsApp notifications.

## 2. Message Types & Frequency
Messages include:
- Account authentication codes (2FA / OTP).
- Group pool contribution reminders and upcoming draw deadlines.
- Pot payout confirmations and security alerts.
Message frequency varies based on your active group participation and account activity.

## 3. Opt-Out Instructions
You may opt out of non-critical marketing or reminder text messages at any time by replying **STOP** to any text message received, or by disabling SMS notifications under **Settings ➔ Notifications** in the app.

## 4. Support & Assistance
Reply **HELP** for support or contact our support team at **support@poolpay.space**. Standard message and data rates may apply depending on your mobile carrier.`,
  },
];

/**
 * Bootstrap / Seed default policies if none exist
 */
const seedDefaultPolicies = async () => {
  try {
    for (const policyData of DEFAULT_POLICIES) {
      const existing = await LegalPolicy.findOne({ slug: policyData.slug });
      if (!existing) {
        await LegalPolicy.create({
          ...policyData,
          isPublished: true,
        });
        logger.info(`[LegalService] Seeded default policy: ${policyData.slug}`);
      }
    }
  } catch (error) {
    logger.error(`[LegalService] Failed to seed default policies: ${error}`);
  }
};

/**
 * Get all published legal policies (or all policies for admin)
 */
const getAllPolicies = async (includeUnpublished = false) => {
  // Ensure defaults exist
  const count = await LegalPolicy.countDocuments();
  if (count === 0) {
    await seedDefaultPolicies();
  }

  const query = includeUnpublished ? {} : { isPublished: true };
  return await LegalPolicy.find(query)
    .sort({ createdAt: 1 })
    .populate("updatedBy", "fullName email")
    .lean();
};

/**
 * Get a specific legal policy by slug
 */
const getPolicyBySlug = async (slug: string, includeUnpublished = false) => {
  const normalizedSlug = slug.toLowerCase().trim();
  let policy = await LegalPolicy.findOne({
    slug: normalizedSlug,
    ...(includeUnpublished ? {} : { isPublished: true }),
  })
    .populate("updatedBy", "fullName email")
    .lean();

  // If missing, check if it's one of our defaults and seed it
  if (!policy) {
    const defaultDef = DEFAULT_POLICIES.find((p) => p.slug === normalizedSlug);
    if (defaultDef) {
      const created = await LegalPolicy.create({
        ...defaultDef,
        isPublished: true,
      });
      policy = created.toObject();
    } else {
      throw new AppError(
        httpStatus.NOT_FOUND,
        `Policy with slug '${slug}' not found.`
      );
    }
  }

  return policy;
};

/**
 * Update or create a legal policy by slug (Admin protected)
 */
const updatePolicy = async (
  slug: string,
  payload: Partial<ILegalPolicy>,
  userId?: string
) => {
  const normalizedSlug = slug.toLowerCase().trim();

  const updateData: Record<string, unknown> = {
    ...payload,
    slug: normalizedSlug,
    updatedAt: new Date(),
  };

  if (userId) {
    updateData.updatedBy = userId;
  }

  const policy = await LegalPolicy.findOneAndUpdate(
    { slug: normalizedSlug },
    { $set: updateData },
    { new: true, upsert: true, runValidators: true }
  )
    .populate("updatedBy", "fullName email")
    .lean();

  logger.info(
    `[LegalService] Updated legal policy '${normalizedSlug}' by user '${userId || "system"}'`
  );
  return policy;
};

export const LegalService = {
  getAllPolicies,
  getPolicyBySlug,
  updatePolicy,
  seedDefaultPolicies,
};
