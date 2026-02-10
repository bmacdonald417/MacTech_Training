import { NewGroupForm } from "./new-group-form"

interface NewGroupPageProps {
  params: Promise<{ slug: string }>
}

export default async function NewGroupPage({ params }: NewGroupPageProps) {
  const { slug } = await params
  return <NewGroupForm slug={slug} />
}
