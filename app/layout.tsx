import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Pipeelo - Painel de administração",
  description: "Painel de configuração e gerenciamento de clientes SaaS",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/*
          ATENÇÃO: O valor do 'content' desta meta tag DEVE ser preenchido dinamicamente
          pelo seu backend com o token CSRF gerado para a sessão atual.
          Um valor fixo ou ausente resultará em erro de "CSRF token mismatch".
        */}
        <meta name="csrf-token" content="SEU_TOKEN_CSRF_GERADO_PELO_BACKEND" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
