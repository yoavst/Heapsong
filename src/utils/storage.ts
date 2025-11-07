import { atomWithStorage } from 'jotai/utils'
import { type SyncStorage } from 'jotai/vanilla/utils/atomWithStorage'

const BIGINT_PREFIX = 'bigint:'

const createBigIntStorage = () => {
    const convertBigIntToHex = (obj: unknown): unknown => {
        if (obj === null || obj === undefined) return obj
        if (typeof obj === 'bigint') {
            return BIGINT_PREFIX + obj.toString(16)
        }
        if (Array.isArray(obj)) {
            return obj.map(convertBigIntToHex)
        }
        if (typeof obj === 'object') {
            const result: Record<string, unknown> = {}
            for (const [key, value] of Object.entries(obj)) {
                result[key] = convertBigIntToHex(value)
            }
            return result
        }
        return obj
    }

    const convertHexToBigInt = (obj: unknown): unknown => {
        if (obj === null || obj === undefined) return obj
        if (typeof obj === 'string' && obj.startsWith(BIGINT_PREFIX)) {
            try {
                const hexValue = obj.slice(BIGINT_PREFIX.length)
                return BigInt('0x' + hexValue)
            } catch {
                return obj
            }
        }
        if (Array.isArray(obj)) {
            return obj.map(convertHexToBigInt)
        }
        if (typeof obj === 'object') {
            const result: Record<string, unknown> = {}
            for (const [key, value] of Object.entries(obj)) {
                result[key] = convertHexToBigInt(value)
            }
            return result
        }
        return obj
    }

    return {
        getItem: (key: string, initialValue: unknown) => {
            try {
                const item = localStorage.getItem(key)
                if (item === null) return initialValue
                const parsed: unknown = JSON.parse(item)
                return convertHexToBigInt(parsed)
            } catch {
                return initialValue
            }
        },
        setItem: (key: string, value: unknown) => {
            try {
                const converted = convertBigIntToHex(value)
                const serialized = JSON.stringify(converted)
                localStorage.setItem(key, serialized)
            } catch (error) {
                console.error('Error saving to localStorage:', error)
            }
        },
        removeItem: (key: string) => {
            localStorage.removeItem(key)
        },
    }
}

const bigIntStorage = createBigIntStorage()

export const atomWithStorageOnInit = <T>(key: string, defaultValue: T, hasBigInt = false) => {
    return atomWithStorage(
        key,
        defaultValue,
        hasBigInt ? (bigIntStorage as SyncStorage<T>) : undefined,
        {
            getOnInit: true,
        }
    )
}
