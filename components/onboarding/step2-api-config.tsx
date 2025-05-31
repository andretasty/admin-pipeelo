"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ApiConfig } from "@/types"
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react"

interface Step2Props {
  apiConfig?: ApiConfig
  onNext: (apiConfig: ApiConfig) => void
  onBack: () => void
}

export default function Step2ApiConfig({ apiConfig = {}, onNext, onBack }: Step2Props) {
  const [config, setConfig] = useState<ApiConfig>(apiConfig)
  const [showKeys, setShowKeys] = useState({ openai: false, openrouter: false })
  const [testing, setTesting] = useState({ openai: false, openrouter: false })
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({})

  const handleTestApi = async (provider: "openai" | "openrouter") => {
    const key = provider === "openai" ? config.openai_key : config.openrouter_key

    if (!key) return

    setTesting((prev) => ({ ...prev, [provider]: true }))

    // Simulate API test - in real app, this would make actual API calls
    setTimeout(() => {
      const isValid = key.length > 10 // Simple validation
      setTestResults((prev) => ({ ...prev, [provider]: isValid }))
      setTesting((prev) => ({ ...prev, [provider]: false }))
    }, 2000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext(config)
  }

  const canProceed = config.openai_key || config.openrouter_key

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center section-spacing">
        <div className="label-small">Etapa 2 de 3</div>
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
          {testResults.openai !== undefined &&
            (testResults.openai ? (
              <CheckCircle className="text-green-500" size={24} />
            ) : (
              <XCircle className="text-red-500" size={24} />
            ))}
        </div>
        <p className="text-sm mb-6" style={{ color: "#718096" }}>
          Chave de API para acessar os modelos da OpenAI (GPT-4, GPT-3.5, etc.)
        </p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="openai-key">API Key</Label>
            <div className="relative">
              <Input
                id="openai-key"
                type={showKeys.openai ? "text" : "password"}
                value={config.openai_key || ""}
                onChange={(e) => setConfig((prev) => ({ ...prev, openai_key: e.target.value }))}
                placeholder="sk-..."
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                <button
                  type="button"
                  onClick={() => setShowKeys((prev) => ({ ...prev, openai: !prev.openai }))}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showKeys.openai ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {config.openai_key && (
            <Button
              type="button"
              onClick={() => handleTestApi("openai")}
              disabled={testing.openai}
              variant="outline"
              size="sm"
            >
              {testing.openai ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                "Testar Conexão"
              )}
            </Button>
          )}

          {testResults.openai !== undefined && (
            <div className={`text-sm ${testResults.openai ? "text-green-600" : "text-red-600"}`}>
              {testResults.openai ? "Conexão bem-sucedida!" : "Falha na conexão. Verifique a chave."}
            </div>
          )}
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
          {testResults.openrouter !== undefined &&
            (testResults.openrouter ? (
              <CheckCircle className="text-green-500" size={24} />
            ) : (
              <XCircle className="text-red-500" size={24} />
            ))}
        </div>
        <p className="text-sm mb-6" style={{ color: "#718096" }}>
          Chave de API para acessar múltiplos modelos através do OpenRouter
        </p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="openrouter-key">API Key</Label>
            <div className="relative">
              <Input
                id="openrouter-key"
                type={showKeys.openrouter ? "text" : "password"}
                value={config.openrouter_key || ""}
                onChange={(e) => setConfig((prev) => ({ ...prev, openrouter_key: e.target.value }))}
                placeholder="sk-or-..."
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                <button
                  type="button"
                  onClick={() => setShowKeys((prev) => ({ ...prev, openrouter: !prev.openrouter }))}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showKeys.openrouter ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {config.openrouter_key && (
            <Button
              type="button"
              onClick={() => handleTestApi("openrouter")}
              disabled={testing.openrouter}
              variant="outline"
              size="sm"
            >
              {testing.openrouter ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                "Testar Conexão"
              )}
            </Button>
          )}

          {testResults.openrouter !== undefined && (
            <div className={`text-sm ${testResults.openrouter ? "text-green-600" : "text-red-600"}`}>
              {testResults.openrouter ? "Conexão bem-sucedida!" : "Falha na conexão. Verifique a chave."}
            </div>
          )}
        </div>
      </div>

      {!canProceed && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
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
        <Button type="submit" disabled={!canProceed} className="btn-primary h-12 px-8">
          Próximo
        </Button>
      </div>
    </form>
  )
}
