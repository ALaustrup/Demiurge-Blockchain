import type { Metadata } from "next";
import ThemeRegistry from './ThemeRegistry';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Chatbot from '../components/Chatbot';
import { Box } from "@mui/material";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Showcase Website",
  description: "A beautiful website with AI integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <Box component="main" sx={{ flexGrow: 1 }}>
              {children}
            </Box>
            <Footer />
          </Box>
          <Chatbot />
        </ThemeRegistry>
      </body>
    </html>
  );
}
