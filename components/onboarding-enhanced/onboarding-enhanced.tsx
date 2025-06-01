"use client"

import { useState, useEffect, useRef } from "react"
import type { Tenant, User, Address, ApiConfiguration, ErpConfiguration, Assistant, AdvancedConfiguration, OnboardingProgress } from "@/types"
import {
  saveAddress,
  saveTenant,
  saveApiConfiguration,
  saveErpConfiguration,
  saveAssistant,
  saveAdvancedConfiguration,
  saveOnboardingProgress,
  createUser,
  getTenant,
  getAddress,
  getApiConfiguration,
  getErpConfiguration,
  getAssistants,
  getAdvancedConfiguration,
  getOnboardingProgress,
  generateUUID,
  updateTenantPipeeloToken,
} from "@/lib/database"
import { getSupabaseClient } from "@/lib/supabase"
import { ExternalApiClient } from "@/lib/external-api"

const supabase = getSupabaseClient()

import ProgressIndicatorEnhanced from "./progress-indicator-enhanced"
import Step1TenantData from "./step1-tenant-data"
import Step2ApiConfig from "./step2-api-config"
import Step3ERPConfig from "./step3-erp-config"
import Step4AssistantsConfig from "./step4-assistants-config"
// import Step5FunctionMapping from "./step5-function-mapping" // Step 5 skipped
import Step6AdvancedConfig from "./step6-advanced-config"
import Step7ReviewDeploy from "./step7-review-deploy"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface OnboardingEnhancedProps {
  onComplete: () => void
  onCancel: () => void
  editingTenantId?: string
}

const STEP_TITLES = [
  "Dados do Cliente",
  "Configuração de APIs",
  "Seleção de ERP",
  "Configuração de Assistentes",
  "Configurações Avançadas",
  "Revisão e Deploy",
]

const TOTAL_STEPS = 6 // Adjust total steps count after removing step 5

export default function OnboardingEnhanced({ onComplete, onCancel, editingTenantId }: OnboardingEnhancedProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [tenantId, setTenantId] = useState<string | undefined>(editingTenantId)
  const [error, setError] = useState<string | null>(null)
  const [logMessages, setLogMessages] = useState<string[]>([])
  const [authToken, setAuthToken] = useState<string | null>(null)
  
  const externalApiClientRef = useRef(new ExternalApiClient())
  const externalApiClient = externalApiClientRef.current

  // Step data states
  const [tenant, setTenant] = useState<Tenant | undefined>(undefined)
  const [address, setAddress] = useState<Address | undefined>(undefined)
  const [user, setUser] = useState<User | undefined>(undefined)

  // Load pipeelo_token when tenant is set
  useEffect(() => {
    if (tenant?.pipeelo_token) {
      setAuthToken(tenant.pipeelo_token)
      externalApiClient.setAuthToken(tenant.pipeelo_token)
    }
  }, [tenant])
  const [apiConfig, setApiConfig] = useState<ApiConfiguration | undefined>(undefined)
  const [erpConfig, setERPConfig] = useState<ErpConfiguration | undefined>(undefined)
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedConfiguration | undefined>(undefined)
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress | undefined>(undefined)

  // Fetch existing data if editingTenantId is provided
  useEffect(() => {
    const fetchEditingData = async () => {
      if (editingTenantId) {
        setSaving(true)
        setError(null)
        try {
          const { data: fetchedTenant } = await getTenant(editingTenantId)
          if (fetchedTenant) {
            setTenant(fetchedTenant)
            if (fetchedTenant.address_id) {
              const { data: fetchedAddress } = await getAddress(fetchedTenant.address_id)
              setAddress(fetchedAddress)
            }
          }

          const { data: fetchedUser } = await supabase.from("users").select("*").eq("tenant_id", editingTenantId).eq("role", "admin").single();
          if (fetchedUser) {
            setUser(fetchedUser as unknown as User); // Explicitly cast to unknown first
          }

          const { data: fetchedApiConfig } = await getApiConfiguration(editingTenantId)
          setApiConfig(fetchedApiConfig)

          const { data: fetchedErpConfig } = await getErpConfiguration(editingTenantId)
          setERPConfig(fetchedErpConfig)

          const { data: fetchedAssistants } = await getAssistants(editingTenantId)
          setAssistants(fetchedAssistants || [])

          const { data: fetchedAdvancedConfig } = await getAdvancedConfiguration(editingTenantId)
          setAdvancedConfig(fetchedAdvancedConfig)

          const { data: fetchedOnboardingProgress } = await getOnboardingProgress(editingTenantId)
          if (fetchedOnboardingProgress) {
            setOnboardingProgress(fetchedOnboardingProgress)
            setCurrentStep(fetchedOnboardingProgress.current_step)
          }
        } catch (err: any) {
          console.error("Error fetching editing data:", err)
          setError(err.message || "Failed to load existing client data.")
        } finally {
          setSaving(false)
        }
      }
    }
    fetchEditingData()
  }, [editingTenantId])

  useEffect(() => {
    if (authToken) {
      externalApiClient.setAuthToken(authToken)
    }
  }, [authToken])

  const handleStepComplete = async (step: number, stepData: any) => {
    setSaving(true)
    setError(null)
    setLogMessages([])

    try {
      console.log(`Processing step ${step}:`, stepData)

      let currentTenantId = tenantId;
      let currentOnboardingProgress = onboardingProgress;

      // Handle Step 1: Tenant, Address, User, and initial OnboardingProgress
      if (step === 1) {
        const { tenant: newTenantData, address: newAddressData, user: newUserData } = stepData;

        // Log start of tenant creation
        setLogMessages((logs) => [...logs, "Iniciando criação da conta no sistema externo..."]);

        // Create tenant account in external API
        const creationResponse = await externalApiClient.createTenantAccount({
          tenant: {
            ...newTenantData,
            document: newTenantData.document.replace(/\D/g, ""),
            phone_number: newTenantData.phone_number.replace(/\D/g, ""),
            address: {
              ...newAddressData,
              postal_code: newAddressData.postal_code.replace(/\D/g, ""),
            },
          },
          user: {
            ...newUserData,
            password: newUserData.password_hash,
            document: newUserData.document.replace(/\D/g, ""),
          },
          gateway: "CONTA_AZUL",
        });
        const token = creationResponse?.token || creationResponse?.permanent_token;
        if (token) {
          setAuthToken(token);
          externalApiClient.setAuthToken(token);
        }
        setLogMessages((logs) => [...logs, "Conta criada com sucesso no sistema externo."]); 

        // Authenticate and obtain permanent token
        setLogMessages((logs) => [...logs, "Obtendo token permanente..."]);
        const loginResp = await externalApiClient.login(newUserData.email, newUserData.password_hash);
        const tempToken = (loginResp.token as string).split("|")[1] || loginResp.token;
        const permanentResp = await externalApiClient.getPermanentToken(tempToken);
        const pipeeloToken = permanentResp.token as string;
        setAuthToken(pipeeloToken);
        externalApiClient.setAuthToken(pipeeloToken);
        setLogMessages((logs) => [...logs, "Token permanente obtido."]);

        // Save Address
        const { success: addressSuccess, data: savedAddress, error: addressError } = await saveAddress(newAddressData);
        if (!addressSuccess || !savedAddress) {
          throw new Error(addressError || "Erro ao salvar endereço.");
        }
        setAddress(savedAddress);

        // Save Tenant
        const tenantToSave: Tenant = { ...newTenantData, address_id: savedAddress.id } as Tenant;
        const { success: tenantSuccess, data: savedTenant, error: tenantError } = await saveTenant(tenantToSave);
        if (!tenantSuccess || !savedTenant) {
          throw new Error(tenantError || "Erro ao salvar dados da empresa.");
        }
        setTenant(savedTenant);
        currentTenantId = savedTenant.id;
        setTenantId(savedTenant.id); // Set tenantId for subsequent steps

      // Save permanent token in tenant record
      const { success: tokenSuccess, error: tokenError } = await updateTenantPipeeloToken(savedTenant.id, pipeeloToken);
      if (!tokenSuccess) {
        throw new Error(tokenError || "Erro ao salvar token permanente.");
      }
      // Update local tenant state with the new token
      setTenant(prev => prev ? {...prev, pipeelo_token: pipeeloToken} : prev);

        // Create User (admin user for the tenant)
        const userToCreate: User = { ...newUserData, tenant_id: savedTenant.id } as User;
        const { success: userSuccess, error: userError } = await createUser(userToCreate.name, userToCreate.email, userToCreate.password_hash, userToCreate.role, userToCreate.tenant_id);
        if (!userSuccess) {
          throw new Error(userError || "Erro ao criar usuário administrador.");
        }
        setUser(userToCreate);

        // Create initial Onboarding Progress
        const initialProgress: OnboardingProgress = {
          id: generateUUID(), // Generate ID for onboarding progress
          tenant_id: savedTenant.id,
          onboarding_status: "in_progress",
          current_step: 2,
          total_steps: 7,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const { success: progressSuccess, data: savedProgress, error: progressError } = await saveOnboardingProgress(initialProgress);
        if (!progressSuccess || !savedProgress) {
          throw new Error(progressError || "Erro ao iniciar progresso de onboarding.");
        }
        setOnboardingProgress(savedProgress);
        currentOnboardingProgress = savedProgress;

      } else {
        // For subsequent steps, ensure tenantId exists
        if (!currentTenantId) {
          throw new Error("ID do cliente não encontrado para salvar o progresso.");
        }

        // Update local state based on step
        switch (step) {
          case 2:
            const apiConfigToSave: ApiConfiguration = { ...stepData, tenant_id: currentTenantId } as ApiConfiguration;
            const { success: apiConfigSuccess, data: savedApiConfig, error: apiConfigError } = await saveApiConfiguration(apiConfigToSave);
            if (!apiConfigSuccess || !savedApiConfig) throw new Error(apiConfigError || "Erro ao salvar configuração de API.");
            setApiConfig(savedApiConfig);

            if (authToken) {
              if (savedApiConfig.openai_key) {
                await externalApiClient.updateOpenAI(savedApiConfig.openai_key, authToken);
              }
              if (savedApiConfig.openrouter_key) {
                await externalApiClient.updateOpenRouter(savedApiConfig.openrouter_key, authToken);
              }
            }
            break;
          case 3:
            const erpConfigToSave: ErpConfiguration = { ...stepData, tenant_id: currentTenantId } as ErpConfiguration;
            const { success: erpConfigSuccess, data: savedErpConfig, error: erpConfigError } = await saveErpConfiguration(erpConfigToSave);
            if (!erpConfigSuccess || !savedErpConfig) throw new Error(erpConfigError || "Erro ao salvar configuração de ERP.");
            setERPConfig(savedErpConfig);
            break;
          case 4:
            // Assistants are an array, need to handle individually or as a batch
            // For simplicity, assuming stepData is an array of assistants
            const assistantsToSave: Assistant[] = stepData.map((a: Assistant) => ({ ...a, tenant_id: currentTenantId }));
            for (const assistantItem of assistantsToSave) {
              const { success: assistantSuccess, error: assistantError } = await saveAssistant(assistantItem);
              if (!assistantSuccess) throw new Error(assistantError || `Erro ao salvar assistente ${assistantItem.name}.`);
            }
            setAssistants(assistantsToSave);
            break;
          case 5:
            // Function mapping updates ERP config, so re-save ERP config
            const updatedErpConfigToSave: ErpConfiguration = { ...stepData, tenant_id: currentTenantId } as ErpConfiguration;
            const { success: updatedErpConfigSuccess, data: updatedSavedErpConfig, error: updatedErpConfigError } = await saveErpConfiguration(updatedErpConfigToSave);
            if (!updatedErpConfigSuccess || !updatedSavedErpConfig) throw new Error(updatedErpConfigError || "Erro ao salvar mapeamento de funções.");
            setERPConfig(updatedSavedErpConfig);
            break;
          case 6:
            const advancedConfigToSave: AdvancedConfiguration = { ...stepData, tenant_id: currentTenantId } as AdvancedConfiguration;
            const { success: advancedConfigSuccess, data: savedAdvancedConfig, error: advancedConfigError } = await saveAdvancedConfiguration(advancedConfigToSave);
            if (!advancedConfigSuccess || !savedAdvancedConfig) throw new Error(advancedConfigError || "Erro ao salvar configurações avançadas.");
            setAdvancedConfig(savedAdvancedConfig);
            break;
          case 7:
            // Final deployment handled separately
            await handleFinalDeploy();
            return;
        }

        // Update onboarding progress for current tenant
        const updatedProgress: OnboardingProgress = {
          ...(currentOnboardingProgress || {} as OnboardingProgress), // Use existing or create new
          tenant_id: currentTenantId,
          current_step: step + 1,
          updated_at: new Date().toISOString(),
        };
        const { success: updateProgressSuccess, data: newSavedProgress, error: updateProgressError } = await saveOnboardingProgress(updatedProgress);
        if (!updateProgressSuccess || !newSavedProgress) {
          throw new Error(updateProgressError || "Erro ao atualizar progresso de onboarding.");
        }
        setOnboardingProgress(newSavedProgress);
      }

      // Move to next step, but skip step 5
      let nextStep = step + 1;
      if (nextStep === 5) nextStep = 6; // Skip step 5
      setCurrentStep(nextStep)
      console.log(`Successfully moved to step ${nextStep}`)
    } catch (error: any) {
      console.error("Error saving step:", error)

      // Enhanced error handling for constraint violations
      if (error.message?.includes("foreign key constraint")) {
        if (error.message?.includes("prompt_template_id_fkey")) {
          setError("Erro de configuração: Template de prompt inválido. Tente selecionar um template diferente.")
        } else if (error.message?.includes("erp_template_id_fkey")) {
          setError("Erro de configuração: Template de ERP inválido. Tente selecionar um template diferente.")
        } else {
          setError("Erro de integridade de dados. Por favor, verifique as configurações e tente novamente.")
        }
      } else {
        setError(error.message || "Erro ao salvar progresso. Tente novamente.")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleFinalDeploy = async () => {
    if (!tenantId) {
      throw new Error("ID do cliente não encontrado para deploy.")
    }

    try {
      console.log("Starting final deployment...")

      // Update onboarding progress to deployed status
      const finalProgress: OnboardingProgress = {
        ...(onboardingProgress || {} as OnboardingProgress),
        tenant_id: tenantId,
        onboarding_status: "deployed",
        current_step: 7,
        deployed_at: new Date().toISOString(),
        deployment_url: `https://${tenant?.name.toLowerCase().replace(/\s+/g, "-")}.pipeelo.com`,
        updated_at: new Date().toISOString(),
      };

      const { success, error: progressError } = await saveOnboardingProgress(finalProgress);
      if (!success) {
        throw new Error(progressError || "Erro ao finalizar progresso de onboarding.");
      }

      console.log("Deployment successful!")
      onComplete()
    } catch (error: any) {
      console.error("Error deploying:", error)
      setError(error.message || "Erro no deploy.")
    } finally {
      setSaving(false);
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      // When going back from step 6, go to step 4 (skip step 5)
      let prevStep = currentStep - 1;
      if (prevStep === 5) prevStep = 4;
      setCurrentStep(prevStep)
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
              {editingTenantId ? "Editando Cliente" : "Novo Cliente"}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        <ProgressIndicatorEnhanced currentStep={currentStep} totalSteps={TOTAL_STEPS} stepTitles={STEP_TITLES} />

        {/* Enhanced Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-red-800 font-medium">Erro ao salvar progresso</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <div className="mt-3">
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Recarregar Página
                  </Button>
                </div>
              </div>
              <Button onClick={clearError} variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                ✕
              </Button>
            </div>
          </div>
        )}

        {/* Log Messages Display */}
        {logMessages.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-blue-800 font-medium mb-2">Progresso da Operação</h3>
            <div className="bg-white rounded border border-blue-100 p-3 max-h-40 overflow-y-auto">
              {logMessages.map((message, index) => (
                <div key={index} className="py-1 border-b border-blue-50 last:border-0">
                  <span className="text-blue-600 text-sm">{message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card-subtle p-8">
          {currentStep === 1 && (
            <Step1TenantData
              tenant={tenant}
              address={address}
              adminUser={user}
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
              tenantId={tenantId as string} // Pass tenantId to Step3ERPConfig
              onNext={(data) => handleStepComplete(3, data)}
              onBack={handleBack}
              saving={saving}
            />
          )}

          {currentStep === 4 && (
            <Step4AssistantsConfig
              assistants={assistants}
              tenant={tenant}
              erpConfig={erpConfig}
              onNext={(data) => handleStepComplete(4, data)}
              onBack={handleBack}
              saving={saving}
            />
          )}

          {currentStep === 5 && (
            // Remove or comment out Step5FunctionMapping to skip this step
            // <Step5FunctionMapping
            //   erpConfig={erpConfig}
            //   onNext={(data) => handleStepComplete(5, data)}
            //   onBack={handleBack}
            //   saving={saving}
            // />
            <></>
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
              adminUser={user}
              apiConfig={apiConfig}
              erpConfig={erpConfig}
              assistants={assistants}
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
