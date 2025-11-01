import { Stack } from '@mui/material'
import { useCallback } from 'react'
import { parseInput, computeAddressBounds } from '../utils/input'
import { useSetAtom } from 'jotai'
import { appliedFiltersAtom, heapAllocationsAtom, pendingFiltersAtom } from '../state/atoms'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ToastContext'
import DropFile from '../components/loading/DropFile'

export default function LoadScreen() {
    const setHeap = useSetAtom(heapAllocationsAtom)
    const setApplied = useSetAtom(appliedFiltersAtom)
    const setPending = useSetAtom(pendingFiltersAtom)
    const navigate = useNavigate()
    const { show } = useToast()

    const onData = useCallback(
        (data: string) => {
            try {
                const json: unknown = JSON.parse(data)
                const normalized = parseInput(json)
                const sorted = normalized.slice().sort((a, b) => a.address - b.address)
                setHeap(sorted)
                localStorage.setItem('heapsong:lastHeap', data)
                const { min, max } = computeAddressBounds(sorted)
                // apply defaults if configured
                const defaultsRaw = localStorage.getItem('heapsong:defaults')
                let base = min,
                    end = max,
                    row = 0x1000
                if (defaultsRaw) {
                    const d = JSON.parse(defaultsRaw)
                    base = Number.isFinite(d.base) ? d.base : base
                    end = Number.isFinite(d.end) ? d.end : end
                    row = Number.isFinite(d.row) ? d.row : row
                }
                const next = { baseAddress: base, endAddress: end, rowSize: row }
                setApplied(next)
                setPending(next)
                show('Heap loaded successfully', 'success')
                navigate('/viz.html')
            } catch (e) {
                console.error(e)
                const message = e instanceof Error ? e.message : 'Invalid file'
                show(`Invalid heap file: ${message}`, 'error')
            }
        },
        [setHeap, setApplied, setPending, navigate, show]
    )

    return (
        <Stack
            alignItems="center"
            justifyContent="center"
            display="flex"
            sx={{
                width: '100vw',
            }}
        >
            <DropFile samplePath="./sample-heap.json" onData={onData} />
        </Stack>
    )
}
