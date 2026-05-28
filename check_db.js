import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRecords() {
  const { data, error } = await supabase.from('listings').select('*');
  if (error) console.error(error);
  else {
    console.log(`Found ${data.length} records in Supabase.`);
    let availableCount = 0;
    data.forEach(r => {
      if (r.available) availableCount++;
    });
    console.log(`${availableCount} records are marked as available=true.`);
    if (availableCount === 0) {
      console.log('Since 0 records are available, NO telegram messages were sent. This is by design in db.js.');
    }
  }
}
checkRecords();
