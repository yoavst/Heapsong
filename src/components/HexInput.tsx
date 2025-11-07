import { TextField, InputAdornment } from '@mui/material'
import { useState } from 'react'

interface HexInputParams {
    label: string
    placeholder?: string
    fullWidth?: boolean
    defaultValue?: bigint | null
    highlightEdit?: boolean
    autoFocus?: boolean
    setValue: (value: bigint | null) => void
    apply: () => void
}

export default function HexInput({
    label,
    setValue,
    placeholder,
    apply,
    defaultValue = null,
    highlightEdit = true,
    autoFocus = false,
    fullWidth = false,
}: HexInputParams) {
    const [current, setCurrent] = useState<bigint | null>(defaultValue)
    const isModified = highlightEdit && current !== defaultValue

    return (
        <TextField
            label={label}
            size="small"
            autoComplete="off"
            autoFocus={autoFocus}
            placeholder={placeholder ?? ''}
            value={current != null ? current.toString(16) : ''}
            fullWidth={fullWidth}
            sx={{
                '& input': {
                    color: isModified ? 'warning.main' : undefined,
                },
                minWidth: 160,
            }}
            onChange={(e) => {
                const hex = e.target.value.replace(/[^0-9a-fA-F]/g, '')
                const parsed = hex.length ? BigInt('0x' + hex) : null
                setCurrent(parsed)
                setValue(parsed)
            }}
            slotProps={{
                input: {
                    startAdornment: <InputAdornment position="start">0x</InputAdornment>,
                    inputProps: {
                        inputMode: 'text',
                        pattern: '[0-9a-fA-F]*',
                    },
                },
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') apply()
            }}
        />
    )
}
