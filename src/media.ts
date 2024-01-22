import fs from 'fs-extra';
import path from 'path';
import { globSync } from 'glob';
import axios from 'axios';
import configModule from 'config';
const config = configModule as any as {
  authorization: string;
  cookie: string;
  csrftoken: string;
  userId: string;
  screen_name: string;
};

const SCREEN_NAME = config.screen_name;
const MEDIA_BASE = `data/media/${SCREEN_NAME}`;

const saveTweetImages = async () => {
  const tweetfiles = globSync(`data/users/${SCREEN_NAME}/*.json`, { ignore: '**/user.json' });
  console.log(`files: ${tweetfiles.length}`);

  for (const filename of tweetfiles) {
    const json = JSON.parse(fs.readFileSync(filename).toString());
    console.log(json.id_str);

    if (json.extended_entities) {
      const id = json.id_str;

      for (const media of json.extended_entities.media) {
        const type: 'photo' | 'video' = media.type;
        /** 画像URL。ビデオの場合はサムネURL */
        const media_url: string = media.media_url_https;
        /** 拡張子の.無し */
        const ext = path.parse(media_url).ext.replace('.', '');
        // console.log(`ext = ${ext}`);

        // フォルダ作成
        if (!fs.existsSync(`${MEDIA_BASE}/${id}`)) {
          fs.mkdirpSync(`${MEDIA_BASE}/${id}`);
        }

        // 画像DL
        // console.log(saveImageFilename);
        const saveImageFilename = `${MEDIA_BASE}/${id}/${path.basename(media_url)}`;
        if (!fs.existsSync(saveImageFilename)) {
          const url = `${media_url}?format=${ext}&name=orig`;
          console.log(url);
          const res = await axios(url, { responseType: 'arraybuffer' });
          fs.writeFileSync(saveImageFilename, res.data);
        }

        // 動画DL
        if (type === 'video') {
          const video_info = media.video_info;

          // 最もビットレートの高い動画のURLを取得する
          let url = '';
          let bitrate = 0;
          for (const variant of video_info.variants) {
            if (variant.content_type === 'video/mp4' && variant.bitrate > bitrate) {
              url = variant.url;
              bitrate = variant.bitrate;
            }
          }

          const saveVideoFilename = `${MEDIA_BASE}/${id}/${path.basename(url).replace(/\?.*/, '')}`;
          if (!fs.existsSync(saveVideoFilename)) {
            console.log(url);
            const res = await axios(url, { responseType: 'arraybuffer' });
            fs.writeFileSync(saveVideoFilename, res.data);
          }
        }
      }
    }
  }
};

saveTweetImages();
