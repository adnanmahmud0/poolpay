import { Login } from "@/components/admin/Login";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ setup?: string; next?: string }>;
}) {
  const { setup, next } = await searchParams;
  return <Login setup={setup} next={next} />;
}
