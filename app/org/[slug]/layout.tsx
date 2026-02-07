import OrgLayout from "@/components/layout/org-layout"

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  return <OrgLayout params={params}>{children}</OrgLayout>
}
