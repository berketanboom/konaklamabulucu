import { spawn } from 'child_process';

// Tarama sıklığı (Dakika cinsinden)
// Çok sık (örneğin 1-2 dakika) yaparsanız siteler sizi bot olarak algılayıp engelleyebilir.
// İdeal olan 15-30 dakika arasıdır.
const INTERVAL_MINUTES = 15;
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

function runScraper() {
    console.log(`\n[${new Date().toLocaleString()}] Otomatik tarama başlatılıyor...`);
    
    // scraper.js dosyasını çalıştır
    const child = spawn('node', ['scraper.js'], { stdio: 'inherit', shell: true });
    
    child.on('close', (code) => {
        console.log(`[${new Date().toLocaleString()}] Tarama bitti. Bir sonraki tarama ${INTERVAL_MINUTES} dakika sonra otomatik yapılacak.`);
    });
}

console.log(`--- UTRECHT OTOMATİK KONAKLAMA BOTU BAŞLADI ---`);
console.log(`Bot her ${INTERVAL_MINUTES} dakikada bir siteleri kendi kendine kontrol edecek.`);
console.log(`(Kapatmak için terminalde CTRL + C tuşlarına basabilir veya pencereyi kapatabilirsiniz.)\n`);

// İlk çalışmayı hemen başlat
runScraper();

// Sonrasında belirlenen dakikada bir tekrar et
setInterval(runScraper, INTERVAL_MS);
