"use client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Settings, LogOut, DoorClosedIcon as ExitIcon, Edit, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

interface ProfileDropdownProps {
  userName: string
  onUpdateProfile?: () => void
  onExitChat?: () => void
  onLogout?: () => void
}

export function ProfileDropdown({ userName, onUpdateProfile, onExitChat, onLogout }: ProfileDropdownProps) {
  const { theme, setTheme } = useTheme()

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleThemeToggle = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
        >
          <Avatar className="h-9 w-9 border-2 border-gray-200 dark:border-gray-600">
            <AvatarFallback className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-medium">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg"
        align="end"
      >
        {/* Profile Header */}
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 border-2 border-gray-200 dark:border-gray-600">
              <AvatarFallback className="text-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-medium">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-none">{userName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-none">Online</p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-600" />

        {/* Profile Actions */}
        <DropdownMenuItem
          onClick={onUpdateProfile}
          className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200"
        >
          <Edit className="h-4 w-4" />
          <span className="text-sm">Update Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200">
          <Settings className="h-4 w-4" />
          <span className="text-sm">Settings</span>
        </DropdownMenuItem>

        {/* Theme Toggle */}
        <DropdownMenuItem
          onClick={handleThemeToggle}
          className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200"
        >
          {theme === "light" ? (
            <>
              <Moon className="h-4 w-4" />
              <span className="text-sm">Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="h-4 w-4" />
              <span className="text-sm">Light Mode</span>
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-600" />

        {/* Exit Actions */}
        <DropdownMenuItem
          onClick={onExitChat}
          className="flex items-center space-x-3 px-4 py-3 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950 cursor-pointer transition-colors duration-200"
        >
          <ExitIcon className="h-4 w-4" />
          <span className="text-sm">Exit Chat</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onLogout}
          className="flex items-center space-x-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer transition-colors duration-200"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
