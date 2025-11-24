import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'
import { useAtom } from 'jotai'
import { useCallback, useState, useMemo } from 'react'
import { formatHex } from '../../utils/formatting'
import HexInput from '../HexInput'
import { useToast } from '../ToastContext'
import { useHotkeys } from 'react-hotkeys-hook'
import { NormalizedAllocation, AppliedFilters } from '../../types'
import { gotoDialogOpenAtom } from '../../state/atoms'

interface GotoDialogProps {
    appliedFilters: AppliedFilters
    heapAllocations: NormalizedAllocation[] | null
    setHighlight: (addr: bigint | null) => void
}

export default function GotoDialog({
    appliedFilters,
    heapAllocations,
    setHighlight,
}: GotoDialogProps) {
    const [open, setOpen] = useAtom(gotoDialogOpenAtom)
    const [input, setInput] = useState<bigint | null>(null)
    const { show } = useToast()

    const heapAllocationsRange = useMemo<[base: bigint, end: bigint] | null>(() => {
        if (!heapAllocations || heapAllocations.length === 0) return null
        let base = heapAllocations[0].address
        let end = heapAllocations[0].address + heapAllocations[0].actualSize

        for (const heapAllocation of heapAllocations) {
            if (heapAllocation.address < base) base = heapAllocation.address
            const allocEnd = heapAllocation.address + heapAllocation.actualSize
            if (allocEnd > end) end = allocEnd
        }
        return [base, end]
    }, [heapAllocations])

    useHotkeys(
        'g',
        () => {
            setOpen(true)
        },
        { preventDefault: true },
        [setOpen]
    )

    if (!open && input !== null) {
        setInput(null)
    }

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
    }, [appliedFilters, heapAllocationsRange, input, setHighlight, setOpen, show])

    return (
        <Dialog
            disableRestoreFocus
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
