"use client"

import { useState } from "react"
import { ThemeProvider } from "./components/theme-provider"
import { LoginPage } from "./components/LoginPage"
import { CreateAccountPage } from "./components/CreateAccountPage"
import { HomePage } from "./components/HomePage"
import { AdminDashboard } from "./components/AdminDashboard"
import { StudentDashboard } from "./components/StudentDashboard"

export default function App() {
  const [showHome, setShowHome] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [userName, setUserName] = useState("")
  const [showCreateAccount, setShowCreateAccount] = useState(false)

  const handleGetStarted = () => {
    setShowHome(false)
  }

  const handleLogin = (role, name) => {
    setUserRole(role)
    setUserName(name)
    setIsLoggedIn(true)
  }

  const handleSignUp = (role, name, email) => {
    console.log("[v0] New account created:", { role, name, email })
    handleLogin(role, name)
    setShowCreateAccount(false)
  }

  const handleBack = () => {
    setShowHome(true)
    setIsLoggedIn(false)
    setUserRole(null)
    setShowCreateAccount(false)
  }

  const handleLogout = () => {
    setShowHome(false)
    setIsLoggedIn(false)
    setUserRole(null)
    setUserName("")
    setShowCreateAccount(false)
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div>
        {showHome ? (
          <HomePage onGetStarted={handleGetStarted} />
        ) : !isLoggedIn ? (
          showCreateAccount ? (
            <CreateAccountPage onSignUp={handleSignUp} onBackToLogin={() => setShowCreateAccount(false)} />
          ) : (
            <LoginPage onLogin={handleLogin} onCreateAccount={() => setShowCreateAccount(true)} />
          )
        ) : userRole === "admin" ? (
          <AdminDashboard userName={userName} onBack={handleBack} onLogout={handleLogout} />
        ) : userRole === "student" ? (
          <StudentDashboard userName={userName} onBack={handleBack} onLogout={handleLogout} />
        ) : (
          <HomePage onGetStarted={handleGetStarted} />
        )}
      </div>
    </ThemeProvider>
  )
}
