// components/onboarding-enhanced/step4-assistants-config.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PlusCircle, Trash2, Edit3, Save, XCircle } from "lucide-react"
import type { Assistant, PromptTemplate, Tenant, AssistantConfig as AIConfig } from "@/types" // Renomeado AssistantConfig para AIConfig para evitar conflito
import { getPromptTemplates } from "@/lib/prompt-templates" // Supondo que esta função exista
import { generateUUID } from "@/lib/utils"

interface Step4AssistantsConfigProps {
  initialAssistants?: Assistant[]
  tenant?: Tenant
  onNext: (assistants: Assistant[]) => void
  onBack: () => void
  saving?: boolean
}

const defaultAssistantSettings: AIConfig = {
  provider: "openai",
  model: "gpt-4o",
  temperature: 0.7,
  top_p: 1,
  frequency_penalty: 0,
  response_delay: 0,
  max_tokens: 2048,
}

export default function Step4AssistantsConfig({
  initialAssistants = [],
  tenant,
  onNext,
  onBack,
  saving = false,
}: Step4AssistantsConfigProps) {
  const [assistants, setAssistants] = useState<Assistant[]>(initialAssistants.length > 0 ? initialAssistants : [])
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([])
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)

  useEffect(() => {
    async function loadPromptTemplates() {
      const templates = await getPromptTemplates() // Supondo que retorna todos os templates
      setPromptTemplates(templates)
    }
    loadPromptTemplates()
  }, [])

  useEffect(() => {
    // Se não houver assistentes iniciais e houver templates, cria um assistente padrão
    if (initialAssistants.length === 0 && promptTemplates.length > 0 && assistants.length === 0) {
      handleAddNewAssistant() // Abre o formulário para um novo assistente
    } else if (initialAssistants.length > 0 && assistants.length === 0) {
      setAssistants(initialAssistants)
    }
  }, [initialAssistants, promptTemplates, assistants])

  const handleAddNewAssistant = () => {
    const newAssistant: Assistant = {
      id: generateUUID(),
      client_id: "", // Será preenchido ao salvar o cliente
      name: `Novo Assistente ${assistants.length + 1}`,
      description: "",
      prompt_template_id: promptTemplates[0]?.id || undefined, // Pega o primeiro template como padrão
      model: defaultAssistantSettings.model,
      temperature: defaultAssistantSettings.temperature,
      max_tokens: defaultAssistantSettings.max_tokens,
      system_prompt: promptTemplates[0]?.template || "", // Pega o template do prompt como system_prompt inicial
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      prompt_config: {
        // Adiciona prompt_config para consistência com o tipo Assistant
        template_id: promptTemplates[0]?.id || "",
        template_name: promptTemplates[0]?.name || "",
        final_content: "", // Será gerado pela lógica da aplicação
        assistant_config: { ...defaultAssistantSettings, model: defaultAssistantSettings.model },
        placeholders_filled: {},
      },
    }
    setEditingAssistant(newAssistant)
    setIsAddingNew(true)
  }

  const handleEditAssistant = (assistant: Assistant) => {
    setEditingAssistant({ ...assistant })
    setIsAddingNew(false)
  }

  const handleSaveAssistant = () => {
    if (!editingAssistant) return

    const filledSystemPrompt = fillPlaceholders(
      editingAssistant.system_prompt || "",
      editingAssistant.prompt_config?.placeholders_filled || {},
      tenant,
    )

    const assistantToSave = { ...editingAssistant, system_prompt: filledSystemPrompt }

    if (isAddingNew) {
      setAssistants((prev) => [...prev, assistantToSave])
    } else {
      setAssistants((prev) => prev.map((a) => (a.id === assistantToSave.id ? assistantToSave : a)))
    }
    setEditingAssistant(null)
    setIsAddingNew(false)
  }

  const handleDeleteAssistant = (assistantId: string) => {
    setAssistants((prev) => prev.filter((a) => a.id !== assistantId))
  }

  const handleCancelEdit = () => {
    setEditingAssistant(null)
    setIsAddingNew(false)
  }

  const handleAssistantChange = (field: keyof Assistant, value: any) => {
    if (!editingAssistant) return

    let newEditingAssistant = { ...editingAssistant, [field]: value }

    if (field === "prompt_template_id") {
      const selectedTemplate = promptTemplates.find((pt) => pt.id === value)
      if (selectedTemplate) {
        newEditingAssistant = {
          ...newEditingAssistant,
          system_prompt: selectedTemplate.template, // Atualiza o system_prompt com o conteúdo do template
          prompt_config: {
            ...(newEditingAssistant.prompt_config || {
              assistant_config: defaultAssistantSettings,
              placeholders_filled: {},
              final_content: "",
            }), // Garante que prompt_config exista
            template_id: selectedTemplate.id,
            template_name: selectedTemplate.name,
          },
        }
      }
    }
    setEditingAssistant(newEditingAssistant)
  }

  const handleAIConfigChange = (field: keyof AIConfig, value: any) => {
    if (!editingAssistant) return
    const currentAIConfig = editingAssistant.prompt_config?.assistant_config || defaultAssistantSettings
    const updatedAIConfig = { ...currentAIConfig, [field]: value }

    setEditingAssistant((prev) => ({
      ...prev!,
      model: field === "model" ? value : prev!.model,
      temperature: field === "temperature" ? Number.parseFloat(value) : prev!.temperature,
      max_tokens: field === "max_tokens" ? Number.parseInt(value) : prev!.max_tokens,
      prompt_config: {
        ...(prev!.prompt_config || { template_id: "", template_name: "", final_content: "", placeholders_filled: {} }),
        assistant_config: updatedAIConfig,
      },
    }))
  }

  const fillPlaceholders = (template: string, values: Record<string, string>, currentTenant?: Tenant) => {
    let content = template
    if (currentTenant) {
      content = content.replace(/\[Nome da Empresa Cliente\]/gi, currentTenant.name)
      // Adicionar mais placeholders globais do tenant aqui se necessário
    }
    for (const key in values) {
      content = content.replace(new RegExp(`\\[${key}\\]`, "gi"), values[key])
    }
    return content
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext(assistants)
  }

  const canProceed = assistants.length > 0

  if (editingAssistant) {
    const currentTemplate = promptTemplates.find((pt) => pt.id === editingAssistant.prompt_template_id)
    const placeholders = currentTemplate?.placeholders || []
    const aiConfig = editingAssistant.prompt_config?.assistant_config || defaultAssistantSettings

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{isAddingNew ? "Adicionar Novo Assistente" : "Editar Assistente"}</CardTitle>
          <CardDescription>Configure os detalhes do assistente de IA.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label htmlFor="assistantName" className="label-small">
              Nome do Assistente
            </label>
            <Input
              id="assistantName"
              value={editingAssistant.name}
              onChange={(e) => handleAssistantChange("name", e.target.value)}
              placeholder="Ex: Assistente de Vendas"
              className="input-custom h-12"
            />
          </div>
          <div>
            <label htmlFor="assistantDescription" className="label-small">
              Descrição
            </label>
            <Textarea
              id="assistantDescription"
              value={editingAssistant.description || ""}
              onChange={(e) => handleAssistantChange("description", e.target.value)}
              placeholder="Descreva o propósito deste assistente"
              className="input-custom"
            />
          </div>
          <div>
            <label htmlFor="promptTemplate" className="label-small">
              Template de Prompt
            </label>
            <Select
              value={editingAssistant.prompt_template_id || ""}
              onValueChange={(value) => handleAssistantChange("prompt_template_id", value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                {promptTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({template.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="systemPrompt" className="label-small">
              Prompt de Sistema (Instruções Base)
            </label>
            <Textarea
              id="systemPrompt"
              value={editingAssistant.system_prompt || ""}
              onChange={(e) => handleAssistantChange("system_prompt", e.target.value)}
              placeholder="Ex: Você é um assistente virtual da [Nome da Empresa Cliente]..."
              className="input-custom min-h-[120px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Este é o prompt base. Use placeholders como [Nome da Empresa Cliente]. Placeholders específicos do
              template selecionado (se houver): {placeholders.join(", ") || "Nenhum"}
            </p>
          </div>

          {/* AI Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações de IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="aiModel" className="label-small">
                  Modelo
                </label>
                <Select value={aiConfig.model} onValueChange={(value) => handleAIConfigChange("model", value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o (OpenAI)</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo (OpenAI)</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (OpenAI)</SelectItem>
                    <SelectItem value="mistralai/Mixtral-8x7B-Instruct-v0.1">Mixtral 8x7B (OpenRouter)</SelectItem>
                    <SelectItem value="google/gemini-pro">Gemini Pro (OpenRouter/Google)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="aiTemperature" className="label-small">
                    Temperatura
                  </label>
                  <Input
                    id="aiTemperature"
                    type="number"
                    value={aiConfig.temperature}
                    onChange={(e) => handleAIConfigChange("temperature", Number.parseFloat(e.target.value))}
                    step="0.1"
                    min="0"
                    max="2"
                    className="input-custom h-12"
                  />
                </div>
                <div>
                  <label htmlFor="aiMaxTokens" className="label-small">
                    Max Tokens
                  </label>
                  <Input
                    id="aiMaxTokens"
                    type="number"
                    value={aiConfig.max_tokens || 2048}
                    onChange={(e) => handleAIConfigChange("max_tokens", Number.parseInt(e.target.value))}
                    step="1"
                    min="1"
                    className="input-custom h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={handleCancelEdit} className="h-11">
              <XCircle size={18} className="mr-2" /> Cancelar
            </Button>
            <Button onClick={handleSaveAssistant} className="btn-primary h-11">
              <Save size={18} className="mr-2" /> Salvar Assistente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="text-center mb-8">
        <div className="label-small">Etapa 4 de 7</div>
        <h2 className="value-large mb-2">Configuração de Assistentes de IA</h2>
        <p className="text-base" style={{ color: "#718096" }}>
          Crie e configure os assistentes de IA que serão usados pelo cliente.
        </p>
      </div>

      <div className="space-y-4">
        {assistants.map((assistant) => (
          <Card key={assistant.id} className="card-subtle">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg" style={{ color: "#2D3748" }}>
                  {assistant.name}
                </h3>
                <p className="text-sm text-gray-600">{assistant.description || "Sem descrição"}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Modelo: {assistant.model} | Template:{" "}
                  {promptTemplates.find((pt) => pt.id === assistant.prompt_template_id)?.name || "N/A"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={() => handleEditAssistant(assistant)} title="Editar">
                  <Edit3 size={18} className="text-gray-500" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteAssistant(assistant.id)} title="Excluir">
                  <Trash2 size={18} className="text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Button type="button" variant="outline" onClick={handleAddNewAssistant} className="w-full h-12">
          <PlusCircle size={20} className="mr-2" /> Adicionar Novo Assistente
        </Button>
      </div>

      {!canProceed && assistants.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <p className="text-yellow-800 text-sm">Adicione pelo menos um assistente para continuar.</p>
        </div>
      )}

      <div className="flex justify-between pt-8">
        <Button type="button" onClick={onBack} variant="outline" className="h-12 px-6">
          Voltar
        </Button>
        <Button type="submit" disabled={!canProceed || saving} className="btn-primary h-12 px-8">
          {saving ? "Salvando..." : "Próximo"}
        </Button>
      </div>
    </form>
  )
}
