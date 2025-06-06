"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { PromptConfig, Tenant, PromptTemplate } from "@/types"
import { getPromptTemplates, fillPromptPlaceholders } from "@/lib/prompt-templates"
// Add import for validation
import { validatePromptConfiguration } from "@/lib/validation-utils"

interface Step4Props {
  promptConfig?: PromptConfig
  tenant?: Tenant
  onNext: (promptConfig: PromptConfig) => void
  onBack: () => void
  saving?: boolean
}

export default function Step4PromptConfig({ promptConfig, tenant, onNext, onBack, saving = false }: Step4Props) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState(promptConfig?.template_id || "")
  const [placeholders, setPlaceholders] = useState<Record<string, string>>(promptConfig?.placeholders_filled || {})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTemplates = async () => {
      const fetchedTemplates = await getPromptTemplates()
      setTemplates(fetchedTemplates)
      setLoading(false)
    }
    fetchTemplates()
  }, [])

  const template = templates.find((t) => t.id === selectedTemplate)
  const finalContent = template ? fillPromptPlaceholders(template, placeholders) : ""

  // Update the handleSubmit function to include validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (template) {
      const promptConfigData = {
        template_id: template.id,
        template_name: template.name,
        final_content: finalContent,
        assistant_config: {
          provider: "openai",
          model: "gpt-4",
          temperature: 0.7,
          top_p: 1.0,
          frequency_penalty: 0,
          response_delay: 0,
        },
        placeholders_filled: placeholders,
      }

      // Validate the prompt configuration before proceeding
      const validation = await validatePromptConfiguration(promptConfigData)

      if (!validation.isValid) {
        console.error("Prompt validation failed:", validation.errors)
        alert(`Erro na validação: ${validation.errors.join(", ")}`)
        return
      }

      if (validation.warnings.length > 0) {
        console.warn("Prompt validation warnings:", validation.warnings)
      }

      onNext(promptConfigData)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#01D5AC] mx-auto mb-4"></div>
          <p style={{ color: "#718096" }}>Carregando templates...</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <div className="label-small">Etapa 4 de 7</div>
        <h2 className="value-large mb-2">Configuração de Prompts</h2>
        <p className="text-base" style={{ color: "#718096" }}>
          Selecione e personalize o prompt do assistente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-subtle p-6">
          <div className="mb-6">
            <div className="label-small">Template de Prompt</div>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione o template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {template && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "#718096" }}>
                {template.description}
              </p>

              {template.placeholders.map((placeholder) => (
                <div key={placeholder}>
                  <div className="label-small">{placeholder.replace(/_/g, " ")}</div>
                  <Textarea
                    value={placeholders[placeholder] || ""}
                    onChange={(e) => setPlaceholders((prev) => ({ ...prev, [placeholder]: e.target.value }))}
                    placeholder={`Digite o valor para ${placeholder}`}
                    className="min-h-[80px]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-subtle p-6">
          <div className="label-small">Preview do Prompt</div>
          <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap" style={{ color: "#2D3748" }}>
              {finalContent || "Selecione um template para visualizar"}
            </pre>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button type="button" onClick={onBack} variant="outline" className="h-12 px-6">
          Voltar
        </Button>
        <Button type="submit" disabled={!selectedTemplate || saving} className="btn-primary h-12 px-8">
          {saving ? "Salvando..." : "Próximo"}
        </Button>
      </div>
    </form>
  )
}
