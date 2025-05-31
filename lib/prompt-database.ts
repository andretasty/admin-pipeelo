import { getSupabaseClient } from "./supabase"
import type { PromptTemplate } from "@/types"

const supabase = getSupabaseClient()

export interface DatabaseResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

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
      throw new Error(error.message)
    }

    return data ? data.map(dbRowToPromptTemplate) : []
  } catch (error) {
    console.error("Error fetching prompt templates:", error)
    throw error
  }
}

export const createPromptTemplate = async (
  promptData: Omit<PromptTemplate, "id">,
): Promise<DatabaseResult<PromptTemplate>> => {
  try {
    const { data, error } = await supabase
      .from("prompt_templates")
      .insert({
        name: promptData.name,
        description: promptData.description,
        category: promptData.category,
        sector: promptData.sector || null,
        content: promptData.content,
        placeholders: promptData.placeholders || [],
        variables: promptData.variables || {},
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating prompt template:", error)
      return {
        success: false,
        error: error.message || "Erro ao criar template de prompt",
      }
    }

    return {
      success: true,
      data: dbRowToPromptTemplate(data),
    }
  } catch (error) {
    console.error("Error creating prompt template:", error)
    return {
      success: false,
      error: "Erro interno do servidor",
    }
  }
}

export const updatePromptTemplate = async (promptData: PromptTemplate): Promise<DatabaseResult<PromptTemplate>> => {
  try {
    const { data, error } = await supabase
      .from("prompt_templates")
      .update({
        name: promptData.name,
        description: promptData.description,
        category: promptData.category,
        sector: promptData.sector || null,
        content: promptData.content,
        placeholders: promptData.placeholders || [],
        variables: promptData.variables || {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", promptData.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating prompt template:", error)
      return {
        success: false,
        error: error.message || "Erro ao atualizar template de prompt",
      }
    }

    return {
      success: true,
      data: dbRowToPromptTemplate(data),
    }
  } catch (error) {
    console.error("Error updating prompt template:", error)
    return {
      success: false,
      error: "Erro interno do servidor",
    }
  }
}

export const deletePromptTemplate = async (promptId: string): Promise<DatabaseResult> => {
  try {
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from("prompt_templates")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", promptId)

    if (error) {
      console.error("Error deleting prompt template:", error)
      return {
        success: false,
        error: error.message || "Erro ao excluir template de prompt",
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting prompt template:", error)
    return {
      success: false,
      error: "Erro interno do servidor",
    }
  }
}

export const getPromptTemplate = async (id: string): Promise<DatabaseResult<PromptTemplate>> => {
  try {
    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return {
        success: false,
        error: "ID do template inválido",
      }
    }

    const { data, error } = await supabase
      .from("prompt_templates")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single()

    if (error) {
      console.error(`Error fetching prompt template ${id}:`, error)
      return {
        success: false,
        error: error.message || "Template não encontrado",
      }
    }

    return {
      success: true,
      data: dbRowToPromptTemplate(data),
    }
  } catch (error) {
    console.error("Error fetching prompt template:", error)
    return {
      success: false,
      error: "Erro interno do servidor",
    }
  }
}

export const getPromptTemplatesByCategory = async (category?: string): Promise<DatabaseResult<PromptTemplate[]>> => {
  try {
    let query = supabase.from("prompt_templates").select("*").eq("is_active", true)

    if (category) {
      query = query.eq("category", category)
    }

    const { data, error } = await query.order("name")

    if (error) {
      console.error("Error fetching prompt templates by category:", error)
      return {
        success: false,
        error: error.message || "Erro ao buscar templates",
      }
    }

    return {
      success: true,
      data: data ? data.map(dbRowToPromptTemplate) : [],
    }
  } catch (error) {
    console.error("Error fetching prompt templates by category:", error)
    return {
      success: false,
      error: "Erro interno do servidor",
    }
  }
}
