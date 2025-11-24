import { useRef, useState } from 'react'
import { Box, Button, Paper, Typography, useTheme } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'

interface DropFileProps {
    onData: (data: string, fileName?: string) => void
    samplePath?: string
}

export default function DropFile({ samplePath, onData }: DropFileProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [dragOver, setDragOver] = useState(false)
    const theme = useTheme()

    return (
        <Paper
            role="button"
            onClick={() => {
                fileInputRef.current?.click()
            }}
            onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
            }}
            onDragLeave={() => {
                setDragOver(false)
            }}
            onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                const file = e.dataTransfer.files.item(0)
                if (file !== null) {
                    const fileName = file.name.replace(/\.[^/.]+$/, '') || undefined
                    void loadFromFile(file).then((data) => {
                        onData(data, fileName)
                    })
                }
            }}
            elevation={dragOver ? 8 : 2}
            sx={{
                height: 280,
                borderRadius: 3,
                border: `2px dashed ${dragOver ? theme.palette.primary.main : theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                px: 4,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
        >
            <CloudUploadIcon color={dragOver ? 'primary' : 'disabled'} sx={{ fontSize: 56 }} />

            <Box>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                    Load heap dump
                </Typography>

                <Typography variant="body2" color="text.secondary">
                    Drag & drop or click here to import a JSON heap dump
                </Typography>

                <Box mt={2} sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Button
                        variant="contained"
                        onClick={(e) => {
                            e.stopPropagation()
                            void loadFromClipboard().then((data) => {
                                onData(data)
                            })
                        }}
                    >
                        Use Clipboard
                    </Button>
                    {samplePath && (
                        <Button
                            variant="outlined"
                            onClick={(e) => {
                                e.stopPropagation()
                                void loadFromUrl(samplePath).then(onData)
                            }}
                        >
                            Load Sample
                        </Button>
                    )}
                </Box>
            </Box>

            <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={(e) => {
                    const file = e.currentTarget.files?.item(0)
                    if (file) {
                        const fileName = file.name.replace(/\.[^/.]+$/, '') || undefined
                        void loadFromFile(file).then((data) => {
                            onData(data, fileName)
                        })
                    }
                    // Reset input so selecting the same file again still triggers onChange
                    if (fileInputRef.current) fileInputRef.current.value = ''
                }}
            />
        </Paper>
    )
}

const loadFromUrl = async (path: string): Promise<string> => {
    const res = await fetch(path)
    return await res.text()
}

const loadFromFile = async (file: File): Promise<string> => {
    return await file.text()
}

const loadFromClipboard = async (): Promise<string> => {
    return await navigator.clipboard.readText()
}
