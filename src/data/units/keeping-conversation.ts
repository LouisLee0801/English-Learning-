import type { Unit } from '../types';

const unit: Unit = {
  id: 'keeping-conversation',
  emoji: '🔄',
  title: 'Keeping the Conversation Going',
  titleZh: '接話與延續話題',
  tagline: '學會萬用接話公式與附和詞，聽不懂也能優雅救場，從此告別「喔喔」「哈哈」然後冷場',
  category: '社交',
  dialogues: [
    {
      title: 'The Golden Formula at a Party',
      titleZh: '派對上的黃金接話公式',
      scene: '朋友 Kevin 的聚會上，你跟初次見面的 Jordan 聊起來。整段對話示範接話三步驟：回應（reaction）＋相關經驗（relate）＋回問（return）。照這個公式，任何話題都接得下去。',
      lines: [
        {
          speaker: 'Jordan',
          en: 'So how do you know Kevin?',
          zh: '所以你是怎麼認識 Kevin 的？',
          note: '"How do you know ___?" 是聚會上認識新朋友的第一標準題。有共同朋友＝有安全話題，從這裡展開最不會乾。',
        },
        {
          speaker: 'You',
          en: "We're roommates, actually. What about you?",
          zh: '我們其實是室友。你呢？',
          note: '答完馬上 "What about you?" 把球丟回去——回問是讓對話活著的最低成本動作，忘記回問是冷場的第一大死因。',
        },
        {
          speaker: 'Jordan',
          en: "We work together. I'm on the design team at his company.",
          zh: '我們是同事。我在他公司的設計團隊。',
        },
        {
          speaker: 'You',
          en: 'Oh nice! I actually studied design for a year before I switched majors.',
          zh: '喔不錯欸！我其實學過一年設計，後來才轉系。',
          note: '公式第二步：丟出「相關經驗」。不用是了不起的經驗，一年、一次、聽朋友說過都行——重點是給對方一個掛鉤，讓話題長出分支。',
        },
        {
          speaker: 'Jordan',
          en: 'No way! What made you switch?',
          zh: '真假！那你怎麼會轉走？',
          note: '"What made you ___?" 是超好用的追問句型，比 "Why?" 溫和。單獨一個 "Why?" 有時聽起來像在質問。',
        },
        {
          speaker: 'You',
          en: 'Honestly? I loved the ideas but hated the software, haha. Do you ever get sick of it?',
          zh: '老實說？我愛那些概念，但恨死那些軟體了哈哈。你會有做到膩的時候嗎？',
          note: '自嘲＋回問，一次完成。"Do you ever ___?" 是把話題丟回去的好句型，比 "And you?" 更有內容。',
        },
        {
          speaker: 'Jordan',
          en: "Some days are a grind, not gonna lie. But the team makes it worth it.",
          zh: '不騙你，有些日子真的很磨。但團隊很棒，值得。',
          note: '"A grind" ＝ 苦工、磨人的日常。"Not gonna lie"（不騙你／說真的）是年輕人高頻口頭禪，網路上縮寫成 ngl。',
        },
        {
          speaker: 'You',
          en: "That's awesome. Oh, Kevin mentioned you just got back from a trip?",
          zh: '那很棒欸。啊對，Kevin 說你剛旅行回來？',
          note: '拿共同朋友提過的事當話題是聚會神技，代表你有在關心，對方也一定有東西可講。',
        },
        {
          speaker: 'Jordan',
          en: 'Yeah! I just got back from Portland last week.',
          zh: '對！我上週剛從波特蘭回來。',
        },
        {
          speaker: 'You',
          en: 'Oh nice! How was it?',
          zh: '喔讚欸！好玩嗎？',
          note: '"How was it?" 三個字是全宇宙最好用的接話句。任何人講完「我去了／做了／看了什麼」，都可以用它接，而且對方一定講得下去。',
        },
        {
          speaker: 'Jordan',
          en: 'So good. The food scene there is unreal.',
          zh: '超棒。那裡的美食圈誇張到不真實。',
          note: '"Unreal" ＝ 好到不像真的。"Food scene" 指一個城市的美食生態，music scene、art scene 同理。',
        },
        {
          speaker: 'You',
          en: "I've heard! My friend went last year and wouldn't shut up about the doughnuts.",
          zh: '我有聽說！我朋友去年去，回來對那些甜甜圈讚不絕口。',
          note: '"Wouldn’t shut up about ___" 直翻是「講到不肯閉嘴」，實際上是可愛的誇飾＝「一直狂推」。又是「相關經驗」的示範——朋友的經驗也算你的素材。',
        },
        {
          speaker: 'Jordan',
          en: 'Ha, probably Voodoo Doughnut. Totally worth the hype.',
          zh: '哈，八成是 Voodoo Doughnut。完全名不虛傳。',
          note: '"Worth the hype" ＝ 對得起那些吹捧、名不虛傳。反過來說 "overhyped" 就是「被吹過頭了」。',
        },
        {
          speaker: 'You',
          en: "Good to know! I've been meaning to plan a trip out west, so I'm taking notes.",
          zh: '學到了！我一直想安排一趟西岸旅行，我在做筆記了。',
          note: '"I’ve been meaning to ___" ＝ 一直想做但還沒做。把對方的話跟自己的計畫連起來，話題又能再滾一輪。',
        },
      ],
    },
    {
      title: 'Lost? Ask, Recover, and Change the Subject',
      titleZh: '聽不懂？優雅要求重複、救場、換話題',
      scene: '酒吧很吵，新朋友 Alex 講話又快又多俚語。這段示範三個救命技能：聽不懂怎麼問、不懂的字怎麼追問、話題乾掉怎麼轉場——全程不尷尬。',
      lines: [
        {
          speaker: 'Alex',
          en: "...and then the whole thing went sideways 'cause the venue double-booked us.",
          zh: '……結果整件事就翻車了，因為場地把我們的檔期重複租出去了。',
          note: '"Go sideways" ＝ 出包、翻車。"Double-book" ＝ 重複預訂。聽不懂沒關係，下一句教你怎麼辦。',
        },
        {
          speaker: 'You',
          en: "Sorry, come again? It's pretty loud in here.",
          zh: '抱歉，再說一次？這裡蠻吵的。',
          note: '"Sorry, come again?" 是要求重複的口語首選，比課本教的 "Pardon?" 自然（Pardon 在美國略顯老派）。補一句環境理由（好吵）可以卸掉「是我英文差」的心理壓力——母語者自己也天天這樣說。',
        },
        {
          speaker: 'Alex',
          en: 'The venue double-booked us — two events, same room, same night.',
          zh: '場地重複預訂了——兩場活動、同一間、同一晚。',
          note: '你要求重複後，對方通常會自動講慢、講簡單。這就是為什麼「問」永遠比「裝懂」划算。',
        },
        {
          speaker: 'You',
          en: 'Oh no. So what did you guys do?',
          zh: '慘了。那你們怎麼辦？',
          note: '"So what did you do?" 是聽故事的萬用追問，等於幫對方的故事按下「繼續播放」。',
        },
        {
          speaker: 'Alex',
          en: 'We ended up cramming like eighty people into the coffee shop next door.',
          zh: '我們最後把差不多八十個人塞進隔壁的咖啡店。',
          note: '"Ended up ___ing" ＝ 最後變成怎樣，講故事必備。"Cram" ＝ 硬塞。',
        },
        {
          speaker: 'You',
          en: 'No way! That’s wild. Did it actually work out?',
          zh: '不會吧！太扯了。結果真的有成嗎？',
          note: '附和二連發："No way!"（真假！）＋ "That’s wild."（太扯了）。附和詞要「出聲」，美國人聊天很依賴這些聲音回饋，你安靜聽反而會讓對方以為你沒興趣。',
        },
        {
          speaker: 'Alex',
          en: 'Weirdly, yeah. Best show we ever played.',
          zh: '很奇妙地，有欸。那是我們表演過最棒的一場。',
        },
        {
          speaker: 'You',
          en: "Wait, back up — you're in a band?",
          zh: '等等，倒帶一下——你有玩團？',
          note: '"Wait, back up — you ___?" 是抓住對方話裡亮點的追問神句，表示「這太有趣了我要展開聽」。對方聽到只會開心。',
        },
        {
          speaker: 'Alex',
          en: "Yeah, we play like garage-y indie stuff. Our drummer's lowkey the GOAT.",
          zh: '對啊，我們玩那種車庫感的獨立音樂。我們鼓手低調地說是史上最強。',
          note: '"Lowkey" ＝ 低調地、有點；"GOAT" ＝ greatest of all time（史上最強）。聽不懂的縮寫直接問，見下句。',
        },
        {
          speaker: 'You',
          en: 'Sorry, what does GOAT mean? I keep hearing it everywhere.',
          zh: '抱歉，GOAT 是什麼意思？我最近到處聽到這個詞。',
          note: '問單字的標準句："What does ___ mean?"。加一句 "I keep hearing it" 把自己從「英文不好」變成「求知若渴」，母語者反而覺得你很好聊，還會很樂意當老師。',
        },
        {
          speaker: 'Alex',
          en: "Oh! Greatest of all time. It's a compliment, promise.",
          zh: '喔！Greatest of all time，史上最強。是稱讚啦，我保證。',
        },
        {
          speaker: 'You',
          en: 'Ah, got it. Learning something new every day, ha.',
          zh: '啊，懂了。每天都在學新東西，哈。',
          note: '"Got it" ＝ 懂了。自嘲一句順勢收掉這個小插曲，完全不尷尬。',
        },
        {
          speaker: 'Alex',
          en: 'Ha, right? So... yeah. That was Portland.',
          zh: '哈，對吧？所以……嗯。波特蘭的事就是這樣。',
          note: '警報！"So... yeah." 是話題自然死亡的聲音。這時候誰先丟出新話題，誰就拯救了這場對話。轉場神句看下一行。',
        },
        {
          speaker: 'You',
          en: 'Oh, speaking of music — have you caught any good shows around here lately?',
          zh: '啊，說到音樂——你最近在這附近有看到什麼好的演出嗎？',
          note: '"Speaking of ___" 是最順的轉場詞：從剛剛話題裡撿一個關鍵字，滑進新話題，一點都不突兀。完全想不到梗時，用 "Random question, but ___"（突然想到喔）硬轉也完全合法。',
        },
        {
          speaker: 'Alex',
          en: "Actually, yeah! There's this tiny venue on 5th you'd love...",
          zh: '還真的有！第五街有一間你一定會愛的小場地……',
          note: '轉場成功，對話重新起飛。記住：話題乾掉不是失敗，是換話題的信號。',
        },
      ],
    },
  ],
  vocab: [
    {
      word: 'No way!',
      zh: '真假！／不會吧！（驚訝附和，全年齡通用）',
      example: 'I got the job! — No way! Congrats!',
      exampleZh: '我錄取了！——真假！恭喜！',
    },
    {
      word: "That's wild.",
      zh: '太扯了、太誇張了（年輕人～中年都用，聽到誇張故事時的附和）',
      example: 'He biked across the whole country. — That’s wild.',
      exampleZh: '他騎腳踏車橫越整個國家。——太扯了。',
    },
    {
      word: 'I feel you.',
      zh: '我懂你、我超有感（口語，朋友間；正式場合改說 I understand）',
      example: "I'm so burned out this week. — I feel you, man.",
      exampleZh: '我這週累爆了。——我懂你，兄弟。',
    },
    {
      word: 'For real?',
      zh: '真的假的？（＝Really? 的年輕版；For real. 直述句則是「真的」）',
      example: 'They broke up? For real?',
      exampleZh: '他們分手了？真的假的？',
    },
    {
      word: 'I know, right?',
      zh: '就是說啊！（強烈同意，網路縮寫 ikr）',
      example: 'This place is so overpriced. — I know, right?',
      exampleZh: '這間店貴到誇張。——就是說啊！',
    },
    {
      word: 'Totally.',
      zh: '完全同意、真的（萬用附和，單獨成句）',
      example: 'We should do this more often. — Totally.',
      exampleZh: '我們應該常這樣聚。——真的。',
    },
    {
      word: 'Fair enough.',
      zh: '好吧，有道理（接受對方說法，帶點讓步）',
      example: "I just don't like horror movies. — Fair enough.",
      exampleZh: '我就是不愛恐怖片。——好吧，有道理。',
    },
    {
      word: 'That makes sense.',
      zh: '有道理、合理（表示聽懂並認同對方的解釋）',
      example: 'I moved here for the weather. — Ah, that makes sense.',
      exampleZh: '我是為了天氣搬來的。——啊，合理。',
    },
    {
      word: 'Same here.',
      zh: '我也是（回應對方經驗；更年輕的講法是單一個 Same）',
      example: "I can't function without coffee. — Same here.",
      exampleZh: '我沒咖啡就無法運作。——我也是。',
    },
    {
      word: 'come again',
      zh: '再說一次（要求重複的口語，Sorry, come again?）',
      example: "Sorry, come again? I didn't catch that.",
      exampleZh: '抱歉，再說一次？我沒聽清楚。',
    },
    {
      word: 'catch',
      zh: '聽清楚、跟上（I didn’t catch that ＝ 我沒聽清楚，不是「沒接到」）',
      example: "I didn't catch your name — what was it again?",
      exampleZh: '我沒聽清楚你的名字——可以再說一次嗎？',
    },
    {
      word: 'You lost me.',
      zh: '我跟不上了、你把我講糊塗了（友善版的「聽不懂」）',
      example: 'Wait, you lost me at the second step. Can you explain that part again?',
      exampleZh: '等等，第二步開始我就跟不上了。那部分可以再講一次嗎？',
    },
    {
      word: 'follow-up question',
      zh: '追問、延伸問題',
      example: 'Can I ask a follow-up question about your trip?',
      exampleZh: '關於你的旅行我可以追問一個問題嗎？',
    },
    {
      word: 'speaking of which',
      zh: '說到這個（順勢轉場的連接詞）',
      example: "Speaking of which, how did your interview go?",
      exampleZh: '說到這個，你的面試後來怎麼樣？',
    },
    {
      word: 'that reminds me',
      zh: '這讓我想到（轉話題兼開新話題）',
      example: 'Oh, that reminds me — did you ever find an apartment?',
      exampleZh: '啊，這讓我想到——你後來找到公寓了嗎？',
    },
    {
      word: 'by the way',
      zh: '對了、順帶一提（插入新話題，網路縮寫 btw）',
      example: 'By the way, happy belated birthday!',
      exampleZh: '對了，補祝你生日快樂！',
    },
    {
      word: 'anyway',
      zh: '總之、好啦（拉回正題或準備收尾的信號）',
      example: 'Anyway, enough about work. How was your weekend?',
      exampleZh: '總之，工作的事先不聊了。你週末過得如何？',
    },
    {
      word: 'How come?',
      zh: '怎麼會？為什麼？（比 Why? 溫和口語，後面接直述句語序）',
      example: "You're not coming? How come?",
      exampleZh: '你不來喔？怎麼會？',
    },
    {
      word: "What's it like?",
      zh: '那是什麼感覺／什麼樣子？（打開話匣子的追問）',
      example: "You grew up in Alaska? What's that like?",
      exampleZh: '你在阿拉斯加長大？那是什麼感覺啊？',
    },
    {
      word: 'awkward silence',
      zh: '尷尬的沉默、乾掉的瞬間',
      example: 'There was this awkward silence, so I asked about her dog.',
      exampleZh: '當時一陣尷尬的沉默，所以我就問起她的狗。',
    },
    {
      word: 'zone out',
      zh: '放空、恍神',
      example: 'Sorry, I zoned out for a second — what were you saying?',
      exampleZh: '抱歉我剛恍神了一下——你剛說什麼？',
    },
    {
      word: 'go sideways',
      zh: '（計畫、事情）出包、翻車',
      example: 'The road trip went sideways when the car broke down.',
      exampleZh: '車子拋錨之後，那趟公路旅行就整個翻車了。',
    },
    {
      word: 'end up',
      zh: '最後變成、結果落得（講故事必備）',
      example: 'We ended up talking till 2 a.m.',
      exampleZh: '我們最後聊到凌晨兩點。',
    },
    {
      word: 'a grind',
      zh: '磨人的苦差事、日復一日的操勞',
      example: 'The commute is a grind, but the job itself is great.',
      exampleZh: '通勤很磨人，但工作本身很棒。',
    },
    {
      word: 'unreal',
      zh: '誇張到不真實、猛到不像話（正面居多）',
      example: 'The view from the top was unreal.',
      exampleZh: '山頂的景色美到不真實。',
    },
    {
      word: 'worth the hype',
      zh: '名不虛傳、對得起那些吹捧（反義：overhyped 被吹過頭）',
      example: 'Is that ramen place actually worth the hype? — Honestly, yeah.',
      exampleZh: '那間拉麵店真的名不虛傳嗎？——老實說，真的。',
    },
    {
      word: "wouldn't shut up about",
      zh: '對某事讚不絕口、一直狂講（誇飾，朋友間用）',
      example: 'She wouldn’t shut up about that new Thai place, so we have to go.',
      exampleZh: '她對那間新泰式餐廳讚不絕口，所以我們非去不可。',
    },
    {
      word: "I've been meaning to",
      zh: '我一直想做（但還沒做）',
      example: "I've been meaning to check out that museum.",
      exampleZh: '我一直想去逛那間博物館。',
    },
    {
      word: 'not gonna lie',
      zh: '不騙你、說真的（年輕人口頭禪，網路縮寫 ngl）',
      example: 'Not gonna lie, I almost cried at that movie.',
      exampleZh: '不騙你，那部電影我差點看哭。',
    },
  ],
  phrases: [
    {
      en: 'Oh nice! I actually ___. What about you?',
      zh: '喔不錯欸！我其實___。你呢？',
      usage: '萬用接話公式：回應（Oh nice!）＋相關經驗（I actually ___）＋回問（What about you?）。經驗不用高大上——去過一次、朋友做過、看過影片都算數。這一條公式背起來，八成的閒聊都死不了。',
    },
    {
      en: 'How was it?',
      zh: '怎麼樣？好玩（好吃／好看）嗎？',
      usage: '對方說完任何「我去了／吃了／看了 X」都能接，三個字讓對方自動展開。加強版："How was it? I’ve always wanted to go."',
    },
    {
      en: "What's that like?",
      zh: '那是什麼感覺？',
      usage: '對方提到特別的經歷（住過國外、養蛇、上夜班）時的追問。這句表示你真的好奇，比 "Oh, cool" 高一個檔次，對方通常會很開心地講下去。',
    },
    {
      en: 'What made you ___?',
      zh: '你怎麼會（決定）___？',
      usage: '追問動機用，比 "Why?" 委婉。What made you move here? / What made you pick that major? 單獨的 "Why?" 有時像審問，加上 made you 就變成好奇。',
    },
    {
      en: 'Wait, back up — you ___?',
      zh: '等等，倒帶一下——你___？',
      usage: '對方輕描淡寫帶過一個亮點時，用這句抓回來展開：Wait, back up — you lived in Japan? 這是「我對你的故事有興趣」的最強信號。',
    },
    {
      en: 'So what did you do?',
      zh: '那你怎麼辦？／後來你怎麼做？',
      usage: '聽故事的推進器。對方講到困境或轉折時丟出來，等於幫故事按「下一集」。同款："And then what happened?"',
    },
    {
      en: 'Sorry, come again?',
      zh: '抱歉，再說一次？',
      usage: '沒聽清楚的首選。可加環境理由卸壓力："Sorry, come again? It’s so loud in here." 正式一點的場合用 "Sorry, could you say that again?"。',
    },
    {
      en: "Sorry, I didn't quite catch that.",
      zh: '抱歉，我沒完全聽清楚。',
      usage: '比 come again 稍正式，對長輩、店員、電話中都適用。指定漏聽的部分更高效："I didn’t catch the last part — after the station?"',
    },
    {
      en: 'What does ___ mean?',
      zh: '___是什麼意思？',
      usage: '聽到不懂的俚語、縮寫直接問，別裝懂。加一句 "I keep hearing that everywhere" 會把場面從「我英文差」變成「教教我」，母語者最愛當這種老師。',
    },
    {
      en: 'Speaking of ___, ...',
      zh: '說到___，……',
      usage: '最滑順的轉場：從對方剛講的內容撿一個詞當跳板。Speaking of food, have you tried that new place? 話題之間有橋，就不會有「硬轉」的突兀感。',
    },
    {
      en: 'Oh, that reminds me — ...',
      zh: '啊，這讓我想到——……',
      usage: '第二好用的轉場，連結可以很鬆散沒關係，反正沒人會查證你到底「想到」了什麼。想完全換話題時的合法後門。',
    },
    {
      en: 'Random question, but ___?',
      zh: '突然想到喔，___？',
      usage: '零轉場硬換話題的免責聲明。Random question, but do you know any good hiking spots? 先自首「這題很跳」，跳 Tone 就變得可愛而不突兀。冷場救星。',
    },
    {
      en: "That's a good question. Let me think...",
      zh: '好問題。讓我想想……',
      usage: '被問到需要時間想的問題時，用這句買時間，比沉默三秒自然一萬倍。想不出來也可以誠實說 "Hmm, I honestly don’t know — what about you?" 把球丟回去。',
    },
  ],
  quiz: [
    {
      question: '對方說 "I just got back from Iceland."（我剛從冰島回來）。哪個回應最能讓對話繼續？',
      options: [
        '"Oh."',
        '"Nice weather today, huh?"',
        '"No way! How was it? I’ve always wanted to go."',
        '"Iceland is an island country in the North Atlantic."',
      ],
      answer: 2,
      explanation:
        '公式：驚訝附和（No way!）＋追問（How was it?）＋掛鉤（I’ve always wanted to go）。只回 "Oh" 是句點；突然聊天氣是逃走；背維基百科是……不要這樣。',
    },
    {
      question: '酒吧很吵，你完全沒聽清對方剛剛講的話。最自然的做法是？',
      options: [
        '微笑點頭說 "Yes, yes"，賭它不是問句',
        '說 "Sorry, come again? It’s pretty loud in here."',
        '沉默盯著對方，等他自己重講',
        '說 "Your English is unclear. Please speak better."',
      ],
      answer: 1,
      explanation:
        '要求重複＋環境理由是母語者自己也天天用的標準操作。裝懂點頭最危險——如果那是問句，你的 "Yes" 可能已經答應了什麼。怪對方講話不清楚就更不用說了。',
    },
    {
      question: '朋友抱怨 "My landlord still hasn’t fixed the heater. It’s been three weeks!" 哪個附和最到位？',
      options: [
        '"That is a common problem with landlords."',
        '"Ugh, that’s ridiculous. Have you threatened to call the city?"',
        '"Three weeks is 21 days."',
        '"OK, next topic."',
      ],
      answer: 1,
      explanation:
        '抱怨要用「同仇敵愾＋追問」接：先站在他那邊（That’s ridiculous），再推進話題（你有沒有要怎樣？）。冷靜分析和秒換話題都會讓對方覺得你根本不在乎。',
    },
    {
      question: '話題聊完了，出現 "So... yeah." 的沉默。你想到可以聊最近的演唱會。怎麼轉最順？',
      options: [
        '"New topic: concerts."',
        '"Speaking of music, I finally saw my favorite band live last week."',
        '就讓沉默持續，看誰先受不了',
        '拿出手機開始滑',
      ],
      answer: 1,
      explanation:
        '"Speaking of ___" 是從舊話題搭橋到新話題的標準轉場。宣布「新話題」太機器人；放置沉默或滑手機等於宣告對話死亡。真的找不到橋，就用 "Random question, but..." 硬轉也行。',
    },
    {
      question: '對方說了三次 "It’s giving..."，你完全不懂這個用法。你該？',
      options: [
        '每次都笑，笑聲蓋過困惑',
        '回家查字典，現場先假裝懂',
        '直接問 "Wait, what does ‘it’s giving’ mean? I keep hearing that."',
        '要求對方不要用俚語跟你說話',
      ],
      answer: 2,
      explanation:
        '現場問是最優解：對方樂意教、你當場學會、對話還多了一個話題。假笑混過去，下次它還是會出現；而且母語者其實很容易看穿「禮貌假笑」。',
    },
    {
      question: '你問朋友週末過得如何，他回 "Good." 然後沉默。你想繼續聊，下一步最好是？',
      options: [
        '也回 "Good."，結束這回合',
        '問開放式問題："Nice — did you end up going to that game you mentioned?"',
        '批評他："You are bad at conversation."',
        '重複問一次 "How was your weekend?"',
      ],
      answer: 1,
      explanation:
        '遇到句點王，解法是丟「開放式＋具體」的問題，最好連結他之前提過的事（表示你有記得）。Yes/No 問題會再收到一個字的回答，重複同一題只會收到同一個 "Good."。',
    },
    {
      question: '對方分享他馬拉松跑完的成績，很興奮。你完全不懂跑步。哪個回應最好？',
      options: [
        '"I don’t run, so I wouldn’t know."',
        '"That’s awesome! I could never — what keeps you going for four hours?"',
        '"Running is bad for your knees."',
        '換話題聊你熟的電玩',
      ],
      answer: 1,
      explanation:
        '不懂的領域反而好聊：稱讚＋自嘲＋好奇追問。你不需要懂跑步，只需要對「人」好奇。潑冷水（傷膝蓋）和立刻把話題搶回自己熟的領域，都是聊天黑名單行為。',
    },
    {
      question: '你恍神了三秒，對方剛講完一段話正看著你。誠實又不失禮的救場是？',
      options: [
        '"Sorry, I zoned out for a sec — what was the last part?"',
        '"Yes, I agree."（賭一把）',
        '"You talk too much, I stopped listening."',
        '假裝接電話離開現場',
      ],
      answer: 0,
      explanation:
        '承認恍神＋請對方重講最後一段，是母語者的標準自救，大家都懂偶爾放空。亂賭 "I agree" 若遇到對方剛問「你要選哪個？」就當場穿幫了。',
    },
  ],
  culture: [
    {
      title: '沉默是警報：美國聊天的「三秒規則」',
      body:
        '台灣人聊天可以舒服地一起安靜，美國的社交場合不行——沉默超過三秒，大家就開始渾身不對勁。所以美國人有一套「填充機制」：附和聲（uh-huh、right、totally）要一直出、話題乾了馬上轉場（speaking of...）、真的沒梗就自首（Random question, but...）。對你的實際意義：第一，別安靜地「認真聽」，要出聲附和，否則對方以為你無聊或沒聽懂；第二，話題死掉不是誰的錯，先開新話題的人是英雄不是話癆。',
    },
    {
      title: '接話的本質是「丟掛鉤」，不是「答對題目」',
      body:
        '很多台灣學習者把聊天當考試：對方問什麼，我正確作答，完畢。但美式閒聊是拋接球——每次回話都該附一個「掛鉤」讓對方接：一段相關經驗、一個追問、一個回問。比較看看：對方問你住哪，你答 "Near the station."（句點）versus "Near the station — honestly I picked it just for the food around there. Where are you?"（三個掛鉤）。內容不用厲害，掛鉤有掛就行。記住口訣：永遠不要讓你的回合以句號結束，要以問號或誘餌結束。',
    },
    {
      title: '聽不懂就問，裝懂才丟臉',
      body:
        '很多人怕「一直問」顯得英文差，於是微笑點頭裝懂——這其實是最危險的策略：美國人看得出禮貌假笑，而且如果對方剛剛問的是問題，你的點頭已經回答了它。實際上，美國是移民國家，大家對「請再說一次」的容忍度極高，母語者彼此之間也整天 "Wait, what?"、"Sorry, come again?"。真正會被記住的糗，是裝懂之後答非所問。放心大膽地用 "Sorry, I didn’t catch that" 和 "What does ___ mean?"——後者甚至常常變成新話題，因為每個人都愛解釋俚語給外國朋友聽。',
    },
  ],
  videos: [],
};

export default unit;
