export const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/\D/g, "")
  return cleanCNPJ.length === 14
}

export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, "")
  return cleanCPF.length === 11
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateCEP = (cep: string): boolean => {
  const cleanCEP = cep.replace(/\D/g, "")
  return cleanCEP.length === 8
}

export const formatCNPJ = (value: string): string => {
  const cleanValue = value.replace(/\D/g, "")
  return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
}

export const formatCPF = (value: string): string => {
  const cleanValue = value.replace(/\D/g, "")
  return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

export const formatCEP = (value: string): string => {
  const cleanValue = value.replace(/\D/g, "")
  return cleanValue.replace(/(\d{5})(\d{3})/, "$1-$2")
}
