import "@/styles/globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

export const metadata = {
  title: "Terry Harris - YouTube Shorts Automation Platform",
  description: "End-to-end automated YouTube Shorts generation pipeline for the Minecraft niche.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          {/* Fixed Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div style={{ flex: 1, marginLeft: "260px", display: "flex", flexDirection: "column" }}>
            <Navbar />
            <main style={{ flex: 1, padding: "32px", maxWidth: "1400px", width: "100%", margin: "0 auto" }}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
