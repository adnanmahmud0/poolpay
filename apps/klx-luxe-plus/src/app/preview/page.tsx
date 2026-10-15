import { redirect } from "next/navigation";

import { PublicSite } from "@/components/PublicSite";
import { currentUser } from "@/server/http";
import { publicData } from "@/server/public-data";

export const metadata = { title: "Private preview", robots: { index: false, follow: false } };
export default async function Preview() {
  if (!(await currentUser())) redirect("/admin/login");
  return <PublicSite {...await publicData(true)} preview />;
}
