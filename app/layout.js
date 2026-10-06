import './globals.css';
import Header from '@/components/Header';

export const metadata = {
  title: 'Centro Cristiano para las Naciones',
  description: 'Plataforma de registro y seguimiento de la iglesia Centro Cristiano para las Naciones.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
