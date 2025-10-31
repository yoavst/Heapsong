import {
    AppBar,
    Box,
    Button,
    InputAdornment,
    Stack,
    TextField,
    Toolbar,
    Typography,
} from '@mui/material'
import { useAtom, useSetAtom } from 'jotai'
import {
    appliedFiltersAtom,
    applyPendingFiltersAtom,
    pendingFiltersAtom,
    setPendingFiltersAtom,
} from '../state/atoms'
import { useMemo } from 'react'

function isDirty(
    pending: { baseAddress: number | null; endAddress: number | null; rowSize: number },
    applied: typeof pending
) {
    return (
        pending.baseAddress !== applied.baseAddress ||
        pending.endAddress !== applied.endAddress ||
        pending.rowSize !== applied.rowSize
    )
}

export default function TopBar() {
    const [applied] = useAtom(appliedFiltersAtom)
    const [pending] = useAtom(pendingFiltersAtom)
    const apply = useSetAtom(applyPendingFiltersAtom)
    const setPendingPartial = useSetAtom(setPendingFiltersAtom)
    const dirty = useMemo(() => isDirty(pending, applied), [pending, applied])

    const applyAll = () => {
        apply()
    }

    const commonProps = (field: 'baseAddress' | 'endAddress' | 'rowSize') => ({
        value: pending[field] == null ? '' : Number(pending[field]).toString(16).toUpperCase(),
        sx: {
            '& input': {
                color: pending[field] !== (applied as any)[field] ? 'warning.main' : undefined,
            },
            minWidth: 160,
        },
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            let raw = e.target.value.trim()
            raw = raw.replace(/^0x/i, '')
            if (raw === '') setPendingPartial({ [field]: null } as any)
            else {
                const n = parseInt(raw, 16)
                if (!Number.isNaN(n)) setPendingPartial({ [field]: n } as any)
            }
        },
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') applyAll()
        },
        InputProps: {
            startAdornment: <InputAdornment position="start">0x</InputAdornment>,
        },
        inputProps: {
            inputMode: 'text',
            pattern: '[0-9a-fA-F]*',
        },
    })

    return (
        <AppBar
            position="sticky"
            color="default"
            elevation={1}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
            <Toolbar sx={{ gap: 2 }}>
                <Typography variant="h6" fontWeight={800} color="primary">
                    HeapSong
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                    <TextField
                        label="Base address"
                        size="small"
                        placeholder="0"
                        {...commonProps('baseAddress')}
                    />
                    <TextField
                        label="End address"
                        size="small"
                        placeholder="FFFF"
                        {...commonProps('endAddress')}
                    />
                    <TextField
                        label="Row size"
                        size="small"
                        placeholder="1000"
                        {...commonProps('rowSize')}
                    />
                    <Box flex={1} />
                    <Button
                        variant="contained"
                        color={dirty ? 'warning' : 'primary'}
                        onClick={applyAll}
                    >
                        Apply
                    </Button>
                </Stack>
            </Toolbar>
        </AppBar>
    )
}
