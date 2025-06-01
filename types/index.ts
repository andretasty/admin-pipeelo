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
  id: string
  name: string
  document: string
  phone_number: string
  email: string
  website?: string
  pipeelo_token?: string
  sector?: string // Made nullable based on previous feedback
  address_id?: string // Link to Address table
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  name: string
  email: string
  password_hash: string
  role: string
  tenant_id?: string // Optional, for tenant-specific users
  created_at: string
  updated_at: string
}

export interface ApiConfiguration {
  id: string
  tenant_id: string
  openai_key?: string
  openrouter_key?: string
  api_tests?: {
    openai_status?: "pending" | "success" | "failed"
    openrouter_status?: "pending" | "success" | "failed"
    last_tested?: string
  }
  created_at: string
  updated_at: string
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
  is_active: boolean // Added based on database schema
}

export interface ErpConfiguration {
  id: string
  tenant_id: string
  template_id?: string // Changed from erp_template_id
  erp_template_name?: string
  fields: Record<string, string>
  enabled_commands: string[]
  connection_status?: "pending" | "connected" | "failed"
  last_tested?: string
  created_at: string
  updated_at: string
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
}

export interface PromptConfig {
  template_id: string
  template_name: string
  final_content: string
  assistant_config: AssistantConfig
  placeholders_filled: Record<string, string>
}

export interface Assistant {
  id: string
  tenant_id: string
  name: string
  description?: string
  prompt_config: PromptConfig // This can be a JSONB field in DB
  enabled_functions: string[]
  ai_config: AssistantConfig // This can be a JSONB field in DB
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface AdvancedConfiguration {
  id: string
  tenant_id: string
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
  created_at: string
  updated_at: string
}

export interface OnboardingProgress {
  id: string
  tenant_id: string
  onboarding_status: "draft" | "in_progress" | "completed" | "deployed" | "failed"
  current_step: number
  total_steps: number
  deployed_at?: string
  deployment_url?: string
  created_at: string
  updated_at: string
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
