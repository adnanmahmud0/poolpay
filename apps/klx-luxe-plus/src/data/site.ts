import {
  CarFront,
  ChartNoAxesCombined,
  FileCheck2,
  Languages,
  Laptop,
  ReceiptText
} from "lucide-react";

export const COMPANY = {
  name: "KLX LUXE PLUS LLC",
  contact: "KLX LUXE PLUS LLC",
  email: "support@poolpay.space",
  phones: [{ label: "+1 (607) 900-4569", href: "tel:+16079004569" }]
} as const;

export const SERVICES = [
  {
    id: "taxes",
    number: "01",
    name: "Tax services",
    shortName: "Taxes",
    icon: ReceiptText,
    description:
      "Take the next step with your taxes. Reach out to discuss your situation, documents, and professional filing preparation.",
    action: "Schedule tax consultation",
    category: "MAKE IT MANAGEABLE",
    isVisible: true
  },
  {
    id: "immigration",
    number: "02",
    name: "Immigration document assistance",
    shortName: "Immigration documents",
    icon: FileCheck2,
    description:
      "Get reliable assistance with preparing, organizing, and filing your immigration paperwork and petition packages.",
    action: "Discuss your documents",
    category: "YOUR NEXT CHAPTER",
    isVisible: true
  },
  {
    id: "translations",
    number: "03",
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
    id: "transport",
    number: "04",
    name: "Luxury transportation",
    shortName: "Transportation",
    icon: CarFront,
    description:
      "Make the journey part of the occasion. Connect with our team to discuss your transportation needs and arrange your next ride.",
    action: "Let's plan your ride",
    category: "GO SOMEWHERE GOOD",
    isVisible: true
  },
  {
    id: "finance",
    number: "05",
    name: "Finance agent services",
    shortName: "Finance",
    icon: ChartNoAxesCombined,
    description:
      "Have a financial question or a next step in mind? Start a conversation about the finance agent services available to you.",
    action: "Discuss your needs",
    category: "MOVE FORWARD",
    isVisible: false
  },
  {
    id: "computer",
    number: "06",
    name: "Computer support",
    shortName: "Computer support",
    icon: Laptop,
    description:
      "Computer issues getting in the way? Tell us what's happening so we can discuss the help you need.",
    action: "Get computer help",
    category: "GET BACK TO IT",
    isVisible: false
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
      "Yes. KLX LUXE PLUS LLC provides specialized services across taxes, immigration documentation, translations, and transportation. Mention all required services when you get in touch."
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
