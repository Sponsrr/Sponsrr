import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vevntjayyvpzbpjpzwlm.supabase.co'
const supabaseKey = 'sb_publishable_-w8KeLJIpI5LLuNVCICuxA_MMG3YHBD'

export const supabase = createClient(supabaseUrl, supabaseKey)