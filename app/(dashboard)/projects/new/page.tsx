import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ProjectForm } from '@/components/projects/project-form'

async function getClients(userId: string) {
  return prisma.client.findMany({
    where: { userId, archivedAt: null },
    select: { id: true, name: true, company: true },
    orderBy: { name: 'asc' },
  })
}

export default async function NewProjectPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const clients = await getClients(session.user.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">新增專案</h1>
          <p className="text-muted-foreground">建立新的專案</p>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">
            建立專案前請先新增客戶
          </p>
          <Link href="/clients/new">
            <Button>新增客戶</Button>
          </Link>
        </div>
      ) : (
        <ProjectForm clients={clients} />
      )}
    </div>
  )
}
