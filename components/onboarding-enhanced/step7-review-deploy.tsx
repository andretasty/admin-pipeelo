"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Tenant, AdminUser, ApiConfig, ERPConfig, PromptConfig, AdvancedConfig } from "@/types"
import { CheckCircle, User, Building2, Key, Settings, MessageSquare, Zap } from 'lucide-react'

interface Step7Props {
  tenant?: Tenant
  adminUser?: AdminUser
  apiConfig?: ApiConfig
  erpConfig?: ERPConfig
  promptConfig?: PromptConfig
  advancedConfig?: AdvancedConfig
  onDeploy: () => void
  onBack: () => void
  saving?: boolean
}

export default function Step7ReviewDeploy({ 
  tenant, 
  adminUser, 
  apiConfig, 
  erpConfig, 
  promptConfig, 
  advancedConfig,
  onDeploy, 
  onBack, 
  saving = false 
}: Step7Props) {
  
  const deploymentUrl = tenant ? `https://${tenant.name.toLowerCase().replace(/\s+/g, '-')}.pipeelo.com` : ""

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="label-small">Etapa 7 de 7</div>
        <h2 className="value-large mb-2">Revisão e Deploy</h2>
        <p className="text-base" style={{ color: "#718096" }}>
          Revise todas as configurações antes do deploy
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Summary Cards */}
        <div className="space-y-4">
          {/* Tenant Info */}
          <Card className="card-subtle">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <Building2 size={20} style={{ color: "#01D5AC" }} />
                <span>Dados da Empresa</span>
                <CheckCircle size={16} className="text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div><strong>Nome:</strong> {tenant?.name}</div>
                <div><strong>CNPJ:</strong> {tenant?.document}</div>
                <div><strong>Setor:</strong> {tenant?.sector}</div>
                <div><strong>Email:</strong> {tenant?.email}</div>
              </div>
            </CardContent>
          </Card>

          {/* Admin User */}
          <Card className="card-subtle">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <User size={20} style={{ color: "#01D5AC" }} />
                <span>Usuário Admin</span>
                <CheckCircle size={16} className="text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div><strong>Nome:</strong> {adminUser?.name}</div>
                <div><strong>Email:</strong> {adminUser?.email}</div>
                <div><strong>CPF:</strong> {adminUser?.document}</div>
              </div>
            </CardContent>
          </Card>

          {/* API Config */}
          <Card className="card-subtle">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <Key size={20} style={{ color: "#01D5AC" }} />
                <span>APIs Configuradas</span>
                <CheckCircle size={16} className="text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {apiConfig?.openai_key && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    OpenAI ✓
                  </Badge>
                )}
                {apiConfig?.openrouter_key && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    OpenRouter ✓
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* ERP Config */}
          {erpConfig && (
            <Card className="card-subtle">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Settings size={20} style={{ color: "#01D5AC" }} />
                  <span>ERP Configurado</span>
                  <CheckCircle size={16} className="text-green-500" />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  <div><strong>Sistema:</strong> {erpConfig.template_name}</div>
                  <div><strong>Funções:</strong> {erpConfig.enabled_commands.length} ativadas</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prompt Config */}
          {promptConfig && (
            <Card className="card-subtle">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <MessageSquare size={20} style={{ color: "#01D5AC" }} />
                  <span>Prompt Configurado</span>
                  <CheckCircle size={16} className="text-green-500" />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  <div><strong>Template:</strong> {promptConfig.template_name}</div>
                  <div><strong>Modelo:</strong> {promptConfig.assistant_config.model}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Advanced Config */}
          <Card className="card-subtle">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <Zap size={20} style={{ color: "#01D5AC" }} />
                <span>Configurações Avançadas</span>
                <CheckCircle size={16} className="text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Atendimento 100%:</strong> {advancedConfig?.full_service_enabled ? "Ativado" : "Desativado"}
                </div>
                <div>
                  <strong>Backup:</strong> {advancedConfig?.backup_settings?.enabled ? "Ativado" : "Desativado"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="h-12 px-6"
        >
          Voltar
        </Button>
        <Button 
          onClick={onDeploy}
          disabled={saving} 
          className="btn-primary h-12 px-8"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Criando...
            </>
          ) : (
            "Salvar"
          )}
        </Button>
      </div>
    </div>
  )
}
