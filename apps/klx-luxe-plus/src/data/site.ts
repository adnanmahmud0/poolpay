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
  contact: "Jean Derival",
  email: "klxluxeplus@gmail.com",
  phones: [
    { label: "(407) 776-1969", href: "tel:+14077761969" },
    { label: "(772) 307-1003", href: "tel:+17723071003" }
  ]
} as const;

export const SERVICES = [
  {
    id: "transport",
    number: "01",
    name: "Luxury transportation",
    shortName: "Transportation",
    icon: CarFront,
    description:
      "Make the journey part of the occasion. Connect with Jean to discuss your transportation needs and arrange your next ride.",
    action: "Let's plan your ride",
    category: "GO SOMEWHERE GOOD"
  },
  {
    id: "finance",
    number: "02",
    name: "Finance agent services",
    shortName: "Finance",
    icon: ChartNoAxesCombined,
    description:
      "Have a financial question or a next step in mind? Start a conversation about the finance agent services available to you.",
    action: "Discuss your needs",
    category: "MOVE FORWARD"
  },
  {
    id: "computer",
    number: "03",
    name: "Computer support",
    shortName: "Computer support",
    icon: Laptop,
    description:
      "Computer issues getting in the way? Tell us what's happening so we can discuss the help you need.",
    action: "Get computer help",
    category: "GET BACK TO IT"
  },
  {
    id: "taxes",
    number: "04",
    name: "Tax services",
    shortName: "Taxes",
    icon: ReceiptText,
    description:
      "Take the next step with your taxes. Reach out to discuss your situation, documents, and service needs.",
    action: "Talk about your taxes",
    category: "MAKE IT MANAGEABLE"
  },
  {
    id: "translations",
    number: "05",
    name: "Translations",
    shortName: "Translations",
    icon: Languages,
    description:
      "Words should open doors. Contact Jean about your documents and the languages you need translated.",
    action: "Ask about translations",
    category: "BRIDGE THE GAP"
  },
  {
    id: "immigration",
    number: "06",
    name: "Immigration document assistance",
    shortName: "Immigration documents",
    icon: FileCheck2,
    description:
      "Get assistance with preparing and filing your immigration documents. Start by discussing the paperwork you need help with.",
    action: "Discuss your documents",
    category: "YOUR NEXT CHAPTER"
  }
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];

export const FAQS = [
  {
    question: "How do I get started?",
    answer:
      "Call Jean Derival at (407) 776-1969 or (772) 307-1003, or email klxluxeplus@gmail.com. Share the service you need and a few details, and discuss the next steps directly."
  },
  {
    question: "Can I ask about more than one service?",
    answer:
      "Yes. KLX LUXE PLUS LLC offers six service areas. Let Jean know everything you would like to discuss when you get in touch."
  },
  {
    question: "Where are services available?",
    answer:
      "Contact Jean to confirm the service area and availability for your specific request, especially when arranging transportation."
  },
  {
    question: "How can I find out about pricing?",
    answer:
      "Pricing depends on the service and your needs. Contact Jean with the details of your request to discuss scope, availability, and pricing before proceeding."
  }
] as const;

export function inquiryLink(service: string) {
  const subject = encodeURIComponent(`Service inquiry: ${service}`);
  const body = encodeURIComponent(
    `Hello Jean,\n\nI'm interested in ${service.toLowerCase()}.\n\nHere are a few details about what I need:\n\n\nMy preferred contact information:\n\nThank you!`
  );
  return `mailto:${COMPANY.email}?subject=${subject}&body=${body}`;
}
