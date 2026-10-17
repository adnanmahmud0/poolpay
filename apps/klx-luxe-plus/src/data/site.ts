import {
  Building2,
  CarFront,
  ChartNoAxesCombined,
  FileCheck2,
  Languages,
  Laptop,
  ReceiptText,
  Speech
} from "lucide-react";

export const COMPANY = {
  name: "KLX LUXE PLUS LLC",
  contact: "KLX LUXE PLUS LLC",
  email: "support@klxluxeplus.poolpay.space",
  phones: [{ label: "+1 (607) 900-4569", href: "tel:+16079004569" }]
} as const;

export const SERVICES = [
  {
    id: "transport",
    number: "01",
    name: "Luxury Transportation",
    shortName: "Luxury Transportation",
    icon: CarFront,
    description:
      "Elevate your journey with punctual, executive-class private transportation. Enter your pickup & drop-off locations, select your vehicle, and reserve your ride with ease.",
    action: "Let's plan your ride",
    category: "GO SOMEWHERE GOOD",
    isVisible: true
  },
  {
    id: "finance",
    number: "02",
    name: "Finance Agent",
    shortName: "Finance Agent",
    icon: ChartNoAxesCombined,
    description:
      "Have a financial question or a next step in mind? Start a conversation about the finance agent services available to you.",
    action: "Discuss your needs",
    category: "MOVE FORWARD",
    isVisible: true
  },
  {
    id: "computer",
    number: "03",
    name: "Fix your Computer Issues",
    shortName: "Fix your Computer Issues",
    icon: Laptop,
    description:
      "Computer issues getting in the way? Tell us what's happening so we can troubleshoot and discuss the help you need.",
    action: "Get computer help",
    category: "GET BACK TO IT",
    isVisible: true
  },
  {
    id: "taxes",
    number: "04",
    name: "Taxes",
    shortName: "Taxes",
    icon: ReceiptText,
    description:
      "Take the next step with your taxes. Reach out to discuss your situation, documents, and professional filing preparation.",
    action: "Schedule tax consultation",
    category: "MAKE IT MANAGEABLE",
    isVisible: true
  },
  {
    id: "translations",
    number: "05",
    name: "Translations",
    shortName: "Translations",
    icon: Languages,
    description:
      "Accurate multilingual document translations for official, legal, educational, and business correspondence.",
    action: "Ask about translations",
    category: "BRIDGE THE GAP",
    isVisible: true
  },
  {
    id: "immigration",
    number: "06",
    name: "File your Immigrations Documents",
    shortName: "File your Immigrations Documents",
    icon: FileCheck2,
    description:
      "Get reliable assistance with preparing, organizing, and filing your immigration paperwork and petition packages.",
    action: "Discuss your documents",
    category: "YOUR NEXT CHAPTER",
    isVisible: true
  },
  {
    id: "interpreter",
    number: "07",
    name: "Interpreter Services",
    shortName: "Interpreter Services",
    icon: Speech,
    description:
      "Certified and professional spoken interpretation for legal depositions, court hearings, USCIS asylum interviews, medical appointments, and business conferences.",
    action: "Book an interpreter",
    category: "SPOKEN CLARITY",
    isVisible: true
  },
  {
    id: "real_estate",
    number: "08",
    name: "Real Estate",
    shortName: "Real Estate",
    icon: Building2,
    description:
      "Expert guidance for residential and commercial real estate. Buy, sell, lease, or consult with trusted advisors on your next property transaction.",
    action: "Discuss real estate",
    category: "PROPERTY & INVESTMENT",
    isVisible: true
  }
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];

export const FAQS = [
  {
    question: "How do I get started?",
    answer:
      "Submit an appointment request through our online booking form, call +1 (607) 900-4569, or email support@poolpay.space. Share the service you need and a few details to confirm next steps."
  },
  {
    question: "Can I ask about more than one service?",
    answer:
      "Yes. KLX LUXE PLUS LLC provides specialized services across taxes, immigration documentation, translations, interpreter services, real estate, and luxury transportation. Mention all required services when you get in touch."
  },
  {
    question: "Where are services available?",
    answer:
      "Contact our team to confirm service areas, scheduling, and vehicle availability for transportation requests across our business operating zones."
  },
  {
    question: "How can I find out about pricing?",
    answer:
      "Pricing depends on the specific service and project scope. Contact us or request a consultation to review requirements and receive an upfront quote."
  }
] as const;

export function inquiryLink(service: string) {
  const subject = encodeURIComponent(`Service inquiry: ${service}`);
  const body = encodeURIComponent(
    `Hello KLX LUXE PLUS team,\n\nI'm interested in ${service.toLowerCase()}.\n\nHere are a few details about what I need:\n\n\nMy preferred contact information:\n\nThank you!`
  );
  return `mailto:${COMPANY.email}?subject=${subject}&body=${body}`;
}
