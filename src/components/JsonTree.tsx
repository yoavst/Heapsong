import { Box, IconButton, Stack, Typography } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useState } from 'react'
import { useToast } from './ToastContext'

function isPrimitive(val: unknown) {
    return val === null || val === undefined || ['string', 'number', 'boolean'].includes(typeof val)
}

export default function JsonTree({ data }: { data: unknown }) {
    return (
        <Box
            sx={{
                fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: 13,
            }}
        >
            <Node name={undefined} value={data} depth={0} />
        </Box>
    )
}

function Node({ name, value, depth }: { name: string | undefined; value: unknown; depth: number }) {
    const { show } = useToast()
    const [open, setOpen] = useState(true)
    const pad = depth * 12

    if (name == 'address') {
        value = parseInt(value as string, 16)
    }

    if (isPrimitive(value)) {
        const display =
            typeof value === 'number'
                ? `0x${value.toString(16).toUpperCase()}`
                : JSON.stringify(value)
        return (
            <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ pl: `${pad}px`, py: 0.25 }}
            >
                <Typography component="span" sx={{ color: 'text.secondary' }}>
                    {name ? `${name}: ` : ''}
                </Typography>
                <Typography
                    component="span"
                    sx={{ color: typeof value === 'number' ? 'primary.main' : 'text.primary' }}
                >
                    {display}
                </Typography>
                {typeof value === 'number' && (
                    <IconButton
                        size="small"
                        onClick={() => {
                            void navigator.clipboard.writeText(
                                '0x' + value.toString(16).toUpperCase()
                            )
                            show('Copied', 'success')
                        }}
                    >
                        <ContentCopyIcon fontSize="inherit" />
                    </IconButton>
                )}
            </Stack>
        )
    }

    if (value === undefined) {
        return (
            <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ pl: `${pad}px`, py: 0.25 }}
            >
                <Typography component="span" sx={{ color: 'text.secondary' }}>
                    {name ? `${name}: ` : ''}
                </Typography>
                <Typography component="span" sx={{ color: 'text.disabled' }}>
                    undefined
                </Typography>
            </Stack>
        )
    }
    const isArray = Array.isArray(value)
    if (!isArray && (typeof value !== 'object' || value === null)) {
        const display =
            typeof value === 'number'
                ? `0x${value.toString(16).toUpperCase()}`
                : JSON.stringify(value)
        return (
            <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ pl: `${pad}px`, py: 0.25 }}
            >
                <Typography component="span" sx={{ color: 'text.secondary' }}>
                    {name ? `${name}: ` : ''}
                </Typography>
                <Typography
                    component="span"
                    sx={{ color: typeof value === 'number' ? 'primary.main' : 'text.primary' }}
                >
                    {display}
                </Typography>
            </Stack>
        )
    }
    const entries = isArray
        ? (value as unknown[])
        : Object.entries(value as Record<string, unknown>)
    return (
        <Box>
            <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ pl: `${pad}px`, py: 0.25, cursor: 'pointer' }}
                onClick={() => {
                    setOpen((v) => !v)
                }}
            >
                <Typography component="span" sx={{ color: 'text.secondary' }}>
                    {name ? `${name}: ` : ''}
                    {isArray ? '[...]' : '{...}'}
                </Typography>
            </Stack>
            {open ? (
                <Box>
                    {(isArray ? entries : (entries as [string, unknown][])).map((entry, idx) => {
                        const [k, v] = isArray ? [String(idx), entry] : (entry as [string, unknown])
                        return <Node key={k} name={k} value={v} depth={depth + 1} />
                    })}
                </Box>
            ) : null}
        </Box>
    )
}
