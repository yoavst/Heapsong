import {
    AppBar,
    Box,
    IconButton,
    Toolbar,
    Typography,
    Tabs,
    Tab,
    Menu,
    MenuItem,
    TabScrollButton,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import { useAtom } from 'jotai'
import {
    tabsAtom,
    activeTabIdAtom,
    defaultFiltersAtom,
    type Tab as TabType,
} from '../../state/atoms'
import { useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import parseInput from '../../utils/input'
import { compare } from '../../utils/bigint'
import { useToast } from '../ToastContext'
import RenameTabDialog from './RenameTabDialog'
import ActionButtons from './ActionButtons'

const MyTabScrollButton = styled(TabScrollButton)(() => ({
    width: 28,
    overflow: 'hidden',
    transition: 'width 0.5s',
    '&.Mui-disabled': {
        width: 0,
    },
}))

export interface TopBarHandle {
    onData: (data: string, fileName?: string) => void
}

const TopBar = forwardRef<TopBarHandle>((_, ref) => {
    const [tabs, setTabs] = useAtom(tabsAtom)
    const [activeTabId, setActiveTabId] = useAtom(activeTabIdAtom)
    const [defaultFilters] = useAtom(defaultFiltersAtom)
    const { show } = useToast()

    const activeTab = tabs.find((tab) => tab.id === activeTabId)

    const [contextMenu, setContextMenu] = useState<{ anchorEl: HTMLElement; tabId: number } | null>(
        null
    )
    const [renameInfo, setRenameInfo] = useState<{ tabId: number; originalName: string } | null>(
        null
    )

    const handleRenameClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()

            if (!contextMenu) return
            const tab = tabs.find((t) => t.id === contextMenu.tabId)
            if (tab) {
                setRenameInfo({ tabId: contextMenu.tabId, originalName: tab.name })
            }
            setContextMenu(null)
        },
        [contextMenu, tabs]
    )

    const handleRemoveTab = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()

            if (!contextMenu) return
            setContextMenu(null)

            // Use functional updates to ensure we have the latest state
            setTabs((currentTabs) => {
                const newTabs = currentTabs.filter((tab) => tab.id !== contextMenu.tabId)

                // If this was the last tab, create a new "Untitled" tab
                if (newTabs.length === 0) {
                    const newTab: TabType = {
                        id: 0,
                        name: 'Untitled',
                        heapAllocations: null,
                        appliedFilters: { ...defaultFilters },
                    }
                    setActiveTabId(0)
                    return [newTab]
                }

                // Otherwise, switch to another tab
                if (activeTabId === contextMenu.tabId && newTabs.length > 0) {
                    setActiveTabId(newTabs[0].id)
                }

                return newTabs
            })
        },
        [contextMenu, setTabs, activeTabId, defaultFilters, setActiveTabId]
    )

    const createNewTabFromData = useCallback(
        (data: string, fileName?: string) => {
            try {
                const json: unknown = JSON.parse(data)
                const normalized = parseInput(json)
                const sorted = normalized.slice().sort((a, b) => compare(a.address, b.address))

                // Use functional updates to ensure we have the latest state
                setTabs((currentTabs) => {
                    // Find the active tab, or use the first empty tab if active tab is empty
                    const activeTab = currentTabs.find((t) => t.id === activeTabId)
                    if (activeTab?.heapAllocations === null) {
                        show('Heap loaded successfully', 'success')
                        return currentTabs.map((t) =>
                            t.id === activeTab.id
                                ? { ...t, name: fileName ?? t.name, heapAllocations: sorted }
                                : t
                        )
                    } else {
                        // Create a new tab
                        const nextId =
                            currentTabs.length === 0
                                ? 0
                                : Math.max(...currentTabs.map((tab) => tab.id)) + 1
                        const newTab: TabType = {
                            id: nextId,
                            name: fileName ?? 'New Tab',
                            heapAllocations: sorted,
                            appliedFilters: { ...defaultFilters },
                        }
                        // Set active tab ID - React will batch these updates
                        setActiveTabId(nextId)
                        show('Heap loaded successfully', 'success')
                        return [...currentTabs, newTab]
                    }
                })
            } catch (e) {
                console.error(e)
                const message = e instanceof Error ? e.message : 'Invalid file'
                show(`Invalid heap file: ${message}`, 'error')
            }
        },
        [defaultFilters, setTabs, setActiveTabId, activeTabId, show]
    )

    const createNewTab = useCallback(
        (name: string, heapData: string | null = null) => {
            if (heapData) {
                createNewTabFromData(heapData, name)
            } else {
                // Use functional updates to ensure we have the latest state
                setTabs((currentTabs) => {
                    // Calculate next ID based on current tabs
                    const nextId =
                        currentTabs.length === 0
                            ? 0
                            : Math.max(...currentTabs.map((tab) => tab.id)) + 1
                    const newTab: TabType = {
                        id: nextId,
                        name,
                        heapAllocations: null,
                        appliedFilters: { ...defaultFilters },
                    }

                    // Set active tab ID after tabs are updated
                    setActiveTabId(nextId)
                    return [...currentTabs, newTab]
                })
            }
        },
        [defaultFilters, setTabs, setActiveTabId, createNewTabFromData]
    )

    // Expose onData callback via ref
    useImperativeHandle(
        ref,
        () => ({
            onData: createNewTabFromData,
        }),
        [createNewTabFromData]
    )

    return (
        <>
            <AppBar
                position="sticky"
                color="default"
                elevation={1}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
                <Toolbar
                    sx={{
                        gap: 2,
                        minHeight: '48px !important',
                        paddingX: 2,
                        position: 'relative',
                    }}
                >
                    <Typography
                        variant="h6"
                        fontWeight={800}
                        color="primary"
                        sx={{
                            position: 'relative',
                            pointerEvents: 'none',
                        }}
                    >
                        HeapSong
                    </Typography>


                    <Box
                        sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            ml: 2,
                            minWidth: 0,
                        }}
                    >
                        <Tabs
                            value={String(activeTabId)}
                            onChange={(_, newValue: string | number) => {
                                const numValue =
                                    typeof newValue === 'string'
                                        ? parseInt(newValue, 10)
                                        : newValue
                                if (typeof numValue === 'number' && !isNaN(numValue)) {
                                    setActiveTabId(numValue)
                                }
                            }}
                            variant="scrollable"
                            scrollButtons="auto"
                            slots={{
                                scrollButtons: MyTabScrollButton,
                            }}
                            sx={{
                                flex: 1,
                                minWidth: 0,
                                minHeight: 48,
                                '& .MuiTab-root': {
                                    minHeight: 48,
                                    textTransform: 'none',
                                    paddingX: 2,
                                },
                            }}
                        >
                            {tabs.map((tab) => (
                                <Tab
                                    key={tab.id}
                                    value={String(tab.id)}
                                    label={tab.name}
                                    onContextMenu={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setContextMenu({ anchorEl: e.currentTarget as HTMLElement, tabId: tab.id })
                                    }}
                                />
                            ))}
                        </Tabs>
                        <IconButton
                            onClick={() => {
                                createNewTab('Untitled', null)
                            }}
                            sx={{ flexShrink: 0 }}
                        >
                            <AddIcon />
                        </IconButton>
                        <ActionButtons activeTab={activeTab} />
                    </Box>

                </Toolbar>
            </AppBar>

            <Menu
                open={contextMenu !== null}
                onClose={() => {
                    setContextMenu(null)
                }}
                anchorEl={contextMenu?.anchorEl}
            >
                <MenuItem onClick={handleRenameClick}>Rename</MenuItem>
                <MenuItem onClick={handleRemoveTab}>Close</MenuItem>
            </Menu>

            <RenameTabDialog
                open={renameInfo !== null}
                initialName={renameInfo?.originalName ?? ''}
                key={renameInfo?.tabId}
                onConfirm={(name: string) => {
                    if (!renameInfo) return
                    setTabs(
                        tabs.map((tab) => (tab.id === renameInfo.tabId ? { ...tab, name } : tab))
                    )
                    setRenameInfo(null)
                }}
                onCancel={() => {
                    setRenameInfo(null)
                }}
            />
        </>
    )
})

TopBar.displayName = 'TopBar'

export default TopBar
