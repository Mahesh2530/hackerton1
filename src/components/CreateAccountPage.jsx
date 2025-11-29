"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { BookOpen, ArrowLeft } from "lucide-react"
import { addUser, getUserByEmail } from "../utils/indexeddb"

export function CreateAccountPage({ onSignUp, onBackToLogin }) {
  const [userType, setUserType] = useState(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [institution, setInstitution] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [nameError, setNameError] = useState("")
  const [phoneError, setPhoneError] = useState("")

  const handleNameChange = (e) => {
    const value = e.target.value
    // Only allow alphabets and spaces
    const alphabetOnly = /^[a-zA-Z\s]*$/
    
    if (alphabetOnly.test(value) || value === "") {
      setName(value)
      setNameError("")
    } else {
      setNameError("Name can only contain letters and spaces")
    }
  }

  const handlePhoneChange = (e) => {
    const value = e.target.value
    // Only allow numbers and limit to 10 digits
    const numbersOnly = /^[0-9]*$/
    
    if (numbersOnly.test(value)) {
      if (value.length <= 10) {
        setPhoneNumber(value)
        if (value.length === 10) {
          setPhoneError("")
        } else if (value.length > 0) {
          setPhoneError("Phone number must be exactly 10 digits")
        } else {
          setPhoneError("")
        }
      }
    } else {
      setPhoneError("Phone number can only contain numbers")
    }
  }

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !institution.trim() || !phoneNumber.trim()) {
      alert("Please fill all fields")
      return
    }

    // Validate email contains @ character
    if (!email.includes('@')) {
      alert("Email must contain @ character")
      return
    }

    // Validate name contains only alphabets
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      alert("Name can only contain letters and spaces")
      return
    }

    // Validate phone number is exactly 10 digits
    if (phoneNumber.length !== 10 || !/^[0-9]{10}$/.test(phoneNumber)) {
      alert("Phone number must be exactly 10 digits")
      return
    }

    // Validate password has at least 1 character
    if (password.length < 1) {
      alert("Password must contain at least 1 character")
      return
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match")
      return
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    try {
      const existingUser = await getUserByEmail(email)
      if (existingUser) {
        alert("Email already registered. Please use a different email or login.")
        return
      }

      const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        role: userType,
        institution,
        phoneNumber,
        createdAt: new Date().toISOString(),
        isBlocked: false,
        oneStarCount: 0,
      }

      await addUser(newUser)
      console.log("[v0] New account created:", newUser)
      alert("Account created successfully! You can now login.")
      onSignUp(userType, name, email)
    } catch (error) {
      console.error("[v0] Sign up error:", error)
      alert("Error creating account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-black to-yellow-600 flex items-center justify-center p-4 animate-[fadeIn_0.5s_ease-out]">
      <Card className="w-full max-w-md shadow-2xl border-4 border-yellow-400 animate-[scaleIn_0.6s_ease-out] hover:scale-105 transition-transform duration-300">
        <CardHeader className="space-y-2 text-center bg-gradient-to-r from-yellow-500 via-black to-yellow-500">
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-400 p-3 rounded-lg shadow-lg animate-[bounce_2s_ease-in-out_infinite] hover:rotate-12 transition-transform duration-300">
              <BookOpen className="w-8 h-8 text-black" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-yellow-100">Create Account</CardTitle>
          <CardDescription className="text-yellow-200 font-semibold">Join Edulibrary Today</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-8 bg-gradient-to-b from-black to-yellow-900">
          {!userType ? (
            <div className="space-y-3">
              <p className="text-sm font-bold text-center text-yellow-200 animate-[fadeIn_0.8s_ease-out]">Sign up as:</p>
              <Button
                onClick={() => setUserType("admin")}
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-base h-12 shadow-lg transform hover:scale-110 hover:shadow-2xl transition-all duration-300 animate-[slideInLeft_1s_ease-out] disabled:opacity-50"
                size="lg"
              >
                Admin
              </Button>
              <Button
                onClick={() => setUserType("student")}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-base h-12 shadow-lg transform hover:scale-105 transition disabled:opacity-50"
                size="lg"
              >
                Student
              </Button>
              <Button
                onClick={onBackToLogin}
                disabled={loading}
                className="w-full border-2 border-yellow-400 text-yellow-300 hover:bg-yellow-950 font-bold text-base h-12 shadow-lg transform hover:scale-105 transition flex items-center justify-center gap-2 bg-black disabled:opacity-50"
                size="lg"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4 p-3 bg-yellow-500 rounded-lg border-2 border-yellow-300">
                <p className="text-sm font-bold text-black">
                  Signing up as:{" "}
                  <span className="capitalize font-bold">{userType === "admin" ? "Administrator" : "Student"}</span>
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUserType(null)}
                  disabled={loading}
                  className="text-black hover:text-red-700 font-bold"
                >
                  Change
                </Button>
              </div>

              <div>
                <Input
                  placeholder="Full Name (letters only)"
                  value={name}
                  onChange={handleNameChange}
                  disabled={loading}
                  className="border-2 border-yellow-400 focus:border-yellow-300 font-semibold bg-black text-yellow-100 placeholder-yellow-600"
                />
                {nameError && <p className="text-red-400 text-xs mt-1 font-semibold">{nameError}</p>}
              </div>
              <Input
                placeholder="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="border-2 border-yellow-400 focus:border-yellow-300 font-semibold bg-black text-yellow-100 placeholder-yellow-600"
              />
              <Input
                placeholder="Institution/Organization"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                disabled={loading}
                className="border-2 border-yellow-400 focus:border-yellow-300 font-semibold bg-black text-yellow-100 placeholder-yellow-600"
              />
              <div>
                <Input
                  placeholder="Phone Number (10 digits)"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  disabled={loading}
                  maxLength={10}
                  className="border-2 border-yellow-400 focus:border-yellow-300 font-semibold bg-black text-yellow-100 placeholder-yellow-600"
                />
                {phoneError && <p className="text-red-400 text-xs mt-1 font-semibold">{phoneError}</p>}
              </div>
              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="border-2 border-yellow-400 focus:border-yellow-300 font-semibold bg-black text-yellow-100 placeholder-yellow-600"
              />
              <Input
                placeholder="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="border-2 border-yellow-400 focus:border-yellow-300 font-semibold bg-black text-yellow-100 placeholder-yellow-600"
              />

              <div className="bg-yellow-900 border-2 border-yellow-400 rounded-lg p-4 text-sm text-yellow-100 font-semibold shadow-md">
                <p className="font-bold mb-2 text-yellow-300">Password Requirements:</p>
                <p>• Minimum 6 characters</p>
                <p>• Must match confirmation password</p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSignUp}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold text-base h-12 shadow-lg disabled:opacity-50"
                  size="lg"
                >
                  {loading ? "Creating..." : "Create Account"}
                </Button>
                <Button
                  onClick={() => setUserType(null)}
                  disabled={loading}
                  className="flex-1 border-2 border-yellow-400 text-yellow-300 hover:bg-yellow-950 font-bold bg-black disabled:opacity-50"
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
