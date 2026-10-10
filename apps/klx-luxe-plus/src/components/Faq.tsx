import { ArrowUpRight, Plus } from "lucide-react";
import { Accordion } from "radix-ui";

import { FAQS } from "@/data/site";

export function Faq() {
  return (
    <section className="section-shell faq-section" aria-labelledby="faq-heading">
      <div data-reveal>
        <p className="eyebrow section-eyebrow">
          <span /> A FEW GOOD QUESTIONS
        </p>
        <h2 id="faq-heading">
          Before we
          <br />
          <span className="text-blue-600">say hello.</span>
        </h2>
        <a href="#contact" className="text-link">
          Have another question? <ArrowUpRight />
        </a>
      </div>
      <Accordion.Root type="single" collapsible className="faq-list" data-reveal>
        {FAQS.map((faq, index) => (
          <Accordion.Item key={faq.question} value={`faq-${index}`} className="faq-item">
            <Accordion.Header>
              <Accordion.Trigger className="faq-trigger">
                {faq.question}
                <Plus />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="faq-content">
              <p>{faq.answer}</p>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </section>
  );
}
