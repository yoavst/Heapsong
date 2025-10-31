import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import LoadScreen from './screens/LoadScreen'
import VisualizerScreen from './screens/VisualizerScreen'
import { ToastProvider } from './components/ToastContext'
import { useEffect } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { appliedFiltersAtom, pendingFiltersAtom, collapseEmptyRowsAtom } from './state/atoms'

function App() {
    const theme = createTheme({
        palette: {
            mode: 'dark',
            primary: { main: '#7c4dff' },
        },
        shape: { borderRadius: 10 },
    })

    const setCollapse = useSetAtom(collapseEmptyRowsAtom)
    const [appliedFilters, setAppliedFilters] = useAtom(appliedFiltersAtom)
    const setPendingFilters = useSetAtom(pendingFiltersAtom)
    useEffect(() => {
        try {
            const saved = localStorage.getItem('heapo:collapse')
            if (saved) {
                const parsed = JSON.parse(saved)
                if (parsed && typeof parsed === 'object') {
                    setCollapse({
                        enabled: !!parsed.enabled,
                        threshold: Math.max(1, Number(parsed.threshold) || 1),
                    })
                }
            }
        } catch {}
    }, [setCollapse])

    // Hydrate default row size into filters, so TopBar shows the saved default after refresh
    useEffect(() => {
        try {
            const savedDefaults = localStorage.getItem('heapo:defaults')
            if (savedDefaults) {
                const d = JSON.parse(savedDefaults)
                const row = Number.isFinite(d?.row) ? Number(d.row) : null
                if (row && row > 0 && appliedFilters.rowSize !== row) {
                    const next = { ...appliedFilters, rowSize: row }
                    setAppliedFilters(next)
                    setPendingFilters(next)
                }
            }
        } catch {}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <ToastProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<LoadScreen />} />
                        <Route path="/viz" element={<VisualizerScreen />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </ToastProvider>
        </ThemeProvider>
    )
}

export default App
