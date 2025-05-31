"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Assistant, Tenant, PromptTemplate, ERPConfig } from "@/types"
import { getPromptTemplates, fillPromptPlaceholders } from "@/lib/prompt-templates"
import { Plus, Edit, Trash2, Bot, Settings, FileText, Zap } from "lucide-react"

interface Step4Props {
  assistants?: Assistant[]
  tenant?: Tenant
  erpConfig?: ERPConfig
  onNext: (assistants: Assistant[]) => void
  onBack: () => void
  saving?: boolean
}

export default function Step4AssistantsConfig({
  assistants = [],
  tenant,
  erpConfig,
  onNext,
  onBack,
  saving = false,
}: Step4Props) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [currentAssistants, setCurrentAssistants] = useState<Assistant[]>(assistants)
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null)
  const [showAssistantForm, setShowAssistantForm] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form state for creating/editing assistant
  const [assistantForm, setAssistantForm] = useState({
    name: "",
    description: "",
    selectedTemplate: "",
    placeholders: {} as Record<string, string>,
    enabledFunctions: [] as string[],
    aiConfig: {
      provider: "openai" as const,
      model: "gpt-4",
      temperature: 0.7,
      top_p: 1.0,
      frequency_penalty: 0,
      response_delay: 0,
      max_tokens: 2000,
    },
  })

  useEffect(() => {
    const fetchTemplates = async () => {
      const fetchedTemplates = await getPromptTemplates()
      setTemplates(fetchedTemplates)
      setLoading(false)
    }
    fetchTemplates()
  }, [])

  const generateAssistantId = () => {
    return `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const resetForm = () => {
    setAssistantForm({
      name: "",
      description: "",
      selectedTemplate: "",
      placeholders: {},
      enabledFunctions: [],
      aiConfig: {
        provider: "openai",
        model: "gpt-4",
        temperature: 0.7,
        top_p: 1.0,
        frequency_penalty: 0,
        response_delay: 0,
        max_tokens: 2000,
      },
    })
  }

  const handleCreateAssistant = () => {
    setEditingAssistant(null)
    resetForm()
    setShowAssistantForm(true)
  }

  const handleEditAssistant = (assistant: Assistant) => {
    setEditingAssistant(assistant)
    setAssistantForm({
      name: assistant.name,
      description: assistant.description || "",
      selectedTemplate: assistant.prompt_config.template_id,
      placeholders: assistant.prompt_config.placeholders_filled,
      enabledFunctions: assistant.enabled_functions,
      aiConfig: assistant.ai_config,
    })
    setShowAssistantForm(true)
  }

  const handleDeleteAssistant = (assistantId: string) => {
    if (confirm("Tem certeza que deseja excluir este assistente?")) {
      setCurrentAssistants((prev) => prev.filter((a) => a.id !== assistantId))
    }
  }

  const handleSaveAssistant = () => {
    const template = templates.find((t) => t.id === assistantForm.selectedTemplate)
    if (!template || !assistantForm.name.trim()) {
      alert("Por favor, preencha o nome do assistente e selecione um template.")
      return
    }

    const finalContent = fillPromptPlaceholders(template, assistantForm.placeholders)

    const assistantData: Assistant = {
      id: editingAssistant?.id || generateAssistantId(),
      name: assistantForm.name.trim(),
      description: assistantForm.description.trim(),
      prompt_config: {
        template_id: template.id,
        template_name: template.name,
        final_content: finalContent,
        assistant_config: assistantForm.aiConfig,
        placeholders_filled: assistantForm.placeholders,
      },
      enabled_functions: assistantForm.enabledFunctions,
      ai_config: assistantForm.aiConfig,
      enabled: true,
      created_at: editingAssistant?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (editingAssistant) {
      setCurrentAssistants((prev) => prev.map((a) => (a.id === editingAssistant.id ? assistantData : a)))
    } else {
      setCurrentAssistants((prev) => [...prev, assistantData])
    }

    setShowAssistantForm(false)
    resetForm()
    setEditingAssistant(null)
  }

  const handleSubmit = () => {
    if (currentAssistants.length === 0) {
      alert("Você deve criar pelo menos um assistente.")
      return
    }
    onNext(currentAssistants)
  }

  const selectedTemplate = templates.find((t) => t.id === assistantForm.selectedTemplate)
  const finalContent = selectedTemplate ? fillPromptPlaceholders(selectedTemplate, assistantForm.placeholders) : ""

  const availableFunctions = erpConfig?.enabled_commands || []

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

  if (showAssistantForm) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="label-small">Etapa 4 de 7</div>
          <h2 className="value-large mb-2">{editingAssistant ? "Editar Assistente" : "Criar Novo Assistente"}</h2>
          <p className="text-base" style={{ color: "#718096" }}>
            Configure o prompt, funções e parâmetros de IA
          </p>
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            <TabsTrigger value="functions">Funções</TabsTrigger>
            <TabsTrigger value="ai-config">IA Config</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card className="card-subtle">
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label htmlFor="assistant-name">Nome do Assistente</Label>
                  <Input
                    id="assistant-name"
                    value={assistantForm.name}
                    onChange={(e) => setAssistantForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Assistente de Vendas"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="assistant-description">Descrição (opcional)</Label>
                  <Textarea
                    id="assistant-description"
                    value={assistantForm.description}
                    onChange={(e) => setAssistantForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva a função deste assistente..."
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prompt" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-subtle">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label>Template de Prompt</Label>
                    <Select
                      value={assistantForm.selectedTemplate}
                      onValueChange={(value) => setAssistantForm((prev) => ({ ...prev, selectedTemplate: value }))}
                    >
                      <SelectTrigger className="mt-1">
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

                  {selectedTemplate && (
                    <div className="space-y-4">
                      <p className="text-sm" style={{ color: "#718096" }}>
                        {selectedTemplate.description}
                      </p>

                      {selectedTemplate.placeholders.map((placeholder) => (
                        <div key={placeholder}>
                          <Label>{placeholder.replace(/_/g, " ")}</Label>
                          <Textarea
                            value={assistantForm.placeholders[placeholder] || ""}
                            onChange={(e) =>
                              setAssistantForm((prev) => ({
                                ...prev,
                                placeholders: { ...prev.placeholders, [placeholder]: e.target.value },
                              }))
                            }
                            placeholder={`Digite o valor para ${placeholder}`}
                            className="mt-1 min-h-[80px]"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="card-subtle">
                <CardContent className="p-6">
                  <Label>Preview do Prompt</Label>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto mt-1">
                    <pre className="text-sm whitespace-pre-wrap" style={{ color: "#2D3748" }}>
                      {finalContent || "Selecione um template para visualizar"}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="functions" className="space-y-4">
            <Card className="card-subtle">
              <CardContent className="p-6">
                <Label>Funções Disponíveis</Label>
                <p className="text-sm text-gray-600 mb-4">Selecione quais funções ERP este assistente pode executar</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableFunctions.map((functionName) => (
                    <div key={functionName} className="flex items-center space-x-2">
                      <Switch
                        checked={assistantForm.enabledFunctions.includes(functionName)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAssistantForm((prev) => ({
                              ...prev,
                              enabledFunctions: [...prev.enabledFunctions, functionName],
                            }))
                          } else {
                            setAssistantForm((prev) => ({
                              ...prev,
                              enabledFunctions: prev.enabledFunctions.filter((f) => f !== functionName),
                            }))
                          }
                        }}
                      />
                      <Label className="text-sm">{functionName}</Label>
                    </div>
                  ))}
                </div>
                {availableFunctions.length === 0 && (
                  <p className="text-sm text-gray-500">Nenhuma função ERP disponível. Configure o ERP primeiro.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-config" className="space-y-4">
            <Card className="card-subtle">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Provedor</Label>
                    <Select
                      value={assistantForm.aiConfig.provider}
                      onValueChange={(value: "openai" | "openrouter") =>
                        setAssistantForm((prev) => ({
                          ...prev,
                          aiConfig: { ...prev.aiConfig, provider: value },
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="openrouter">OpenRouter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Modelo</Label>
                    <Select
                      value={assistantForm.aiConfig.model}
                      onValueChange={(value) =>
                        setAssistantForm((prev) => ({
                          ...prev,
                          aiConfig: { ...prev.aiConfig, model: value },
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Temperature: {assistantForm.aiConfig.temperature}</Label>
                  <Slider
                    value={[assistantForm.aiConfig.temperature]}
                    onValueChange={([value]) =>
                      setAssistantForm((prev) => ({
                        ...prev,
                        aiConfig: { ...prev.aiConfig, temperature: value },
                      }))
                    }
                    max={2}
                    min={0}
                    step={0.1}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Controla a criatividade das respostas (0 = mais focado, 2 = mais criativo)
                  </p>
                </div>

                <div>
                  <Label>Top P: {assistantForm.aiConfig.top_p}</Label>
                  <Slider
                    value={[assistantForm.aiConfig.top_p]}
                    onValueChange={([value]) =>
                      setAssistantForm((prev) => ({
                        ...prev,
                        aiConfig: { ...prev.aiConfig, top_p: value },
                      }))
                    }
                    max={1}
                    min={0}
                    step={0.1}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Controla a diversidade das respostas</p>
                </div>

                <div>
                  <Label>Frequency Penalty: {assistantForm.aiConfig.frequency_penalty}</Label>
                  <Slider
                    value={[assistantForm.aiConfig.frequency_penalty]}
                    onValueChange={([value]) =>
                      setAssistantForm((prev) => ({
                        ...prev,
                        aiConfig: { ...prev.aiConfig, frequency_penalty: value },
                      }))
                    }
                    max={2}
                    min={-2}
                    step={0.1}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Penaliza repetições (valores negativos encorajam repetição)
                  </p>
                </div>

                <div>
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    value={assistantForm.aiConfig.max_tokens}
                    onChange={(e) =>
                      setAssistantForm((prev) => ({
                        ...prev,
                        aiConfig: { ...prev.aiConfig, max_tokens: Number.parseInt(e.target.value) || 2000 },
                      }))
                    }
                    className="mt-1"
                    min={1}
                    max={4000}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-6">
          <Button type="button" onClick={() => setShowAssistantForm(false)} variant="outline" className="h-12 px-6">
            Cancelar
          </Button>
          <Button type="button" onClick={handleSaveAssistant} className="btn-primary h-12 px-8">
            {editingAssistant ? "Atualizar Assistente" : "Criar Assistente"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="label-small">Etapa 4 de 7</div>
        <h2 className="value-large mb-2">Configuração de Assistentes</h2>
        <p className="text-base" style={{ color: "#718096" }}>
          Crie e configure seus assistentes de IA
        </p>
      </div>

      {/* Assistants List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold" style={{ color: "#2D3748" }}>
            Assistentes ({currentAssistants.length})
          </h3>
          <Button onClick={handleCreateAssistant} className="btn-primary flex items-center space-x-2">
            <Plus size={16} />
            <span>Novo Assistente</span>
          </Button>
        </div>

        {currentAssistants.length === 0 ? (
          <Card className="card-subtle">
            <CardContent className="p-8 text-center">
              <Bot size={48} className="mx-auto mb-4" style={{ color: "#718096" }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: "#2D3748" }}>
                Nenhum assistente criado
              </h3>
              <p className="text-base mb-6" style={{ color: "#718096" }}>
                Crie seu primeiro assistente para começar
              </p>
              <Button onClick={handleCreateAssistant} className="btn-primary">
                <Plus size={16} className="mr-2" />
                Criar Primeiro Assistente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {currentAssistants.map((assistant) => (
              <Card key={assistant.id} className="card-subtle">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold" style={{ color: "#2D3748" }}>
                        {assistant.name}
                      </h4>
                      {assistant.description && (
                        <p className="text-sm mt-1" style={{ color: "#718096" }}>
                          {assistant.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">{assistant.enabled ? "Ativo" : "Inativo"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <FileText size={14} style={{ color: "#718096" }} />
                      <span className="text-sm" style={{ color: "#718096" }}>
                        {assistant.prompt_config.template_name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap size={14} style={{ color: "#718096" }} />
                      <span className="text-sm" style={{ color: "#718096" }}>
                        {assistant.enabled_functions.length} funções
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Settings size={14} style={{ color: "#718096" }} />
                      <span className="text-sm" style={{ color: "#718096" }}>
                        {assistant.ai_config.model} (T: {assistant.ai_config.temperature})
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-100">
                    <Button
                      onClick={() => handleEditAssistant(assistant)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit size={14} className="mr-1" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDeleteAssistant(assistant.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-6">
        <Button type="button" onClick={onBack} variant="outline" className="h-12 px-6">
          Voltar
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={currentAssistants.length === 0 || saving}
          className="btn-primary h-12 px-8"
        >
          {saving ? "Salvando..." : "Próximo"}
        </Button>
      </div>
    </div>
  )
}
