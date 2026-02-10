import OrgLayout from "@/components/layout/org-layout"

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const resolved = await params
  return <OrgLayout params={resolved}>{children}</OrgLayout>
}
