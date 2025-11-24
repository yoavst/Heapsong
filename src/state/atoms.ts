import type { AppliedFilters, NormalizedAllocation } from '../types'
import { atomWithStorageOnInit } from '../utils/storage'
import { atom } from 'jotai'

export const DEFAULT_ROW_SIZE = BigInt(0x1000)

// #region Settings
export const themeColorAtom = atomWithStorageOnInit<string>('themeColor', '#7c4dff')
export const collapseEmptyRowsAtom = atomWithStorageOnInit<{ enabled: boolean; threshold: number }>(
    'collapseEmptyRows',
    {
        enabled: true,
        threshold: 3,
    }
)
export const defaultFiltersAtom = atomWithStorageOnInit<AppliedFilters>(
    'defaultFilters',
    {
        baseAddress: null,
        endAddress: null,
        rowSize: DEFAULT_ROW_SIZE,
    },
    true
)

export const sidebarWidthAtom = atomWithStorageOnInit<number>('sidebarWidth', 360)
export const defaultSearchShowAllGroupAtom = atomWithStorageOnInit<boolean>(
    'defaultSearchShowAllGroupAtom',
    false
)
// #endregion

// #region Tab Management
export interface Tab {
    id: number
    name: string
    heapAllocations: NormalizedAllocation[] | null
    appliedFilters: AppliedFilters
}

export const tabsAtom = atomWithStorageOnInit<Tab[]>('tabs', [], true)

export const activeTabIdAtom = atomWithStorageOnInit<number | null>('activeTabId', null, true)
// #endregion

// #region Dialog State
export const gotoDialogOpenAtom = atom<boolean>(false)
export const gotoGroupDialogOpenAtom = atom<boolean>(false)
// #endregion
