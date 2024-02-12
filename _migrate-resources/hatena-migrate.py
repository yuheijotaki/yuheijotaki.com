import re
from datetime import datetime

# テキストファイルの内容を読み込む関数
def read_text_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()

# 文章を.mdファイルに変換して保存する関数
def convert_and_save_articles(text):
    articles = text.split('[ARTICLE-END]')

    for article in articles:
        if '[ARTICLE-START]' in article:
            # 不要なフラグを削除
            article_clean = article.replace('[ARTICLE-START]', '').replace('[CONTENTS-START]', '').replace('[CONTENS-END]', '')

            # publishDateを見つけてファイル名を生成
            date_match = re.search("publishDate: '(.+?)'", article_clean)
            if date_match:
                publish_date_str = date_match.group(1)
                publish_date = datetime.strptime(publish_date_str, '%m/%d/%Y %H:%M:%S')
                file_name = publish_date.strftime('%Y%m%d') + '.md'

                # .mdファイルに記事を保存
                with open(file_name, 'w', encoding='utf-8') as file:
                    file.write(article_clean)

# メイン関数
def main():
    file_path = 'jtk.hatenablog.com.export.txt' # ここに実際のファイルパスを設定
    text = read_text_file(file_path)
    convert_and_save_articles(text)

if __name__ == '__main__':
    main()
