import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'
import { useAtom, useSetAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { appliedFiltersAtom, heapAllocationsRangeAtom, highlightAtom } from '../../state/atoms'
import { formatHex } from '../../utils/formatting'
import HexInput from '../HexInput'
import { useToast } from '../ToastContext'

export default function GotoDialog() {
    const [open, setOpen] = useState(false)
    const [input, setInput] = useState<number | null>(null)
    const [appliedFilters] = useAtom(appliedFiltersAtom)
    const [heapAllocationsRange] = useAtom(heapAllocationsRangeAtom)
    const setHighlight = useSetAtom(highlightAtom)
    const { show } = useToast()

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'g') {
                setOpen(true)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => {
            window.removeEventListener('keydown', onKey)
        }
    }, [])

    const apply = useCallback(() => {
        if (input == null) {
            setOpen(false)
            return
        }
        if (
            (appliedFilters.baseAddress != null && input < appliedFilters.baseAddress) ||
            (heapAllocationsRange != null && input < heapAllocationsRange[0])
        ) {
            const base = appliedFilters.baseAddress ?? heapAllocationsRange?.[0] ?? 0
            show(`Address ${formatHex(input)} is below base ${formatHex(base)}`, 'warning')
            return
        }
        if (
            (appliedFilters.endAddress != null && input >= appliedFilters.endAddress) ||
            (heapAllocationsRange != null && input >= heapAllocationsRange[1])
        ) {
            const end = appliedFilters.endAddress ?? heapAllocationsRange?.[1] ?? 0
            show(`Address ${formatHex(input)} is above end ${formatHex(end)}`, 'warning')
            return
        }

        setHighlight(input)
        setOpen(false)
        setInput(null)
    }, [appliedFilters, heapAllocationsRange, input, setHighlight, show])

    return (
        <Dialog
            open={open}
            onClose={() => {
                setOpen(false)
            }}
        >
            <DialogTitle>Go to address</DialogTitle>
            <DialogContent>
                <HexInput
                    label=""
                    setValue={setInput}
                    apply={apply}
                    highlightEdit={false}
                    autoFocus
                />
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        setOpen(false)
                    }}
                >
                    Cancel
                </Button>
                <Button variant="contained" onClick={apply}>
                    Go
                </Button>
            </DialogActions>
        </Dialog>
    )
}
