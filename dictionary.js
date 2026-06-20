/**
 * 犬種当てクイズ＆ポケット犬種図鑑
 * 【dictionary.js】
 * 
 * 概要：
 * DogAPIの犬種名（英語キー）を日本語に翻訳するための辞書データと、
 * 主要な「おなじみ犬種」の日本語豆知識（解説文）を保持するファイルです。
 */

// 主要な犬種（おなじみモードの出題対象となり、詳細な豆知識を持つ犬種）のデータ
export const POPULAR_DOGS = {
  "shiba": {
    japanese: "柴犬",
    origin: "日本",
    size: "中型犬",
    description: "日本原産の代表的な犬種です。賢くて主人にとても忠実、我慢強い性格をしています。くるんと巻いた尻尾とピンと立った耳がとても可愛らしい特徴です。"
  },
  "chihuahua": {
    japanese: "チワワ",
    origin: "メキシコ",
    size: "超小型犬",
    description: "世界で最も小さな犬種の一つです。うるうるした大きな瞳と、体が小さくても非常に勇敢で活発な性格が特徴です。甘えん坊で飼い主に深い愛情を示します。"
  },
  "poodle-toy": {
    japanese: "トイプードル",
    origin: "フランス",
    size: "小型犬",
    description: "とても頭が良く、しつけがしやすい人気の犬種です。毛が抜けにくく、様々なカットスタイルを楽しめます。社交的で他の人や犬とも仲良く遊べます。"
  },
  "retriever-golden": {
    japanese: "ゴールデンレトリバー",
    origin: "イギリス",
    size: "大型犬",
    description: "優しく温厚な性格で、知能が非常に高い大型犬です。美しい黄金色の毛並みが特徴で、人と遊ぶことや泳ぐことが大好きです。盲導犬や家庭犬として世界中で愛されています。"
  },
  "retriever-labrador": {
    japanese: "ラブラドールレトリバー",
    origin: "カナダ",
    size: "大型犬",
    description: "とても賢く穏やかで、人を助けることが得意な大型犬です。水遊びが大好きで、学習能力が非常に高いため、盲導犬や救助犬としても活躍しています。"
  },
  "dachshund": {
    japanese: "ダックスフンド",
    origin: "ドイツ",
    size: "小型犬",
    description: "胴長短足の愛嬌ある体型が特徴です。もともとはアナグマを狩る猟犬だったため、明るく好奇心旺盛で、とても元気いっぱいに走り回るのが大好きです。"
  },
  "pomeranian": {
    japanese: "ポメラニアン",
    origin: "ドイツ",
    size: "小型犬",
    description: "ふわふわとした綿あめのような毛並みが特徴の小型犬です。とても友好的で活発、好奇心が強く、くるくるとよく動く瞳で周囲を和ませてくれます。"
  },
  "maltese": {
    japanese: "マルチーズ",
    origin: "マルタ",
    size: "超小型犬",
    description: "純白の絹糸のような美しい長い被毛が特徴です。とても甘えん坊で人懐っこく、気品がありながらも元気いっぱいに遊ぶのが大好きな犬種です。"
  },
  "pug": {
    japanese: "パグ",
    origin: "中国",
    size: "小型犬",
    description: "クシャッとした愛嬌のある顔としわが特徴です。穏やかで人懐っこく、めったに怒らないため、子供のいる家庭でも飼いやすい平和主義な性格です。"
  },
  "bulldog-french": {
    japanese: "フレンチブルドッグ",
    origin: "フランス",
    size: "小型犬",
    description: "コウモリのような大きな耳（バット・イヤー）と短い鼻が特徴です。とても陽気で優しく、甘えん坊な性格をしており、ユーモラスな仕草で家族を笑顔にします。"
  },
  "beagle": {
    japanese: "ビーグル",
    origin: "イギリス",
    size: "中型犬",
    description: "垂れ耳と白・茶・黒の模様が特徴の猟犬です。とても元気で嗅覚が優れており、常に地面の匂いをかいで探索します。社交的で寂しがり屋な一面もあります。"
  },
  "corgi-cardigan": {
    japanese: "ウェルシュコーギー・カーディガン",
    origin: "イギリス",
    size: "中型犬",
    description: "胴長短足で大きな耳と長い尻尾が特徴です。牧羊犬として働いていたため、非常に賢く、活発で飼い主の指示をよく理解する頼もしい犬種です。"
  },
  "husky-siberian": {
    japanese: "シベリアンハスキー",
    origin: "ロシア（シベリア）",
    size: "大型犬",
    description: "オオカミのようなクールな外見と、美しいブルーやブラウンの瞳が特徴です。外見とは裏腹に、非常にフレンドリーで優しく、お茶目な性格をしています。"
  },
  "collie-border": {
    japanese: "ボーダーコリー",
    origin: "イギリス",
    size: "中型犬",
    description: "全犬種の中で最も知能が高いと言われる犬種です。運動能力が非常に高く、ディスクドッグ競技などでも大活躍します。仕事が大好きでアクティブです。"
  },
  "schnauzer-miniature": {
    japanese: "ミニチュアシュナウザー",
    origin: "ドイツ",
    size: "小型犬",
    description: "おじいさんのような立派なヒゲと眉毛が特徴の犬種です。賢く頑丈で、警戒心もありますが家族には非常に愛情深く接する、活発な性格です。"
  },
  "shihtzu": {
    japanese: "シーズー",
    origin: "中国",
    size: "小型犬",
    description: "「獅子犬」という意味を持つ、穏やかで人懐っこい犬種です。豊かな毛並みと丸い瞳が特徴で、無駄吠えが少なく、アパートなどでも飼いやすい優しい性格です。"
  },
  "terrier-yorkshire": {
    japanese: "ヨークシャーテリア",
    origin: "イギリス",
    size: "超小型犬",
    description: "「動く宝石」と呼ばれる美しい毛並みを持つ超小型犬です。小さいながらもテリアらしい勝気で活発な性格をしており、とても甘えん坊で賢いです。"
  },
  "papillon": {
    japanese: "パピヨン",
    origin: "フランス / ベルギー",
    size: "小型犬",
    description: "フランス語で「蝶」を意味する、美しく広がる大きな耳が特徴です。非常に賢く活発で、ドッグスポーツもこなせるほど運動神経が良いエレガントな犬種です。"
  },
  "akita": {
    japanese: "秋田犬",
    origin: "日本",
    size: "大型犬",
    description: "日本を代表する大型犬で、天然記念物にも指定されています。「忠犬ハチ公」で有名で、飼い主に対する忠誠心が非常に強く、家族を守る頼もしい存在です。"
  },
  "samoyed": {
    japanese: "サモエド",
    origin: "ロシア（シベリア）",
    size: "大型犬",
    description: "白くふわふわの長い毛と、口角が上がって微笑んでいるように見える「サモエド・スマイル」が特徴です。極めて温厚でフレンドリー、人間が大好きです。"
  },
  "doberman": {
    japanese: "ドーベルマン",
    origin: "ドイツ",
    size: "大型犬",
    description: "スマートで筋肉質な体つきが特徴の大型犬です。非常に賢く警戒心が強いため警察犬として有名ですが、本来はとても甘えん坊で家族に深い愛情を注ぎます。"
  },
  "spitz-japanese": {
    japanese: "日本スピッツ",
    origin: "日本",
    size: "小型犬",
    description: "純白のふわふわした被毛と、真っ黒な瞳が対照的な美しい犬種です。非常に明るく活発で遊び好き、家族に深い愛情を示す可愛いパートナーです。"
  },
  "dalmatian": {
    japanese: "ダルメシアン",
    origin: "クロアチア",
    size: "大型犬",
    description: "白地に黒や茶色の斑点模様が特徴で、ディズニー映画でも有名です。非常に体力が豊富で走り回るのが大好き、陽気で活発な性格をしています。"
  },
  "stbernard": {
    japanese: "セントバーナード",
    origin: "スイス",
    size: "超大型犬",
    description: "アルプスの救助犬として知られる超大型犬です。とても穏やかで辛抱強く、子供に対しても非常に優しく接するため「優しい巨人」と呼ばれています。"
  },
  "pekinese": {
    japanese: "ペキニーズ",
    origin: "中国",
    size: "小型犬",
    description: "中国の宮廷で愛玩犬として飼われていた高貴な犬種です。猫のようにマイペースで独立心が強く、頑固な一面もありますが、家族には深い愛を示します。"
  }
};

// 辞書にない犬種の英語キーを日本語（カタカナなど）に変換するための一般辞書
// DogAPIから取得できる一般的な犬種名を網羅しています。
export const ALL_DOGS_DICTIONARY = {
  // あ行
  "affenpinscher": "アーフェンピンシャー",
  "african": "アフリカカンヒューノ",
  "airedale": "エアデールテリア",
  "akita": "秋田犬",
  "appenzeller": "アッペンツェラー・キャトル・ドッグ",
  "australian-shepherd": "オーストラリアン・シェパード",
  
  // か行
  "basenji": "バセンジー",
  "basset": "バセットハウンド",
  "beagle": "ビーグル",
  "bluetick": "ブルーティック・クーンハウンド",
  "borzoi": "ボルゾイ",
  "bouvier": "ブービエ・デ・フランダース",
  "boxer": "ボクサー",
  "brabancon": "プチ・ブラバンソン",
  "briard": "ブリアール",
  "buhund-norwegian": "ノルウェー・ブーフント",
  "bulldog-boston": "ボストンテリア",
  "bulldog-english": "イングリッシュブルドッグ",
  "bulldog-french": "フレンチブルドッグ",
  "bullterrier-staffordshire": "スタッフォードシャー・ブルテリア",

  // さ行
  "cairn": "ケアーン・テリア",
  "cattledog-australian": "オーストラリアン・キャトル・ドッグ",
  "chihuahua": "チワワ",
  "chow": "チャウチャウ",
  "clumber": "クランバースパニエル",
  "cockapoo": "コッカプー",
  "collie-border": "ボーダーコリー",
  "coonhound": "クーンハウンド",
  "corgi-cardigan": "ウェルシュコーギー・カーディガン",
  "cotondetulear": "コトン・ド・テュレアール",

  // た行
  "dachshund": "ダックスフンド",
  "dalmatian": "ダルメシアン",
  "dane-great": "グレートデーン",
  "dhole": "ドール",
  "dingo": "ディンゴ",
  "doberman": "ドーベルマン",

  // は行
  "elkhound-norwegian": "ノルウェジアン・エルクハウンド",
  "entlebucher": "エントレブッハー・マウンテンドッグ",
  "eskimo": "アメリカン・エスキモー・ドッグ",
  "finnish-lapphund": "フィニッシュ・ラップハウンド",
  "germanshepherd": "ジャーマンシェパード",
  "greyhound-italian": "イタリアングレーハウンド",
  "groenendael": "ベルジアン・シェパード・ドッグ・グローネンダール",
  "havanese": "ハバニーズ",
  "husky-siberian": "シベリアンハスキー",

  // ま行・や・ら・わ
  "keeshond": "キースホンド",
  "kelpie": "オーストラリアン・ケルピー",
  "komondor": "コモンドール",
  "kuvasz": "クーバース",
  "labradoodle": "ラブラドゥードル",
  "leonberg": "レオンベルガー",
  "lhasa": "ラサアプソ",
  "malamute": "アラスカンマラミュート",
  "malinois": "ベルジアン・シェパード・ドッグ・マリノア",
  "maltese": "マルチーズ",
  "mexicanhairless": "メキシカン・ヘアレス・ドッグ",
  "mix": "ミックス",
  "mountain-bernese": "バーニーズ・マウンテン・ドッグ",
  "mountain-swiss": "グレート・スイス・マウンテン・ドッグ",
  "newfoundland": "ニューファンドランド",
  "otterhound": "オッターハウンド",
  "ovcharka-caucasian": "コーカシアン・オーブチャッカ",
  "papillon": "パピヨン",
  "pekinese": "ペキニーズ",
  "corgi-pembroke": "ウェルシュコーギー・ペンブローク",
  "corgi": "ウェルシュ・コーギー",
  "pinscher-miniature": "ミニチュアピンシャー",
  "pitbull": "ピットブル",
  "pointer-german": "ジャーマン・ポインター",
  "pointer-germanlonghair": "ジャーマン・ロングヘアード・ポインター",
  "pomeranian": "ポメラニアン",
  "poodle-medium": "ミディアムプードル",
  "poodle-miniature": "ミニチュアプードル",
  "poodle-standard": "スタンダードプードル",
  "poodle-toy": "トイプードル",
  "pug": "パグ",
  "puggle": "パグル",
  "pyrenees": "グレートピレニーズ",
  "redbone": "レッドボーン・クーンハウンド",
  "retriever-chesapeake": "チェサピーク・ベイ・レトリバー",
  "retriever-curly": "カーリーコーテッド・レトリバー",
  "retriever-flatcoated": "フラットコーテッド・レトリバー",
  "retriever-golden": "ゴールデンレトリバー",
  "retriever-labrador": "ラブラドールレトリバー",
  "ridgeback-rhodesian": "ローデシアン・リッジバック",
  "rottweiler": "ロットワイラー",
  "saluki": "サルーキ",
  "samoyed": "サモエド",
  "schipperke": "シッパーキー",
  "schnauzer-giant": "ジャイアントシュナウザー",
  "schnauzer-miniature": "ミニチュアシュナウザー",
  "segugio-italian": "セグージョ・イタリアーノ",
  "setter-english": "イングリッシュセッター",
  "setter-gordon": "ゴードンセッター",
  "setter-irish": "アイリッシュセッター",
  "sharpei": "シャーペイ",
  "shiba": "柴犬",
  "shihtzu": "シーズー",
  "spaniel-blenheim": "ブレンハイムスパニエル",
  "spaniel-brittany": "ブリタニースパニエル",
  "spaniel-cocker": "コッカースパニエル",
  "spaniel-irishwater": "アイリッシュウォータースパニエル",
  "spaniel-japanese": "日本チン",
  "spaniel-sussex": "サセックススパニエル",
  "spaniel-welsh": "ウェルシュ・スプリンガー・スパニエル",
  "spitz-japanese": "日本スピッツ",
  "springer-english": "イングリッシュ・スプリンガー・スパニエル",
  "stbernard": "セントバーナード",
  "terrier-american": "アメリカン・トイ・テリア",
  "terrier-australian": "オーストラリアン・テリア",
  "terrier-bedlington": "ベドリントン・テリア",
  "terrier-border": "ボーダー・テリア",
  "terrier-cairn": "ケアーン・テリア",
  "terrier-dandie": "ダンディ・ディンモント・テリア",
  "terrier-fox": "フォックス・テリア",
  "terrier-irish": "アイリッシュ・テリア",
  "terrier-kerryblue": "ケリー・ブルー・テリア",
  "terrier-lakeland": "レイクランド・テリア",
  "terrier-norfolk": "ノーフォーク・テリア",
  "terrier-norwich": "ノーウィッチ・テリア",
  "terrier-patterdale": "パターデール・テリア",
  "terrier-russell": "ジャック・ラッセル・テリア",
  "terrier-scottish": "スコティッシュ・テリア",
  "terrier-sealyham": "シーリハム・テリア",
  "terrier-silky": "シルキー・テリア",
  "terrier-tibetan": "チベタン・テリア",
  "terrier-toy": "トイ・マンチェスター・テリア",
  "terrier-welsh": "ウェルシュ・テリア",
  "terrier-westhighland": "ウエスト・ハイランド・ホワイト・テリア",
  "terrier-yorkshire": "ヨークシャーテリア",
  "tervuren": "ベルジアン・シェパード・ドッグ・タービュレン",
  "vizsla": "ビズラ",
  "waterdog-spanish": "スパニッシュ・ウォーター・ドッグ",
  "weimaraner": "ワイマラナー",
  "whippet": "ウィペット",
  "wolfhound-irish": "アイリッシュ・ウルフハウンド"
};

/**
 * DogAPIの犬種キー名（例: "poodle/toy" や "retriever-golden" など）から、
 * 本アプリ内で統一的に使用する翻訳キー名（例: "poodle-toy", "retriever-golden"）に変換し、
 * 日本語名と豆知識データを取得するための関数です。
 */
export function getDogData(breedKey) {
  // スラッシュをハイフンに統一（APIは "poodle/toy"、辞書は "poodle-toy" で管理するため）
  const cleanKey = breedKey.replace('/', '-').toLowerCase();

  // 1. まず主要な（おなじみ）犬種データから検索
  if (cleanKey in POPULAR_DOGS) {
    return {
      isPopular: true,
      japanese: POPULAR_DOGS[cleanKey].japanese,
      description: POPULAR_DOGS[cleanKey].description,
      origin: POPULAR_DOGS[cleanKey].origin,
      size: POPULAR_DOGS[cleanKey].size
    };
  }

  // 2. 次に一般辞書から検索
  if (cleanKey in ALL_DOGS_DICTIONARY) {
    return {
      isPopular: false,
      japanese: ALL_DOGS_DICTIONARY[cleanKey],
      description: "世界中で愛されている犬種です。元気に走り回ることや、人と触れ合うことが大好きな性格をしています。", // 汎用豆知識
      origin: "不明",
      size: "不明"
    };
  }

  // 3. どちらにも見つからない場合は、ハイフンを取り去ったキーで再検索
  const parentBreed = cleanKey.split('-')[0];
  if (parentBreed in ALL_DOGS_DICTIONARY) {
    return {
      isPopular: false,
      japanese: ALL_DOGS_DICTIONARY[parentBreed] + ` (${cleanKey.replace(parentBreed + '-', '')})`,
      description: "世界中で愛されている犬種です。元気に走り回ることや、人と触れ合うことが大好きな性格をしています。",
      origin: "不明",
      size: "不明"
    };
  }

  // 4. それでも見つからない場合の最終的な英語フォールバック
  // 頭文字を大文字にする
  const formattedName = cleanKey.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    isPopular: false,
    japanese: formattedName,
    description: "世界中で親しまれている珍しい犬種です。DogAPIに登録されている仲間の一員です。",
    origin: "不明",
    size: "不明"
  };
}

// 見た目が似ている犬種のグループリスト（難易度「むずかしい」の時、不正解の選択肢に優先して選ばれます）
export const SIMILAR_DOG_GROUPS = [
  // 日本犬・立ち耳・スピッツ系
  ["shiba", "akita", "spitz-japanese", "samoyed", "husky-siberian"],
  // レトリバー系
  ["retriever-golden", "retriever-labrador", "retriever-flatcoated", "retriever-curly", "retriever-chesapeake"],
  // 鼻ペチャ（短頭種）系
  ["pug", "bulldog-french", "bulldog-english", "bulldog-boston", "pekinese", "shihtzu"],
  // 胴長短足系
  ["dachshund", "corgi-cardigan", "corgi-pembroke", "corgi"],
  // 白・ふわふわ系小型犬
  ["pomeranian", "maltese", "spitz-japanese", "samoyed"],
  // テリア・シュナウザー（ひげ・飾り毛）系
  ["schnauzer-miniature", "schnauzer-giant", "terrier-yorkshire", "cairn", "terrier-cairn", "terrier-westhighland", "terrier-scottish", "terrier-russell"],
  // 耳が大きい・飾り毛系小型犬
  ["papillon", "chihuahua", "spaniel-japanese"],
  // コリー・シェパード牧羊犬系
  ["collie-border", "germanshepherd", "australian-shepherd"],
  // 垂れ耳中型・猟犬系
  ["beagle", "basset", "coonhound", "spaniel-cocker", "dalmatian"]
];

// DogAPIのキー名とアプリ内の日本語辞書キー名にズレがある場合のマッピング定義
// アプリ内キー: DogAPI上の実際のキー
export const DOG_API_KEY_MAP = {
  "husky-siberian": "husky"
};

// 激似対決（そっくり2択）モード用の激似ライバルペアの定義
export const SUPER_HARD_PAIRS = [
  { breedA: "shiba", breedB: "akita", title: "柴犬 vs 秋田犬" },
  { breedA: "retriever-golden", breedB: "retriever-labrador", title: "ゴールデン vs ラブラドール" },
  { breedA: "spitz-japanese", breedB: "samoyed", title: "日本スピッツ vs サモエド" },
  { breedA: "bulldog-french", breedB: "pug", title: "フレンチブルドッグ vs パグ" },
  { breedA: "corgi-cardigan", breedB: "corgi-pembroke", title: "カーディガン vs ペンブローク" }
];

/**
 * 与えられた犬種キーと見た目が似ている犬種の日本語名リストを取得します。
 * @param {string} correctKey - 対象の犬種キー
 * @returns {string[]} 似ている犬種の日本語名の配列
 */
export function getSimilarBreeds(correctKey) {
  const similarJapaneseNames = [];
  
  SIMILAR_DOG_GROUPS.forEach(group => {
    if (group.includes(correctKey)) {
      group.forEach(breed => {
        if (breed !== correctKey) {
          const dogData = getDogData(breed);
          if (dogData && dogData.japanese && !similarJapaneseNames.includes(dogData.japanese)) {
            similarJapaneseNames.push(dogData.japanese);
          }
        }
      });
    }
  });
  
  return similarJapaneseNames;
}



