---
name: commit
description: 変更内容を Conventional Commits 形式でコミットする。diff を読んで type/scope を決め、件名と本文をドラフトし、ユーザー承認を得てから `main` に直接コミットする。「コミットして」「commit」「コミットメッセージ作って」と言われたときに使用。
---

# コミット作成ワークフロー

このプロジェクト（Astro + Vercel、`main` 直コミット運用）の変更を、Conventional Commits に則って安全にコミットする。
**必ず以下のステップを順番に実行し、各フェーズの終わりで報告して次に進むこと。**

開始時に各 Step を `TaskCreate` で登録し、`in_progress` / `completed` を都度更新すること（進捗を可視化するため）。

---

## 前提

- ブランチ運用: **`main` に直接コミット**
- 言語: **英語**（件名・本文とも）。小文字始まり・末尾ピリオドなし・件名 50 字以内目安・本文は 72 字で改行
- 末尾に `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` を付与
- push は **しない**（ユーザーが明示的に頼まない限り）

---

## Step 0: 事前チェック

```bash
git status --porcelain   # 変更があるか
git rev-parse --abbrev-ref HEAD   # main か
git diff --stat          # ざっくりした変更規模
git log -n 5 --pretty=format:'%s'   # 直近のスタイル参照
```

- 変更が無い: 「コミット対象がありません」と報告して終了
- ブランチが `main` 以外: 「現在 `<branch>` にいます。`main` に切り替えますか / このまま進めますか」と質問
- 既にステージ済みの変更がある: そのステージ内容を尊重し、未ステージとは分けて扱う

---

## Step 1: 変更分類（type/scope を決める）

`git diff` と `git diff --staged` を読み、以下の意思決定フローで type を決める。

### 1-1. 許可される type の集合

**この 9 種のみ**。それ以外は使わない。

| type       | 用途                                                  |
| ---------- | ----------------------------------------------------- |
| `feat`     | 新機能、ユーザー可視の挙動追加                        |
| `fix`      | バグ修正                                              |
| `refactor` | 挙動を変えないコード再構成                            |
| `perf`     | パフォーマンス改善                                    |
| `style`    | フォーマット・空白・セミコロン等（コード意味は不変）  |
| `test`     | テストの追加・修正                                    |
| `docs`     | ドキュメント、コメント、CLAUDE.md、README             |
| `chore`    | ビルド・設定・依存・雑務（ユーザー可視挙動に影響なし） |
| `revert`   | 既存コミットの取り消し                                |

### 1-2. 過去使われていた非標準 type の振り分け

**過去のコミットには `add:` / `update:` / `remove:` / `delete:` があるが、これらは禁止。** 必ず以下のように振り分ける:

| 過去のタイプ | 振り分け先                                                                              |
| ------------ | --------------------------------------------------------------------------------------- |
| `add:`       | 機能追加なら `feat:`、ブログ記事追加なら `chore(content):`、ドキュメントなら `docs:`    |
| `update:`    | 挙動変更なら `feat:` / `fix:`、整理なら `refactor:`、依存更新なら `chore(deps):`        |
| `remove:`    | 機能削除なら `feat!:`（破壊的）、不要コード片付けなら `chore:` か `refactor:`           |
| `delete:`    | `remove:` と同じ                                                                        |

### 1-3. scope（任意だが推奨）

`type(scope):` の形で粒度を上げる。このリポジトリで推奨する scope:

- `deps` — 依存パッケージ（`chore(deps): bump N package(s)`）
- `blog` — ブログ記事ページや一覧の機能変更
- `content` — `src/content/blog/` 配下の記事追加・修正
- `ui` — レイアウト、コンポーネント、スタイル全般
- `seo` — JSON-LD、meta、sitemap、robots、OG
- `a11y` — アクセシビリティ
- `og` — OG 画像生成
- `search` — `api/search.ts` や Vertex AI Search 関連
- `microcms` — microCMS 連携、Live Content Collections
- `config` — `astro.config.mjs`, `tsconfig.json`, lint 設定など

スコープを付けるか迷ったら付けない。**間違った scope は no scope より悪い**。

### 1-4. Breaking change

ユーザー可視の互換性を壊す変更は `feat!:` のように `!` を付けるか、本文に `BREAKING CHANGE:` を書く。

---

## Step 2: 件名と本文のドラフト

### 2-1. 件名のルール

- `<type>(<scope>): <summary>` または `<type>: <summary>`
- 50 字以内目安、最大 72 字
- 英語、小文字始まり、末尾ピリオドなし
- 命令形（"add X" であって "added X" や "adds X" ではない）
- 「何を」ではなく「何のため」が伝わる動詞を選ぶ

良い例 / 悪い例:

| ✗ 悪い                                  | ✓ 良い                                                                |
| --------------------------------------- | --------------------------------------------------------------------- |
| `update:` （件名のみ・空）              | `feat(blog): add reading time estimate to post header`                |
| `fix:` （何を直したか不明）             | `fix(og): handle missing pubDate in slug-to-image map`                |
| `add: focus-visible article`            | `chore(content): add focus-visible article`                           |
| `update: packages`                      | `chore(deps): bump 7 packages`                                        |
| `remove: postcss-fluid-sizing-function` | `chore(deps): drop postcss-fluid-sizing-function (no longer used)`    |

### 2-2. 本文のルール

- 件名と本文の間は空行 1 行
- 72 字で改行
- **「何を」ではなく「なぜ」を書く**。コードを読めば分かる事実は書かない
- 影響範囲、トレードオフ、関連 Issue/参照リンクがあれば書く
- 1 行で十分なら本文は省略してよい（直近の `feat:` 系コミットがそう）

### 2-3. 件名のみコミットの禁止

`test:` だけ、`fix:` だけ、`update:` だけのような **件名のみで内容ゼロ** のコミットは作らない。
件名 50 字に収まらない情報は本文で補う。

---

## Step 3: ユーザー承認

ドラフトを以下の形でユーザーに提示し、**承認を待つ**:

```
コミットメッセージ案:
---
<type>(<scope>): <summary>

<body>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
---

ステージ対象:
- path/to/file1
- path/to/file2

この内容でコミットしてよいですか？
```

ユーザーから明示的な OK/GO が出るまでコミットしない。修正指示があれば反映してから再提示。

---

## Step 4: コミット実行

承認が出たら以下を順に実行する:

```bash
# 1. ステージ（必要なファイルだけを名指し）
git add path/to/file1 path/to/file2
# `git add -A` や `git add .` は使わない（.env 等の混入リスク）

# 2. HEREDOC でコミット
git commit -m "$(cat <<'EOF'
<type>(<scope>): <summary>

<body>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"

# 3. 結果確認
git status
git log -1 --stat
```

### pre-commit フック失敗時

- `--no-verify` で **回避しない**
- 失敗原因（lint, format 等）を読み、根本対応
- 再ステージ → **新しいコミット** を作る（`--amend` ではなく `git commit` を再実行）

---

## Step 5: 後始末

- push はしない（ユーザーが明示的に頼まない限り）
- 一時ファイルや stash を残さない
- ミニ報告: 「`<sha>` でコミットしました。次は何をしますか？」

---

## 複数コミットに分ける判断

1 つのコミットに複数の type が混ざりそうな場合は分ける:

- 「依存更新 + その追従修正」→ `chore(deps): ...` と `fix(...): adjust to <pkg> v2` の 2 コミット
- 「リファクタ + バグ修正」→ `refactor: ...` と `fix: ...` の 2 コミット
- 「機能追加 + 既存バグの fix」→ `feat: ...` と `fix: ...` の 2 コミット

ただし、変更が論理的に不可分なら 1 コミットでよい。**目安は「revert したくなったときに困らない単位」**。

---

## やってはいけないこと

- `add:` / `update:` / `remove:` / `delete:` 等の非標準 type を使う
- 件名のみ・本文無し・内容ゼロのコミットを作る（`test:` だけ等）
- `--no-verify` でフックをスキップする
- `git add -A` / `git add .` を使う（意図しないファイル混入のリスク）
- ユーザーの「OK」なしに勝手にコミットする
- 過去のコミットを `--amend` する（特に既に push 済みの場合）
- 勝手に push する
- 日本語のコミットメッセージを書く（英語に統一）
- 一つのコミットに無関係な変更を詰め込む
