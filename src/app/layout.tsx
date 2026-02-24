import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://atulkumartiwari.dev"),
  title: "Atul Kumar Tiwari — AI-Enabled Full-Stack Developer",
  description:
    "Building Scalable GenAI & RAG Systems on Azure. Expert in LangChain, Azure OpenAI, FastAPI, and Next.js.",
  keywords: [
    "AI Developer",
    "Full-Stack Developer",
    "LangChain",
    "RAG",
    "Azure OpenAI",
    "FastAPI",
    "Next.js",
    "GenAI",
    "Atul Kumar Tiwari",
  ],
  authors: [{ name: "Atul Kumar Tiwari" }],
  openGraph: {
    title: "Atul Kumar Tiwari — AI-Enabled Full-Stack Developer",
    description: "Building Scalable GenAI & RAG Systems on Azure.",
    type: "website",
    siteName: "Atul Kumar Tiwari Portfolio",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Atul Kumar Tiwari — AI-Enabled Full-Stack Developer",
    description: "Building Scalable GenAI & RAG Systems on Azure.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}})()`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="noise-overlay" />
        {children}
      </body>
    </html>
  );
}
