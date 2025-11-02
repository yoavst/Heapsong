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
export const heapAllocationsRangeAtom = atom<[base: number, end: number] | null>((get) => {
    const heapAllocations = get(heapAllocationsAtom)
    if (!heapAllocations) return null
    let base = heapAllocations[0].address
    let end = heapAllocations[0].address + heapAllocations[0].actualSize

    for (const heapAllocation of heapAllocations) {
        if (heapAllocation.address < base) base = heapAllocation.address
        const allocEnd = heapAllocation.address + heapAllocation.actualSize
        if (allocEnd > end) end = allocEnd
    }
    return [base, end]
})

export const appliedFiltersAtom = atomWithDefault<AppliedFilters>((get) => {
    return { ...get(defaultFiltersAtom) }
})

export const selectedAddressAtom = atom<number | null>(null)

export const highlightAtom = atom<number | null>(null)
// #endregion
