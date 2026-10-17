// 統一分類：爬蟲寫入資料時、前端顯示時共用。
// classify() 先看品牌字典，再看標題／內文關鍵字計分；都沒有就回傳「其他」。

export const CATEGORIES = [
  { key: '藥妝美妝', icon: '💄' },
  { key: '運動戶外', icon: '🏃' },
  { key: '餐飲美食', icon: '🍔' },
  { key: '外送', icon: '🛵' },
  { key: '超商量販', icon: '🏪' },
  { key: '食品生鮮', icon: '🥬' },
  { key: '3C家電', icon: '📱' },
  { key: '服飾配件', icon: '👕' },
  { key: '居家生活', icon: '🛋️' },
  { key: '親子寵物', icon: '🧸' },
  { key: '旅遊住宿', icon: '✈️' },
  { key: '交通出行', icon: '🚗' },
  { key: '娛樂影音', icon: '🎬' },
  { key: '綜合電商', icon: '🛒' },
  { key: '金融支付', icon: '💳' },
  { key: '精品', icon: '💎' },
  { key: '生活服務', icon: '🧾' },
  { key: '其他', icon: '🏷️' },
];
export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);
export const categoryIcon = (k) => CATEGORIES.find((c) => c.key === k)?.icon || '🏷️';

/** 各來源原本的分類名稱 → 統一分類 */
const ALIAS = {
  美妝保健: '藥妝美妝', 美妝保養: '藥妝美妝', 纖體保健: '藥妝美妝', 保健: '藥妝美妝', 美妝: '藥妝美妝', 藥妝: '藥妝美妝',
  時尚服飾: '服飾配件', 流行時尚: '服飾配件', 服飾: '服飾配件',
  運動休閒: '運動戶外', 運動: '運動戶外',
  食品餐飲: '餐飲美食', 美食: '餐飲美食', 餐飲: '餐飲美食', 生鮮食品: '食品生鮮',
  門市通路: '超商量販', 通路門市: '超商量販', 超商: '超商量販',
  親子: '親子寵物', 親子婦幼: '親子寵物',
  旅遊: '旅遊住宿', 住宿: '旅遊住宿',
  網購平台: '綜合電商', 跨境購物: '綜合電商', 全球直送: '綜合電商', 品牌旗艦: '其他', 特色店家: '其他',
};

/** 品牌 → 分類（比對正規化後的店名開頭或包含） */
const BRANDS = {
  藥妝美妝: ['屈臣氏', 'watsons', '康是美', 'cosmed', '寶雅', 'poya', '日藥本舖', '松本清', '大樹藥局', '杏一', '丁丁藥局', '躍獅', 'sephora', '莎莎', 'sasa', 'olive young', '小三美日', '美華泰', 'lancome', '蘭蔻', 'estee', '雅詩蘭黛', 'la mer', '海洋拉娜', 'kiehl', '契爾氏', 'shiseido', '資生堂', 'sk-ii', 'clinique', '倩碧', 'bobbi brown', 'nars', 'm.a.c', 'mac cosmetics', 'jo malone', 'dior', '迪奧', 'chanel', 'ysl', 'clarins', 'loccitane', '歐舒丹', 'the body shop', 'innisfree', '理膚寶水', '薇姿', 'iherb', 'lookfantastic', 'strawberrynet', '草莓網', 'ipsa', 'orbis', '雪肌精', 'kose', 'shu uemura', '植村秀', '葡萄王', '大研生醫', '娘家', '白蘭氏', 'myprotein'],
  運動戶外: ['nike', 'adidas', '愛迪達', 'puma', 'new balance', 'asics', 'mizuno', 'under armour', 'lululemon', 'decathlon', '迪卡儂', 'the north face', 'columbia', 'skechers', 'fila', 'converse', 'vans', 'reebok', 'hoka', 'on running', '健身工廠', 'world gym', '世界健身', 'garmin', 'arc\'teryx', 'patagonia', '摩曼頓', 'sports direct', 'sportsdirect'],
  外送: ['uber eats', 'ubereats', 'foodpanda', '熊貓', 'foodomo'],
  餐飲美食: ['麥當勞', 'mcdonald', '肯德基', 'kfc', '漢堡王', 'burger king', '摩斯', 'mos burger', '必勝客', 'pizza hut', '達美樂', 'domino', '拿坡里', '頂呱呱', '星巴克', 'starbucks', '路易莎', 'louisa', 'cama', '85度c', '50嵐', '清心', '可不可', '迷客夏', '五十嵐', '茶湯會', '春水堂', 'coco', '大苑子', '麻古', '鼎泰豐', '王品', '瓦城', '饗賓', '饗食天堂', '欣葉', '築間', '乾杯', '橘焱', '石二鍋', '海底撈', '爭鮮', '壽司郎', '藏壽司', 'sushiro', '吉野家', 'sukiya', '八方雲集', '丹堤', '星野', 'subway', '老虎堂', '鬍鬚張', '胡同', 'eztable', 'inline'],
  超商量販: ['7-11', '7-eleven', '統一超商', '全家', 'familymart', '萊爾富', 'hi-life', 'ok mart', 'ok超商', '全聯', 'px mart', '家樂福', 'carrefour', '好市多', 'costco', '大潤發', '愛買', '美廉社', '楓康', '唐吉訶德', 'don don donki'],
  食品生鮮: ['i3fresh', '愛上新鮮', '鮮食家'],
  '3C家電': ['apple', 'iphone', 'ipad', 'samsung', '三星', 'sony', 'asus', '華碩', 'acer', '宏碁', 'msi', '微星', 'lenovo', '聯想', 'dell', 'hp', 'logitech', '羅技', 'dyson', '戴森', 'panasonic', '國際牌', 'philips', '飛利浦', 'lg', 'xiaomi', '小米', 'oppo', 'vivo', 'realme', 'google pixel', 'dji', '燦坤', '全國電子', '順發', '神腦', '三創', 'studio a', 'epson', 'canon', 'nikon', 'switch', 'playstation', 'xbox', 'razer'],
  服飾配件: ['uniqlo', 'gu', 'zara', 'h&m', 'net', 'lativ', 'queen shop', 'coach', 'kipling', 'michael kors', 'charles & keith', 'calvin klein', 'tommy hilfiger', 'levi', 'gap', 'cos', 'muji服飾', 'zalora', 'asos', 'farfetch', 'mytheresa', 'net-a-porter', 'yoox', 'ssense'],
  居家生活: ['ikea', '宜家', '特力屋', 'hola', 'b&q', '無印良品', 'muji', 'nitori', '宜得利', '振宇', 'lock&lock', '樂扣', '膳魔師', 'thermos', 'tiger', '虎牌', 'emma mattress', '生活采家'],
  親子寵物: ['反斗城', 'toys"r"us', '麗嬰房', 'patpat', 'jellycat', '凱朵', '東森寵物'],
  旅遊住宿: ['klook', 'kkday', 'agoda', 'booking', 'trip.com', 'expedia', 'hotels.com', 'airbnb', '雄獅', '易遊網', 'eztravel', '可樂旅遊', '東南旅遊', '五福', '燦星', '長榮航空', '星宇', '華航', '虎航', '樂天旅遊', 'rakuten travel', 'asiayo', 'getyourguide', 'marriott', 'ihg', 'hilton', 'accor', 'hyatt'],
  交通出行: ['uber', '高鐵', '台鐵', '捷運', '悠遊卡', '一卡通', 'irent', 'gogoro', 'wemo', 'goshare', 'yoxi', '台灣大車隊', '中油', '台塑石油', 'ubike', 'youbike', 'rentalcars'],
  娛樂影音: ['netflix', 'disney+', 'kkbox', 'spotify', 'friday影音', 'myvideo', 'catchplay', 'line tv', 'hami', 'youtube premium', '威秀', '秀泰', '國賓影城', '遊樂園', '六福村', '麗寶', '博客來', '讀墨', 'readmoo', 'kobo', 'steam', '樂天kobo', 'apple music'],
  綜合電商: ['momo', 'pchome', '蝦皮', 'shopee', 'yahoo', '奇摩', 'coupang', '酷澎', '樂天市場', 'rakuten', 'friday購物', 'etmall', '東森購物', 'udn買東西', '生活市集', 'pinkoi', '淘寶', 'taobao', '天貓', 'amazon', '亞馬遜', 'aliexpress', '京東', 'jd.com', '91app'],
  金融支付: ['line pay', 'linepay', '街口', 'jkopay', '全支付', 'pxpay', '悠遊付', 'apple pay', 'google pay', '台灣pay', 'pi錢包', '歐付寶', '玉山', '國泰世華', '台新', '中信', '富邦', '永豐', '星展', '滙豐', '聯邦', '凱基', '第一銀行', '一銀', '兆豐', '彰銀', '華南', '新光銀行', '元大', '遠東商銀', '王道', '樂天信用卡', 'richart', 'dawho'],
  精品: ['harrods', 'selfridges', 'liberty london', 'harvey nichols', 'the outnet', 'the doublef', 'luxury closet', 'gucci', 'prada', 'burberry', 'longchamp', 'swarovski', '施華洛世奇', '周大福', 'chow sang sang', '珠寶', '鑽石'],
  生活服務: ['中華電信', '台灣大哥大', '遠傳', '亞太電信', '台灣之星', 'hahow', 'voicetube', '黑貓', '郵局', 'vpn', 'nordvpn', 'surfshark', 'norton', 'kaspersky', 'adobe', 'microsoft', 'office', 'icloud', 'canva'],
};

/** 標題／內文關鍵字（品牌字典沒中時用） */
const KEYWORDS = {
  藥妝美妝: ['藥妝', '美妝', '保養', '彩妝', '面膜', '精華液', '乳液', '防曬', '香水', '洗髮', '沐浴', '保健', '維他命', '益生菌', '葉黃素', '魚油', '藥局'],
  運動戶外: ['運動', '跑鞋', '球鞋', '慢跑', '健身', '瑜珈', '登山', '露營', '戶外', '馬拉松', '自行車', '球衣'],
  餐飲美食: ['餐廳', '套餐', '漢堡', '披薩', '炸雞', '咖啡', '拿鐵', '美式', '奶茶', '手搖', '飲料', '甜點', '蛋糕', '早餐', '火鍋', '燒肉', '吃到飽', '買一送一', '第二杯', '半價', '內用', '外帶'],
  外送: ['外送', '外帶自取', '運費', '送餐'],
  超商量販: ['超商', '便利商店', '量販', '超市', 'icash', 'openpoint', 'open point', '會員點數'],
  '3C家電': ['手機', '筆電', '平板', '耳機', '充電', '家電', '冷氣', '冰箱', '洗衣機', '電視', '相機', '螢幕', '電競', '3c'],
  服飾配件: ['服飾', '衣服', '外套', '褲', '洋裝', '包包', '鞋款', '配件', '內著', '鞋', '內衣', '飾品', '眼鏡'],
  居家生活: ['居家', '家具', '寢具', '廚房', '收納', '清潔', '衛生紙', '洗衣精', '生活用品', '床墊', '傢俱'],
  親子寵物: ['親子', '兒童', '寶寶', '媽媽', '孕', '玩具', '寵物', '貓砂', '飼料', '嬰兒', '母嬰', '童裝', '毛孩', '貓', '狗'],
  旅遊住宿: ['旅遊', '旅行', '機票', '訂房', '住宿', '飯店', '景點', '門票', '行程', '出國', '日本', '韓國', '旅館', '民宿', '航空', 'esim'],
  交通出行: ['高鐵', '台鐵', '計程車', '叫車', '加油', '停車', '機車', '租車', '共享'],
  娛樂影音: ['電影', '影城', '串流', '追劇', '演唱會', '展覽', '遊戲', '點數卡', '電子書', '音樂'],
  綜合電商: ['購物節', '雙11', '雙十一', '雙12', '全站', '全館', '網購'],
  金融支付: ['信用卡', '刷卡', '回饋', '行動支付', '電子支付', '新戶', '開戶', '首刷', '現金回饋', '分期', '銀行', '數位帳戶', '證券', '保險'],
  生活服務: ['電信', '門號', '網路', '課程', '訂閱', '軟體', 'vpn', '資費', '線上課', '補習', '洗衣', '搬家', '清潔服務', '快遞', '雲端'],
  食品生鮮: ['生鮮', '有機', '果物', '肉品', '海鮮', '零食', '咖啡豆'],
};

const lower = (s) => String(s ?? '').toLowerCase();

/** 依品牌字典判斷 */
export function brandCategory(merchant) {
  const m = lower(merchant).replace(/\s+/g, ' ');
  if (!m) return null;
  let best = null;
  for (const [cat, list] of Object.entries(BRANDS)) {
    for (const b of list) {
      const i = m.indexOf(b);
      // 英文短字（lg、gu、hp、net）要整個字比對，避免誤中
      if (i < 0) continue;
      if (/^[a-z0-9&'.+-]{1,3}$/.test(b) && /[a-z0-9]/.test(m[i - 1] || '') + /[a-z0-9]/.test(m[i + b.length] || '') > 0) continue;
      if (!best || b.length > best.len) best = { cat, len: b.length };
    }
  }
  return best?.cat || null;
}

/** 依關鍵字計分判斷 */
export function keywordCategory(text) {
  const t = lower(text);
  let best = null;
  for (const [cat, list] of Object.entries(KEYWORDS)) {
    const score = list.reduce((n, k) => n + (t.includes(k) ? 1 : 0), 0);
    if (score && (!best || score > best.score)) best = { cat, score };
  }
  return best?.cat || null;
}

/**
 * 分類：來源給的分類 → 品牌字典 → 標題 → 內文。
 * 來源分類若是「其他／特色店家」這類籠統名稱，仍嘗試用品牌與關鍵字細分。
 */
export function classify({ merchant, title, text, category } = {}) {
  const given = ALIAS[category] || (CATEGORY_KEYS.includes(category) ? category : null);
  if (given && given !== '其他') return given;
  return brandCategory(merchant) || brandCategory(title) || keywordCategory(title) || keywordCategory(text) || given || '其他';
}
