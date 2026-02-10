import React from 'react'

/**
 * HighlightedText
 * 
 * Highlights portions of text that match the query string.
 */
const HighlightedText = ({ text = '', query = '', className = 'highlight' }) => {
  if (!query.trim()) return <>{text}</>

  try {
    const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'))
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className={className}>{part}</mark>
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
