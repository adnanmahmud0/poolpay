import { useState } from "react";
import Image from "next/image";

import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CarFront,
  Check,
  Pause,
  Play,
  Sparkles
} from "lucide-react";

import { BorderBeam, Button, Marquee } from "@repo/ui";

import { SERVICES } from "@/data/site";

import type { SiteContentData } from "@/server/db/types";

export function Hero({ content }: { content?: SiteContentData["hero"] } = {}) {
  const [ribbonPaused, setRibbonPaused] = useState(false);
  return (
    <>
      <section id="home" className="hero" aria-labelledby="hero-heading">
        <figure className="hero-visual">
          <Image
            className="hero-photo hero-photo-zoom"
            src="/images/hero-luxury-car.jpg"
            alt="Cinematic black Mercedes-Maybach parked on a palm-lined hotel driveway at blue hour"
            width={1920}
            height={1080}
            loading="eager"
            fetchPriority="high"
          />
          <figcaption className="sr-only">
            Illustrative transportation image; vehicle availability is confirmed directly with our
            team.
          </figcaption>
        </figure>
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow hero-enter">
            <span className="status-dot" /> {content?.badge || "LUXURY MEETS EVERYDAY POSSIBILITY"}
          </p>
          <h1 id="hero-heading">
            <span className="hero-line">
              <span className="hero-enter">
                A little more <em>luxe.</em>
              </span>
            </span>
            <span className="hero-line">
              <span className="hero-enter">A lot more</span>
            </span>
            <span className="hero-line">
              <span className="hero-enter text-sky-200">possible.</span>
            </span>
          </h1>
          <p className="hero-description hero-enter">
            {content?.subtitle ||
              "From the journey you take to the next step in life. Transportation and professional services, all through one personal connection."}
          </p>
          <div className="hero-actions hero-enter">
            <Button asChild size="lg" className="light-button shimmer">
              <a href={content?.ctaHref || "#services"}>
                {content?.ctaText || "Explore our services"} <ArrowUpRight />
              </a>
            </Button>
            <a className="hero-contact" href={content?.secondaryCtaHref || "#appointments"}>
              {content?.secondaryCtaText || "Request an appointment"} <ArrowRight />
            </a>
          </div>
          <div className="hero-note hero-enter">
            <Check /> Six services. One point of contact.
          </div>
        </div>
        <div className="hero-floating hero-enter">
          <span className="floating-icon">
            <CarFront />
          </span>
          <div>
            <span className="eyebrow">THE JOURNEY MATTERS</span>
            <p>Arrive with a little more luxe.</p>
          </div>
          <Sparkles className="size-4 text-sky-200" />
          <BorderBeam duration={10} />
        </div>
        <div className="hero-stat-widget hero-enter">
          <div className="hero-stat-item">
            <span className="hero-stat-num">6</span>
            <span className="hero-stat-label">Services</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat-item">
            <span className="hero-stat-num">1</span>
            <span className="hero-stat-label">Contact</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat-item">
            <span className="status-dot" style={{ marginBottom: 0 }} />
            <span className="hero-stat-label">Available</span>
          </div>
        </div>
        <div className="hero-bottom">
          <a href="#services">
            <span className="scroll-cue">
              <ArrowDown />
            </span>{" "}
            SCROLL TO DISCOVER
          </a>
          <span>
            KLX LUXE PLUS LLC <span className="text-sky-300">✦</span> MORE THAN ONE WAY TO HELP
          </span>
        </div>
      </section>
      <div className="service-ribbon" aria-label="Our six service areas">
        <Marquee paused={ribbonPaused}>
          {SERVICES.map((service) => (
            <span key={service.id} className="ribbon-item">
              <service.icon />
              {service.shortName}
              <span className="ribbon-star" aria-hidden="true">
                ✦
              </span>
            </span>
          ))}
        </Marquee>
        <Button
          className="ribbon-control"
          variant="ghost"
          size="icon"
          aria-label={ribbonPaused ? "Play service ribbon" : "Pause service ribbon"}
          aria-pressed={ribbonPaused}
          onClick={() => setRibbonPaused(!ribbonPaused)}
        >
          {ribbonPaused ? <Play /> : <Pause />}
        </Button>
      </div>
    </>
  );
}
