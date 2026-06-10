const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runTest() {
  try {
    const { data: users, error: usersErr } = await supabase.from('users').select('id, full_name, mobile_number');
    if (usersErr) {
      console.error(error);
      return;
    }
    const { data: loans, error: loansErr } = await supabase.from('loans').select('*');
    if (loansErr) {
      console.error(loansErr);
      return;
    }
    console.log('Users and their loans:');
    users.forEach(u => {
      const uLoans = loans.filter(l => l.customer_id === u.id);
      if (uLoans.length > 0) {
        console.log(`User: ${u.full_name} (${u.mobile_number}), ID: ${u.id}`);
        uLoans.forEach(l => {
          console.log(`  - Loan ID: ${l.id}, Status: ${l.status}, Approved Amount: ${l.approved_amount}, Daily: ${l.daily_installment}`);
        });
      }
    });
  } catch (err) {
    console.error('Unhandled exception:', err);
  }
}

runTest();
