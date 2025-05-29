"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Company, AdminUser } from "@/types"
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
  company?: Partial<Company>
  adminUser?: Partial<AdminUser>
  onNext: (company: Company, adminUser: AdminUser) => void
  onBack?: () => void
}

export default function Step1CompanyData({ company = {}, adminUser = {}, onNext }: Step1Props) {
  const [companyData, setCompanyData] = useState<Partial<Company>>({
    name: "",
    document: "",
    phone_number: "",
    address: {
      street: "",
      number: "",
      neighborhood: "",
      country: "BR",
      state: "",
      city: "",
      complement: "",
      postal_code: "",
    },
    ...company,
  })

  const [userData, setUserData] = useState<Partial<AdminUser>>({
    name: "",
    email: "",
    password: "",
    document: "",
    ...adminUser,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Company validations
    if (!companyData.name?.trim()) newErrors.companyName = "Nome da empresa é obrigatório"
    if (!companyData.document || !validateCNPJ(companyData.document)) {
      newErrors.companyDocument = "CNPJ inválido"
    }
    if (!companyData.phone_number?.trim()) newErrors.phoneNumber = "Telefone é obrigatório"

    // Address validations
    if (!companyData.address?.street?.trim()) newErrors.street = "Rua é obrigatória"
    if (!companyData.address?.number?.trim()) newErrors.number = "Número é obrigatório"
    if (!companyData.address?.neighborhood?.trim()) newErrors.neighborhood = "Bairro é obrigatório"
    if (!companyData.address?.state?.trim()) newErrors.state = "Estado é obrigatório"
    if (!companyData.address?.city?.trim()) newErrors.city = "Cidade é obrigatória"
    if (!companyData.address?.postal_code || !validateCEP(companyData.address.postal_code)) {
      newErrors.postalCode = "CEP inválido"
    }

    // User validations
    if (!userData.name?.trim()) newErrors.userName = "Nome do usuário é obrigatório"
    if (!userData.email || !validateEmail(userData.email)) {
      newErrors.userEmail = "Email inválido"
    }
    if (!userData.password || userData.password.length < 8) {
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
      onNext(companyData as Company, userData as AdminUser)
    }
  }

  const handleCompanyChange = (field: string, value: string) => {
    if (field.startsWith("address.")) {
      const addressField = field.split(".")[1]
      setCompanyData((prev) => ({
        ...prev,
        address: {
          ...prev.address!,
          [addressField]: value,
        },
      }))
    } else {
      let formattedValue = value
      if (field === "document") {
        formattedValue = formatCNPJ(value)
      }
      setCompanyData((prev) => ({ ...prev, [field]: formattedValue }))
    }
  }

  const handleUserChange = (field: string, value: string) => {
    let formattedValue = value
    if (field === "document") {
      formattedValue = formatCPF(value)
    }
    setUserData((prev) => ({ ...prev, [field]: formattedValue }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Company Data */}
      <div className="card-subtle p-6">
        <div className="mb-6">
          <div className="label-small">Etapa 1 de 3</div>
          <h2 className="value-large mb-2">Dados da Empresa</h2>
          <p className="text-base" style={{ color: "#718096" }}>
            Informações básicas da empresa que será cadastrada no sistema
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <div className="label-small">Nome da Empresa *</div>
            <Input
              id="companyName"
              value={companyData.name || ""}
              onChange={(e) => handleCompanyChange("name", e.target.value)}
              placeholder="Digite o nome da empresa"
              className={`input-custom h-12 ${errors.companyName ? "border-red-500" : ""}`}
              style={{ color: "#2D3748" }}
            />
            {errors.companyName && <p className="text-red-500 text-sm mt-2">{errors.companyName}</p>}
          </div>

          <div>
            <div className="label-small">CNPJ *</div>
            <Input
              id="cnpj"
              value={companyData.document || ""}
              onChange={(e) => handleCompanyChange("document", e.target.value)}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              className={`input-custom h-12 ${errors.companyDocument ? "border-red-500" : ""}`}
              style={{ color: "#2D3748" }}
            />
            {errors.companyDocument && <p className="text-red-500 text-sm mt-2">{errors.companyDocument}</p>}
          </div>

          <div>
            <div className="label-small">Telefone *</div>
            <Input
              id="phone"
              value={companyData.phone_number || ""}
              onChange={(e) => handleCompanyChange("phone_number", e.target.value)}
              placeholder="(11) 99999-9999"
              className={`input-custom h-12 ${errors.phoneNumber ? "border-red-500" : ""}`}
              style={{ color: "#2D3748" }}
            />
            {errors.phoneNumber && <p className="text-red-500 text-sm mt-2">{errors.phoneNumber}</p>}
          </div>
        </div>

        {/* Address */}
        <div className="pt-4 border-t">
          <h4 className="font-medium text-gray-900 mb-4">Endereço</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="label-small">Rua/Avenida *</div>
              <Input
                id="street"
                value={companyData.address?.street || ""}
                onChange={(e) => handleCompanyChange("address.street", e.target.value)}
                placeholder="Nome da rua ou avenida"
                className={`input-custom h-12 ${errors.street ? "border-red-500" : ""}`}
                style={{ color: "#2D3748" }}
              />
              {errors.street && <p className="text-red-500 text-sm mt-2">{errors.street}</p>}
            </div>

            <div>
              <div className="label-small">Número *</div>
              <Input
                id="number"
                value={companyData.address?.number || ""}
                onChange={(e) => handleCompanyChange("address.number", e.target.value)}
                placeholder="123"
                className={`input-custom h-12 ${errors.number ? "border-red-500" : ""}`}
                style={{ color: "#2D3748" }}
              />
              {errors.number && <p className="text-red-500 text-sm mt-2">{errors.number}</p>}
            </div>

            <div>
              <div className="label-small">Bairro *</div>
              <Input
                id="neighborhood"
                value={companyData.address?.neighborhood || ""}
                onChange={(e) => handleCompanyChange("address.neighborhood", e.target.value)}
                placeholder="Nome do bairro"
                className={`input-custom h-12 ${errors.neighborhood ? "border-red-500" : ""}`}
                style={{ color: "#2D3748" }}
              />
              {errors.neighborhood && <p className="text-red-500 text-sm mt-2">{errors.neighborhood}</p>}
            </div>

            <div>
              <div className="label-small">Cidade *</div>
              <Input
                id="city"
                value={companyData.address?.city || ""}
                onChange={(e) => handleCompanyChange("address.city", e.target.value)}
                placeholder="Nome da cidade"
                className={`input-custom h-12 ${errors.city ? "border-red-500" : ""}`}
                style={{ color: "#2D3748" }}
              />
              {errors.city && <p className="text-red-500 text-sm mt-2">{errors.city}</p>}
            </div>

            <div>
              <div className="label-small">Estado *</div>
              <Input
                id="state"
                value={companyData.address?.state || ""}
                onChange={(e) => handleCompanyChange("address.state", e.target.value)}
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
                id="cep"
                value={companyData.address?.postal_code || ""}
                onChange={(e) => handleCompanyChange("address.postal_code", formatCEP(e.target.value))}
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
                id="complement"
                value={companyData.address?.complement || ""}
                onChange={(e) => handleCompanyChange("address.complement", e.target.value)}
                placeholder="Apartamento, sala, etc. (opcional)"
                className="input-custom h-12"
                style={{ color: "#2D3748" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Admin User Data */}
      <Card>
        <CardHeader>
          <CardTitle>Usuário Administrador</CardTitle>
          <CardDescription>Dados do usuário que terá acesso administrativo à conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="userName">Nome Completo *</Label>
              <Input
                id="userName"
                value={userData.name || ""}
                onChange={(e) => handleUserChange("name", e.target.value)}
                placeholder="Digite o nome completo"
                className={errors.userName ? "border-red-500" : ""}
              />
              {errors.userName && <p className="text-red-500 text-sm mt-1">{errors.userName}</p>}
            </div>

            <div>
              <Label htmlFor="userEmail">Email *</Label>
              <Input
                id="userEmail"
                type="email"
                value={userData.email || ""}
                onChange={(e) => handleUserChange("email", e.target.value)}
                placeholder="usuario@empresa.com"
                className={errors.userEmail ? "border-red-500" : ""}
              />
              {errors.userEmail && <p className="text-red-500 text-sm mt-1">{errors.userEmail}</p>}
            </div>

            <div>
              <Label htmlFor="userCpf">CPF *</Label>
              <Input
                id="userCpf"
                value={userData.document || ""}
                onChange={(e) => handleUserChange("document", e.target.value)}
                placeholder="000.000.000-00"
                maxLength={14}
                className={errors.userDocument ? "border-red-500" : ""}
              />
              {errors.userDocument && <p className="text-red-500 text-sm mt-1">{errors.userDocument}</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="userPassword">Senha *</Label>
              <Input
                id="userPassword"
                type="password"
                value={userData.password || ""}
                onChange={(e) => handleUserChange("password", e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className={errors.userPassword ? "border-red-500" : ""}
              />
              {errors.userPassword && <p className="text-red-500 text-sm mt-1">{errors.userPassword}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-6">
        <Button type="submit" className="btn-primary h-12 px-8">
          Próximo
        </Button>
      </div>
    </form>
  )
}
