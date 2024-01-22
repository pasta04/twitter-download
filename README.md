# Twitter Download

特定のユーザのツイートをAPIが使える限り全取得

## パッケージインストール
```shell
yarn
```

## 準備

```
https://twitter.com/i/api/graphql/7ScCGZVFD03gmVSeB3WuqA/UserTweetsAndReplies
```

のリクエストから cookie とかを抜き出して config に書く。


## 実行
### ツイートの取得
- 途中で失敗した時は`search.ts`の`cursor: ''`のコメントアウトを外してcursorの値を入力

```shell
yarn search
```

### メディアの取得

```shell
yarn media
```
