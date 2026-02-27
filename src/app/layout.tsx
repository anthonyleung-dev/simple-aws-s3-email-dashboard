// Root layout wrapping all pages with global providers and styles
import type { Metadata } from 'next'

import { EmailProvider } from '@/context/EmailContext'
import { ToastProvider } from '@/ui/toast/ToastProvider'

import './globals.scss'

export const metadata: Metadata = {
    title: 'S3 Email Dashboard',
    description: 'Browse and manage emails stored in Amazon S3',
}

// Wrap children with EmailProvider for state management and ToastProvider for notifications
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body>
                <EmailProvider>
                    <ToastProvider>
                        <main className="container">{children}</main>
                    </ToastProvider>
                </EmailProvider>
            </body>
        </html>
    )
}
