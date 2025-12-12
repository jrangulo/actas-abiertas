'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

interface SearchFormProps {
  initialValue: string
}

export function SearchForm({ initialValue }: Readonly<SearchFormProps>) {
  const router = useRouter()
  const [jrv, setJrv] = useState(initialValue)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedJrv = jrv.trim()

    if (!trimmedJrv) {
      router.push('/dashboard/buscar-acta')
      return
    }

    const jrvNumber = Number.parseInt(trimmedJrv, 10)
    if (Number.isNaN(jrvNumber) || jrvNumber <= 0) {
      return
    }

    router.push(`/dashboard/buscar-acta?jrv=${jrvNumber}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="Ej: 10605"
        value={jrv}
        onChange={(e) => setJrv(e.target.value)}
        className="font-mono"
        autoFocus
      />
      <Button type="submit" size="default">
        <Search className="h-4 w-4 mr-2" />
        Buscar
      </Button>
    </form>
  )
}
