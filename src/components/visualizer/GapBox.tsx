import { Box, Tooltip } from '@mui/material'
import { RowGap } from '../../utils/rows'
import AdaptiveText from './AdaptiveText'

export interface GapBoxProps {
    gap: RowGap
    width: number
}

export default function GapBox({ gap, width }: GapBoxProps) {
    return (
        <Tooltip title={`Gap: ${gap.sizeHex}`} arrow>
            <Box
                sx={{
                    position: 'absolute',
                    left: `${gap.leftPct}%`,
                    width: `${gap.widthPct}%`,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    color: 'text.secondary',
                }}
            >
                <Box>
                    <AdaptiveText texts={[gap.sizeHex]} width={width} forceShow={false} />
                </Box>
            </Box>
        </Tooltip>
    )
}
