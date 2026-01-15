'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeleteClient, useArchiveClient } from '@/hooks/use-clients'
import { MoreHorizontal, Archive, Trash2, FileText, FolderPlus } from 'lucide-react'
import Link from 'next/link'

interface ClientActionsProps {
  clientId: string
  clientName: string
}

export function ClientActions({ clientId, clientName }: ClientActionsProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const deleteClient = useDeleteClient()
  const archiveClient = useArchiveClient()

  const handleDelete = async () => {
    await deleteClient.mutateAsync(clientId)
    router.push('/clients')
  }

  const handleArchive = async () => {
    await archiveClient.mutateAsync(clientId)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/projects/new?clientId=${clientId}`}>
              <FolderPlus className="mr-2 h-4 w-4" />
              新增專案
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/invoices/new?clientId=${clientId}`}>
              <FileText className="mr-2 h-4 w-4" />
              建立發票
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleArchive}>
            <Archive className="mr-2 h-4 w-4" />
            封存客戶
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            刪除客戶
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除客戶嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              您即將刪除客戶「{clientName}」。此操作無法復原。
              <br />
              <br />
              如果客戶有關聯的專案或發票，請先刪除或轉移這些資料。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteClient.isPending ? '刪除中...' : '確定刪除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
