"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { getUsers, createUser, deleteUser, updateUserPassword } from "@/lib/database"
import { validateEmail, validateCPF, formatCPF } from "@/lib/validations"
import { Plus, Trash2, User, Shield, Eye, EyeOff, Key } from "lucide-react"

interface UserData {
  id?: string
  name: string
  email: string
  password?: string
  document?: string
  role: string
  created_at?: string
  updated_at?: string
}

interface UserManagementProps {
  onBack: () => void
}

export default function UserManagement({ onBack }: UserManagementProps) {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [formData, setFormData] = useState<UserData>({
    name: "",
    email: "",
    password: "",
    document: "",
    role: "user",
  })
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)

    const result = await getUsers()
    if (result.success && result.data) {
      setUsers(result.data)
    } else {
      setError(result.error || "Erro ao carregar usuários")
    }

    setLoading(false)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) errors.name = "Nome é obrigatório"
    if (!formData.email || !validateEmail(formData.email)) errors.email = "Email inválido"
    if (!formData.password || formData.password.length < 8) errors.password = "Senha deve ter pelo menos 8 caracteres"
    if (formData.document && !validateCPF(formData.document)) errors.document = "CPF inválido"
    if (!formData.role) errors.role = "Função é obrigatória"

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateUser = async () => {
    if (!validateForm()) return

    setSaving(true)
    const result = await createUser(formData.name, formData.email, formData.password!, formData.role, formData.document)

    if (result.success) {
      setShowCreateDialog(false)
      setFormData({ name: "", email: "", password: "", document: "", role: "user" })
      setFormErrors({})
      fetchUsers()
    } else {
      setError(result.error || "Erro ao criar usuário")
    }
    setSaving(false)
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) {
      const result = await deleteUser(userId)
      if (result.success) {
        fetchUsers()
      } else {
        setError(result.error || "Erro ao excluir usuário")
      }
    }
  }

  const handleUpdatePassword = async () => {
    if (!selectedUser || !newPassword || newPassword.length < 8) {
      setError("Senha deve ter pelo menos 8 caracteres")
      return
    }

    setSaving(true)
    const result = await updateUserPassword(selectedUser.id!, newPassword)

    if (result.success) {
      setShowPasswordDialog(false)
      setSelectedUser(null)
      setNewPassword("")
      alert("Senha atualizada com sucesso!")
    } else {
      setError(result.error || "Erro ao atualizar senha")
    }
    setSaving(false)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "manager":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador"
      case "manager":
        return "Gerente"
      case "user":
        return "Usuário"
      default:
        return role
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="label-small">Administração</div>
          <h2 className="value-large mb-2">Gerenciamento de Usuários</h2>
          <p className="text-base" style={{ color: "#718096" }}>
            Gerencie usuários e permissões do sistema
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
                <span>Novo Usuário</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>Preencha os dados do novo usuário do sistema</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <div className="label-small">Nome Completo *</div>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite o nome completo"
                    className={`input-custom h-10 ${formErrors.name ? "border-red-500" : ""}`}
                  />
                  {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <div className="label-small">Email *</div>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="usuario@empresa.com"
                    className={`input-custom h-10 ${formErrors.email ? "border-red-500" : ""}`}
                  />
                  {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <div className="label-small">CPF</div>
                  <Input
                    value={formData.document || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, document: formatCPF(e.target.value) }))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={`input-custom h-10 ${formErrors.document ? "border-red-500" : ""}`}
                  />
                  {formErrors.document && <p className="text-red-500 text-sm mt-1">{formErrors.document}</p>}
                </div>

                <div>
                  <div className="label-small">Função *</div>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger className={`h-10 ${formErrors.role ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.role && <p className="text-red-500 text-sm mt-1">{formErrors.role}</p>}
                </div>

                <div>
                  <div className="label-small">Senha *</div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="Mínimo 8 caracteres"
                      className={`input-custom h-10 pr-10 ${formErrors.password ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button onClick={() => setShowCreateDialog(false)} variant="outline" disabled={saving}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateUser} disabled={saving} className="btn-primary">
                    {saving ? "Criando..." : "Criar Usuário"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#01D5AC] mx-auto mb-4"></div>
            <p style={{ color: "#718096" }}>Carregando usuários...</p>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="card-subtle text-center py-16">
          <User size={64} className="mx-auto mb-6" style={{ color: "#718096" }} />
          <div className="label-small">Nenhum registro</div>
          <h3 className="value-large mb-4">Nenhum usuário cadastrado</h3>
          <p className="text-base mb-8" style={{ color: "#718096" }}>
            Comece criando o primeiro usuário do sistema
          </p>
          <Button onClick={() => setShowCreateDialog(true)} className="btn-primary h-12 px-6">
            <Plus size={16} className="mr-2" />
            Criar Primeiro Usuário
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Card key={user.id} className="card-subtle">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="label-small">Usuário</div>
                    <h3 className="text-lg font-semibold mb-1" style={{ color: "#2D3748" }}>
                      {user.name}
                    </h3>
                    <p className="text-sm" style={{ color: "#718096" }}>
                      {user.email}
                    </p>
                  </div>
                  <Badge className={getRoleColor(user.role)}>{getRoleLabel(user.role)}</Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3">
                    <Shield size={16} style={{ color: "#718096" }} />
                    <div>
                      <div className="label-small">Função</div>
                      <div className="text-sm font-medium" style={{ color: "#2D3748" }}>
                        {getRoleLabel(user.role)}
                      </div>
                    </div>
                  </div>

                  {user.document && (
                    <div className="flex items-center space-x-3">
                      <User size={16} style={{ color: "#718096" }} />
                      <div>
                        <div className="label-small">CPF</div>
                        <div className="text-sm font-medium" style={{ color: "#2D3748" }}>
                          {user.document}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <div>
                      <div className="label-small">Status</div>
                      <div className="text-sm font-medium text-green-600">Ativo</div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 pt-4 border-t border-gray-100">
                  <Button
                    onClick={() => {
                      setSelectedUser(user)
                      setShowPasswordDialog(true)
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs"
                  >
                    <Key size={14} className="mr-1" />
                    Senha
                  </Button>
                  <Button
                    onClick={() => handleDeleteUser(user.id!, user.name)}
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

      {/* Password Update Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>Alterar senha do usuário: {selectedUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="label-small">Nova Senha *</div>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="input-custom h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {newPassword && newPassword.length < 8 && (
                <p className="text-red-500 text-sm mt-1">Senha deve ter pelo menos 8 caracteres</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                onClick={() => {
                  setShowPasswordDialog(false)
                  setSelectedUser(null)
                  setNewPassword("")
                }}
                variant="outline"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdatePassword}
                disabled={saving || !newPassword || newPassword.length < 8}
                className="btn-primary"
              >
                {saving ? "Atualizando..." : "Atualizar Senha"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
