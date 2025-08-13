'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

function AuthInner() {
  const router = useRouter()
  const search = useSearchParams()
  const defaultMode = search.get('mode') === 'register' ? 'register' : 'login'

   const [mode, setMode] = useState(defaultMode)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '', fullName: '', orgName: '' })

  useEffect(() => { setMode(defaultMode) }, [defaultMode])

  const submit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro')

      if (mode === 'register') {
        setMode('login')
        setForm({ email: form.email, password: '', fullName: '', orgName: '' })
        alert('Cadastro realizado! Faça login.')
        return
      }

      router.push('/Pages')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-gray-100 grid place-items-center px-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur border border-gray-200 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-sky-500 bg-clip-text text-transparent">
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </CardTitle>
          <CardDescription>
            {mode === 'login' ? 'Acesse seu painel' : 'Comece grátis e crie seu evento'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <Label>Seu nome</Label>
                  <Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
                </div>
                <div>
                  <Label>Nome da organização</Label>
                  <Input value={form.orgName} onChange={e => setForm({ ...form, orgName: e.target.value })} required />
                </div>
              </>
            )}

            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div>
              <Label>Senha</Label>
              <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">{error}</div>}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-700 to-sky-500 hover:from-blue-800 hover:to-sky-600"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <div className="text-center mt-4">
            <Button variant="ghost" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tenho conta'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Carregando...</div>}>
      <AuthInner />
    </Suspense>
  )
}
