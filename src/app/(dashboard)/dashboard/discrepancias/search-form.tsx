'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

interface SearchFormProps {
  initialValue: string
}

export function SearchForm({ initialValue }: SearchFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(initialValue)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value.trim()) {
        params.set('busqueda', value.trim())
      } else {
        params.delete('busqueda')
      }
      params.delete('pagina') // Reset to page 1
      router.push(`/dashboard/discrepancias?${params.toString()}`)
    })
  }

  const handleClear = () => {
    setValue('')
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('busqueda')
      params.delete('pagina')
      router.push(`/dashboard/discrepancias?${params.toString()}`)
    })
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="Buscar por JRV o ID de acta..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="pr-8"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button type="submit" disabled={isPending}>
        <Search className="h-4 w-4 mr-2" />
        {isPending ? 'Buscando...' : 'Buscar'}
      </Button>
    </form>
  )
}
