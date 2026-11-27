import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="es" className="dark">
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
      <body className="min-h-dvh bg-obsidian-950 text-silver-100 antialiased selection:bg-white selection:text-obsidian-950">
        {children}
      </body>
    </html>
  );
}
