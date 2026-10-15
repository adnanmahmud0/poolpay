import Link from "next/link";
import { notFound } from "next/navigation";

import { publicData } from "@/server/public-data";

export const dynamic = "force-dynamic";
export default async function Policy({ params }: { params: Promise<{ policy: string }> }) {
  const { policy } = await params;
  const { content } = await publicData();
  if (!["privacy", "terms", "cancellation", "refund"].includes(policy)) notFound();
  const body = content.policies[policy as keyof typeof content.policies];
  if (!body) notFound();
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-sky-700">
        ← Back to KLX LUXE PLUS LLC
      </Link>
      <h1 className="mt-12 text-4xl font-semibold capitalize">{policy} policy</h1>
      <div className="mt-8 text-sm leading-8 whitespace-pre-wrap text-slate-600">{body}</div>
    </main>
  );
}
