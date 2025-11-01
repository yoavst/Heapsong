import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import LoadScreen from './screens/LoadScreen'
import VisualizerScreen from './screens/VisualizerScreen'
import { ToastProvider } from './components/ToastContext'

function App() {
    const theme = createTheme({
        palette: {
            mode: 'dark',
            primary: { main: '#7c4dff' },
        },
        shape: { borderRadius: 10 },
    })

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <ToastProvider>
                <BrowserRouter basename="/Heapsong/">
                    <Routes>
                        <Route path="/" element={<LoadScreen />} />
                        <Route path="/viz.html" element={<VisualizerScreen />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </ToastProvider>
        </ThemeProvider>
    )
}

export default App
