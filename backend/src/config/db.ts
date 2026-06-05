import sqlite3 from 'sqlite3';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// Load environment variables (done in index.ts, but let's make sure we have access)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const useSupabase = SUPABASE_URL && SUPABASE_KEY;

let sqliteDb: sqlite3.Database | null = null;
let supabaseClient: any = null;

// Initialize Database connection
export async function initDatabase() {
  if (useSupabase) {
    console.log('Connecting to Supabase at:', SUPABASE_URL);
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Auto-seed admin users if they don't exist in Supabase
    try {
      await seedSupabaseAdmins();
    } catch (err) {
      console.error('Error seeding Supabase admins:', err);
    }
  } else {
    console.log('No Supabase credentials found. Falling back to local SQLite database...');
    const dbDir = path.resolve(__dirname, '../../data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = path.join(dbDir, 'finance.db');
    sqliteDb = new sqlite3.Database(dbPath);
    await setupSQLiteTables();
  }
}

async function seedSupabaseAdmins() {
  const adminMobile = '9999999999';
  const { data: existingAdmin, error } = await supabaseClient
    .from('users')
    .select('id')
    .eq('mobile_number', adminMobile)
    .maybeSingle();

  if (error) {
    console.log('Admin check returned error (tables might not exist yet):', error.message);
    return;
  }

  if (!existingAdmin) {
    const adminId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash('admin123', 10);
    const { error: insertErr } = await supabaseClient.from('users').insert({
      id: adminId,
      full_name: 'System Administrator',
      mobile_number: adminMobile,
      email: 'admin@dailyfinance.com',
      role: 'admin',
      status: 'approved',
      password_hash: passwordHash,
      created_at: new Date().toISOString()
    });
    if (insertErr) {
      console.error('Failed to seed default admin in Supabase:', insertErr);
    } else {
      console.log('Seeded default admin user to Supabase.');
    }
  }

  // Seed or update custom admin account if email is provided
  const customAdminEmail = 'Dakshinamurthydialyfinance@gmail.com';
  const passwordHashCustom = await bcrypt.hash('Yeshu2414', 10);
  const { data: existingCustomAdmin } = await supabaseClient
    .from('users')
    .select('id')
    .eq('email', customAdminEmail)
    .maybeSingle();

  if (existingCustomAdmin) {
    // Update the password hash to keep it synced with 'Yeshu2414'
    const { error: updateErr } = await supabaseClient
      .from('users')
      .update({ password_hash: passwordHashCustom, status: 'approved', role: 'admin' })
      .eq('email', customAdminEmail);
    if (updateErr) {
      console.error('Failed to update custom admin password in Supabase:', updateErr);
    } else {
      console.log('Synchronized custom admin password hash in Supabase.');
    }
  } else {
    const customAdminId = crypto.randomUUID();
    const { error: insertErr } = await supabaseClient.from('users').insert({
      id: customAdminId,
      full_name: 'Dakshinamurthy Finance Admin',
      mobile_number: '8888888888',
      email: customAdminEmail,
      role: 'admin',
      status: 'approved',
      password_hash: passwordHashCustom,
      created_at: new Date().toISOString()
    });
    if (insertErr) {
      console.error('Failed to seed custom admin in Supabase:', insertErr);
    } else {
      console.log('Seeded custom admin user to Supabase.');
    }
  }
}

// Setup local SQLite tables and preseed admin
function runSqlAsync(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!sqliteDb) return reject(new Error('SQLite database not initialized'));
    sqliteDb.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getSqlAsync(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!sqliteDb) return reject(new Error('SQLite database not initialized'));
    sqliteDb.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allSqlAsync(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    if (!sqliteDb) return reject(new Error('SQLite database not initialized'));
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function setupSQLiteTables() {
  // Users Table
  await runSqlAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      mobile_number TEXT UNIQUE NOT NULL,
      email TEXT,
      occupation TEXT,
      shop_name TEXT,
      address TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL,
      aadhaar_url TEXT,
      avatar_url TEXT,
      created_at TEXT NOT NULL
    )
  `);

  try {
    await runSqlAsync('ALTER TABLE users ADD COLUMN avatar_url TEXT');
  } catch (err) {
    // Ignore error if column already exists
  }

  // Loans Table
  await runSqlAsync(`
    CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      approved_amount REAL NOT NULL,
      platform_charges REAL NOT NULL,
      amount_disbursed REAL NOT NULL,
      daily_installment REAL NOT NULL,
      duration_days INTEGER NOT NULL,
      total_repayment REAL NOT NULL,
      remaining_balance REAL NOT NULL,
      status TEXT NOT NULL,
      approval_date TEXT,
      completion_date TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(customer_id) REFERENCES users(id)
    )
  `);

  // Installments Table
  await runSqlAsync(`
    CREATE TABLE IF NOT EXISTS installments (
      id TEXT PRIMARY KEY,
      loan_id TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL,
      payment_date TEXT,
      transaction_id TEXT,
      proof_url TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(loan_id) REFERENCES loans(id)
    )
  `);

  try {
    await runSqlAsync('ALTER TABLE installments ADD COLUMN transaction_id TEXT');
  } catch (err) {}
  try {
    await runSqlAsync('ALTER TABLE installments ADD COLUMN proof_url TEXT');
  } catch (err) {}

  // Settings Table
  await runSqlAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // Seed default QR code setting if not exists
  const defaultQrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=dakshinamurthy@ybl%26pn=Dakshinamurthy%20Daily%20Finance';
  try {
    const existingQr = await getSqlAsync("SELECT value FROM settings WHERE key = 'upi_qr_url'");
    if (!existingQr) {
      await runSqlAsync("INSERT INTO settings (key, value) VALUES ('upi_qr_url', ?)", [defaultQrUrl]);
      console.log('Seeded default UPI QR Code URL.');
    }
  } catch (err) {
    console.error('Error seeding settings:', err);
  }

  // Notifications Table
  await runSqlAsync(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Seed default admin account if not exists
  const adminMobile = '9999999999';
  const existingAdmin = await getSqlAsync('SELECT id FROM users WHERE mobile_number = ?', [adminMobile]);
  if (!existingAdmin) {
    const adminId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash('admin123', 10);
    await runSqlAsync(`
      INSERT INTO users (id, full_name, mobile_number, email, role, status, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [adminId, 'System Administrator', adminMobile, 'admin@dailyfinance.com', 'admin', 'approved', passwordHash, new Date().toISOString()]);
    console.log('Seeded default admin user:');
    console.log('  Mobile: 9999999999');
    console.log('  Password: admin123');
  }

  // Seed custom admin account if not exists
  const customAdminEmail = 'Dakshinamurthydialyfinance@gmail.com';
  const existingCustomAdmin = await getSqlAsync('SELECT id FROM users WHERE email = ?', [customAdminEmail]);
  const passwordHashCustom = await bcrypt.hash('Yeshu2414', 10);
  
  if (existingCustomAdmin) {
    // Update password hash to make sure it matches 'Yeshu2414'
    await runSqlAsync('UPDATE users SET password_hash = ?, status = ?, role = ? WHERE email = ?', [passwordHashCustom, 'approved', 'admin', customAdminEmail]);
    console.log('Synchronized custom admin password hash in SQLite.');
  } else {
    const customAdminId = crypto.randomUUID();
    await runSqlAsync(`
      INSERT INTO users (id, full_name, mobile_number, email, role, status, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [customAdminId, 'Dakshinamurthy Finance Admin', '8888888888', customAdminEmail, 'admin', 'approved', passwordHashCustom, new Date().toISOString()]);
    console.log('Seeded custom admin user:');
    console.log('  Email: Dakshinamurthydialyfinance@gmail.com');
    console.log('  Password: Yeshu2414');
  }
}

// Unified DB Repository Functions
export const db = {
  // --- USERS ---
  async getUserByMobile(mobile: string) {
    if (useSupabase) {
      const { data, error } = await supabaseClient.from('users').select('*').eq('mobile_number', mobile).maybeSingle();
      if (error) throw error;
      return data;
    } else {
      return await getSqlAsync('SELECT * FROM users WHERE mobile_number = ?', [mobile]);
    }
  },

  async getUserByEmail(email: string) {
    if (useSupabase) {
      // Use ilike for case-insensitive email lookup
      const { data, error } = await supabaseClient.from('users').select('*').ilike('email', email).maybeSingle();
      if (error) throw error;
      return data;
    } else {
      return await getSqlAsync('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    }
  },

  async getUserById(id: string) {
    if (useSupabase) {
      const { data, error } = await supabaseClient.from('users').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    } else {
      return await getSqlAsync('SELECT * FROM users WHERE id = ?', [id]);
    }
  },

  async createUser(userData: any) {
    const id = userData.id || crypto.randomUUID();
    const createdAt = userData.created_at || new Date().toISOString();
    const userToInsert = { ...userData, id, created_at: createdAt };
    
    if (useSupabase) {
      const { data, error } = await supabaseClient.from('users').insert([userToInsert]).select().single();
      if (error) throw error;
      return data;
    } else {
      await runSqlAsync(`
        INSERT INTO users (id, full_name, mobile_number, email, occupation, shop_name, address, password_hash, role, status, aadhaar_url, avatar_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, userData.full_name, userData.mobile_number, userData.email || null, userData.occupation || null, userData.shop_name || null, userData.address || null, userData.password_hash, userData.role, userData.status, userData.aadhaar_url || null, userData.avatar_url || null, createdAt]);
      return userToInsert;
    }
  },

  async getUsers(filters: { status?: string; role?: string } = {}) {
    if (useSupabase) {
      let query = supabaseClient.from('users').select('*');
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.role) query = query.eq('role', filters.role);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    } else {
      let sql = 'SELECT * FROM users WHERE 1=1';
      const params: any[] = [];
      if (filters.status) {
        sql += ' AND status = ?';
        params.push(filters.status);
      }
      if (filters.role) {
        sql += ' AND role = ?';
        params.push(filters.role);
      }
      sql += ' ORDER BY created_at DESC';
      return await allSqlAsync(sql, params);
    }
  },

  async updateUserStatus(id: string, status: string) {
    if (useSupabase) {
      const { data, error } = await supabaseClient.from('users').update({ status }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } else {
      await runSqlAsync('UPDATE users SET status = ? WHERE id = ?', [status, id]);
      return await this.getUserById(id);
    }
  },

  async updateUser(id: string, updateFields: any) {
    if (useSupabase) {
      try {
        const { data, error } = await supabaseClient.from('users').update(updateFields).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } catch (err: any) {
        // If column avatar_url is missing (Postgres error 42703 or message contains avatar_url)
        if ((err.code === '42703' || String(err.message || '').includes('avatar_url')) && 'avatar_url' in updateFields) {
          console.warn('Supabase users table does not have avatar_url column. Retrying update without avatar_url...');
          const { avatar_url, ...restFields } = updateFields;
          const { data, error } = await supabaseClient.from('users').update(restFields).eq('id', id).select().single();
          if (error) throw error;
          return { ...data, avatar_url }; // Return avatar_url to the client anyway for in-memory session display
        }
        throw err;
      }
    } else {
      const keys = Object.keys(updateFields);
      if (keys.length === 0) return this.getUserById(id);
      const sets = keys.map(k => `${k} = ?`).join(', ');
      const params = Object.values(updateFields);
      params.push(id);
      await runSqlAsync(`UPDATE users SET ${sets} WHERE id = ?`, params);
      return await this.getUserById(id);
    }
  },

  // --- LOANS ---
  async getActiveLoanByCustomerId(customerId: string) {
    if (useSupabase) {
      const { data, error } = await supabaseClient.from('loans')
        .select('*')
        .eq('customer_id', customerId)
        .in('status', ['Active', 'Pending'])
        .maybeSingle();
      if (error) throw error;
      return data;
    } else {
      return await getSqlAsync("SELECT * FROM loans WHERE customer_id = ? AND status IN ('Active', 'Pending')", [customerId]);
    }
  },

  async getLoanById(id: string) {
    if (useSupabase) {
      const { data, error } = await supabaseClient.from('loans').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    } else {
      return await getSqlAsync('SELECT * FROM loans WHERE id = ?', [id]);
    }
  },

  async getLoansByCustomerId(customerId: string) {
    if (useSupabase) {
      const { data, error } = await supabaseClient.from('loans')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      return await allSqlAsync('SELECT * FROM loans WHERE customer_id = ? ORDER BY created_at DESC', [customerId]);
    }
  },

  async createLoan(loanData: any) {
    const id = loanData.id || crypto.randomUUID();
    const createdAt = loanData.created_at || new Date().toISOString();
    const loanToInsert = { ...loanData, id, created_at: createdAt };

    if (useSupabase) {
      const { data, error } = await supabaseClient.from('loans').insert([loanToInsert]).select().single();
      if (error) throw error;
      return data;
    } else {
      await runSqlAsync(`
        INSERT INTO loans (id, customer_id, approved_amount, platform_charges, amount_disbursed, daily_installment, duration_days, total_repayment, remaining_balance, status, approval_date, completion_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, loanData.customer_id, loanData.approved_amount, loanData.platform_charges, loanData.amount_disbursed,
        loanData.daily_installment, loanData.duration_days, loanData.total_repayment, loanData.remaining_balance,
        loanData.status, loanData.approval_date || null, loanData.completion_date || null, createdAt
      ]);
      return loanToInsert;
    }
  },

  async updateLoanStatus(id: string, status: string, additionalFields: any = {}) {
    const updates = { status, ...additionalFields };
    if (useSupabase) {
      const { data, error } = await supabaseClient.from('loans').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } else {
      const keys = Object.keys(updates);
      const sets = keys.map(k => `${k} = ?`).join(', ');
      const params = Object.values(updates);
      params.push(id);
      await runSqlAsync(`UPDATE loans SET ${sets} WHERE id = ?`, params);
      return await this.getLoanById(id);
    }
  },

  async getLoans(filters: { status?: string; search?: string; sort?: string } = {}) {
    if (useSupabase) {
      let query = supabaseClient.from('loans').select('*, customer:users(*)');
      if (filters.status) query = query.eq('status', filters.status);
      
      const { data, error } = await query;
      if (error) throw error;

      // Handle search/sorting in memory if database complex bindings are bypassed
      let result = data || [];
      if (filters.search) {
        const s = filters.search.toLowerCase();
        result = result.filter((l: any) => 
          l.id.toLowerCase().includes(s) || 
          l.customer?.full_name?.toLowerCase().includes(s) || 
          l.customer?.mobile_number?.includes(s)
        );
      }
      if (filters.sort) {
        if (filters.sort === 'highest') {
          result.sort((a: any, b: any) => b.approved_amount - a.approved_amount);
        } else if (filters.sort === 'lowest') {
          result.sort((a: any, b: any) => a.approved_amount - b.approved_amount);
        }
      }
      return result;
    } else {
      let sql = `
        SELECT l.*, u.full_name as customer_name, u.mobile_number as customer_mobile
        FROM loans l
        JOIN users u ON l.customer_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];
      if (filters.status) {
        sql += ' AND l.status = ?';
        params.push(filters.status);
      }
      if (filters.search) {
        sql += ' AND (l.id LIKE ? OR u.full_name LIKE ? OR u.mobile_number LIKE ?)';
        const like = `%${filters.search}%`;
        params.push(like, like, like);
      }
      if (filters.sort === 'highest') {
        sql += ' ORDER BY l.approved_amount DESC';
      } else if (filters.sort === 'lowest') {
        sql += ' ORDER BY l.approved_amount ASC';
      } else {
        sql += ' ORDER BY l.created_at DESC';
      }
      const rows = await allSqlAsync(sql, params);
      return rows.map((r: any) => ({
        ...r,
        customer: {
          id: r.customer_id,
          full_name: r.customer_name,
          mobile_number: r.customer_mobile
        }
      }));
    }
  },

  // --- INSTALLMENTS ---
  async createInstallments(installmentsList: any[]) {
    if (useSupabase) {
      const { data, error } = await supabaseClient.from('installments').insert(installmentsList);
      if (error) throw error;
      return data;
    } else {
      for (const inst of installmentsList) {
        const id = inst.id || crypto.randomUUID();
        const createdAt = inst.created_at || new Date().toISOString();
        await runSqlAsync(`
          INSERT INTO installments (id, loan_id, due_date, status, payment_date, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [id, inst.loan_id, inst.due_date, inst.status, inst.payment_date || null, createdAt]);
      }
      return installmentsList;
    }
  },

  async getInstallmentsByLoanId(loanId: string) {
    if (useSupabase) {
      const { data, error } = await supabaseClient.from('installments')
        .select('*')
        .eq('loan_id', loanId)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data;
    } else {
      return await allSqlAsync('SELECT * FROM installments WHERE loan_id = ? ORDER BY due_date ASC', [loanId]);
    }
  },

  async getInstallmentById(id: string) {
    if (useSupabase) {
      const { data, error } = await supabaseClient.from('installments').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    } else {
      return await getSqlAsync('SELECT * FROM installments WHERE id = ?', [id]);
    }
  },

  async markInstallmentPaid(id: string, paymentDate: string) {
    if (useSupabase) {
      const { data, error } = await supabaseClient.from('installments')
        .update({ status: 'Paid', payment_date: paymentDate })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      await runSqlAsync("UPDATE installments SET status = 'Paid', payment_date = ? WHERE id = ?", [paymentDate, id]);
      return await this.getInstallmentById(id);
    }
  },

  async submitInstallmentProof(id: string, transactionId: string, proofUrl: string) {
    const updateFields = {
      status: 'Pending',
      transaction_id: transactionId,
      proof_url: proofUrl
    };
    if (useSupabase) {
      // First, try to update with all fields (transaction_id + proof_url + status)
      try {
        const { data, error } = await supabaseClient.from('installments')
          .update(updateFields)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } catch (err: any) {
        // ANY error from the full update → fall back to status-only update
        // (columns transaction_id / proof_url may not exist in the Supabase table)
        console.warn('submitInstallmentProof: full update failed, falling back to status-only update.', err?.message || err?.code || err);
        try {
          const { data, error: fallbackError } = await supabaseClient.from('installments')
            .update({ status: 'Pending' })
            .eq('id', id)
            .select()
            .single();
          if (fallbackError) throw fallbackError;
          // Merge the proof info in-memory so callers still have access to it
          return { ...data, transaction_id: transactionId, proof_url: proofUrl };
        } catch (fallbackErr: any) {
          console.error('submitInstallmentProof: fallback status-only update also failed:', fallbackErr?.message || fallbackErr);
          throw fallbackErr;
        }
      }
    } else {
      try {
        await runSqlAsync("UPDATE installments SET status = 'Pending', transaction_id = ?, proof_url = ? WHERE id = ?", [transactionId, proofUrl, id]);
      } catch (err: any) {
        // SQLite may not have these columns yet — fall back to status only
        console.warn('submitInstallmentProof SQLite: falling back to status-only update.', err?.message);
        await runSqlAsync("UPDATE installments SET status = 'Pending' WHERE id = ?", [id]);
      }
      return await this.getInstallmentById(id);
    }
  },


  async getSetting(key: string, defaultValue: string = '') {
    if (useSupabase) {
      try {
        const { data, error } = await supabaseClient.from('settings').select('value').eq('key', key).maybeSingle();
        if (error) throw error;
        return data?.value || defaultValue;
      } catch (err: any) {
        console.warn(`Failed to fetch setting ${key} from Supabase. Using default:`, err.message || err);
        return defaultValue;
      }
    } else {
      try {
        const row = await getSqlAsync('SELECT value FROM settings WHERE key = ?', [key]);
        return row ? row.value : defaultValue;
      } catch (err) {
        return defaultValue;
      }
    }
  },

  async updateSetting(key: string, value: string) {
    if (useSupabase) {
      try {
        const { data, error } = await supabaseClient.from('settings').upsert({ key, value }).select().single();
        if (error) throw error;
        return data;
      } catch (err: any) {
        console.error(`Failed to upsert setting ${key} in Supabase:`, err.message || err);
        throw err;
      }
    } else {
      const existing = await getSqlAsync('SELECT value FROM settings WHERE key = ?', [key]);
      if (existing) {
        await runSqlAsync('UPDATE settings SET value = ? WHERE key = ?', [value, key]);
      } else {
        await runSqlAsync('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
      }
      return { key, value };
    }
  },

  async getInstallmentsPaidToday() {
    const today = new Date().toISOString().split('T')[0];
    if (useSupabase) {
      const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];
      const { data, error } = await supabaseClient.from('installments')
        .select('*, loan:loans(*)')
        .eq('status', 'Paid')
        .gte('payment_date', today)
        .lt('payment_date', tomorrow);
      if (error) throw error;
      return data;
    } else {
      const sql = `
        SELECT i.*, l.daily_installment
        FROM installments i
        JOIN loans l ON i.loan_id = l.id
        WHERE i.status = 'Paid' AND i.payment_date LIKE ?
      `;
      const rows = await allSqlAsync(sql, [`${today}%`]);
      return rows.map((r: any) => ({
        ...r,
        loan: {
          daily_installment: r.daily_installment
        }
      }));
    }
  },

  // --- NOTIFICATIONS ---
  async getNotificationsByUserId(userId: string) {
    if (useSupabase) {
      const { data, error } = await supabaseClient.from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      return await allSqlAsync('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    }
  },

  async createNotification(userId: string, title: string, message: string, type: string) {
    const notif = {
      id: crypto.randomUUID(),
      user_id: userId,
      title,
      message,
      type,
      is_read: 0,
      created_at: new Date().toISOString()
    };
    if (useSupabase) {
      const { data, error } = await supabaseClient.from('notifications').insert([notif]).select().single();
      if (error) throw error;
      return data;
    } else {
      await runSqlAsync(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [notif.id, notif.user_id, notif.title, notif.message, notif.type, notif.is_read, notif.created_at]);
      return notif;
    }
  },

  async markNotificationRead(id: string) {
    if (useSupabase) {
      const { data, error } = await supabaseClient.from('notifications').update({ is_read: 1 }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } else {
      await runSqlAsync('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
      return await getSqlAsync('SELECT * FROM notifications WHERE id = ?', [id]);
    }
  },

  // --- ANALYTICS ---
  async getDashboardAnalytics() {
    if (useSupabase) {
      try {
        const { data: users, error: uErr } = await supabaseClient.from('users').select('*');
        if (uErr) throw uErr;
        const { data: loans, error: lErr } = await supabaseClient.from('loans').select('*');
        if (lErr) throw lErr;
        const instToday = await this.getInstallmentsPaidToday() || [];
        
        const activeLoans = loans?.filter((l: any) => l.status === 'Active') || [];
        const pendingLoans = loans?.filter((l: any) => l.status === 'Pending') || [];
        const completedLoans = loans?.filter((l: any) => l.status === 'Completed') || [];
        const totalCustomers = users?.filter((u: any) => u.role === 'customer').length || 0;

        const outstanding = activeLoans.reduce((sum: number, l: any) => sum + l.remaining_balance, 0);
        const todayCollection = instToday.reduce((sum: number, inst: any) => sum + (inst.loan?.daily_installment || 0), 0);

        // Overdue payments: Active loans where due date is passed and installment is unpaid
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: overdueInst, error: oErr } = await supabaseClient.from('installments')
          .select('*, loan:loans(*)')
          .eq('status', 'Unpaid')
          .lt('due_date', todayStr);
        if (oErr) throw oErr;
        const overduePaymentsCount = overdueInst?.length || 0;

        return {
          totalCustomers,
          activeLoansCount: activeLoans.length,
          completedLoansCount: completedLoans.length,
          pendingLoansCount: pendingLoans.length,
          todayCollection,
          todayRevenue: todayCollection * 0.1, // assuming 10% platform / interest yield factor for display
          todayProfit: todayCollection * 0.1, 
          monthlyRevenue: todayCollection * 3.1, // mock projection
          monthlyProfit: todayCollection * 3.1,
          outstandingAmount: outstanding,
          overduePaymentsCount
        };
      } catch (err: any) {
        console.warn('Supabase analytics fetch failed, falling back to local SQLite database:', err.message || err);
      }
    }

    // SQLite analytics fallback
    const totalCustomers = (await getSqlAsync("SELECT COUNT(*) as cnt FROM users WHERE role = 'customer'")).cnt;
    const activeLoansCount = (await getSqlAsync("SELECT COUNT(*) as cnt FROM loans WHERE status = 'Active'")).cnt;
    const completedLoansCount = (await getSqlAsync("SELECT COUNT(*) as cnt FROM loans WHERE status = 'Completed'")).cnt;
    const pendingLoansCount = (await getSqlAsync("SELECT COUNT(*) as cnt FROM loans WHERE status = 'Pending'")).cnt;
    const outstandingAmount = (await getSqlAsync("SELECT SUM(remaining_balance) as sum FROM loans WHERE status = 'Active'")).sum || 0;

    const today = new Date().toISOString().split('T')[0];
    // Today collections sum daily installments
    const todayCollectionResult = await getSqlAsync(`
      SELECT SUM(l.daily_installment) as sum
      FROM installments i
      JOIN loans l ON i.loan_id = l.id
      WHERE i.status = 'Paid' AND i.payment_date LIKE ?
    `, [`${today}%`]);
    const todayCollection = todayCollectionResult.sum || 0;

    // Platform charges collected today from newly approved active loans
    const platformChargesTodayResult = await getSqlAsync(`
      SELECT SUM(platform_charges) as sum
      FROM loans
      WHERE status = 'Active' AND approval_date LIKE ?
    `, [`${today}%`]);
    const todayRevenue = (platformChargesTodayResult.sum || 0) + (todayCollection * 0.1); // interest yield projection
    const todayProfit = platformChargesTodayResult.sum || 0; // standard setup charges are full profit

    // Monthly revenue sum platform charges + paid installments
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyPlatformCharges = (await getSqlAsync(`
      SELECT SUM(platform_charges) as sum FROM loans WHERE approval_date LIKE ?
    `, [`${currentMonth}%`])).sum || 0;
    const monthlyInstallments = (await getSqlAsync(`
      SELECT SUM(l.daily_installment) as sum
      FROM installments i
      JOIN loans l ON i.loan_id = l.id
      WHERE i.status = 'Paid' AND i.payment_date LIKE ?
    `, [`${currentMonth}%`])).sum || 0;

    // Overdue payments count
    const overduePaymentsCount = (await getSqlAsync(`
      SELECT COUNT(*) as cnt FROM installments WHERE status = 'Unpaid' AND due_date < ?
    `, [today])).cnt;

    return {
      totalCustomers,
      activeLoansCount,
      completedLoansCount,
      pendingLoansCount,
      todayCollection,
      todayRevenue,
      todayProfit,
      monthlyRevenue: monthlyPlatformCharges + monthlyInstallments,
      monthlyProfit: monthlyPlatformCharges,
      outstandingAmount,
      overduePaymentsCount
    };
  },

  async getPortfolioInstallments() {
    if (useSupabase) {
      const { data, error } = await supabaseClient.from('installments')
        .select('*, loan:loans(*, customer:users(*))')
        .in('status', ['Unpaid', 'Pending']);
      if (error) throw error;
      return data;
    } else {
      const sql = `
        SELECT i.*, l.daily_installment, l.customer_id, u.full_name as customer_name, u.mobile_number as customer_mobile
        FROM installments i
        JOIN loans l ON i.loan_id = l.id
        JOIN users u ON l.customer_id = u.id
        WHERE i.status IN ('Unpaid', 'Pending')
      `;
      const rows = await allSqlAsync(sql);
      return rows.map((r: any) => ({
        ...r,
        loan: {
          id: r.loan_id,
          daily_installment: r.daily_installment,
          customer_id: r.customer_id,
          customer: {
            id: r.customer_id,
            full_name: r.customer_name,
            mobile_number: r.customer_mobile
          }
        }
      }));
    }
  },

  async deleteUnpaidInstallments(loanId: string) {
    if (useSupabase) {
      const { data, error } = await supabaseClient.from('installments')
        .delete()
        .eq('loan_id', loanId)
        .eq('status', 'Unpaid');
      if (error) throw error;
      return data;
    } else {
      await runSqlAsync("DELETE FROM installments WHERE loan_id = ? AND status = 'Unpaid'", [loanId]);
      return { loanId };
    }
  }
};

