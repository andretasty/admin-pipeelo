"use client"

import { useState } from "react"
import type { Company, AdminUser, ApiConfig, PromptConfig, Client } from "@/types"
// import { saveClient } from "@/lib/storage"
import { saveClient } from "@/lib/database"
import ProgressIndicator from "./progress-indicator"
import Step1CompanyData from "./step1-company-data"
import Step2ApiConfig from "./step2-api-config"
import Step3PromptSelection from "./step3-prompt-selection"
import { ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface OnboardingProps {
  onComplete: () => void
  onCancel: () => void
  editingClient?: Client
}

export default function Onboarding({ onComplete, onCancel, editingClient }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [company, setCompany] = useState<Company | undefined>(editingClient?.company)
  const [adminUser, setAdminUser] = useState<AdminUser | undefined>(editingClient?.admin_user)
  const [apiConfig, setApiConfig] = useState<ApiConfig | undefined>(editingClient?.api_config)
  const [selectedPrompt, setSelectedPrompt] = useState<PromptConfig | undefined>(editingClient?.selected_prompt)

  const handleStep1Complete = (companyData: Company, userData: AdminUser) => {
    setCompany(companyData)
    setAdminUser(userData)
    setCurrentStep(2)
  }

  const handleStep2Complete = (config: ApiConfig) => {
    setApiConfig(config)
    setCurrentStep(3)
  }

  const handleStep3Complete = async (prompt: PromptConfig) => {
    setSaving(true)
    setSelectedPrompt(prompt)

    // Save client data to database
    const clientData: Client = {
      id: editingClient?.id || `client_${Date.now()}`,
      company: company!,
      admin_user: adminUser!,
      api_config: apiConfig!,
      selected_prompt: prompt,
      created_at: editingClient?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const result = await saveClient(clientData)
    
    if (result.success) {
      onComplete()
    } else {
      alert(`Erro ao salvar cliente: ${result.error}`)
    }
    
    setSaving(false)
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8F9FA" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#FFFFFF" }} className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
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
            </div>
            <div className="text-sm font-medium" style={{ color: "#718096" }}>
              {editingClient ? "Editando Cliente" : "Novo Cliente"}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
        <ProgressIndicator currentStep={currentStep} totalSteps={3} />

        <div className="card-subtle p-8">
          {currentStep === 1 && (
            <Step1CompanyData company={company} adminUser={adminUser} onNext={handleStep1Complete} />
          )}

          {currentStep === 2 && (
            <Step2ApiConfig apiConfig={apiConfig} onNext={handleStep2Complete} onBack={handleBack} />
          )}

          {currentStep === 3 && (
            <Step3PromptSelection 
              selectedPrompt={selectedPrompt} 
              onNext={handleStep3Complete} 
              onBack={handleBack}
              saving={saving}
            />
          )}
        </div>
      </main>
    </div>
  )
}
