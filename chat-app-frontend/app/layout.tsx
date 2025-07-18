import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ChatProvider } from "./context/ChatContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Chat Application",
  description: "Real-time chat application with dark mode support",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <ChatProvider>
          {children}
        </ChatProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
