import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar, NavbarLink } from "@/components/ui/navbar";

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
          <NavbarLink href="/leaderboard">leaderboard</NavbarLink>
        </Navbar>
        {children}
      </body>
    </html>
  );
}
