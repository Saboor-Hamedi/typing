/**
 * utils/supabase
 *
 * Purpose:
 * - Initializes a Supabase client for auth and data operations in the renderer.
 *
 * Configuration:
 * - Uses Vite env overrides (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) when present,
 *   falling back to project defaults for development builds.
 *
 * Helpers:
 * - `getCurrentUser` returns the active authenticated user (or null).
 * - `signOut` ends the Supabase session safely.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://shzdlheswrasstwmwvig.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FtRC3jIu6VNBG1vBThjThg_d1o-VvrD'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const deleteUserData = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error

  const user = session?.user
  if (!user?.id) throw new Error('No active Supabase session found')

  const { error: scoresError } = await supabase
    .from('scores')
    .delete()
    .eq('user_id', user.id)

  if (scoresError) throw scoresError

  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id)

  if (profileError) throw profileError

  await supabase.auth.signOut()

  return { email: user.email }
}

export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user || null
}

export const signOut = async () => {
  await supabase.auth.signOut()
}
