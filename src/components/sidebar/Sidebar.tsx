import { Box, Divider, Tab, Tabs } from '@mui/material'

import { useState } from 'react'
import SettingsTab from './SettingsTab'
import SearchTab from './SearchTab'
import { NormalizedAllocation } from '../../types'

interface SidebarProps {
    heapAllocations: NormalizedAllocation[] | null
    setSelected: (addr: bigint | null) => void
    setHighlight: (addr: bigint | null) => void
    getSelected: () => bigint | null
    setAvailableGroupIds: (ids: number[]) => void
    setOnGotoGroup: (callback: (groupId: number) => void) => void
}

export default function Sidebar({
    heapAllocations,
    setSelected,
    setHighlight,
    getSelected,
    setAvailableGroupIds,
    setOnGotoGroup,
}: SidebarProps) {
    const [tab, setTab] = useState(0)
    return (
        <Box sx={{ height: 'calc(100vh - 70px - 64px)', display: 'flex', flexDirection: 'column' }}>
            <Tabs
                value={tab}
                onChange={(_, v: number) => {
                    setTab(v)
                }}
                variant="fullWidth"
            >
                <Tab label="Search" />
                <Tab label="Settings" />
            </Tabs>
            <Divider />
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <Box
                    sx={{
                        flex: 1,
                        height: '100%',
                        overflow: 'hidden',
                        display: tab === 0 ? 'block' : 'none',
                    }}
                >
                    <SearchTab
                        heapAllocations={heapAllocations}
                        setSelected={setSelected}
                        setHighlight={setHighlight}
                        getSelected={getSelected}
                        setAvailableGroupIds={setAvailableGroupIds}
                        setOnGotoGroup={setOnGotoGroup}
                    />
                </Box>
                <Box
                    sx={{
                        flex: 1,
                        height: '100%',
                        overflow: 'hidden',
                        display: tab === 1 ? 'block' : 'none',
                    }}
                >
                    <SettingsTab />
                </Box>
            </Box>
        </Box>
    )
}
