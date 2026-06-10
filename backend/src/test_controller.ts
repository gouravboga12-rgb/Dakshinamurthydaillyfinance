import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { getLoanHistory } from './controllers/customerController';
import { db, initDatabase } from './config/db';

async function test() {
  await initDatabase();
  
  const req = {
    user: { id: 'bfdb41bd-7a5f-4848-a614-86debee66da2' }, // Sourav's user ID
  } as any;

  const res = {
    status: (code: number) => {
      console.log('Response status:', code);
      return res;
    },
    json: (data: any) => {
      console.log('Response json:', JSON.stringify(data, null, 2));
      return res;
    }
  } as any;

  console.log('Calling getLoanHistory...');
  await getLoanHistory(req, res);
}

test();
