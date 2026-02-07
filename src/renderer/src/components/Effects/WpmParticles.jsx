import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const Particle = ({ x, y, color }) => {
  const angle = Math.random() * Math.PI * 2
  const dist = 15 + Math.random() * 30

  return (
    <motion.div
      initial={{ x, y, scale: 1, opacity: 1 }}
      animate={{
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        scale: 0,
        opacity: 0
      }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        width: '3px',
        height: '3px',
        borderRadius: '50%',
        backgroundColor: color,
        pointerEvents: 'none',
        zIndex: 5,
        willChange: 'transform'
      }}
    />
  )
}

const WpmParticles = ({ liveWpm, caretPos, isTyping }) => {
  const [particles, setParticles] = useState([])
  const lastSpawn = useRef(0)

  useEffect(() => {
    if (!isTyping || liveWpm < 80) return

    const now = Date.now()
    if (now - lastSpawn.current < 50) return // Throttle to 20Hz max for performance
    lastSpawn.current = now

    const count = liveWpm > 130 ? 3 : 2
    const color = liveWpm > 130 ? '#ff4040' : 'var(--main-color)'

    const newOnes = Array.from({ length: count }).map((_, i) => ({
      id: now + i,
      x: caretPos.left,
      y: caretPos.top + 10,
      color: color
    }))

    setParticles((prev) => [...prev, ...newOnes].slice(-15))

    const timer = setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newOnes.includes(p)))
    }, 400)

    return () => clearTimeout(timer)
  }, [liveWpm, isTyping, caretPos.left, caretPos.top])

  if (liveWpm < 80) return null

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
      {particles.map((p) => (
        <Particle key={p.id} x={p.x} y={p.y} color={p.color} />
      ))}
    </div>
  )
}

export default WpmParticles
