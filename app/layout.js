import './globals.css'

export const metadata = {
  title: 'Event Manager - WhatsApp Integration',
  description: 'Event management system with WhatsApp integration via Evolution API',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}