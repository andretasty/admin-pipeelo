"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { ERPConfig, ERPTemplate } from "@/types"
import { getERPTemplate } from "@/lib/erp-templates"

interface Step5Props {
  erpConfig?: ERPConfig
  onNext: (erpConfig: ERPConfig) => void
  onBack: () => void
  saving?: boolean
}

export default function Step5FunctionMapping({ erpConfig, onNext, onBack, saving = false }: Step5Props) {
  const [enabledCommands, setEnabledCommands] = useState<string[]>(erpConfig?.enabled_commands || [])
  const [template, setTemplate] = useState<ERPTemplate | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchTemplate = async () => {
      if (erpConfig?.template_id) {
        setLoading(true)
        try {
          const fetchedTemplate = await getERPTemplate(erpConfig.template_id)
          setTemplate(fetchedTemplate || null)
        } catch (error) {
          console.error("Error fetching ERP template:", error)
          setTemplate(null)
        } finally {
          setLoading(false)
        }
      } else {
        setTemplate(null)
      }
    }

    fetchTemplate()
  }, [erpConfig?.template_id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (erpConfig) {
      onNext({
        ...erpConfig,
        enabled_commands: enabledCommands,
      })
    }
  }

  const toggleCommand = (commandName: string) => {
    setEnabledCommands((prev) =>
      prev.includes(commandName) ? prev.filter((c) => c !== commandName) : [...prev, commandName],
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#01D5AC] mx-auto mb-4"></div>
          <p style={{ color: "#718096" }}>Carregando template...</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <div className="label-small">Etapa 5 de 7</div>
        <h2 className="value-large mb-2">Mapeamento de Funções</h2>
        <p className="text-base" style={{ color: "#718096" }}>
          Selecione as funções que serão disponibilizadas
        </p>
      </div>

      <div className="card-subtle p-6">
        {template && template.commands && template.commands.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: "#2D3748" }}>
              Funções Disponíveis - {template.name}
            </h3>

            {template.commands.map((command) => (
              <div
                key={command.name}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium" style={{ color: "#2D3748" }}>
                    {command.name}
                  </h4>
                  <p className="text-sm" style={{ color: "#718096" }}>
                    {command.description}
                  </p>
                </div>
                <Switch
                  checked={enabledCommands.includes(command.name)}
                  onCheckedChange={() => toggleCommand(command.name)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-center" style={{ color: "#718096" }}>
              {!erpConfig ? "Nenhum ERP configurado" : "Nenhuma função disponível para este ERP"}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-6">
        <Button type="button" onClick={onBack} variant="outline" className="h-12 px-6">
          Voltar
        </Button>
        <Button type="submit" disabled={saving} className="btn-primary h-12 px-8">
          {saving ? "Salvando..." : "Próximo"}
        </Button>
      </div>
    </form>
  )
}
