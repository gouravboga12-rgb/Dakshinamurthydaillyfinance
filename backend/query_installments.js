const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data: insts, error } = await supabase
    .from('installments')
    .select('*')
    .eq('loan_id', 'cd9531cb-22ad-479c-bdb3-ad83cba0b51b')
    .order('due_date', { ascending: true });

  if (error) {
    console.error(error);
    return;
  }
  console.log('Installments for active loan:');
  insts.forEach((ins, i) => {
    console.log(`Day ${i+1}: ID=${ins.id}, Due=${ins.due_date}, Status=${ins.status}, PaidAt=${ins.payment_date}`);
  });
}
run();
