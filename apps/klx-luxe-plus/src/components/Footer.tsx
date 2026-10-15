import { ArrowUpRight, MoveUp } from "lucide-react";

import { COMPANY } from "@/data/site";

import { Brand } from "./Brand";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="section-shell">
        <div className="footer-top">
          <div>
            <Brand />
            <p>
              Luxury in the journey.
              <br />A helping hand in the everyday.
            </p>
          </div>
          <div className="footer-links">
            <a href="#services">
              Our services <ArrowUpRight />
            </a>
            <a href="#about">
              About us <ArrowUpRight />
            </a>
            <a href="#contact">
              Get in touch <ArrowUpRight />
            </a>
            <a href="#download">
              Get PoolPay <ArrowUpRight />
            </a>
          </div>
          <div className="footer-contact">
            <span className="eyebrow">LET&apos;S MAKE IT POSSIBLE</span>
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
            <a href={COMPANY.phones[0].href}>{COMPANY.phones[0].label}</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
          </span>
          <span>TRANSPORTATION & PROFESSIONAL SERVICES</span>
          <a href="#home" aria-label="Back to top">
            <MoveUp />
          </a>
        </div>
      </div>
    </footer>
  );
}
