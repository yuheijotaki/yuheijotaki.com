---
name: update-deps
description: npm パッケージを patch+minor で一括更新する。major は対話で選別し、`overrides` も追従。`npm run lint` と `npm run build` で検証し、`main` に直接コミットする。「パッケージ更新」「依存を上げて」「ライブラリのバージョンアップ」と言われたときに使用。
---

# パッケージ更新ワークフロー

このプロジェクト（Astro + Vercel、npm 管理）の依存パッケージを安全に更新する。
**必ず以下のステップを順番に実行し、各フェーズの終わりで報告して次に進むこと。**

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

`package.json` の `overrides` セクション（現状: `glob`, `minimatch`, `path-to-regexp`, `yaml`）について、それぞれ最新の patch+minor を取得して書き換える:

```bash
# 例: glob の current major 系列の最新版を取得
npm view glob versions --json | jq '[.[] | select(startswith("13."))] | last'
```

- `^13.0.6` → `^13.0.7` のような書き換えのみ。**メジャーは触らない**
- 書き換えたら再度 `npm install` を実行

### `npm install` が peer deps エラーで失敗した場合

- エラー出力をそのまま提示
- 「該当 major を除外して再試行しますか / `--legacy-peer-deps` で押し切りますか / 中止しますか」と質問
- 自動で `--force` や `--legacy-peer-deps` をつけない

---

## Step 4: 検証

順番に実行し、**失敗したら停止して原因をユーザーに報告**する。

```bash
npm run lint      # ESLint + Stylelint + Prettier
npm run build     # Astro build
```

両方通ったら、目視確認用に dev server をバックグラウンド起動:

```bash
npm run dev   # Bash の run_in_background: true で起動
```

ユーザーに以下を伝える:

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

| 状況 | 操作 |
|---|---|
| `npm install` 後・コミット前に問題発覚 | `git restore package.json package-lock.json && npm install` |
| コミット後に問題発覚 | `git revert HEAD` を提案（`reset --hard` は提案しない） |
| dev server が残った | バックグラウンドプロセスを kill |

---

## やってはいけないこと

- `--no-verify` でフックをスキップする
- `git push --force` や `git reset --hard` をユーザー指示なく実行する
- `--legacy-peer-deps` や `--force` を勝手に付けて install する
- `overrides` のメジャーを勝手に上げる（明示的なピン止めなので尊重）
- ユーザーの「OK」なしに勝手にコミットする
- 検証が失敗したのにそのまま進める
