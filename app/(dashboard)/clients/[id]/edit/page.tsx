import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ClientForm } from '@/components/clients/client-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface EditClientPageProps {
  params: { id: string }
}

async function getClient(id: string, userId: string) {
  const client = await prisma.client.findFirst({
    where: { id, userId },
    include: {
      tags: { include: { tag: true } },
    },
  })

  if (!client) return null

  return {
    ...client,
    tags: client.tags.map(t => t.tag),
  }
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const session = await auth()
  if (!session?.user?.id) return null

  const client = await getClient(params.id, session.user.id)
  if (!client) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/clients/${params.id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">編輯客戶</h1>
          <p className="text-muted-foreground">{client.name}</p>
        </div>
      </div>

      {/* Form */}
      <ClientForm client={client as any} mode="edit" />
    </div>
  )
}
