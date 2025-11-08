/**
 * Returns true if the user is on a Mac
 */
export const isMac = (): boolean => {
    return navigator.userAgentData?.platform.toUpperCase().includes('MAC') ?? false
}

export const getMetaKey = (): string => {
    return isMac() ? 'meta' : 'ctrl'
}
