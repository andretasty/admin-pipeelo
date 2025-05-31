"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AdvancedConfig } from "@/types"

interface Step6Props {
  advancedConfig?: AdvancedConfig
  onNext: (advancedConfig: AdvancedConfig) => void
  onBack: () => void
  saving?: boolean
}

export default function Step6AdvancedConfig({ advancedConfig, onNext, onBack, saving = false }: Step6Props) {
  const [config, setConfig] = useState<AdvancedConfig>({
    categories: [],
    full_service_enabled: false,
    webhooks: [],
    backup_settings: {
      frequency: 'weekly',
      retention_days: 30,
      enabled: false
    },
    ...advancedConfig
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext(config)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <div className="label-small">Etapa 6 de 7</div>
        <h2 className="value-large mb-2">Configurações Avançadas</h2>
        <p className="text-base" style={{ color: "#718096" }}>
          Configure opções avançadas do sistema
        </p>
      </div>

      <div className="card-subtle p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium" style={{ color: "#2D3748" }}>
                Atendimento 100%
              </h4>
              <p className="text-sm" style={{ color: "#718096" }}>
                Ativar atendimento completo automatizado
              </p>
            </div>
            <Switch
              checked={config.full_service_enabled}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, full_service_enabled: checked }))}
            />
          </div>

          <div>
            <div className="label-small">Frequência de Backup</div>
            <Select 
              value={config.backup_settings?.frequency || 'weekly'} 
              onValueChange={(value) => setConfig(prev => ({
                ...prev,
                backup_settings: {
                  ...prev.backup_settings!,
                  frequency: value as 'daily' | 'weekly' | 'monthly'
                }
              }))}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium" style={{ color: "#2D3748" }}>
                Backup Automático
              </h4>
              <p className="text-sm" style={{ color: "#718096" }}>
                Ativar backup automático das configurações
              </p>
            </div>
            <Switch
              checked={config.backup_settings?.enabled || false}
              onCheckedChange={(checked) => setConfig(prev => ({
                ...prev,
                backup_settings: {
                  ...prev.backup_settings!,
                  enabled: checked
                }
              }))}
            />
          </div>
        </div>
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
