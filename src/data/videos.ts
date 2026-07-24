import type { VideoRef } from './types';

// 各單元精選影片（YouTube ID 均經逐一查證確認真實存在）
// 尚未補齊的單元會顯示「影片正在補充中」
export const unitVideos: Record<string, VideoRef[]> = {
  'ordering-restaurant': [
    {
      youtubeId: 'KfjFLpjyCV4',
      title: 'How to Order in a Restaurant In English (Come to 4 Restaurants With Me!)',
      channel: 'Learn English with Bob the Canadian',
      year: 2024,
      whyWatch:
        'Bob 帶你實際走進 4 家不同類型的餐廳點餐，全程真實情境實拍，不是攝影棚對話。可以聽到北美服務生真正的語速與說法，是「點餐英文」最貼近現場的示範。',
      listenFor: [
        { en: 'Table for two, please.', zh: '進門報人數的最短講法；服務生也可能先問 How many? 或 Party of how many?' },
        { en: 'Are you ready to order, or do you need a few more minutes?', zh: '服務生來點餐的標準句，還沒好就回 Could we have a few more minutes?' },
        { en: "I'll have the... / Can I get the...", zh: '點餐兩大萬用開頭，後面直接接菜名即可。' },
        { en: 'How is everything so far?', zh: '用餐中服務生會回來關心，回 Everything’s great, thanks. 就好。' },
        { en: 'Can we get the bill, please?', zh: '要結帳時的說法；美國也常說 check：Can I get the check?' },
      ],
    },
    {
      youtubeId: '2KxsMW2_Jho',
      title: 'Order Food in an American Restaurant',
      channel: 'Speak English with Christina',
      whyWatch:
        '專講「美國餐廳」的文化流程：從入座、服務生自我介紹、點飲料到給小費，一步步拆解美式餐廳跟台灣最不一樣的地方。',
      listenFor: [
        { en: 'Party of how many?', zh: '帶位員問你們一行幾個人，回 Party of two 或直接說 Two, please.' },
        { en: "Hi, I'm Jessica, I'll be taking care of you today.", zh: '美國服務生會自我介紹並「負責」你這桌，這是小費文化的一部分。' },
        { en: 'Can I start you off with something to drink?', zh: '美式流程先點飲料再點餐，聽到這句別急著點主菜。' },
        { en: 'How would you like your steak?', zh: '問牛排熟度：rare / medium rare / medium / well-done。' },
      ],
    },
  ],
  'cafe-drinks': [
    {
      youtubeId: '5-IO5KJDHMs',
      title: 'How to order COFFEE at Starbucks in English',
      channel: 'Learn English with Jackie',
      year: 2021,
      whyWatch:
        '專門教你怎麼在星巴克客製化飲料：尺寸、冰塊、奶類、糖漿一次講清楚，完全對應台灣人到美國星巴克最容易卡住的點單流程。',
      listenFor: [
        { en: 'Can I get a tall iced latte with oat milk?', zh: '點單基本句型：Can I get a + 尺寸 + 冰/熱 + 品項 + with + 客製化。' },
        { en: 'What size would you like?', zh: '店員必問尺寸：記住 tall / grande / venti 是星巴克專用講法。' },
        { en: 'Room for cream?', zh: '點黑咖啡時常被問「要不要留加奶的空間」，回答 Yes, please. 或 No room, thanks.' },
        { en: 'Can I get a name for the order?', zh: '美國星巴克會問名字寫在杯子上，準備一個好唸的英文名。' },
      ],
    },
    {
      youtubeId: 'RofligeC9IA',
      title: 'How to order coffee in English at Starbucks!',
      channel: 'Dr. Eve',
      year: 2025,
      whyWatch:
        '較新的星巴克點單教學，示範完整的點餐對話流程與常見客製化說法，可以搭配第一支影片複習、比較不同講法。',
      listenFor: [
        { en: "What can I get started for you?", zh: '星巴克店員的招牌開場，等於「想點什麼？」。' },
        { en: 'Hot or iced?', zh: '店員確認冷熱，先想好再排隊。' },
        { en: 'Anything else for you today?', zh: '點完會被問還要不要加點，不用就說 That’s it, thanks.' },
        { en: 'decaf / extra shot / less ice', zh: '常用客製化關鍵字：低咖啡因、加一份濃縮、少冰。' },
      ],
    },
  ],
  'food-vocab': [
    {
      youtubeId: '_mw9-uk_QFk',
      title: 'Basic English vocabulary for restaurants',
      channel: 'JamesESL English Lessons (engVid)',
      year: 2013,
      whyWatch:
        'engVid 的 James 當過服務生，用過來人角度講解菜單與餐廳分類（fine dining、casual dining、fast food）與點餐必備單字，節奏慢、板書清楚，適合打底。',
      listenFor: [
        { en: 'appetizer / main course / dessert', zh: '菜單三大區塊：前菜、主餐、甜點，看懂菜單結構就不慌。' },
        { en: 'Are you ready to order?', zh: '服務生開場白，還沒決定就回 Could we have a few more minutes?' },
        { en: 'For here or to go?', zh: '內用還是外帶，速食店必問。' },
        { en: 'Can I change my order?', zh: '點錯想改單的說法，影片有示範怎麼禮貌地改。' },
      ],
    },
    {
      youtubeId: 'SlTrn13aez4',
      title: 'Talk About Food and Cooking in English - Spoken English Lesson',
      channel: 'Oxford Online English',
      year: 2020,
      whyWatch:
        '用自然對話學食物與烹調字彙：食材、味道、口感、烹調方式（grilled、roasted、steamed）都涵蓋，看懂英文菜單描述就靠這些字。',
      listenFor: [
        { en: 'sweet / salty / sour / bitter / spicy', zh: '五種基本味道形容詞，描述食物的第一步。' },
        { en: 'grilled / fried / roasted / steamed', zh: '菜單上最常見的烹調方式：碳烤、油炸、烘烤、清蒸。' },
        { en: "It's crispy on the outside and tender inside.", zh: '描述口感的句型：外酥內嫩；crispy、tender、juicy 都是菜單愛用字。' },
        { en: "What's in it?", zh: '不確定料理內容物就這樣問，對過敏或不吃的食材特別重要。' },
      ],
    },
  ],
  'bar-social': [
    {
      youtubeId: 'x47LCM_qkPk',
      title: 'How to Order in a Pub - Learn About Phrases, Slang, Idioms and Ordering',
      channel: 'Oxford Online English',
      year: 2019,
      whyWatch:
        '完整走一遍在酒吧點酒的流程：啤酒種類（lager、ale、stout）、單位講法、常見俚語，還教你聽懂 last orders 等酒吧文化訊號。',
      listenFor: [
        { en: 'What can I get you?', zh: '酒保招呼你的第一句話，等於「要點什麼？」。' },
        { en: "I'll have a pint of lager, please.", zh: '點啤酒的標準句：a pint of（一品脫）＋酒名。' },
        { en: "It's my round. / What are you having?", zh: '輪流請客文化：round 指「這一輪我請」，跟朋友喝酒必用。' },
        { en: 'Last orders!', zh: '酒吧打烊前的最後點單提醒，聽到要點就趁現在。' },
        { en: "He's had one too many.", zh: '形容某人喝多了的委婉說法。' },
      ],
    },
  ],
  'rideshare-taxi': [
    {
      youtubeId: 'oWXepavo-i0',
      title: 'ESL Lesson - Travel English - Talk to a Taxi Driver',
      channel: 'Alex Lane English',
      year: 2018,
      whyWatch:
        '針對搭 Lyft、Uber 或計程車的實用字彙與句型：確認身分、報目的地、聊天與下車付款，一支影片涵蓋整趟車程。',
      listenFor: [
        { en: 'Are you here for [name]?', zh: '上車前先確認司機是不是來接你的：搭 Uber 習慣互相核對名字。' },
        { en: 'Could you take me to the airport, please?', zh: '報目的地的禮貌句型 take me to + 地點。' },
        { en: 'How long will it take to get there?', zh: '問車程時間，旅途中最常用的問句之一。' },
        { en: 'You can drop me off here.', zh: 'drop off 是「讓我在這裡下車」的道地說法。' },
      ],
    },
    {
      youtubeId: 'NjFWtg0CBdM',
      title: 'Small Talk in a Taxi | Travel English',
      channel: 'Pocket Passport',
      year: 2021,
      whyWatch:
        '模擬車上與司機閒聊的完整對話：美國 Uber 司機很常主動聊天，先看過這支就知道怎麼自然接話、不冷場。',
      listenFor: [
        { en: 'Where are you from? / Is this your first time here?', zh: '司機最常問的兩句開場，準備好一兩句簡短回答。' },
        { en: 'How long are you in town?', zh: '問你待幾天；in town 指「在這個城市」。' },
        { en: 'Traffic is pretty heavy today.', zh: '聊塞車是車上最安全的話題，heavy traffic＝車流量大。' },
        { en: 'Keep the change.', zh: '付現時說「不用找了」，等於直接給小費。' },
      ],
    },
  ],
  'public-transit': [
    {
      youtubeId: 'Fxi4uYmCrPo',
      title: 'Talking about public transport - Real Easy English',
      channel: 'Easy English',
      year: 2026,
      whyWatch:
        'Easy English 的 Real Easy English 系列：主持人用慢速、自然的真實對話聊大眾運輸，附雙語字幕，能同時練聽力和搭車相關字彙。',
      listenFor: [
        { en: 'How do you get to work?', zh: '聊通勤方式的萬用開場：get to + 地點 表示「怎麼去」。' },
        { en: 'take the bus / catch a train', zh: '搭乘交通工具用 take 或 catch，比 ride 更常聽到。' },
        { en: 'Which stop do I get off at?', zh: 'get off 是下車；問該在哪一站下車的關鍵句。' },
        { en: 'top up my card', zh: 'top up 指儲值交通卡，在國外幫交通卡加值就用這個說法。' },
      ],
    },
    {
      youtubeId: '5WGDTOm3xRk',
      title: 'How to Talk About Transport and Driving in English - Spoken English Lesson',
      channel: 'Oxford Online English',
      whyWatch:
        '系統性整理交通相關的動詞搭配與字彙：get on/get off、miss the bus、rush hour 等，把問路與轉乘會用到的說法一次補齊。',
      listenFor: [
        { en: 'get on / get off the bus', zh: '上車 get on、下車 get off；小車（汽車、計程車）才用 get in / get out。' },
        { en: 'I missed my bus.', zh: 'miss 是「錯過」班次；趕不上車就這樣說。' },
        { en: 'How often do the trains run?', zh: '問班距（多久一班），run 在這裡指班次行駛。' },
        { en: 'rush hour', zh: '尖峰時段；避開通勤人潮前先學會這個字。' },
      ],
    },
  ],
  'airport-travel': [
    {
      youtubeId: 'PEvi3np6ncc',
      title: 'Travel English: How to go through customs at the airport',
      channel: 'English with Emma · engVid',
      year: 2014,
      whyWatch:
        'engVid 的 Emma 專講美國機場海關/移民關卡會被問什麼、該怎麼答：問題其實很固定，先聽過一遍，入境美國時就不會緊張。',
      listenFor: [
        { en: "What's the purpose of your visit?", zh: '海關必問來訪目的：回答 Business（出差）或 Vacation（觀光）即可，不用長篇大論。' },
        { en: 'How long will you be staying?', zh: '問停留多久，準備好 Two weeks. 這類簡短答案。' },
        { en: 'Where will you be staying?', zh: '問住哪裡，回答旅館名稱或親友家即可。' },
        { en: 'Do you have anything to declare?', zh: 'declare 是申報物品：沒有就說 No, nothing to declare.' },
      ],
    },
    {
      youtubeId: 'DUqdQjkvElo',
      title: 'Airport English - At the Airport - Spoken English Lesson',
      channel: 'Oxford Online English',
      whyWatch:
        '涵蓋報到櫃檯、行李托運、超重、誤點與轉機等機場全流程對話，補齊海關以外的所有機場情境。',
      listenFor: [
        { en: 'Can I see your passport and boarding pass?', zh: '從報到到登機會被要求出示證件好幾次，聽到就把護照與登機證遞出去。' },
        { en: 'Are you checking any bags?', zh: 'check a bag 是托運行李；隨身行李叫 carry-on。' },
        { en: 'Your bag is over the weight limit.', zh: '行李超重時會聽到的句子，可能要付 excess baggage fee（超重費）。' },
        { en: 'Your flight has been delayed.', zh: 'delayed 誤點、cancelled 取消、boarding 登機中：看電子看板必認得的字。' },
      ],
    },
  ],
  'hotel-checkin': [
    {
      youtubeId: 'FJrRiVjeOMc',
      title: 'Hotel English - Using Travel English at Hotels',
      channel: 'Oxford Online English',
      year: 2018,
      whyWatch:
        '從訂房、入住報到、反映問題到退房一次演完整個旅館情境，對話語速適中並帶字幕，是旅館英文最完整的一支教學影片。',
      listenFor: [
        { en: 'I have a reservation under [name].', zh: '報到第一句：under + 名字 表示「訂在誰的名下」。' },
        { en: 'I have you in a double room for three nights, is that correct?', zh: '櫃檯跟你核對房型與天數，聽懂後回 That’s right. 即可。' },
        { en: 'Could I see your passport and a credit card?', zh: '入住必經流程：出示護照與信用卡（押金/擔保用）。' },
        { en: 'What time is check-out?', zh: '問退房時間；順便學 breakfast is included（含早餐）這類資訊句。' },
        { en: "I'd like to check out, please.", zh: '退房時開口的第一句，接著核對帳單有無 minibar 等額外費用。' },
      ],
    },
    {
      youtubeId: '97z98l5n704',
      title: 'Booking a Hotel Conversation 🏨 English Conversation',
      channel: 'EverydayEnglish',
      year: 2023,
      whyWatch:
        '以完整對話示範訂房與入住的常用句，語速平穩、句子簡短，適合先跟讀模仿再看 Oxford 那支完整版。',
      listenFor: [
        { en: "I'd like to book a room for two nights.", zh: '訂房基本句：book a room for + 天數。' },
        { en: 'Would you like a single or a double room?', zh: '櫃檯問房型：單人房 single、雙人房 double、兩張床 twin。' },
        { en: 'Does the room have Wi-Fi?', zh: '確認設施的問法，也可換成 air conditioning、breakfast。' },
        { en: "Here's your key card. Your room is on the fifth floor.", zh: '拿到房卡時聽懂樓層與房號，key card 是感應房卡。' },
      ],
    },
  ],
  'small-talk-basics': [
    {
      youtubeId: 'eBpOtBVY66o',
      title: 'American Culture Small Talk | USA',
      channel: 'Learn English with Camille',
      year: 2023,
      whyWatch:
        '美國人為什麼在超市排隊、健身房、遛狗時都能跟陌生人聊起來？這支影片從文化面講解美式 small talk 的固定模式與安全話題，中級程度剛好。',
      listenFor: [
        { en: "How's it going?", zh: '美式打招呼萬用句，不是真的要你報告近況，回 Good, how about you? 就好。' },
        { en: "Beautiful day, isn't it?", zh: '天氣是最安全的開場話題，附加問句 isn’t it 讓對方容易接話。' },
        { en: 'Did you catch the game last night?', zh: '運動賽事是美國人常聊的話題，catch 在這裡是「有看到」。' },
        { en: 'Have a good one!', zh: '結束對話的常用道別語，等於 Have a nice day。' },
      ],
    },
    {
      youtubeId: 'WGoIoDuf83o',
      title: 'How to make GREAT Small Talk | English Conversation Practice',
      channel: 'mmmEnglish',
      year: 2019,
      whyWatch:
        'Emma 示範怎麼開啟、延續、結束一段 small talk，提供大量可以直接背起來用的開場句，搭配文化面講解非常實戰。',
      listenFor: [
        { en: 'Lovely weather today, right?', zh: '用天氣開場的示範句；重點是語調輕鬆、句子要短。' },
        { en: 'Are you from around here?', zh: '問對方是不是本地人，旅行時超好用的開場。' },
        { en: 'What do you do?', zh: '問職業的標準句（不是「你在幹嘛」），回答用 I work in... / I’m a...' },
        { en: 'It was nice talking to you!', zh: '禮貌結束對話的句子，離開前說這句不失禮。' },
      ],
    },
  ],
  'keeping-conversation': [
    {
      youtubeId: 'blUuMcKuzQE',
      title: 'SMALL TALK | How to keep a conversation going in English',
      channel: 'mmmEnglish',
      year: 2023,
      whyWatch:
        'Emma 的 7 個延續話題技巧：怎麼用開放式問題、附和與追問讓對話不斷線，直接對應本單元的「接話」核心技能。',
      listenFor: [
        { en: 'What / Where / When / Why / How...?', zh: '開放式 WH 問句是接話神器，避免只能回 Yes/No 的問題。' },
        { en: 'Oh really? How was that?', zh: '「附和＋追問」組合：先表達興趣再把球丟回去。' },
        { en: 'That reminds me of...', zh: '把話題接到自身經驗的轉場句，讓對話自然延伸。' },
        { en: 'What about you?', zh: '回答完自己的部分後反問對方，最簡單的保持來回的方法。' },
      ],
    },
    {
      youtubeId: 'UcVNwvpQm8A',
      title: 'Small Talk | Useful Phrases & Questions for Everyday Conversation',
      channel: 'mmmEnglish',
      year: 2022,
      whyWatch:
        '一次補足 30 個日常對話中「卡住時」可以用的句子與問題，跟上一支影片搭配就是完整的接話工具箱。',
      listenFor: [
        { en: 'How was your weekend?', zh: '週一最常見的開場問題，回答完記得反問 How about yours?' },
        { en: 'Sounds great! / No way! / That’s awesome!', zh: '簡短反應詞（reactions）讓對方知道你有在聽，是母語者對話的潤滑劑。' },
        { en: 'Anyway, I should get going.', zh: '想禮貌結束對話時的轉場句，anyway 是收尾訊號。' },
        { en: 'By the way...', zh: '換話題的轉場語，讓切換不突兀。' },
      ],
    },
  ],
  'slang-idioms': [
    {
      youtubeId: 'whpmEpDxJA8',
      title: '21 American Slang Words You Need In 2021',
      channel: 'Go Natural English',
      year: 2020,
      whyWatch:
        'Gabby 用例句講解 21 個美國人天天在用的俚語，發音清楚、例句貼近生活，是俚語入門的好起點。',
      listenFor: [
        { en: "I'm down. / I'm in.", zh: '「我要參加、算我一份」，朋友揪你時最常用的回覆。' },
        { en: 'hang out', zh: '跟朋友「混、耍廢、聚一聚」，美國人口中出現頻率極高。' },
        { en: "That's cool. / Awesome!", zh: '萬用稱讚與附和詞，聽起來立刻不像課本英文。' },
        { en: 'What’s up?', zh: '非正式打招呼，回 Not much. 就可以。' },
      ],
    },
    {
      youtubeId: '2llUlAsnp5M',
      title: 'Social Media Acronyms and Internet Slang',
      channel: 'Go Natural English',
      whyWatch:
        '補上網路與簡訊常見的縮寫俚語（LOL、BRB、DM 等）：跟美國朋友傳訊息、看留言時一定會遇到。',
      listenFor: [
        { en: 'LOL / LMAO', zh: '「笑死」等級的網路縮寫，表示覺得好笑，不一定真的在大笑。' },
        { en: 'BRB / TTYL', zh: 'be right back 馬上回來；talk to you later 晚點聊，傳訊息常用。' },
        { en: 'DM me.', zh: 'DM（direct message）當動詞用：「私訊我」。' },
        { en: 'FOMO', zh: 'fear of missing out 錯過的焦慮感，口語也直接當名詞講。' },
      ],
    },
  ],
  'shopping-returns': [
    {
      youtubeId: 'Ck1dCV070s8',
      title: 'Everyday English Ep. 26 - How to Return an Item to a Store – English Conversation Practice',
      channel: 'Everyday English',
      year: 2025,
      whyWatch:
        '顧客與店員的完整退貨對話：說明退貨原因、出示收據、選擇退款或換貨，流程跟美國實體店面一模一樣。',
      listenFor: [
        { en: "I'd like to return this, please.", zh: '退貨開場白；換貨則說 I’d like to exchange this.' },
        { en: 'Do you have the receipt?', zh: '店員必問收據；receipt 的 p 不發音，聽力上要注意。' },
        { en: "Is there anything wrong with it?", zh: '店員問退貨原因：It doesn’t fit.（不合身）/ It’s defective.（有瑕疵）。' },
        { en: 'Would you like a refund or store credit?', zh: '退現金還是換購物金；store credit 是只能在該店消費的額度。' },
      ],
    },
    {
      youtubeId: 'zORwdAhBHBY',
      title: "AEE - What's Your Return Policy? English Vocabulary for Shopping",
      channel: 'All Ears English',
      whyWatch:
        '兩位美國主持人用自然語速聊退換貨政策相關字彙：return policy、full refund、exchange，先聽懂規則才知道自己的權益。',
      listenFor: [
        { en: "What's your return policy?", zh: '買之前先問退貨政策，美國商店大多可在期限內退貨。' },
        { en: 'You can return it within 30 days.', zh: 'within + 天數 是退貨期限的標準說法。' },
        { en: 'full refund', zh: '全額退款；退回原卡叫 refund to the original card。' },
        { en: 'Keep your receipt just in case.', zh: '「收據留著以防萬一」，just in case 是高頻口語。' },
      ],
    },
  ],
  'grocery-supermarket': [
    {
      youtubeId: 'CdXgzaSGwsg',
      title: 'Shopping at the Supermarket 🛒 English Conversation',
      channel: 'Woodward English',
      year: 2020,
      whyWatch:
        '把超市購物會用到的問句與字彙用情境對話演出來：找商品、問價格、結帳，涵蓋美式超市從進門到離開的常用英文。',
      listenFor: [
        { en: 'Excuse me, where can I find the milk?', zh: '找不到商品的萬用問句：where can I find + 商品。' },
        { en: "It's in aisle five.", zh: 'aisle（走道）是超市關鍵字，s 不發音，唸作 /aɪl/。' },
        { en: 'Paper or plastic?', zh: '結帳時問你要紙袋還是塑膠袋，美國超市經典問題。' },
        { en: 'Do you have a rewards card?', zh: '收銀員常問會員卡，沒有就回 No, I don’t.' },
        { en: 'on sale / buy one get one free', zh: '特價與買一送一（常縮寫 BOGO），看懂標籤能省不少錢。' },
      ],
    },
  ],
  'doctor-pharmacy': [
    {
      youtubeId: 'RaB5Bydz8rE',
      title: 'How to Talk About Illness and Medicine in English',
      channel: 'Oxford Online English',
      year: 2019,
      whyWatch:
        '從描述症狀、看診對話到去藥局領藥，一支影片走完生病流程；對話式教學讓你同時聽懂醫生端與病人端的說法。',
      listenFor: [
        { en: "What are your symptoms?", zh: '醫生問症狀；symptom（症狀）是就醫核心單字。' },
        { en: "I've had a sore throat and a fever for three days.", zh: '描述症狀的句型：I’ve had + 症狀 + for + 時間。' },
        { en: "I'll write you a prescription.", zh: 'prescription 是處方箋，拿著它去藥局才能領處方藥。' },
        { en: 'Take one tablet twice a day after meals.', zh: '藥師交代服藥方式：一次一錠、一天兩次、飯後服用。' },
        { en: 'over-the-counter medicine', zh: '不用處方就能買的成藥，縮寫 OTC。' },
      ],
    },
    {
      youtubeId: 'j7d8xXCrvn0',
      title: 'Visiting the Doctor 🤒 English Conversation',
      channel: 'Woodward English',
      year: 2021,
      whyWatch:
        '用簡短情境對話演出掛號、描述不舒服、聽醫囑的過程，句子好模仿，適合看完 Oxford 那支後做跟讀練習。',
      listenFor: [
        { en: "I'd like to make an appointment to see the doctor.", zh: '預約看診的標準句；美國看醫生幾乎都要先 make an appointment。' },
        { en: "What seems to be the problem?", zh: '醫生的開場問句，等於「哪裡不舒服？」。' },
        { en: "I don't feel well. I have a headache and a cough.", zh: '先說整體感覺再列症狀：headache 頭痛、cough 咳嗽。' },
        { en: 'Get plenty of rest and drink lots of fluids.', zh: '醫囑常用句：多休息、多喝水（fluids 泛指液體）。' },
      ],
    },
  ],
  'bank-phone-services': [
    {
      youtubeId: 'TeNTh1t7wVo',
      title: 'Practise Talking On The Phone In English: Call the Bank With Me!',
      channel: 'mmmEnglish',
      year: 2022,
      whyWatch:
        'Emma 帶你「實際打電話給銀行」：從自動語音選單、身分驗證到說明來電目的，完整重現打客服電話最讓人緊張的每一步。',
      listenFor: [
        { en: 'For account services, press one.', zh: '自動語音選單（IVR）的固定句式：For + 服務, press + 數字。' },
        { en: 'Can I have your account number and date of birth?', zh: '客服核對身分必問：帳號與生日，先把資料準備在手邊。' },
        { en: "I'm calling about a charge on my card.", zh: '說明來電目的的句型：I’m calling about + 事項。' },
        { en: 'Could you put me through to a representative?', zh: 'put through 是轉接；想跳過機器人找真人就說這句。' },
        { en: 'Sorry, could you say that again more slowly?', zh: '電話聽不清楚很正常，這句是保命句，別怕說出口。' },
      ],
    },
    {
      youtubeId: 'KBSrZYXkkyE',
      title: 'Learn English for Call Centers and Customer Service Jobs',
      channel: 'English with Rebecca · engVid',
      year: 2016,
      whyWatch:
        '從客服人員角度整理電話禮貌用語：聽懂客服的固定句式（How can I assist you? / May I place you on hold?），打電話時就能預測對方下一句。',
      listenFor: [
        { en: 'How can I assist you today?', zh: '客服標準開場，聽到後直接說明來意即可。' },
        { en: 'May I place you on hold for a moment?', zh: 'on hold 是「線上稍等」，同意就回 Sure, no problem.' },
        { en: 'Is there anything else I can help you with?', zh: '客服收尾必問；沒有就說 No, that’s all. Thank you.' },
        { en: 'Thank you for your patience.', zh: '等候後客服的慣用致謝句，也可以自己拿來用。' },
      ],
    },
  ],
  emergency: [
    {
      youtubeId: 'AdeYHFTk4hk',
      title: 'How to make an emergency call in English',
      channel: 'Simple English Videos',
      year: 2019,
      whyWatch:
        '教你打 911（或 112）報案的完整流程並示範真實通話：報地點、說明狀況、回答接線員問題。緊急時刻沒時間查單字，這支一定要先看過。',
      listenFor: [
        { en: '911, what’s your emergency?', zh: '接線員的第一句話，聽到後先講「需要哪種協助」：police / ambulance / fire。' },
        { en: 'I need an ambulance.', zh: '叫救護車的最短句型；救護車唸 AM-byə-ləns，先練熟。' },
        { en: "What's your location? / Where are you calling from?", zh: '報地點最重要：先講街道地址或交叉路口，說不出來就唸路牌。' },
        { en: 'Someone is choking / unconscious.', zh: '描述狀況的關鍵字：噎到、失去意識；短句比完整句更有效。' },
        { en: 'Please stay on the line.', zh: '接線員請你「不要掛斷」，聽到這句就保持通話等指示。' },
      ],
    },
  ],
};
