# 这个脚本是用来爬取百度月匣的agents脚本



# 用法

脚本只能用docker运行

# 项目结构
## crawl_agentId
./docker/crawl_agentId
## cookies
.env :需要你获取cookies，以及设置你要爬的id ，如何从那个Id开始爬取
AGENT_ID=12679
COOKIES=APP_VERSION=999.999.999;BAIDUID={你自己的cookies值}; BAIDUID_BFESS={你自己的cookies值}; BDUSS={你自己的cookies值}; BDUSS_BFESS={你自己的cookies值}; BAIDUID={你自己的cookies值};  RT={你自己的cookies值}



## 获取cookies：



在网站聊天，打开F12 点击>network > 随便发一条信息后获取agents chat 数据>右键chat>COPY>copy as fetch(nodejs)
```
fetch("https://yuexia.baidu.com/capi/v1/story/conversation/chat", {
  "headers": {
    "accept": "text/event-stream",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
    "content-type": "text/plain;charset=UTF-8",
    "sec-ch-ua": "\"Not:A-Brand\";v=\"99\", \"Google Chrome\";v=\"145\", \"Chromium\";v=\"145\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "cookie": {这里就是你的cookies},
    "Referer": "https://yuexia.baidu.com/amuse/agent?fromsource=wise_theater&id=15760"
  },
  "body": "{\"agent_id\":\"15760\",\"stream\":true,\"user_info\":{\"cuid\":\"\",\"baiduid\":\"EB08BD77F9FACFD734BB4FA47550B8F3:FG=1\"},\"thread\":{\"thread_id\":\"319777200\",\"round_index\":1,\"message\":[{\"type\":\"TEXT\",\"data\":{\"text\":{\"query\":\"哈哈\"}}}]},\"trans_datas\":[{\"type\":\"json\",\"key\":\"ext_chat\",\"value\":\"{\\\"agent_id\\\":\\\"15760\\\",\\\"chapter_id\\\":\\\"16936\\\",\\\"from\\\":\\\"h5\\\",\\\"source\\\":\\\"wise_theater\\\",\\\"valid_round\\\":1}\"}]}",
  "method": "POST"
});
  ```



## 运行 

检查你的 .env file 如果没问题
```
docker compose up -d
```
运行脚本
