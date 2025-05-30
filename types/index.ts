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
  name: string // tenant_name
  document: string // tenant_document (UNIQUE)
  phone_number: string // tenant_phone
  email: string // company_email (UNIQUE)
  website?: string // company_website
  sector: string // company_sector
  address: Address
}

export interface AdminUser {
  name: string // admin_name
  email: string // admin_email (UNIQUE)
  password: string // Será o admin_password_hash no DB
  document: string // admin_document (UNIQUE)
  role: string // admin_role
}

export interface ApiConfig {
  openai_key?: string
  openrouter_key?: string
  api_tests?: {
    // api_tests (JSONB)
    openai_status?: "pending" | "success" | "failed"
    openrouter_status?: "pending" | "success" | "failed"
    last_tested?: string
  }
}

export interface ERPTemplate {
  id: string
  name: string
  description?: string
  // Removido: fields, commands (conforme novo schema)
}

export interface ERPConfig {
  template_id: string // erp_template_id (FK)
  template_name: string // erp_template_name (denormalizado)
  // Removido: fields, enabled_commands, connection_status, last_tested
  // Se precisar de campos específicos do ERP preenchidos, adicione um campo JSONB aqui e no DB
  // Ex: config_details?: Record<string, any>
}

export interface AssistantConfig {
  // Parte da configuração do Assistant, não uma tabela separada
  provider: "openai" | "openrouter" // Não diretamente no DB, usado pela lógica da app
  model: string // model (na tabela assistants)
  temperature: number // temperature (na tabela assistants)
  top_p: number // Não no schema atual, pode ser adicionado se necessário
  frequency_penalty: number // Não no schema atual, pode ser adicionado se necessário
  response_delay: number // Não no schema atual, usado pela lógica da app
  max_tokens?: number // max_tokens (na tabela assistants)
}

export interface PromptTemplate {
  id: string
  name: string
  description?: string
  template: string // template (conteúdo do prompt)
  category?: string
  // Removido: placeholders, variables (conforme novo schema)
}

export interface PromptConfig {
  // Representa a configuração de um prompt para um assistente
  template_id: string // prompt_template_id (FK na tabela assistants)
  template_name: string // Denormalizado para UI, obtido do PromptTemplate
  final_content: string // Gerado pela aplicação, não armazenado diretamente assim no DB
  assistant_config: AssistantConfig // Contém model, temperature, etc. que vão para a tabela assistants
  placeholders_filled?: Record<string, string> // Usado pela app para gerar final_content
}

// Interface para a tabela 'assistants'
export interface Assistant {
  id: string
  client_id: string // FK para clients
  name: string
  description?: string
  prompt_template_id?: string // FK para prompt_templates
  model: string
  temperature: number
  max_tokens?: number
  system_prompt?: string
  enabled: boolean
  created_at: string
  updated_at: string
  // Para a UI, podemos popular informações do prompt_template aqui
  prompt_config?: PromptConfig // Usado para configurar o assistente na UI
}

export interface AdvancedConfig {
  // Não mapeado diretamente para colunas no schema atual de 'clients'
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
  erp_config?: ERPConfig // Mapeia para erp_template_id e erp_template_name na tabela clients

  // prompt_config foi removido da tabela Client e agora temos uma tabela 'assistants'
  // A UI pode precisar de uma lista de assistentes configurados para este cliente
  assistants?: Assistant[] // Representa os assistentes associados a este cliente

  advanced_config?: AdvancedConfig // Não mapeado diretamente para colunas no schema atual

  onboarding_status: "draft" | "in_progress" | "completed" | "deployed" | "failed"
  current_step: number
  total_steps: number
  created_at: string
  updated_at: string
  deployed_at?: string
  deployment_url?: string
}

// ... (outras interfaces como OnboardingStep, DashboardMetrics permanecem as mesmas se não afetadas)
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
