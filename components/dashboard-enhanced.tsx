"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { getTenants, deleteTenant, getOnboardingProgress } from "@/lib/database" // Removed getDashboardMetrics
import type { Tenant, DashboardMetrics, OnboardingProgress } from "@/types"
import {
  Plus,
  Edit,
  Trash2,
  LogOut,
  Building2,
  User,
  Search,
  Clock,
  AlertCircle,
  Users,
  Target,
  Zap,
  MessageSquare,
} from "lucide-react"
import Image from "next/image"
import UserManagement from "./user-management"
import PromptManagement from "./prompt-management"

interface DashboardEnhancedProps {
  onCreateClient: () => void
  onEditClient: (tenant: Tenant) => void
}

export default function DashboardEnhanced({ onCreateClient, onEditClient }: DashboardEnhancedProps) {
  const [tenants, setTenants] = useState<Array<Tenant & { onboardingProgress?: OnboardingProgress }>>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sectorFilter, setSectorFilter] = useState<string>("all")
  const { logout } = useAuth()
  const [currentView, setCurrentView] = useState<"dashboard" | "users" | "prompts">("dashboard")

  useEffect(() => {
    fetchData()
  }, [searchTerm, statusFilter, sectorFilter])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    const filters: any = {}
    if (statusFilter !== "all") filters.status = statusFilter
    if (sectorFilter !== "all") filters.sector = sectorFilter
    if (searchTerm) filters.search = searchTerm

    try {
      const { data: tenantsResult, error: tenantsError } = await getTenants(filters)

      if (tenantsError) {
        throw new Error(tenantsError)
      }

      const tenantsWithProgress = await Promise.all(
        (tenantsResult || []).map(async (tenant) => {
          const { data: progress } = await getOnboardingProgress(tenant.id)
          return { ...tenant, onboardingProgress: progress }
        }),
      )
      setTenants(tenantsWithProgress)

      // TODO: Refactor getDashboardMetrics to work with new schema
      // For now, setting dummy metrics or fetching if available
      // const { data: metricsData, error: metricsError } = await getDashboardMetrics();
      // if (metricsError) {
      //   console.warn("Error fetching dashboard metrics:", metricsError);
      // } else {
      //   setMetrics(metricsData);
      // }
      setMetrics({
        // Dummy data for now
        total_clients: tenantsWithProgress.length,
        completed_onboardings: tenantsWithProgress.filter((t) => t.onboardingProgress?.onboarding_status === "deployed")
          .length,
        in_progress: tenantsWithProgress.filter((t) => t.onboardingProgress?.onboarding_status === "in_progress")
          .length,
        average_completion_time: 0, // Placeholder
        success_rate:
          tenantsWithProgress.length > 0
            ? Math.round(
                (tenantsWithProgress.filter((t) => t.onboardingProgress?.onboarding_status === "deployed").length /
                  tenantsWithProgress.length) *
                  100,
              )
            : 0,
        failed_deployments: tenantsWithProgress.filter((t) => t.onboardingProgress?.onboarding_status === "failed")
          .length,
      })
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err)
      setError(err.message || "Erro ao carregar dados do dashboard.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTenant = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      const result = await deleteTenant(id)
      if (result.success) {
        fetchData()
      } else {
        alert(`Erro ao excluir cliente: ${result.error}`)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "deployed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Rascunho"
      case "in_progress":
        return "Em Progresso"
      case "completed":
        return "Concluído"
      case "deployed":
        return "Implantado"
      case "failed":
        return "Falhou"
      default:
        return status
    }
  }

  const getStepProgress = (currentStep: number, totalSteps: number) => {
    return Math.round((currentStep / totalSteps) * 100)
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
                <div className="label-small">Gerenciamento de clientes</div>
                <h1 className="text-lg font-semibold" style={{ color: "#2D3748" }}>
                  {currentView === "users"
                    ? "Gerenciamento de Usuários"
                    : currentView === "prompts"
                      ? "Gerenciamento de Prompts"
                      : "Dashboard"}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setCurrentView("prompts")}
                variant="outline"
                className="flex items-center space-x-2 h-10 px-4 rounded-lg border-gray-200 hover:bg-gray-50 transition-all duration-200"
                style={{ color: "#718096" }}
              >
                <MessageSquare size={16} />
                <span>Prompts</span>
              </Button>
              <Button
                onClick={() =>
                  setCurrentView(
                    currentView === "users" ? "dashboard" : currentView === "prompts" ? "dashboard" : "users",
                  )
                }
                variant="outline"
                className="flex items-center space-x-2 h-10 px-4 rounded-lg border-gray-200 hover:bg-gray-50 transition-all duration-200"
                style={{ color: "#718096" }}
              >
                <User size={16} />
                <span>
                  {currentView === "users" ? "Dashboard" : currentView === "prompts" ? "Dashboard" : "Usuários"}
                </span>
              </Button>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {currentView === "users" ? (
          <UserManagement onBack={() => setCurrentView("dashboard")} />
        ) : currentView === "prompts" ? (
          <PromptManagement onBack={() => setCurrentView("dashboard")} />
        ) : (
          <>
            {/* Metrics Cards */}
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="card-subtle">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="label-small">Total de Clientes</div>
                        <div className="value-large">{metrics.total_clients}</div>
                      </div>
                      <Users size={24} style={{ color: "#01D5AC" }} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-subtle">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="label-small">Taxa de Sucesso</div>
                        <div className="value-large value-accent">{metrics.success_rate}%</div>
                      </div>
                      <Target size={24} style={{ color: "#01D5AC" }} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-subtle">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="label-small">Tempo Médio</div>
                        <div className="value-large">{metrics.average_completion_time}d</div>
                      </div>
                      <Clock size={24} style={{ color: "#01D5AC" }} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-subtle">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="label-small">Em Progresso</div>
                        <div className="value-large">{metrics.in_progress}</div>
                      </div>
                      <Zap size={24} style={{ color: "#01D5AC" }} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
              <div>
                <div className="label-small">Gerenciamento</div>
                <h2 className="value-large mb-2">Pipeline de Onboarding</h2>
                <p className="text-base" style={{ color: "#718096" }}>
                  Acompanhe o progresso de implementação dos seus clientes
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                {/* Search */}
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                    style={{ color: "#718096" }}
                  />
                  <Input
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>

                {/* Filters */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="deployed">Implantado</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={onCreateClient} className="btn-primary flex items-center space-x-2 h-10 px-6">
                  <Plus size={20} />
                  <span>Novo Cliente</span>
                </Button>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#01D5AC] mx-auto mb-4"></div>
                  <p style={{ color: "#718096" }}>Carregando pipeline...</p>
                </div>
              </div>
            ) : error ? (
              <div className="card-subtle text-center py-16">
                <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                <h3 className="value-large mb-4">Erro ao carregar dados</h3>
                <p className="text-base mb-6" style={{ color: "#718096" }}>
                  {error}
                </p>
                <Button onClick={fetchData} className="btn-primary h-12 px-6">
                  Tentar Novamente
                </Button>
              </div>
            ) : tenants.length === 0 ? (
              <div className="card-subtle text-center py-16">
                <Building2 size={64} className="mx-auto mb-6" style={{ color: "#718096" }} />
                <div className="label-small">Nenhum registro</div>
                <h3 className="value-large mb-4">Nenhum cliente encontrado</h3>
                <p className="text-base mb-8" style={{ color: "#718096" }}>
                  {searchTerm || statusFilter !== "all" || sectorFilter !== "all"
                    ? "Tente ajustar os filtros de busca"
                    : "Comece criando seu primeiro cliente no sistema"}
                </p>
                <Button onClick={onCreateClient} className="btn-primary h-12 px-6">
                  <Plus size={16} className="mr-2" />
                  Criar Primeiro Cliente
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tenants.map((tenantItem) => {
                  const tenantData = tenantItem as Tenant
                  const progressData = tenantItem.onboardingProgress as OnboardingProgress | undefined
                  return (
                    <Card key={tenantData.id} className="card-subtle hover:opacity-95">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="label-small">Cliente</div>
                            <h3 className="text-lg font-semibold mb-1" style={{ color: "#2D3748" }}>
                              {tenantData.name}
                            </h3>
                            <p className="text-sm" style={{ color: "#718096" }}>
                              {tenantData.document}
                            </p>
                          </div>
                          {progressData && (
                            <Badge className={getStatusColor(progressData.onboarding_status)}>
                              {getStatusLabel(progressData.onboarding_status)}
                            </Badge>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {progressData && (
                          <div className="mt-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-medium" style={{ color: "#718096" }}>
                                Progresso
                              </span>
                              <span className="text-xs font-medium" style={{ color: "#2D3748" }}>
                                {progressData.current_step}/{progressData.total_steps}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${getStepProgress(progressData.current_step, progressData.total_steps)}%`,
                                  backgroundColor: "#01D5AC",
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </CardHeader>

                      <CardContent className="pt-0">
                        {/* TODO: Fetch and display ERP config if needed */}
                        {/* <div className="space-y-3 mb-6">
                        {erpConfig && ( // This needs to be fetched per tenant
                          <div className="flex items-center space-x-3">
                            <Key size={16} style={{ color: "#718096" }} />
                            <div>
                              <div className="label-small">ERP</div>
                              <div className="text-sm font-medium" style={{ color: "#2D3748" }}>
                                {erpConfig.erp_template_name}
                              </div>
                            </div>
                          </div>
                        )}
                      </div> */}

                        <div className="flex space-x-3 pt-4 border-t border-gray-100">
                          <Button
                            onClick={() => onEditClient(tenantData)}
                            variant="outline"
                            size="sm"
                            className="flex-1 h-10 rounded-lg border-gray-200 hover:bg-gray-50 transition-all duration-200"
                            style={{ color: "#718096" }}
                          >
                            <Edit size={16} className="mr-2" />
                            {progressData?.onboarding_status === "draft" ? "Continuar" : "Editar"}
                          </Button>
                          <Button
                            onClick={() => handleDeleteTenant(tenantData.id)}
                            variant="outline"
                            size="sm"
                            className="h-10 px-4 rounded-lg border-red-200 text-red-600 hover:bg-red-50 transition-all duration-200"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
