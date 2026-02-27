// Email body renderer with HTML iframe and plain text toggle
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

import { Button } from '@/ui/button/Button'

import styles from './EmailBody.module.scss'

interface EmailBodyProps {
    htmlBody: string
    textBody: string
}

// Render email body content in a sandboxed iframe (HTML) or pre-formatted block (text)
export function EmailBody({ htmlBody, textBody }: EmailBodyProps) {
    const [showHtml, setShowHtml] = useState(!!htmlBody)
    const iframeRef = useRef<HTMLIFrameElement>(null)

    // Auto-resize iframe to fit its content
    const resizeIframe = useCallback(() => {
        const iframe = iframeRef.current
        if (!iframe?.contentDocument?.body) {
            return
        }
        iframe.style.height = `${iframe.contentDocument.body.scrollHeight + 20}px`
    }, [])

    useEffect(() => {
        const iframe = iframeRef.current
        if (!iframe || !showHtml) {
            return
        }

        iframe.addEventListener('load', resizeIframe)

        return () => {
            iframe.removeEventListener('load', resizeIframe)
        }
    }, [showHtml, resizeIframe])

    const hasHtml = !!htmlBody
    const hasText = !!textBody
    const hasBoth = hasHtml && hasText

    return (
        <div className={styles.body}>
            {hasBoth && (
                <div className={styles.toggle}>
                    <Button
                        variant={showHtml ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setShowHtml(true)}
                    >
                        HTML
                    </Button>
                    <Button
                        variant={!showHtml ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setShowHtml(false)}
                    >
                        Text
                    </Button>
                </div>
            )}

            {showHtml && hasHtml ? (
                <iframe
                    ref={iframeRef}
                    className={styles.iframe}
                    srcDoc={htmlBody}
                    sandbox="allow-popups"
                    title="Email content"
                />
            ) : (
                <pre className={styles.textBody}>{textBody || 'No content available'}</pre>
            )}
        </div>
    )
}
