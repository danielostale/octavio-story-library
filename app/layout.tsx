import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Octavio Story Library",
  description: "A private family story library that grows with Octavio.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
