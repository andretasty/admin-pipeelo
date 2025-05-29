import { getSupabaseClient } from "./supabase"
import { generateUUID, isValidUUID } from "./utils"
import type { Client, DashboardMetrics } from "@/types"

const supabase = getSupabaseClient()

// Hash password function
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

// Convert database row to Client object
function dbRowToClient(row: any): Client {
  return {
    id: row.id,
    tenant: {
      name: row.tenant_name,
      document: row.tenant_document,
      phone_number: row.tenant_phone,
      email: row.company_email || row.admin_email,
      website: row.company_website,
      sector: row.company_sector || "Geral",
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
      password: "", // Don't return password
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
          fields: row.erp_config?.fields || {},
          enabled_commands: row.erp_config?.enabled_commands || [],
          connection_status: row.erp_status || "pending",
          last_tested: row.erp_last_test,
        }
      : undefined,
    prompt_config: row.prompt_template_id
      ? {
          template_id: row.prompt_template_id,
          template_name: row.prompt_template_name,
          final_content: row.prompt_final_content || "",
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
    advanced_config: {
      categories: Array.isArray(row.categories) ? row.categories : [],
      full_service_enabled: row.full_service_enabled || false,
      webhooks: row.webhooks || [],
      backup_settings: row.backup_settings || {
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
async function clientToDbRow(client: Client, isUpdate = false) {
  const passwordHash = client.admin_user.password ? await hashPassword(client.admin_user.password) : undefined

  const baseData = {
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
    admin_document: client.admin_user.document,
    admin_role: client.admin_user.role,
    openai_key: client.api_config.openai_key,
    openrouter_key: client.api_config.openrouter_key,
    api_tests: client.api_config.api_tests,
    erp_template_id: client.erp_config?.template_id,
    erp_template_name: client.erp_config?.template_name,
    erp_config: client.erp_config
      ? {
          fields: client.erp_config.fields,
          enabled_commands: client.erp_config.enabled_commands,
        }
      : null,
    erp_status: client.erp_config?.connection_status,
    erp_last_test: client.erp_config?.last_tested,
    prompt_template_id: client.prompt_config?.template_id,
    prompt_template_name: client.prompt_config?.template_name,
    prompt_final_content: client.prompt_config?.final_content,
    prompt_config: client.prompt_config
      ? {
          assistant_config: client.prompt_config.assistant_config,
          placeholders_filled: client.prompt_config.placeholders_filled,
        }
      : null,
    categories: client.advanced_config?.categories || [],
    full_service_enabled: client.advanced_config?.full_service_enabled || false,
    webhooks: client.advanced_config?.webhooks || [],
    backup_settings: client.advanced_config?.backup_settings || {
      frequency: "weekly",
      retention_days: 30,
      enabled: false,
    },
    onboarding_status: client.onboarding_status,
    current_step: client.current_step,
    total_steps: client.total_steps,
    deployed_at: client.deployed_at,
    deployment_url: client.deployment_url,
    updated_at: new Date().toISOString(),
  }

  // Add password hash only if provided
  if (passwordHash) {
    ;(baseData as any).admin_password_hash = passwordHash
  }

  // For new records, add ID and created_at
  if (!isUpdate) {
    return {
      id: isValidUUID(client.id) ? client.id : generateUUID(),
      created_at: client.created_at || new Date().toISOString(),
      ...baseData,
    }
  }

  return baseData
}

export const saveClient = async (client: Client): Promise<{ success: boolean; error?: string; data?: Client }> => {
  try {
    console.log("Saving client:", client.id, client.onboarding_status)

    // Check if this is an update (valid UUID) or new client
    const isUpdate = isValidUUID(client.id)

    if (isUpdate) {
      // First check if the client exists
      const { data: existingClient, error: checkError } = await supabase
        .from("clients")
        .select("id")
        .eq("id", client.id)
        .maybeSingle()

      if (checkError) {
        console.error("Error checking existing client:", checkError)
        throw checkError
      }

      if (!existingClient) {
        console.log("Client not found, creating new one instead")
        // Client doesn't exist, create new one
        const dbRow = await clientToDbRow(client, false)
        console.log("Creating new client with data:", dbRow)

        const { data, error } = await supabase.from("clients").insert(dbRow).select().single()

        if (error) {
          console.error("Supabase insert error:", error)
          throw error
        }
        return { success: true, data: dbRowToClient(data) }
      } else {
        // Update existing client
        const dbRow = await clientToDbRow(client, true)
        console.log("Updating client with data:", dbRow)

        const { data, error } = await supabase.from("clients").update(dbRow).eq("id", client.id).select().single()

        if (error) {
          console.error("Supabase update error:", error)
          throw error
        }
        return { success: true, data: dbRowToClient(data) }
      }
    } else {
      // Create new client with proper UUID
      const newId = generateUUID()
      const clientWithNewId = { ...client, id: newId }
      const dbRow = await clientToDbRow(clientWithNewId, false)
      console.log("Creating new client with data:", dbRow)

      // Check if a client with similar data already exists to prevent duplicates
      const { data: duplicateCheck } = await supabase
        .from("clients")
        .select("id")
        .eq("tenant_document", client.tenant.document)
        .eq("admin_email", client.admin_user.email)
        .maybeSingle()

      if (duplicateCheck) {
        console.log("Duplicate client found, updating instead:", duplicateCheck.id)
        // Update the existing client instead
        const updateDbRow = await clientToDbRow({ ...client, id: duplicateCheck.id }, true)
        const { data, error } = await supabase
          .from("clients")
          .update(updateDbRow)
          .eq("id", duplicateCheck.id)
          .select()
          .single()

        if (error) {
          console.error("Supabase update duplicate error:", error)
          throw error
        }
        return { success: true, data: dbRowToClient(data) }
      }

      const { data, error } = await supabase.from("clients").insert(dbRow).select().single()

      if (error) {
        console.error("Supabase insert error:", error)
        throw error
      }
      return { success: true, data: dbRowToClient(data) }
    }
  } catch (error: any) {
    console.error("Error saving client:", error)
    return {
      success: false,
      error: error.message || "Erro ao salvar cliente",
    }
  }
}

export const getClients = async (filters?: {
  status?: string
  sector?: string
  search?: string
}): Promise<{ success: boolean; data?: Client[]; error?: string }> => {
  try {
    let query = supabase.from("clients").select("*").order("created_at", { ascending: false })

    // Apply filters
    if (filters?.status) {
      query = query.eq("onboarding_status", filters.status)
    }

    if (filters?.sector) {
      query = query.eq("company_sector", filters.sector)
    }

    if (filters?.search) {
      query = query.or(`tenant_name.ilike.%${filters.search}%,tenant_document.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    const clients = data ? data.map(dbRowToClient) : []
    return { success: true, data: clients }
  } catch (error: any) {
    console.error("Error fetching clients:", error)
    return {
      success: false,
      error: error.message || "Erro ao buscar clientes",
    }
  }
}

export const getClient = async (id: string): Promise<{ success: boolean; data?: Client; error?: string }> => {
  try {
    const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle()

    if (error) throw error

    if (!data) {
      return { success: false, error: "Cliente não encontrado" }
    }

    const client = dbRowToClient(data)
    return { success: true, data: client }
  } catch (error: any) {
    console.error("Error fetching client:", error)
    return {
      success: false,
      error: error.message || "Erro ao buscar cliente",
    }
  }
}

export const deleteClient = async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.from("clients").delete().eq("id", id)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting client:", error)
    return {
      success: false,
      error: error.message || "Erro ao excluir cliente",
    }
  }
}

export const updateClientStep = async (
  id: string,
  step: number,
  stepData?: any,
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log("Updating client step:", id, step, stepData)

    // First check if the client exists
    const { data: existingClient, error: checkError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking client:", checkError)
      throw checkError
    }

    if (!existingClient) {
      throw new Error("Cliente não encontrado")
    }

    const updateData: any = {
      current_step: step,
      updated_at: new Date().toISOString(),
    }

    // Update onboarding status based on step
    if (step === 7) {
      updateData.onboarding_status = "completed"
    } else if (step > 1) {
      updateData.onboarding_status = "in_progress"
    }

    // Update specific step data based on step number
    if (stepData) {
      switch (step) {
        case 2:
          // API Config step
          updateData.openai_key = stepData.openai_key
          updateData.openrouter_key = stepData.openrouter_key
          updateData.api_tests = stepData.api_tests
          break
        case 3:
          // ERP Config step - ensure template_id is a valid UUID
          if (stepData.template_id && isValidUUID(stepData.template_id)) {
            updateData.erp_template_id = stepData.template_id
            updateData.erp_template_name = stepData.template_name
            updateData.erp_config = {
              fields: stepData.fields || {},
              enabled_commands: stepData.enabled_commands || [],
            }
            updateData.erp_status = stepData.connection_status || "pending"
            updateData.erp_last_test = stepData.last_tested
          } else {
            console.warn("Invalid ERP template ID:", stepData.template_id)
          }
          break
        case 4:
          // Prompt Config step - ensure template_id is a valid UUID
          if (stepData.template_id && isValidUUID(stepData.template_id)) {
            updateData.prompt_template_id = stepData.template_id
            updateData.prompt_template_name = stepData.template_name
            updateData.prompt_final_content = stepData.final_content
            updateData.prompt_config = {
              assistant_config: stepData.assistant_config,
              placeholders_filled: stepData.placeholders_filled,
            }
          } else {
            console.warn("Invalid prompt template ID:", stepData.template_id)
          }
          break
        case 5:
          // Function Mapping step - updates ERP config
          updateData.erp_config = {
            fields: stepData.fields || {},
            enabled_commands: stepData.enabled_commands || [],
          }
          break
        case 6:
          // Advanced Config step
          updateData.categories = stepData.categories || []
          updateData.full_service_enabled = stepData.full_service_enabled || false
          updateData.webhooks = stepData.webhooks || []
          updateData.backup_settings = stepData.backup_settings || {
            frequency: "weekly",
            retention_days: 30,
            enabled: false,
          }
          break
      }
    }

    console.log("Update data:", updateData)

    const { error } = await supabase.from("clients").update(updateData).eq("id", id)

    if (error) {
      console.error("Supabase update step error:", error)
      throw error
    }

    console.log("Step updated successfully")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating client step:", error)
    return {
      success: false,
      error: error.message || "Erro ao atualizar etapa",
    }
  }
}

export const getDashboardMetrics = async (): Promise<{ success: boolean; data?: DashboardMetrics; error?: string }> => {
  try {
    const { data, error } = await supabase.from("clients").select("onboarding_status, created_at, deployed_at")

    if (error) throw error

    const clients = data || []
    const total_clients = clients.length
    const completed_onboardings = clients.filter(
      (c) => c.onboarding_status === "completed" || c.onboarding_status === "deployed",
    ).length
    const in_progress = clients.filter((c) => c.onboarding_status === "in_progress").length
    const failed_deployments = clients.filter((c) => c.onboarding_status === "failed").length

    // Calculate average completion time (simplified)
    const completedClients = clients.filter((c) => c.deployed_at)
    const average_completion_time =
      completedClients.length > 0
        ? completedClients.reduce((acc, client) => {
            const created = new Date(client.created_at)
            const deployed = new Date(client.deployed_at)
            return acc + (deployed.getTime() - created.getTime())
          }, 0) /
          completedClients.length /
          (1000 * 60 * 60 * 24) // Convert to days
        : 0

    const success_rate = total_clients > 0 ? (completed_onboardings / total_clients) * 100 : 0

    return {
      success: true,
      data: {
        total_clients,
        completed_onboardings,
        in_progress,
        average_completion_time: Math.round(average_completion_time * 10) / 10,
        success_rate: Math.round(success_rate * 10) / 10,
        failed_deployments,
      },
    }
  } catch (error: any) {
    console.error("Error fetching dashboard metrics:", error)
    return {
      success: false,
      error: error.message || "Erro ao buscar métricas",
    }
  }
}

// Authentication functions
export const authenticateUser = async (
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (email === "admin@pipeelo.com" && password === "admin123") {
      return { success: true }
    }

    return { success: false, error: "Email ou senha inválidos" }
  } catch (error: any) {
    console.error("Error authenticating user:", error)
    return {
      success: false,
      error: error.message || "Erro na autenticação",
    }
  }
}
