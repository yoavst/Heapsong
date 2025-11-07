import { useState } from 'react'
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
    const [isHovered, setIsHovered] = useState(false)
    const texts = [
        `${alloc.type} #${alloc.groupId} (${formatHex(alloc.size)})`,
        `#${alloc.groupId} (${formatHex(alloc.size)})`,
        `#${alloc.groupId}`,
    ]

    const boxContent = (
        <Box
            data-addr={alloc.address.toString()}
            onClick={() => {
                setSelected(alloc.address)
            }}
            onMouseEnter={() => {
                setIsHovered(true)
            }}
            onMouseLeave={() => {
                setIsHovered(false)
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
    )

    return isHovered ? (
        <Tooltip
            title={`${alloc.type} #${alloc.groupId} (${formatHex(alloc.size)}) @ ${formatHex(alloc.address)}`}
            arrow
        >
            {boxContent}
        </Tooltip>
    ) : (
        boxContent
    )
}
