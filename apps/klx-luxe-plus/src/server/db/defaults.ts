import {
  KlxAdvertisement,
  KlxService,
  KlxSettings,
  SiteContentData,
  TransportationPricingConfig
} from "./types";

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
      "Contact our team about luxury transportation, finance agency, computer technical support, taxes, translations, immigration document filing, professional interpreter services, or real estate advisory. We will discuss your needs, availability, and next steps.",
      "One point of contact for the practical things that help your day move forward."
    ],
    stats: [
      { label: "Personal assistance", value: "One connection" },
      { label: "Specialized Services", value: "8 Core Areas" },
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
        "Yes. KLX LUXE PLUS LLC provides assistance across luxury transportation, finance agency, computer technical support, taxes, translations, and immigration documents. You can mention multiple services in your request notes."
    },
    {
      question: "How do interpretation and translation services work?",
      answer:
        "For translation, you can select your language pair, specify your translation reason (such as immigration, court, or academic), and securely attach documents like birth or marriage certificates directly on our website. For interpretation, select your language pair and setting (court, USCIS, medical, or remote) to book certified spoken interpreters."
    },
    {
      question: "How does transportation booking and payment work?",
      answer:
        "Enter your pickup and drop-off locations, choose your preferred vehicle tier (Executive Sedan, Luxury SUV, or VIP Sprinter), and pay securely online through Stripe or submit your itinerary for dispatch confirmation."
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
    id: "svc_transport",
    serviceId: "transport",
    number: "01",
    name: "Luxury Transportation",
    shortName: "Luxury Transportation",
    category: "GO SOMEWHERE GOOD",
    description:
      "Elevate your journey with punctual, executive-class private transportation. Enter your pickup & drop-off locations, select your vehicle, and reserve your ride with ease.",
    action: "Let's plan your ride",
    pricingMode: "quote",
    priceCents: 0,
    depositCents: 0,
    durationMinutes: 90,
    isVisible: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "svc_finance",
    serviceId: "finance",
    number: "02",
    name: "Finance Agent",
    shortName: "Finance Agent",
    category: "MOVE FORWARD",
    description:
      "Have a financial question or a next step in mind? Start a conversation about the finance agent services available to you.",
    action: "Discuss your needs",
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
    id: "svc_computer",
    serviceId: "computer",
    number: "03",
    name: "Fix your Computer Issues",
    shortName: "Fix your Computer Issues",
    category: "GET BACK TO IT",
    description:
      "Computer issues getting in the way? Tell us what's happening so we can troubleshoot and discuss the help you need.",
    action: "Get computer help",
    pricingMode: "quote",
    priceCents: 0,
    depositCents: 0,
    durationMinutes: 60,
    isVisible: true,
    sortOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "svc_tax",
    serviceId: "taxes",
    number: "04",
    name: "Taxes",
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
    sortOrder: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "svc_translation",
    serviceId: "translations",
    number: "05",
    name: "Translations",
    shortName: "Translations",
    category: "BRIDGE THE GAP",
    description:
      "Accurate multilingual document translations for official, legal, educational, and business correspondence.",
    action: "Ask about translations",
    pricingMode: "quote",
    priceCents: 0,
    depositCents: 0,
    durationMinutes: 45,
    isVisible: true,
    sortOrder: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "svc_immigration",
    serviceId: "immigration",
    number: "06",
    name: "File your Immigrations Documents",
    shortName: "File your Immigrations Documents",
    category: "YOUR NEXT CHAPTER",
    description:
      "Get reliable assistance with preparing, organizing, and filing your immigration paperwork and petition packages.",
    action: "Discuss your documents",
    pricingMode: "quote",
    priceCents: 0,
    depositCents: 0,
    durationMinutes: 60,
    isVisible: true,
    sortOrder: 6,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "svc_interpreter",
    serviceId: "interpreter",
    number: "07",
    name: "Interpreter Services",
    shortName: "Interpreter Services",
    category: "SPOKEN CLARITY",
    description:
      "Certified and professional spoken interpretation for legal depositions, court hearings, USCIS asylum interviews, and medical appointments.",
    action: "Book an interpreter",
    pricingMode: "quote",
    priceCents: 0,
    depositCents: 0,
    durationMinutes: 60,
    isVisible: true,
    sortOrder: 7,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "svc_real_estate",
    serviceId: "real_estate",
    number: "08",
    name: "Real Estate",
    shortName: "Real Estate",
    category: "PROPERTY & INVESTMENT",
    description:
      "Expert guidance for residential and commercial real estate. Buy, sell, lease, or consult with trusted advisors on your next property transaction.",
    action: "Discuss real estate",
    pricingMode: "quote",
    priceCents: 0,
    depositCents: 0,
    durationMinutes: 60,
    isVisible: true,
    sortOrder: 8,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const DEFAULT_TRANSPORTATION_PRICING: TransportationPricingConfig = {
  unit: "mile",
  longDistanceThreshold: 10, // 10 miles
  tiers: {
    executive_sedan: {
      basePriceCents: 2000, // $20.00 base
      pricePerKmCents: 450, // $4.50 / mile (first 10 miles)
      reducedPricePerKmCents: 155, // $1.55 / mile (after 10 miles, aligned with UberX)
      longDistanceDiscountPercent: 66
    },
    luxury_suv: {
      basePriceCents: 3000, // $30.00 base
      pricePerKmCents: 480, // $4.80 / mile (first 10 miles)
      reducedPricePerKmCents: 185, // $1.85 / mile (after 10 miles, aligned with UberXL)
      longDistanceDiscountPercent: 61
    },
    vip_sprinter: {
      basePriceCents: 5000, // $50.00 base
      pricePerKmCents: 600, // $6.00 / mile (first 10 miles)
      reducedPricePerKmCents: 250, // $2.50 / mile (after 10 miles, group luxury van)
      longDistanceDiscountPercent: 58
    }
  }
};

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
  transportationPricing: DEFAULT_TRANSPORTATION_PRICING,
  updatedAt: new Date()
};

export const DEFAULT_ADVERTISEMENTS: Omit<KlxAdvertisement, "_id">[] = [
  {
    id: "ad_poolpay_hero",
    title: "PoolPay — Modern ROSCA & Group Savings Mobile App",
    imageUrl: "/images/klx-social-card.png",
    destinationUrl: "https://klxluxeplus.poolpay.space/#poolpay",
    altText:
      "Download PoolPay App on Google Play for transparent group savings and financial circles",
    placement: "after_hero",
    priority: 10,
    isActive: true,
    startDate: null,
    endDate: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "ad_klx_consultation",
    title: "KLX Luxe Plus — 1-on-1 Taxes, Immigration & Document Consultation",
    imageUrl: "/images/klx-social-card.png",
    destinationUrl: "https://klxluxeplus.poolpay.space/#appointments",
    altText: "Schedule a personalized consultation with KLX Luxe Plus specialists",
    placement: "after_services",
    priority: 5,
    isActive: true,
    startDate: null,
    endDate: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
