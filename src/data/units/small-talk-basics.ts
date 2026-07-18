import type { Unit } from '../types';

const unit: Unit = {
  id: 'small-talk-basics',
  emoji: '💬',
  title: 'Small Talk 101',
  titleZh: 'Small Talk 入門',
  tagline: '聽懂 "How are you?" 的真實含義，跟鄰居、店員、同學都能自然寒暄，不再句點別人',
  category: '社交',
  dialogues: [
    {
      title: 'Morning Small Talk in the Elevator',
      titleZh: '電梯裡的早晨寒暄',
      scene: '早上出門，你在公寓電梯遇到住同層的鄰居。這種場合不寒暄反而尷尬，但也不用聊深，目標是輕鬆帶過這三十秒。',
      lines: [
        {
          speaker: 'Neighbor',
          en: "Hey! How's it going?",
          zh: '嘿！最近怎樣？',
          note: '這不是真的在問你過得好不好，就是「嗨」的意思。千萬別開始認真報告你的近況——對方只是打招呼，標準回法是一句正面的話加回問。',
        },
        {
          speaker: 'You',
          en: 'Hey! Pretty good, thanks. How about you?',
          zh: '嘿！蠻好的，謝啦。你呢？',
          note: '公式：正面簡答（Pretty good / Not bad / Good）＋ 回問（How about you? / You?）。回問是禮貌的一半，只答不問會顯得句點對方。',
        },
        {
          speaker: 'Neighbor',
          en: "Not bad, not bad. Can't complain.",
          zh: '還行還行，沒什麼好抱怨的。',
          note: '"Can’t complain" 是超常見的回法，意思是「日子過得去」。就算他昨天過超慘，寒暄時也會這樣講——這是社交潤滑，不是測謊。',
        },
        {
          speaker: 'You',
          en: "Man, it's freezing out there today.",
          zh: '天啊，今天外面有夠冷。',
          note: '天氣是全世界最安全的話題。開頭的 "Man" 是感嘆詞（哇塞、天啊），跟性別無關，對女生講也完全沒問題。',
        },
        {
          speaker: 'Neighbor',
          en: 'Right? I heard it might snow this weekend.',
          zh: '對吧？聽說這週末可能會下雪。',
          note: '"Right?" 尾音上揚，意思是「就是說啊！」，是美國人附和的萬用詞，比 "Yes" 自然一百倍。',
        },
        {
          speaker: 'You',
          en: "No way. I'm so not ready for that.",
          zh: '不會吧。我完全還沒準備好面對下雪。',
          note: '"No way" 在這裡是「真假？／不會吧」的驚訝，不是拒絕。"I’m so not ready" 的 so 放在 not 前面是口語強調，教科書不會教但大家天天講。',
        },
        {
          speaker: 'Neighbor',
          en: 'Ha, you and me both. Any plans for the weekend?',
          zh: '哈，我也一樣。週末有什麼計畫嗎？',
          note: '"You and me both" ＝「我跟你一樣／彼此彼此」。週末計畫是天氣之外第二安全的話題，週四週五問週末、週一二問「週末過得如何」，是美國寒暄的固定節奏。',
        },
        {
          speaker: 'You',
          en: 'Not much, just gonna take it easy. Maybe catch a movie. You?',
          zh: '沒什麼特別的，就打算放鬆一下。可能去看場電影。你呢？',
          note: '"Not much, just gonna ___" 是被問計畫時的萬用句型，沒計畫也不會尷尬。"Take it easy" ＝ 耍廢放鬆，"catch a movie" 比 "watch a movie" 更口語。最後別忘了 "You?" 把球丟回去。',
        },
        {
          speaker: 'Neighbor',
          en: "We're driving up to my in-laws'. Should be... interesting.",
          zh: '我們要開車去我岳父母家。應該會很……有趣。',
          note: '那個停頓加 "interesting" 是美式反話幽默，意思是「大概會很折磨」。聽到這種語氣笑一下就對了，表示你聽懂弦外之音。',
        },
        {
          speaker: 'You',
          en: 'Ha, good luck with that!',
          zh: '哈，那祝你好運囉！',
          note: '"Good luck with that" 用來回應對方要去做麻煩事，帶點幽默的同情，是接反話的標準答案。',
        },
        {
          speaker: 'Neighbor',
          en: "Thanks, I'll need it. Well, this is me. Have a good one!",
          zh: '謝了，我會需要的。啊，我到了。祝你今天愉快！',
          note: '電梯到樓層時說 "This is me" ＝「我到了」，超地道，直翻「這是我」會覺得莫名其妙。"Have a good one" ＝ Have a good day 的萬用版，早晚都能用。',
        },
        {
          speaker: 'You',
          en: 'See you around!',
          zh: '回頭見！',
          note: '"See you around" 用在不確定下次何時見面的對象（鄰居、店員），比 "Goodbye" 自然。跟熟人約好見面才用 "See you Saturday" 這種。',
        },
      ],
    },
    {
      title: 'Coffee Shop Chit-Chat — When You Get Caught Off Guard',
      titleZh: '咖啡店寒暄——被問到腦袋一片空白時',
      scene: '你在咖啡店排隊買咖啡。排隊的陌生人跟你搭話，店員做飲料時也跟你閒聊，還問了你沒料到的問題。重點：被問倒時怎麼自然接住。',
      lines: [
        {
          speaker: 'Stranger in line',
          en: 'This line is crazy today, huh?',
          zh: '今天這隊排得也太誇張了吧？',
          note: '句尾的 "huh?" 是拉你附和的鉤子，等於「對吧？」。排隊時陌生人搭話是常態，抱怨排隊、天氣都是安全的搭話素材，回一句就好，不用發展成深談。',
        },
        {
          speaker: 'You',
          en: 'Seriously. Must be the cold — everyone wants coffee.',
          zh: '真的。一定是天氣太冷，大家都想喝咖啡。',
          note: '"Seriously" 單獨用＝「真的」「就是說啊」，是最省力的附和詞。後面隨口補一句猜測，對話就活了。只回 "Yes" 會瞬間冷場。',
        },
        {
          speaker: 'Stranger in line',
          en: 'Ha, no kidding. Worth the wait though, their lattes are amazing.',
          zh: '哈，可不是嘛。不過等這一下值得，他們的拿鐵超好喝。',
          note: '"No kidding" ＝「可不是嘛」。陌生人主動推薦是好事，順著接就好。',
        },
        {
          speaker: 'You',
          en: "Oh good to know, I was gonna get one anyway.",
          zh: '喔那太好了，我本來就打算點一杯。',
          note: '"Good to know" 是收下情報的萬用回應，禮貌又不用給承諾。',
        },
        {
          speaker: 'Barista',
          en: "Hey, welcome in! How's your day going so far?",
          zh: '嗨，歡迎光臨！今天到目前為止過得如何？',
          note: '美國店員真的會這樣跟你閒聊，這是服務文化的一部分，不是搭訕也不是推銷。回答一樣是「正面簡答＋可回問」。',
        },
        {
          speaker: 'You',
          en: "Pretty good! Still waking up, honestly. Can I get a medium latte, please?",
          zh: '蠻好的！老實說還在醒腦中。可以給我一杯中杯拿鐵嗎？',
          note: '"Still waking up" 是早上的萬用自嘲，店員一定懂。閒聊完直接接點餐很正常，不用刻意切換。',
        },
        {
          speaker: 'Barista',
          en: 'For sure. For here or to go?',
          zh: '沒問題。內用還是外帶？',
          note: '"For here or to go?" 是點餐必考題。內用答 "For here"，外帶答 "To go, please"。',
        },
        {
          speaker: 'You',
          en: 'To go, please.',
          zh: '外帶，謝謝。',
        },
        {
          speaker: 'Barista',
          en: 'You got it. So, any fun plans for tonight?',
          zh: '好的。那～今晚有什麼好玩的計畫嗎？',
          note: '重點來了：店員邊做飲料邊拋閒聊題是常態。你腦袋空白也沒關係，下一句教你萬用逃生口。',
        },
        {
          speaker: 'You',
          en: "Uh... not much, honestly. Probably just gonna order takeout and watch something. How about you?",
          zh: '呃……老實說沒什麼耶。大概就叫個外送配個劇吧。你呢？',
          note: '救命句型："Not much, probably just gonna ___."。耍廢的回答完全可以，美國人自己最愛這樣答。愣住時先說 "Uh... honestly..." 爭取思考時間，比沉默自然多了。',
        },
        {
          speaker: 'Barista',
          en: "Working, unfortunately. But hey, somebody's gotta make the coffee, right?",
          zh: '要上班，可惜啊。不過嘛，總得有人來做咖啡，對吧？',
          note: '對方自嘲時，笑著接一句就是最好的回應。不用安慰他，這只是閒聊。',
        },
        {
          speaker: 'You',
          en: 'Ha, true! We appreciate your service.',
          zh: '哈，也是！感謝你的貢獻。',
          note: '用誇張一點的玩笑回敬自嘲（假裝致敬），是美式閒聊的標準互動。臉皮薄的話回 "Ha, fair enough!" 也行。',
        },
        {
          speaker: 'Barista',
          en: 'Ha! Alright, medium latte for you. Have a good one!',
          zh: '哈！好啦，你的中杯拿鐵。祝你今天愉快！',
        },
        {
          speaker: 'You',
          en: 'Thanks so much. You too!',
          zh: '非常謝謝。你也是！',
          note: '對方說 "Have a good one" 回 "You too" 就好。小心經典出糗：店員說 "Enjoy your coffee" 你回 "You too" 就尷尬了——先聽清楚對方說什麼。',
        },
      ],
    },
    {
      title: 'Dodging the Awkward Question',
      titleZh: '閃過尷尬問題——被問薪水怎麼辦',
      scene: '下課後，同堂課的同學主動跟你聊天。聊得正順，對方突然問了敏感問題（薪水），你要委婉帶過、不破壞氣氛，最後自然結束對話。',
      lines: [
        {
          speaker: 'Maya',
          en: "Hey, you're in my stats class, right? I'm Maya.",
          zh: '嘿，你也修統計那堂課對吧？我是 Maya。',
          note: '"You’re in my ___ class, right?" 是同學間破冰的標準開場。有人這樣搭話，代表對方想認識你，接住就對了。',
        },
        {
          speaker: 'You',
          en: "Oh yeah! I'm Wei. Nice to actually meet you.",
          zh: '喔對！我是 Wei。終於正式認識你了。',
          note: '"Nice to actually meet you" 的 actually 很妙——意思是「常看到你但現在才真的認識」，比乾巴巴的 "Nice to meet you" 多了一點溫度。',
        },
        {
          speaker: 'Maya',
          en: 'How are you liking the class so far?',
          zh: '你覺得這門課目前上得怎麼樣？',
          note: '"How are you liking ___?" 是問感想的口語句型，比 "Do you like it?" 更常見，因為開放式問題比較好接。',
        },
        {
          speaker: 'You',
          en: "It's not bad, but the homework is kinda brutal.",
          zh: '還可以啦，不過作業有點硬。',
          note: '"Brutal" 形容課業、工作很折磨人，是學生天天用的字。一點小抱怨反而拉近距離——完美答案「很好啊沒問題」反而讓對話沒地方去。',
        },
        {
          speaker: 'Maya',
          en: 'Ugh, tell me about it. I was up till two last night finishing it.',
          zh: '唉，可不是嘛。我昨晚熬到兩點才寫完。',
          note: '"Tell me about it" 不是「跟我說說」！意思是「你還用說嗎，我超有感」。第一次聽到很容易誤會然後真的開始講，那畫面很尷尬。',
        },
        {
          speaker: 'You',
          en: 'Oof, that hurts. So do you work, or are you a full-time student?',
          zh: '嗚，好慘。話說你有在工作嗎，還是全職學生？',
          note: '"Oof" 是聽到慘事的同情聲。問「有沒有在工作」OK，但注意：可以問做什麼，不能問賺多少。',
        },
        {
          speaker: 'Maya',
          en: 'Full-time student, but I tutor on the side. What about you?',
          zh: '全職學生，不過有兼家教。你呢？',
          note: '"On the side" ＝ 兼職、副業。',
        },
        {
          speaker: 'You',
          en: 'I work part-time at a bubble tea place downtown.',
          zh: '我在市區一間手搖飲店打工。',
        },
        {
          speaker: 'Maya',
          en: 'Oh nice! Wait, how much do they pay you? Tutoring pays terribly, I need options.',
          zh: '喔不錯欸！等等，他們付你多少？家教薪水有夠爛，我需要別的選擇。',
          note: '來了——薪水在美國是大忌話題，連朋友間都很少直接問。Maya 這樣問其實有點越線（她給了理由所以稍微情有可原），但你完全有權不正面回答。',
        },
        {
          speaker: 'You',
          en: "Ha, not enough, that's for sure! But honestly the tips help. I can send you the application link if you want.",
          zh: '哈，反正就是不夠多啦！不過說真的小費蠻補的。你想要的話我可以把應徵連結傳給你。',
          note: '教科書級閃避：用玩笑帶過（"Not enough!"）＋給一個有用的替代（傳連結）。既不說數字、又不讓對方難堪。直接說 "I don’t want to tell you" 會瞬間凍住全場。',
        },
        {
          speaker: 'Maya',
          en: "Ha, fair enough. Yeah, that'd be awesome!",
          zh: '哈，好吧有道理。好啊那太棒了！',
          note: '"Fair enough" ＝「好吧，有道理」，對方接受你的閃避，話題安全落地。',
        },
        {
          speaker: 'You',
          en: 'Cool. Anyway, I gotta run to my next class — but it was great talking to you!',
          zh: '好。對了我得趕去下一堂課了——不過跟你聊天很開心！',
          note: '結束對話三步驟："Anyway"（轉場信號）＋ 理由（I gotta run / I should get going）＋ 好話（It was great talking to you）。少了最後那句好話會顯得你在逃跑。',
        },
        {
          speaker: 'Maya',
          en: 'Same! See you Thursday!',
          zh: '我也是！週四見！',
          note: '"Same!" ＝「我也是」，比 "Me too" 更年輕口語。',
        },
      ],
    },
  ],
  vocab: [
    {
      word: 'small talk',
      ipa: '/ˈsmɔl ˌtɔk/',
      zh: '寒暄、閒聊（跟不熟的人聊天氣、週末這類輕鬆話題）',
      example: "I'm terrible at small talk with strangers.",
      exampleZh: '我超不會跟陌生人寒暄。',
    },
    {
      word: 'chit-chat',
      ipa: '/ˈtʃɪt ˌtʃæt/',
      zh: '閒聊（比 small talk 更隨性的講法）',
      example: 'We made some chit-chat while waiting for the bus.',
      exampleZh: '我們等公車時隨便聊了幾句。',
    },
    {
      word: 'break the ice',
      zh: '破冰、打開話匣子',
      example: 'He told a joke to break the ice at the party.',
      exampleZh: '他在派對上講了個笑話破冰。',
    },
    {
      word: 'run into (someone)',
      zh: '偶遇、巧遇某人',
      example: 'I ran into my old roommate at the grocery store.',
      exampleZh: '我在超市巧遇以前的室友。',
    },
    {
      word: 'catch up',
      zh: '（跟久沒見的人）敘舊、聊近況',
      example: "We should grab coffee sometime and catch up.",
      exampleZh: '我們哪天該喝杯咖啡敘敘舊。',
    },
    {
      word: "can't complain",
      zh: '（被問近況時）還不錯、沒什麼好抱怨的',
      example: "How's work? — Can't complain, honestly.",
      exampleZh: '工作怎樣？——老實說還行，沒什麼好抱怨的。',
    },
    {
      word: 'take it easy',
      zh: '放輕鬆、耍廢；道別時也可當「保重」用',
      example: "I'm just gonna take it easy this weekend.",
      exampleZh: '我這週末就打算耍廢放鬆。',
    },
    {
      word: 'errands',
      ipa: '/ˈɛrəndz/',
      zh: '雜事、跑腿（買菜、領包裹、繳費這類），常講 run errands',
      example: 'I spent all Saturday running errands.',
      exampleZh: '我整個週六都在處理雜事。',
    },
    {
      word: 'freezing',
      ipa: '/ˈfrizɪŋ/',
      zh: '冷死了（口語誇飾，不是真的結冰）',
      example: "It's freezing out there, grab a jacket.",
      exampleZh: '外面冷死了，帶件外套吧。',
    },
    {
      word: 'chilly',
      ipa: '/ˈtʃɪli/',
      zh: '有點涼、微冷（比 cold 輕）',
      example: "It's a bit chilly this morning, huh?",
      exampleZh: '今天早上有點涼，對吧？',
    },
    {
      word: 'muggy',
      ipa: '/ˈmʌɡi/',
      zh: '又悶又濕（台灣夏天那種天氣，抱怨天氣必備字）',
      example: "It's so muggy today, I'm sweating just standing here.",
      exampleZh: '今天有夠悶熱，我站著不動都在流汗。',
    },
    {
      word: 'drizzling',
      ipa: '/ˈdrɪzlɪŋ/',
      zh: '下毛毛雨',
      example: "It's just drizzling, we don't need an umbrella.",
      exampleZh: '只是毛毛雨而已，不用撐傘。',
    },
    {
      word: 'heat wave',
      zh: '熱浪（夏天寒暄高頻詞）',
      example: 'This heat wave is supposed to last all week.',
      exampleZh: '聽說這波熱浪會持續一整週。',
    },
    {
      word: 'in-laws',
      ipa: '/ˈɪn ˌlɔz/',
      zh: '姻親（岳父母或公婆），美國人閒聊常拿來自嘲',
      example: "We're visiting my in-laws for Thanksgiving.",
      exampleZh: '感恩節我們要去我岳父母（公婆）家。',
    },
    {
      word: 'catch a movie',
      zh: '看場電影（比 watch a movie 口語，通常指去電影院）',
      example: 'Wanna catch a movie Friday night?',
      exampleZh: '週五晚上要不要去看場電影？',
    },
    {
      word: 'have a good one',
      zh: '祝你愉快（萬用道別，一天中任何時段都能用）',
      example: 'Thanks for coming in — have a good one!',
      exampleZh: '謝謝光臨——祝你愉快！',
    },
    {
      word: 'see you around',
      zh: '回頭見（用於不確定下次何時見的對象）',
      example: 'I gotta head out. See you around!',
      exampleZh: '我得走了。回頭見！',
    },
    {
      word: 'gotta run',
      zh: '得走了、得趕快閃了（結束對話的口語講法）',
      example: 'Sorry, I gotta run — my bus is coming.',
      exampleZh: '抱歉我得走了——我的公車來了。',
    },
    {
      word: 'nosy',
      ipa: '/ˈnozi/',
      zh: '愛打聽、多管閒事的',
      example: "Don't ask her age — you'll come off as nosy.",
      exampleZh: '別問她年紀——會顯得你很愛打聽。',
    },
    {
      word: 'awkward',
      ipa: '/ˈɔkwɚd/',
      zh: '尷尬的（美國年輕人超高頻字）',
      example: 'There was this super awkward silence after he asked.',
      exampleZh: '他問完之後出現了超尷尬的沉默。',
    },
    {
      word: 'brutal',
      ipa: '/ˈbrutl̩/',
      zh: '（課業、天氣、通勤）很硬、很折磨人',
      example: 'The midterm was brutal.',
      exampleZh: '期中考超硬。',
    },
    {
      word: 'on the side',
      zh: '兼職地、當副業',
      example: 'She drives Uber on the side.',
      exampleZh: '她兼職開 Uber。',
    },
    {
      word: 'tell me about it',
      zh: '「你還用說嗎、我超有感」（不是真的要你講！）',
      example: 'The rent here is insane. — Tell me about it.',
      exampleZh: '這裡房租誇張到爆。——就是說啊，我超有感。',
    },
    {
      word: 'no kidding',
      zh: '可不是嘛、真的假的（附和或輕微驚訝）',
      example: "It's already December. — No kidding, this year flew by.",
      exampleZh: '已經十二月了欸。——可不是嘛，今年過超快。',
    },
    {
      word: 'good to know',
      zh: '（收到情報時）喔～了解、學到了',
      example: 'The bakery closes at two. — Oh, good to know.',
      exampleZh: '那間麵包店兩點就關了。——喔，先知道真好。',
    },
    {
      word: 'long time no see',
      zh: '好久不見（沒錯，這句就是從中文來的，美國人天天用）',
      example: 'Hey, long time no see! How have you been?',
      exampleZh: '嘿，好久不見！你最近好嗎？',
    },
    {
      word: 'How have you been?',
      zh: '（對久沒見的人）你最近過得怎樣？',
      example: "Long time no see! How have you been? — Busy, but good!",
      exampleZh: '好久不見！最近過得怎樣？——很忙，但都好！',
    },
    {
      word: 'caught off guard',
      zh: '被問倒、措手不及',
      example: 'Her question caught me off guard for a second.',
      exampleZh: '她的問題讓我愣了一下。',
    },
  ],
  phrases: [
    {
      en: "How's it going?",
      zh: '最近怎樣？（＝嗨）',
      usage: '萬用打招呼，不是真的問近況。回答公式：正面簡答＋回問，例如 "Pretty good! How about you?"。認真回答自己的煩惱會嚇到對方。',
    },
    {
      en: 'Pretty good! How about you?',
      zh: '蠻好的！你呢？',
      usage: '被打招呼的標準回法。重點在後半句回問——只答不問等於句點對方。懶得講長也可以只說 "Good, you?"。',
    },
    {
      en: '___ weather we’re having, huh?',
      zh: '這天氣真是___，對吧？',
      usage: '天氣開場萬用模板：Crazy weather we’re having, huh? / Beautiful day, huh? 句尾 huh 拉對方附和。電梯、排隊、等車時最好用。',
    },
    {
      en: 'Any plans for the weekend?',
      zh: '週末有什麼計畫嗎？',
      usage: '週四、週五的安全話題。週一改問 "How was your weekend?"。對方沒計畫也不尷尬，因為 "Not much" 是完全合格的答案。',
    },
    {
      en: 'Not much, just gonna ___. You?',
      zh: '沒什麼特別的，就打算___。你呢？',
      usage: '被問計畫時的萬用救命句。空格填最普通的事就好：take it easy / run some errands / catch up on sleep。耍廢是完全可以承認的。',
    },
    {
      en: 'Did you catch the game last night?',
      zh: '你有看昨晚的比賽嗎？',
      usage: '運動是美國男女通用的安全話題（NFL、NBA 尤其）。沒看也能接："No, I missed it — how’d it go?" 讓對方講就好。',
    },
    {
      en: 'How are you liking ___ so far?',
      zh: '你目前覺得___怎麼樣？',
      usage: '問感想的開放式句型，比 "Do you like it?" 好接話。適合問新課、新工作、新城市：How are you liking Seattle so far?',
    },
    {
      en: 'This ___ is crazy, huh?',
      zh: '這___也太誇張了吧？',
      usage: '排隊、塞車、人潮時跟旁邊的人搭話用：This line is crazy, huh? 輕微抱怨共同處境是陌生人破冰的安全牌。',
    },
    {
      en: "Ha, not enough, that's for sure!",
      zh: '哈，反正就是不夠多啦！',
      usage: '被問薪水的黃金閃避句。用自嘲玩笑帶過，不給數字也不讓場面僵掉。同類話題（年齡、感情）都能套：被問年紀可回 "Old enough to remember dial-up!"。',
    },
    {
      en: "I'd rather not get into it, if that's OK.",
      zh: '這件事我先不多說，可以嗎？',
      usage: '玩笑閃不掉、對方追問敏感話題時的正式擋箭牌。語氣平和，說完馬上換話題："Anyway, how’s your project going?"。',
    },
    {
      en: 'Anyway, I should get going.',
      zh: '好啦，我差不多該走了。',
      usage: '結束對話的轉場信號。"Anyway" 一出口對方就知道要收尾了。後面接理由（I gotta run / I’m meeting someone）更自然。',
    },
    {
      en: 'It was great talking to you!',
      zh: '跟你聊天很開心！',
      usage: '離開前的必備好話，讓結束不像逃跑。對第一次認識的人可說 "It was really nice meeting you!"。對方通常回 "You too!" 或 "Same!"。',
    },
    {
      en: 'Well, this is me.',
      zh: '啊，我到了。',
      usage: '電梯到你的樓層、公車到你的站、走到你家門口時用。直翻「這是我」很怪，但這就是「我到了、先走囉」的地道講法。',
    },
  ],
  quiz: [
    {
      question: '你在走廊遇到美國同事，他邊走邊說 "Hey, how are you?" 沒有停下腳步。你該怎麼回？',
      options: [
        '停下來認真說明你這週睡不好、工作壓力大',
        '邊走邊回 "Good, how are you?" 然後繼續各走各的',
        '沉默點頭就好，因為他沒有停下來',
        '回 "Why do you ask?"',
      ],
      answer: 1,
      explanation:
        '邊走邊說的 "How are you?" 就是「嗨」，標準回應是 "Good, how are you?" 或 "Hey, what’s up?"，雙方都不用停。認真回答會讓對方措手不及，沉默不回反而失禮。',
    },
    {
      question: '咖啡店店員做飲料時問你 "Any fun plans for tonight?" 你今晚只打算躺著滑手機。最自然的回答是？',
      options: [
        '"I cannot tell you, it is private."',
        '"Not much, just gonna relax at home. How about you?"',
        '假裝沒聽到，看手機',
        '"Yes." 然後沉默',
      ],
      answer: 1,
      explanation:
        '耍廢是完全合格的答案，"Not much, just gonna ___" 加上回問就是滿分回應。店員閒聊是服務文化，已讀不回或只回 "Yes" 都會讓氣氛僵掉；說隱私不能講則太嚴重了。',
    },
    {
      question: '鄰居說 "Ugh, this rain is never gonna stop, huh?" 哪個回應最自然？',
      options: [
        '"The weather forecast says it will stop at 4 p.m. tomorrow."',
        '"I know, right? I’m so over it."',
        '"Rain is good for the plants, you should not complain."',
        '"OK."',
      ],
      answer: 1,
      explanation:
        '對方要的是附和，不是氣象報告。"I know, right?" 加一句 "I’m so over it"（我受夠了）是完美的寒暄接法。糾正對方「不該抱怨」在寒暄裡是大忌，"OK" 則直接句點。',
    },
    {
      question: '你想結束跟同學的閒聊去趕課。哪個收尾最得體？',
      options: [
        '"Stop. I must go."',
        '轉身就走，不說話',
        '"Anyway, I gotta run to class — great talking to you!"',
        '"This conversation is finished."',
      ],
      answer: 2,
      explanation:
        '收尾三件套：轉場詞（Anyway）＋理由（gotta run to class）＋好話（great talking to you）。缺了好話會像在逃離對方；直接走人或宣布「對話結束」都非常失禮。',
    },
    {
      question: '新認識的朋友聊到工作，你很好奇他的薪水。在美國你應該？',
      options: [
        '直接問 "How much do you make?"，反正是朋友',
        '問 "What do you do?" 聊工作內容就好，薪水不問',
        '先問他年紀，再問薪水，circling in 比較禮貌',
        '問他老婆賺多少，比較不直接',
      ],
      answer: 1,
      explanation:
        '薪水在美國是高度隱私，連家人間都常不談。聊工作用 "What do you do?"（你做哪行？）完全安全。年齡（尤其對成年人）、體重、感情狀態、政治、宗教也都在禁忌區。',
    },
    {
      question: '店員把咖啡遞給你說 "Enjoy your coffee!" 你脫口而出 "You too!"——發生什麼事了？',
      options: [
        '完全正確，這是標準回應',
        '你剛叫店員也去享用你的咖啡，小小出糗了，笑一下說 "Ha, I mean — thanks!" 就好',
        '這是嚴重失禮，需要正式道歉',
        '店員會以為你要請他喝咖啡',
      ],
      answer: 1,
      explanation:
        '"You too" 只適合回 "Have a good one!" 這類雙向祝福。回錯是連母語者都常犯的經典小出糗，笑著補一句 "I mean — thanks!" 就化解了，不用道歉道到天荒地老。',
    },
    {
      question: '對方抱怨房租貴，你也超有感。哪個回應「不」自然？',
      options: [
        '"Tell me about it."',
        '"Seriously."',
        '"I know, right?"',
        '"Please tell me more about your rent."',
      ],
      answer: 3,
      explanation:
        '前三個都是「就是說啊、我超有感」的地道附和。第四個是把 "Tell me about it" 按字面直翻的錯誤理解——那句慣用語是表達共鳴，不是真的請對方詳述房租。',
    },
    {
      question: '電梯裡陌生人對你微笑點頭。美國的社交慣例是？',
      options: [
        '立刻移開視線，假裝沒看到',
        '回以微笑點頭，可加一句 "How’s it going?"，不用發展成聊天',
        '自我介紹並詢問對方姓名、職業',
        '報警',
      ],
      answer: 1,
      explanation:
        '美國（尤其小城市與郊區）陌生人眼神接觸時微笑點頭是基本禮貌，回應就好，不代表要深聊。撇頭裝死在台灣正常，在美國會顯得冷淡；反過來直接查戶口又太超過了。',
    },
  ],
  culture: [
    {
      title: '"How are you?" 是打招呼，不是問句',
      body:
        '美國人說 "How are you?"、"How’s it going?"、"What’s up?" 的時候，九成九只是在說「嗨」。標準應對是三秒內給正面簡答（Good / Pretty good / Not bad）＋回問（How about you?），然後該幹嘛幹嘛。真的想跟你聊近況的人會停下腳步、看著你再問一次 "So how are you really doing?"——那時候才需要認真回答。反過來說，你被問時回 "Not so good..." 然後開始倒苦水，對方會非常錯愕，因為這等於把打招呼當成了心理諮商的開場。',
    },
    {
      title: '禁忌話題紅綠燈：薪水、年齡、政治不要碰',
      body:
        '安全區（綠燈）：天氣、週末計畫、運動賽事、美食、寵物、影集、旅行。看交情（黃燈）：工作內容、家庭、健康。禁區（紅燈）：薪水（How much do you make? 是大忌）、成年人的年齡與體重、政治立場、宗教信仰、感情細節（為什麼還單身？什麼時候生小孩？）。台灣長輩式關心「你一個月賺多少？」「怎麼還不結婚？」在美國會被當成嚴重冒犯。被別人踩線時不用生氣，用玩笑帶過（"Ha, not enough!"）或說 "I’d rather not get into it" 再換話題即可。',
    },
    {
      title: '跟店員、鄰居寒暄是「基本配備」，不是自來熟',
      body:
        '在美國，收銀員問你 "Did you find everything OK?"、酒保問你 "How’s your day going?"、鄰居在信箱前跟你聊兩句，都是日常標配。這些互動的預期長度是十五秒到一分鐘，輕鬆回一兩句就達標，不回反而失禮（會被當成心情很差或很傲）。另外，「結束寒暄」跟「開始寒暄」一樣重要：美國人不會突然轉身走人，一定會丟收尾信號——"Anyway..."、"Well, I should let you go"、"It was great talking to you"。聽到這些就知道對方要收了，配合說再見就好，不要繼續開新話題。',
    },
  ],
  videos: [],
};

export default unit;
