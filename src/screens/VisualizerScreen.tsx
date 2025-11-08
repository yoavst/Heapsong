import { Box } from '@mui/material'
import TopBar from '../components/TopBar'
import Sidebar from '../components/sidebar/Sidebar'
import { useAtom } from 'jotai'
import { heapAllocationsAtom, sidebarWidthAtom } from '../state/atoms'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GotoDialog from '../components/visualizer/GotoDialog'
import Visualization from '../components/visualizer/Visualization'

export default function VisualizerScreen() {
    const [heap] = useAtom(heapAllocationsAtom)

    const [sidebarWidth, setSidebarWidth] = useAtom(sidebarWidthAtom)
    const [dragging, setDragging] = useState(false)
    const dividerRef = useRef<HTMLDivElement | null>(null)

    const navigate = useNavigate()
    useEffect(() => {
        function onMove(e: MouseEvent) {
            if (!dragging) return
            e.preventDefault()
            setSidebarWidth(Math.max(260, Math.min(640, window.innerWidth - e.clientX)))
        }
        function onUp() {
            setDragging(false)
        }
        if (dragging) {
            // Prevent text selection during drag
            document.body.style.userSelect = 'none'
            window.addEventListener('mousemove', onMove)
            window.addEventListener('mouseup', onUp)
        }
        return () => {
            // Restore text selection when done dragging
            document.body.style.userSelect = ''
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
    }, [dragging, setSidebarWidth])

    if (!heap) {
        void navigate('/')
        return
    }

    return (
        <Box sx={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
            <TopBar />
            <Box
                sx={{
                    flex: 1,
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: `1fr 6px ${sidebarWidth}px`,
                    minHeight: 0,
                }}
            >
                <Visualization />
                <Box
                    ref={dividerRef}
                    onMouseDown={(e) => {
                        e.preventDefault()
                        setDragging(true)
                    }}
                    sx={{ cursor: 'col-resize', bgcolor: dragging ? 'primary.main' : 'divider' }}
                />
                <Box sx={{ borderLeft: 1, borderColor: 'divider', minWidth: 240 }}>
                    <Sidebar />
                </Box>
            </Box>
            <GotoDialog />
        </Box>
    )
}
