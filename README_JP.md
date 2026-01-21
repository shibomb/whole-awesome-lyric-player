[English](README.md) | [日本語](README_JP.md)

# Awesome Lyric Player

美しいテキストアニメーションで音楽を可視化するリリックプレーヤーです。
このプロジェクトでは、歌詞ファイル（`.srt`）と音声ファイル（`.mp3`）を使用して、ブラウザ上で直接魅力的なアニメーション付きリリックビデオを作成できます。

[デモ](https://awesome-lyric-player.32keta.com) をご覧ください。

## 機能

- **歌詞の同期**: `.srt` ファイルを使用して、歌詞と音声を完璧に同期させます。
- **カスタマイズ可能なアニメーション**: 様々なリリックブロック（行、単語、文字）やテキストオブジェクトアニメーション（シンプル、ジッター、ランダム、バブル）から選択できます。
- **P5.js 統合**: `p5.js` をベースにしており、強力で柔軟なグラフィック表現が可能です。
- **波形表示**: `wavesurfer.js` を使用しています。
- **グリーンスクリーン対応**: 動画編集ソフトでのクロマキー合成を容易にするため、デフォルトで緑色の背景（`#00FF00`）になっています。
- **カスタムフォント**: デフォルト設定では `BIZUDPGothic-Regular.ttf` を指定していますが、このファイルはリポジトリに**含まれていません**。初回セットアップ時にダウンロードして `fonts` ディレクトリに配置してください。

## プロジェクト構成

```
whole-awesome-lyric-player/
├── data/           # 音声ファイル (.mp3) と歌詞ファイル (.srt) を配置
│   └── samples/    # サンプルアセット
├── fonts/          # フォントファイル (.ttf) を配置
├── img/            # 画像アセット (favicon, ogp) を配置
├── js/             # JavaScript ソースファイル
│   ├── lib/        # ライブラリファイル
│   ├── LyricBlockBasic.js
│   ├── LyricBlockCustomSample.js
│   └── sketch.js   # メインエントリーポイントと設定
├── scripts/        # Node.js スクリプト (update_external_links など)
└── index.html      # メイン HTML ファイル
```

## はじめに

1. **リポジトリのクローン**:
   ```bash
   git clone https://github.com/shibomb/whole-awesome-lyric-player.git
   cd whole-awesome-lyric-player
   ```

2. **アセットの準備**:
   - **フォント**: `BIZUDPGothic-Regular.ttf` をダウンロードして `fonts/` ディレクトリに配置します。
     - ダウンロードリンクは [fonts/README.md](fonts/README.md) を参照してください。
   - **音声・歌詞**: プロジェクトにはデフォルトで `data/sample_song.mp3` と `data/sample_song.srt` が設定されています。
   - 自分の楽曲を使用する場合:
     - 音声ファイルを `data/` ディレクトリに配置します。
     - 歌詞ファイルを `data/` ディレクトリに配置します。
     - `js/sketch.js` 内の `ALP_CONFIG` を更新します。

   > **Tip**: `.mp3` と歌詞テキストから `.srt` ファイルを作成するには、当社のタイムコード記録ユーティリティサービス [Awesome Timecode Recorder](https://awesome-timecode-recorder.32keta.com) が便利です。

3. **プレーヤーの実行**:
   - 最新のウェブブラウザで `index.html` を開きます。
   - **注意**: ブラウザのローカルファイルアクセスに関するCORSポリシーのため、このプロジェクトはローカルウェブサーバーを使用して実行する必要があります。
     - **VS Code**: "Live Server" 拡張機能を使用してください。
     - **Python**: ディレクトリ内で `python3 -m http.server` を実行してください。
     - **Node**: ディレクトリ内で `npx http-server` を実行してください。

## 使い方

- **S**: 再生 / 一時停止
- **R**: 再生をリセット
- **B**: 背景の透過切り替え（グリーンスクリーン用）
- **M**: ミュート切り替え


## 設定

`js/sketch.js` 内の `ALP_CONFIG` オブジェクトを編集してプレーヤーをカスタマイズできます：

```javascript
const ALP_CONFIG = {
    CANVAS: {
        WIDTH: 1920,
        HEIGHT: 1080, // クラシックHD解像度
        FIXED: true
    },
    STYLE: {
        BACKGROUND_COLOR: "#00FF00", // クロマキー用グリーン。透明にする場合は null に設定。
        TEXT_FILL_COLOR: 255,
        TEXT_STROKE_COLOR: 0,
        TEXT_STROKE_WEIGHT: 2,
        FONT_FILENAME: "fonts/BIZUDPGothic-Regular.ttf",
        // ...
    },
    SONG: {
        AUDIO_FILENAME: "data/sample_song.mp3",
        LYRIC_FILENAME: "data/sample_song.srt"
    }
};
```

## カスタマイズ

`js/sketch.js` または別のファイルで独自の `LyricBlock` や `TextObject` クラスを定義して、ユニークなアニメーション効果を作成できます。
実装の詳細については、`js/LyricBlockBasic.js`、`js/LyricBlockCustomSample.js`、`js/lib/AwesomeLyricPlayer.js`、または `js/sketch.js` 内の既存のクラスを参照してください。

カスタムクラスや `js/LyricBlockBasic.js` に含まれている組み込みクラスを使用するには、`js/sketch.js` 内の `AwesomeLyricPlayer` コンストラクタにそれらを渡す必要があります：

```javascript
// Player Instance
const player = new AwesomeLyricPlayer(ALP_CONFIG,
    LyricBlock_1Row,    // LyricBlockクラスを指定
    TextObject_Simple   // TextObjectクラスを指定
);
```

### 利用可能な組み込みクラス：
- **LyricBlock**:
    - Basic: `LyricBlock_1Row`、`LyricBlock_2Rows`、`LyricBlock_Words`、`LyricBlock_Chars`、`LyricBlock_CurrentWords`、`LyricBlock_CurrentChars`
    - Custom Sample: `LyricBlock_CurrentChars_LongLifetimeText`
- **TextObject**: 
    - Basic: `TextObject_Simple`、`TextObject_Jitter`、`TextObject_CityPopRandomColor`
    - Custom Sample: `TextObject_CityPopRandomColor_Star`

## Support Me
[☕️ Buy me a coffee](https://buymeacoffee.com/shibombw)

## License
This project is licensed under the PolyForm Noncommercial License 1.0.0.
非商用利用のみ許可されています

### Commercial Use (商用利用について)
商用利用をご希望の場合は、別途契約が必要です。以下までご連絡ください。

* Contact: contact@whole.jp

Copyright (c) 2026 WHOLE LLC.

---

# Sample Music
「はじまりサンプル」
NEW OLD CINEMA by shibomb
Copyright (c) shibomb.
