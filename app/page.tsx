"use client"

import { useState } from "react"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import Login from "@/components/login"
import DashboardEnhanced from "@/components/dashboard-enhanced"
import OnboardingEnhanced from "@/components/onboarding-enhanced/onboarding-enhanced"
import type { Client } from "@/types"

function AppContent() {
  const { isAuthenticated, loading } = useAuth()
  const [currentView, setCurrentView] = useState<"dashboard" | "onboarding">("dashboard")
  const [editingClient, setEditingClient] = useState<Client | undefined>()

  const handleCreateClient = () => {
    setEditingClient(undefined)
    setCurrentView("onboarding")
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setCurrentView("onboarding")
  }

  const handleOnboardingComplete = () => {
    setCurrentView("dashboard")
    setEditingClient(undefined)
  }

  const handleOnboardingCancel = () => {
    setCurrentView("dashboard")
    setEditingClient(undefined)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#01D5AC] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sistema...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  if (currentView === "onboarding") {
    return (
      <OnboardingEnhanced
        onComplete={handleOnboardingComplete}
        onCancel={handleOnboardingCancel}
        editingClient={editingClient}
      />
    )
  }

  return (
    <DashboardEnhanced 
      onCreateClient={handleCreateClient} 
      onEditClient={handleEditClient} 
    />
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
