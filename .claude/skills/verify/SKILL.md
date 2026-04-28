---
name: verify
description: 変更後の動作確認を一括実行する。lint（回帰判定込み） → build → a11y（UI 影響時） → dev server 目視確認（UI 影響時） → 後始末。「動作確認」「verify」「検証して」「変更を確認したい」「smoke test」と言われたときに使用。
---

# 動作確認ワークフロー

このプロジェクト（Astro + Vercel）の作業中の変更が壊れていないかを段階的に検証する。
**必ず以下のステップを順番に実行し、各フェーズの終わりで報告して次に進むこと。**

開始時に各 Step を `TaskCreate` で登録し、`in_progress` / `completed` を都度更新すること（進捗を可視化するため）。

---

## 前提

- パッケージマネージャ: **npm**
- 実行する検証: `npm run lint` / `npm run build` / `npm run test:a11y` / `npm run dev`
- スキルの責務範囲: **検証のみ**。コミット・push・ロールバックは行わない（必要なら別スキルや commit スキルへ委譲）
- update-deps Step 4 の検証手順を汎用化したもの。将来 update-deps から内部委譲する想定

---

## Step 0: 事前チェック

### 0-1. 変更内容の取得

```bash
git status --porcelain
git diff --name-only HEAD       # コミット済みでなく、HEAD と作業ツリーの差分
git diff --name-only --staged   # ステージ済み
```

両方の和集合を「今回検証する変更ファイル群」とする。

- 変更が無い: 「検証対象がありません」と報告して終了

### 0-2. UI 影響の判定（後続ステップの ON/OFF を決める）

変更ファイル群を以下のパターンで分類する:

| 判定                                  | パターン                                                                                                                                                                                                                                              | 影響                          |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **UI 影響あり (a11y + dev server)**   | `src/components/**`, `src/layouts/**`, `src/pages/**`, `src/styles/**`, `src/icons/**`, `src/rehype-plugins/**`, `astro.config.mjs`                                                                                                                   | a11y 実行 + dev server 目視   |
| **UI 影響あり (dev server のみ)**     | `src/content/blog/**`, `src/utils/**`, `src/content.config.ts`, `src/live.config.ts`, `src/consts.ts`, `src/types/**`, `public/**`, `tsconfig.json`, `package.json`, `package-lock.json`                                                              | dev server 目視のみ           |
| **影響なし**                          | `.claude/**`, `tests/**`, `playwright.config.ts`, `eslint.config.mjs`, `.markuplintrc`, `.prettierrc.json`, `.stylelintrc.json`, `.gitignore`, `.node-version`, `.npmrc`, ルートの `*.md`（`README.md` 等）                                            | dev server スキップ提案、a11y なし |
| **未分類（不明）**                    | 上記いずれにも該当しないパス                                                                                                                                                                                                                          | 安全側に倒し dev server ON、a11y は OFF |

**実装メモ**: 上記は OR 判定（最も影響度が高いカテゴリに合算する）。例えば `src/components/Foo.astro` と `.claude/CLAUDE.md` の両方が変わっていれば、**UI 影響あり (a11y + dev server)** として扱う。

### 0-3. ポート 4321 の競合確認

```bash
lsof -i :4321 -t || true   # 何も無ければ exit 1。stderr ではなく exit code で判別
```

PID が返ってきた場合は **既に何かが 4321 を握っている**:

- 「既に dev server らしきプロセスが動いています（PID: \<pid\>、コマンド: \<cmd\>）。停止して進めますか / このまま進めますか / 中止しますか」と質問
- ユーザーが「停止」と答えたら `kill <pid>` → 再確認。それでも残っていれば `kill -9 <pid>` の許可を取る
- 自動 kill は **絶対にしない**

### 0-4. 中間報告フォーマット

```
変更ファイル: N 件
  - .claude/CLAUDE.md
  - src/components/Header.astro
  - ...

判定:
  - UI 影響あり（a11y + dev server）
  - 実行予定: lint → build → test:a11y → dev server 目視 → 後始末

ポート 4321: 空き / 使用中（PID xxx）
```

---

## Step 1: lint（回帰判定込み）

```bash
npm run lint
```

### 成功時

そのまま Step 2 へ。

### 失敗時 — 自動で回帰判定する

「**現在の変更で増えたエラーか / 元から存在するエラーか**」を判別してからユーザーに報告する。update-deps の手順を流用:

```bash
# 1. 作業ツリーをいったん HEAD 状態に退避
git stash push -m "verify-baseline-temp" --include-untracked

# 2. baseline 計測（エラー件数だけでよい）
npm run lint 2>&1 | tail -3

# 3. 復元
git stash pop
```

判定基準:

- **件数が同じ** → 回帰ではない。エラー一覧と「既存エラーのため今回の変更とは無関係」を報告し、続行可否（Step 2 build へ進むか）をユーザーに諮る
- **件数が増えた** → 新規回帰の可能性大。新規分のエラーを抜き出して報告し、停止
- **件数が減った** → 想定外。報告して判断を仰ぐ

### `git stash pop` で衝突した場合（重要）

`stash pop` 後に exit code が非 0、または `git status` でコンフリクトマーカが見えた場合は **絶対に先に進まない**:

- `git stash list` でスタッシュが残っているか確認（pop 失敗時はスタッシュは破棄されない）
- 状況をそのままユーザーに提示し「手動で解決しますか / 中止して `git checkout -- .` で破棄しますか」を質問
- 自動で `git checkout --theirs` 等のマージ戦略を取らない（現在の変更を失うリスクがある）

### `--include-untracked` の理由

新規ファイル（未追跡）も含めないと、作業ツリーから「現在の変更だけ」を消した baseline にならない。`untracked` 込みで stash することで HEAD 相当の状態を作れる。

---

## Step 2: build

```bash
npm run build
```

### 失敗時

baseline は **取らない**（build は時間がかかり、失敗の意味も lint と異なる）。エラーログをそのまま提示して停止し、続行可否をユーザーに諮る。

```
build に失敗しました:
<エラーログ末尾 50 行>

可能性:
- 型エラー / インポート不整合
- astro.config.mjs の設定変更による副作用
- コンテンツコレクションのスキーマ違反

どう進めますか:
- (a) この場で修正案を提案させる
- (b) 自分で確認するので一旦停止
- (c) 強引に Step 3/4 へ進める（非推奨）
```

build 失敗状態で a11y / dev server へ進むのは原則禁止（dev server は dev コンパイルなので起動できる場合があるが、ビルドが通らない状態での目視は意味が薄い）。

---

## Step 3: a11y テスト（**UI 影響あり (a11y + dev server)** の判定時のみ）

playwright + axe-core によるテスト。実行には dev server が **ポート 4321 で起動済み** である必要がある（`playwright.config.ts` 参照）。

### 3-1. dev server をバックグラウンド起動（Step 4 と共有）

```bash
# Bash の run_in_background: true で起動
npm run dev
```

起動完了は出力ファイルを `until grep` で待つ:

```bash
until grep -q -E "Local|ready|error" <output-file>; do sleep 1; done
```

`error` を検出したら起動失敗として停止。ユーザーにログを提示して判断を仰ぐ。

### 3-2. テスト実行

```bash
npm run test:a11y
```

### 失敗時

axe の violation を抜き出して報告:

```
a11y テストに失敗しました（N 件の違反）:
  - <rule-id>: <description>（要素: <selector>）
  - ...

dev server は維持したまま停止します。続行しますか:
- (a) 違反を確認したいので Step 4 の目視確認に進む
- (b) ここで停止して修正に入る（dev server は kill する）
```

dev server は **kill しない**（Step 4 でも使うため、`(b)` を選んだときだけ kill）。

---

## Step 4: dev server 目視確認

**UI 影響あり判定（a11y + dev server / dev server のみ どちらでも）** のときに実行。**影響なし** なら以下のメッセージでスキップ提案:

```
今回の変更には UI 影響パスが含まれていません。dev server 目視確認はスキップしてよいですか？
- (a) スキップする（推奨）
- (b) 念のため起動して確認する
```

### 4-1. dev server 起動（Step 3 で起動済みならスキップ）

```bash
npm run dev   # run_in_background: true
until grep -q -E "Local|ready|error" <output-file>; do sleep 1; done
```

### 4-2. ユーザーに目視確認を依頼

```
http://localhost:4321 で確認してください。
特に確認してほしいポイント:
- 変更したコンポーネント / ページが意図通り表示されるか
- コンソールにエラーが出ていないか
- 関連リンク・機能が壊れていないか

確認が終わったら OK / NG を返してください。
NG なら何が問題だったか教えてください。
```

### 4-3. NG だった場合

- 何が問題かを聞き、修正提案を出す or ユーザーに任せる
- このスキルは **コミットや revert は行わない**。修正方針が決まったらユーザー判断で別作業へ

---

## Step 5: 後始末

dev server のバックグラウンドプロセスを **必ず停止** する（孤立プロセス防止）。

```bash
# Bash run_in_background で起動した場合は KillShell ツールで shell ID 指定が第一選択
# （シェルジョブ %1 は別シェルからは効かないため信頼しない）
#
# KillShell が使えない / 確実性を上げたい場合のフォールバック:
pkill -f "astro dev" 2>/dev/null || true
```

停止後の確認:

```bash
pgrep -f "astro dev" || echo "no astro dev running"
lsof -i :4321 -t || echo "port 4321 free"
```

両方が「無し」を返してから完了報告する。

### 完了報告フォーマット

```
動作確認結果:
- lint: ✓ / ✗（回帰: 無 / 既存 / 新規）
- build: ✓ / ✗
- a11y: ✓ / ✗ / skipped（理由）
- 目視: ✓ / ✗ / skipped（理由）

dev server: 停止済み / ポート 4321 解放済み

次のアクション:
- このまま commit に進む（commit スキル）
- 失敗を修正してから再 verify
- 変更を破棄する（git restore など、ユーザーが実行）
```

---

## やってはいけないこと

- lint / build / a11y の **失敗を無視して先に進む**（先に回帰判定 → ユーザーに諮る）
- `--no-verify` でフックをスキップする
- ポート 4321 を握っている既存プロセスを **無断で kill する**
- `git stash pop` のコンフリクトを自動マージで処理する（現在の変更を失うリスク）
- dev server を **起動したまま終了する**（孤立プロセス）
- このスキル内で **コミット・push・revert を実行する**（責務外。commit スキルや手動操作に委譲）
- `npm audit fix --force` を勝手に実行する（破壊的変更を含む）
- 検証フローを **勝手に飛ばす**（影響判定でスキップする場合は必ずユーザーに事前提示）
