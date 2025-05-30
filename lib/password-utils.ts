// Simple password utilities without external dependencies

export async function hashPassword(password: string): Promise<string> {
  // For development, we'll store passwords as plain text
  // In production, you should use a proper hashing library like bcrypt
  return password
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // For development, simple comparison
  // In production, use proper bcrypt verification
  return password === hashedPassword
}

export function validatePasswordStrength(password: string): { isValid: boolean; feedback: string[] } {
  const feedback: string[] = []
  let isValid = true

  if (password.length < 8) {
    feedback.push("Senha deve ter pelo menos 8 caracteres")
    isValid = false
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push("Senha deve conter pelo menos uma letra maiúscula")
    isValid = false
  }

  if (!/[a-z]/.test(password)) {
    feedback.push("Senha deve conter pelo menos uma letra minúscula")
    isValid = false
  }

  if (!/[0-9]/.test(password)) {
    feedback.push("Senha deve conter pelo menos um número")
    isValid = false
  }

  return { isValid, feedback }
}
