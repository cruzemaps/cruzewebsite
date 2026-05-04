const https = require('https');

for (let i = 1; i <= 300; i++) {
  const num = String(i).padStart(3, '0');
  const url = `https://s70.us-east-1.skyvdn.com:443/rtplive/TX_AUS_${num}/playlist.m3u8`;
  https.get(url, (res) => {
    if (res.statusCode === 200) {
      console.log(`Found: ${url}`);
    }
  }).on('error', () => {});
}

for (let i = 1; i <= 300; i++) {
  const url = `https://s70.us-east-1.skyvdn.com:443/rtplive/TX_AUS_${i}/playlist.m3u8`;
  https.get(url, (res) => {
    if (res.statusCode === 200) {
      console.log(`Found: ${url}`);
    }
  }).on('error', () => {});
}
