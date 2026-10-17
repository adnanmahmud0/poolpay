import { ArrowDown, ArrowUpRight, ChevronDown, Mail, Phone, Sparkles } from "lucide-react";

import { BorderBeam, InteractiveHoverButton } from "@repo/ui";

import { COMPANY, inquiryLink, SERVICES, type ServiceId } from "@/data/site";

export function Contact({
  service,
  onSelectService
}: {
  service: ServiceId | "general";
  onSelectService: (service: ServiceId | "general") => void;
}) {
  const selectedService = SERVICES.find((item) => item.id === service)?.name ?? "your services";
  return (
    <section
      id="contact"
      className="contact-section section-shell"
      aria-labelledby="contact-heading"
    >
      <div className="contact-panel">
        <div className="contact-copy" data-reveal>
          <p className="eyebrow">
            <span className="status-dot" /> YOUR NEXT STEP STARTS HERE
          </p>
          <h2 id="contact-heading">
            Something
            <br />
            on your mind?
            <br />
            <span>Let&apos;s talk.</span>
            <Sparkles aria-hidden="true" />
          </h2>
          <p>
            A question, a plan, or a little help getting started.
            <br />
            Jean is your first point of contact.
          </p>
          <span className="contact-signature">A little more care. A little more possible.</span>
        </div>
        <div className="contact-details" data-reveal>
          <div className="contact-person">
            <span className="person-monogram">JD</span>
            <div>
              <h3>Connect with Jean</h3>
              <p>KLX LUXE PLUS LLC</p>
            </div>
            <ArrowDown />
          </div>
          <div className="contact-method">
            <span className="contact-method-icon">
              <Phone />
            </span>
            <div>
              <span className="eyebrow">GIVE US A CALL</span>
              {COMPANY.phones.map((phone) => (
                <a key={phone.href} href={phone.href}>
                  {phone.label}
                  <ArrowUpRight />
                </a>
              ))}
            </div>
          </div>
          <div className="contact-method email-method">
            <span className="contact-method-icon">
              <Mail />
            </span>
            <div>
              <span className="eyebrow">DROP US A LINE</span>
              <a href={`mailto:${COMPANY.email}`}>
                {COMPANY.email}
                <ArrowUpRight />
              </a>
            </div>
          </div>
          <div className="inquiry-picker">
            <label htmlFor="service-choice">What can we help you with?</label>
            <div className="select-wrap">
              <select
                id="service-choice"
                value={service}
                onChange={(event) => onSelectService(event.target.value as ServiceId | "general")}
              >
                <option value="general">I&apos;d like to know more</option>
                {SERVICES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" />
            </div>
            <InteractiveHoverButton
              href={inquiryLink(selectedService)}
              className="h-11 w-full border border-white/30 bg-white text-xs font-semibold text-slate-900 shadow-sm hover:border-sky-400"
              dotClassName="bg-sky-600"
              hoverTextClassName="text-white"
            >
              Email Jean
            </InteractiveHoverButton>
            <p>Opens your email app with your service inquiry ready to edit.</p>
          </div>
        </div>
        <BorderBeam duration={14} size={200} />
      </div>
    </section>
  );
}
