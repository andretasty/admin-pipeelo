import { getSupabaseClient } from "./supabase"
import type { PromptTemplate } from "@/types"

const supabase = getSupabaseClient()

// Convert database row to PromptTemplate
function dbRowToPromptTemplate(row: any): PromptTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    category: row.category || "",
    sector: row.sector || "",
    content: row.content || "",
    placeholders: Array.isArray(row.placeholders) ? row.placeholders : [],
    variables: row.variables || {},
  }
}

export const getPromptTemplates = async (): Promise<PromptTemplate[]> => {
  try {
    const { data, error } = await supabase.from("prompt_templates").select("*").eq("is_active", true).order("name")

    if (error) {
      console.error("Error fetching prompt templates:", error)
      throw error
    }
    return data ? data.map(dbRowToPromptTemplate) : []
  } catch (error) {
    console.error("Error fetching prompt templates:", error)
    // Return fallback templates if database query fails
    return PROMPT_TEMPLATES
  }
}

export const getPromptTemplate = async (id: string): Promise<PromptTemplate | undefined> => {
  try {
    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      console.warn(`Invalid UUID format for prompt template: ${id}`)
      return undefined
    }

    const { data, error } = await supabase.from("prompt_templates").select("*").eq("id", id).single()

    if (error) {
      console.error(`Error fetching prompt template ${id}:`, error)
      return undefined
    }

    return data ? dbRowToPromptTemplate(data) : undefined
  } catch (error) {
    console.error("Error fetching prompt template:", error)
    return undefined
  }
}

export const getPromptTemplatesByCategory = async (category?: string): Promise<PromptTemplate[]> => {
  try {
    let query = supabase.from("prompt_templates").select("*").eq("is_active", true)

    if (category) {
      query = query.eq("category", category)
    }

    const { data, error } = await query.order("name")
    if (error) {
      console.error("Error fetching prompt templates by category:", error)
      throw error
    }
    return data ? data.map(dbRowToPromptTemplate) : []
  } catch (error) {
    console.error("Error fetching prompt templates by category:", error)
    // Filter fallback templates by category if database query fails
    if (category) {
      return PROMPT_TEMPLATES.filter((t) => t.category === category)
    }
    return PROMPT_TEMPLATES
  }
}

export const fillPromptPlaceholders = (template: PromptTemplate, values: Record<string, string>): string => {
  let content = template.content

  if (Array.isArray(template.placeholders)) {
    template.placeholders.forEach((placeholder) => {
      const value = values[placeholder] || `[${placeholder}]`
      const regex = new RegExp(`{${placeholder}}`, "g")
      content = content.replace(regex, value)
    })
  }

  return content
}

export const extractPlaceholders = (content: string): string[] => {
  const regex = /{([^}]+)}/g
  const matches = []
  let match

  while ((match = regex.exec(content)) !== null) {
    if (!matches.includes(match[1])) {
      matches.push(match[1])
    }
  }

  return matches
}

// Fallback templates in case database is not available
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "f8a7c3d9-e6b5-4a2f-8d1c-9b3e4f7a2d1e",
    name: "Atendimento ao Cliente",
    description: "Prompt otimizado para atendimento e suporte ao cliente com tom profissional e empático.",
    category: "support",
    sector: "",
    content:
      "Você é um assistente de atendimento ao cliente especializado em fornecer suporte excepcional. Sempre responda de forma educada, empática e profissional. Você representa a empresa {company_name} que atua no setor de {company_sector}. Quando não souber a resposta, indique que vai consultar um especialista.",
    placeholders: ["company_name", "company_sector"],
    variables: {},
  },
  {
    id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    name: "Assistente de Vendas",
    description: "Prompt focado em vendas consultivas e identificação de oportunidades de negócio.",
    category: "sales",
    sector: "",
    content:
      "Você é um assistente de vendas especializado em vendas consultivas para {company_name}. Seu objetivo é entender as necessidades do cliente e apresentar soluções adequadas. Os produtos/serviços que você pode oferecer são: {products_services}.",
    placeholders: ["company_name", "products_services"],
    variables: {},
  },
]
