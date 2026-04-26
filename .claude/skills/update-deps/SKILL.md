---
name: update-deps
description: npm パッケージを patch+minor で一括更新する。major は対話で選別し、`overrides` も追従。`npm run lint` と `npm run build` で検証し、`main` に直接コミットする。「パッケージ更新」「依存を上げて」「ライブラリのバージョンアップ」と言われたときに使用。
---

# パッケージ更新ワークフロー

このプロジェクト（Astro + Vercel、npm 管理）の依存パッケージを安全に更新する。
**必ず以下のステップを順番に実行し、各フェーズの終わりで報告して次に進むこと。**

開始時に各 Step を `TaskCreate` で登録し、`in_progress` / `completed` を都度更新すること（進捗を可視化するため）。

---

## 前提

- パッケージマネージャ: **npm**
- 既定の更新範囲: **patch + minor**（major は対話で個別承認）
- ブランチ運用: **`main` に直接コミット**
- 検証: `npm run lint` と `npm run build`、加えて目視確認用に `npm run dev` を起動
- コミットメッセージ: `chore(deps): bump <N> packages`（本文に bump 一覧）

---

## Step 0: 事前チェック

以下を確認し、**1つでも満たさなければ停止してユーザーに確認**する。

```bash
git status --porcelain   # 出力が空 = clean
git rev-parse --abbrev-ref HEAD   # main であること
```

- working tree が dirty: 「未コミット変更があります。stash しますか / 中止しますか」と質問
- ブランチが `main` 以外: 「現在 `<branch>` にいます。`main` に切り替えますか / このまま進めますか」と質問

---

## Step 1: 更新候補の調査

`npm-check-updates` を npx で利用する（グローバルインストール不要）。

```bash
# patch + minor の候補
npx -y npm-check-updates --target minor --jsonUpgraded

# major を含む全候補
npx -y npm-check-updates --target latest --jsonUpgraded

# overrides セクションのために最新情報も取得
npm outdated --json || true   # exit code 1 でも続行
```

両 JSON を比較し、**major のみで上がる差分**を抽出する。

ユーザーへの中間報告フォーマット:

```
patch+minor で更新可能: N 件
  - astro: 6.1.8 → 6.2.0
  - ...

major アップデートあり: M 件（個別確認します）
  - typescript: 6.0.3 → 7.0.0
  - ...
```

---

## Step 2: major アップデートの選別（major があるときのみ）

各 major パッケージについて GitHub の releases / CHANGELOG の URL を取得する:

```bash
npm view <pkg> repository.url homepage
```

`AskUserQuestion` を **multiSelect=true** で起動し、含める major をユーザーに選んでもらう。

- 質問例: 「同コミットに含める major アップデートを選んでください」
- 各オプションの description に「現バージョン → 新バージョン」と CHANGELOG URL を入れる
- リリースノートが取得できない場合は `npm view <pkg> versions --json` で隣接バージョンの存在を確認するのみで OK

**選ばれなかった major は今回スキップする**（今回は触らない）。

---

## Step 3: 更新の実行

```bash
# 1. patch + minor を一括適用（package.json と lockfile 両方が更新される）
npx -y npm-check-updates --target minor -u

# 2. ユーザーが選んだ major を追加適用
npx -y npm-check-updates --filter <pkg1>,<pkg2> -u

# 3. install
npm install
```

### overrides の更新（patch + minor に追従）

`package.json` の `overrides` セクションについて、各エントリの**指定形式に応じて扱いを変える**:

| 指定形式                          | 例                            | 扱い                                                |
| --------------------------------- | ----------------------------- | --------------------------------------------------- |
| `^x.y.z`（caret 付き）            | `"glob": "^13.0.6"`           | **更新対象**。同 major の最新 patch+minor に bump   |
| `x.y.z`（caret なし = exact pin） | `"yaml": "2.8.3"`             | **触らない**。意図的なピン止めとして尊重            |
| `>=x.y.z` 等の開区間              | `"path-to-regexp": ">=8.0.0"` | **触らない**。範囲指定は npm install 時に解決される |

caret 付きの最新 patch+minor は以下で一発取得できる:

```bash
# 例: glob の ^13 系列の最新版
npm view glob@^13 version
```

- 書き換え例: `^13.0.6` → `^13.0.7`。**メジャーは触らない**
- 該当エントリを更新したら再度 `npm install` を実行
- 各エントリの結果（更新あり / 既に最新 / pin で対象外）を報告に含める

### `npm install` が peer deps エラーで失敗した場合

- エラー出力をそのまま提示
- 「該当 major を除外して再試行しますか / `--legacy-peer-deps` で押し切りますか / 中止しますか」と質問
- 自動で `--force` や `--legacy-peer-deps` をつけない

### `npm install` 成功時の `npm audit` 警告について

- 「N moderate severity vulnerabilities」のような警告は **報告のみ**
- `npm audit fix --force` は **絶対に自動実行しない**（破壊的変更を含む）
- 必要なら別タスクとしてユーザーに提案する

---

## Step 4: 検証

順番に実行し、**失敗したら停止して原因をユーザーに報告**する。

```bash
npm run lint      # ESLint + Stylelint + Prettier
npm run build     # Astro build
```

### lint が失敗した場合の回帰判定

lint 失敗時は「deps 更新で増えたエラーか / 元から存在するエラーか」を**自動判定してから**ユーザーに報告する:

```bash
# 1. deps 更新を一時退避
git stash push -m "deps-update-temp" -- package.json package-lock.json
npm install --silent

# 2. baseline 計測（エラー件数だけでよい）
npm run lint 2>&1 | tail -3

# 3. 復元
git stash pop
npm install --silent
```

- **件数が同じ** → 回帰ではない。エラー一覧と「既存エラーのため deps 更新とは無関係」と報告し、続行可否をユーザーに諮る
- **件数が増えた** → 回帰の可能性大。新規エラーを抜き出して報告し、停止
- **件数が減った** → 想定外。報告して判断を仰ぐ

### build / dev server

build が通ったら、目視確認用に dev server をバックグラウンド起動:

```bash
npm run dev   # Bash の run_in_background: true で起動
```

起動完了は `until grep -q` で待機する（出力ファイルパスは Bash 結果に表示される）:

```bash
until grep -q -E "Local|ready|error" <output-file>; do sleep 1; done
```

その後ユーザーに以下を伝える:

- `http://localhost:4321` にアクセスして確認してほしい
- 確認終了後に「OK」「NG」を返してもらう
- NG なら何が問題かを聞く

---

## Step 5: コミット & クリーンアップ

ユーザーから OK が出たら:

1. コミットメッセージをドラフトしてユーザーに提示（**承認を得てからコミット**）

   ```
   chore(deps): bump <N> packages

   - astro: 6.1.8 → 6.2.0
   - typescript: 6.0.3 → 7.0.0
   - ...
   - overrides:
     - glob: ^13.0.6 → ^13.0.7
   ```

   - 末尾には `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` を含める
   - HEREDOC で `git commit -m "$(cat <<'EOF' ... EOF)"` の形を使う

2. 承認後にコミット

   ```bash
   git add package.json package-lock.json
   git commit -m "$(cat <<'EOF'
   chore(deps): bump <N> packages

   ...

   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
   EOF
   )"
   git status   # 結果確認
   ```

3. **dev server のバックグラウンドプロセスを必ず停止**する（孤立プロセス防止）

4. push はしない（ユーザーが明示的に頼まない限り）

---

## ロールバック方針

| 状況                                   | 操作                                                        |
| -------------------------------------- | ----------------------------------------------------------- |
| `npm install` 後・コミット前に問題発覚 | `git restore package.json package-lock.json && npm install` |
| コミット後に問題発覚                   | `git revert HEAD` を提案（`reset --hard` は提案しない）     |
| dev server が残った                    | バックグラウンドプロセスを kill                             |

---

## やってはいけないこと

- `--no-verify` でフックをスキップする
- `git push --force` や `git reset --hard` をユーザー指示なく実行する
- `--legacy-peer-deps` や `--force` を勝手に付けて install する
- `npm audit fix --force` を勝手に実行する（破壊的変更を含む）
- `overrides` のメジャーを勝手に上げる（明示的なピン止めなので尊重）
- `overrides` の caret なし指定（exact pin）や開区間（`>=` 等）を勝手に書き換える
- ユーザーの「OK」なしに勝手にコミットする
- 検証が失敗したのにそのまま進める（先に回帰判定 → ユーザーに諮る）
