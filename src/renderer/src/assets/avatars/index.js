import avatar0 from './avatar_0.png'
import avatar1 from './avatar_1.png'
import avatar2 from './avatar_2.png'
import avatar3 from './avatar_3.png'
import avatar4 from './avatar_4.png'
import avatar5 from './avatar_5.png'
import avatar6 from './avatar_6.png'
import avatar7 from './avatar_7.png'
import avatar8 from './avatar_8.png'
import avatar9 from './avatar_9.png'
import avatar10 from './avatar_10.png'
import avatar11 from './avatar_11.png'
import avatar12 from './avatar_12.png'

// Registry of available images
export const AVATAR_MAP = {
  0: avatar0,
  1: avatar1,
  2: avatar2,
  3: avatar3,
  4: avatar4,
  5: avatar5,
  6: avatar6,
  7: avatar7,
  8: avatar8,
  9: avatar9,
  10: avatar10,
  11: avatar11,
  12: avatar12
}

// Dynamically fill remaining to avoid repetition but allow overrides
for (let i = 13; i <= 28; i++) {
  if (!AVATAR_MAP[i]) AVATAR_MAP[i] = null // Set to null so UniversalAvatar knows to use icon fallback
}

export const AVATAR_DEFS = [
  { id: 0, name: 'Default', level: 0, theme: 'neutral' },
  { id: 1, name: 'The Core', level: 1, theme: 'main' },
  { id: 2, name: 'The Pulse', level: 5, theme: 'pulse' },
  { id: 3, name: 'Tactical Edge', level: 10, theme: 'tech' },
  { id: 4, name: 'Expert Shards', level: 20, theme: 'glass' },
  { id: 5, name: 'Dark Master', level: 30, theme: 'dark' },
  { id: 6, name: 'Neon Specter', level: 40, theme: 'neon' },
  { id: 7, name: 'Void Walker', level: 50, theme: 'void' },
  { id: 8, name: 'Ascended Zero', level: 60, theme: 'ascended' },
  { id: 9, name: 'Ember Soul', level: 70, theme: 'fire' },
  { id: 10, name: 'Crimson Fury', level: 80, theme: 'blood' },
  { id: 11, name: 'Solar Flare', level: 90, theme: 'sun' },
  { id: 12, name: 'Dragon Breath', level: 100, theme: 'dragon' },
  { id: 13, name: 'Ancient Serpent', level: 115, theme: 'nature' },
  { id: 14, name: 'Thunder God', level: 130, theme: 'bolt' },
  { id: 15, name: 'Glacial Knight', level: 145, theme: 'ice' },
  { id: 16, name: 'Shadow Stalker', level: 160, theme: 'abyss' },
  { id: 17, name: 'Celestial Warden', level: 175, theme: 'star' },
  { id: 18, name: 'Nebula Phoenix', level: 190, theme: 'galaxy' },
  { id: 19, name: 'Void Archon', level: 205, theme: 'blackhole' },
  { id: 20, name: 'Chrono Master', level: 220, theme: 'time' },
  { id: 21, name: 'Diamond Aegis', level: 240, theme: 'diamond' },
  { id: 22, name: 'Astral Sovereign', level: 260, theme: 'divine' },
  { id: 23, name: 'Inferno Titan', level: 280, theme: 'volcano' },
  { id: 24, name: 'Storm King', level: 300, theme: 'storm' },
  { id: 25, name: 'Ethereal Blade', level: 325, theme: 'energy' },
  { id: 26, name: 'Mystic Oracle', level: 350, theme: 'magic' },
  { id: 27, name: 'Eternal Flame', level: 375, theme: 'eternal' },
  { id: 28, name: 'Omega Prime', level: 400, theme: 'omega' }
]
