
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://shzdlheswrasstwmwvig.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FtRC3jIu6VNBG1vBThjThg_d1o-VvrD'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user || null
}

export const signOut = async () => {
  await supabase.auth.signOut()
}
