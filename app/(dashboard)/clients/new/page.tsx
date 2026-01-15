import { ClientForm } from '@/components/clients/client-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clients">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">新增客戶</h1>
          <p className="text-muted-foreground">建立新的客戶資料</p>
        </div>
      </div>

      {/* Form */}
      <ClientForm mode="create" />
    </div>
  )
}
