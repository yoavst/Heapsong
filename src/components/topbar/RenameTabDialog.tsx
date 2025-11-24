import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material'
import { useCallback, useState } from 'react'

interface RenameTabDialogProps {
    open: boolean
    initialName: string
    onConfirm: (name: string) => void
    onCancel: () => void
}

export default function RenameTabDialog({
    open,
    initialName,
    onConfirm,
    onCancel,
}: RenameTabDialogProps) {
    const [name, setName] = useState(initialName)
    const handleConfirm = useCallback(() => {
        onConfirm(name)
    }, [name, onConfirm])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                handleConfirm()
            } else if (e.key === 'Escape') {
                onCancel()
            }
        },
        [handleConfirm, onCancel]
    )

    return (
        <Dialog open={open} onClose={onCancel}>
            <DialogTitle>Rename Tab</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    fullWidth
                    margin="dense"
                    label="Tab name"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value)
                    }}
                    onKeyDown={handleKeyDown}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>Cancel</Button>
                <Button variant="contained" onClick={handleConfirm}>
                    Rename
                </Button>
            </DialogActions>
        </Dialog>
    )
}
