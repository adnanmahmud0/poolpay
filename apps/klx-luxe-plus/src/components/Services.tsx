import Image from "next/image";

import { ArrowDownRight, ArrowUpRight, MoveUpRight } from "lucide-react";

import { BorderBeam, cn } from "@repo/ui";

import { SERVICES, type ServiceId } from "@/data/site";

const SERVICE_IMAGES: Record<string, string | null> = {
  taxes: "/images/service-tax.jpg",
  immigration: "/images/service-immigration.jpg",
  translations: "/images/service-translation.jpg",
  transport: null, // uses its own image system
  finance: "/images/service-finance.jpg",
  computer: "/images/service-computer.jpg"
};

export function Services({ onSelectService }: { onSelectService: (service: ServiceId) => void }) {
  return (
    <section
      id="services"
      className="section-shell services-section"
      aria-labelledby="services-heading"
    >
      <div className="section-heading" data-reveal>
        <div>
          <p className="eyebrow section-eyebrow">
            <span /> THOUGHTFUL SERVICES. REAL-LIFE NEEDS.
          </p>
          <h2 id="services-heading">
            Life moves.
            <br />
            Let&apos;s make it <span className="text-blue-600">easier.</span>
          </h2>
        </div>
        <div className="heading-aside">
          <p>
            A ride to remember. Paperwork to finish.
            <br />A problem to solve. We&apos;re a conversation away.
          </p>
          <ArrowDownRight />
        </div>
      </div>
      <div className="services-grid">
        {SERVICES.map((service) => {
          const serviceImage = SERVICE_IMAGES[service.id];
          return (
            <article
              key={service.id}
              data-reveal
              className={cn(
                "service-card",
                service.id === "transport" && "transport-card",
                service.id === "immigration" && "immigration-card",
                serviceImage && service.id !== "transport" && "has-lifestyle-image"
              )}
            >
              {service.id === "transport" && (
                <>
                  <Image
                    src="/images/hero-luxury-car.jpg"
                    alt=""
                    loading="lazy"
                    width={1920}
                    height={1080}
                    className="transport-card-image"
                  />
                  <div className="transport-card-shade" />
                </>
              )}
              {serviceImage && service.id !== "transport" && (
                <div className="service-card-image-wrap">
                  <Image
                    src={serviceImage}
                    alt=""
                    loading="lazy"
                    width={800}
                    height={600}
                    className="service-card-lifestyle-img"
                  />
                  <div className="service-card-image-shade" />
                </div>
              )}
              <div className="service-card-top">
                <span className="service-icon">
                  <service.icon strokeWidth={1.5} />
                </span>
                <span className="service-number">/{service.number}</span>
              </div>
              <div className="service-card-content">
                <p className="eyebrow service-category">{service.category}</p>
                <h3>{service.name}</h3>
                <p className="service-description">{service.description}</p>
                <a
                  href="#contact"
                  className="service-link"
                  onClick={() => onSelectService(service.id)}
                >
                  {service.action}
                  <ArrowUpRight />
                </a>
              </div>
              {service.id === "immigration" && (
                <div className="document-art" aria-hidden="true">
                  <div className="document-sheet">
                    <span className="document-lines" />
                    <span className="document-lines" />
                    <span className="document-lines short-line" />
                    <service.icon />
                    <span className="document-stamp">
                      YOUR NEXT CHAPTER <MoveUpRight />
                    </span>
                  </div>
                </div>
              )}
              {service.id === "transport" && <BorderBeam duration={12} size={150} />}
            </article>
          );
        })}
      </div>
      <p className="services-footnote" data-reveal>
        Not sure where to start?{" "}
        <a href="#contact">
          Tell us what you have in mind <ArrowUpRight />
        </a>
      </p>
    </section>
  );
}
