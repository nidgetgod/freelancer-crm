import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ProjectForm } from '@/components/projects/project-form'

async function getProject(id: string, userId: string) {
  return prisma.project.findFirst({
    where: { id, userId },
  })
}

async function getClients(userId: string) {
  return prisma.client.findMany({
    where: { userId, archivedAt: null },
    select: { id: true, name: true, company: true },
    orderBy: { name: 'asc' },
  })
}

export default async function EditProjectPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const [project, clients] = await Promise.all([
    getProject(params.id, session.user.id),
    getClients(session.user.id),
  ])

  if (!project) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${project.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">編輯專案</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
      </div>

      <ProjectForm 
        project={{
          ...project,
          budget: project.budget ? Number(project.budget) : null,
          hourlyRate: project.hourlyRate ? Number(project.hourlyRate) : null,
        }}
        clients={clients} 
      />
    </div>
  )
}
