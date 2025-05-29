"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { ERPConfig } from "@/types"
import { getERPTemplate } from "@/lib/erp-templates"

interface Step5Props {
  erpConfig?: ERPConfig
  onNext: (erpConfig: ERPConfig) => void
  onBack: () => void
  saving?: boolean
}

export default function Step5FunctionMapping({ erpConfig, onNext, onBack, saving = false }: Step5Props) {
  const [enabledCommands, setEnabledCommands] = useState<string[]>(erpConfig?.enabled_commands || [])

  const template = erpConfig ? getERPTemplate(erpConfig.template_id) : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (erpConfig) {
      onNext({
        ...erpConfig,
        enabled_commands: enabledCommands
      })
    }
  }

  const toggleCommand = (commandName: string) => {
    setEnabledCommands(prev => 
      prev.includes(commandName) 
        ? prev.filter(c => c !== commandName)
        : [...prev, commandName]
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
        {template ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: "#2D3748" }}>
              Funções Disponíveis - {template.name}
            </h3>
            
            {template.commands.map((command) => (
              <div key={command.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
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
          <p className="text-center" style={{ color: "#718096" }}>
            Nenhum ERP configurado
          </p>
        )}
      </div>

      <div className="flex justify-between pt-6">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="h-12 px-6"
        >
          Voltar
        </Button>
        <Button 
          type="submit" 
          disabled={saving} 
          className="btn-primary h-12 px-8"
        >
          {saving ? "Salvando..." : "Próximo"}
        </Button>
      </div>
    </form>
  )
}
