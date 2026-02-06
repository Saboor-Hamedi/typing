import React from 'react'
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

const THEME_CONFIG = {
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
  omega: { colors: ['#000000', '#00ff00'], icon: ZapOff },
}

const UniversalAvatar = ({ avatarId, theme, size, className = '' }) => {
  const isPlaceholder = avatarId >= 9
  const config = THEME_CONFIG[theme] || { colors: ['#444', '#666'], icon: Ghost }
  
  // Use the image if available in AVATAR_MAP (even for placeholders)
  const avatarSrc = AVATAR_MAP[avatarId]

  const containerStyle = {
    width: size || '100%',
    height: size || '100%',
    position: 'relative',
    borderRadius: 'inherit',
    overflow: 'hidden',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }

  return (
    <div className={`universal-avatar-container ${className}`} style={containerStyle}>
      {avatarSrc ? (
        <img 
          src={avatarSrc} 
          alt="Avatar" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            display: 'block',
            borderRadius: 'inherit'
          }} 
        />
      ) : (
        <div 
          style={{ 
            width: '100%', 
            height: '100%', 
            background: `linear-gradient(135deg, ${config.colors[0]}, ${config.colors[1]})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'inherit'
          }}
        >
          <config.icon size={(typeof size === 'number' ? size : 40) * 0.6} color="#fff" />
        </div>
      )}
    </div>
  )
}

export default UniversalAvatar
