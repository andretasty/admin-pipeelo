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

    if (error) {
      console.error("Error fetching ERP templates:", error)
      throw error
    }
    return data ? data.map(dbRowToERPTemplate) : []
  } catch (error) {
    console.error("Error fetching ERP templates:", error)
    return []
  }
}

export const getERPTemplate = async (id: string): Promise<ERPTemplate | undefined> => {
  try {
    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      console.warn(`Invalid UUID format for ERP template: ${id}`)
      return undefined
    }

    const { data, error } = await supabase.from("erp_templates").select("*").eq("id", id).single()

    if (error) {
      console.error(`Error fetching ERP template ${id}:`, error)
      return undefined
    }

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

// Fallback templates in case database is not available
export const ERP_TEMPLATES: ERPTemplate[] = [
  {
    id: "e7d6c5b4-a3f2-1e0d-9c8b-7a6b5c4d3e2f",
    name: "SAP",
    version: "1.0.0",
    description: "Integração com SAP ERP para consulta de dados e operações básicas",
    logo: "",
    commands: [
      {
        name: "ConsultarEstoque",
        description: "Consulta o estoque de produtos",
        script: "SELECT * FROM inventory WHERE product_id = :product_id",
        parameters: ["product_id"],
        response_format: { product_id: "string", quantity: "number", location: "string" },
      },
      {
        name: "ConsultarPedido",
        description: "Consulta informações de um pedido",
        script: "SELECT * FROM orders WHERE order_id = :order_id",
        parameters: ["order_id"],
        response_format: { order_id: "string", customer: "string", total: "number", status: "string" },
      },
    ],
    integration_fields: [
      {
        name: "api_url",
        type: "url",
        label: "URL da API",
        required: true,
        placeholder: "https://sap-api.example.com",
      },
      {
        name: "api_key",
        type: "password",
        label: "Chave de API",
        required: true,
        placeholder: "Chave de acesso SAP",
      },
    ],
  },
  {
    id: "b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    name: "Totvs Protheus",
    version: "1.0.0",
    description: "Integração com Totvs Protheus para operações financeiras e de estoque",
    logo: "",
    commands: [
      {
        name: "ConsultarCliente",
        description: "Consulta dados de um cliente",
        script: "SELECT * FROM customers WHERE customer_code = :customer_code",
        parameters: ["customer_code"],
        response_format: { code: "string", name: "string", tax_id: "string", status: "string" },
      },
      {
        name: "ConsultarNotaFiscal",
        description: "Consulta uma nota fiscal",
        script: "SELECT * FROM invoices WHERE invoice_number = :invoice_number",
        parameters: ["invoice_number"],
        response_format: { number: "string", customer: "string", value: "number", status: "string" },
      },
    ],
    integration_fields: [
      {
        name: "server_address",
        type: "text",
        label: "Endereço do Servidor",
        required: true,
        placeholder: "servidor.totvs.com.br",
      },
      {
        name: "username",
        type: "text",
        label: "Usuário",
        required: true,
        placeholder: "usuário de acesso",
      },
      {
        name: "password",
        type: "password",
        label: "Senha",
        required: true,
        placeholder: "senha de acesso",
      },
    ],
  },
]
