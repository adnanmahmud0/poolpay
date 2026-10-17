import Image from "next/image";

import { ArrowUpRight, Check, MessageCircle } from "lucide-react";

import { InteractiveHoverButton } from "@repo/ui";

import { COMPANY, SERVICES } from "@/data/site";

const STEPS = [
  { number: "01", title: "Say hello", text: "Call or email our team and tell us what you need." },
  {
    number: "02",
    title: "Talk it through",
    text: "Discuss the details, availability, and pricing."
  },
  { number: "03", title: "Take the next step", text: "Agree on a plan and move forward together." }
];

export function About() {
  return (
    <section id="about" className="about-section" aria-labelledby="about-heading">
      <div className="section-shell">
        <div className="about-grid">
          <div className="about-art about-photo-wrap" data-reveal aria-hidden="true">
            <Image
              src="/images/about-portrait.jpg"
              alt="KLX LUXE PLUS professional standing beside a luxury sedan"
              width={900}
              height={675}
              className="about-portrait-img"
              loading="lazy"
            />
            <div className="about-portrait-badge">
              <span className="status-dot" />
              <span>ONE CONNECTION. MANY POSSIBILITIES.</span>
            </div>
            <div className="about-portrait-services">
              {SERVICES.filter((s) => s.isVisible).map((service) => (
                <span key={service.id} className="about-service-chip">
                  <service.icon strokeWidth={1.5} className="size-3" />
                  {service.shortName}
                </span>
              ))}
            </div>
          </div>
          <div className="about-copy" data-reveal>
            <p className="eyebrow section-eyebrow">
              <span /> MEET THE PLUS IN YOUR EVERYDAY
            </p>
            <h2 id="about-heading">
              Different needs.
              <br />
              The same
              <br />
              <span className="text-blue-600">personal touch.</span>
            </h2>
            <p>Life doesn&apos;t fit into one category. Neither do we.</p>
            <p>
              KLX LUXE PLUS LLC brings luxury transportation and practical professional services
              together, with dedicated personal assistance as your point of contact.
            </p>
            <p>
              Whether you&apos;re planning a journey or working through your to-do list, start with
              a conversation about what matters to you.
            </p>
            <div className="about-person">
              <span className="person-monogram">JD</span>
              <div>
                <strong>{COMPANY.contact}</strong>
                <span>Your contact at KLX LUXE PLUS LLC</span>
              </div>
              <MessageCircle />
            </div>
            <InteractiveHoverButton href="#contact" className="mt-2 text-xs">
              Let&apos;s have a conversation
            </InteractiveHoverButton>
          </div>
        </div>
        <div className="steps-heading" data-reveal>
          <span className="eyebrow">FROM HELLO TO WHAT&apos;S NEXT</span>
          <span>
            <Check /> Getting started is simple.
          </span>
        </div>
        <div className="steps-grid">
          {STEPS.map((step) => (
            <div key={step.number} className="step" data-reveal>
              <span className="step-number">{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
              <ArrowUpRight />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
