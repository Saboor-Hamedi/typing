export const calculateLevel = (history) => {
  // Each test gives: Base (20) + Performance (WPM * Accuracy%)
  const experience = Math.round(history.reduce((acc, curr) => {
    return acc + 20 + (curr.wpm * (curr.accuracy / 100))
  }, 0))

  // Level formula: Level 1 = 0 XP, Level 2 = 100 XP, Level n = (n-1)^2 * 100
  const level = Math.floor(Math.sqrt(experience / 100)) + 1
  
  const currentLevelXP = Math.pow(level - 1, 2) * 100
  const nextLevelXP = Math.pow(level, 2) * 100
  const levelProgress = Math.max(2, Math.min(100, ((experience - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100))
  const xpToNext = nextLevelXP - experience

  return {
    experience,
    level,
    levelProgress,
    xpToNext,
    currentLevelXP,
    nextLevelXP
  }
}

export const levelFromXP = (experience) => {
  const level = Math.floor(Math.sqrt(experience / 100)) + 1
  const currentLevelXP = Math.pow(level - 1, 2) * 100
  const nextLevelXP = Math.pow(level, 2) * 100
  const levelProgress = Math.max(2, Math.min(100, ((experience - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100))
  const xpToNext = nextLevelXP - experience

  return {
    experience,
    level,
    levelProgress,
    xpToNext,
    currentLevelXP,
    nextLevelXP
  }
}
