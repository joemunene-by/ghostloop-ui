import type { Metadata } from "next"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { DemoBanner } from "@/components/demo-banner"

export const metadata: Metadata = {
  title: "ghostloop · control",
  description:
    "Web dashboard for ghostloop — fleet view, mission control, trace timeline, alarm tray.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DemoBanner />
          <main className="flex-1 px-8 py-6 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  )
}
