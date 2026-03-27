import { Navbar, NavbarLink } from "@/components/ui/navbar";
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { FaCrown } from "react-icons/fa";
import "./globals.css";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "DevRoast",
  description: "DevRoast app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={jetBrainsMono.variable}>
      <body className="bg-bg-page text-text-primary antialiased">
        <Navbar>
          <NavbarLink href="/leaderboard">
            <FaCrown className="rotate-icon" /> leaderboard
          </NavbarLink>
        </Navbar>
        {children}
      </body>
    </html>
  );
}
