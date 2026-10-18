// 團購分類：爬蟲寫入資料時、網站顯示與「我的團購」貼文解析時共用。
// classify() 依品牌字典與關鍵字計分；同一段文字以最長的關鍵字為準（「氣炸鍋」算家電，不會再算到「鍋」）。

export const CATEGORIES = [
  { key: '育兒親子', icon: '🍼' },
  { key: '家電', icon: '🔌' },
  { key: '服飾配件', icon: '👗' },
  { key: '居家生活', icon: '🛋️' },
  { key: '美妝保養', icon: '💄' },
  { key: '美食生鮮', icon: '🍱' },
  { key: '保健營養', icon: '💊' },
  { key: '3C數位', icon: '📱' },
  { key: '寵物用品', icon: '🐾' },
  { key: '運動戶外', icon: '⛺' },
  { key: '文創周邊', icon: '🎁' },
  { key: '旅遊票券', icon: '🎫' },
  { key: '其他', icon: '🏷️' },
];
export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);
export const categoryIcon = (k) => CATEGORIES.find((c) => c.key === k)?.icon || '🏷️';

/** 搜尋同義詞：輸入左邊的字，也找得到右邊的分類 */
export const CATEGORY_ALIASES = {
  育兒: '育兒親子', 母嬰: '育兒親子', 嬰兒: '育兒親子', 寶寶: '育兒親子', 兒童: '育兒親子', 親子: '育兒親子', 童裝: '育兒親子',
  電器: '家電', 小家電: '家電',
  衣服: '服飾配件', 服飾: '服飾配件', 衣物: '服飾配件', 穿搭: '服飾配件', 鞋子: '服飾配件', 包包: '服飾配件',
  家居: '居家生活', 居家: '居家生活', 生活用品: '居家生活', 廚具: '居家生活', 寢具: '居家生活', 收納: '居家生活',
  美妝: '美妝保養', 保養: '美妝保養', 彩妝: '美妝保養',
  美食: '美食生鮮', 食品: '美食生鮮', 零食: '美食生鮮', 生鮮: '美食生鮮', 甜點: '美食生鮮',
  保健: '保健營養', 營養: '保健營養',
  '3C': '3C數位', 數位: '3C數位',
  寵物: '寵物用品', 毛孩: '寵物用品',
  運動: '運動戶外', 露營: '運動戶外', 戶外: '運動戶外',
  周邊: '文創周邊', 文創: '文創周邊', 公仔: '文創周邊', 追星: '文創周邊', 動漫: '文創周邊',
  旅遊: '旅遊票券', 票券: '旅遊票券', 住宿: '旅遊票券',
};

/** 品牌 → 分類（英文以整個字比對，避免 gu、lg、mac 誤中） */
const BRANDS = {
  育兒親子: ['combi', 'aprica', 'joie', 'chicco', 'graco', 'maxi-cosi', 'cybex', 'britax', 'stokke', 'bugaboo', 'babyzen', 'ergobaby', 'babybjorn', 'nuna', 'peg perego', 'inglesina', 'hugpapa', 'pigeon', '貝親', 'avent', 'tommee tippee', 'nuk', 'hegen', 'comotomo', '布朗博士', 'dr. brown', 'kuku', '酷咕鴨', 'nac nac', '奇哥', '麗嬰房', '六甲村', '媽咪小站', 'pampers', '幫寶適', 'merries', '妙而舒', 'moony', '滿意寶寶', 'huggies', '好奇', 'goo.n', 'mamypoko', '理想寶寶', 'lalababy', 'mustela', '慕之恬廊', '嬌生嬰兒', 'gerber', '嘉寶', 'hipp', '喜寶', '能恩', '亞培', 'similac', '美強生', 'fisher-price', '費雪', 'duplo', 'pinkfong', 'jellycat', 'melissa & doug', 'hape', 'b.toys', 'tomica', 'plarail', '森林家族', 'mideer', '彌鹿', '佩佩豬', '麵包超人', 'anpanman', '小獅王辛巴', 'simba', 'unilove', 'mombella', 'grosmimi', 'b.box', 'farlin', '藍色企鵝', 'puku', 'mompush', 'oribel', 'kidsmile', 'lego', '樂高', '童伴', '康軒', '巧連智', '小天下', '親子天下', '信誼', '愛兒館', 'scoot&ride', 'scoot & ride', '美姬饅頭', '小花點讀筆', 'jan & jul', '兔比媽咪廚房', 'brushbaby', 'mamayo', 'oribel'],
  家電: ['dyson', '戴森', 'panasonic', '國際牌', 'hitachi', '日立', 'sharp', '夏普', 'toshiba', '東芝', 'daikin', '大金', 'tiger', '虎牌', 'zojirushi', '象印', 'tefal', '特福', 'philips', '飛利浦', 'electrolux', '伊萊克斯', 'irobot', 'roborock', '石頭科技', 'ecovacs', '科沃斯', 'dreame', '追覓', 'balmuda', 'delonghi', '迪朗奇', 'kenwood', 'kitchenaid', 'vitamix', 'blendtec', 'bruno', 'recolte', '麗克特', '±0', 'plusminuszero', 'cado', 'blueair', 'coway', 'honeywell', 'sampo', '聲寶', 'tatung', '大同電鍋', 'kolin', '歌林', 'heran', '禾聯', 'chimei', '奇美', 'teco', '東元', 'sanlux', '三洋', 'kinyo', 'iris ohyama', '愛麗思', 'yamazen', '山善', 'shark', 'tineco', '添可', 'airdog', 'imarflex', '伊瑪', 'lapolar', 'cuisinart', '美膳雅', 'russell hobbs', 'smeg', 'rasonic', 'whirlpool', '惠而浦', 'bosch', '博世', 'miele', 'siemens', 'ninja', 'instant pot', 'vitantonio', 'toffy', 'larmi', 'sansui', '山水', 'nespresso', 'dolce gusto', 'breville', '鉑富', 'kaso', 'idealife', '小米', 'xiaomi', '米家', 'lg', 'samsung', '三星', 'iris', 'tanita', 'papabin', 'sodastream', 'mova', 'voto', 'sunbeam', 'braun', '百靈', 'balmuda', '百慕達'],
  服飾配件: ['uniqlo', 'gu', 'zara', 'h&m', 'lativ', 'queen shop', 'coach', 'kipling', 'longchamp', 'michael kors', 'charles & keith', 'crocs', 'birkenstock', 'heattech', 'airism', 'triumph', '黛安芬', 'wacoal', '華歌爾', 'bvd', 'gunze', '郡是', 'levis', "levi's", 'gap', 'skechers', 'converse', 'vans', 'new balance', 'dr. martens', 'ugg', 'mlb', 'champion', 'carhartt', 'mardi', 'mercredi', 'bagsmart'],
  居家生活: ['ikea', '宜得利', 'nitori', '無印良品', 'muji', 'lock&lock', '樂扣', 'thermos', '膳魔師', 'le creuset', 'staub', 'fissler', 'zwilling', '雙人牌', 'wmf', 'tupperware', '特百惠', 'iwaki', 'pyrex', 'corelle', '康寧', 'glasslock', 'tenpur', '丹普', '3m', '百利', 'scotch-brite', 'dettol', '滴露', 'ariel', 'tide', '白蘭', '花仙子', 'farcent', '花王', 'kao', '獅王', 'lion', '橘子工坊', '威猛先生', 'magiclean', '舒潔', 'kleenex', '春風', '五月花', '倍潔雅', '得意', 'mujosh', 'oxo', 'joseph joseph', '山崎', 'yamazaki', 'sanko', '日本霜山', 'nicegoods', '生活工場', 'hola', '特力屋', '淨毒五郎', 'stasher', 'flexispot', 'mistifi', 'elpheco', '伯尼寢具', '久賴', '格蕾', 'prepara', '沛樂'],
  美妝保養: ['lancome', '蘭蔻', 'estee lauder', '雅詩蘭黛', 'la mer', '海洋拉娜', 'kiehl', '契爾氏', 'shiseido', '資生堂', 'sk-ii', 'clinique', '倩碧', 'clarins', '克蘭詩', 'loccitane', "l'occitane", '歐舒丹', 'innisfree', 'la roche-posay', '理膚寶水', 'vichy', '薇姿', 'avene', '雅漾', 'bioderma', '貝膚黛瑪', 'cetaphil', '舒特膚', 'curel', '珂潤', 'dr.wu', '達爾膚', 'naruko', '牛爾', 'neogence', '霓淨思', 'dr.jart', 'sulwhasoo', '雪花秀', 'aesop', 'jo malone', 'dior', '迪奧', 'chanel', '香奈兒', 'ysl', 'nars', 'mac', '3ce', 'romand', 'canmake', 'heme', 'kose', '雪肌精', 'orbis', 'fancl', 'olay', '歐蕾', 'nivea', '妮維雅', 'biore', '蜜妮', 'senka', '專科', 'hada labo', '肌研', 'paula', '寶拉珍選', 'the ordinary', 'cosrx', 'some by mi', 'torriden', 'anua', 'medicube', 'aestura', '城野醫生', 'shu uemura', '植村秀', 'kerastase', '卡詩', 'aveda', 'moroccanoil', 'tsubaki', '潘婷', 'pantene', 'dove', '多芬', 'sebamed', '施巴', '海倫仙度絲', 'colgate', '高露潔', 'sensodyne', '舒酸定', '好來', 'darlie', 'cellology', 'pdrn', 'dr.ci:labo', 'kanebo', '佳麗寶', 'clio', 'peripera', 'etude', 'missha', 'beauty of joseon', 'round lab', 'yuskin', '悠斯晶'],
  美食生鮮: ['義美', '新東陽', '黑橋牌', '卜蜂', '桂冠', '台畜', '蘭揚', '奇美食品', '老楊', '佳德', '郭元益', '舊振南', '一之軒', '犁記', '小潘', '微熱山丘', '亞尼克', '起士公爵', '85度c', '大苑子', '春水堂', '味全', '光泉', '林鳳營', '福樂', 'kirkland', '科克蘭', 'lindt', '瑞士蓮', 'godiva', 'royce', '鼎泰豐', '海底撈', '唐太盅', '原味時代', '午茶夫人', '發現茶', '藻作坊', '蒜蒜屋', '雪坊', '鮮乳坊', '美福', '藍海饌', '津津', '起士公爵', '初鹿', '金園', '養泉', '壽滿趣', '萬歲牌'],
  保健營養: ['白蘭氏', '娘家', '大研生醫', '葡萄王', '善存', 'centrum', 'swisse', 'blackmores', '澳佳寶', '三得利', 'suntory', '台塑生醫', '老協珍', '桂格', '雀巢', 'dhc', '日本味王', '悠活原力', '達摩本草', '常春樂活', '赫而司', '維維樂', '挺立', '小兒利撒爾', 'nature made', '萊萃美', 'kirkland signature', '我的健康日記', '新普利', 'cofit', '米鴻', 'body goals', '光茵', 'popcare'],
  '3C數位': ['apple', 'iphone', 'ipad', 'macbook', 'airpods', 'apple watch', 'sony', 'asus', '華碩', 'acer', '宏碁', 'lenovo', '聯想', 'logitech', '羅技', 'anker', 'belkin', 'baseus', '倍思', 'ugreen', '綠聯', 'jbl', 'bose', 'marshall', 'sennheiser', 'garmin', 'gopro', 'dji', 'insta360', 'nintendo', '任天堂', 'switch', 'playstation', 'kindle', 'kobo', 'mophie', 'rhinoshield', '犀牛盾', 'devilcase', '惡魔盾', 'casetify', 'spigen', 'xundd', 'oppo', 'vivo', 'realme', 'google pixel', 'pixel', 'huawei', '華為', 'razer', 'epson', 'brother', 'guxon', 'aspor', 'jway'],
  寵物用品: ['royal canin', '法國皇家', 'hills', '希爾思', 'orijen', '渴望', 'acana', '愛肯拿', 'nutram', '紐頓', 'ziwi', '巔峰', 'purina', '普瑞納', 'ciao', 'inaba', 'petkit', '小佩', 'catlink', 'pidan', '汪喵星球', '毛孩時代', 'nu4pet', '陪心寵糧', '寵物'],
  運動戶外: ['decathlon', '迪卡儂', 'snow peak', 'coleman', 'logos', 'mont-bell', 'the north face', 'columbia', 'patagonia', 'arcteryx', "arc'teryx", 'lululemon', 'under armour', 'nike', 'adidas', '愛迪達', 'puma', 'asics', 'mizuno', 'hoka', 'salomon', 'yeti', 'stanley', 'helinox', 'naturehike', '挪客', '探路者'],
  文創周邊: ['三麗鷗', 'sanrio', 'hello kitty', '凱蒂貓', '美樂蒂', 'melody', '酷洛米', 'kuromi', '布丁狗', '大耳狗', '帕恰狗', '蠟筆小新', '吉伊卡哇', 'chiikawa', '拉拉熊', 'rilakkuma', '角落生物', '角落小夥伴', 'sumikko', '史努比', 'snoopy', '迪士尼', 'disney', '寶可夢', 'pokemon', '皮卡丘', '哆啦a夢', '多啦a夢', 'line friends', 'bt21', 'popmart', 'pop mart', '泡泡瑪特', 'labubu', 'skullpanda', '蛋黃哥', '卡娜赫拉', '小王子', 'miffy', '米飛兔', '咖波', '貓貓蟲', '吉伊', '小八'],
  旅遊票券: ['klook', 'kkday', '雄獅', '易遊網', '六福村', '義大世界', '麗寶樂園', '劍湖山', '九族文化村', '小人國', '饗食天堂', '漢來', '晶華', '寒舍', '福容', '老爺酒店', '雲朗', '礁溪', '星野', '長榮鳳凰', '統一渡假村'],
};

/** 關鍵字（簡短字詞容易誤判，盡量用兩字以上） */
const KEYWORDS = {
  育兒親子: ['育兒', '母嬰', '親子', '嬰兒', '寶寶', '兒童', '幼兒', '新生兒', '嬰幼兒', '孕婦', '孕期', '產後', '月子', '哺乳', '母乳', '集乳', '吸乳器', '擠乳器', '奶瓶', '奶嘴', '奶粉', '副食品', '學習杯', '吸管杯', '餐椅', '推車', '汽座', '安全座椅', '揹巾', '背巾', '腰凳', '嬰兒床', '遊戲床', '床圍', '尿布', '紙尿褲', '拉拉褲', '褲型尿布', '濕紙巾', '口水巾', '紗布巾', '包巾', '防踢被', '童裝', '童鞋', '童襪', '兒童睡袋', '嬰兒睡袋', '防踢睡袋', '書桌椅', '滑板車', '點讀筆', '階梯凳', '梯凳', '折疊梯', '踏腳凳', '學習塔', '玩具', '積木', '繪本', '教具', '早教', '點讀', '故事機', '學步', '固齒器', '安撫', '洗澡盆', '澡盆', '爬行墊', '遊戲墊', '書包', '幼稚園', 'baby', 'kids', '童', '嬰', '孕', '扭扭樂', '黏土', '貼紙書', '拼圖'],
  家電: ['家電', '電器', '吸塵器', '掃地機', '拖地機', '洗地機', '除濕機', '清淨機', '空氣清淨', '加濕器', '電風扇', '循環扇', '風扇', '電暖器', '暖風機', '暖氣機', '冷氣', '除蟎機', '塵蟎機', '吹風機', '整髮器', '離子夾', '捲髮器', '電棒', '刮鬍刀', '電動牙刷', '沖牙機', '烤箱', '氣炸鍋', '微波爐', '電鍋', '電子鍋', '壓力鍋', '快煮壺', '電熱水瓶', '熱水瓶', '果汁機', '調理機', '破壁機', '咖啡機', '磨豆機', '豆漿機', '麵包機', '鬆餅機', '電烤盤', '電火鍋', '多功能鍋', '料理鍋', '舒肥機', '洗碗機', '烘碗機', '冰箱', '洗衣機', '烘衣機', '乾衣機', '電視', '投影機', '飲水機', '淨水器', '濾水壺', '按摩椅', '按摩器', '筋膜槍', '美容儀', '電熱毯', '烘被機', '掛燙機', '蒸氣熨斗', '熨斗', '溫奶器', '消毒鍋', '烘乾機', '暖爐', '電毯', '捕蚊燈', '除濕', '變頻', '封口機', '給皂機', '鬆餅機', '冰能扇', '冰心扇', '扇', '廚餘機', '氣泡水機', '體脂計', '電磁爐', '洗碗機', '淨水器', '冰淇淋機', '織物清潔機', '洗地機', '研磨器', '研磨罐', '果乾機'],
  服飾配件: ['服飾', '衣服', '上衣', 't恤', '短袖', '長袖', '襯衫', '外套', '大衣', '羽絨', '背心', '毛衣', '針織', '帽t', '衛衣', '長褲', '短褲', '褲子', '寬褲', '牛仔', '裙子', '長裙', '短裙', '洋裝', '連身', '西裝', '內衣', '內褲', '睡衣', '家居服', '發熱衣', '保暖衣', '涼感衣', '防曬衣', '機能衣', '瑜珈褲', '襪子', '鞋子', '球鞋', '布鞋', '靴子', '涼鞋', '拖鞋', '包包', '背包', '後背包', '托特包', '手提包', '斜背包', '錢包', '皮夾', '行李箱', '購物包', '帽子', '浩肯包', 'bra', '無痕內衣', '發熱衣', '外套', '防風', '保暖', '漁夫帽', '棒球帽', '圍巾', '手套', '飾品', '項鍊', '耳環', '戒指', '手鍊', '手錶', '眼鏡', '墨鏡', '穿搭', '女裝', '男裝', '褲', '裙', '鞋', '襪'],
  居家生活: ['居家', '家居', '生活用品', '日用品', '寢具', '床包', '床單', '被套', '枕頭', '枕套', '棉被', '涼被', '被子', '床墊', '床架', '沙發', '家具', '傢俱', '收納', '置物', '層架', '衣架', '掛勾', '鍋具', '炒鍋', '平底鍋', '湯鍋', '鑄鐵鍋', '不沾鍋', '刀具', '菜刀', '砧板', '餐具', '廚房用品', '煎烤', '烤盤', '噴油瓶', '油醋壺', '密封袋', '矽膠', '邊桌', '升降桌', '護脊椅', '水晶', '冰冰被', '呼呼被', '暖暖被', '羽絨被', '緞光被', '壓縮袋', '收納袋', '地毯', '床包', '蓮蓬頭', '碗盤', '杯子', '馬克杯', '保溫瓶', '保溫杯', '保溫壺', '保鮮盒', '便當盒', '廚房', '廚具', '清潔', '清潔劑', '洗衣精', '洗衣球', '洗衣膠囊', '柔軟精', '洗碗精', '漂白水', '除霉', '除臭', '芳香', '香氛', '擴香', '香薰', '蠟燭', '衛生紙', '廚房紙巾', '面紙', '抽取式', '拖把', '掃把', '抹布', '菜瓜布', '海綿', '地墊', '地毯', '窗簾', '檯燈', '燈具', '毛巾', '浴巾', '浴室', '馬桶', '垃圾桶', '垃圾袋', '曬衣', '晾衣', '除濕盒', '防蚊', '驅蚊', '殺蟲', '蟑螂', '鍋', '杯', '碗', '盤', '枕'],
  美妝保養: ['美妝', '保養', '彩妝', '化妝', '面膜', '精華液', '精華', '安瓶', '乳液', '乳霜', '面霜', '眼霜', '化妝水', '卸妝', '洗面乳', '洗顏', '潔顏', '防曬', '隔離霜', '粉底', '氣墊', '遮瑕', '口紅', '唇膏', '唇釉', '護唇', '眼影', '睫毛', '眉筆', '腮紅', '蜜粉', '香水', '身體乳', '護手霜', '洗髮', '潤髮', '護髮', '沐浴乳', '沐浴', '牙膏', '牙刷', '漱口水', '除毛', '美白', '抗老', '保濕', '挖耳棒', '掏耳', '修復霜', '燈泡霜', '粉刺', '痘痘', '美甲', '指甲油', '髮膜', '頭皮', '止汗', '體香', '育髮', '乾洗髮', '口腔', '漱口'],
  美食生鮮: ['美食', '食品', '零食', '餅乾', '蛋捲', '蛋糕', '甜點', '麵包', '吐司', '巧克力', '糖果', '果乾', '堅果', '肉乾', '牛肉', '豬肉', '雞肉', '雞胸', '海鮮', '鮮蝦', '白蝦', '干貝', '鮭魚', '鱈魚', '牛排', '火鍋料', '湯品', '料理包', '調理包', '冷凍', '水餃', '餛飩', '小籠包', '包子', '饅頭', '肉粽', '月餅', '年菜', '禮盒', '滷味', '泡麵', '拉麵', '麵條', '白米', '醬料', '辣椒醬', '調味', '咖啡豆', '濾掛', '茶包', '果汁', '飲料', '紅酒', '啤酒', '水果', '蔬菜', '生鮮', '有機', '蜂蜜', '鮮奶', '優格', '乾優格', '起司', '冰淇淋', '布丁', '優格', '鳳梨酥', '牛軋糖', '肉鬆', '香腸', '龍鬚糖', '麻糬', '甜湯', '燕麥', '穀物', '咖啡', '好吃', '藍莓', '草莓', '芒果', '蘋果', '葡萄', '橘子', '柑橘', '香蕉', '奇異果', '櫻桃', '荔枝', '鳳梨', '柚子', '軟糖', '果泥', '米餅', '米果', '噴霧油', '橄欖油', '食用油', '苦茶油', '麻油', '保久乳', '調味乳', '饅頭', '雞蛋', '米脆', '排骨', '雞腿', '雞腿排', '鹹酥雞', '貝果', '蝴蝶酥', '圓餅', '吐司', '沙拉', '生菜', '豆腐', '豆乳', '豆製', '控麵', '湯包', '燉湯', '菜脯', '奶油', '油品', '木耳露', '甜不辣', '水餃', '甘栗', '栗子'],
  保健營養: ['保健', '營養', '益生菌', '乳酸菌', '酵素', '葉黃素', '魚油', '維他命', '維生素', '綜合維他命', '鈣片', '膠原蛋白', '薑黃', '納豆', '紅麴', 'q10', '蔓越莓', '藻油', 'dha', '滴雞精', '雞精', '燕窩', '人蔘', '靈芝', '蜆精', '高蛋白', '乳清', '代餐', '膳食纖維', '酵母', '益生元', 'b群', '鐵劑', '保健食品', '膠囊', 'nmn', '蛋白飲', '低卡', '代謝', '纖Q凍'],
  '3C數位': ['3c', '手機', '平板', '筆電', '電腦', '耳機', '藍牙', '喇叭', '音響', '充電器', '充電頭', '行動電源', '傳輸線', '充電線', '保護殼', '手機殼', '保護貼', '螢幕', '鍵盤', '滑鼠', '相機', '拍立得', '監視器', '攝影機', '行車記錄器', '智慧手錶', '手環', '遊戲機', '記憶卡', '隨身碟', '硬碟', '路由器', 'mesh', '投影', '麥克風', '電子書', '觸控筆', '支架', '標籤機', '腳架', '自拍棒', '快充', '快充線', '磁吸', '行動電源', '印表機'],
  寵物用品: ['寵物', '毛孩', '貓咪', '狗狗', '貓砂', '飼料', '貓罐', '狗罐', '主食罐', '貓糧', '狗糧', '貓抓板', '逗貓', '寵物床', '牽繩', '項圈', '外出籠', '凍乾', '肉泥', '潔牙骨', '貓', '狗', '犬', '喵', '汪'],
  運動戶外: ['運動', '健身', '瑜珈', '瑜伽', '啞鈴', '跑步機', '飛輪', '跳繩', '露營', '帳篷', '睡袋', '登山', '野餐', '戶外', '釣魚', '腳踏車', '自行車', '單車', '滑板', '游泳', '泳衣', '球拍', '羽球', '網球', '籃球', '高爾夫', '登山杖', '冰桶', '保冷', '蛋白粉'],
  文創周邊: ['周邊', '週邊', '公仔', '盲盒', '扭蛋', '小卡', '專輯', '年曆', '桌曆', '月曆', '應援', '追星', '文創', '吊飾', '鑰匙圈', '徽章', '娃娃', '布偶', '玩偶', '模型', '手辦', '手帳', '筆記本', '明信片', '貼紙', '文具', '立牌', '壓克力', '吸吸卡', '娃衣', '棉花娃'],
  旅遊票券: ['住宿券', '住宿', '飯店', '旅館', '民宿', '餐券', '票券', '門票', '樂園', '溫泉', '泡湯', '行程', '機票', '旅遊', '旅行', '一日遊', '套票', '兌換券', '電子票', '體驗券', '吃到飽', 'buffet', '下午茶券', '入住', '房券', '包車'],
};

const lower = (s) => String(s ?? '').toLowerCase().normalize('NFKC');
const isAscii = (w) => /^[\x00-\x7f]+$/.test(w);

/** 預先展開成清單並依長度排序，比對時優先吃最長的字 */
const TERMS = [];
for (const [cat, list] of Object.entries(BRANDS)) for (const w of list) TERMS.push({ cat, w: lower(w), brand: true });
for (const [cat, list] of Object.entries(KEYWORDS)) for (const w of list) TERMS.push({ cat, w: lower(w), brand: false });
TERMS.sort((a, b) => b.w.length - a.w.length);

/** 在文字中找出不重疊的關鍵字命中（最長優先）。英文字詞要整個字比對。 */
export function findTerms(text) {
  const t = lower(text);
  if (!t) return [];
  const used = new Uint8Array(t.length);
  const hits = [];
  for (const term of TERMS) {
    let from = 0;
    while (true) {
      const i = t.indexOf(term.w, from);
      if (i < 0) break;
      from = i + 1;
      const end = i + term.w.length;
      if (isAscii(term.w) && (/[a-z0-9]/.test(t[i - 1] || '') || /[a-z0-9]/.test(t[end] || ''))) continue;
      let free = true;
      for (let k = i; k < end; k++) if (used[k]) { free = false; break; }
      if (!free) continue;
      used.fill(1, i, end);
      hits.push({ ...term, index: i });
    }
  }
  return hits;
}

/** 分數：品牌 3 分；關鍵字依長度 1～4 分（商品種類比品牌準：Acer 行李箱算服飾）；標題命中加倍 */
function score(text, weight, scores) {
  for (const h of findTerms(text)) {
    const pts = h.brand ? 3 : Math.min(h.w.length, 4) * (isAscii(h.w) ? 0.5 : 1);
    scores[h.cat] = (scores[h.cat] || 0) + pts * weight;
  }
}

/**
 * 分類：商品名／標題（權重 2）＋內文（權重 1，只看前 400 字）。最高分不到 2 分就歸「其他」。
 * 回傳 { category, scores }；只要分類字串用 classify()
 */
export function classifyDetail({ product, title, text } = {}) {
  const scores = {};
  score([...new Set([product, title].filter(Boolean))].join(' '), 2, scores);
  score(String(text || '').slice(0, 400), 1, scores);
  let best = '其他';
  let max = 1.99;
  for (const k of CATEGORY_KEYS) {
    if ((scores[k] || 0) > max) {
      max = scores[k];
      best = k;
    }
  }
  return { category: best, scores };
}

export const classify = (item) => classifyDetail(item).category;

/** 從文字抓品牌名稱（保留原文大小寫），找不到回傳 null */
export function brandOf(text) {
  const raw = String(text ?? '').normalize('NFKC');
  const hit = findTerms(raw).filter((h) => h.brand && h.w !== '寵物').sort((a, b) => a.index - b.index)[0];
  return hit ? raw.slice(hit.index, hit.index + hit.w.length) : null;
}
