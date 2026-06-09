// No need to import node-fetch in Node 18+
import dotenv from 'dotenv';
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_IDS = process.env.TELEGRAM_CHAT_ID ? process.env.TELEGRAM_CHAT_ID.split(',').map(id => id.trim()) : [];

export async function sendTelegramNotification(roomInfo) {
  if (!BOT_TOKEN || CHAT_IDS.length === 0) {
    console.warn('Telegram bot token or chat ID is missing. Notification not sent.');
    return;
  }

  const { source, title, price, url, isNew, deepDetails } = roomInfo;
  
  const statusLine = isNew ? '✨ <i>(Sisteme yeni eklendi)</i>' : '♻️ <i>(Önceden doluydu, tekrar müsait oldu!)</i>';
  const detailsBlock = deepDetails ? `\n📜 <b>Ek Detaylar:</b>\n${deepDetails}\n` : '';

  const message = `🚨 <b>YENİ ODA BULDUM!</b> 🚨

🏢 <b>Kaynak:</b> ${source}
🛏 <b>Detaylar:</b> ${title}
💰 <b>Fiyat:</b> €${price}
${statusLine}
${detailsBlock}
🔗 <a href="${url}">Hemen İlana Git</a>`;

  const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  for (const chatId of CHAT_IDS) {
    if (!chatId) continue;
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Telegram API responded with status ${response.status} for chat ${chatId}: ${errText}`);
      } else {
        console.log(`Telegram notification sent successfully to ${chatId}.`);
      }
    } catch (error) {
      console.error(`Error sending Telegram notification to ${chatId}:`, error);
    }
  }
}
