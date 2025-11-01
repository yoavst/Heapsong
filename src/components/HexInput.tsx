import { TextField, InputAdornment } from '@mui/material'
import { useState } from 'react'

interface HexInputParams {
    label: string
    placeholder?: string
    fullWidth?: boolean
    defaultValue: number | null
    setValue: (value: number | null) => void
    apply: () => void
}

export default function HexInput({
    label,
    defaultValue,
    setValue,
    placeholder,
    apply,
    fullWidth = false,
}: HexInputParams) {
    const [current, setCurrent] = useState<number | null>(defaultValue)
    const isModified = current !== defaultValue

    return (
        <TextField
            label={label}
            size="small"
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
                const parsed = e.target.value.length ? parseInt(e.target.value, 16) : null
                setCurrent(parsed)
                setValue(parsed)
            }}
            slotProps={{
                htmlInput: {
                    inputMode: 'text',
                    pattern: '[0-9a-fA-F]*',
                },
                input: {
                    startAdornment: <InputAdornment position="start">0x</InputAdornment>,
                },
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') apply()
            }}
        />
    )
}
