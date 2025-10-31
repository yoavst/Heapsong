import { createContext, useCallback, useContext, useState } from 'react'
import { Alert, Snackbar } from '@mui/material'

type ToastSeverity = 'success' | 'info' | 'warning' | 'error'

interface ToastState {
    open: boolean
    message: string
    severity: ToastSeverity
}

const ToastCtx = createContext<{
    show: (message: string, severity?: ToastSeverity) => void
} | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<ToastState>({ open: false, message: '', severity: 'info' })
    const show = useCallback((message: string, severity: ToastSeverity = 'info') => {
        setToast({ open: true, message, severity })
    }, [])
    return (
        <ToastCtx.Provider value={{ show }}>
            {children}
            <Snackbar
                open={toast.open}
                autoHideDuration={3000}
                onClose={() => {
                    setToast((t) => ({ ...t, open: false }))
                }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={toast.severity}
                    variant="filled"
                    onClose={() => {
                        setToast((t) => ({ ...t, open: false }))
                    }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </ToastCtx.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastCtx)
    if (!ctx) throw new Error('ToastProvider is missing')
    return ctx
}
