import { getSupabaseClient } from "./supabase"
import type { Client, DashboardMetrics } from "@/types"

const supabase = getSupabaseClient()

// Simple UUID validation without external dependency
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Simple UUID generator without external dependency
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Validation function to check if prompt template exists
export async function validatePromptTemplateExists(templateId: string): Promise<boolean> {
  if (!templateId || !isValidUUID(templateId)) {
    return false
  }

  try {
    const { data, error } = await supabase.from("prompt_templates").select("id").eq("id", templateId).single()

    return !error && !!data
  } catch (error) {
    console.error("Error validating prompt template:", error)
    return false
  }
}

// Validation function to check if ERP template exists
export async function validateERPTemplateExists(templateId: string): Promise<boolean> {
  if (!templateId || !isValidUUID(templateId)) {
    return false
  }

  try {
    const { data, error } = await supabase.from("erp_templates").select("id").eq("id", templateId).single()

    return !error && !!data
  } catch (error) {
    console.error("Error validating ERP template:", error)
    return false
  }
}

// Update the dbRowToClient function to use correct column names
function dbRowToClient(row: any): Client {
  return {
    id: row.id,
    tenant: {
      name: row.tenant_name,
      document: row.tenant_document,
      phone_number: row.tenant_phone,
      email: row.company_email || row.tenant_email,
      website: row.company_website,
      sector: row.company_sector,
      address: {
        street: row.address_street,
        number: row.address_number,
        neighborhood: row.address_neighborhood,
        country: row.address_country || "BR",
        state: row.address_state,
        city: row.address_city,
        complement: row.address_complement,
        postal_code: row.address_postal_code,
      },
    },
    admin_user: {
      name: row.admin_name,
      email: row.admin_email,
      password: row.admin_password_hash || row.admin_password,
      document: row.admin_document,
      role: row.admin_role || "admin",
    },
    api_config: row.api_config || { api_tests: {} },
    erp_config: row.erp_template_id
      ? {
          template_id: row.erp_template_id,
          template_name: row.erp_template_name,
          fields: row.erp_config?.fields || {},
          enabled_commands: row.erp_config?.enabled_commands || [],
          connection_status: row.erp_config?.connection_status || "pending",
        }
      : undefined,
    prompt_config: row.prompt_template_id
      ? {
          template_id: row.prompt_template_id,
          template_name: row.prompt_template_name,
          final_content: row.prompt_final_content,
          assistant_config: row.prompt_config?.assistant_config || {
            provider: "openai",
            model: "gpt-4",
            temperature: 0.7,
            top_p: 1.0,
            frequency_penalty: 0,
            response_delay: 0,
          },
          placeholders_filled: row.prompt_config?.placeholders_filled || {},
        }
      : undefined,
    advanced_config: row.advanced_config,
    onboarding_status: row.onboarding_status || "draft",
    current_step: row.current_step || 1,
    total_steps: row.total_steps || 7,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deployed_at: row.deployed_at,
    deployment_url: row.deployment_url,
  }
}

// Update the clientToDbRow function to use correct column names
async function clientToDbRow(client: Client, clientId?: string): Promise<any> {
  const id = clientId || client.id || generateUUID()

  // Validate prompt template if provided
  let promptTemplateId = null
  let promptTemplateName = null
  let promptFinalContent = null
  let promptConfig = null

  if (client.prompt_config?.template_id) {
    console.log(`Validating prompt template: ${client.prompt_config.template_id}`)
    const isValidPromptTemplate = await validatePromptTemplateExists(client.prompt_config.template_id)
    if (isValidPromptTemplate) {
      promptTemplateId = client.prompt_config.template_id
      promptTemplateName = client.prompt_config.template_name
      promptFinalContent = client.prompt_config.final_content
      promptConfig = {
        assistant_config: client.prompt_config.assistant_config,
        placeholders_filled: client.prompt_config.placeholders_filled,
      }
      console.log(`Prompt template validated successfully: ${promptTemplateId}`)
    } else {
      console.warn(`Invalid prompt template ID: ${client.prompt_config.template_id} - will be set to NULL`)
    }
  }

  // Validate ERP template if provided
  let erpTemplateId = null
  let erpTemplateName = null
  let erpConfig = null

  if (client.erp_config?.template_id) {
    console.log(`Validating ERP template: ${client.erp_config.template_id}`)
    const isValidERPTemplate = await validateERPTemplateExists(client.erp_config.template_id)
    if (isValidERPTemplate) {
      erpTemplateId = client.erp_config.template_id
      erpTemplateName = client.erp_config.template_name
      erpConfig = {
        fields: client.erp_config.fields,
        enabled_commands: client.erp_config.enabled_commands,
        connection_status: client.erp_config.connection_status,
      }
      console.log(`ERP template validated successfully: ${erpTemplateId}`)
    } else {
      console.warn(`Invalid ERP template ID: ${client.erp_config.template_id} - will be set to NULL`)
    }
  }

  const dbRow = {
    id,
    tenant_name: client.tenant.name,
    tenant_document: client.tenant.document,
    tenant_phone: client.tenant.phone_number,
    company_email: client.tenant.email,
    company_website: client.tenant.website,
    company_sector: client.tenant.sector,
    address_street: client.tenant.address.street,
    address_number: client.tenant.address.number,
    address_neighborhood: client.tenant.address.neighborhood,
    address_country: client.tenant.address.country,
    address_state: client.tenant.address.state,
    address_city: client.tenant.address.city,
    address_complement: client.tenant.address.complement,
    address_postal_code: client.tenant.address.postal_code,
    admin_name: client.admin_user.name,
    admin_email: client.admin_user.email,
    admin_password_hash: client.admin_user.password,
    admin_document: client.admin_user.document,
    admin_role: client.admin_user.role,
    api_config: client.api_config,
    erp_template_id: erpTemplateId,
    erp_template_name: erpTemplateName,
    erp_config: erpConfig,
    prompt_template_id: promptTemplateId,
    prompt_template_name: promptTemplateName,
    prompt_final_content: promptFinalContent,
    prompt_config: promptConfig,
    advanced_config: client.advanced_config,
    onboarding_status: client.onboarding_status,
    current_step: client.current_step,
    total_steps: client.total_steps || 7,
    created_at: client.created_at,
    updated_at: client.updated_at,
    deployed_at: client.deployed_at,
    deployment_url: client.deployment_url,
  }

  console.log(`Database row prepared with prompt_template_id: ${promptTemplateId}`)
  return dbRow
}

export { generateUUID }

export async function saveClient(client: Client): Promise<{ success: boolean; data?: Client; error?: string }> {
  try {
    console.log("Saving client:", client.id)

    const dbRow = await clientToDbRow(client)
    console.log("Database row prepared:", dbRow)

    const { data, error } = await supabase.from("clients").upsert(dbRow, { onConflict: "id" }).select().single()

    if (error) {
      console.error("Supabase error:", error)
      return { success: false, error: error.message }
    }

    console.log("Client saved successfully:", data)
    return { success: true, data: dbRowToClient(data) }
  } catch (error: any) {
    console.error("Error saving client:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function updateClientStep(
  clientId: string,
  step: number,
  stepData: any,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Updating client ${clientId} to step ${step}:`, stepData)

    // Get current client data
    const { data: currentData, error: fetchError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single()

    if (fetchError) {
      console.error("Error fetching current client:", fetchError)
      return { success: false, error: fetchError.message }
    }

    // Convert to Client object and update with step data
    const currentClient = dbRowToClient(currentData)

    // Update client with step data
    const updatedClient: Client = {
      ...currentClient,
      current_step: step,
      updated_at: new Date().toISOString(),
    }

    // Apply step-specific updates with validation
    switch (step) {
      case 2: // API Config
        updatedClient.api_config = stepData
        break
      case 3: // ERP Config
        if (stepData.template_id) {
          const isValidERP = await validateERPTemplateExists(stepData.template_id)
          if (isValidERP) {
            updatedClient.erp_config = stepData
          } else {
            return { success: false, error: `Invalid ERP template ID: ${stepData.template_id}` }
          }
        }
        break
      case 4: // Prompt Config
        if (stepData.template_id) {
          const isValidPrompt = await validatePromptTemplateExists(stepData.template_id)
          if (isValidPrompt) {
            updatedClient.prompt_config = stepData
          } else {
            return { success: false, error: `Invalid prompt template ID: ${stepData.template_id}` }
          }
        }
        break
      case 5: // Function Mapping (updates ERP config)
        if (updatedClient.erp_config) {
          updatedClient.erp_config = { ...updatedClient.erp_config, ...stepData }
        }
        break
      case 6: // Advanced Config
        updatedClient.advanced_config = stepData
        break
    }

    // CRITICAL FIX: Validate existing prompt_template_id before saving
    if (updatedClient.prompt_config?.template_id) {
      const isValidPrompt = await validatePromptTemplateExists(updatedClient.prompt_config.template_id)
      if (!isValidPrompt) {
        console.warn(`Removing invalid prompt_template_id: ${updatedClient.prompt_config.template_id}`)
        updatedClient.prompt_config = undefined
      }
    }

    // Save updated client
    const result = await saveClient(updatedClient)
    return result.success ? { success: true } : { success: false, error: result.error }
  } catch (error: any) {
    console.error("Error updating client step:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function getClients(filters?: any): Promise<{ success: boolean; data?: Client[]; error?: string }> {
  try {
    let query = supabase.from("clients").select("*")

    if (filters?.status) {
      query = query.eq("onboarding_status", filters.status)
    }

    if (filters?.sector) {
      query = query.eq("tenant_sector", filters.sector)
    }

    if (filters?.search) {
      query = query.or(`tenant_name.ilike.%${filters.search}%,tenant_email.ilike.%${filters.search}%`)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    const clients = data ? data.map(dbRowToClient) : []
    return { success: true, data: clients }
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function deleteClient(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("clients").delete().eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function getDashboardMetrics(): Promise<{ success: boolean; data?: DashboardMetrics; error?: string }> {
  try {
    const { data, error } = await supabase.from("clients").select("onboarding_status,created_at,deployed_at")

    if (error) {
      return { success: false, error: error.message }
    }

    const clients = data || []
    const totalClients = clients.length
    const completed = clients.filter((c) => c.onboarding_status === "deployed").length
    const inProgress = clients.filter((c) => c.onboarding_status === "in_progress").length
    const failed = clients.filter((c) => c.onboarding_status === "failed").length

    // Calculate average completion time
    const completedClients = clients.filter((c) => c.deployed_at && c.created_at)
    const avgTime =
      completedClients.length > 0
        ? completedClients.reduce((acc, c) => {
            const start = new Date(c.created_at).getTime()
            const end = new Date(c.deployed_at).getTime()
            return acc + (end - start)
          }, 0) /
          completedClients.length /
          (1000 * 60 * 60 * 24) // Convert to days
        : 0

    const successRate = totalClients > 0 ? Math.round((completed / totalClients) * 100) : 0

    const metrics: DashboardMetrics = {
      total_clients: totalClients,
      completed_onboardings: completed,
      in_progress: inProgress,
      average_completion_time: Math.round(avgTime),
      success_rate: successRate,
      failed_deployments: failed,
    }

    return { success: true, data: metrics }
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

// Atualizar a função authenticateUser para melhor tratamento de erros
export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    console.log("Tentando autenticar usuário:", email)

    const { data, error } = await supabase.from("users").select("*").eq("email", email).eq("password_hash", password)

    if (error) {
      console.error("Erro na consulta de autenticação:", error)
      return { success: false, error: "Erro interno do sistema" }
    }

    if (!data || data.length === 0) {
      console.log("Nenhum usuário encontrado com essas credenciais")
      return { success: false, error: "Credenciais inválidas" }
    }

    if (data.length > 1) {
      console.warn("Múltiplos usuários encontrados com as mesmas credenciais")
      return { success: false, error: "Erro de configuração do sistema" }
    }

    console.log("Usuário autenticado com sucesso:", data[0].email)
    return { success: true, user: data[0] }
  } catch (error: any) {
    console.error("Falha na autenticação:", error)
    return { success: false, error: error.message || "Falha na autenticação" }
  }
}

// Atualizar a função createUser para usar password_hash em vez de password
export async function createUser(
  name: string,
  email: string,
  password: string,
  role: string,
  document?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("users").insert({
      id: generateUUID(),
      name,
      email,
      password_hash: password,
      role,
      document,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

// Atualizar a função updateUserPassword para usar password_hash em vez de password
export async function updateUserPassword(id: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("users")
      .update({
        password_hash: password,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

// Adicionar as funções de gerenciamento de usuários após a função updateUserPassword

export async function getUsers(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("users").delete().eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}
