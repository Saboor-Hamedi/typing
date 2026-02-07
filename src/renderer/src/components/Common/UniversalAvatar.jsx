import React, { useState } from 'react'
import {
  Flame,
  Sun,
  Zap,
  Ghost,
  Moon,
  Star,
  Crown,
  Shield,
  Sword,
  Eye,
  Orbit,
  Globe,
  CloudRain,
  Wind,
  Infinity,
  ZapOff
} from 'lucide-react'
import { AVATAR_MAP } from '../../assets/avatars'

/**
 * THEME_CONFIG
 *
 * Provides fallback icons and gradient colors for tiers that do not have
 * established image assets yet.
 */
const THEME_CONFIG = {
  main: { colors: ['#e2b714', '#b8860b'], icon: Zap },
  pulse: { colors: ['#ff4e00', '#ff8500'], icon: Flame },
  tech: { colors: ['#00eeff', '#0088ff'], icon: Zap },
  glass: { colors: ['#ffffff', '#cccccc'], icon: Shield },
  dark: { colors: ['#444444', '#222222'], icon: Moon },
  neon: { colors: ['#00fff0', '#00cccc'], icon: Orbit },
  void: { colors: ['#b400ff', '#7a00cc'], icon: Ghost },
  ascended: { colors: ['#ffffff', '#f0f0f0'], icon: Crown },
  fire: { colors: ['#ff4e00', '#ff8500'], icon: Flame },
  blood: { colors: ['#8b0000', '#ff0000'], icon: Zap },
  sun: { colors: ['#ffcc00', '#ffee00'], icon: Sun },
  dragon: { colors: ['#ff4e00', '#8b0000'], icon: Flame },
  nature: { colors: ['#00ff88', '#008855'], icon: Globe },
  bolt: { colors: ['#00eeff', '#0088ff'], icon: Zap },
  ice: { colors: ['#00ccff', '#ccffff'], icon: CloudRain },
  abyss: { colors: ['#220044', '#440088'], icon: Moon },
  star: { colors: ['#ffffff', '#8888ff'], icon: Star },
  galaxy: { colors: ['#ff00ff', '#440088'], icon: Orbit },
  blackhole: { colors: ['#000000', '#222222'], icon: Orbit },
  time: { colors: ['#aaaaaa', '#ffffff'], icon: Infinity },
  diamond: { colors: ['#b9f2ff', '#ffffff'], icon: Shield },
  divine: { colors: ['#ffee00', '#ffffff'], icon: Crown },
  volcano: { colors: ['#ff4e00', '#220000'], icon: Flame },
  storm: { colors: ['#444444', '#0088ff'], icon: Wind },
  energy: { colors: ['#00ff00', '#ccff00'], icon: Sword },
  magic: { colors: ['#ff00ff', '#ffffff'], icon: Eye },
  eternal: { colors: ['#ff4e00', '#ffcc00'], icon: Infinity },
  omega: { colors: ['#000000', '#00ff00'], icon: ZapOff }
}

/**
 * UniversalAvatar
 *
 * Purpose:
 * - High-performance wrapper for user profile images.
 * - Handles rounded frames, consistent sizing, and glow effects.
 * - Robust Fallback: Prioritizes mapped images, falls back to tier-based icons.
 */
const UniversalAvatar = ({ avatarId, size, className = '', theme }) => {
  const [imgError, setImgError] = useState(false)
  const avatarSrc = AVATAR_MAP[avatarId]
  const config = THEME_CONFIG[theme] || { colors: ['#2c2e31', '#1a1a1a'], icon: Ghost }

  const showImage = avatarSrc && !imgError

  const containerStyle = {
    width: size || '100%',
    height: size || '100%',
    aspectRatio: '1 / 1',
    flexShrink: 0,
    minWidth: size || 'auto',
    minHeight: size || 'auto',
    position: 'relative',
    borderRadius: '50%',
    overflow: 'hidden',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: showImage
      ? 'rgba(255, 255, 255, 0.03)'
      : `linear-gradient(135deg, ${config.colors[0]}, ${config.colors[1]})`,
    border: theme
      ? `2px solid var(--theme-${theme}, rgba(255,255,255,0.05))`
      : '1px solid rgba(255,255,255,0.05)'
  }

  return (
    <div className={`universal-avatar-container ${className}`} style={containerStyle}>
      {avatarSrc && (
        <img
          src={avatarSrc}
          alt={`Avatar ${avatarId}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: showImage ? 'block' : 'none'
          }}
          onLoad={() => setImgError(false)}
          onError={() => setImgError(true)}
        />
      )}

      {!showImage && (
        <config.icon
          size={(typeof size === 'number' ? size : 40) * 0.55}
          color="#fff"
          style={{ opacity: 0.9 }}
        />
      )}
    </div>
  )
}

export default UniversalAvatar
