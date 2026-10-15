import { redirect } from "next/navigation";

import { Login } from "@/components/admin/Login";
import { currentUser } from "@/server/http";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ setup?: string; next?: string }>;
}) {
  const { setup, next } = await searchParams;
  if (!setup && (await currentUser())) {
    redirect(next && next.startsWith("/admin") ? next : "/admin");
  }
  return <Login setup={setup} next={next} />;
}
