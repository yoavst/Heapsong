import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material'
import { useAtom } from 'jotai'
import { useCallback, useState } from 'react'
import { useToast } from '../ToastContext'
import { useHotkeys } from 'react-hotkeys-hook'
import { getMetaKey } from '../../utils/os'
import { gotoGroupDialogOpenAtom } from '../../state/atoms'

interface GotoGroupDialogProps {
    onGotoGroup: (groupId: number) => void
    availableGroupIds: number[]
}

export default function GotoGroupDialog({ onGotoGroup, availableGroupIds }: GotoGroupDialogProps) {
    const [open, setOpen] = useAtom(gotoGroupDialogOpenAtom)
    const [input, setInput] = useState<string>('')
    const { show } = useToast()

    useHotkeys(
        `${getMetaKey()}+g`,
        () => {
            setOpen(true)
        },
        { preventDefault: true },
        [setOpen]
    )

    if (!open && input !== '') {
        setInput('')
    }

    const apply = useCallback(() => {
        const trimmed = input.trim()
        if (!trimmed) {
            setOpen(false)
            return
        }

        const groupId = Number(trimmed)
        if (isNaN(groupId) || !Number.isInteger(groupId) || groupId < 0) {
            show(`Invalid group ID: ${trimmed}`, 'warning')
            return
        }

        if (!availableGroupIds.includes(groupId)) {
            show(`Group ${groupId} not found`, 'warning')
            return
        }

        onGotoGroup(groupId)
        setOpen(false)
        setInput('')
    }, [input, availableGroupIds, onGotoGroup, setOpen, show])

    return (
        <Dialog
            disableRestoreFocus
            open={open}
            onClose={() => {
                setOpen(false)
            }}
        >
            <DialogTitle>Go to group</DialogTitle>
            <DialogContent>
                <TextField
                    label="Group ID"
                    size="small"
                    autoComplete="off"
                    autoFocus
                    placeholder="Enter group ID"
                    value={input}
                    fullWidth
                    sx={{ mt: 1 }}
                    onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '')
                        setInput(value)
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            apply()
                        }
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        setOpen(false)
                    }}
                >
                    Cancel
                </Button>
                <Button variant="contained" onClick={apply}>
                    Go
                </Button>
            </DialogActions>
        </Dialog>
    )
}
