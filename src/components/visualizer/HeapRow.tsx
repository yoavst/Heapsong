import { Box, Tooltip, Typography } from '@mui/material'
import { RowEntry } from '../../utils/rows'
import { formatHex } from '../../utils/formatting'

interface HeapRowProps {
    row: RowEntry
    selected: bigint | null
    setSelected: (addr: bigint) => void
    setHighlight: (addr: bigint | null) => void
}

export function HeapRow({ row, selected, setSelected, setHighlight }: HeapRowProps) {
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
                <Box
                    key={`gap-${idx}`}
                    sx={{
                        position: 'absolute',
                        left: `${g.leftPct}%`,
                        width: `${g.widthPct}%`,
                        top: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                    }}
                >
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {g.sizeHex}
                    </Typography>
                </Box>
            ))}
            {row.allocs.map((a) => (
                <Tooltip
                    key={a.address.toString()}
                    title={`${a.type} #${a.groupId} (${formatHex(a.size)}) @ ${formatHex(a.address)}`}
                    arrow
                >
                    <Box
                        data-addr={a.address.toString()}
                        onClick={() => {
                            setSelected(a.address)
                            setHighlight(null)
                        }}
                        sx={{
                            position: 'absolute',
                            left: `${a.leftPct}%`,
                            width: `${a.widthPct}%`,
                            height: '100%',
                            bgcolor: a.color,
                            opacity: 0.7,
                            boxSizing: 'border-box',
                        }}
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: `${a.requestedPct}%`,
                                bgcolor: a.color,
                            }}
                        />
                        <Box
                            sx={{
                                position: 'relative',
                                zIndex: 1,
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: 12,
                                fontWeight: 'bold',
                            }}
                        >
                            {a.type} #{a.groupId} ({formatHex(a.size)})
                        </Box>
                        {selected === a.address && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    border: '2px solid #fff',
                                    boxSizing: 'border-box',
                                    pointerEvents: 'none',
                                }}
                            />
                        )}
                    </Box>
                </Tooltip>
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
