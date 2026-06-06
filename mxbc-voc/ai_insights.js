(function () {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const embedContext = new URLSearchParams(location.search).get("embed") || "delivery";

  const reports = {
    mint: {
      title: "蜜雪薄荷系列新品口碑分析",
      historyTitle: "薄荷新品首发社媒口碑复盘",
      type: "新品口碑",
      url: "./reports/mint-product-report.html",
      question: "请分析薄荷新品在社媒平台的声量、情感和消费者核心反馈。",
      answer: "报告已按新品口碑框架完成。右侧固定展示完整 HTML 报告，中间可继续围绕平台差异、正负面证据词和典型原声追问。",
    },
    delivery: {
      title: "蜜雪冰城外卖评论体验诊断",
      historyTitle: "外卖评价问题与门店风险复盘",
      type: "外卖评价",
      url: "./reports/delivery-report.html",
      question: "请识别外卖评价中最突出的体验问题，并定位高风险区域和门店。",
      answer: "报告已完成问题结构、区域门店和消费者证据分析。当前重点集中在缺物料、备注未执行、份量与食安红线，可在下方继续限定区域或标签。",
    },
    complaint: {
      title: "全渠道客诉与舆情外溢洞察",
      historyTitle: "客诉重点问题与社媒外溢分析",
      type: "客诉分析",
      url: "./reports/complaint-report.html",
      question: "请融合热线、在线客服、外卖评价和社媒数据，识别当前高风险客诉问题。",
      answer: "报告已完成内外部业务量、负向趋势、重点问题和外溢风险归因。可以继续追问某个平台、区域、产品或问题维度。",
    },
  };

  const templates = {
    mint: {
      title: "新品口碑报告",
      description: "配置新品监测范围，生成平台声量、情感、关键词和代表性原声分析。",
      fields: [
        ["时间", "select", ["近 7 天", "近 30 天", "本月", "自定义"]],
        ["平台", "multi", ["全部平台", "微博", "小红书", "抖音", "B站", "快手"]],
        ["关键词", "text", "输入新品名、口味或核心关键词"],
      ],
    },
    delivery: {
      title: "外卖评价分析",
      description: "配置外卖评价范围，生成体验趋势、问题结构、区域门店和消费者原声分析。",
      fields: [
        ["外卖平台", "multi", ["全部平台", "美团", "饿了么", "京东到家"]],
        ["区域", "select", ["全国", "华南", "华东", "华中", "华北", "西南"]],
        ["问题维度", "multi", ["全部问题", "产品体验", "包装打包", "订单履约", "配送履约", "服务售后", "食安卫生"]],
        ["情感", "multi", ["全部情感", "强负", "中负", "中性", "正向"]],
        ["时间", "select", ["昨日", "近 7 天", "近 30 天", "本月", "自定义"]],
        ["问题主体", "select", ["全部主体", "门店", "产品", "配送", "平台", "用户", "不明确"]],
      ],
    },
    complaint: {
      title: "客诉分析报告",
      description: "融合内部客诉与公开社媒数据，生成问题发现、风险归因和外溢监测报告。",
      fields: [
        ["时间周期", "select", ["昨日", "近 7 天", "近 30 天", "本月", "自定义"]],
        ["情感", "multi", ["全部情感", "强负", "中负", "中性", "正向"]],
        ["平台", "multi", ["全部来源", "热线", "在线客服", "外卖评价", "微博", "小红书", "抖音", "B站", "快手"]],
        ["区域", "select", ["全国", "河南", "广东", "山东", "江苏", "浙江", "四川", "湖北"]],
        ["问题维度", "multi", ["全部问题", "产品体验", "食安卫生", "服务售后", "配送履约", "包装打包", "订单履约", "品牌声誉"]],
      ],
    },
  };

  let activeReport = embedContext === "service" ? "complaint" : "delivery";
  let activeTemplate = activeReport;

  function renderHistory() {
    $("#historyList").innerHTML = Object.entries(reports).map(([key, report]) => `
      <button class="history-record ${key === activeReport ? "active" : ""}" data-report="${key}">
        <strong>${report.historyTitle}</strong>
        <div class="history-row"><span class="history-type">深度研究</span><span class="history-status">已完成</span><time>2026-06-06 16:11</time></div>
      </button>
    `).join("") + `
      <button class="history-record" data-question-history>
        <strong>近 7 天外卖评价高频问题</strong>
        <div class="history-row"><span class="history-status">8轮对话</span><time>2026-06-06 15:20</time></div>
      </button>`;
    $$("[data-report]").forEach(item => item.addEventListener("click", () => openConversation(item.dataset.report)));
  }

  function renderThread(key) {
    const report = reports[key];
    $("#threadMessages").innerHTML = `
      <article class="thread-message user">
        <div class="thread-avatar">我</div>
        <div class="thread-bubble">${report.question}</div>
      </article>
      <article class="thread-message">
        <div class="thread-avatar">AI</div>
        <div class="thread-bubble">
          <div class="answer-tags"><span>深度研究结果</span><span>${report.type}</span></div>
          <h3>${report.title}</h3>
          <p>${report.answer}</p>
          <p>右侧为对应历史报告预览。报告与追问保持在同一工作区，无需离开当前会话。</p>
        </div>
      </article>`;
  }

  function openConversation(key) {
    const report = reports[key];
    if (!report) return;
    activeReport = key;
    renderHistory();
    $("#agentHome").hidden = true;
    $("#conversationWorkspace").hidden = false;
    $("#previewTitle").textContent = `${report.title} · 报告预览`;
    $("#previewMeta").textContent = `${report.type} · 2026-06-06`;
    $("#reportPreview").src = report.url;
    $("#downloadReport").href = report.url;
    $("#fullscreenReport").href = report.url;
    renderThread(key);
  }

  function showHome(mode = "chat") {
    $("#agentHome").hidden = false;
    $("#conversationWorkspace").hidden = true;
    setMode(mode);
  }

  function setMode(mode) {
    $$(".mode-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.mode === mode));
    $("#chatModeContent").hidden = mode !== "chat";
    $("#researchModeContent").hidden = mode !== "research";
  }

  function fieldMarkup(field) {
    const [label, type, options] = field;
    if (type === "text") return `<label class="config-field"><span>${label}</span><input placeholder="${options}"></label>`;
    if (type === "select") return `<label class="config-field"><span>${label}</span><select>${options.map(option => `<option>${option}</option>`).join("")}</select></label>`;
    return `<fieldset class="config-field"><legend>${label}</legend><div class="config-options">${options.map((option, index) => `<label><input type="checkbox" ${index === 0 ? "checked" : ""}><span>${option}</span></label>`).join("")}</div></fieldset>`;
  }

  function openConfig(key) {
    activeTemplate = key;
    const template = templates[key];
    $("#configTitle").textContent = template.title;
    $("#configDescription").textContent = template.description;
    $("#configForm").innerHTML = template.fields.map(fieldMarkup).join("");
    $("#generateStatus").hidden = true;
    $("#configPanel").classList.add("open");
    $("#configPanel").setAttribute("aria-hidden", "false");
    $("#configMask").hidden = false;
  }

  function closeConfig() {
    $("#configPanel").classList.remove("open");
    $("#configPanel").setAttribute("aria-hidden", "true");
    $("#configMask").hidden = true;
  }

  renderHistory();
  $$(".mode-tab").forEach(tab => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
  $$("[data-template]").forEach(button => button.addEventListener("click", () => openConfig(button.dataset.template)));
  $$(".command-card").forEach(card => card.addEventListener("click", () => {
    $("#questionInput").value = card.dataset.question;
    $("#questionInput").focus();
  }));
  $("#sendQuestion").addEventListener("click", () => {
    const question = $("#questionInput").value.trim();
    if (!question) return;
    openConversation(embedContext === "service" ? "complaint" : "delivery");
    const user = document.createElement("article");
    user.className = "thread-message user";
    user.innerHTML = `<div class="thread-avatar">我</div><div class="thread-bubble">${question.replace(/[<>&]/g, "")}</div>`;
    $("#threadMessages").prepend(user);
  });
  $("#newConversation").addEventListener("click", () => {
    $("#questionInput").value = "";
    showHome("chat");
  });
  $("#collapseConversation").addEventListener("click", () => $(".agent-shell").classList.toggle("collapsed"));
  $("#followupForm").addEventListener("submit", event => {
    event.preventDefault();
    const value = $("#followupInput").value.trim();
    if (!value) return;
    $("#threadMessages").insertAdjacentHTML("beforeend", `
      <article class="thread-message user"><div class="thread-avatar">我</div><div class="thread-bubble">${value.replace(/[<>&]/g, "")}</div></article>
      <article class="thread-message"><div class="thread-avatar">AI</div><div class="thread-bubble"><div class="answer-tags"><span>继续追问</span></div><p>已基于当前报告继续限定分析范围。右侧报告预览保持不变，后续生成时会把本轮追问纳入报告上下文。</p></div></article>`);
    $("#followupInput").value = "";
    $("#threadMessages").scrollTop = $("#threadMessages").scrollHeight;
  });
  $("#closeConfig").addEventListener("click", closeConfig);
  $("#cancelConfig").addEventListener("click", closeConfig);
  $("#configMask").addEventListener("click", closeConfig);
  $("#generateReport").addEventListener("click", () => {
    $("#generateStatus").hidden = false;
    $("#generateStatus").innerHTML = "正在读取参数并生成分析框架…";
    setTimeout(() => {
      $("#generateStatus").innerHTML = "报告已生成，正在打开三段式会话工作区。";
      setTimeout(() => { closeConfig(); openConversation(activeTemplate); }, 450);
    }, 650);
  });
})();
