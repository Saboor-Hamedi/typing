import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'

let db

/**
 * Initialize the SQLite database and run migrations/seeding
 */
export function initDatabase() {
  try {
    const dbPath = join(app.getPath('userData'), 'typingzone.db')
    console.log('Initializing database at:', dbPath)
    
    db = new Database(dbPath)

    // 1. Create Sentences Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS sentences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        source TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_difficulty ON sentences(difficulty);

      -- FTS5 Virtual Table for millions-scale search
      CREATE VIRTUAL TABLE IF NOT EXISTS sentences_fts USING fts5(
        text,
        content='sentences',
        content_rowid='id'
      );

      -- Triggers to keep FTS in sync
      CREATE TRIGGER IF NOT EXISTS sentences_ai AFTER INSERT ON sentences BEGIN
        INSERT INTO sentences_fts(rowid, text) VALUES (new.id, new.text);
      END;
      CREATE TRIGGER IF NOT EXISTS sentences_ad AFTER DELETE ON sentences BEGIN
        INSERT INTO sentences_fts(sentences_fts, rowid, text) VALUES('delete', old.id, old.text);
      END;
      CREATE TRIGGER IF NOT EXISTS sentences_au AFTER UPDATE ON sentences BEGIN
        INSERT INTO sentences_fts(sentences_fts, rowid, text) VALUES('delete', old.id, old.text);
        INSERT INTO sentences_fts(rowid, text) VALUES (new.id, new.text);
      END;
    `)

    // 2. Initial Seeding if empty
    const countQuery = db.prepare('SELECT COUNT(*) as count FROM sentences').get()
    const ftsCountQuery = db.prepare('SELECT COUNT(*) as count FROM sentences_fts').get()

    if (countQuery.count === 0) {
      seedInitialData()
    } else if (countQuery.count !== ftsCountQuery.count) {
      // Automatic Re-indexing if out of sync
      console.log(`[DB] FTS Sync Issue detected (${countQuery.count} vs ${ftsCountQuery.count}). Rebuilding index...`)
      db.exec(`
        DELETE FROM sentences_fts;
        INSERT INTO sentences_fts(rowid, text) SELECT id, text FROM sentences;
      `)
      console.log('[DB] FTS Index rebuilt.')
    }

    return true
  } catch (error) {
    console.error('Database initialization failed:', error)
    return false
  }
}

/**
 * Seed initial sentences from words.json
 */
function seedInitialData() {
  try {
    // We'll look for words.json in the resources or app path
    // During dev, it's in src/renderer/src/assets/words.json
    // But since this is Main Process, we can define a robust way to find it
    // For now, we'll try to resolve it relative to the executable or source
    
    let wordsData
    // Enhanced path resolution for both dev and production
    const searchPaths = [
      join(app.getAppPath(), 'src/renderer/src/assets/words.json'), // Source dev
      join(app.getAppPath(), 'out/renderer/assets/words.json'),     // Build output
      join(process.resourcesPath, 'app.asar.unpacked/src/renderer/src/assets/words.json'), // Unpacked asar
      join(process.resourcesPath, 'src/renderer/src/assets/words.json') // Resources folder
    ]
    
    let finalPath = searchPaths.find(p => fs.existsSync(p))

    if (!finalPath) {
      console.warn('Could not find words.json for seeding. Searching in:', searchPaths)
      return
    }

    try {
      const rawData = fs.readFileSync(finalPath, 'utf8')
      wordsData = JSON.parse(rawData)
    } catch (e) {
      console.error('Failed to parse words.json:', e)
      return
    }

    const insert = db.prepare(`
      INSERT INTO sentences (text, difficulty, category) 
      VALUES (@text, @difficulty, @category)
    `)

    const insertMany = db.transaction((sentences) => {
      for (const s of sentences) {
        insert.run(s)
      }
    })

    const payload = []
    
    // Process easy, medium, hard
    const difficulties = ['easy', 'medium', 'hard']
    difficulties.forEach(diff => {
      if (wordsData.sentences && wordsData.sentences[diff]) {
        wordsData.sentences[diff].forEach(text => {
          payload.push({ text, difficulty: diff, category: 'general' })
        })
      }
    })

    if (payload.length > 0) {
      insertMany(payload)
      console.log(`Seeded ${payload.length} sentences into database.`)
    }
  } catch (error) {
    console.error('Seeding failed:', error)
  }
}

/**
 * Get a random sentence from the database
 * Optimized for millions of rows (Phase 3)
 * @param {string} difficulty - 'easy', 'medium' or 'hard'
 */
export function getRandomSentence(difficulty = 'medium') {
  try {
    if (!db) return null
    // Phase 3: Optimized Selection
    const stats = db.prepare(`
      SELECT COUNT(*) as count, MIN(id) as minId, MAX(id) as maxId 
      FROM sentences 
      WHERE difficulty = ?
    `).get(difficulty)

    if (!stats || stats.count === 0) return null

    // Pick a random spot in the ID range
    const targetId = Math.floor(Math.random() * (stats.maxId - stats.minId + 1)) + stats.minId
    
    // Find first available record >= targetId
    const result = db.prepare(`
      SELECT text FROM sentences 
      WHERE difficulty = ? AND id >= ? 
      ORDER BY id ASC LIMIT 1
    `).get(difficulty, targetId) || db.prepare(`
      SELECT text FROM sentences 
      WHERE difficulty = ? LIMIT 1
    `).get(difficulty)

    return result ? result.text : null
  } catch (error) {
    console.error('Failed to get random sentence:', error)
    return null
  }
}

/**
 * Add a new sentence to the database
 */
export function addSentence(text, difficulty = 'medium', category = 'general') {
  try {
    if (!db) return null
    const stmt = db.prepare(`
      INSERT INTO sentences (text, difficulty, category) 
      VALUES (?, ?, ?)
    `)
    const info = stmt.run(text, difficulty, category)
    return info.lastInsertRowid
  } catch (error) {
    console.error('Failed to add sentence:', error)
    return null
  }
}

/**
 * Get multiple sentences (Optimized Phase 3)
 */
export function getSentences(difficulty = 'medium', limit = 10) {
  try {
    if (!db) return []
    // We'll use a slightly different "Skip" approach for variety at scale
    const stats = db.prepare('SELECT COUNT(*) as count FROM sentences WHERE difficulty = ?').get(difficulty)
    if (!stats || stats.count === 0) return []

    const maxOffset = Math.max(0, stats.count - limit)
    const randomOffset = Math.floor(Math.random() * maxOffset)

    const stmt = db.prepare(`
      SELECT text FROM sentences 
      WHERE difficulty = ? 
      LIMIT ? OFFSET ?
    `)
    return stmt.all(difficulty, limit, randomOffset).map(r => r.text)
  } catch (error) {
    console.error('Failed to get sentences:', error)
    return []
  }
}

/**
 * Search sentences using FTS5 (Phase 3)
 * @param {string} query - The search term
 */
export function searchSentences(query, limit = 20) {
  try {
    if (!db) {
      console.warn('[DB] Search attempted while database is offline.')
      return []
    }
    const trimmed = query?.trim()
    console.log(`[DB] Search request for: "${trimmed}"`)
    if (!trimmed) return []

    // Secret Diagnostics: !!rebuild (Destructive Recovery)
    if (trimmed === '!!rebuild') {
      console.log('[DB] Destructive Index Rebuild Triggered...')
      db.exec(`
        DROP TABLE IF EXISTS sentences_fts;
        CREATE VIRTUAL TABLE sentences_fts USING fts5(
          text,
          content='sentences',
          content_rowid='id'
        );
        INSERT INTO sentences_fts(rowid, text) SELECT id, text FROM sentences;
      `)
      const count = db.prepare('SELECT COUNT(*) as count FROM sentences').get().count
      console.log(`[DB] Rebuild complete. Total sentences: ${count}`)
      return [{ 
        text: `Search Index Reset! Found ${count} sentences in total.`, 
        id: -1, 
        category: 'System Recovery',
        onSelect: () => {}
      }]
    }

    // Secret Diagnostics: !!test (Verification)
    if (trimmed === '!!test') {
        const testText = "DIAGNOSTIC_TEST_" + Date.now()
        db.prepare('INSERT INTO sentences (text, difficulty) VALUES (?, ?)').run(testText, 'easy')
        const searchRes = db.prepare('SELECT rowid FROM sentences_fts WHERE sentences_fts MATCH ?').all(testText)
        return [{ 
          text: `Sync Test: DB Insert OK. FTS Find: ${searchRes.length > 0 ? 'SUCCESS' : 'FAILED'}`, 
          id: -2, 
          category: 'System Diagnostics',
          onSelect: () => {}
        }]
    }

    const tokens = trimmed.toLowerCase().split(/\s+/).filter(t => t.length > 0)
    if (tokens.length === 0) return []

    // 1. TIER 1: High-Performance FTS5
    const ftsQuery = tokens.map(t => `${t}*`).join(' OR ')
    console.log(`[DB] FTS Query: "${ftsQuery}"`)

    try {
      const results = db.prepare(`
        SELECT s.text, s.difficulty, s.category, s.id
        FROM sentences s
        INNER JOIN sentences_fts f ON s.id = f.rowid
        WHERE sentences_fts MATCH ?
        ORDER BY rank
        LIMIT ?
      `).all(ftsQuery, limit)

      if (results.length > 0) {
        console.log(`[DB] FTS Success: ${results.length} matches.`)
        return results
      }
    } catch (e) {
      console.warn('[DB] FTS Query Failed:', e.message)
    }

    // 2. TIER 2: Guaranteed Fallback (Multi-word LIKE scan)
    console.log(`[DB] TIER 1 returned 0. Using Deep Scan Fallback...`)
    const patterns = tokens.map(t => `%${t}%`)
    const conditions = tokens.map(() => 'text LIKE ?').join(' AND ')
    
    const results = db.prepare(`
        SELECT text, difficulty, category, id
        FROM sentences
        WHERE ${conditions}
        ORDER BY id DESC
        LIMIT ?
    `).all(...patterns, limit)

    console.log(`[DB] Deep Scan Found: ${results.length} results.`)
    return results
  } catch (error) {
    console.error('[DB] Global Search Engine Crash:', error)
    return []
  }
}
