import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { useCallback, useRef, useState } from 'react'
import { normalizeAllocations, computeAddressBounds } from '../utils/parse'
import { useSetAtom } from 'jotai'
import { appliedFiltersAtom, heapAllocationsAtom, pendingFiltersAtom } from '../state/atoms'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ToastContext'

export default function LoadScreen() {
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const setHeap = useSetAtom(heapAllocationsAtom)
    const setApplied = useSetAtom(appliedFiltersAtom)
    const setPending = useSetAtom(pendingFiltersAtom)
    const navigate = useNavigate()
    const { show } = useToast()
    const [dragOver, setDragOver] = useState(false)

    const onFiles = useCallback(
        async (files: FileList | null) => {
            if (!files || files.length === 0) return
            const file = files[0]
            try {
                const text = await file.text()
                const json = JSON.parse(text)
                const entries = Array.isArray(json) ? json : json.entries
                const normalized = normalizeAllocations(entries)
                const sorted = normalized.slice().sort((a, b) => a.address - b.address)
                setHeap(sorted)
                // persist last heap
                try {
                    localStorage.setItem('heapsong:lastHeap', JSON.stringify(entries))
                } catch {}
                const { min, max } = computeAddressBounds(sorted)
                // apply defaults if configured
                const defaultsRaw = localStorage.getItem('heapsong:defaults')
                let base = min,
                    end = max,
                    row = 0x1000
                if (defaultsRaw) {
                    try {
                        const d = JSON.parse(defaultsRaw)
                        base = Number.isFinite(d.base) ? d.base : base
                        end = Number.isFinite(d.end) ? d.end : end
                        row = Number.isFinite(d.row) ? d.row : row
                    } catch {}
                }
                const next = { baseAddress: base, endAddress: end, rowSize: row }
                setApplied(next)
                setPending(next)
                show('Heap loaded successfully', 'success')
                navigate('/viz.html')
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Invalid file'
                show(`Invalid heap file: ${message}`, 'error')
            }
        },
        [setHeap, setApplied, setPending, navigate, show]
    )

    const loadSample = useCallback(async () => {
        try {
            const res = await fetch('./sample-heap.json')
            const json = await res.json()
            const entries = Array.isArray(json) ? json : json.entries
            const normalized = normalizeAllocations(entries)
            const sorted = normalized.slice().sort((a, b) => a.address - b.address)
            setHeap(sorted)
            try {
                localStorage.setItem('heapsong:lastHeap', JSON.stringify(entries))
            } catch {}
            const { min, max } = computeAddressBounds(sorted)
            // defaults from localStorage
            const defaultsRaw = localStorage.getItem('heapsong:defaults')
            let base = min,
                end = max,
                row = 0x1000
            if (defaultsRaw) {
                try {
                    const d = JSON.parse(defaultsRaw)
                    base = Number.isFinite(d.base) ? d.base : base
                    end = Number.isFinite(d.end) ? d.end : end
                    row = Number.isFinite(d.row) ? d.row : row
                } catch {}
            }
            const next = { baseAddress: base, endAddress: end, rowSize: row }
            setApplied(next)
            setPending(next)
            show('Loaded sample heap', 'success')
            navigate('/viz.html')
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to load sample'
            show(message, 'error')
        }
    }, [navigate, setApplied, setHeap, setPending, show])

    return (
        <Stack
            sx={{
                height: '100vh',
                width: '100vw',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
            }}
        >
            <Paper
                elevation={dragOver ? 8 : 2}
                sx={{
                    width: 520,
                    height: 280,
                    borderRadius: 3,
                    border: (theme) =>
                        `2px dashed ${dragOver ? theme.palette.primary.main : theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    px: 4,
                    textAlign: 'center',
                }}
                onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                }}
                onDragLeave={() => {
                    setDragOver(false)
                }}
                onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                    onFiles(e.dataTransfer.files)
                }}
                // Remove click-to-open to avoid reopening after file selection
            >
                <CloudUploadIcon color={dragOver ? 'primary' : 'disabled'} sx={{ fontSize: 56 }} />
                <Box>
                    <Typography variant="h5" fontWeight={600} gutterBottom>
                        Load heap dump
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Drag & drop a JSON file here, or click to browse
                    </Typography>
                    <Box mt={2} sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button variant="contained" onClick={() => fileInputRef.current?.click()}>
                            Choose File
                        </Button>
                        <Button variant="outlined" onClick={loadSample}>
                            Load Sample
                        </Button>
                    </Box>
                </Box>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        onFiles(e.currentTarget.files)
                        // Reset input so selecting the same file again still triggers onChange
                        if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                />
            </Paper>
        </Stack>
    )
}
