import axios from 'axios';
import fs from 'fs-extra';
import configModule from 'config';
const config = configModule as any as {
  authorization: string;
  cookie: string;
  csrftoken: string;
  userId: string;
  screen_name: string;
};

const authorization = config.authorization;
const cookie = config.cookie;
const csrftoken = config.csrftoken;
const userId = config.userId;
const cursor = '';

const base = 'https://twitter.com/i/api/graphql/7ScCGZVFD03gmVSeB3WuqA/UserTweetsAndReplies';

const saveTweet = async () => {
  try {
    const variables = {
      userId: userId,
      count: 100,
      // cursor: '',
      includePromotedContent: true,
      withCommunity: true, // UserTweetsAndReplies
      // withQuickPromoteEligibilityTweetFields: true, //UserTweets
      withVoice: true,
      withV2Timeline: true,
    };
    const features = {
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_timeline_navigation_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      c9s_tweet_anatomy_moderator_badge_enabled: true,
      tweetypie_unmention_optimization_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
      responsive_web_twitter_article_tweet_consumption_enabled: true,
      tweet_awards_web_tipping_enabled: false,
      freedom_of_speech_not_reach_fetch_enabled: true,
      standardized_nudges_misinfo: true,
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
      rweb_video_timestamps_enabled: true,
      longform_notetweets_rich_text_read_enabled: true,
      longform_notetweets_inline_media_enabled: true,
      responsive_web_media_download_video_enabled: false,
      responsive_web_enhance_cards_enabled: false,
    };

    await search(base, variables, features, cursor);
  } catch (e) {
    console.error('なんかエラー');
    console.log((e as any).message);
    // console.error((e as any).error);
    // console.error((e as any).response.data);
    // console.error((e as any).request._header);
  }
};

const search = async (twitterurlbase: string, variables: any, features: any, cursor: string) => {
  if (cursor) variables.cursor = cursor;
  const twitterurl = `${twitterurlbase}?variables=${encodeURIComponent(JSON.stringify(variables))}&features=${encodeURIComponent(JSON.stringify(features))}`;

  console.log(twitterurl);
  const headers = {
    // Accept: '*/*',
    // 'Accept-Encoding': 'gzip, deflate, br',
    // 'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
    Authorization: authorization,
    'Content-Type': 'application/json',
    Cookie: cookie,
    Dnt: '1',
    // 'Sec-Ch-Ua': '"Google Chrome";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
    // 'Sec-Ch-Ua-Mobile': '?0',
    // 'Sec-Ch-Ua-Platform': 'Windows',
    // 'Sec-Fetch-Dest': 'empty',
    // 'Sec-Fetch-Mode': 'cors',
    // 'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
    // 'X-Client-Transaction-Id': '',
    // 'X-Client-Uuid': '',
    'X-Csrf-Token': csrftoken,
    'X-Twitter-Active-User': 'yes',
    'X-Twitter-Auth-Type': 'OAuth2Session',
    'X-Twitter-Client-Language': 'ja',
  };
  // console.log(JSON.stringify(headers, null, '  '));
  // console.log(headers.Cookie);
  const result = await axios.get(twitterurl, { headers: headers });
  const data = JSON.parse(JSON.stringify(result.data));
  fs.writeFileSync('tweet.json', JSON.stringify(data, null, '  '));
  // console.log('GETは成功');

  const entries = data.data.user.result.timeline_v2.timeline.instructions.find((item) => item.type === 'TimelineAddEntries').entries;
  console.log(`enties is ${entries.length}`);

  cursor = '';
  for (const entry of entries) {
    const entryId = entry.entryId;
    console.log(entryId);
    if (entryId.includes('tweet') || entryId.includes('profile-conversation-')) {
      if (entry.content.items) {
        for (const item of entry.content.items) {
          saveTweetsInner(item.item.itemContent);
        }
      } else {
        saveTweetsInner(entry.content.itemContent);
      }
    } else if (entryId.includes('cursor-bottom')) {
      cursor = entry.content.value;
      fs.appendFileSync(`data/cursor.txt`, `${cursor}\n`);
      console.log(`cursor=${cursor}`);
    }
  }

  if (cursor && entries.length > 2) {
    await search(twitterurlbase, variables, features, cursor);
  } else {
    console.log('終了');
  }
};

const saveTweetsInner = (itemContent) => {
  const result = itemContent.tweet_results.result;
  const user = result.core.user_results.result;
  const screen_name = user.legacy.screen_name;
  const legacy = result.legacy;
  const id = legacy.conversation_id_str;

  const dir = `data/users/${screen_name}`;
  const filename = `data/users/${screen_name}/${id}.json`;
  const userfilename = `data/users/${screen_name}/user.json`;

  if (!fs.existsSync(dir)) {
    fs.mkdirpSync(dir);
  }

  if (!fs.existsSync(userfilename)) {
    fs.writeFileSync(userfilename, JSON.stringify(user, null, '  '));
  }

  if (!fs.existsSync(filename)) {
    console.log(`New: ${screen_name} ${id}`);
    fs.writeFileSync(filename, JSON.stringify(legacy, null, '  '));
  }
  // console.log(legacy.created_at);
};

saveTweet();
