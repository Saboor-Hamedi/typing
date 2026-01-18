/**
 * TypingEngine Tests
 * 
 * Basic tests for the TypingEngine component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMockEngine } from '../utils/testHelpers'
import TypingEngine from '../engine/TypingEngine'

// Mock ResultsView
vi.mock('../components/Results/ResultsView', () => ({
  default: () => <div data-testid="results-view">Results</div>
}))

// Mock useSettings
vi.mock('../contexts', () => ({
  useSettings: () => ({
    isSmoothCaret: true
  })
}))

describe('TypingEngine', () => {
  it('renders words correctly', () => {
    const mockEngine = createMockEngine({
      words: ['hello', 'world'],
      userInput: ''
    })

    render(
      <TypingEngine
        engine={mockEngine}
        testMode="words"
        testLimit={25}
        isOverlayActive={false}
      />
    )

    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(screen.getByText('world')).toBeInTheDocument()
  })

  it('shows results when test is finished', () => {
    const mockEngine = createMockEngine({
      isFinished: true,
      results: { wpm: 75, rawWpm: 80, accuracy: 95, errors: 2 }
    })

    render(
      <TypingEngine
        engine={mockEngine}
        testMode="words"
        testLimit={25}
        isOverlayActive={false}
      />
    )

    expect(screen.getByTestId('results-view')).toBeInTheDocument()
  })

  it('renders hidden input for typing', () => {
    const mockEngine = createMockEngine()

    render(
      <TypingEngine
        engine={mockEngine}
        testMode="words"
        testLimit={25}
        isOverlayActive={false}
      />
    )

    const input = screen.getByLabelText('Typing input field')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'text')
  })
})
