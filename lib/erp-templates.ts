import { getSupabaseClient } from "./supabase"
import type { ERPTemplate } from "@/types"

const supabase = getSupabaseClient()

// Convert database row to ERPTemplate
function dbRowToERPTemplate(row: any): ERPTemplate {
  return {
    id: row.id,
    name: row.name,
    version: row.version || "1.0.0",
    description: row.description || "",
    logo: row.logo_url || "",
    commands: row.commands || [],
    integration_fields: row.integration_fields || [],
  }
}

export const getERPTemplates = async (): Promise<ERPTemplate[]> => {
  try {
    const { data, error } = await supabase.from("erp_templates").select("*").eq("is_active", true).order("name")

    if (error) throw error
    return data ? data.map(dbRowToERPTemplate) : []
  } catch (error) {
    console.error("Error fetching ERP templates:", error)
    return []
  }
}

export const getERPTemplate = async (id: string): Promise<ERPTemplate | undefined> => {
  try {
    const { data, error } = await supabase.from("erp_templates").select("*").eq("id", id).eq("is_active", true).single()

    if (error) throw error
    return data ? dbRowToERPTemplate(data) : undefined
  } catch (error) {
    console.error("Error fetching ERP template:", error)
    return undefined
  }
}

export const getERPTemplatesByCategory = async (category?: string): Promise<ERPTemplate[]> => {
  // For now, return all templates since we don't have categories yet
  return getERPTemplates()
}

// Keep the old constant for backward compatibility, but fetch from DB
export let ERP_TEMPLATES: ERPTemplate[] = []

// Initialize templates on module load
getERPTemplates().then((templates) => {
  ERP_TEMPLATES = templates
})
