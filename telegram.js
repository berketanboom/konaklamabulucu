// No need to import node-fetch in Node 18+
import dotenv from 'dotenv';
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramNotification(roomInfo) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('Telegram bot token or chat ID is missing. Notification not sent.');
    return;
  }

  const { source, title, price, url, isNew } = roomInfo;
  
  const message = `🚨 YENİ/BOŞ ODA BULDUM! 🚨
Kaynak: ${source}
Oda Tipi: ${title}
Fiyat: €${price}
Link: ${url}`;

  const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      console.error(`Telegram API responded with status ${response.status}`);
    } else {
      console.log('Telegram notification sent successfully.');
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
}
