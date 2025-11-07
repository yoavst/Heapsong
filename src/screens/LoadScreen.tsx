import { Stack } from '@mui/material'
import { useCallback } from 'react'
import parseInput from '../utils/input'
import { useSetAtom } from 'jotai'
import { heapAllocationsAtom } from '../state/atoms'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ToastContext'
import DropFile from '../components/DropFile'
import { compare } from '../utils/bigint'

export default function LoadScreen() {
    const setHeap = useSetAtom(heapAllocationsAtom)
    const navigate = useNavigate()
    const { show } = useToast()

    const onData = useCallback(
        (data: string) => {
            try {
                const json: unknown = JSON.parse(data)
                const normalized = parseInput(json)
                const sorted = normalized.slice().sort((a, b) => compare(a.address, b.address))
                setHeap(sorted)
                show('Heap loaded successfully', 'success')
                void navigate('/viz.html')
            } catch (e) {
                console.error(e)
                const message = e instanceof Error ? e.message : 'Invalid file'
                show(`Invalid heap file: ${message}`, 'error')
            }
        },
        [setHeap, navigate, show]
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
