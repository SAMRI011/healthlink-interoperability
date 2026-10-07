import './globals.css';

export const metadata = {
  title: 'HealthLink Interoperability Prototype',
  description: 'Synthetic digital-health interoperability learning prototype.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
