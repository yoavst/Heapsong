import { Box, IconButton, Stack, Typography } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useState } from 'react'
import { useToast } from './ToastContext'

interface JsonTreeProps {
    data: unknown
}

interface NodeProps {
    name: string | undefined
    value: unknown
    depth: number
}

export default function JsonTree({ data }: JsonTreeProps) {
    return <Node name={undefined} value={data} depth={0} />
}

function Node({ name, value, depth }: NodeProps) {
    const { show } = useToast()
    const [open, setOpen] = useState(true)
    const pad = depth * 12

    value = transformValue(value)

    if (isPrimitive(value)) {
        return (
            <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ pl: `${pad}px`, py: 0.25 }}
            >
                {name && (
                    <Typography component="span" sx={{ color: 'text.secondary' }}>
                        {name}:
                    </Typography>
                )}
                <Typography
                    component="span"
                    sx={{ color: isNumeric(value) ? 'primary.main' : 'text.primary' }}
                >
                    {displayValue(value)}
                </Typography>
                {isNumeric(value) && (
                    <IconButton
                        size="small"
                        onClick={() => {
                            const hexValue = `0x${value.toString(16)}`
                            void navigator.clipboard.writeText(hexValue)
                            show(`Copied ${hexValue} to clipboard`, 'success')
                        }}
                    >
                        <ContentCopyIcon fontSize="inherit" />
                    </IconButton>
                )}
            </Stack>
        )
    }

    const isArray = Array.isArray(value)
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

const isPrimitive = (
    val: unknown
): val is null | undefined | string | number | boolean | bigint => {
    return (
        val === null ||
        val === undefined ||
        ['string', 'number', 'boolean', 'bigint'].includes(typeof val)
    )
}

const transformValue = (value: unknown): unknown => {
    // Try transform hex string to bigint
    if (typeof value !== 'string' || !(value.startsWith('0x') || value.startsWith('0X')))
        return value
    try {
        return BigInt(value)
    } catch (_error) {
        return value
    }
}

const isNumeric = (value: unknown): value is number | bigint => {
    return typeof value === 'bigint' || typeof value === 'number'
}

const displayValue = (value: unknown): string => {
    if (isNumeric(value)) return `0x${value.toString(16).toUpperCase()}`
    return JSON.stringify(value)
}
