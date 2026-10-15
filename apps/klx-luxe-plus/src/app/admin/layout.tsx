import type { ReactNode } from "react";

export const metadata = {
  title: "Administration | KLX LUXE PLUS LLC",
  robots: { index: false, follow: false }
};
export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
