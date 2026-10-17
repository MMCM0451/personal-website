import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RiftApp from "../rift-app";
import QuickMode from "../quick-mode";

const views = [
  "dashboard",
  "draft",
  "build",
  "history",
  "settings",
  "quick",
] as const;
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ section: [] }, ...views.slice(1).map((v) => ({ section: [v] }))];
}
export const metadata: Metadata = {
  title: "Rift Lab · Max Ma",
  description:
    "A local-first Wild Rift draft and build companion. Transparent rules, visible picks, and patch-specific plans.",
  robots: { index: false, follow: false },
};
export default async function RiftPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const { section } = await params;
  const view = section?.[0] ?? "dashboard";
  if (
    (section?.length ?? 0) > 1 ||
    !views.includes(view as (typeof views)[number])
  )
    notFound();
  if (view === "quick") return <QuickMode />;
  return <RiftApp view={view as Exclude<(typeof views)[number], "quick">} />;
}
