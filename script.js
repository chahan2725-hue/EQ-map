// API URL（例：最新5件）
const API_URL = "https://api.p2pquake.net/v2/history?codes=551&limit=5";

const map = L.map('map').setView([37.7749, 138.2394], 5);  // 中心を日本あたりに

// ベースマップ：ここでは基本の地図タイル（OpenStreetMapなど）
// 後で「気象庁の地図タイル」が使えるなら置き換えてください
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

async function loadData() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`APIエラー: ${res.status}`);
    const data = await res.json();
    processData(data);
  } catch (err) {
    console.error(err);
    document.getElementById('info').innerHTML = `<p>データ取得エラー: ${err.message}</p>`;
  }
}

function processData(list) {
  const infoDiv = document.getElementById('info');
  infoDiv.innerHTML = '';
  
  list.forEach(item => {
    const eq = item.earthquake;
    const h = eq.hypocenter;
    const lat = h?.latitude;
    const lon = h?.longitude;
    const time = new Date(eq.time).toLocaleString("ja-JP");
    const place = h?.name || "不明";
    const magnitude = (h?.magnitude != null && h.magnitude >= 0) ? h.magnitude.toFixed(1) : "不明";
    const maxScale = scaleToText(eq.maxScale);
    
    // マップに震源地：×マーク
    if (lat != null && lon != null) {
      const marker = L.marker([lat, lon], {
        icon: L.divIcon({
          className: 'eq-source',
          html: '×',
          iconSize: [20,20],
          iconAnchor: [10,10]
        })
      }).addTo(map);
    }
    
    // サイドバーに情報
    const div = document.createElement('div');
    div.className = 'eq-item';
    div.innerHTML = `
      <h3>${place}</h3>
      <p>発生時刻：${time}</p>
      <p>マグニチュード：M${magnitude}</p>
      <p>最大震度：${maxScale}</p>
    `;
    infoDiv.appendChild(div);
    
    // 各観測点震度表示（簡易表示：震度情報から①とか記号で）
    if (item.points && item.points.length > 0) {
      item.points.forEach(p => {
        const s = scaleToText(p.scale);
        const city = p.addr || '';
        // マップにテキスト表示：例えば①とか震度に応じて
        const label = L.marker([p.latitude, p.longitude], {
          icon: L.divIcon({
            className: 'eq-intensity',
            html: `<span>${s}</span>`,
            iconSize: [30,30],
            iconAnchor: [15,15]
          })
        }).addTo(map);
      });
    }
  });
}

// 補助関数
function scaleToText(scale) {
  const map = {10:'1',20:'2',30:'3',40:'4',45:'5-',50:'5+',55:'6-',60:'6+',70:'7'};
  return map[scale] || '不明';
}

loadData();
