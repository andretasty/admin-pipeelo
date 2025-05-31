"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Tenant, User, Address } from "@/types"
import {
  validateCNPJ,
  validateCPF,
  validateEmail,
  validateCEP,
  formatCNPJ,
  formatCPF,
  formatCEP,
} from "@/lib/validations"

interface Step1Props {
  tenant?: Tenant
  address?: Address // Pass address separately if pre-existing
  adminUser?: User // Changed from AdminUser
  onNext: (data: { tenant: Tenant; address: Address; user: User }) => void // Updated signature
  saving?: boolean
}

const SECTORS = [
  "Tecnologia",
  "Varejo",
  "Serviços",
  "Indústria",
  "Saúde",
  "Educação",
  "Financeiro",
  "Logística",
  "Alimentício",
  "Construção",
  "Outros",
]

export default function Step1TenantData({ tenant, adminUser, onNext, saving = false }: Step1Props) {
  const [tenantData, setTenantData] = useState<Partial<Tenant>>({
    name: "",
    document: "",
    phone_number: "",
    email: "",
    website: "",
    sector: "",
    ...tenant,
  })

  const [addressData, setAddressData] = useState<Partial<Address>>({
    street: "",
    number: "",
    neighborhood: "",
    country: "BR",
    state: "",
    city: "",
    complement: "",
    postal_code: "",
    ...(tenant?.address_id ? {} : {}), // Placeholder for existing address data if passed
  })

  const [userData, setUserData] = useState<Partial<User>>({
    name: "",
    email: "",
    password_hash: "",
    document: "",
    role: "admin",
    ...(adminUser ? { ...adminUser, password_hash: adminUser.password_hash } : {}), // Use password_hash
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Tenant validations
    if (!tenantData.name?.trim()) newErrors.tenantName = "Nome da empresa é obrigatório"
    if (!tenantData.document || !validateCNPJ(tenantData.document)) {
      newErrors.tenantDocument = "CNPJ inválido"
    }
    if (!tenantData.phone_number?.trim()) newErrors.phoneNumber = "Telefone é obrigatório"
    if (!tenantData.email || !validateEmail(tenantData.email)) {
      newErrors.tenantEmail = "Email inválido"
    }
    // Address validations
    if (!addressData.street?.trim()) newErrors.street = "Rua é obrigatória"
    if (!addressData.number?.trim()) newErrors.number = "Número é obrigatório"
    if (!addressData.neighborhood?.trim()) newErrors.neighborhood = "Bairro é obrigatório"
    if (!addressData.state?.trim()) newErrors.state = "Estado é obrigatório"
    if (!addressData.city?.trim()) newErrors.city = "Cidade é obrigatória"
    if (!addressData.postal_code || !validateCEP(addressData.postal_code)) {
      newErrors.postalCode = "CEP inválido"
    }

    // User validations
    if (!userData.name?.trim()) newErrors.userName = "Nome do usuário é obrigatório"
    if (!userData.email || !validateEmail(userData.email)) {
      newErrors.userEmail = "Email inválido"
    }
    if (!userData.password_hash || userData.password_hash.length < 8) {
      newErrors.userPassword = "Senha deve ter pelo menos 8 caracteres"
    }
    if (!userData.document || !validateCPF(userData.document)) {
      newErrors.userDocument = "CPF inválido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onNext({
        tenant: tenantData as Tenant,
        address: addressData as Address,
        user: userData as User, // Changed from adminUser
      })
    }
  }

  const handleTenantChange = (field: string, value: string) => {
    let formattedValue = value
    if (field === "document") {
      formattedValue = formatCNPJ(value)
    }
    setTenantData((prev) => ({ ...prev, [field]: formattedValue }))
  }

  const handleAddressChange = (field: string, value: string) => {
    let formattedValue = value
    if (field === "postal_code") {
      formattedValue = formatCEP(value)
    }
    setAddressData((prev) => ({ ...prev, [field]: formattedValue }))
  }

  const handleUserChange = (field: string, value: string) => {
    let formattedValue = value
    if (field === "document") {
      formattedValue = formatCPF(value)
    }
    setUserData((prev) => ({ ...prev, [field]: formattedValue } as Partial<User>)); // Explicitly cast to Partial<User>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="text-center mb-8">
        <div className="label-small">Etapa 1 de 7</div>
        <h2 className="value-large mb-2">Dados do Cliente</h2>
        <p className="text-base" style={{ color: "#718096" }}>
          Informações básicas da empresa e usuário administrador
        </p>
      </div>

      {/* Tenant Data */}
      <div className="card-subtle p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2" style={{ color: "#2D3748" }}>
            Dados da Empresa
          </h3>
          <p className="text-sm" style={{ color: "#718096" }}>
            Informações básicas da empresa que será cadastrada no sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <div className="label-small">Nome da Empresa *</div>
            <Input
              value={tenantData.name || ""}
              onChange={(e) => handleTenantChange("name", e.target.value)}
              placeholder="Digite o nome da empresa"
              className={`input-custom h-12 ${errors.tenantName ? "border-red-500" : ""}`}
              style={{ color: "#2D3748" }}
            />
            {errors.tenantName && <p className="text-red-500 text-sm mt-2">{errors.tenantName}</p>}
          </div>

          <div>
            <div className="label-small">CNPJ *</div>
            <Input
              value={tenantData.document || ""}
              onChange={(e) => handleTenantChange("document", e.target.value)}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              className={`input-custom h-12 ${errors.tenantDocument ? "border-red-500" : ""}`}
              style={{ color: "#2D3748" }}
            />
            {errors.tenantDocument && <p className="text-red-500 text-sm mt-2">{errors.tenantDocument}</p>}
          </div>

          <div>
            <div className="label-small">Telefone *</div>
            <Input
              value={tenantData.phone_number || ""}
              onChange={(e) => handleTenantChange("phone_number", e.target.value)}
              placeholder="(11) 99999-9999"
              className={`input-custom h-12 ${errors.phoneNumber ? "border-red-500" : ""}`}
              style={{ color: "#2D3748" }}
            />
            {errors.phoneNumber && <p className="text-red-500 text-sm mt-2">{errors.phoneNumber}</p>}
          </div>

          <div>
            <div className="label-small">Email *</div>
            <Input
              type="email"
              value={tenantData.email || ""}
              onChange={(e) => handleTenantChange("email", e.target.value)}
              placeholder="contato@empresa.com"
              className={`input-custom h-12 ${errors.tenantEmail ? "border-red-500" : ""}`}
              style={{ color: "#2D3748" }}
            />
            {errors.tenantEmail && <p className="text-red-500 text-sm mt-2">{errors.tenantEmail}</p>}
          </div>
        </div>

        {/* Address */}
        <div className="pt-6 border-t border-gray-100 mt-6">
          <h4 className="font-medium text-gray-900 mb-4">Endereço</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="label-small">Rua/Avenida *</div>
              <Input
                value={addressData.street || ""}
                onChange={(e) => handleAddressChange("street", e.target.value)}
                placeholder="Nome da rua ou avenida"
                className={`input-custom h-12 ${errors.street ? "border-red-500" : ""}`}
                style={{ color: "#2D3748" }}
              />
              {errors.street && <p className="text-red-500 text-sm mt-2">{errors.street}</p>}
            </div>

            <div>
              <div className="label-small">Número *</div>
              <Input
                value={addressData.number || ""}
                onChange={(e) => handleAddressChange("number", e.target.value)}
                placeholder="123"
                className={`input-custom h-12 ${errors.number ? "border-red-500" : ""}`}
                style={{ color: "#2D3748" }}
              />
              {errors.number && <p className="text-red-500 text-sm mt-2">{errors.number}</p>}
            </div>

            <div>
              <div className="label-small">Bairro *</div>
              <Input
                value={addressData.neighborhood || ""}
                onChange={(e) => handleAddressChange("neighborhood", e.target.value)}
                placeholder="Nome do bairro"
                className={`input-custom h-12 ${errors.neighborhood ? "border-red-500" : ""}`}
                style={{ color: "#2D3748" }}
              />
              {errors.neighborhood && <p className="text-red-500 text-sm mt-2">{errors.neighborhood}</p>}
            </div>

            <div>
              <div className="label-small">Cidade *</div>
              <Input
                value={addressData.city || ""}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                placeholder="Nome da cidade"
                className={`input-custom h-12 ${errors.city ? "border-red-500" : ""}`}
                style={{ color: "#2D3748" }}
              />
              {errors.city && <p className="text-red-500 text-sm mt-2">{errors.city}</p>}
            </div>

            <div>
              <div className="label-small">Estado *</div>
              <Input
                value={addressData.state || ""}
                onChange={(e) => handleAddressChange("state", e.target.value)}
                placeholder="SP"
                maxLength={2}
                className={`input-custom h-12 ${errors.state ? "border-red-500" : ""}`}
                style={{ color: "#2D3748" }}
              />
              {errors.state && <p className="text-red-500 text-sm mt-2">{errors.state}</p>}
            </div>

            <div>
              <div className="label-small">CEP *</div>
              <Input
                value={addressData.postal_code || ""}
                onChange={(e) => handleAddressChange("postal_code", formatCEP(e.target.value))}
                placeholder="00000-000"
                maxLength={9}
                className={`input-custom h-12 ${errors.postalCode ? "border-red-500" : ""}`}
                style={{ color: "#2D3748" }}
              />
              {errors.postalCode && <p className="text-red-500 text-sm mt-2">{errors.postalCode}</p>}
            </div>

            <div className="md:col-span-3">
              <div className="label-small">Complemento</div>
              <Input
                value={addressData.complement || ""}
                onChange={(e) => handleAddressChange("complement", e.target.value)}
                placeholder="Apartamento, sala, etc. (opcional)"
                className="input-custom h-12"
                style={{ color: "#2D3748" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Admin User Data */}
      <div className="card-subtle p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2" style={{ color: "#2D3748" }}>
            Usuário Administrador
          </h3>
          <p className="text-sm" style={{ color: "#718096" }}>
            Dados do usuário que terá acesso administrativo à conta
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <div className="label-small">Nome Completo *</div>
            <Input
              value={userData.name || ""}
              onChange={(e) => handleUserChange("name", e.target.value)}
              placeholder="Digite o nome completo"
              className={`input-custom h-12 ${errors.userName ? "border-red-500" : ""}`}
              style={{ color: "#2D3748" }}
            />
            {errors.userName && <p className="text-red-500 text-sm mt-2">{errors.userName}</p>}
          </div>

          <div>
            <div className="label-small">Email *</div>
            <Input
              type="email"
              value={userData.email || ""}
              onChange={(e) => handleUserChange("email", e.target.value)}
              placeholder="usuario@empresa.com"
              className={`input-custom h-12 ${errors.userEmail ? "border-red-500" : ""}`}
              style={{ color: "#2D3748" }}
            />
            {errors.userEmail && <p className="text-red-500 text-sm mt-2">{errors.userEmail}</p>}
          </div>

          <div>
            <div className="label-small">CPF *</div>
            <Input
              value={userData.document || ""}
              onChange={(e) => handleUserChange("document", e.target.value)}
              placeholder="000.000.000-00"
              maxLength={14}
              className={`input-custom h-12 ${errors.userDocument ? "border-red-500" : ""}`}
              style={{ color: "#2D3748" }}
            />
            {errors.userDocument && <p className="text-red-500 text-sm mt-2">{errors.userDocument}</p>}
          </div>

          <div className="md:col-span-2">
            <div className="label-small">Senha *</div>
            <Input
              type="password"
              value={userData.password_hash || ""}
              onChange={(e) => handleUserChange("password_hash", e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className={`input-custom h-12 ${errors.userPassword ? "border-red-500" : ""}`}
              style={{ color: "#2D3748" }}
            />
            {errors.userPassword && <p className="text-red-500 text-sm mt-2">{errors.userPassword}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <Button type="submit" disabled={saving} className="btn-primary h-12 px-8">
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
