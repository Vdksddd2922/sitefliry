import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['500', '600'],
  style: ['normal', 'italic'],
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Estalo — Seu Wingman de Paquera com IA',
  description:
    'Envie um print ou cole uma conversa e receba sugestões de resposta perfeitas. Modos: Flerte, Sedutor, Sensual, Romântico e Safado.',
  keywords: ['paquera', 'flerte', 'IA', 'wingman', 'resposta', 'sedutor', 'flirt ai'],
  openGraph: {
    title: 'Estalo — Seu Wingman de Paquera com IA',
    description: 'Gere respostas perfeitas pra suas conversas de paquera.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        className={`${fraunces.variable} ${manrope.variable} font-sans bg-ink text-cream antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
