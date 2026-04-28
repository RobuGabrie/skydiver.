import type { Metadata } from "next"
import "./globals.css"
import "leaflet/dist/leaflet.css"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { MockModeProvider } from "@/lib/mock-context"
import { SkydiversProvider } from "@/lib/skydivers-context"

export const metadata: Metadata = {
  title: "Skydiver Monitor",
  description: "Real-time skydiver monitoring and AI safety analytics",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning />
      <body className="min-h-full bg-background">
        <ThemeProvider>
          <MockModeProvider>
            <SkydiversProvider>
            <TooltipProvider>
              {/* Desktop: sidebar + main */}
              <div className="hidden lg:flex h-screen overflow-hidden">
                <AppSidebar />
                <main className="flex-1 overflow-auto">
                  {children}
                </main>
              </div>

              {/* Mobile: full-width content + bottom nav */}
              <div className="flex lg:hidden flex-col min-h-screen">
                <main className="flex-1 overflow-auto pb-20">
                  {children}
                </main>
                <BottomNav />
              </div>
            </TooltipProvider>
            </SkydiversProvider>
          </MockModeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
