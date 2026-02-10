import React from 'react'

/**
 * HighlightedText
 *
 * Highlights portions of text that match the query string.
 */
const HighlightedText = ({ text = '', query = '', className = 'highlight' }) => {
  if (!query.trim()) return <>{text}</>

  try {
    const terms = query
      .trim()
      .split(/\s+/)
      .filter((t) => t.length > 0)
    if (terms.length === 0) return <>{text}</>

    // Build regex that matches any of the terms
    const escapedTerms = terms.map((t) => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi')

    const parts = text.toString().split(regex)
    return (
      <>
        {parts.map((part, i) =>
          part && terms.some((t) => part.toLowerCase() === t.toLowerCase()) ? (
            <mark key={i} className={className}>
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    )
  } catch (e) {
    return <>{text}</>
  }
}

export default HighlightedText
