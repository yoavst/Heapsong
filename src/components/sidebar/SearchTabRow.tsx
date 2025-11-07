import { Box, Typography } from '@mui/material'
import { RowComponentProps } from 'react-window'
import { NormalizedAllocation } from '../../types'
import { formatHex } from '../../utils/formatting'

export type ListItem =
    | { type: 'group'; groupId: string }
    | { type: 'item'; allocation: NormalizedAllocation }

export interface SearchTabRowProps {
    items: ListItem[]
    selected: bigint | null
    setSelected: (addr: bigint) => void
    setHighlight: (addr: bigint) => void
}

export function SearchTabRow({
    index,
    style,
    items,
    selected,
    setSelected,
    setHighlight,
}: RowComponentProps<SearchTabRowProps>) {
    const item = items[index]

    if (item.type === 'group') {
        return (
            <Box style={style}>
                <Typography variant="subtitle2" sx={{ px: 1, py: 0.5, color: 'text.secondary' }}>
                    Group {item.groupId}
                </Typography>
            </Box>
        )
    }

    const allocation = item.allocation
    const isSelected = selected === allocation.address

    return (
        <Box
            style={style}
            sx={{
                display: 'flex',
                alignItems: 'center',
                px: 1,
                py: 0.5,
                borderLeft: `4px solid ${allocation.color}`,
                cursor: 'pointer',
                bgcolor: isSelected ? 'action.selected' : undefined,
            }}
            onClick={() => {
                setSelected(allocation.address)
                setHighlight(allocation.address)
            }}
        >
            <Typography variant="body2" noWrap>
                {allocation.type} ({formatHex(allocation.size)}) → {formatHex(allocation.address)}
            </Typography>
        </Box>
    )
}
