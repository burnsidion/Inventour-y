import dotenv from 'dotenv';
dotenv.config();

console.log('SUPABASE_URL:', process.env.SUPABASE_URL || 'Not loaded');
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY || 'Not loaded');