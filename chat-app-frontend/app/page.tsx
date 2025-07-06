/* eslint-disable */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageCircle, Plus, Users, AlertCircle, Loader2, CheckCircle2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { RoomService } from "./service/RoomService"
import { useRouter } from "next/navigation"
import { useChatContext } from "./context/ChatContext"

interface ValidationErrors {
  name?: string
  roomId?: string
}

export default function ChatLobby() {
  const { roomId, setRoomId, name, setName, setConnected } = useChatContext()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState<"joining" | "creating" | null>(null)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [apiError, setApiError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const router = useRouter()

  // Validation functions
  const validateName = (name: string): string | null => {
    if (!name.trim()) {
      return "Name is required"
    }
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters long"
    }
    if (name.trim().length > 30) {
      return "Name must be less than 30 characters"
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(name.trim())) {
      return "Name can only contain letters, numbers, and spaces"
    }
    return null
  }

  const validateRoomId = (roomId: string): string | null => {
    if (!roomId.trim()) {
      return "Room ID is required"
    }
    if (roomId.trim().length < 3) {
      return "Room ID must be at least 3 characters long"
    }
    if (roomId.trim().length > 20) {
      return "Room ID must be less than 20 characters"
    }
    if (!/^[a-zA-Z0-9]+$/.test(roomId.trim())) {
      return "Room ID can only contain letters and numbers"
    }
    return null
  }

  const validateForm = (isJoining = false): boolean => {
    const newErrors: ValidationErrors = {}

    const nameError = validateName(name)
    if (nameError) newErrors.name = nameError

    // Only validate roomId if joining or if user has entered something for creation
    if (isJoining || roomId.trim().length > 0) {
      const roomIdError = validateRoomId(roomId)
      if (roomIdError) newErrors.roomId = roomIdError
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const clearMessages = () => {
    setApiError("")
    setSuccess("")
    setErrors({})
  }

  const handleJoinRoom = async () => {
    clearMessages()

    if (!validateForm(true)) {
      return
    }

    setIsLoading(true)
    setLoadingAction("joining")

    try {
      const response = await RoomService.joinRoom(roomId, name)
      console.log(response)

      setSuccess(`Successfully joined room ${roomId}!`)

      // Small delay to show success message
      setTimeout(() => {
        setConnected(true);
        router.push("/chat")
      }, 1500)
    } catch (error: any) {
      console.error("Join room error:", error)

      if (error.status === 404) {
        setApiError("Room doesn't exist or is no longer available. Please check the Room ID and try again.")
      } else if (error.status === 403) {
        setApiError("You don't have permission to join this room.")
      } else if (error.status === 409) {
        setApiError("You are already in this room.")
      } else {
        setApiError("Failed to join room. Please check your connection and try again.")
      }

      setIsLoading(false)
      setLoadingAction(null)
    }
  }

  const handleCreateRoom = async () => {
    clearMessages()

    if (!validateForm(false)) {
      return
    }

    setIsLoading(true)
    setLoadingAction("creating")

    try {
      let finalRoomId = roomId.trim()

      // Generate room ID if empty
      if (finalRoomId.length === 0) {
        finalRoomId = Math.random().toString(36).substring(2, 8).toLowerCase()
        setRoomId(finalRoomId)
      }

      const response = await RoomService.createRoom(finalRoomId, name);
      console.log(response)

      const responseRoomId: string = response.data.roomId
      setSuccess(`Room ${responseRoomId} created successfully!`)

      // Small delay to show success message
      setTimeout(() => {
        setConnected(true);
        router.push(`/chat`)
      }, 1500)
    } catch (error: any) {
      console.error("Create room error:", error)

      if (error.status === 400) {
        setApiError(
          "Room already exists! Please choose a different Room ID or leave it empty to generate a random one.",
        )
      } else if (error.status === 429) {
        setApiError("Too many rooms created. Please wait a moment before creating another room.")
      } else {
        setApiError("Failed to create room. Please check your connection and try again.")
      }

      setIsLoading(false)
      setLoadingAction(null)
    }
  }

  const generateRandomRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 8).toLowerCase()
    setRoomId(randomId)
    clearMessages()
  }

  const handleNameChange = (value: string) => {
    setName(value)
    if (errors.name) {
      const nameError = validateName(value)
      setErrors((prev) => ({ ...prev, name: nameError || undefined }))
    }
  }

  const handleRoomIdChange = (value: string) => {
    setRoomId(value)
    if (errors.roomId) {
      const roomIdError = validateRoomId(value)
      setErrors((prev) => ({ ...prev, roomId: roomIdError || undefined }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors duration-300">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md shadow-lg dark:shadow-gray-900/50 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-300">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center transition-colors duration-300">
            {isLoading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : success ? (
              <CheckCircle2 className="w-6 h-6 text-white" />
            ) : (
              <MessageCircle className="w-6 h-6 text-white" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">
            {isLoading
              ? loadingAction === "joining"
                ? "Joining Room..."
                : "Creating Room..."
              : success
                ? "Success!"
                : "Join Chat Room"}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
            {isLoading
              ? loadingAction === "joining"
                ? "Please wait while we connect you to the room"
                : "Please wait while we set up your new room"
              : success
                ? "Redirecting you to the chat room..."
                : "Enter your details to join or create a chat room"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Alert */}
          {apiError && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200 animate-in slide-in-from-top-2 duration-300">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300"
            >
              Your Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300 ${
                errors.name ? "border-red-500 dark:border-red-400" : ""
              }`}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-500 dark:text-red-400 animate-in slide-in-from-top-1 duration-200">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="roomId"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300"
            >
              Room ID
            </Label>
            <div className="flex gap-2">
              <Input
                id="roomId"
                type="text"
                placeholder="Leave empty to auto-generate"
                value={roomId}
                onChange={(e) => handleRoomIdChange(e.target.value)}
                className={`flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300 ${
                  errors.roomId ? "border-red-500 dark:border-red-400" : ""
                }`}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateRandomRoomId}
                disabled={isLoading}
                className="px-3 bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {errors.roomId && (
              <p className="text-sm text-red-500 dark:text-red-400 animate-in slide-in-from-top-1 duration-200">
                {errors.roomId}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
              3-20 characters, letters and numbers only. Leave empty to auto-generate.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              onClick={handleJoinRoom}
              disabled={isLoading || !name.trim() || !roomId.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white transition-all duration-300 disabled:opacity-50"
            >
              {isLoading && loadingAction === "joining" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Join Room
                </>
              )}
            </Button>

            <Button
              onClick={handleCreateRoom}
              disabled={isLoading || !name.trim()}
              variant="outline"
              className="w-full border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 bg-transparent transition-all duration-300 disabled:opacity-50"
            >
              {isLoading && loadingAction === "creating" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Room
                </>
              )}
            </Button>
          </div>

          {roomId && !errors.roomId && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors duration-300 animate-in slide-in-from-bottom-2 duration-300">
              <p className="text-sm text-blue-700 dark:text-blue-300 transition-colors duration-300">
                <strong>Room ID:</strong> {roomId}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 transition-colors duration-300">
                Share this ID with others to let them join your room
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}