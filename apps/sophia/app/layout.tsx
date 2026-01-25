import type { Metadata } from "next";
import { AuthProvider } from "@lib/contexts/AuthContext";
import "@styles/globals.css";

export const metadata: Metadata = {
  title: "Sophia - Demiurge Portal",
  description: "Next-generation mainnet experience. Immerse yourself in the Demiurge ecosystem.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className="bg-navy-900 text-white antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
