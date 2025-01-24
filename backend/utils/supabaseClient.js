import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config(); // Explicitly load environment variables here

// Use the environment variables from your .env file
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Throw an error if either value is missing
if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL or SUPABASE_KEY is missing from the environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('Supabase client initialized successfully:', supabase);

console.log('SUPABASE_URL in supabaseClient:', process.env.SUPABASE_URL || 'Not loaded');
console.log('SUPABASE_KEY in supabaseClient:', process.env.SUPABASE_KEY || 'Not loaded');
export default supabase;