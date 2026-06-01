const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mfnbnpbuktgfqfcymtaz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbmJucGJ1a3RnZnFmY3ltdGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTM1MzIsImV4cCI6MjA5NTc2OTUzMn0.jRSLtfH_pEU6XDEY6UHsKNw52dn_B_jyqPOQYSecviI';

console.log('Testing connection to Supabase...');
console.log('URL:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runTest() {
  try {
    console.log('Fetching users table...');
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Error fetching users:', error);
    } else {
      console.log('Successfully fetched users! Row count:', data.length);
      console.log('Users:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Unhandled exception during test:', err);
  }
}

runTest();
