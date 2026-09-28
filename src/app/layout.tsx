import React from "react";
import "./globals.css";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";

export const metadata = {
  title: "Grow Your Business & ERP Platform",
  description: "Next-generation ERP and Autonomous Multi-Agent Platform for General Contractors",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        <div className="flex h-screen overflow-hidden">
          {/* Main Navigation Sidebar */}
          <Sidebar />

          {/* Application Content Shell */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header />

            <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <div className="max-w-7xl mx-auto space-y-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
