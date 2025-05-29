"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import type { ERPConfig, ERPTemplate } from "@/types"
import { getERPTemplates } from "@/lib/erp-templates"

interface Step3Props {
  erpConfig?: ERPConfig
  onNext: (erpConfig: ERPConfig) => void
  onBack: () => void
  saving?: boolean
}

export default function Step3ERPConfig({ erpConfig, onNext, onBack, saving = false }: Step3Props) {
  const [templates, setTemplates] = useState<ERPTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState(erpConfig?.template_id || "")
  const [fields, setFields] = useState<Record<string, string>>(erpConfig?.fields || {})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTemplates = async () => {
      const fetchedTemplates = await getERPTemplates()
      setTemplates(fetchedTemplates)
      setLoading(false)
    }
    fetchTemplates()
  }, [])

  const template = templates.find((t) => t.id === selectedTemplate)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (template) {
      onNext({
        template_id: template.id,
        template_name: template.name,
        fields,
        enabled_commands: template.commands.map((c) => c.name),
        connection_status: "pending",
      })
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
        <div className="label-small">Etapa 3 de 7</div>
        <h2 className="value-large mb-2">Seleção de ERP</h2>
        <p className="text-base" style={{ color: "#718096" }}>
          Escolha e configure o ERP que será integrado
        </p>
      </div>

      <div className="card-subtle p-6">
        <div className="mb-6">
          <div className="label-small">Sistema ERP</div>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecione o ERP" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((erp) => (
                <SelectItem key={erp.id} value={erp.id}>
                  {erp.name}
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

            {template.integration_fields.map((field) => (
              <div key={field.name}>
                <div className="label-small">
                  {field.label} {field.required && "*"}
                </div>
                <Input
                  type={field.type}
                  value={fields[field.name] || ""}
                  onChange={(e) => setFields((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="input-custom h-12"
                  style={{ color: "#2D3748" }}
                />
              </div>
            ))}
          </div>
        )}
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
