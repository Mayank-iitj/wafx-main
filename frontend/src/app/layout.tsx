import type { Metadata } from 'next';
import './globals.css';

const BASE_URL = 'https://wafx.mayankiitj.in';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'WAFx — AI-Powered Security Operations Platform',
    template: '%s | WAFx',
  },
  description:
    'WAFx is an AI-powered Security Operations & Threat Detection Platform. Real-time alerts, SIEM, SOAR playbooks, threat intelligence, and incident management — built for modern SOC teams.',
  keywords: [
    'wafx', 'WAFx', 'security operations platform', 'SOC platform',
    'AI SIEM', 'threat detection', 'SOAR playbooks', 'incident response',
    'threat intelligence', 'WAF security', 'cybersecurity platform',
    'mayankiitj', 'wafx security',
  ],
  authors: [{ name: 'WAFx', url: BASE_URL }],
  creator: 'WAFx',
  publisher: 'WAFx',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'WAFx',
    title: 'WAFx — AI-Powered Security Operations Platform',
    description:
      'Real-time threat detection, SOAR automation, and AI-assisted incident response. The modern SOC platform for security teams.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WAFx — AI-Powered Security Operations Platform',
    description: 'Real-time threat detection, SOAR automation, and AI-assisted incident response.',
    creator: '@wafx',
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
