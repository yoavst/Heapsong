import { Box, Button, Toolbar } from '@mui/material'
import { DEFAULT_ROW_SIZE } from '../state/atoms'
import HexInput from './HexInput'
import { useRef } from 'react'
import { AppliedFilters } from '../types'

interface FiltersBarProps {
    appliedFilters: AppliedFilters
    setAppliedFilters: (filters: AppliedFilters) => void
}

export default function FiltersBar({ appliedFilters, setAppliedFilters }: FiltersBarProps) {
    const pendingFilterChanges = useRef<Partial<AppliedFilters>>({})

    const applyAll = () => {
        setAppliedFilters({ ...appliedFilters, ...pendingFilterChanges.current })
    }

    return (
        <Toolbar
            sx={{
                gap: 2,
                borderBottom: 1,
                borderColor: 'divider',
            }}
        >
            <HexInput
                label="Base address"
                placeholder="0"
                apply={applyAll}
                defaultValue={appliedFilters.baseAddress}
                setValue={(value) => {
                    pendingFilterChanges.current = {
                        ...pendingFilterChanges.current,
                        baseAddress: value,
                    }
                }}
            />
            <HexInput
                label="End address"
                placeholder="FF..FF"
                apply={applyAll}
                defaultValue={appliedFilters.endAddress}
                setValue={(value) => {
                    pendingFilterChanges.current = {
                        ...pendingFilterChanges.current,
                        endAddress: value,
                    }
                }}
            />
            <HexInput
                label="Row size"
                placeholder={DEFAULT_ROW_SIZE.toString(16)}
                apply={applyAll}
                defaultValue={appliedFilters.rowSize}
                setValue={(value) => {
                    pendingFilterChanges.current = {
                        ...pendingFilterChanges.current,
                        rowSize: value ?? DEFAULT_ROW_SIZE,
                    }
                }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }} />
            <Button variant="contained" onClick={applyAll}>
                Apply
            </Button>
        </Toolbar>
    )
}
