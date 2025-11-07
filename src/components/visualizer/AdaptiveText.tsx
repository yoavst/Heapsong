export interface AdaptiveTextProps {
    texts: string[]
    width: number
    forceShow?: boolean
}

function estimateWidth(text: string): number {
    // rough average per character for bold 12px system font
    return text.length * 6.8
}

export default function AdaptiveText({ texts, width, forceShow = true }: AdaptiveTextProps) {
    let displayText = ''
    let fontSize = 12

    if (width > 0) {
        for (const text of texts) {
            if (estimateWidth(text) <= width) {
                displayText = text
                break
            }
        }
        if (displayText === '' && forceShow) {
            fontSize = 10
            displayText = texts[texts.length - 1]
        }
    }

    return (
        <span
            style={{
                display: 'inline-block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize,
                fontWeight: 'bold',
                textAlign: 'center',
                maxWidth: '100%',
            }}
        >
            {displayText}
        </span>
    )
}
