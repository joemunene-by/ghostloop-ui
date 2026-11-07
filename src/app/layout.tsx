import type { Metadata, Viewport } from "next"
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google"
import "./globals.css"
import { MobileNav, Sidebar } from "@/components/sidebar"
import { DemoBanner } from "@/components/demo-banner"

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
})

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ghostloop · control",
  description:
    "Web dashboard for ghostloop: fleet view, mission control, trace timeline, alarm tray.",
}

export const viewport: Viewport = {
  themeColor: "#0E0F12",
  colorScheme: "dark",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav />
          <DemoBanner />
          <main className="w-full max-w-[1200px] flex-1 px-4 pb-16 pt-6 sm:px-8 sm:pt-8">{children}</main>
        </div>
      </body>
    </html>
  )
}
