import { Box } from '@mui/material'
import TopBar, { TopBarHandle } from '../components/topbar/TopBar'
import TabContentView from '../components/TabContentView'
import { useAtom } from 'jotai'
import { tabsAtom, activeTabIdAtom, defaultFiltersAtom, Tab } from '../state/atoms'
import { useRef } from 'react'

export default function VisualizerScreen() {
    const [tabs, setTabs] = useAtom(tabsAtom)
    const [activeTabId, setActiveTabId] = useAtom(activeTabIdAtom)
    const [defaultFilters] = useAtom(defaultFiltersAtom)
    const topBarRef = useRef<TopBarHandle>(null)

    // Ensure there's always at least one tab

    if (tabs.length === 0) {
        const newTab: Tab = {
            id: 0,
            name: 'Untitled',
            heapAllocations: null,
            appliedFilters: { ...defaultFilters },
        }
        setTabs([newTab])
        setActiveTabId(0)
        return <></>
    }

    return (
        <Box sx={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
            <TopBar ref={topBarRef} />
            <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
                {tabs.map((tab) => (
                    <TabContentView
                        key={tab.id}
                        isActive={activeTabId === tab.id}
                        heapAllocations={tab.heapAllocations}
                        appliedFilters={tab.appliedFilters}
                        setAppliedFilters={(filters) => {
                            setTabs((currentTabs) =>
                                currentTabs.map((t) =>
                                    t.id === tab.id ? { ...t, appliedFilters: filters } : t
                                )
                            )
                        }}
                        onData={(data: string, fileName?: string) => {
                            topBarRef.current?.onData(data, fileName)
                        }}
                    />
                ))}
            </Box>
        </Box>
    )
}
