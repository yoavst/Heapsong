import { Box, Typography } from '@mui/material'
import { RowEntry } from '../../utils/rows'
import { formatHex } from '../../utils/formatting'
import AllocationBox from './AllocationBox'
import GapBox from './GapBox'

interface HeapRowProps {
    row: RowEntry
    selected: bigint | null
    setSelected: (addr: bigint) => void
    width: number
}

export function HeapRow({ row, selected, setSelected, width }: HeapRowProps) {
    return (
        <Box
            sx={{
                flex: 1,
                display: 'flex',
                position: 'relative',
                height: 28,
                bgcolor: 'action.hover',
                borderRadius: 1,
                overflow: 'hidden',
            }}
        >
            {row.gaps.map((g, idx) => (
                <GapBox key={`gap-${idx}`} gap={g} width={(width * g.widthPct) / 100} />
            ))}
            {row.allocs.map((a) => (
                <AllocationBox
                    key={a.address.toString()}
                    alloc={a}
                    selected={selected === a.address}
                    setSelected={setSelected}
                    width={(width * a.widthPct) / 100}
                />
            ))}
        </Box>
    )
}

interface CollapsedRowParams {
    row: RowEntry
}

export function CollapsedRow({ row }: CollapsedRowParams) {
    return (
        <Box
            sx={{
                flex: 1,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 1,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
            }}
        >
            <Typography variant="caption" color="text.secondary">
                {`Collapsed range ${formatHex(row.base)}-${formatHex(row.base + row.size)} (${formatHex(row.size)})`}
            </Typography>
        </Box>
    )
}
