import { KlxService, KlxSettings, SiteContentData } from "./types";

export const DEFAULT_SITE_CONTENT: SiteContentData = {
  hero: {
    title: "KLX LUXE PLUS LLC",
    subtitle: "A little more luxe. A lot more possible.",
    badge: "POOLPAY & PROFESSIONAL SERVICES",
    ctaText: "Explore our services",
    ctaHref: "#services",
    secondaryCtaText: "Request an appointment",
    secondaryCtaHref: "#appointments"
  },
  poolpay: {
    title: "Your groups. Wherever you go.",
    subtitle: "The Modern ROSCA & Tontine Mobile App",
    description:
      "Bring your circle together with PoolPay. Create or join a group, see its status, and keep the details close — all from your phone.",
    googlePlayUrl:
      "https://play.google.com/store/apps/details?id=com.poolpay.rosca&pcampaignid=web_share",
    appStoreComingSoon: true,
    appStoreUrl: "",
    logoUrl: "/images/poolpay/logo.png",
    screenshotUrl: "/images/poolpay/groups.webp",
    features: [
      "Create a group",
      "Join your circle",
      "See your group status",
      "Available now on Google Play, coming soon to iOS"
    ]
  },
  about: {
    title: "About KLX LUXE PLUS LLC",
    subtitle: "Precision, Reliability, and Discretion",
    story: [
      "KLX LUXE PLUS LLC provides dependable professional services and premium customer assistance designed around your individual schedule and requirements.",
      "Contact our team about taxes, immigration documents, translations, or transportation. We will discuss your needs, availability, and next steps.",
      "One point of contact for the practical things that help your day move forward."
    ],
    stats: [
      { label: "Personal assistance", value: "One connection" },
      { label: "Specialized Services", value: "4 Core Areas" },
      { label: "Timezone Alignment", value: "US Eastern (ET)" },
      { label: "Community Commitment", value: "PoolPay Ecosystem" }
    ]
  },
  faqs: [
    {
      question: "How do I get started?",
      answer:
        "Submit an appointment request through our online form, call us at +1 (607) 900-4569, or email support@poolpay.space. Share the service you need and your preferred appointment time, and our team will confirm your booking."
    },
    {
      question: "Can I request more than one service?",
      answer:
        "Yes. KLX LUXE PLUS LLC provides assistance across taxes, immigration documentation, translation, and luxury transportation. You can mention multiple services in your request notes."
    },
    {
      question: "How does appointment confirmation work?",
      answer:
        "When you request a time online, our administration verifies availability against our schedule in America/New_York (US Eastern Time) and sends an email confirmation or alternative suggestions."
    },
    {
      question: "How does pricing and payment work?",
      answer:
        "Depending on the service, pricing may be quoted on request, fixed-fee, or require a deposit. Once scope is reviewed, we issue a secure payment link powered by Stripe for seamless card or mobile checkout."
    },
    {
      question: "What is your refund policy?",
      answer:
        "Refunds can be requested according to our cancellation and refund policies. Approved refunds are processed directly back to your original payment method via Stripe."
    }
  ],
  footer: {
    description:
      "KLX LUXE PLUS LLC — Professional services, luxury transportation, and community financial technology.",
    copyright: "© 2026 KLX LUXE PLUS LLC. All rights reserved."
  },
  sectionOrder: ["poolpay", "services", "about", "appointments", "faqs"],
  sectionVisibility: {
    poolpay: true,
    services: true,
    about: true,
    appointments: true,
    faqs: true
  },
  policies: {
    privacy: `# Privacy Policy\n\n**Effective Date:** October 14, 2026\n\nKLX LUXE PLUS LLC ("we," "our," or "us") respects your privacy. This policy outlines how we handle information collected on our website (https://klxluxeplus.poolpay.space).\n\n### Information We Collect\n- **Appointment Details:** Your name, email address, phone number, and service inquiries.\n- **Payment Information:** Processed securely through Stripe. We do not store full credit card numbers on our servers.\n\n### Use of Information\nWe use your information solely to deliver services, schedule appointments, process payments, and communicate regarding your requests.\n\n### Contact\nFor questions, contact support@poolpay.space or call +1 (607) 900-4569.`,
    terms: `# Terms of Service\n\n**Effective Date:** October 14, 2026\n\nBy accessing or using the services provided by KLX LUXE PLUS LLC, you agree to these Terms of Service.\n\n### Services\nKLX LUXE PLUS LLC provides professional document assistance, tax support, translations, luxury transportation, and community savings software partnerships.\n\n### Booking & Payment\nAppointment requests are subject to confirmation. Invoices and quotes issued must be settled per stated payment terms.\n\n### Contact\nFor inquiries, contact support@poolpay.space.`,
    cancellation: `# Cancellation Policy\n\n**Effective Date:** October 14, 2026\n\nWe understand that schedules change. To cancel or reschedule an appointment without penalty, please provide notice at least 24 hours in advance.\n\n### Notice Procedure\nContact support@poolpay.space or call +1 (607) 900-4569 with your appointment reference number.`,
    refund: `# Refund Policy\n\n**Effective Date:** October 14, 2026\n\n### Service Inquiries & Deposits\nDeposits for scheduled services may be eligible for a refund if cancellation notice is received prior to service commencement in accordance with our cancellation policy.\n\n### Refund Processing\nApproved refunds are issued to the original payment method through Stripe within 5–10 business days.\n\nFor refund assistance, contact support@poolpay.space.`
  }
};

// Policies remain unpublished until the owner supplies and reviews the business terms.
DEFAULT_SITE_CONTENT.policies = { privacy: "", terms: "", cancellation: "", refund: "" };

export const DEFAULT_SERVICES: Omit<KlxService, "_id">[] = [
  {
    id: "svc_tax",
    serviceId: "taxes",
    number: "01",
    name: "Tax services",
    shortName: "Taxes",
    category: "MAKE IT MANAGEABLE",
    description:
      "Take the next step with your taxes. Reach out to discuss your situation, documents, and professional filing preparation.",
    action: "Schedule tax consultation",
    pricingMode: "quote",
    priceCents: 0,
    depositCents: 0,
    durationMinutes: 60,
    isVisible: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "svc_immigration",
    serviceId: "immigration",
    number: "02",
    name: "Immigration document assistance",
    shortName: "Immigration documents",
    category: "YOUR NEXT CHAPTER",
    description:
      "Get reliable assistance with preparing, organizing, and filing your immigration paperwork and petition packages.",
    action: "Discuss your documents",
    pricingMode: "quote",
    priceCents: 0,
    depositCents: 0,
    durationMinutes: 60,
    isVisible: true,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "svc_translation",
    serviceId: "translations",
    number: "03",
    name: "Translations",
    shortName: "Translations",
    category: "BRIDGE THE GAP",
    description:
      "Accurate multilingual document translations for official, legal, educational, and business correspondence.",
    action: "Request a translation",
    pricingMode: "quote",
    priceCents: 0,
    depositCents: 0,
    durationMinutes: 45,
    isVisible: true,
    sortOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "svc_transport",
    serviceId: "transport",
    number: "04",
    name: "Luxury transportation",
    shortName: "Transportation",
    category: "GO SOMEWHERE GOOD",
    description:
      "Elevate your journey with punctual, executive-class private transportation tailored to your itinerary.",
    action: "Reserve luxury ride",
    pricingMode: "quote",
    priceCents: 0,
    depositCents: 0,
    durationMinutes: 90,
    isVisible: true,
    sortOrder: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const DEFAULT_SETTINGS: Omit<KlxSettings, "_id"> = {
  siteTitle: "KLX LUXE PLUS LLC",
  supportEmail: "support@poolpay.space",
  ownerEmail: "support@poolpay.space",
  phone: "+1 (607) 900-4569",
  timezone: "America/New_York",
  currency: "usd",
  seoTitle: "KLX LUXE PLUS LLC | PoolPay & Professional Services",
  seoDescription:
    "Explore PoolPay and contact KLX LUXE PLUS LLC for taxes, immigration document assistance, translations and transportation.",
  socialImageUrl: "/images/klx-social-card.png",
  scheduling: {
    workingDays: [0, 1, 2, 3, 4, 5, 6],
    blockedDates: [],
    openingTime: "",
    closingTime: ""
  },
  policies: {
    privacy: DEFAULT_SITE_CONTENT.policies.privacy,
    terms: DEFAULT_SITE_CONTENT.policies.terms,
    cancellation: DEFAULT_SITE_CONTENT.policies.cancellation,
    refund: DEFAULT_SITE_CONTENT.policies.refund
  },
  notificationSettings: {
    emailOnRequest: true,
    emailOnConfirm: true,
    emailOnPayment: true,
    emailOnRefund: true
  },
  updatedAt: new Date()
};
