"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ApiConfiguration } from "@/types"
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { ExternalApiClient } from "@/lib/external-api"
import { getAuthToken } from "@/lib/storage"

interface Step2Props {
  apiConfig?: ApiConfiguration
  onNext: (apiConfig: ApiConfiguration) => void
  onBack: () => void
  saving?: boolean
  authToken?: string | null
}

export default function Step2ApiConfig({ apiConfig, onNext, onBack, saving = false, authToken }: Step2Props) {
  const [config, setConfig] = useState<ApiConfiguration>({
    openai_key: apiConfig?.openai_key || "",
    openrouter_key: apiConfig?.openrouter_key || "",
  })
  const [showKeys, setShowKeys] = useState({ openai: false, openrouter: false })
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const token = authToken || getAuthToken()
    if (!token) {
      console.error("Authentication token not available.")
      setIsSaving(false)
      return
    }

    const apiClient = new ExternalApiClient()
    apiClient.setAuthToken(token)

    try {
      if (config.openai_key) {
        await apiClient.updateOpenAI(config.openai_key)
        console.log("OpenAI key updated successfully.")
      }
      if (config.openrouter_key) {
        await apiClient.updateOpenRouter(config.openrouter_key)
        console.log("OpenRouter key updated successfully.")
      }
      onNext(config)
    } catch (error) {
      console.error("Failed to update API keys:", error)
      // Optionally, show an error message to the user
    } finally {
      setIsSaving(false)
    }
  }

  const canProceed = config.openai_key || config.openrouter_key

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <div className="label-small">Etapa 2 de 7</div>
        <h2 className="value-large mb-2">Configuração de APIs</h2>
        <p className="text-base" style={{ color: "#718096" }}>
          Configure as chaves de API para integração com serviços de IA
        </p>
      </div>

      {/* OpenAI API */}
      <div className="card-subtle p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="label-small">Provedor de IA</div>
            <h3 className="text-xl font-semibold" style={{ color: "#2D3748" }}>
              OpenAI API
            </h3>
          </div>
        </div>
        <p className="text-sm mb-6" style={{ color: "#718096" }}>
          Chave de API para acessar os modelos da OpenAI (GPT-4, GPT-3.5, etc.)
        </p>
        <div className="space-y-4">
          <div>
            <div className="label-small">API Key</div>
            <div className="relative">
              <Input
                type={showKeys.openai ? "text" : "password"}
                value={config.openai_key || ""}
                onChange={(e) => setConfig((prev: ApiConfiguration) => ({ ...prev, openai_key: e.target.value }))}
                placeholder="sk-..."
                className="input-custom h-12 pr-20"
                style={{ color: "#2D3748" }}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <button
                  type="button"
                  onClick={() => setShowKeys((prev) => ({ ...prev, openai: !prev.openai }))}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showKeys.openai ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OpenRouter API */}
      <div className="card-subtle p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="label-small">Provedor de IA</div>
            <h3 className="text-xl font-semibold" style={{ color: "#2D3748" }}>
              OpenRouter API
            </h3>
          </div>
        </div>
        <p className="text-sm mb-6" style={{ color: "#718096" }}>
          Chave de API para acessar múltiplos modelos através do OpenRouter
        </p>
        <div className="space-y-4">
          <div>
            <div className="label-small">API Key</div>
            <div className="relative">
              <Input
                type={showKeys.openrouter ? "text" : "password"}
                value={config.openrouter_key || ""}
                onChange={(e) => setConfig((prev: ApiConfiguration) => ({ ...prev, openrouter_key: e.target.value }))}
                placeholder="sk-or-..."
                className="input-custom h-12 pr-20"
                style={{ color: "#2D3748" }}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <button
                  type="button"
                  onClick={() => setShowKeys((prev) => ({ ...prev, openrouter: !prev.openrouter }))}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showKeys.openrouter ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!canProceed && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">Configure pelo menos uma API para continuar.</p>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="h-12 px-6 rounded-lg border-gray-200 hover:bg-gray-50 transition-all duration-200"
          style={{ color: "#718096" }}
        >
          Voltar
        </Button>
        <Button 
          type="submit" 
          disabled={!canProceed || saving} 
          className="btn-primary h-12 px-8"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            "Próximo"
          )}
        </Button>
      </div>
    </form>
  )
}
