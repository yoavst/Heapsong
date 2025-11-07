import { Box, Tooltip } from '@mui/material'
import { darken } from '@mui/material/styles'
import { RowAllocSegment } from '../../utils/rows'
import { formatHex } from '../../utils/formatting'
import AdaptiveText from './AdaptiveText'

export interface AllocationBoxProps {
    alloc: RowAllocSegment
    selected: boolean
    setSelected: (addr: bigint) => void
    width: number
}

export default function AllocationBox({ alloc, selected, setSelected, width }: AllocationBoxProps) {
    const texts = [
        `${alloc.type} #${alloc.groupId} (${formatHex(alloc.size)})`,
        `#${alloc.groupId} (${formatHex(alloc.size)})`,
        `#${alloc.groupId}`,
    ]

    return (
        <Tooltip
            title={`${alloc.type} #${alloc.groupId} (${formatHex(alloc.size)}) @ ${formatHex(alloc.address)}`}
            arrow
        >
            <Box
                data-addr={alloc.address.toString()}
                onClick={() => {
                    setSelected(alloc.address)
                }}
                sx={{
                    position: 'absolute',
                    left: `${alloc.leftPct}%`,
                    width: `${alloc.widthPct}%`,
                    height: '100%',
                    opacity: 0.7,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    border: selected ? '2px solid #fff' : 'none',
                    background: `linear-gradient(to right, ${darken(alloc.color, 0.15)} ${alloc.requestedPct}%, ${alloc.color} ${alloc.requestedPct}%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 0.5,
                }}
            >
                <Box>
                    <AdaptiveText texts={texts} width={width} />
                </Box>
            </Box>
        </Tooltip>
    )
}
