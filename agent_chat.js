const fs = require("fs");
const path = require("path");

function logToFile(msg) {
  const logPath = path.join(__dirname, "agent_chat_log.txt");
  const logLine = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFile(logPath, logLine, (err) => {
    if (err) console.error("⚠️ 无法写入日志文件:", err);
  });
}

// 包装 console.warn 和 console.error
const originalWarn = console.warn;
console.warn = function (...args) {
  const msg = args.join(" ");
  logToFile("⚠️ " + msg);
  originalWarn.apply(console, args);
};

const originalError = console.error;
console.error = function (...args) {
  const msg = args.join(" ");
  logToFile("❌ " + msg);
  originalError.apply(console, args);
};

// ⚠️ 你的 cookie 原样保留（这里不做改动）


// 获取命令线参数
const args = process.argv.slice(2);
let message = "疼";
let mode = "chat";
let threadId = "106329698";
let agentId = "13155";
let debug = false;

// ✅ 解析参数（修复你现在缩进/else-if 位置错误的问题）
for (let i = 0; i < args.length; i++) {
  const a = args[i];

  if (a === "-m" || a === "--mode") {
    mode = args[i + 1] || "chat";
    i++;
    continue;
  }

  if (a === "-msg" || a === "--message") {
    message = args[i + 1] || "疼";
    i++;
    continue;
  }

  if (a === "-threadId" || a === "--thread-id") {
    threadId = args[i + 1] || "106329698";
    i++;
    continue;
  }

  if (a === "-agentId" || a === "--agent-id") {
    agentId = args[i + 1] || "13155";
    i++;
    continue;
  }

  if (a === "--debug"||a === "-debug"
  ) {
    debug = true;
    continue;
  }

  if (a ==="--cookies" || a=="-cookies") {
    cookie = args[i + 1];
    i++;
  }

  // 兼容：不带参数名时把它当 message
  if (!a.startsWith("-")) {
    message = a;
  }
}

// 风控错误统一标识（便于甄别）
const RISK_ERR_PREFIX = "❌ 触发风控限制：";

// ✅ 专门用于检测“回复上限”的函数：命中就 throw（让外层接住）
function throwIfRateLimitedFromStatusData(data) {
  const steps = data?.result?.[0]?.run_detail?.steps;
  if (!Array.isArray(steps)) return;

  for (const step of steps) {
    if (step?.name === "check" && step?.content) {
      let checkContent;
      try {
        checkContent = JSON.parse(step.content);
      } catch {
        console.warn("⚠️ check 内容解析失败:", step.content);
        continue;
      }

      const toast = checkContent?.toast;
      if (typeof toast === "string" && toast.includes("已达到回复上限")) {
        throw new Error(`${RISK_ERR_PREFIX}${toast}`);
      }
    }
  }
}

fetch("https://yuexia.baidu.com/capi/v1/story/conversation/chat", {
  method: "POST",
  headers: {
    "Content-Type": "text/plain;charset=UTF-8",
    "Accept": "text/event-stream",
    "Cookie": 'APP_VERSION=999.999.999; BAIDUID=4CD08DDCF2CC769CFBE092640D0A2E5F:FG=1; BAIDUID_BFESS=4CD08DDCF2CC769CFBE092640D0A2E5F:FG=1; BDUSS=0o3bTRLcXBTclUtWnRWZjR2Sk9ZNDQ2d2ZCU3VvdEZxTn5aZjJtQ0tNR2lzSzFwSVFBQUFBJCQAAAAAAAAAAAEAAAD3L-llvLjIy8bfs6cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKIjhmmiI4ZpV; BDUSS_BFESS=0o3bTRLcXBTclUtWnRWZjR2Sk9ZNDQ2d2ZCU3VvdEZxTn5aZjJtQ0tNR2lzSzFwSVFBQUFBJCQAAAAAAAAAAAEAAAD3L-llvLjIy8bfs6cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKIjhmmiI4ZpV; RT="z=1&dm=baidu.com&si=da3a4046-0a5a-440a-89b7-6c52aabec90b&ss=mlbxtx45&sl=4&tt=5p5&bcn=https%3A%2F%2Fclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=1pa7"',
  },
  body: JSON.stringify({
    agent_id: agentId,
    stream: true,
    user_info: {
      cuid: "",
      baiduid: "EB08BD77F9FACFD734BB4FA47550B8F3:FG=1",
    },
    thread: {
      thread_id: threadId,
      round_index: 1,
      message: [
        {
          type: "TEXT",
          data: {
            text: { query: message },
          },
        },
      ],
    },
    trans_datas: [
      {
        type: "json",
        key: "ext_chat",
        value: JSON.stringify({
          agent_id: "16244",
          chapter_id: "13771",
          from: "h5",
          source: "wise_theater",
          valid_round: 1,
        }),
      },
    ],
  }),
  credentials: "include",
})
  .then(async (res) => {
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    function processAvailableEvents() {
      while (true) {
        const m = buffer.match(/\r?\n\r?\n/);
        if (!m) break;

        const sepIndex = m.index;
        const sepLen = m[0].length;
        const eventBlock = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + sepLen);

        const lines = eventBlock.split(/\r?\n/);
        let eventType = null;
        const dataParts = [];

        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventType = line.replace(/^event:\s*/, "");
          } else if (line.startsWith("data:")) {
            dataParts.push(line.replace(/^data:\s*/, ""));
          }
        }

        // ✅ 每个 event 都先拿 rawoutput
        const rawoutput = dataParts.join("\n");
        if (!rawoutput) continue;

        // ✅ debug mode：只输出 raw，不做任何解析
        if (debug) {
          console.log(rawoutput);
          continue;
        }

        // -------- message 事件：解析主回复/建议回复 --------
        if (eventType && eventType.includes("message")) {
          try {
            const data = JSON.parse(rawoutput);

            // 主回复（components）
            const mainReplies = [];
            const components = data?.result?.[0]?.content?.components;

            if (Array.isArray(components)) {
              for (const comp of components) {
                if (comp?.name === "json" && typeof comp?.data === "string") {
                  try {
                    const parsed = JSON.parse(comp.data);
                    for (const item of parsed) {
                      if (item?.text?.value) mainReplies.push(item.text.value);
                    }
                  } catch (e) {
                    console.warn("⚠️ 无法解析主回复 JSON:", comp.data);
                  }
                }
              }
            }

            // 建议回复（suggestion）
            const suggestionReplies = [];
            const suggestions = data?.result?.[0]?.functional?.suggestion;

            if (Array.isArray(suggestions)) {
              for (const s of suggestions) {
                try {
                  const parsed =
                    typeof s.content === "string" ? JSON.parse(s.content) : s.content;
                  if (parsed?.text?.value) suggestionReplies.push(parsed.text.value);
                } catch (e) {
                  console.warn("❌ 建议 JSON 解析失败:", s.content);
                }
              }
            }

            // 输出两类回复
            if (mainReplies.length) {
              mainReplies.forEach((r) => console.log("💬 主回复:", r));
            }
            if (suggestionReplies.length) {
              suggestionReplies.forEach((r) => console.log("💡 建议回复:", r));
            }
          } catch (err) {
            console.error("❌ message 外层 JSON 解析失败:", err);
          }

          continue;
        }

        // -------- status 事件：提取角色 + 检测回复上限 --------
        if (eventType && eventType.includes("status")) {
          let data;
          try {
            data = JSON.parse(rawoutput);
          } catch (e) {
            console.warn("⚠️ status 数据 JSON 解析失败:", rawoutput);
            continue;
          }

          // ✅ 先检测“回复上限”：命中直接 throw（不要被误判为解析失败）
          throwIfRateLimitedFromStatusData(data);

          // 正常提取角色
          const steps = data?.result?.[0]?.run_detail?.steps;
          if (Array.isArray(steps)) {
            for (const step of steps) {
              if (step?.name === "role" && step?.content) {
                try {
                  const roleData = JSON.parse(step.content);
                  const role = roleData?.role_info?.role;
                  const avatar = roleData?.role_info?.avatar;
                  if (role) console.log("🎭 角色名:", role);
                  if (avatar) console.log("🖼️ 头像链接:", avatar);
                } catch (e) {
                  console.warn("⚠️ 角色内容 JSON 解析失败:", step.content);
                }
              }
            }
          }

          continue;
        }

        // 其他 eventType：不处理（避免噪声）
      }
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          const tail = decoder.decode();
          if (tail) buffer += tail;

          // ✅ 这里如果触发风控 throw，会跳到外层 catch，并最终被 .catch 捕获
          processAvailableEvents();

          if (!debug) console.log("✅ 响应读取完毕");
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // ✅ 同上：这里 throw 会向外冒泡
        processAvailableEvents();
      }
    } catch (err) {
  // ✅ 如果是我们故意 throw 的风控错误：不要当作“读取流时出错”打印
  if (err instanceof Error && String(err.message).startsWith(RISK_ERR_PREFIX)) {
    // 尽量收尾（可选）
    try { await reader.cancel(); } catch (_) {}
    // 继续向外抛，让最终 .catch 统一输出一次（不会重复“读取流时出错”）
    throw err;
  }

  // ❌ 其他才是真正的读取流异常
  console.error("❌ 读取流时出错:", err);
  try { await reader.cancel(); } catch (_) {}
  throw err;
} finally {
      try {
        reader.releaseLock();
      } catch (_) {}
    }
  })
  .catch((err) => {
    // ✅ 风控错误：打印更准确的信息
    if (err instanceof Error && String(err.message).startsWith(RISK_ERR_PREFIX)) {
      console.error(err.message);
      process.exitCode = 2;
      return;
    }
    console.error("❌ 请求错误:", err);
    process.exitCode = 1;
  });
