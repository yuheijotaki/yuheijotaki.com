---
title: satoriとsharpでog:imageを生成する
description: satoriとsharpを使ってog:imageを生成したメモです。
pubDate: 2024-04-01T15:00:00.000Z
---

## はじめに

[satori](https://github.com/vercel/satori) を使用して記事ページのog:image画像を作成する。

## 手順

### インストール

`satori` `sharp` を入れる。  
Reactのインテグレーションも行う。

### [`src/pages/og/[slug].png.ts`](https://github.com/yuheijotaki/yuheijotaki.com/blob/main/src/pages/og/%5Bslug%5D.png.ts)

書き出す画像ファイルのエンドポイント用に作成

### [`src/components/OgImage.tsx`](https://github.com/yuheijotaki/yuheijotaki.com/blob/main/src/components/OgImage.tsx)

画像を生成。HTML/CSSをsatoriでSVGへ書き出し、sharpでPNGに変換。  
[Vercel OG Image Playground](https://og-playground.vercel.app/) などを使うと便利かも。

### `og:image` 指定の変更

`og:image` や `twitter:image` のパス指定を変更する。

## 結果

![og:imageとして使用するこの記事の画像](/og/2024040101_satori-og-image.png)

## ひとこと

- 枠線のデザインなどは背景画像を用意して読み込ませるほうがよいかも
- フォントの指定はWebフォント or ローカルに置いたものを指定する
- `webkit-line-clamp` がうまく効かなかったため、一旦文字数で切り取っている
