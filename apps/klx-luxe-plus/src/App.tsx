"use client";

import { useRef, useState } from "react";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { ServiceId } from "@/data/site";

import { About, AppDownload, Contact, Faq, Footer, Header, Hero, Services } from "@/components";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function App() {
  const root = useRef<HTMLDivElement>(null);
  const [service, setService] = useState<ServiceId | "general">("general");
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add(
        "(prefers-reduced-motion: no-preference)",
        () => {
          const intro = gsap.timeline({ defaults: { ease: "power3.out", duration: 1 } });
          intro
            .from(".hero-photo", { scale: 1.06, duration: 1.8 }, 0)
            .from(".hero-enter", { y: 32, autoAlpha: 0, stagger: 0.09 }, 0.15);
          gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
            gsap.from(element, {
              y: 28,
              autoAlpha: 0,
              duration: 0.8,
              ease: "power2.out",
              scrollTrigger: { trigger: element, start: "top 94%", once: true }
            });
          });
          gsap.to(".scroll-progress", {
            scaleX: 1,
            ease: "none",
            scrollTrigger: { start: 0, end: "max", scrub: true }
          });
        },
        root
      );
      return () => media.revert();
    },
    { scope: root }
  );

  return (
    <div ref={root} className="site-root">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="scroll-progress" aria-hidden="true" />
      <Header />
      <main id="main">
        <Hero />
        <Services onSelectService={setService} />
        <About />
        <AppDownload />
        <Contact service={service} onSelectService={setService} />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
