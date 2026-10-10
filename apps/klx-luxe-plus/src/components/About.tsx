import { ArrowUpRight, Check, MessageCircle } from "lucide-react";

import { Button } from "@repo/ui";

import { COMPANY, SERVICES } from "@/data/site";

import { BrandMark } from "./Brand";

const STEPS = [
  { number: "01", title: "Say hello", text: "Call or email Jean and tell us what you need." },
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
          <div className="about-art" data-reveal aria-hidden="true">
            <div className="orbit orbit-outer" />
            <div className="orbit orbit-inner" />
            <div className="orbit-center">
              <BrandMark />
              <span>THE PLUS IS PERSONAL.</span>
            </div>
            <div className="orbit-icons">
              {SERVICES.map((service) => (
                <div key={service.id} className={`orbit-node orbit-${service.id}`}>
                  <service.icon strokeWidth={1.5} />
                </div>
              ))}
            </div>
            <span className="art-caption">
              <span className="status-dot" /> ONE CONNECTION. MANY POSSIBILITIES.
            </span>
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
              together, with Jean Derival as your point of contact.
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
            <Button asChild size="lg" className="dark-button">
              <a href="#contact">
                Let&apos;s have a conversation <ArrowUpRight />
              </a>
            </Button>
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
