import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import type { CreateClientInput, UpdateClientInput } from '@/lib/validations/client'

// Types
export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  website: string | null
  status: string
  source: string | null
  notes: string | null
  address: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  currency: string
  paymentTerms: number
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  tags: Tag[]
  _count?: {
    projects: number
    invoices: number
    tasks?: number
    communications?: number
  }
  stats?: {
    totalProjects: number
    totalInvoiced: number
    totalPaid: number
    outstandingBalance: number
  }
}

export interface Tag {
  id: string
  name: string
  color: string
}

interface ClientsResponse {
  success: boolean
  data: Client[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

interface ClientResponse {
  success: boolean
  data: Client
}

interface UseClientsOptions {
  page?: number
  limit?: number
  status?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  archived?: boolean
}

// API functions
async function fetchClients(options: UseClientsOptions): Promise<ClientsResponse> {
  const params = new URLSearchParams()
  
  if (options.page) params.set('page', options.page.toString())
  if (options.limit) params.set('limit', options.limit.toString())
  if (options.status) params.set('status', options.status)
  if (options.search) params.set('search', options.search)
  if (options.sortBy) params.set('sortBy', options.sortBy)
  if (options.sortOrder) params.set('sortOrder', options.sortOrder)
  if (options.archived) params.set('archived', 'true')

  const res = await fetch(`/api/clients?${params}`)
  const json = await res.json()
  
  if (!res.ok) {
    throw new Error(json.error?.message || '取得客戶列表失敗')
  }
  
  return json
}

async function fetchClient(id: string, include?: string[]): Promise<ClientResponse> {
  const params = new URLSearchParams()
  if (include?.length) params.set('include', include.join(','))
  
  const res = await fetch(`/api/clients/${id}?${params}`)
  const json = await res.json()
  
  if (!res.ok) {
    throw new Error(json.error?.message || '取得客戶資料失敗')
  }
  
  return json
}

async function createClient(data: CreateClientInput): Promise<ClientResponse> {
  const res = await fetch('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  const json = await res.json()
  
  if (!res.ok) {
    throw new Error(json.error?.message || '建立客戶失敗')
  }
  
  return json
}

async function updateClient(id: string, data: UpdateClientInput): Promise<ClientResponse> {
  const res = await fetch(`/api/clients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  const json = await res.json()
  
  if (!res.ok) {
    throw new Error(json.error?.message || '更新客戶失敗')
  }
  
  return json
}

async function deleteClient(id: string): Promise<void> {
  const res = await fetch(`/api/clients/${id}`, {
    method: 'DELETE',
  })
  
  if (!res.ok) {
    const json = await res.json()
    throw new Error(json.error?.message || '刪除客戶失敗')
  }
}

async function archiveClient(id: string): Promise<ClientResponse> {
  const res = await fetch(`/api/clients/${id}/archive`, {
    method: 'POST',
  })
  
  const json = await res.json()
  
  if (!res.ok) {
    throw new Error(json.error?.message || '封存客戶失敗')
  }
  
  return json
}

// Hooks
export function useClients(options: UseClientsOptions = {}) {
  return useQuery({
    queryKey: ['clients', options],
    queryFn: () => fetchClients(options),
  })
}

export function useClient(id: string, include?: string[]) {
  return useQuery({
    queryKey: ['clients', id, include],
    queryFn: () => fetchClient(id, include),
    enabled: !!id,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast({
        title: '成功',
        description: '客戶建立成功',
      })
    },
    onError: (error: Error) => {
      toast({
        title: '錯誤',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientInput }) =>
      updateClient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] })
      toast({
        title: '成功',
        description: '客戶資料已更新',
      })
    },
    onError: (error: Error) => {
      toast({
        title: '錯誤',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast({
        title: '成功',
        description: '客戶已刪除',
      })
    },
    onError: (error: Error) => {
      toast({
        title: '錯誤',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useArchiveClient() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: archiveClient,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clients', id] })
      toast({
        title: '成功',
        description: '客戶已封存',
      })
    },
    onError: (error: Error) => {
      toast({
        title: '錯誤',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}
