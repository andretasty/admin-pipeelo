export interface Address {
  street: string
  number: string
  neighborhood: string
  country: string
  state: string
  city: string
  complement?: string
  postal_code: string
}

export interface Tenant {
  name: string
  document: string
  phone_number: string
  email: string
  website?: string
  sector: string
  address: Address
}

export interface AdminUser {
  name: string
  email: string
  password: string
  document: string
  role: string
}

export interface ApiConfig {
  openai_key?: string
  openrouter_key?: string
  api_tests?: {
    openai_status?: "pending" | "success" | "failed"
    openrouter_status?: "pending" | "success" | "failed"
    last_tested?: string
  }
}

export interface ERPCommand {
  name: string
  description: string
  script: string
  parameters: string[]
  response_format: Record<string, any>
  enabled?: boolean
}

export interface ERPTemplate {
  id: string
  name: string
  version: string
  description: string
  logo?: string
  commands: ERPCommand[]
  integration_fields: Array<{
    name: string
    type: "text" | "url" | "password" | "number"
    label: string
    required: boolean
    placeholder?: string
  }>
}

export interface ERPConfig {
  template_id: string
  template_name: string
  fields: Record<string, string>
  enabled_commands: string[]
  connection_status?: "pending" | "connected" | "failed"
  last_tested?: string
}

export interface AssistantConfig {
  provider: "openai" | "openrouter"
  model: string
  temperature: number
  top_p: number
  frequency_penalty: number
  response_delay: number
  max_tokens?: number
}

export interface PromptTemplate {
  id: string
  name: string
  description: string
  category: string
  sector?: string
  content: string
  placeholders: string[]
  variables?: Record<string, string>
}

export interface PromptConfig {
  template_id: string
  template_name: string
  final_content: string
  assistant_config: AssistantConfig
  placeholders_filled: Record<string, string>
}

// NEW: Assistant interface that combines prompt, functions, and AI config
export interface Assistant {
  id: string
  name: string
  description?: string
  prompt_config: PromptConfig
  enabled_functions: string[] // Array of ERP command names
  ai_config: AssistantConfig
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface AdvancedConfig {
  categories: string[]
  full_service_enabled: boolean
  webhooks: Array<{
    url: string
    events: string[]
    enabled: boolean
  }>
  backup_settings: {
    frequency: "daily" | "weekly" | "monthly"
    retention_days: number
    enabled: boolean
  }
}

export interface Client {
  id: string
  tenant: Tenant
  admin_user: AdminUser
  api_config: ApiConfig
  erp_config?: ERPConfig
  // CHANGED: Replace single prompt_config with array of assistants
  assistants?: Assistant[]
  advanced_config?: AdvancedConfig
  onboarding_status: "draft" | "in_progress" | "completed" | "deployed" | "failed"
  current_step: number
  total_steps: number
  created_at: string
  updated_at: string
  deployed_at?: string
  deployment_url?: string
}

export interface OnboardingStep {
  step: number
  title: string
  description: string
  completed: boolean
  data?: any
}

export interface DashboardMetrics {
  total_clients: number
  completed_onboardings: number
  in_progress: number
  average_completion_time: number
  success_rate: number
  failed_deployments: number
}
