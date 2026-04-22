"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scriptProps={{ suppressHydrationWarning: true } as any}
    >
      {children}
    </NextThemesProvider>
  )
}
