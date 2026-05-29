import dotenv from 'dotenv';
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const message = `🚨 YENİ/BOŞ ODA BULDUM! 🚨
Test Message`;

const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    chat_id: CHAT_ID,
    text: message,
    disable_web_page_preview: true,
  }),
})
.then(async response => {
  console.log(`Status: ${response.status}`);
  const text = await response.text();
  console.log(`Response: ${text}`);
})
.catch(err => console.error(err));
