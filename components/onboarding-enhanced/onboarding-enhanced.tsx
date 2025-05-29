"use client"

import { useState } from "react"
import type { Client, Tenant, AdminUser, ApiConfig, ERPConfig, PromptConfig, AdvancedConfig } from "@/types"
import { saveClient, updateClientStep } from "@/lib/database"
import { generateUUID } from "@/lib/utils"
import ProgressIndicatorEnhanced from "./progress-indicator-enhanced"
import Step1TenantData from "./step1-tenant-data"
import Step2ApiConfig from "./step2-api-config"
import Step3ERPConfig from "./step3-erp-config"
import Step4PromptConfig from "./step4-prompt-config"
import Step5FunctionMapping from "./step5-function-mapping"
import Step6AdvancedConfig from "./step6-advanced-config"
import Step7ReviewDeploy from "./step7-review-deploy"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface OnboardingEnhancedProps {
  onComplete: () => void
  onCancel: () => void
  editingClient?: Client
}

const STEP_TITLES = [
  "Dados do Cliente",
  "Configuração de APIs",
  "Seleção de ERP",
  "Configuração de Prompts",
  "Mapeamento de Funções",
  "Configurações Avançadas",
  "Revisão e Deploy",
]

export default function OnboardingEnhanced({ onComplete, onCancel, editingClient }: OnboardingEnhancedProps) {
  const [currentStep, setCurrentStep] = useState(editingClient?.current_step || 1)
  const [saving, setSaving] = useState(false)
  const [clientId, setClientId] = useState(editingClient?.id)
  const [error, setError] = useState<string | null>(null)

  // Step data states
  const [tenant, setTenant] = useState<Tenant | undefined>(editingClient?.tenant)
  const [adminUser, setAdminUser] = useState<AdminUser | undefined>(editingClient?.admin_user)
  const [apiConfig, setApiConfig] = useState<ApiConfig | undefined>(editingClient?.api_config)
  const [erpConfig, setERPConfig] = useState<ERPConfig | undefined>(editingClient?.erp_config)
  const [promptConfig, setPromptConfig] = useState<PromptConfig | undefined>(editingClient?.prompt_config)
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedConfig | undefined>(editingClient?.advanced_config)

  const handleStepComplete = async (step: number, stepData: any) => {
    setSaving(true)
    setError(null)

    try {
      console.log(`Processing step ${step}:`, stepData)

      // Update local state based on step
      switch (step) {
        case 1:
          setTenant(stepData.tenant)
          setAdminUser(stepData.adminUser)
          break
        case 2:
          setApiConfig(stepData)
          break
        case 3:
          setERPConfig(stepData)
          break
        case 4:
          setPromptConfig(stepData)
          break
        case 5:
          // Function mapping updates ERP config
          setERPConfig(stepData)
          break
        case 6:
          setAdvancedConfig(stepData)
          break
        case 7:
          // Final deployment
          await handleFinalDeploy()
          return
      }

      // Save to database
      if (clientId) {
        // Update existing client step
        console.log(`Updating step for client ${clientId}`)
        const result = await updateClientStep(clientId, step + 1, stepData)
        if (!result.success) {
          throw new Error(result.error || "Erro ao atualizar etapa")
        }
      } else if (step === 1) {
        // Create new client after first step with proper UUID
        const newClientId = generateUUID()
        console.log(`Creating new client with ID: ${newClientId}`)

        const newClient: Client = {
          id: newClientId,
          tenant: stepData.tenant,
          admin_user: stepData.adminUser,
          api_config: { api_tests: {} },
          onboarding_status: "in_progress",
          current_step: 2,
          total_steps: 7,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const result = await saveClient(newClient)
        if (result.success && result.data) {
          setClientId(result.data.id)
          console.log(`Client created successfully with ID: ${result.data.id}`)
        } else {
          throw new Error(result.error || "Erro ao criar cliente")
        }
      }

      // Move to next step
      setCurrentStep(step + 1)
      console.log(`Successfully moved to step ${step + 1}`)
    } catch (error: any) {
      console.error("Error saving step:", error)
      setError(error.message || "Erro ao salvar progresso. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  const handleFinalDeploy = async () => {
    if (!clientId) {
      throw new Error("ID do cliente não encontrado")
    }

    try {
      console.log("Starting final deployment...")

      // Create final client object
      const finalClient: Client = {
        id: clientId,
        tenant: tenant!,
        admin_user: adminUser!,
        api_config: apiConfig!,
        erp_config: erpConfig,
        prompt_config: promptConfig,
        advanced_config: advancedConfig,
        onboarding_status: "deployed",
        current_step: 7,
        total_steps: 7,
        created_at: editingClient?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deployed_at: new Date().toISOString(),
        deployment_url: `https://${tenant?.name.toLowerCase().replace(/\s+/g, "-")}.pipeelo.com`,
      }

      console.log("Final client data:", finalClient)

      const result = await saveClient(finalClient)
      if (result.success) {
        console.log("Deployment successful!")
        onComplete()
      } else {
        throw new Error(result.error || "Erro no deploy")
      }
    } catch (error: any) {
      console.error("Error deploying:", error)
      throw error
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError(null)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F9FA" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#FFFFFF" }} className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <Button
                onClick={onCancel}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 h-10 px-4 rounded-lg hover:bg-gray-50 transition-all duration-200"
                style={{ color: "#718096" }}
              >
                <ArrowLeft size={16} />
                <span>Voltar</span>
              </Button>
              <div className="h-8 w-px bg-gray-200" />
              <Image src="/pipeelo-logo.png" alt="Pipeelo" width={120} height={36} className="h-10 w-auto" />
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <div className="label-small">Onboarding Escalável</div>
                <h1 className="text-lg font-semibold" style={{ color: "#2D3748" }}>
                  {STEP_TITLES[currentStep - 1]}
                </h1>
              </div>
            </div>
            <div className="text-sm font-medium" style={{ color: "#718096" }}>
              {editingClient ? "Editando Cliente" : "Novo Cliente"}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        <ProgressIndicatorEnhanced currentStep={currentStep} totalSteps={7} stepTitles={STEP_TITLES} />

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-red-800 font-medium">Erro ao salvar progresso</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <Button onClick={clearError} variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                ✕
              </Button>
            </div>
          </div>
        )}

        <div className="card-subtle p-8">
          {currentStep === 1 && (
            <Step1TenantData
              tenant={tenant}
              adminUser={adminUser}
              onNext={(data) => handleStepComplete(1, data)}
              saving={saving}
            />
          )}

          {currentStep === 2 && (
            <Step2ApiConfig
              apiConfig={apiConfig}
              onNext={(data) => handleStepComplete(2, data)}
              onBack={handleBack}
              saving={saving}
            />
          )}

          {currentStep === 3 && (
            <Step3ERPConfig
              erpConfig={erpConfig}
              onNext={(data) => handleStepComplete(3, data)}
              onBack={handleBack}
              saving={saving}
            />
          )}

          {currentStep === 4 && (
            <Step4PromptConfig
              promptConfig={promptConfig}
              tenant={tenant}
              onNext={(data) => handleStepComplete(4, data)}
              onBack={handleBack}
              saving={saving}
            />
          )}

          {currentStep === 5 && (
            <Step5FunctionMapping
              erpConfig={erpConfig}
              onNext={(data) => handleStepComplete(5, data)}
              onBack={handleBack}
              saving={saving}
            />
          )}

          {currentStep === 6 && (
            <Step6AdvancedConfig
              advancedConfig={advancedConfig}
              onNext={(data) => handleStepComplete(6, data)}
              onBack={handleBack}
              saving={saving}
            />
          )}

          {currentStep === 7 && (
            <Step7ReviewDeploy
              tenant={tenant}
              adminUser={adminUser}
              apiConfig={apiConfig}
              erpConfig={erpConfig}
              promptConfig={promptConfig}
              advancedConfig={advancedConfig}
              onDeploy={() => handleStepComplete(7, {})}
              onBack={handleBack}
              saving={saving}
            />
          )}
        </div>
      </main>
    </div>
  )
}
