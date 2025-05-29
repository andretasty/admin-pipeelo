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
    variables: {},
  }
}

export const getPromptTemplates = async (): Promise<PromptTemplate[]> => {
  try {
    const { data, error } = await supabase.from("prompt_templates").select("*").order("name")

    if (error) throw error
    return data ? data.map(dbRowToPromptTemplate) : []
  } catch (error) {
    console.error("Error fetching prompt templates:", error)
    return []
  }
}

export const getPromptTemplate = async (id: string): Promise<PromptTemplate | undefined> => {
  try {
    const { data, error } = await supabase.from("prompt_templates").select("*").eq("id", id).single()

    if (error) throw error
    return data ? dbRowToPromptTemplate(data) : undefined
  } catch (error) {
    console.error("Error fetching prompt template:", error)
    return undefined
  }
}

export const getPromptTemplatesByCategory = async (category?: string): Promise<PromptTemplate[]> => {
  try {
    let query = supabase.from("prompt_templates").select("*")

    if (category) {
      query = query.eq("category", category)
    }

    const { data, error } = await query.order("name")
    if (error) throw error
    return data ? data.map(dbRowToPromptTemplate) : []
  } catch (error) {
    console.error("Error fetching prompt templates by category:", error)
    return []
  }
}

export const fillPromptPlaceholders = (template: PromptTemplate, values: Record<string, string>): string => {
  let content = template.content

  template.placeholders.forEach((placeholder) => {
    const value = values[placeholder] || `[${placeholder}]`
    const regex = new RegExp(`{${placeholder}}`, "g")
    content = content.replace(regex, value)
  })

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

// Keep the old constant for backward compatibility, but fetch from DB
export let PROMPT_TEMPLATES: PromptTemplate[] = []

// Initialize templates on module load
getPromptTemplates().then((templates) => {
  PROMPT_TEMPLATES = templates
})
