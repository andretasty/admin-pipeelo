import bcrypt from "bcryptjs"

/**
 * Hash a password using bcrypt with salt rounds
 * @param password - Plain text password
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12 // Higher number = more secure but slower
  return await bcrypt.hash(password, saltRounds)
}

/**
 * Verify a password against its hash
 * @param password - Plain text password
 * @param hash - Stored hash
 * @returns Promise<boolean> - True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    console.error("Error verifying password:", error)
    return false
  }
}

/**
 * Check if a hash needs to be rehashed (for security upgrades)
 * @param hash - Current hash
 * @param saltRounds - Desired salt rounds
 * @returns boolean - True if rehashing is needed
 */
export function needsRehash(hash: string, saltRounds = 12): boolean {
  try {
    return bcrypt.getRounds(hash) < saltRounds
  } catch (error) {
    // If we can't get rounds, assume it needs rehashing
    return true
  }
}

/**
 * Generate a secure random password
 * @param length - Password length (default: 16)
 * @returns string - Random password
 */
export function generateSecurePassword(length = 16): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""

  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }

  return password
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns object - Validation result with score and feedback
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length < 8) {
    feedback.push("Senha deve ter pelo menos 8 caracteres")
  } else if (password.length >= 12) {
    score += 2
  } else {
    score += 1
  }

  if (!/[a-z]/.test(password)) {
    feedback.push("Senha deve conter pelo menos uma letra minúscula")
  } else {
    score += 1
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push("Senha deve conter pelo menos uma letra maiúscula")
  } else {
    score += 1
  }

  if (!/\d/.test(password)) {
    feedback.push("Senha deve conter pelo menos um número")
  } else {
    score += 1
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    feedback.push("Senha deve conter pelo menos um caractere especial")
  } else {
    score += 1
  }

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    feedback.push("Evite repetir o mesmo caractere consecutivamente")
    score -= 1
  }

  if (/123|abc|qwe|password|admin/i.test(password)) {
    feedback.push("Evite sequências óbvias ou palavras comuns")
    score -= 1
  }

  const isValid = feedback.length === 0 && score >= 4

  return {
    isValid,
    score: Math.max(0, score),
    feedback,
  }
}
