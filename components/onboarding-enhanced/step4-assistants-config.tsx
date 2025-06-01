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
import type { Assistant, Tenant, PromptTemplate, ErpConfiguration, Prompt, Function, AssistantConfig, AssistantWithFunctions } from "@/types"
import { getPromptTemplates } from "@/lib/prompt-templates" // Removed fillPromptPlaceholders
import { Plus, Edit, Trash2, Bot, Settings, FileText, Zap } from "lucide-react"
import { savePrompt, getPrompts, saveFunction as saveFunctionDb, getFunctions, saveAssistantWithFunctions } from "@/lib/database"

interface Step4Props {
  assistants?: AssistantWithFunctions[]
  tenant?: Tenant
  erpConfig?: ErpConfiguration
  onNext: (assistants: AssistantWithFunctions[]) => void
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
  const [currentAssistants, setCurrentAssistants] = useState<AssistantWithFunctions[]>(assistants)
  const [editingAssistant, setEditingAssistant] = useState<AssistantWithFunctions | null>(null)
  const [showAssistantForm, setShowAssistantForm] = useState(false)
  const [loading, setLoading] = useState(true)

  interface AssistantFormState {
    name: string;
    description: string;
    selectedPromptId: string | null;
    newPrompt: {
      name: string;
      description: string;
      content: string;
      templateId: string | null;
    };
    isCreatingNewPrompt: boolean;
    selectedFunctionIds: string[];
    newFunction: {
      name: string;
      description: string;
      schema: string;
    };
    isCreatingNewFunction: boolean;
    aiConfig: AssistantConfig;
  }

  // Form state for creating/editing assistant
  const [assistantForm, setAssistantForm] = useState<AssistantFormState>({
    name: "",
    description: "",
    // Para o Prompt
    selectedPromptId: null,
    newPrompt: {
      name: "",
      description: "",
      content: "",
      templateId: null,
    },
    isCreatingNewPrompt: false,

    // Para as Funções
    selectedFunctionIds: [],
    newFunction: {
      name: "",
      description: "",
      schema: "", // Schema em string JSON
    },
    isCreatingNewFunction: false,

    // Configurações de IA (mantém-se)
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

  // Novos estados para armazenar prompts e funções disponíveis para seleção
  const [availablePrompts, setAvailablePrompts] = useState<Prompt[]>([])
  const [availableFunctions, setAvailableFunctions] = useState<Function[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const fetchedTemplates = await getPromptTemplates()
      setTemplates(fetchedTemplates)

      if (tenant?.id) {
        try {
          const { data: fetchedPrompts } = await getPrompts(tenant.id)
          setAvailablePrompts(fetchedPrompts || [])
          const { data: fetchedFunctions } = await getFunctions(tenant.id)
          setAvailableFunctions(fetchedFunctions || [])
        } catch (error) {
          console.error("Erro ao buscar prompts ou funções:", error)
          // Tratar erro, talvez exibir uma mensagem para o usuário
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [tenant])

  const generateAssistantId = () => {
    return `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const resetForm = () => {
    setAssistantForm({
      name: "",
      description: "",
      selectedPromptId: null,
      newPrompt: {
        name: "",
        description: "",
        content: "",
        templateId: null,
      },
      isCreatingNewPrompt: false,
      selectedFunctionIds: [],
      newFunction: {
        name: "",
        description: "",
        schema: "",
      },
      isCreatingNewFunction: false,
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

  const handleEditAssistant = (assistant: AssistantWithFunctions) => {
    setEditingAssistant(assistant)
    // TODO: Ao editar, precisamos carregar o prompt e as funções associadas
    // Isso exigirá uma lógica mais complexa para preencher o formulário
    // com base nos IDs do prompt e das funções.
    // Por enquanto, vamos preencher apenas o básico.
    setAssistantForm((prev) => ({
      ...prev,
      name: assistant.name,
      description: assistant.description || "",
      selectedPromptId: assistant.prompt_id, // Usar o novo prompt_id
      selectedFunctionIds: assistant.function_ids || [],
      aiConfig: assistant.ai_config,
      isCreatingNewPrompt: false, // Assume que estamos editando um prompt existente
      isCreatingNewFunction: false, // Assume que estamos editando funções existentes
    }))
    setShowAssistantForm(true)
  }

  const handleDeleteAssistant = (assistantId: string) => {
    if (confirm("Tem certeza que deseja excluir este assistente?")) {
      setCurrentAssistants((prev) => prev.filter((a) => a.id !== assistantId))
    }
  }

  const handleSaveAssistant = async () => { // Tornar a função assíncrona
    if (!tenant?.id) {
      alert("Tenant ID não disponível. Não é possível salvar o assistente.");
      return;
    }

    // 1. Validar nome do assistente
    if (!assistantForm.name.trim()) {
      alert("Por favor, preencha o nome do assistente.")
      return
    }

    let finalPromptId: string | null = null;
    let finalFunctionIds: string[] = [];

    // 2. Lógica para o Prompt
    if (assistantForm.isCreatingNewPrompt) {
      // Validar novo prompt
      if (!assistantForm.newPrompt.name.trim() || !assistantForm.newPrompt.content.trim()) {
        alert("Por favor, preencha o nome e o conteúdo do novo prompt.")
        return
      }
      try {
        const { success, data: newPrompt, error } = await savePrompt({
          id: '',
          tenant_id: tenant.id,
          name: assistantForm.newPrompt.name,
          description: assistantForm.newPrompt.description,
          content: assistantForm.newPrompt.content,
          prompt_template_id: assistantForm.newPrompt.templateId || undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Prompt);
        if (!success || !newPrompt) throw new Error(error || 'Erro ao criar prompt');
        finalPromptId = newPrompt.id;
      } catch (error) {
        console.error("Erro ao criar prompt:", error);
        alert("Erro ao criar prompt. Verifique o console.");
        return;
      }
    } else {
      // Usar prompt existente
      if (!assistantForm.selectedPromptId) {
        alert("Por favor, selecione um prompt existente.")
        return
      }
      finalPromptId = assistantForm.selectedPromptId;
    }

    // 3. Lógica para as Funções
    if (assistantForm.isCreatingNewFunction) {
      // Validar nova função
      if (!assistantForm.newFunction.name.trim() || !assistantForm.newFunction.schema.trim()) {
        alert("Por favor, preencha o nome e o schema da nova função.")
        return
      }
      try {
        const { success, data: newFunc, error } = await saveFunctionDb({
          id: '',
          tenant_id: tenant.id,
          name: assistantForm.newFunction.name,
          description: assistantForm.newFunction.description,
          schema: JSON.parse(assistantForm.newFunction.schema),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Function);
        if (!success || !newFunc) throw new Error(error || 'Erro ao criar função');
        finalFunctionIds.push(newFunc.id);
      } catch (error) {
        console.error("Erro ao criar função:", error);
        alert("Erro ao criar função. Verifique o console.");
        return;
      }
    }
    // Adicionar funções selecionadas (se houver)
    finalFunctionIds = [...finalFunctionIds, ...assistantForm.selectedFunctionIds];


    // 4. Construir o objeto Assistant para salvar
    const assistantData: Assistant = {
      id: editingAssistant?.id || generateAssistantId(),
      tenant_id: tenant.id,
      name: assistantForm.name.trim(),
      description: assistantForm.description.trim(),
      prompt_id: finalPromptId!, // Usar o ID do prompt final
      ai_config: assistantForm.aiConfig,
      enabled: true, // Ou um campo de formulário para isso
      created_at: editingAssistant?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // 5. Chamar API para salvar/atualizar o assistente
    try {
      const { success, data: savedAssistant, error } = await saveAssistantWithFunctions(assistantData, finalFunctionIds);
      if (!success || !savedAssistant) throw new Error(error || 'Erro ao salvar assistente');
      const savedWithFuncs: AssistantWithFunctions = { ...savedAssistant, function_ids: finalFunctionIds };
      if (editingAssistant) {
        setCurrentAssistants((prev) => prev.map((a) => (a.id === editingAssistant.id ? savedWithFuncs : a)))
      } else {
        setCurrentAssistants((prev) => [...prev, savedWithFuncs])
      }
      setShowAssistantForm(false)
      resetForm()
      setEditingAssistant(null)
    } catch (error) {
      console.error("Erro ao salvar assistente:", error);
      alert("Erro ao salvar assistente. Verifique o console.");
    }
  }

  const handleSubmit = () => {
    if (currentAssistants.length === 0) {
      alert("Você deve criar pelo menos um assistente.")
      return
    }
    onNext(currentAssistants)
  }

  // Removido: selectedTemplate e finalContent baseados em template antigo
  // const selectedTemplate = templates.find((t) => t.id === assistantForm.selectedTemplate)
  // const finalContent = selectedTemplate ? fillPromptPlaceholders(selectedTemplate, assistantForm.placeholders) : ""

  // Removido: availableFunctions baseado em erpConfig.enabled_commands
  // const availableFunctions = erpConfig?.enabled_commands || []

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
                  {/* Toggle para Criar Novo ou Selecionar Existente */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={assistantForm.isCreatingNewPrompt}
                      onCheckedChange={(checked) => setAssistantForm((prev) => ({ ...prev, isCreatingNewPrompt: checked }))}
                    />
                    <Label>{assistantForm.isCreatingNewPrompt ? "Criar Novo Prompt" : "Selecionar Prompt Existente"}</Label>
                  </div>

                  {assistantForm.isCreatingNewPrompt ? (
                    // UI para Criar Novo Prompt
                    <div className="space-y-4">
                      <div>
                        <Label>Nome do Prompt</Label>
                        <Input
                          value={assistantForm.newPrompt.name}
                          onChange={(e) => setAssistantForm((prev) => ({ ...prev, newPrompt: { ...prev.newPrompt, name: e.target.value } }))}
                          placeholder="Ex: Prompt de Atendimento ao Cliente"
                        />
                      </div>
                      <div>
                        <Label>Descrição do Prompt (opcional)</Label>
                        <Textarea
                          value={assistantForm.newPrompt.description}
                          onChange={(e) => setAssistantForm((prev) => ({ ...prev, newPrompt: { ...prev.newPrompt, description: e.target.value } }))}
                          placeholder="Descreva a finalidade deste prompt"
                        />
                      </div>
                      <div>
                        <Label>Template de Prompt (opcional)</Label>
                        <Select
                          value={assistantForm.newPrompt.templateId || ""}
                          onValueChange={(value) => {
                            const selectedTemplate = templates.find((t) => t.id === value);
                            setAssistantForm((prev) => ({
                              ...prev,
                              newPrompt: {
                                ...prev.newPrompt,
                                templateId: value,
                                content: selectedTemplate ? selectedTemplate.content : prev.newPrompt.content, // Preenche o conteúdo
                              },
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um template para usar como base" />
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
                      <div>
                        <Label>Conteúdo do Prompt</Label>
                        <Textarea
                          value={assistantForm.newPrompt.content}
                          onChange={(e) => setAssistantForm((prev) => ({ ...prev, newPrompt: { ...prev.newPrompt, content: e.target.value } }))}
                          placeholder="Insira o conteúdo do prompt aqui..."
                          className="min-h-[150px]"
                        />
                      </div>
                    </div>
                  ) : (
                    // UI para Selecionar Prompt Existente
                    <div>
                      <Label>Selecionar Prompt</Label>
                      <Select
                        value={assistantForm.selectedPromptId || ""}
                        onValueChange={(value) => setAssistantForm((prev) => ({ ...prev, selectedPromptId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um prompt existente" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePrompts.map((prompt) => (
                            <SelectItem key={prompt.id} value={prompt.id}>
                              {prompt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="card-subtle">
                <CardContent className="p-6">
                  <Label>Preview do Prompt</Label>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto mt-1">
                    <pre className="text-sm whitespace-pre-wrap" style={{ color: "#2D3748" }}>
                      {assistantForm.isCreatingNewPrompt ? assistantForm.newPrompt.content : availablePrompts.find(p => p.id === assistantForm.selectedPromptId)?.content || "Selecione ou crie um prompt para visualizar"}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="functions" className="space-y-4">
            <Card className="card-subtle">
              <CardContent className="p-6 space-y-4">
                {/* Toggle para Criar Nova ou Selecionar Existente */}
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={assistantForm.isCreatingNewFunction}
                    onCheckedChange={(checked) => setAssistantForm((prev) => ({ ...prev, isCreatingNewFunction: checked }))}
                  />
                  <Label>{assistantForm.isCreatingNewFunction ? "Criar Nova Função" : "Selecionar Funções Existentes"}</Label>
                </div>

                {assistantForm.isCreatingNewFunction ? (
                  // UI para Criar Nova Função
                  <div className="space-y-4">
                    <div>
                      <Label>Nome da Função</Label>
                      <Input
                        value={assistantForm.newFunction.name}
                        onChange={(e) => setAssistantForm((prev) => ({ ...prev, newFunction: { ...prev.newFunction, name: e.target.value } }))}
                        placeholder="Ex: get_customer_info"
                      />
                    </div>
                    <div>
                      <Label>Descrição da Função (opcional)</Label>
                      <Textarea
                        value={assistantForm.newFunction.description}
                        onChange={(e) => setAssistantForm((prev) => ({ ...prev, newFunction: { ...prev.newFunction, description: e.target.value } }))}
                        placeholder="Descreva o que esta função faz"
                      />
                    </div>
                    <div>
                      <Label>Schema da Função (JSON)</Label>
                      <Textarea
                        value={assistantForm.newFunction.schema}
                        onChange={(e) => setAssistantForm((prev) => ({ ...prev, newFunction: { ...prev.newFunction, schema: e.target.value } }))}
                        placeholder={`{\n  "type": "object",\n  "properties": {\n    "param1": { "type": "string" }\n  }\n}`}
                        className="min-h-[150px] font-mono"
                      />
                      {/* TODO: Adicionar validação de JSON */}
                    </div>
                  </div>
                ) : (
                  // UI para Selecionar Funções Existentes
                  <div>
                    <Label>Funções Disponíveis</Label>
                    <p className="text-sm text-gray-600 mb-4">Selecione quais funções este assistente pode executar</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availableFunctions.map((func) => (
                        <div key={func.id} className="flex items-center space-x-2">
                          <Switch
                            checked={assistantForm.selectedFunctionIds.includes(func.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAssistantForm((prev) => ({
                                  ...prev,
                                  selectedFunctionIds: [...prev.selectedFunctionIds, func.id],
                                }))
                              } else {
                                setAssistantForm((prev) => ({
                                  ...prev,
                                  selectedFunctionIds: prev.selectedFunctionIds.filter((fId) => fId !== func.id),
                                }))
                              }
                            }}
                          />
                          <Label className="text-sm">{func.name}</Label>
                        </div>
                      ))}
                    </div>
                    {availableFunctions.length === 0 && (
                      <p className="text-sm text-gray-500">Nenhuma função disponível. Crie uma nova ou configure o ERP.</p>
                    )}
                  </div>
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
            {currentAssistants.map((assistant) => {
              const assistantPrompt = availablePrompts.find(p => p.id === assistant.prompt_id);
              const promptName = assistantPrompt ? assistantPrompt.name : "Prompt não encontrado";
              const functionsCount = assistant.function_ids ? assistant.function_ids.length : 0;

              return (
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
                          {promptName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Zap size={14} style={{ color: "#718096" }} />
                        <span className="text-sm" style={{ color: "#718096" }}>
                          {functionsCount} funções
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
              )
            })}
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
