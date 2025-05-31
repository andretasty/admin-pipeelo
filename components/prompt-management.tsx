"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  getPromptTemplates,
  createPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate,
} from "@/lib/prompt-database"
import { extractPlaceholders } from "@/lib/prompt-templates"
import { Plus, Trash2, Edit, FileText, Tag, Eye } from "lucide-react"
import type { PromptTemplate } from "@/types"

interface PromptManagementProps {
  onBack: () => void
}

export default function PromptManagement({ onBack }: PromptManagementProps) {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null)
  const [formData, setFormData] = useState<Partial<PromptTemplate>>({
    name: "",
    description: "",
    category: "",
    sector: "",
    content: "",
    placeholders: [],
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Available categories for prompts
  const categories = [
    { value: "support", label: "Atendimento" },
    { value: "sales", label: "Vendas" },
    { value: "marketing", label: "Marketing" },
    { value: "technical", label: "Técnico" },
    { value: "general", label: "Geral" },
  ]

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getPromptTemplates()
      setPrompts(data)
    } catch (err) {
      setError("Erro ao carregar prompts")
      console.error("Error fetching prompts:", err)
    }

    setLoading(false)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name?.trim()) errors.name = "Nome é obrigatório"
    if (!formData.description?.trim()) errors.description = "Descrição é obrigatória"
    if (!formData.category) errors.category = "Categoria é obrigatória"
    if (!formData.content?.trim()) errors.content = "Conteúdo é obrigatório"
    if (formData.content && formData.content.length < 50) {
      errors.content = "Conteúdo deve ter pelo menos 50 caracteres"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreatePrompt = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      // Extract placeholders from content
      const placeholders = extractPlaceholders(formData.content || "")

      const promptData = {
        ...formData,
        placeholders,
      } as PromptTemplate

      await createPromptTemplate(promptData)
      setShowCreateDialog(false)
      resetForm()
      fetchPrompts()
    } catch (err) {
      setFormErrors({ submit: "Erro ao criar prompt" })
      console.error("Error creating prompt:", err)
    }
    setSaving(false)
  }

  const handleUpdatePrompt = async () => {
    if (!validateForm() || !selectedPrompt) return

    setSaving(true)
    try {
      // Extract placeholders from content
      const placeholders = extractPlaceholders(formData.content || "")

      const promptData = {
        ...selectedPrompt,
        ...formData,
        placeholders,
      } as PromptTemplate

      await updatePromptTemplate(promptData)
      setShowEditDialog(false)
      setSelectedPrompt(null)
      resetForm()
      fetchPrompts()
    } catch (err) {
      setFormErrors({ submit: "Erro ao atualizar prompt" })
      console.error("Error updating prompt:", err)
    }
    setSaving(false)
  }

  const handleDeletePrompt = async (promptId: string, promptName: string) => {
    if (confirm(`Tem certeza que deseja excluir o prompt "${promptName}"?`)) {
      try {
        await deletePromptTemplate(promptId)
        fetchPrompts()
      } catch (err) {
        setError("Erro ao excluir prompt")
        console.error("Error deleting prompt:", err)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      sector: "",
      content: "",
      placeholders: [],
    })
    setFormErrors({})
  }

  const openEditDialog = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt)
    setFormData({
      name: prompt.name,
      description: prompt.description,
      category: prompt.category,
      sector: prompt.sector || "",
      content: prompt.content,
      placeholders: prompt.placeholders,
    })
    setShowEditDialog(true)
  }

  const openViewDialog = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt)
    setShowViewDialog(true)
  }

  const getCategoryLabel = (category: string) => {
    const cat = categories.find((c) => c.value === category)
    return cat ? cat.label : category
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "support":
        return "bg-blue-100 text-blue-800"
      case "sales":
        return "bg-green-100 text-green-800"
      case "marketing":
        return "bg-purple-100 text-purple-800"
      case "technical":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Filter prompts based on category and search term
  const filteredPrompts = prompts.filter((prompt) => {
    const matchesCategory = filterCategory === "all" || prompt.category === filterCategory
    const matchesSearch =
      searchTerm === "" ||
      prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="label-small">Administração</div>
          <h2 className="value-large mb-2">Gerenciamento de Prompts</h2>
          <p className="text-base" style={{ color: "#718096" }}>
            Gerencie templates de prompts para assistentes de IA
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={onBack} variant="outline" className="h-10 px-4">
            Voltar
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="btn-primary flex items-center space-x-2 h-10 px-6">
                <Plus size={20} />
                <span>Novo Prompt</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Prompt</DialogTitle>
                <DialogDescription>Crie um novo template de prompt para assistentes de IA</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="label-small">Nome *</div>
                    <Input
                      value={formData.name || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome do prompt"
                      className={`input-custom h-10 ${formErrors.name ? "border-red-500" : ""}`}
                    />
                    {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <div className="label-small">Categoria *</div>
                    <Select
                      value={formData.category || ""}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className={`h-10 ${formErrors.category ? "border-red-500" : ""}`}>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.category && <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="label-small">Descrição *</div>
                    <Input
                      value={formData.description || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Breve descrição do prompt"
                      className={`input-custom h-10 ${formErrors.description ? "border-red-500" : ""}`}
                    />
                    {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
                  </div>

                  <div>
                    <div className="label-small">Setor</div>
                    <Input
                      value={formData.sector || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sector: e.target.value }))}
                      placeholder="Setor específico (opcional)"
                      className="input-custom h-10"
                    />
                  </div>
                </div>

                <div>
                  <div className="label-small">Conteúdo do Prompt *</div>
                  <Textarea
                    value={formData.content || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="Digite o conteúdo do prompt. Use {variavel} para criar placeholders..."
                    className={`min-h-[200px] resize-none ${formErrors.content ? "border-red-500" : ""}`}
                  />
                  {formErrors.content && <p className="text-red-500 text-sm mt-1">{formErrors.content}</p>}
                  <p className="text-sm text-gray-500 mt-1">
                    Use chaves para criar variáveis: {"{company_name}"}, {"{product_name}"}, etc.
                  </p>
                </div>

                {formData.content && (
                  <div>
                    <div className="label-small">Placeholders Detectados</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {extractPlaceholders(formData.content).map((placeholder) => (
                        <Badge key={placeholder} variant="outline" className="text-xs">
                          {placeholder}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {formErrors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{formErrors.submit}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    onClick={() => {
                      setShowCreateDialog(false)
                      resetForm()
                    }}
                    variant="outline"
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCreatePrompt} disabled={saving} className="btn-primary">
                    {saving ? "Criando..." : "Criar Prompt"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Buscar prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-custom h-10"
          />
        </div>
        <div className="w-48">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-red-800 font-medium">Erro</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <Button
              onClick={() => setError(null)}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Prompts List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#01D5AC] mx-auto mb-4"></div>
            <p style={{ color: "#718096" }}>Carregando prompts...</p>
          </div>
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="card-subtle text-center py-16">
          <FileText size={64} className="mx-auto mb-6" style={{ color: "#718096" }} />
          <div className="label-small">Nenhum registro</div>
          <h3 className="value-large mb-4">
            {searchTerm || filterCategory !== "all" ? "Nenhum prompt encontrado" : "Nenhum prompt cadastrado"}
          </h3>
          <p className="text-base mb-8" style={{ color: "#718096" }}>
            {searchTerm || filterCategory !== "all"
              ? "Tente ajustar os filtros de busca"
              : "Comece criando o primeiro template de prompt"}
          </p>
          {!searchTerm && filterCategory === "all" && (
            <Button onClick={() => setShowCreateDialog(true)} className="btn-primary h-12 px-6">
              <Plus size={16} className="mr-2" />
              Criar Primeiro Prompt
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPrompts.map((prompt) => (
            <Card key={prompt.id} className="card-subtle">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="label-small">Prompt Template</div>
                    <h3 className="text-lg font-semibold mb-1" style={{ color: "#2D3748" }}>
                      {prompt.name}
                    </h3>
                    <p className="text-sm" style={{ color: "#718096" }}>
                      {prompt.description}
                    </p>
                  </div>
                  <Badge className={getCategoryColor(prompt.category)}>{getCategoryLabel(prompt.category)}</Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3">
                    <Tag size={16} style={{ color: "#718096" }} />
                    <div>
                      <div className="label-small">Categoria</div>
                      <div className="text-sm font-medium" style={{ color: "#2D3748" }}>
                        {getCategoryLabel(prompt.category)}
                      </div>
                    </div>
                  </div>

                  {prompt.sector && (
                    <div className="flex items-center space-x-3">
                      <FileText size={16} style={{ color: "#718096" }} />
                      <div>
                        <div className="label-small">Setor</div>
                        <div className="text-sm font-medium" style={{ color: "#2D3748" }}>
                          {prompt.sector}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <div>
                      <div className="label-small">Placeholders</div>
                      <div className="text-sm font-medium" style={{ color: "#2D3748" }}>
                        {prompt.placeholders?.length || 0} variáveis
                      </div>
                    </div>
                  </div>

                  {prompt.placeholders && prompt.placeholders.length > 0 && (
                    <div className="mt-3">
                      <div className="label-small mb-2">Variáveis</div>
                      <div className="flex flex-wrap gap-1">
                        {prompt.placeholders.slice(0, 3).map((placeholder) => (
                          <Badge key={placeholder} variant="outline" className="text-xs">
                            {placeholder}
                          </Badge>
                        ))}
                        {prompt.placeholders.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{prompt.placeholders.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 pt-4 border-t border-gray-100">
                  <Button
                    onClick={() => openViewDialog(prompt)}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs"
                  >
                    <Eye size={14} className="mr-1" />
                    Ver
                  </Button>
                  <Button
                    onClick={() => openEditDialog(prompt)}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs"
                  >
                    <Edit size={14} className="mr-1" />
                    Editar
                  </Button>
                  <Button
                    onClick={() => handleDeletePrompt(prompt.id, prompt.name)}
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Prompt</DialogTitle>
            <DialogDescription>
              {selectedPrompt?.name} - {selectedPrompt?.description}
            </DialogDescription>
          </DialogHeader>
          {selectedPrompt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="label-small">Categoria</div>
                  <div className="text-sm font-medium" style={{ color: "#2D3748" }}>
                    {getCategoryLabel(selectedPrompt.category)}
                  </div>
                </div>
                {selectedPrompt.sector && (
                  <div>
                    <div className="label-small">Setor</div>
                    <div className="text-sm font-medium" style={{ color: "#2D3748" }}>
                      {selectedPrompt.sector}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="label-small">Conteúdo do Prompt</div>
                <div className="bg-gray-50 p-4 rounded-lg mt-2">
                  <pre className="whitespace-pre-wrap text-sm" style={{ color: "#2D3748" }}>
                    {selectedPrompt.content}
                  </pre>
                </div>
              </div>

              {selectedPrompt.placeholders && selectedPrompt.placeholders.length > 0 && (
                <div>
                  <div className="label-small">Placeholders</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedPrompt.placeholders.map((placeholder) => (
                      <Badge key={placeholder} variant="outline">
                        {placeholder}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={() => setShowViewDialog(false)} variant="outline">
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Prompt</DialogTitle>
            <DialogDescription>Edite o template de prompt selecionado</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="label-small">Nome *</div>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do prompt"
                  className={`input-custom h-10 ${formErrors.name ? "border-red-500" : ""}`}
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <div className="label-small">Categoria *</div>
                <Select
                  value={formData.category || ""}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className={`h-10 ${formErrors.category ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category && <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="label-small">Descrição *</div>
                <Input
                  value={formData.description || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Breve descrição do prompt"
                  className={`input-custom h-10 ${formErrors.description ? "border-red-500" : ""}`}
                />
                {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
              </div>

              <div>
                <div className="label-small">Setor</div>
                <Input
                  value={formData.sector || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sector: e.target.value }))}
                  placeholder="Setor específico (opcional)"
                  className="input-custom h-10"
                />
              </div>
            </div>

            <div>
              <div className="label-small">Conteúdo do Prompt *</div>
              <Textarea
                value={formData.content || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Digite o conteúdo do prompt. Use {variavel} para criar placeholders..."
                className={`min-h-[200px] resize-none ${formErrors.content ? "border-red-500" : ""}`}
              />
              {formErrors.content && <p className="text-red-500 text-sm mt-1">{formErrors.content}</p>}
              <p className="text-sm text-gray-500 mt-1">
                Use chaves para criar variáveis: {"{company_name}"}, {"{product_name}"}, etc.
              </p>
            </div>

            {formData.content && (
              <div>
                <div className="label-small">Placeholders Detectados</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {extractPlaceholders(formData.content).map((placeholder) => (
                    <Badge key={placeholder} variant="outline" className="text-xs">
                      {placeholder}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {formErrors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{formErrors.submit}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                onClick={() => {
                  setShowEditDialog(false)
                  setSelectedPrompt(null)
                  resetForm()
                }}
                variant="outline"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdatePrompt} disabled={saving} className="btn-primary">
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
