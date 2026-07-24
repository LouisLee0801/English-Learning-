import type { VideoRef } from './types';

// 各單元精選影片（YouTube ID 均經逐一查證確認真實存在）
// 尚未補齊的單元會顯示「影片正在補充中」
export const unitVideos: Record<string, VideoRef[]> = {
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
        { en: 'take the bus / catch a train', zh: '搭乘交通工具用 take 或 catch，不用 ride 也很自然。' },
        { en: 'Which stop do I get off at?', zh: 'get off 是下車；問該在哪一站下車的關鍵句。' },
        { en: 'top up my card', zh: 'top up 指儲值交通卡，在國外幫交通卡加值就用這個說法。' },
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
  ],
};
