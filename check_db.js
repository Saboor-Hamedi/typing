const Database = require('better-sqlite3')
const { join } = require('path')
const os = require('os')

// Standard Electron userData path for TypingZone
const dbPath = join(os.homedir(), 'AppData/Roaming/TypingZone/typingzone.db')
console.log('Checking database at:', dbPath)

try {
  const db = new Database(dbPath, { readonly: true })
  const rows = db.prepare('SELECT * FROM sentences ORDER BY id DESC LIMIT 5').all()
  console.log('Last 5 sentences in DB:')
  console.table(rows)

  const search = db.prepare('SELECT * FROM sentences WHERE text LIKE ?').all('%Saboor%')
  console.log('Search for "Saboor":')
  console.table(search)
} catch (e) {
  console.error('Failed to read DB:', e.message)
}
