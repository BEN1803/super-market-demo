import { Geist } from "next/font/google";
import AppShell from "../components/app-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Harvest & Co. — Supermarket Manager",
  description:
    "A supermarket management demo with inventory, sales, purchases, and analytics — stored locally in your browser.",
};

export const viewport = {
  themeColor: "#f5efe4",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
