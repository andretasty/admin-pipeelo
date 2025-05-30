import { getSupabaseClient } from "./supabase"
import type { Client, DashboardMetrics } from "@/types"
import { hashPassword, verifyPassword, validatePasswordStrength } from "./password-utils"

const supabase = getSupabaseClient()

// Simple UUID validation without external dependency
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Simple UUID generator without external dependency
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Validation function to check if prompt template exists
export async function validatePromptTemplateExists(templateId: string): Promise<boolean> {
  if (!templateId || !isValidUUID(templateId)) {
    console.warn(`Invalid UUID format for prompt template ID: ${templateId}`)
    return false
  }

  try {
    const { data, error } = await supabase.from("prompt_templates").select("id").eq("id", templateId).maybeSingle()
    if (error && error.code !== "PGRST116") {
      console.error("Error validating prompt template existence:", error)
      return false
    }
    return !!data
  } catch (error) {
    console.error("Exception validating prompt template:", error)
    return false
  }
}

// Validation function to check if ERP template exists
export async function validateERPTemplateExists(templateId: string): Promise<boolean> {
  if (!templateId || !isValidUUID(templateId)) {
    console.warn(`Invalid UUID format for ERP template ID: ${templateId}`)
    return false
  }

  try {
    const { data, error } = await supabase.from("erp_templates").select("id").eq("id", templateId).maybeSingle()
    if (error && error.code !== "PGRST116") {
      console.error("Error validating ERP template existence:", error)
      return false
    }
    return !!data
  } catch (error) {
    console.error("Exception validating ERP template:", error)
    return false
  }
}

// Convert database row to Client object
async function dbRowToClient(row: any): Promise<Client> {
  return {
    id: row.id,
    tenant: {
      name: row.tenant_name,
      document: row.tenant_document,
      phone_number: row.tenant_phone,
      email: row.company_email,
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
      password: row.admin_password_hash,
      document: row.admin_document,
      role: row.admin_role || "admin",
    },
    api_config: {
      openai_key: row.openai_key,
      openrouter_key: row.openrouter_key,
      api_tests: row.api_tests || {},
    },
    erp_config: row.erp_template_id
      ? {
          template_id: row.erp_template_id,
          template_name: row.erp_template_name,
          fields: {},
          enabled_commands: [],
          connection_status: "pending",
        }
      : undefined,
    prompt_config: undefined, // Will be handled separately if needed
    advanced_config: {
      categories: [],
      full_service_enabled: false,
      webhooks: [],
      backup_settings: {
        frequency: "weekly",
        retention_days: 30,
        enabled: false,
      },
    },
    onboarding_status: row.onboarding_status || "draft",
    current_step: row.current_step || 1,
    total_steps: row.total_steps || 7,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deployed_at: row.deployed_at,
    deployment_url: row.deployment_url,
  }
}

// Convert Client object to database row
async function clientToDbRow(client: Client, clientId?: string): Promise<any> {
  const id = clientId || client.id || generateUUID()

  // Validate ERP template if provided
  let erpTemplateId = null
  let erpTemplateName = null

  if (client.erp_config?.template_id) {
    console.log(`Validating ERP template: ${client.erp_config.template_id}`)
    const isValidERPTemplate = await validateERPTemplateExists(client.erp_config.template_id)
    if (isValidERPTemplate) {
      erpTemplateId = client.erp_config.template_id
      erpTemplateName = client.erp_config.template_name
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
    openai_key: client.api_config?.openai_key,
    openrouter_key: client.api_config?.openrouter_key,
    api_tests: client.api_config?.api_tests || {},
    erp_template_id: erpTemplateId,
    erp_template_name: erpTemplateName,
    onboarding_status: client.onboarding_status,
    current_step: client.current_step,
    total_steps: client.total_steps || 7,
    created_at: client.created_at,
    updated_at: client.updated_at,
    deployed_at: client.deployed_at,
    deployment_url: client.deployment_url,
  }

  return dbRow
}

export async function saveClient(client: Client): Promise<{ success: boolean; data?: Client; error?: string }> {
  try {
    console.log("Saving client:", client.id)

    const dbRow = await clientToDbRow(client)
    console.log("Database row prepared for save/update:", dbRow)

    const { data, error } = await supabase.from("clients").upsert(dbRow, { onConflict: "id" }).select().single()

    if (error) {
      console.error("Supabase error during saveClient:", error)
      return { success: false, error: error.message }
    }

    console.log("Client saved successfully:", data)
    const clientData = await dbRowToClient(data)
    return { success: true, data: clientData }
  } catch (error: any) {
    console.error("Error saving client:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function updateClientStep(
  clientId: string,
  newCurrentStep: number,
  dataFromCompletedStep: any,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(
      `Updating client ${clientId} to new current step ${newCurrentStep} with data from completed step:`,
      dataFromCompletedStep,
    )

    const { data: currentData, error: fetchError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single()

    if (fetchError) {
      console.error("Error fetching current client:", fetchError)
      return { success: false, error: fetchError.message }
    }

    const updatedClient = await dbRowToClient(currentData)
    updatedClient.current_step = newCurrentStep
    updatedClient.updated_at = new Date().toISOString()

    const completedStepNumber = newCurrentStep - 1

    console.log(`Processing data for completed step number: ${completedStepNumber}`)

    switch (completedStepNumber) {
      case 1: // Tenant Data was completed
        console.log("Applying Tenant and Admin User data")
        updatedClient.tenant = dataFromCompletedStep.tenant
        updatedClient.admin_user = dataFromCompletedStep.adminUser
        break
      case 2: // API Config was completed
        console.log("Applying API Config data")
        updatedClient.api_config = dataFromCompletedStep
        break
      case 3: // ERP Config was completed
        console.log("Applying ERP Config data")
        if (dataFromCompletedStep.template_id) {
          const isValidERP = await validateERPTemplateExists(dataFromCompletedStep.template_id)
          if (isValidERP) {
            updatedClient.erp_config = dataFromCompletedStep
          } else {
            console.error(`Invalid ERP template ID: ${dataFromCompletedStep.template_id}`)
            return { success: false, error: `Invalid ERP template ID: ${dataFromCompletedStep.template_id}` }
          }
        } else {
          updatedClient.erp_config = undefined
        }
        break
      case 4: // Prompt Config was completed
        console.log("Applying Prompt Config data")
        updatedClient.prompt_config = dataFromCompletedStep
        break
      case 5: // Function Mapping (updates ERP config)
        console.log("Applying Function Mapping data")
        if (updatedClient.erp_config) {
          updatedClient.erp_config = { ...updatedClient.erp_config, ...dataFromCompletedStep }
        } else if (dataFromCompletedStep.template_id) {
          console.warn(
            "Function mapping applied without existing ERP config. Assuming dataFromCompletedStep is a full ERPConfig.",
          )
          const isValidERP = await validateERPTemplateExists(dataFromCompletedStep.template_id)
          if (isValidERP) {
            updatedClient.erp_config = dataFromCompletedStep
          } else {
            return {
              success: false,
              error: `Invalid ERP template ID from function mapping: ${dataFromCompletedStep.template_id}`,
            }
          }
        }
        break
      case 6: // Advanced Config
        console.log("Applying Advanced Config data")
        updatedClient.advanced_config = dataFromCompletedStep
        break
      default:
        console.warn(`No specific data handling for completed step number: ${completedStepNumber}`)
    }

    console.log("Updated client object before saving:", updatedClient)
    const result = await saveClient(updatedClient)
    return result.success ? { success: true } : { success: false, error: result.error }
  } catch (error: any) {
    console.error("Error updating client step:", error)
    return { success: false, error: error.message || "Unknown error occurred during step update" }
  }
}

export async function getClients(filters?: any): Promise<{ success: boolean; data?: Client[]; error?: string }> {
  try {
    let query = supabase.from("clients").select("*")

    if (filters?.status) {
      query = query.eq("onboarding_status", filters.status)
    }

    if (filters?.sector) {
      query = query.eq("company_sector", filters.sector)
    }

    if (filters?.search) {
      query = query.or(`tenant_name.ilike.%${filters.search}%,company_email.ilike.%${filters.search}%`)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    const clientsPromises = data ? data.map(dbRowToClient) : []
    const clients = await Promise.all(clientsPromises)

    return { success: true, data: clients }
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function deleteClient(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete assistants first (should cascade, but let's be explicit)
    const { error: assistantsError } = await supabase.from("assistants").delete().eq("client_id", id)

    if (assistantsError) {
      console.error("Error deleting client assistants:", assistantsError)
      return { success: false, error: assistantsError.message }
    }

    // Then delete the client
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

// Authentication functions
export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    console.log("Autenticando usuário:", email)

    // First, check if we're using the default admin credentials for development
    if (email === "admin@pipeelo.com" && password === "admin123") {
      console.log("Usando credenciais de desenvolvimento")
      return {
        success: true,
        user: {
          id: "admin-dev",
          email: "admin@pipeelo.com",
          name: "Admin",
          role: "admin",
        },
      }
    }

    // Query the database for the user
    const { data, error } = await supabase.from("users").select("*").eq("email", email).maybeSingle()

    if (error) {
      console.error("Erro na consulta Supabase:", error)
      return { success: false, error: "Erro interno do sistema ao autenticar." }
    }

    if (!data) {
      console.log("Nenhum usuário encontrado com esse email:", email)
      return { success: false, error: "Credenciais inválidas." }
    }

    console.log("Usuário encontrado:", data.email)

    // Check which password field is available
    const storedPassword = data.password_hash || data.password

    if (!storedPassword) {
      console.error("Usuário não tem senha armazenada")
      return { success: false, error: "Erro de configuração da conta." }
    }

    // For development, allow direct password comparison if not hashed
    if (!storedPassword.startsWith("$2") && password === storedPassword) {
      console.log("Login com senha não-hash para desenvolvimento")
      return { success: true, user: data }
    }

    // For production, verify hashed password
    try {
      // Only verify if it looks like a bcrypt hash
      if (storedPassword.startsWith("$2")) {
        const isPasswordValid = await verifyPassword(password, storedPassword)

        if (!isPasswordValid) {
          console.log("Senha inválida para usuário:", email)
          return { success: false, error: "Credenciais inválidas." }
        }
      } else {
        console.warn("Senha não está no formato bcrypt para usuário:", email)
        return { success: false, error: "Formato de senha inválido." }
      }
    } catch (verifyError) {
      console.error("Erro ao verificar senha:", verifyError)
      return { success: false, error: "Erro ao verificar credenciais." }
    }

    console.log("Usuário autenticado com sucesso:", data.email)
    return { success: true, user: data }
  } catch (error: any) {
    console.error("Exceção na função authenticateUser:", error)
    return { success: false, error: error.message || "Falha na autenticação." }
  }
}

export async function createUser(
  name: string,
  email: string,
  password: string,
  role: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: `Senha não atende aos critérios de segurança: ${passwordValidation.feedback.join(", ")}`,
      }
    }

    const hashedPassword = await hashPassword(password)

    const { error } = await supabase.from("users").insert({
      id: generateUUID(),
      name,
      email,
      password_hash: hashedPassword,
      role,
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

export async function updateUserPassword(id: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: `Senha não atende aos critérios de segurança: ${passwordValidation.feedback.join(", ")}`,
      }
    }

    const hashedPassword = await hashPassword(password)

    const { error } = await supabase
      .from("users")
      .update({
        password_hash: hashedPassword,
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
