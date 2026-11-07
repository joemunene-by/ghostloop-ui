import type { Metadata, Viewport } from "next"
import { JetBrains_Mono, Schibsted_Grotesk } from "next/font/google"
import "./globals.css"
import { Footer, TopBar } from "@/components/topbar"
import { DemoBanner } from "@/components/demo-banner"

const sans = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-schibsted",
  display: "swap",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ghostloop · control",
  description:
    "Web dashboard for ghostloop: fleet timeline, alarm log, recorded traces and metrics.",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EDEEEB" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0C0D" },
  ],
}

// runs before paint so a stored theme never flashes the other one
const THEME_SCRIPT = `try{var t=localStorage.getItem("ghostloop_theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <TopBar />
        <DemoBanner />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-16 pt-8 sm:px-6 sm:pt-12 xl:px-10">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
