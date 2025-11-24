import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
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
                <VisualizerScreen />
            </ToastProvider>
        </ThemeProvider>
    )
}

export default App
