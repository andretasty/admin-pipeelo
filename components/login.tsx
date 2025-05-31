"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    console.log("Tentando login com:", email)
    const success = await login(email, password)

    if (!success) {
      console.error("Login falhou")
      setError("Email ou senha inválidos")
    } else {
      console.log("Login bem-sucedido")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8F9FA" }}>
      <div className="card-subtle w-full max-w-md p-8">
        <div className="text-center section-spacing">
          <div className="flex justify-center element-spacing">
            <Image src="/pipeelo-logo.png" alt="Pipeelo" width={200} height={60} className="h-12 w-auto" />
          </div>
          <div className="label-small">Painel de administração</div>
          <h1 className="value-large">Acesso ao Painel</h1>
          <p className="text-sm mt-2" style={{ color: "#718096" }}>
            Entre com suas credenciais para acessar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="label-small">Email</div>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@pipeelo.com"
              required
              className="input-custom w-full h-12 text-base"
              style={{ color: "#2D3748" }}
            />
          </div>

          <div>
            <div className="label-small">Senha</div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
                className="input-custom w-full h-12 text-base pr-12"
                style={{ color: "#2D3748" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-opacity duration-200 hover:opacity-60"
                style={{ color: "#718096" }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="btn-primary w-full h-12 text-base font-medium">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  )
}
