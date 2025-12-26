
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read .env file
const envPath = path.join(__dirname, '.env')
let env = {}
try {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=')
        if (key && value) {
            env[key.trim()] = value.trim()
        }
    })
} catch (e) {
    console.log('Error reading .env', e)
}

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseKey = env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateAdminName() {
    console.log('Updating admin name to Ismerai...')

    // Update all users with role 'admin' to have name 'Ismerai'
    const { data, error } = await supabase
        .from('users')
        .update({ name: 'Ismerai' })
        .eq('role', 'admin')
        .select()

    if (error) {
        console.error('Error updating:', error)
    } else {
        console.log('Update successful, user updated:', data?.length)
    }
}

updateAdminName()
