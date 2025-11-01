import { atom } from 'jotai'
import { atomWithDefault, atomWithStorage } from 'jotai/utils'

import type { AppliedFilters, NormalizedAllocation } from '../types'

export const DEFAULT_ROW_SIZE = 0x1000

const atomWithStorageOnInit = <T>(key: string, defaultValue: T) => {
    return atomWithStorage(key, defaultValue, undefined, { getOnInit: true })
}

// #region Settings
export const themeColorAtom = atomWithStorageOnInit<string>('themeColor', '#7c4dff')
export const collapseEmptyRowsAtom = atomWithStorageOnInit<{ enabled: boolean; threshold: number }>(
    'collapseEmptyRows',
    {
        enabled: false,
        threshold: 1,
    }
)
export const defaultFiltersAtom = atomWithStorageOnInit<AppliedFilters>('defaultFilters', {
    baseAddress: null,
    endAddress: null,
    rowSize: DEFAULT_ROW_SIZE,
})

export const sidebarWidthAtom = atomWithStorageOnInit<number>('sidebarWidth', 360)
// #endregion

// #region State
export const heapAllocationsAtom = atomWithStorageOnInit<NormalizedAllocation[] | null>(
    'heapAllocations',
    null
)

export const appliedFiltersAtom = atomWithDefault<AppliedFilters>((get) => {
    return { ...get(defaultFiltersAtom) }
})

export const selectedAddressAtom = atom<number | null>(null)

export const highlightRowBaseAtom = atom<number | null>(null)
// #endregion
