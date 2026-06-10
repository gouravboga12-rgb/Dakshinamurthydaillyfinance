const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mfnbnpbuktgfqfcymtaz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbmJucGJ1a3RnZnFmY3ltdGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDE5MzUzMiwiZXhwIjoyMDk1NzY5NTMyfQ.0ezC9ysDQXAD3zcQqKE9M5FWkKAVi5MNOIlBu7T8Psg';

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
