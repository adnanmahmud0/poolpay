import { useState } from "react";

import { ArrowUpRight, Menu, Phone, X } from "lucide-react";
import { Dialog } from "radix-ui";

import { Button } from "@repo/ui";

import { COMPANY } from "@/data/site";

import { Brand } from "./Brand";

const NAVIGATION = [
  { href: "#services", label: "Our services" },
  { href: "#about", label: "About us" },
  { href: "#contact", label: "Get in touch" }
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav aria-label="Main navigation" className="desktop-nav">
          {NAVIGATION.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <Button asChild className="header-cta">
          <a href={COMPANY.phones[0].href}>
            <Phone className="size-3.5" /> Let&apos;s talk <ArrowUpRight />
          </a>
        </Button>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu-trigger"
              aria-label="Open navigation menu"
            >
              <Menu />
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="menu-overlay" />
            <Dialog.Content className="mobile-menu" aria-describedby="mobile-menu-description">
              <Dialog.Title className="sr-only">Navigation menu</Dialog.Title>
              <p id="mobile-menu-description" className="sr-only">
                Explore KLX Luxe Plus services and contact Jean.
              </p>
              <div className="flex items-center justify-between">
                <Brand />
                <Dialog.Close asChild>
                  <Button variant="ghost" size="icon" aria-label="Close navigation menu">
                    <X />
                  </Button>
                </Dialog.Close>
              </div>
              <nav aria-label="Mobile navigation">
                {NAVIGATION.map((link) => (
                  <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
                    {link.label}
                    <ArrowUpRight />
                  </a>
                ))}
              </nav>
              <a href={COMPANY.phones[0].href} className="mobile-menu-phone">
                <Phone />
                {COMPANY.phones[0].label}
              </a>
              <p>One conversation. More possibilities.</p>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}
