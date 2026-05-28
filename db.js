import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { sendTelegramNotification } from './telegram.js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Supabase URL or Key is missing. Check your .env file.');
}

export const supabase = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_KEY || 'placeholder');

/**
 * Checks the newly fetched listings against the database.
 * Adds new ones, updates available status.
 */
export async function processListings(fetchedListings) {
  for (const listing of fetchedListings) {
    // Check if listing already exists by source, url AND title
    const { data: existingListings, error: fetchError } = await supabase
      .from('listings')
      .select('*')
      .eq('url', listing.url)
      .eq('source', listing.source)
      .eq('title', listing.title);

    if (fetchError) {
      console.error('Error fetching listing from Supabase:', fetchError);
      continue;
    }

    if (existingListings && existingListings.length > 0) {
      const existing = existingListings[0];
      
      // If room was not available but now is available
      if (!existing.available && listing.available) {
        // Update to available and notify
        const { error: updateError } = await supabase
          .from('listings')
          .update({ 
            available: true, 
            price: listing.price, 
            last_checked: new Date().toISOString() 
          })
          .eq('id', existing.id);
          
        if (updateError) {
          console.error('Error updating listing to available:', updateError);
        } else {
          console.log(`[AVAILABLE] Room became available: ${listing.title}`);
          await sendTelegramNotification({ ...listing, isNew: false });
        }
      } else {
        // Just update last_checked, price, availability status
        await supabase
          .from('listings')
          .update({ 
            available: listing.available,
            price: listing.price, 
            last_checked: new Date().toISOString() 
          })
          .eq('id', existing.id);
      }
    } else {
      // New listing
      const { error: insertError } = await supabase
        .from('listings')
        .insert([{
          source: listing.source,
          title: listing.title,
          price: listing.price,
          available: listing.available,
          url: listing.url
        }]);

      if (insertError) {
        console.error('Error inserting new listing:', insertError);
      } else {
        console.log(`[NEW] New room found: ${listing.title}`);
        if (listing.available) {
          await sendTelegramNotification({ ...listing, isNew: true });
        }
      }
    }
  }
}
