import { validatePromptTemplateExists, validateERPTemplateExists } from "./database"

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export async function validatePromptConfiguration(promptConfig: any): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  }

  if (!promptConfig) {
    result.errors.push("Configuração de prompt é obrigatória")
    result.isValid = false
    return result
  }

  if (!promptConfig.template_id) {
    result.errors.push("ID do template de prompt é obrigatório")
    result.isValid = false
    return result
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(promptConfig.template_id)) {
    result.errors.push("ID do template de prompt deve ser um UUID válido")
    result.isValid = false
    return result
  }

  // Validate template exists in database
  const templateExists = await validatePromptTemplateExists(promptConfig.template_id)
  if (!templateExists) {
    result.errors.push(`Template de prompt não encontrado: ${promptConfig.template_id}`)
    result.isValid = false
    return result
  }

  // Validate required fields
  if (!promptConfig.template_name) {
    result.warnings.push("Nome do template não informado")
  }

  if (!promptConfig.final_content) {
    result.warnings.push("Conteúdo final do prompt não gerado")
  }

  return result
}

export async function validateERPConfiguration(erpConfig: any): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  }

  if (!erpConfig) {
    result.warnings.push("Configuração de ERP não fornecida (opcional)")
    return result
  }

  if (!erpConfig.template_id) {
    result.errors.push("ID do template de ERP é obrigatório quando ERP é configurado")
    result.isValid = false
    return result
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(erpConfig.template_id)) {
    result.errors.push("ID do template de ERP deve ser um UUID válido")
    result.isValid = false
    return result
  }

  // Validate template exists in database
  const templateExists = await validateERPTemplateExists(erpConfig.template_id)
  if (!templateExists) {
    result.errors.push(`Template de ERP não encontrado: ${erpConfig.template_id}`)
    result.isValid = false
    return result
  }

  // Validate required fields
  if (!erpConfig.template_name) {
    result.warnings.push("Nome do template ERP não informado")
  }

  if (!erpConfig.enabled_commands || erpConfig.enabled_commands.length === 0) {
    result.warnings.push("Nenhum comando ERP habilitado")
  }

  return result
}

export function validateClientData(client: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  }

  // Validate tenant data
  if (!client.tenant?.name) {
    result.errors.push("Nome da empresa é obrigatório")
    result.isValid = false
  }

  if (!client.tenant?.document) {
    result.errors.push("CNPJ da empresa é obrigatório")
    result.isValid = false
  }

  if (!client.tenant?.email) {
    result.errors.push("Email da empresa é obrigatório")
    result.isValid = false
  }

  // Validate admin user
  if (!client.admin_user?.name) {
    result.errors.push("Nome do usuário administrador é obrigatório")
    result.isValid = false
  }

  if (!client.admin_user?.email) {
    result.errors.push("Email do usuário administrador é obrigatório")
    result.isValid = false
  }

  if (!client.admin_user?.password) {
    result.errors.push("Senha do usuário administrador é obrigatória")
    result.isValid = false
  }

  // Validate API config
  if (!client.api_config?.openai_key && !client.api_config?.openrouter_key) {
    result.errors.push("Pelo menos uma chave de API deve ser configurada")
    result.isValid = false
  }

  return result
}
