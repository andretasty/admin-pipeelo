"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  getFunctions,
  saveFunction as createFunction,
  saveFunction as updateFunction,
  deleteFunction,
} from "@/lib/database"
import { Plus, Trash2, Edit, Tag, Eye, Code } from "lucide-react"
import type { Function } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FunctionManagementProps {
  onBack: () => void
}

export default function FunctionManagement({ onBack }: FunctionManagementProps) {
  const [functions, setFunctions] = useState<Function[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedFunction, setSelectedFunction] = useState<Function | null>(null)
  const [formData, setFormData] = useState<Partial<Function>>({
    name: "",
    description: "",
    schema: {},
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchFunctions()
  }, [])

  const fetchFunctions = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getFunctions()
      setFunctions(data)
    } catch (err) {
      setError("Erro ao carregar funções")
      console.error("Error fetching functions:", err)
    }

    setLoading(false)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name?.trim()) errors.name = "Nome é obrigatório"
    if (!formData.description?.trim()) errors.description = "Descrição é obrigatória"
    if (!formData.schema) errors.schema = "Schema é obrigatório"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateFunction = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      await createFunction(formData as Function)
      setShowCreateDialog(false)
      resetForm()
      fetchFunctions()
      toast({
        title: "Função criada com sucesso!",
      })
    } catch (err) {
      setFormErrors({ submit: "Erro ao criar função" })
      console.error("Error creating function:", err)
      toast({
        title: "Erro ao criar função!",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      })
    }
    setSaving(false)
  }

  const handleUpdateFunction = async () => {
    if (!validateForm() || !selectedFunction) return

    setSaving(true)
    try {
      await updateFunction({ ...selectedFunction, ...formData } as Function)
      setShowEditDialog(false)
      setSelectedFunction(null)
      resetForm()
      fetchFunctions()
      toast({
        title: "Função atualizada com sucesso!",
      })
    } catch (err) {
      setFormErrors({ submit: "Erro ao atualizar função" })
      console.error("Error updating function:", err)
      toast({
        title: "Erro ao atualizar função!",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      })
    }
    setSaving(false)
  }

  const handleDeleteFunction = async (functionId: string, functionName: string) => {
    if (confirm(`Tem certeza que deseja excluir a função "${functionName}"?`)) {
      try {
        await deleteFunction(functionId)
        fetchFunctions()
        toast({
          title: "Função excluída com sucesso!",
        })
      } catch (err) {
        setError("Erro ao excluir função")
        console.error("Error deleting function:", err)
        toast({
          title: "Erro ao excluir função!",
          description: "Por favor, tente novamente.",
          variant: "destructive",
        })
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      schema: {},
    })
    setFormErrors({})
  }

  const openEditDialog = (func: Function) => {
    setSelectedFunction(func)
    setFormData({
      name: func.name,
      description: func.description,
      schema: func.schema,
    })
    setShowEditDialog(true)
  }

  const openViewDialog = (func: Function) => {
    setSelectedFunction(func)
    setShowViewDialog(true)
  }

  // Filter functions based on search term
  const filteredFunctions = functions.filter((func) => {
    return (
      searchTerm === "" ||
      func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      func.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="label-small">Administração</div>
          <h2 className="value-large mb-2">Gerenciamento de Funções</h2>
          <p className="text-base" style={{ color: "#718096" }}>
            Gerencie as funções disponíveis para os assistentes de IA
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
                <span>Nova Função</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Função</DialogTitle>
                <DialogDescription>Defina uma nova função para os assistentes de IA</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Tabs defaultValue="name" className="w-full">
                  <TabsList>
                    <TabsTrigger value="name">Nome</TabsTrigger>
                    <TabsTrigger value="schema">Estrutura (Schema)</TabsTrigger>
                    <TabsTrigger value="code">Código</TabsTrigger>
                  </TabsList>
                  <TabsContent value="name">
                    <div className="space-y-2">
                      <div className="label-small">Nome *</div>
                      <Input
                        value={formData.name || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Nome da função"
                        className={`input-custom h-10 ${formErrors.name ? "border-red-500" : ""}`}
                      />
                      {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <div className="label-small">Descrição *</div>
                      <Input
                        value={formData.description || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Breve descrição da função"
                        className={`input-custom h-10 ${formErrors.description ? "border-red-500" : ""}`}
                      />
                      {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
                    </div>
                  </TabsContent>
                  <TabsContent value="schema">
                    <div className="space-y-2">
                      <div className="label-small">Estrutura (Schema) *</div>
                      <Textarea
                        placeholder="Cole o schema da função aqui (formato JSON)"
                        className={`min-h-[150px] resize-none ${formErrors.schema ? "border-red-500" : ""}`}
                        value={formData.schema ? JSON.stringify(formData.schema, null, 2) : ""}
                        onChange={(e) => {
                          try {
                            const parsedSchema = JSON.parse(e.target.value)
                            setFormData((prev) => ({ ...prev, schema: parsedSchema }))
                            setFormErrors((prev) => ({ ...prev, schema: "" }))
                          } catch (e: any) {
                            setFormErrors((prev) => ({ ...prev, schema: "Schema inválido" }))
                          }
                        }}
                      />
                      {formErrors.schema && <p className="text-red-500 text-sm mt-1">{formErrors.schema}</p>}
                    </div>
                  </TabsContent>
                  <TabsContent value="code">
                    <div className="space-y-2">
                      <div className="label-small">Código da Função</div>
                      <Textarea placeholder="Cole o código da função aqui" className="min-h-[150px] resize-none" />
                    </div>
                  </TabsContent>
                </Tabs>

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
                  <Button onClick={handleCreateFunction} disabled={saving} className="btn-primary">
                    {saving ? "Criando..." : "Criar Função"}
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
            placeholder="Buscar funções..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-custom h-10"
          />
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

      {/* Functions List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#01D5AC] mx-auto mb-4"></div>
            <p style={{ color: "#718096" }}>Carregando funções...</p>
          </div>
        </div>
      ) : filteredFunctions.length === 0 ? (
        <div className="card-subtle text-center py-16">
          <Code size={64} className="mx-auto mb-6" style={{ color: "#718096" }} />
          <div className="label-small">Nenhum registro</div>
          <h3 className="value-large mb-4">{searchTerm ? "Nenhuma função encontrada" : "Nenhuma função cadastrada"}</h3>
          <p className="text-base mb-8" style={{ color: "#718096" }}>
            {searchTerm ? "Tente ajustar os filtros de busca" : "Comece criando a primeira função para o assistente"}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowCreateDialog(true)} className="btn-primary h-12 px-6">
              <Plus size={16} className="mr-2" />
              Criar Primeira Função
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredFunctions.map((func) => (
            <Card key={func.id} className="card-subtle">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="label-small">Função</div>
                    <h3 className="text-lg font-semibold mb-1" style={{ color: "#2D3748" }}>
                      {func.name}
                    </h3>
                    <p className="text-sm" style={{ color: "#718096" }}>
                      {func.description}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3">
                    <Tag size={16} style={{ color: "#718096" }} />
                    <div>
                      <div className="label-small">Schema</div>
                      <div className="text-sm font-medium" style={{ color: "#2D3748" }}>
                        {func.schema ? "Definido" : "Não definido"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 pt-4 border-t border-gray-100">
                  <Button
                    onClick={() => openViewDialog(func)}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs"
                  >
                    <Eye size={14} className="mr-1" />
                    Ver
                  </Button>
                  <Button
                    onClick={() => openEditDialog(func)}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs"
                  >
                    <Edit size={14} className="mr-1" />
                    Editar
                  </Button>
                  <Button
                    onClick={() => handleDeleteFunction(func.id, func.name)}
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
            <DialogTitle>Visualizar Função</DialogTitle>
            <DialogDescription>
              {selectedFunction?.name} - {selectedFunction?.description}
            </DialogDescription>
          </DialogHeader>
          {selectedFunction && (
            <div className="space-y-4">
              <div>
                <div className="label-small">Nome</div>
                <div className="text-sm font-medium" style={{ color: "#2D3748" }}>
                  {selectedFunction.name}
                </div>
              </div>
              <div>
                <div className="label-small">Descrição</div>
                <div className="text-sm font-medium" style={{ color: "#2D3748" }}>
                  {selectedFunction.description}
                </div>
              </div>

              <div>
                <div className="label-small">Schema</div>
                <div className="bg-gray-50 p-4 rounded-lg mt-2">
                  <pre className="whitespace-pre-wrap text-sm" style={{ color: "#2D3748" }}>
                    {JSON.stringify(selectedFunction.schema, null, 2)}
                  </pre>
                </div>
              </div>

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
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Função</DialogTitle>
            <DialogDescription>Edite a função selecionada</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Tabs defaultValue="name" className="w-full">
              <TabsList>
                <TabsTrigger value="name">Nome</TabsTrigger>
                <TabsTrigger value="schema">Estrutura (Schema)</TabsTrigger>
                <TabsTrigger value="code">Código</TabsTrigger>
              </TabsList>
              <TabsContent value="name">
                <div className="space-y-2">
                  <div className="label-small">Nome *</div>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome da função"
                    className={`input-custom h-10 ${formErrors.name ? "border-red-500" : ""}`}
                  />
                  {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                </div>
                <div className="space-y-2">
                  <div className="label-small">Descrição *</div>
                  <Input
                    value={formData.description || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Breve descrição da função"
                    className={`input-custom h-10 ${formErrors.description ? "border-red-500" : ""}`}
                  />
                  {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
                </div>
              </TabsContent>
              <TabsContent value="schema">
                <div className="space-y-2">
                  <div className="label-small">Estrutura (Schema) *</div>
                  <Textarea
                    placeholder="Cole o schema da função aqui (formato JSON)"
                    className={`min-h-[150px] resize-none ${formErrors.schema ? "border-red-500" : ""}`}
                    value={formData.schema ? JSON.stringify(formData.schema, null, 2) : ""}
                    onChange={(e) => {
                      try {
                        const parsedSchema = JSON.parse(e.target.value)
                        setFormData((prev) => ({ ...prev, schema: parsedSchema }))
                        setFormErrors((prev) => ({ ...prev, schema: "" }))
                      } catch (e: any) {
                        setFormErrors((prev) => ({ ...prev, schema: "Schema inválido" }))
                      }
                    }}
                  />
                  {formErrors.schema && <p className="text-red-500 text-sm mt-1">{formErrors.schema}</p>}
                </div>
              </TabsContent>
              <TabsContent value="code">
                <div className="space-y-2">
                  <div className="label-small">Código da Função</div>
                  <Textarea placeholder="Cole o código da função aqui" className="min-h-[150px] resize-none" />
                </div>
              </TabsContent>
            </Tabs>

            {formErrors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{formErrors.submit}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                onClick={() => {
                  setShowEditDialog(false)
                  setSelectedFunction(null)
                  resetForm()
                }}
                variant="outline"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdateFunction} disabled={saving} className="btn-primary">
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
