import { getSupabaseClient } from "./supabase"
import type {
  Tenant,
  User,
  ApiConfiguration,
  ErpConfiguration,
  Assistant,
  AdvancedConfiguration,
  OnboardingProgress,
  Address,
  Prompt,
  Function,
  AssistantWithFunctions,
  TenantAddressId,
} from "@/types"
// Import the password utilities at the top
import { hashPassword, verifyPassword, needsRehash, validatePasswordStrength } from "./password-utils"

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
      // PGRST116: "Searched for a single row, but 0 rows were found" - this is fine for maybeSingle
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

// --- ADDRESSES CRUD ---
export async function saveAddress(address: Address): Promise<{ success: boolean; data?: Address; error?: string }> {
  try {
    const id = address.id || generateUUID()
    const { data: rawData, error } = await supabase
      .from("addresses")
      .upsert({ ...address, id }, { onConflict: "id" })
      .select()
      .single()
    if (error) {
      console.error("Supabase error during saveAddress:", error)
      return { success: false, error: error.message }
    }
    const data = rawData as unknown as Address
    return { success: true, data }
  } catch (error: any) {
    console.error("Error saving address:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function getAddress(id: string): Promise<{ success: boolean; data?: Address; error?: string }> {
  try {
    const { data: rawData, error } = await supabase.from("addresses").select("*").eq("id", id).single()
    if (error) {
      console.error("Supabase error during getAddress:", error)
      return { success: false, error: error.message }
    }
    const data = rawData as unknown as Address
    return { success: true, data }
  } catch (error: any) {
    console.error("Error getting address:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

// --- TENANTS CRUD ---
export async function saveTenant(
  tenant: Tenant,
  address?: Address,
): Promise<{ success: boolean; data?: Tenant; error?: string }> {
  try {
    let addressId = tenant.address_id
    if (address) {
      // Check if address already exists by matching unique fields
      const { data: existingAddresses, error: existingError } = await supabase
        .from("addresses")
        .select("id")
        .eq("street", address.street)
        .eq("number", address.number)
        .eq("neighborhood", address.neighborhood)
        .eq("city", address.city)
        .eq("state", address.state)
        .eq("country", address.country)
        .eq("postal_code", address.postal_code)
        .limit(1)

      if (existingError) {
        console.error("Error checking existing address:", existingError)
        // Proceed to save address anyway
      }

      if (existingAddresses && existingAddresses.length > 0) {
        addressId = existingAddresses[0].id
      } else {
        const { success, data: savedAddress, error: addressError } = await saveAddress(address)
        if (!success || !savedAddress) {
          return { success: false, error: addressError || "Failed to save address" }
        }
        addressId = savedAddress.id
      }
    }

    const id = tenant.id || generateUUID()
    const { data: rawData, error } = await supabase
      .from("tenants")
      .upsert({ ...tenant, id, address_id: addressId }, { onConflict: "id" })
      .select()
      .single()
    if (error) {
      console.error("Supabase error during saveTenant:", error)
      return { success: false, error: error.message }
    }
    const data = rawData as unknown as Tenant
    return { success: true, data }
  } catch (error: any) {
    console.error("Error saving tenant:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function getTenant(id: string): Promise<{ success: boolean; data?: Tenant; error?: string }> {
  try {
    const { data: rawData, error } = await supabase.from("tenants").select("*").eq("id", id).single()
    if (error) {
      console.error("Supabase error during getTenant:", error)
      return { success: false, error: error.message }
    }
    const data = rawData as unknown as Tenant
    return { success: true, data }
  } catch (error: any) {
    console.error("Error getting tenant:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function getTenants(filters?: any): Promise<{ success: boolean; data?: Tenant[]; error?: string }> {
  try {
    let query = supabase.from("tenants").select("*")

    if (filters?.status) {
      // This filter will need to join with onboarding_progress table
      // For now, it's a placeholder or assumes a direct column if re-added
      console.warn("Filtering by status requires joining with onboarding_progress table.")
    }

    if (filters?.sector) {
      query = query.eq("sector", filters.sector)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    const { data: rawData, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error during getTenants:", error)
      return { success: false, error: error.message }
    }
    const data = rawData as unknown as Tenant[]
    return { success: true, data }
  } catch (error: any) {
    console.error("Error getting tenants:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function deleteTenant(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // First, get the tenant to retrieve the address_id
    let tenant: TenantAddressId | null = null
    const { data: rawTenant, error: getTenantError } = await supabase
      .from("tenants")
      .select("id, address_id")
      .eq("id", id)
      .single()

    if (getTenantError) {
      console.error("Error getting tenant for deletion:", getTenantError)
      // Continue with deletion even if we can't get the tenant
    }

    if (rawTenant) {
      tenant = rawTenant as TenantAddressId
    }

    let addressId: string | undefined
    if (tenant && tenant.address_id) {
      addressId = tenant.address_id
    }

    // Delete all related records first to satisfy foreign key constraints
    // Delete all related records first to satisfy foreign key constraints
    // Delete all related records first to satisfy foreign key constraints
    // Order matters due to foreign key dependencies

    // 1. Delete assistant_functions (junction table)
    const { data: assistantIdsToDelete, error: assistantIdsError } = await supabase
      .from("assistants")
      .select("id")
      .eq("tenant_id", id)

    if (assistantIdsError) {
      console.error("Error fetching assistant IDs for deletion:", assistantIdsError)
      // Continue, but log the error
    }

    const idsToDelete = assistantIdsToDelete ? assistantIdsToDelete.map((a) => a.id) : []

    if (idsToDelete.length > 0) {
      await supabase.from("assistant_functions").delete().in("assistant_id", idsToDelete)
    }

    // 2. Delete assistants
    await supabase.from("assistants").delete().eq("tenant_id", id)
    // 3. Delete prompts
    await supabase.from("prompts").delete().eq("tenant_id", id)
    // 4. Delete functions
    await supabase.from("functions").delete().eq("tenant_id", id)
    // 5. Delete other tenant-specific configurations
    await supabase.from("api_configurations").delete().eq("tenant_id", id)
    await supabase.from("erp_configurations").delete().eq("tenant_id", id)
    await supabase.from("advanced_configurations").delete().eq("tenant_id", id)
    await supabase.from("onboarding_progress").delete().eq("tenant_id", id)
    await supabase.from("users").delete().eq("tenant_id", id) // Delete tenant-specific users

    // Delete the tenant record
    const { error } = await supabase.from("tenants").delete().eq("id", id)

    if (error) {
      console.error("Supabase error during deleteTenant:", error)
      return { success: false, error: error.message }
    }

    // Finally, delete the address if it exists
    if (addressId) {
      const { error: addressError } = await supabase.from("addresses").delete().eq("id", addressId)
      if (addressError) {
        console.error("Error deleting tenant address:", addressError)
        // Don't fail the tenant deletion if address deletion fails
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting tenant:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function updateTenantPipeeloToken(
  id: string,
  token: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("tenants")
      .update({ pipeelo_token: token, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("Supabase error during updateTenantPipeeloToken:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error updating tenant pipeelo token:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

// --- API_CONFIGURATIONS CRUD ---
export async function saveApiConfiguration(
  config: ApiConfiguration,
): Promise<{ success: boolean; data?: ApiConfiguration; error?: string }> {
  try {
    const id = config.id || generateUUID()
    const { data: rawData, error } = await supabase
      .from("api_configurations")
      .upsert({ ...config, id }, { onConflict: "id" })
      .select()
      .single()
    if (error) {
      console.error("Supabase error during saveApiConfiguration:", error)
      return { success: false, error: error.message }
    }
    const data = rawData as unknown as ApiConfiguration
    return { success: true, data }
  } catch (error: any) {
    console.error("Error saving API configuration:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function getApiConfiguration(
  tenantId: string,
): Promise<{ success: boolean; data?: ApiConfiguration; error?: string }> {
  try {
    const { data: rawData, error } = await supabase
      .from("api_configurations")
      .select("*")
      .eq("tenant_id", tenantId)
      .single()
    if (error) {
      console.error("Supabase error during getApiConfiguration:", error)
      return { success: false, error: error.message }
    }
    const data = rawData as unknown as ApiConfiguration
    return { success: true, data }
  } catch (error: any) {
    console.error("Error getting API configuration:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

// --- ERP_CONFIGURATIONS CRUD ---
export async function saveErpConfiguration(
  config: ErpConfiguration,
): Promise<{ success: boolean; data?: ErpConfiguration; error?: string }> {
  try {
    const id = config.id || generateUUID()

    // Map the fields to match the database column names
    const dataToSave = {
      id,
      tenant_id: config.tenant_id,
      erp_template_id: config.template_id, // Map template_id to erp_template_id
      erp_template_name: config.erp_template_name,
      fields: config.fields,
      enabled_commands: config.enabled_commands,
      connection_status: config.connection_status,
      last_tested: config.last_tested,
      created_at: config.created_at,
      updated_at: config.updated_at,
    }

    const { data: rawData, error } = await supabase
      .from("erp_configurations")
      .upsert(dataToSave, { onConflict: "id" })
      .select()
      .single()
    if (error) {
      console.error("Supabase error during saveErpConfiguration:", error)
      return { success: false, error: error.message }
    }
    const data = rawData as unknown as ErpConfiguration
    return { success: true, data }
  } catch (error: any) {
    console.error("Error saving ERP configuration:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function getErpConfiguration(
  tenantId: string,
): Promise<{ success: boolean; data?: ErpConfiguration; error?: string }> {
  try {
    const { data: rawData, error } = await supabase
      .from("erp_configurations")
      .select("*")
      .eq("tenant_id", tenantId)
      .single()
    if (error) {
      console.error("Supabase error during getErpConfiguration:", error)
      return { success: false, error: error.message }
    }

    // Map the database column names back to the interface field names
    if (rawData) {
      const mappedData: ErpConfiguration = {
        id: rawData.id as string,
        tenant_id: rawData.tenant_id as string,
        template_id: rawData.erp_template_id as string, // Map erp_template_id to template_id
        erp_template_name: rawData.erp_template_name as string | undefined,
        fields: rawData.fields as Record<string, string>,
        enabled_commands: rawData.enabled_commands as string[],
        connection_status: rawData.connection_status as "pending" | "connected" | "failed" | undefined,
        last_tested: rawData.last_tested as string | undefined,
        created_at: rawData.created_at as string,
        updated_at: rawData.updated_at as string,
      }
      return { success: true, data: mappedData }
    }

    return { success: true, data: rawData as unknown as ErpConfiguration }
  } catch (error: any) {
    console.error("Error getting ERP configuration:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

// --- ASSISTANTS CRUD ---
export async function saveAssistant(
  assistant: Assistant,
): Promise<{ success: boolean; data?: Assistant; error?: string }> {
  try {
    // Validate if assistant.id is a valid UUID, else generate a new one
    const isValidUUID = (id: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    const id = assistant.id && isValidUUID(assistant.id) ? assistant.id : generateUUID()

    const { data: rawData, error } = await supabase
      .from("assistants")
      .upsert({ ...assistant, id }, { onConflict: "id" })
      .select()
      .single()
    if (error) {
      console.error("Supabase error during saveAssistant:", error)
      return { success: false, error: error.message }
    }
    const data = rawData as unknown as Assistant
    return { success: true, data }
  } catch (error: any) {
    console.error("Error saving assistant:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function getAssistants(
  tenantId: string,
): Promise<{ success: boolean; data?: Assistant[]; error?: string }> {
  try {
    const { data: rawData, error } = await supabase
      .from("assistants")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("name")
    if (error) {
      console.error("Supabase error during getAssistants:", error)
      return { success: false, error: error.message }
    }
    const data = rawData as unknown as Assistant[]
    return { success: true, data }
  } catch (error: any) {
    console.error("Error getting assistants:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function getAssistantsWithFunctions(
  tenantId: string,
): Promise<{ success: boolean; data?: AssistantWithFunctions[]; error?: string }> {
  try {
    // Fetch all assistants for the tenant
    const { data: assistantsRawData, error: assistantsError } = await supabase
      .from("assistants")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("name")

    if (assistantsError) {
      console.error("Supabase error during getAssistants (for functions):", assistantsError)
      return { success: false, error: assistantsError.message }
    }
    const assistantsData: Assistant[] = assistantsRawData as any as Assistant[]

    // Fetch all assistant-function associations for the tenant's assistants
    const assistantIds = assistantsData.map((a) => a.id)
    let assistantFunctionsData: { assistant_id: string; function_id: string }[] = []

    if (assistantIds.length > 0) {
      const { data: afRawData, error: afError } = await supabase
        .from("assistant_functions")
        .select("assistant_id, function_id")
        .in("assistant_id", assistantIds)

      if (afError) {
        console.error("Supabase error during getAssistantFunctions:", afError)
        return { success: false, error: afError.message }
      }
      assistantFunctionsData = afRawData as Array<{ assistant_id: string; function_id: string }>
    }

    // Map function_ids to their respective assistants
    const mappedAssistants: AssistantWithFunctions[] = assistantsData.map((assistant) => {
      const functionsForAssistant = assistantFunctionsData
        .filter((af) => af.assistant_id === assistant.id)
        .map((af) => af.function_id)

      return {
        ...assistant,
        function_ids: functionsForAssistant,
      }
    })

    return { success: true, data: mappedAssistants }
  } catch (error: any) {
    console.error("Error getting assistants with functions:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

// --- PROMPTS CRUD ---
export async function savePrompt(prompt: Prompt): Promise<{ success: boolean; data?: Prompt; error?: string }> {
  try {
    const id = prompt.id || generateUUID()
    const { data: rawData, error } = await supabase
      .from("prompts")
      .upsert({ ...prompt, id }, { onConflict: "id" })
      .select()
      .single()
    if (error) {
      console.error("Supabase error during savePrompt:", error)
      return { success: false, error: error.message }
    }
    const data = rawData as unknown as Prompt
    return { success: true, data }
  } catch (error: any) {
    console.error("Error saving prompt:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function getPrompts(tenantId: string): Promise<{ success: boolean; data?: Prompt[]; error?: string }> {
  try {
    const { data: rawData, error } = await supabase.from("prompts").select("*").eq("tenant_id", tenantId).order("name")
    if (error) {
      console.error("Supabase error during getPrompts:", error)
      return { success: false, error: error.message }
    }
    const data = rawData as unknown as Prompt[]
    return { success: true, data }
  } catch (error: any) {
    console.error("Error getting prompts:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

// --- FUNCTIONS CRUD ---
export async function saveFunction(func: Function): Promise<{ success: boolean; data?: Function; error?: string }> {
  try {
    const id = func.id || generateUUID()
    const { data: rawData, error } = await supabase
      .from("functions")
      .upsert({ ...func, id }, { onConflict: "id" })
      .select()
      .single()
    if (error) {
      console.error("Supabase error during saveFunction:", error)
      return { success: false, error: error.message }
    }
    const data = rawData as unknown as Function
    return { success: true, data }
  } catch (error: any) {
    console.error("Error saving function:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function getFunctions(tenantId: string): Promise<{ success: boolean; data?: Function[]; error?: string }> {
  try {
    const { data: rawData, error } = await supabase
      .from("functions")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("name")
    if (error) {
      console.error("Supabase error during getFunctions:", error)
      return { success: false, error: error.message }
    }
    const data = rawData as unknown as Function[]
    return { success: true, data }
  } catch (error: any) {
    console.error("Error getting functions:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function deleteFunction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("functions").delete().eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function saveAssistantWithFunctions(
  assistant: Assistant,
  functionIds: string[],
): Promise<{ success: boolean; data?: Assistant; error?: string }> {
  const result = await saveAssistant(assistant)
  if (!result.success || !result.data) {
    return result
  }

  const assistantId = result.data.id
  try {
    // Remove existing associations
    const { error: delErr } = await supabase.from("assistant_functions").delete().eq("assistant_id", assistantId)
    if (delErr) {
      console.error("Error deleting old assistant functions:", delErr)
      return { success: false, error: delErr.message }
    }

    if (functionIds.length > 0) {
      const rows = functionIds.map((fid) => ({ assistant_id: assistantId, function_id: fid }))
      const { error: insErr } = await supabase.from("assistant_functions").insert(rows)
      if (insErr) {
        console.error("Error inserting assistant functions:", insErr)
        return { success: false, error: insErr.message }
      }
    }

    return { success: true, data: result.data }
  } catch (error: any) {
    console.error("Error saving assistant functions:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

// --- ADVANCED_CONFIGURATIONS CRUD ---
export async function saveAdvancedConfiguration(
  config: AdvancedConfiguration,
): Promise<{ success: boolean; data?: AdvancedConfiguration; error?: string }> {
  try {
    const id = config.id || generateUUID()
    const { data: rawData, error } = await supabase
      .from("advanced_configurations")
      .upsert({ ...config, id }, { onConflict: "id" })
      .select()
      .single()
    if (error) {
      console.error("Supabase error during saveAdvancedConfiguration:", error)
      return { success: false, error: error.message }
    }
    const data = rawData as unknown as AdvancedConfiguration
    return { success: true, data }
  } catch (error: any) {
    console.error("Error saving advanced configuration:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function getAdvancedConfiguration(
  tenantId: string,
): Promise<{ success: boolean; data?: AdvancedConfiguration; error?: string }> {
  try {
    const { data: rawData, error } = await supabase
      .from("advanced_configurations")
      .select("*")
      .eq("tenant_id", tenantId)
      .single()
    if (error) {
      console.error("Supabase error during getAdvancedConfiguration:", error)
      return { success: false, error: error.message }
    }
    const data = rawData as unknown as AdvancedConfiguration
    return { success: true, data }
  } catch (error: any) {
    console.error("Error getting advanced configuration:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

// --- ONBOARDING_PROGRESS CRUD ---
export async function saveOnboardingProgress(
  progress: OnboardingProgress,
): Promise<{ success: boolean; data?: OnboardingProgress; error?: string }> {
  try {
    const id = progress.id || generateUUID()
    const { data: rawData, error } = await supabase
      .from("onboarding_progress")
      .upsert({ ...progress, id }, { onConflict: "id" })
      .select()
      .single()
    if (error) {
      console.error("Supabase error during saveOnboardingProgress:", error)
      return { success: false, error: error.message }
    }
    const data = rawData as unknown as OnboardingProgress
    return { success: true, data }
  } catch (error: any) {
    console.error("Error saving onboarding progress:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function getOnboardingProgress(
  tenantId: string,
): Promise<{ success: boolean; data?: OnboardingProgress; error?: string }> {
  try {
    const { data: rawData, error } = await supabase
      .from("onboarding_progress")
      .select("*")
      .eq("tenant_id", tenantId)
      .single()
    if (error) {
      console.error("Supabase error during getOnboardingProgress:", error)
      return { success: false, error: error.message }
    }
    const data = rawData as unknown as OnboardingProgress
    return { success: true, data }
  } catch (error: any) {
    console.error("Error getting onboarding progress:", error)
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

// --- AUTHENTICATION & USER MANAGEMENT (Updated to use new User type and tenant_id) ---
export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    console.log("Tentando autenticar usuário:", email)

    const { data: rawData, error } = await supabase.from("users").select("*").eq("email", email)

    if (error) {
      console.error("Erro na consulta de autenticação Supabase:", error)
      return { success: false, error: "Erro interno do sistema ao autenticar." }
    }

    if (!rawData || rawData.length === 0) {
      console.log("Nenhum usuário encontrado com esse email:", email)
      return { success: false, error: "Credenciais inválidas." }
    }

    if (rawData.length > 1) {
      console.warn("Múltiplos usuários encontrados com o mesmo email:", email)
      return { success: false, error: "Erro de configuração: Múltiplos usuários encontrados." }
    }

    const user = rawData[0] as unknown as User

    // Verify password using bcrypt comparison
    const isPasswordValid = await verifyPassword(password, user.password_hash as string)

    if (!isPasswordValid) {
      console.log("Senha inválida para usuário:", email)
      return { success: false, error: "Credenciais inválidas." }
    }

    // Check if password needs rehashing for security upgrade
    if (needsRehash(user.password_hash as string)) {
      console.log("Password needs rehashing for user:", email)
      try {
        const newHash = await hashPassword(password)
        await supabase
          .from("users")
          .update({
            password_hash: newHash,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id as string)
        console.log("Password rehashed successfully for user:", email)
      } catch (rehashError) {
        console.error("Error rehashing password:", rehashError)
        // Don't fail login if rehashing fails
      }
    }

    console.log("Usuário autenticado com sucesso:", user.email)
    return { success: true, user }
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
  tenantId?: string, // Added tenantId
): Promise<{ success: boolean; error?: string }> {
  // Removed user creation logic as per user request
  return { success: true }
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

export async function getUsers(): Promise<{ success: boolean; data?: User[]; error?: string }> {
  try {
    const { data: rawData, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    const data = rawData as unknown as User[]
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
