import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: 'NEXUS — Plataforma Educativa Híbrida (LMS + ERP Académico)',
  description:
    'Sistema Educativo Escalable de Próxima Generación: Rutas de aprendizaje DAG, ERP Académico Ponderado, Gamificación y Certificados Verificables SHA-256.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${plusJakarta.variable} ${playfair.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('unhandledrejection', function(event) {
                if (event && event.reason && (event.reason instanceof Event || Object.prototype.toString.call(event.reason) === '[object Event]')) {
                  event.preventDefault();
                  event.stopImmediatePropagation();
                }
              }, true);
            `,
          }}
        />
      </head>
      <body className="min-h-dvh bg-[#F3F5F9] text-[#090B0F] antialiased selection:bg-[#090B0F] selection:text-white">
        {children}
      </body>
    </html>
  );
}
