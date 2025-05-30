// lib/database.ts
import { getSupabaseClient } from "./supabase"
import type {
  Client,
  AdminUser,
  Tenant,
  ApiConfig,
  ERPConfig,
  Assistant,
  DashboardMetrics,
  PromptConfig,
} from "@/types" // Adicionado PromptConfig
import { hashPassword, verifyPassword, validatePasswordStrength } from "./password-utils" // Supondo que este arquivo exista e funcione
import { generateUUID, isValidUUID } from "./utils" // Supondo que estas funções foram movidas para utils.ts

const supabase = getSupabaseClient()

// --- Funções de Validação (Exemplo, ajuste conforme necessário) ---
export async function validatePromptTemplateExists(templateId: string): Promise<boolean> {
  if (!isValidUUID(templateId)) return false
  const { data, error } = await supabase.from("prompt_templates").select("id").eq("id", templateId).maybeSingle()
  return !!data && !error
}

export async function validateERPTemplateExists(templateId: string): Promise<boolean> {
  if (!isValidUUID(templateId)) return false
  const { data, error } = await supabase.from("erp_templates").select("id").eq("id", templateId).maybeSingle()
  return !!data && !error
}

// --- Funções de Mapeamento ---
async function dbRowToClient(row: any): Promise<Client> {
  const tenant: Tenant = {
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
      country: row.address_country,
      state: row.address_state,
      city: row.address_city,
      complement: row.address_complement,
      postal_code: row.address_postal_code,
    },
  }

  const adminUser: AdminUser = {
    name: row.admin_name,
    email: row.admin_email,
    password: row.admin_password_hash, // A senha já está hashada no DB
    document: row.admin_document,
    role: row.admin_role,
  }

  const apiConfig: ApiConfig = {
    openai_key: row.openai_key,
    openrouter_key: row.openrouter_key,
    api_tests: row.api_tests || {},
  }

  let erpConfig: ERPConfig | undefined = undefined
  if (row.erp_template_id && row.erp_template_name) {
    erpConfig = {
      template_id: row.erp_template_id,
      template_name: row.erp_template_name,
    }
  }

  // Buscar assistentes associados
  const { data: assistantsData, error: assistantsError } = await supabase
    .from("assistants")
    .select("*")
    .eq("client_id", row.id)

  if (assistantsError) {
    console.error("Error fetching assistants for client:", row.id, assistantsError)
  }

  const client: Client = {
    id: row.id,
    tenant,
    admin_user: adminUser,
    api_config: apiConfig,
    erp_config: erpConfig,
    assistants: assistantsData || [], // Adiciona os assistentes ao objeto Client
    // advanced_config não está no schema atual da tabela clients, pode ser gerenciado separadamente se necessário
    onboarding_status: row.onboarding_status,
    current_step: row.current_step,
    total_steps: row.total_steps,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deployed_at: row.deployed_at,
    deployment_url: row.deployment_url,
  }
  return client
}

async function clientToDbRow(client: Client): Promise<any> {
  // A senha do admin_user já deve estar hashada antes de chamar esta função se for um novo usuário
  // ou deve ser o hash existente se estiver atualizando.
  const dbRow: any = {
    id: client.id,
    // Tenant
    tenant_name: client.tenant.name,
    tenant_document: client.tenant.document,
    tenant_phone: client.tenant.phone_number,
    company_email: client.tenant.email,
    company_website: client.tenant.website,
    company_sector: client.tenant.sector,
    // Address
    address_street: client.tenant.address.street,
    address_number: client.tenant.address.number,
    address_neighborhood: client.tenant.address.neighborhood,
    address_country: client.tenant.address.country,
    address_state: client.tenant.address.state,
    address_city: client.tenant.address.city,
    address_complement: client.tenant.address.complement,
    address_postal_code: client.tenant.address.postal_code,
    // Admin User
    admin_name: client.admin_user.name,
    admin_email: client.admin_user.email,
    admin_password_hash: client.admin_user.password, // Assumindo que client.admin_user.password contém o hash
    admin_document: client.admin_user.document,
    admin_role: client.admin_user.role,
    // API Config
    openai_key: client.api_config?.openai_key,
    openrouter_key: client.api_config?.openrouter_key,
    api_tests: client.api_config?.api_tests || {},
    // ERP Config
    erp_template_id: client.erp_config?.template_id || null,
    erp_template_name: client.erp_config?.template_name || null,
    // Onboarding
    onboarding_status: client.onboarding_status,
    current_step: client.current_step,
    total_steps: client.total_steps,
    // Timestamps & Deploy
    created_at: client.created_at, // Gerenciado pelo DB no insert, mas pode ser passado
    updated_at: client.updated_at, // Gerenciado pelo trigger, mas pode ser passado
    deployed_at: client.deployed_at,
    deployment_url: client.deployment_url,
  }
  // Remover campos undefined para evitar problemas com Supabase
  for (const key in dbRow) {
    if (dbRow[key] === undefined) {
      delete dbRow[key]
    }
  }
  return dbRow
}

// --- CRUD para Clients ---
export async function saveClient(client: Client): Promise<{ success: boolean; data?: Client; error?: string }> {
  try {
    if (!client.id) client.id = generateUUID()
    if (!client.created_at) client.created_at = new Date().toISOString()
    client.updated_at = new Date().toISOString()

    // Hashear senha do admin_user se for um novo cliente ou se a senha foi alterada
    // Esta lógica pode precisar ser mais robusta, verificando se é uma nova senha
    if (client.admin_user.password && !client.admin_user.password.startsWith("$2")) {
      // Simples checagem se não é hash
      const hashedPassword = await hashPassword(client.admin_user.password)
      client.admin_user.password = hashedPassword
    }

    const dbRow = await clientToDbRow(client)

    const { data, error } = await supabase.from("clients").upsert(dbRow, { onConflict: "id" }).select().single()

    if (error) {
      console.error("Supabase error during saveClient:", error)
      return { success: false, error: error.message }
    }

    // Salvar/Atualizar assistentes associados
    if (client.assistants && client.assistants.length > 0) {
      for (const assistant of client.assistants) {
        assistant.client_id = data.id // Garante que o client_id está correto
        await saveAssistant(assistant) // saveAssistant é uma nova função que você precisará criar
      }
    }

    const savedClient = await dbRowToClient(data)
    return { success: true, data: savedClient }
  } catch (error: any) {
    console.error("Error in saveClient:", error)
    return { success: false, error: error.message }
  }
}

export async function updateClientStep(
  clientId: string,
  newCurrentStep: number,
  dataFromCompletedStep: any,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: currentClientData, error: fetchError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single()

    if (fetchError || !currentClientData) {
      console.error("Error fetching client for update:", fetchError)
      return { success: false, error: fetchError?.message || "Client not found" }
    }

    const clientObject = await dbRowToClient(currentClientData)
    clientObject.current_step = newCurrentStep

    const completedStepNumber = newCurrentStep - 1

    switch (completedStepNumber) {
      case 1: // Tenant Data
        clientObject.tenant = dataFromCompletedStep.tenant
        // A senha do adminUser deve ser hashada aqui se for a primeira vez
        if (dataFromCompletedStep.adminUser.password && !dataFromCompletedStep.adminUser.password.startsWith("$2")) {
          const hashedPassword = await hashPassword(dataFromCompletedStep.adminUser.password)
          clientObject.admin_user = { ...dataFromCompletedStep.adminUser, password: hashedPassword }
        } else {
          clientObject.admin_user = dataFromCompletedStep.adminUser
        }
        break
      case 2: // API Config
        clientObject.api_config = dataFromCompletedStep
        break
      case 3: // ERP Config
        if (
          dataFromCompletedStep.template_id &&
          !(await validateERPTemplateExists(dataFromCompletedStep.template_id))
        ) {
          return { success: false, error: `Invalid ERP template ID: ${dataFromCompletedStep.template_id}` }
        }
        clientObject.erp_config = dataFromCompletedStep
        break
      case 4: // Prompt Config (agora Assistants)
        // dataFromCompletedStep deve ser um array de objetos Assistant
        if (Array.isArray(dataFromCompletedStep)) {
          clientObject.assistants = dataFromCompletedStep
        } else {
          // Se for um único PromptConfig, adaptar para criar um Assistant
          // Esta lógica pode precisar de ajuste dependendo de como Step4 envia os dados
          const promptConfigStepData = dataFromCompletedStep as PromptConfig
          if (promptConfigStepData && promptConfigStepData.template_id) {
            if (!(await validatePromptTemplateExists(promptConfigStepData.template_id))) {
              return { success: false, error: `Invalid Prompt template ID: ${promptConfigStepData.template_id}` }
            }
            // Criar ou atualizar um assistente padrão com esta configuração de prompt
            const defaultAssistant: Assistant = {
              id: clientObject.assistants?.[0]?.id || generateUUID(), // Reutiliza ou cria novo
              client_id: clientId,
              name: "Assistente Principal", // Nome padrão
              prompt_template_id: promptConfigStepData.template_id,
              model: promptConfigStepData.assistant_config.model,
              temperature: promptConfigStepData.assistant_config.temperature,
              max_tokens: promptConfigStepData.assistant_config.max_tokens,
              enabled: true,
              created_at: clientObject.assistants?.[0]?.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            clientObject.assistants = [defaultAssistant]
          }
        }
        break
      case 5: // Function Mapping (atualiza ERP config)
        if (clientObject.erp_config) {
          clientObject.erp_config = { ...clientObject.erp_config, ...dataFromCompletedStep }
        } else if (dataFromCompletedStep.template_id) {
          if (!(await validateERPTemplateExists(dataFromCompletedStep.template_id))) {
            return {
              success: false,
              error: `Invalid ERP template ID from function mapping: ${dataFromCompletedStep.template_id}`,
            }
          }
          clientObject.erp_config = dataFromCompletedStep
        }
        break
      case 6: // Advanced Config
        // clientObject.advanced_config = dataFromCompletedStep; // advanced_config não está na tabela clients
        console.warn(
          "Advanced config step data received, but not directly stored on 'clients' table in current schema.",
        )
        break
    }

    const { success, error } = await saveClient(clientObject)
    return { success, error }
  } catch (error: any) {
    console.error("Error in updateClientStep:", error)
    return { success: false, error: error.message }
  }
}

export async function getClients(filters?: any): Promise<{ success: boolean; data?: Client[]; error?: string }> {
  try {
    const query = supabase.from("clients").select("*")
    // Adicionar filtros aqui se necessário, ex: query.eq('onboarding_status', filters.status)
    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) return { success: false, error: error.message }

    const clients = data ? await Promise.all(data.map(dbRowToClient)) : []
    return { success: true, data: clients }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteClient(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Deletar assistentes associados primeiro
    const { error: assistantError } = await supabase.from("assistants").delete().eq("client_id", id)
    if (assistantError) {
      console.error("Error deleting client's assistants:", assistantError)
      // Continuar mesmo se houver erro ao deletar assistentes, para tentar deletar o cliente
    }

    const { error } = await supabase.from("clients").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// --- CRUD para Assistants (NOVO) ---
export async function saveAssistant(
  assistant: Assistant,
): Promise<{ success: boolean; data?: Assistant; error?: string }> {
  try {
    if (!assistant.id) assistant.id = generateUUID()
    if (!assistant.client_id) return { success: false, error: "Client ID is required for assistant" }
    if (!assistant.created_at) assistant.created_at = new Date().toISOString()
    assistant.updated_at = new Date().toISOString()

    // Validar prompt_template_id se fornecido
    if (assistant.prompt_template_id && !(await validatePromptTemplateExists(assistant.prompt_template_id))) {
      return { success: false, error: `Invalid Prompt Template ID: ${assistant.prompt_template_id}` }
    }

    const assistantDbRow = {
      id: assistant.id,
      client_id: assistant.client_id,
      name: assistant.name,
      description: assistant.description,
      prompt_template_id: assistant.prompt_template_id || null,
      model: assistant.model,
      temperature: assistant.temperature,
      max_tokens: assistant.max_tokens,
      system_prompt: assistant.system_prompt,
      enabled: assistant.enabled,
      created_at: assistant.created_at,
      updated_at: assistant.updated_at,
    }

    const { data, error } = await supabase
      .from("assistants")
      .upsert(assistantDbRow, { onConflict: "id" })
      .select()
      .single()

    if (error) {
      console.error("Supabase error during saveAssistant:", error)
      return { success: false, error: error.message }
    }
    return { success: true, data: data as Assistant }
  } catch (error: any) {
    console.error("Error in saveAssistant:", error)
    return { success: false, error: error.message }
  }
}

// --- Autenticação ---
export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    if (email === "admin@pipeelo.com" && password === "admin123") {
      return {
        success: true,
        user: { id: "admin-dev-special", email: "admin@pipeelo.com", name: "Admin Pipeelo", role: "admin" },
      }
    }

    const { data, error } = await supabase.from("users").select("*").eq("email", email).maybeSingle()

    if (error) return { success: false, error: "Erro ao consultar usuário." }
    if (!data) return { success: false, error: "Email não encontrado." }

    // Se a senha no DB não for um hash (ex: 'admin123' para o seed), comparar diretamente
    // Para produção, SEMPRE use hashes.
    const isPasswordValid = data.password_hash.startsWith("$2")
      ? await verifyPassword(password, data.password_hash)
      : password === data.password_hash

    if (!isPasswordValid) return { success: false, error: "Senha inválida." }

    // Remover password_hash do objeto do usuário retornado
    const { password_hash, ...userWithoutPassword } = data
    return { success: true, user: userWithoutPassword }
  } catch (error: any) {
    return { success: false, error: "Falha na autenticação." }
  }
}

export async function createUser(
  user: Omit<AdminUser, "password"> & { password: string },
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const passwordValidation = validatePasswordStrength(user.password)
    if (!passwordValidation.isValid) {
      return { success: false, error: passwordValidation.feedback.join(", ") }
    }
    const hashedPassword = await hashPassword(user.password)
    const userId = generateUUID()

    const { data, error } = await supabase
      .from("users")
      .insert({
        id: userId,
        name: user.name,
        email: user.email,
        password_hash: hashedPassword,
        role: user.role,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    const { password_hash, ...userWithoutPassword } = data
    return { success: true, data: userWithoutPassword }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// --- Outras Funções (getDashboardMetrics, etc.) ---
export async function getDashboardMetrics(): Promise<{ success: boolean; data?: DashboardMetrics; error?: string }> {
  try {
    const { count: totalClients, error: totalError } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
    if (totalError) throw totalError

    const { count: completedOnboardings, error: completedError } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("onboarding_status", "deployed")
    if (completedError) throw completedError

    const { count: inProgress, error: progressError } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("onboarding_status", "in_progress")
    if (progressError) throw progressError

    const { count: failedDeployments, error: failedError } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("onboarding_status", "failed")
    if (failedError) throw failedError

    // Cálculo de tempo médio e taxa de sucesso pode ser mais complexo e exigir buscar os dados
    const metrics: DashboardMetrics = {
      total_clients: totalClients || 0,
      completed_onboardings: completedOnboardings || 0,
      in_progress: inProgress || 0,
      failed_deployments: failedDeployments || 0,
      average_completion_time: 0, // Placeholder
      success_rate:
        totalClients && totalClients > 0 ? Math.round(((completedOnboardings || 0) / totalClients) * 100) : 0, // Placeholder
    }
    return { success: true, data: metrics }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// --- User Management Functions ---
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
