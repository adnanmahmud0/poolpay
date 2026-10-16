"use client";

import Image from "next/image";

import { Quote, Star } from "lucide-react";

const TESTIMONIALS = [
  {
    id: "t1",
    quote:
      "The KLX Luxe Plus team handled all my immigration paperwork with patience and precision. I didn't have to worry about a single form — everything came back organized and filed correctly. Truly a lifesaver.",
    name: "Maria C.",
    role: "Immigration Document Client",
    initial: "MC",
    rating: 5
  },
  {
    id: "t2",
    quote:
      "The luxury transportation was immaculate. The ride was smooth, the vehicle spotless, and our chauffeur was punctual to the minute. You feel the care and professionalism from the moment you step in.",
    name: "David R.",
    role: "Luxury Transportation Client",
    initial: "DR",
    rating: 5
  },
  {
    id: "t3",
    quote:
      "I needed certified translations urgently and KLX Luxe Plus delivered — accurate, fast, and accepted by every agency I submitted to. A calm, reliable partner when stakes are high.",
    name: "Anita F.",
    role: "Translation Services Client",
    initial: "AF",
    rating: 5
  }
];

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="testimonials-section"
      aria-labelledby="testimonials-heading"
    >
      <div className="testimonials-bg" aria-hidden="true" />
      <div className="testimonials-overlay" aria-hidden="true" />
      <div className="section-shell relative z-10">
        <div className="testimonials-header" data-reveal>
          <p className="eyebrow testimonials-eyebrow">
            <span className="testimonials-dot" /> TRUSTED BY REAL CLIENTS
          </p>
          <h2 id="testimonials-heading" className="testimonials-heading">
            What our clients
            <br />
            <span className="testimonials-accent">are saying.</span>
          </h2>
        </div>
        <div className="testimonials-grid">
          {TESTIMONIALS.map((t) => (
            <article key={t.id} className="testimonial-card" data-reveal>
              <Quote className="testimonial-quote-icon" />
              <div className="testimonial-stars" aria-label={`${t.rating} out of 5 stars`}>
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="testimonial-star" />
                ))}
              </div>
              <p className="testimonial-text">{t.quote}</p>
              <div className="testimonial-author">
                <span className="testimonial-avatar">{t.initial}</span>
                <div>
                  <strong className="testimonial-name">{t.name}</strong>
                  <span className="testimonial-role">{t.role}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
