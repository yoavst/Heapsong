import { Box, Button } from '@mui/material'
import CodeMirror, { Extension } from '@uiw/react-codemirror'
import { keymap } from '@codemirror/view'
import { EditorView } from '@codemirror/view'
import { javascriptLanguage, scopeCompletionSource } from '@codemirror/lang-javascript'

import { andromeda } from '@uiw/codemirror-theme-andromeda'
import { useCallback, useMemo, useState } from 'react'
import './FilterEditor.css'
import { NormalizedAllocation } from '../../types'
import { useToast } from '../ToastContext'
import { defaultKeymap } from '@codemirror/commands'
import { completeFromList, ifNotIn } from '@codemirror/autocomplete'

interface FilterEditorProps {
    defaultValue: string
    fieldNames: string[]
    onApply: (filter: (e: NormalizedAllocation) => boolean) => void
}

export default function FilterEditor({ defaultValue, onApply, fieldNames }: FilterEditorProps) {
    const [value, setValue] = useState(defaultValue)
    const { show } = useToast()

    const handleApply = useCallback(() => {
        const trimmed = value.trim()
        if (trimmed.length === 0) {
            onApply((_e) => true)
            return
        } else if (!trimmed.includes('return')) {
            show('Filter does not return value', 'error')
            return
        } else {
            const filter = createFilter(trimmed)
            if (typeof filter === 'string') {
                show(filter, 'error')
                return
            }
            onApply(filter)
        }
    }, [onApply, show, value])

    const extensions: Extension[] = useMemo(() => {
        return [
            javascriptLanguage as Extension,
            javascriptCompletions(fieldNames),
            EditorView.lineWrapping,
            keymap.of([
                {
                    key: 'Mod-Enter',
                    run: () => {
                        handleApply()
                        return true
                    },
                },
                ...defaultKeymap,
            ]),
        ]
    }, [handleApply, fieldNames])

    return (
        <Box>
            <Box
                sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Box component="code" className="fakeCodeMirror">
                    {'(e) => {'}
                </Box>
                <CodeMirror
                    value={value}
                    onChange={setValue}
                    placeholder="return e.type === 'FOO'"
                    height="auto"
                    minHeight="72px"
                    maxHeight="192px"
                    extensions={extensions}
                    theme={andromeda}
                    basicSetup={{
                        lineNumbers: false,
                        highlightActiveLine: true,
                        autocompletion: true,
                        defaultKeymap: false,
                    }}
                />
                <Box component="code" className="fakeCodeMirror">
                    {'}'}
                </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button size="small" variant="contained" onClick={handleApply}>
                    Apply
                </Button>
            </Box>
        </Box>
    )
}

const FilterScope = {
    min: (a: bigint | number, b: bigint | number) => {
        if (typeof a == 'number' && typeof b == 'number') {
            return Math.min(a, b)
        }
        return BigInt(a) < BigInt(b) ? BigInt(a) : BigInt(b)
    },
    max: (a: bigint | number, b: bigint | number) => {
        if (typeof a == 'number' && typeof b == 'number') {
            return Math.max(a, b)
        }
        return BigInt(a) > BigInt(b) ? BigInt(a) : BigInt(b)
    },
}

const createFilter = (expression: string): ((e: NormalizedAllocation) => boolean) | string => {
    if (!expression.trim()) {
        return (_e) => true
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const fn: (e: NormalizedAllocation) => unknown = new Function(
            'e',
            `with(this) {${expression}}`
        ).bind(FilterScope) as (e: NormalizedAllocation) => unknown
        return (e) => {
            try {
                return !!fn(e)
            } catch (error) {
                console.error(error)
                return false
            }
        }
    } catch (error) {
        console.error(error)
        return `Error: ${error instanceof Error ? error.message : String(error)}`
    }
}

function javascriptCompletions(fieldNames: string[]): Extension[] {
    const e: Record<string, unknown> = Object.create(null) as Record<string, unknown>
    for (const fieldName of fieldNames) {
        e[fieldName] = null
    }
    const fakeScope: Record<string, unknown> = Object.create(null) as Record<string, unknown>
    fakeScope.e = e
    for (const [key, value] of Object.entries(FilterScope)) {
        if (typeof value === 'function') {
            fakeScope[key] = () => null
        } else {
            fakeScope[key] = value
        }
    }

    const kwCompletion = (name: string) => ({ label: name, type: 'keyword' })
    const keywords = ' const let false in of new return this true typeof var null undefined'
        .split(' ')
        .map(kwCompletion)
    const dontComplete = [
        'TemplateString',
        'String',
        'RegExp',
        'LineComment',
        'BlockComment',
        'VariableDefinition',
        'TypeDefinition',
        'Label',
        'PropertyDefinition',
        'PropertyName',
        'PrivatePropertyDefinition',
        'PrivatePropertyName',
        'JSXText',
        'JSXAttributeValue',
        'JSXOpenTag',
        'JSXCloseTag',
        'JSXSelfClosingTag',
        '.',
        '?.',
    ]

    return [
        javascriptLanguage.data.of({
            autocomplete: scopeCompletionSource(fakeScope),
        }),
        javascriptLanguage.data.of({
            autocomplete: ifNotIn(dontComplete, completeFromList(keywords)),
        }),
    ] as Extension[]
}
