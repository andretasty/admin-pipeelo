"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PromptConfig } from "@/types"
import { AVAILABLE_PROMPTS } from "@/lib/prompts"
import { Check, MessageSquare } from 'lucide-react'

interface Step3Props {
  selectedPrompt?: PromptConfig
  onNext: (prompt: PromptConfig) => void
  onBack: () => void
  saving?: boolean
}

export default function Step3PromptSelection({ selectedPrompt, onNext, onBack, saving = false }: Step3Props) {
  const [selected, setSelected] = useState<PromptConfig | undefined>(selectedPrompt)
  const [previewPrompt, setPreviewPrompt] = useState<PromptConfig | undefined>(selectedPrompt)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selected) {
      onNext(selected)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center section-spacing">
        <div className="label-small">Etapa 3 de 3</div>
        <h2 className="value-large mb-2">Seleção de Prompt</h2>
        <p className="text-base" style={{ color: "#718096" }}>
          Escolha o prompt que melhor se adequa ao perfil do seu cliente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Prompt Selection */}
        <div className="space-y-4">
          <div className="label-small">Prompts Disponíveis</div>
          {AVAILABLE_PROMPTS.map((prompt) => (
            <div
              key={prompt.id}
              className={`card-subtle p-6 cursor-pointer transition-all duration-200 ${
                selected?.id === prompt.id ? "ring-2 ring-[#01D5AC] border-[#01D5AC] shadow-lg" : "hover:shadow-md"
              }`}
              onClick={() => {
                setSelected(prompt)
                setPreviewPrompt(prompt)
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold" style={{ color: "#2D3748" }}>
                  {prompt.name}
                </h3>
                {selected?.id === prompt.id && <Check className="text-[#01D5AC]" size={24} />}
              </div>
              <p className="text-sm mb-4" style={{ color: "#718096" }}>
                {prompt.description}
              </p>
              <div className="flex justify-between items-center">
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100" style={{ color: "#718096" }}>
                  {prompt.id.replace("-", " ").toUpperCase()}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPreviewPrompt(prompt)
                  }}
                  className="text-[#01D5AC] hover:bg-[#01D5AC] hover:bg-opacity-10 transition-all duration-200"
                >
                  Visualizar
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Prompt Preview */}
        <div className="lg:sticky lg:top-4">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare size={20} />
                <span>Prévia do Prompt</span>
              </CardTitle>
              <CardDescription>
                {previewPrompt ? previewPrompt.name : "Selecione um prompt para visualizar"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewPrompt ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Descrição:</h4>
                    <p className="text-sm text-gray-600">{previewPrompt.description}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Conteúdo do Prompt:</h4>
                    <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 max-h-40 overflow-y-auto">
                      {previewPrompt.content}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Clique em um prompt para visualizar seu conteúdo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {!selected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800 text-sm">Selecione um prompt para continuar.</p>
        </div>
      )}

      <div className="flex justify-between pt-6">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="h-12 px-6 rounded-lg border-gray-200 hover:bg-gray-50 transition-all duration-200"
          style={{ color: "#718096" }}
        >
          Voltar
        </Button>
        <Button 
          type="submit" 
          disabled={!selected || saving} 
          className="btn-primary h-12 px-8"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            "Finalizar"
          )}
        </Button>
      </div>
    </form>
  )
}
