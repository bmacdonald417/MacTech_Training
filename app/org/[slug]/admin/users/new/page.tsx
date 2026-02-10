import { NewUserForm } from "./new-user-form"

interface NewUserPageProps {
  params: Promise<{ slug: string }>
}

export default async function NewUserPage({ params }: NewUserPageProps) {
  const { slug } = await params
  return <NewUserForm slug={slug} />
}
