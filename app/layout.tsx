import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import DragonAnimation from './components/DragonAnimation'
import RocketLaunch from './components/RocketLaunch'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Skillsnap: A Groq-Powered Career Builder',
  description: 'Build your career with AI-powered learning and guidance',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RocketLaunch />
        {children}
        <DragonAnimation />
      </body>
    </html>
  )
} 