"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { getClients, deleteClient } from "@/lib/database"
import type { Client } from "@/types"
import { Plus, Edit, Trash2, LogOut, Building2, User, Key, MessageSquare } from 'lucide-react'
import Image from "next/image"

interface DashboardProps {
  onCreateClient: () => void
  onEditClient: (client: Client) => void
}

export default function Dashboard({ onCreateClient, onEditClient }: DashboardProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { logout } = useAuth()

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true)
      setError(null)
      
      const result = await getClients()
      if (result.success && result.data) {
        setClients(result.data)
      } else {
        setError(result.error || 'Erro ao carregar clientes')
      }
      
      setLoading(false)
    }
    
    fetchClients()
  }, [])

  const handleDeleteClient = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      const result = await deleteClient(id)
      if (result.success) {
        // Refresh the clients list
        const clientsResult = await getClients()
        if (clientsResult.success && clientsResult.data) {
          setClients(clientsResult.data)
        }
      } else {
        alert(`Erro ao excluir cliente: ${result.error}`)
      }
    }
  }

  const refreshClients = async () => {
    const result = await getClients()
    if (result.success && result.data) {
      setClients(result.data)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F9FA" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#FFFFFF" }} className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <Image src="/pipeelo-logo.png" alt="Pipeelo" width={120} height={36} className="h-10 w-auto" />
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <div className="label-small">Sistema SaaS</div>
                <h1 className="text-lg font-semibold" style={{ color: "#2D3748" }}>
                  Painel de Configuração
                </h1>
              </div>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              className="flex items-center space-x-2 h-10 px-4 rounded-lg border-gray-200 hover:bg-gray-50 transition-all duration-200"
              style={{ color: "#718096" }}
            >
              <LogOut size={16} />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex justify-between items-start section-spacing">
          <div>
            <div className="label-small">Gerenciamento</div>
            <h2 className="value-large mb-2">Clientes</h2>
            <p className="text-base" style={{ color: "#718096" }}>
              Gerencie as contas dos seus clientes SaaS
            </p>
          </div>
          <Button onClick={onCreateClient} className="btn-primary flex items-center space-x-2 h-12 px-6">
            <Plus size={20} />
            <span>Novo Cliente</span>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#01D5AC] mx-auto mb-4"></div>
              <p style={{ color: "#718096" }}>Carregando clientes...</p>
            </div>
          </div>
        ) : error ? (
          <div className="card-subtle text-center py-16">
            <div className="text-red-500 mb-4">⚠️</div>
            <h3 className="value-large mb-4">Erro ao carregar dados</h3>
            <p className="text-base mb-6" style={{ color: "#718096" }}>
              {error}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="btn-primary h-12 px-6"
            >
              Tentar Novamente
            </Button>
          </div>
        ) : clients.length === 0 ? (
          <div className="card-subtle text-center py-16">
            <Building2 size={64} className="mx-auto mb-6" style={{ color: "#718096" }} />
            <div className="label-small">Nenhum registro</div>
            <h3 className="value-large mb-4">Nenhum cliente cadastrado</h3>
            <p className="text-base mb-8" style={{ color: "#718096" }}>
              Comece criando seu primeiro cliente
            </p>
            <Button onClick={onCreateClient} className="btn-primary h-12 px-6">
              <Plus size={16} className="mr-2" />
              Criar Primeiro Cliente
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <div key={client.id} className="card-subtle p-6 hover:opacity-95">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="label-small">Empresa</div>
                    <h3 className="value-large mb-1">{client.company.name}</h3>
                    <p className="text-sm" style={{ color: "#718096" }}>
                      {client.company.document}
                    </p>
                  </div>
                  <div
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: "#01D5AC",
                      color: "white",
                    }}
                  >
                    Ativo
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <User size={16} style={{ color: "#718096" }} />
                    <div>
                      <div className="label-small">Administrador</div>
                      <div className="text-sm font-medium" style={{ color: "#2D3748" }}>
                        {client.admin_user.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Building2 size={16} style={{ color: "#718096" }} />
                    <div>
                      <div className="label-small">Localização</div>
                      <div className="text-sm font-medium" style={{ color: "#2D3748" }}>
                        {client.company.address.city}, {client.company.address.state}
                      </div>
                    </div>
                  </div>

                  {client.selected_prompt && (
                    <div className="flex items-center space-x-3">
                      <MessageSquare size={16} style={{ color: "#718096" }} />
                      <div>
                        <div className="label-small">Prompt</div>
                        <div className="text-sm font-medium" style={{ color: "#2D3748" }}>
                          {client.selected_prompt.name}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <Key size={16} style={{ color: "#718096" }} />
                    <div>
                      <div className="label-small">APIs Configuradas</div>
                      <div className="text-sm font-medium value-accent">
                        {
                          Object.keys(client.api_config).filter(
                            (key) => client.api_config[key as keyof typeof client.api_config],
                          ).length
                        }
                        /2
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-gray-100">
                  <Button
                    onClick={() => onEditClient(client)}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-10 rounded-lg border-gray-200 hover:bg-gray-50 transition-all duration-200"
                    style={{ color: "#718096" }}
                  >
                    <Edit size={16} className="mr-2" />
                    Editar
                  </Button>
                  <Button
                    onClick={() => handleDeleteClient(client.id)}
                    variant="outline"
                    size="sm"
                    className="h-10 px-4 rounded-lg border-red-200 text-red-600 hover:bg-red-50 transition-all duration-200"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
