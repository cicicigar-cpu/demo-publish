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


  // ═══════════════════════════════════════════════════════════
  // 报告分层内容（摘要 / 详情 / 全文）
  // 对齐领导意见：报告更成熟，看板应与报告逻辑统一
  // ═══════════════════════════════════════════════════════════
  const reportLayers = {
    delivery: {
      summary: [
        { icon: "\u{1F534}", text: "品牌风险指数 82.3，处于中高风险区间，需关注食安与物料缺失两大红线" },
        { icon: "\u{1F4E6}", text: "缺物料（吸管/餐具/纸巾）占比最高达 12.8%，Priority Score 34.2，强可控" },
        { icon: "\u26A0\uFE0F", text: "食安红线问题（异物/变质）虽体量低但风险系数 2.0，需独立核查" },
        { icon: "\u{1F4CD}", text: "华南区域风险集中度最高，广东/河南/江苏为高发区域" },
        { icon: "\u{1F504}", text: "备注未执行 100% 负向率，建议纳入班次复核 SOP" },
      ],
      detail: [
        { section: "问题结构", content: "外卖评价 Top5 问题依次为：缺吸管(512)、备注未执行(704)、份量少(478)、漏送商品(375)、服务态度差(285)。产品体验占38.8%、包装打包占19.1%、订单履约占19.1%、服务售后占9.3%、配送履约占5.4%、食安卫生占3.2%。" },
        { section: "风险热点", content: "高风险(系数\u22651.8)：异物/杂质(2.0)、怪味/变质(2.0)、产品状态异常(1.8)；中风险(1.2-1.3)：备注未执行(1.2)、漏送/错送(1.3)；低风险(1.1)：缺吸管/缺餐具/份量少。" },
        { section: "区域风险", content: "华南区域：包装与食安风险偏高，广东为最高风险省份；华东区域：份量少与产品状态异常集中；华中区域：备注未执行高发。高风险门店86家，食安风险门店23家。" },
        { section: "治理建议", content: "1. 缺物料\u2192纳入打包复核SOP，预计影响512+条/月；2. 备注未执行\u2192设置备注复核与异常工单，预计影响704条/月；3. 食安红线\u2192进入独立核查流程，涉及87家门店。" },
      ],
    },
    mint: {
      summary: [
        { icon: "\u{1F7E2}", text: "薄荷新品整体情感正面率 62.3%，口碑表现优于同期新品均值" },
        { icon: "\u{1F4CA}", text: "声量峰值出现在首发日与第二周周末，小红书为主要传播平台" },
        { icon: "\u{1F4AC}", text: "核心正面关键词：清凉、爽口、性价比；核心负面关键词：太甜、化得快" },
        { icon: "\u26A0\uFE0F", text: "约 18% 反馈提到甜度偏高，建议提供减糖选项" },
      ],
      detail: [
        { section: "声量与情感", content: "首发7天声量2.4万，正面率62.3%，中性24.1%，负面13.6%。小红书占声量52%，抖音28%，微博12%，B站5%。" },
        { section: "口味反馈", content: "正面：清凉感(38%)、性价比(25%)、颜值(18%)；负面：甜度偏高(42%)、化得快(28%)、份量少(16%)。" },
        { section: "渠道差异", content: "小红书以图文种草为主，正面率68%；抖音短视频测评为主，正面率55%，评论区争议较多。" },
        { section: "建议", content: "1. 推出减糖版本扩大受众；2. 优化外卖包装减少融化投诉；3. 加大小红书KOC投放巩固口碑优势。" },
      ],
    },
    complaint: {
      summary: [
        { icon: "\u{1F534}", text: "客诉总量环比上升 12.7%，热线与在线客服为最大来源渠道" },
        { icon: "\u{1F6A8}", text: "食安类客诉外溢风险指数 78.6，微博/小红书出现3起扩散案例" },
        { icon: "\u{1F4DE}", text: "商家未回复率 34.2%，低于行业均值，需重点提升1-2星评论回复率" },
        { icon: "\u{1F4CB}", text: "退款困难/补偿不满投诉集中度上升，与外卖评价中'推诿/不解决'标签高度关联" },
      ],
      detail: [
        { section: "客诉结构", content: "热线占38%，在线客服32%，外卖评价22%，社媒8%。产品体验类占34%，服务售后类28%，食安类18%，配送履约类12%，其他8%。" },
        { section: "外溢风险", content: "食安类外溢风险最高(78.6)，3起案例在微博获得500+转发；服务态度类外溢风险中等(45.2)，主要在美团评论区。" },
        { section: "闭环分析", content: "商家回复率65.8%，1-2星评论回复率仅41.3%。退款类平均处理时长3.2天，推诿/不解决标签关联投诉285条。" },
        { section: "建议", content: "1. 提升低分评论回复率至80%+；2. 建立食安客诉2小时响应机制；3. 退款流程标准化，减少推诿环节。" },
      ],
    },
  };

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
        ["情感", "multi", ["全部情感", "正面", "中性", "负面", "愤怒"]],
        ["时间", "select", ["昨日", "近 7 天", "近 30 天", "本月", "自定义"]],
        ["问题主体", "select", ["全部主体", "门店", "产品", "配送", "平台", "用户", "不明确"]],
      ],
    },
    complaint: {
      title: "客诉分析报告",
      description: "融合内部客诉与公开社媒数据，生成问题发现、风险归因和外溢监测报告。",
      fields: [
        ["时间周期", "select", ["昨日", "近 7 天", "近 30 天", "本月", "自定义"]],
        ["情感", "multi", ["全部情感", "正面", "中性", "负面", "愤怒"]],
        ["平台", "multi", ["全部来源", "热线", "在线客服", "外卖评价", "微博", "小红书", "抖音", "B站", "快手"]],
        ["区域", "select", ["全国", "河南", "广东", "山东", "江苏", "浙江", "四川", "湖北"]],
        ["问题维度", "multi", ["全部问题", "产品体验", "食安卫生", "服务售后", "配送履约", "包装打包", "订单履约", "品牌声誉"]],
      ],
    },
  };

  let activeReport = embedContext === "service" ? "complaint" : "delivery";
  let activeTemplate = activeReport;
  let lastFilters = {};           // ═ 记住看板传来的筛选条件
  const STORAGE_KEY = "ai_insights_history";

  function saveConversation(key) {
    const report = reports[key];
    if (!report) return;
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    // 如果已存在同 key 的记录，更新时间；否则插入到头部
    const idx = history.findIndex(h => h.key === key);
    const entry = {
      id: Date.now(),
      key: key,
      title: report.historyTitle || report.title || key,
      timestamp: new Date().toISOString(),
    };
    if (idx >= 0) {
      history[idx] = { ...history[idx], ...entry, id: history[idx].id };
    } else {
      history.unshift(entry);
    }
    // 只保留最近 50 条
    if (history.length > 50) history.length = 50;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function renderHistory() {
    const localHistory = loadHistory();
    const hardcodedHTML = Object.entries(reports).map(([key, report]) => `
      <button class="history-record ${key === activeReport ? "active" : ""}" data-report="${key}">
        <strong>${report.historyTitle}</strong>
        <div class="history-row"><span class="history-type">深度研究</span><span class="history-status">已完成</span><time>2026-06-06 16:11</time></div>
      </button>
    `).join("");
    const localHTML = localHistory.map(item => `
      <button class="history-record" data-id="${item.id}">
        <strong>${item.title}</strong>
        <div class="history-row"><span class="history-status">已完成</span><time>${item.timestamp.slice(0, 16).replace("T", " ")}</time></div>
      </button>
    `).join("");
    $("#historyList").innerHTML = hardcodedHTML + localHTML;
    $$("[data-report]").forEach(item => item.addEventListener("click", () => openConversation(item.dataset.report)));
    $$("[data-id]").forEach(item => item.addEventListener("click", () => {
      const entry = localHistory.find(h => String(h.id) === item.dataset.id);
      if (entry) openConversation(entry.key);
    }));
  }

  function renderThread(key, layer = "summary") {
    const report = reports[key];
    const layers = reportLayers[key] || {};
    const summaryItems = (layers.summary || []).map(item =>
      `<div class="layer-summary-item"><span class="layer-icon">${item.icon}</span><span>${item.text}</span></div>`
    ).join("");
    const detailItems = (layers.detail || []).map(item =>
      `<div class="layer-detail-section"><strong>${item.section}</strong><p>${item.content}</p></div>`
    ).join("");

    const layerContent = {
      summary: `<div class="layer-summary">${summaryItems}</div>`,
      detail: `<div class="layer-detail">${detailItems}</div>`,
      full: `<p class="layer-full-hint">完整报告已加载至右侧预览面板，可下载或全屏查看。</p>`,
    };

    const activeLayer = layer || "summary";

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
          ${Object.keys(lastFilters).length > 0 ? `<p class="filter-mention">已基于当前筛选条件生成报告，本次口径为：${Object.entries(lastFilters).map(([k,v]) => `${k}：${Array.isArray(v)?v.join('、'):v}`).join(' / ')}。</p>` : ''}
          <div class="layer-tabs" data-report-key="${key}">
            <button class="layer-tab ${activeLayer === "summary" ? "active" : ""}" data-layer="summary">摘要洞察</button>
            <button class="layer-tab ${activeLayer === "detail" ? "active" : ""}" data-layer="detail">详细分析</button>
            <button class="layer-tab ${activeLayer === "full" ? "active" : ""}" data-layer="full">完整报告</button>
          </div>
          <div class="layer-content">${layerContent[activeLayer] || layerContent.summary}</div>
        </div>
      </article>`;

    // Bind layer tab clicks
    $$("[data-layer]").forEach(btn => btn.addEventListener("click", () => {
      const newLayer = btn.dataset.layer;
      renderThread(key, newLayer);
      // If switching to full report, ensure preview is loaded
      if (newLayer === "full") {
        const reportObj = reports[key];
        if (reportObj) {
          $("#reportPreview").src = reportObj.url;
        }
      }
    }));
  }

  function openConversation(key) {
    const report = reports[key];
    if (!report) return;
    activeReport = key;
    saveConversation(key);
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

  window.addEventListener("message", (event) => {
    if (event.data && event.data.action === "openTemplate") {
      const key = event.data.template;
      if (key && templates[key]) {
        openConfig(key);
        const filters = event.data.filters || {};
        lastFilters = filters;
        if (Object.keys(filters).length > 0) {
          setTimeout(() => {
            preFillConfig(key, filters);
            // 在配置面板展示当前筛选条件
            const filterStr = Object.entries(filters).map(([k,v]) => `${k}：${Array.isArray(v)?v.join('、'):v}`).join('　');
            const filterDiv = document.getElementById('currentFilters');
            if (filterDiv) {
              filterDiv.innerHTML = `<span class="filter-dot"></span>当前来自看板：${filterStr}`;
              filterDiv.classList.add('show');
            }
            // 预填完成后自动生成报告
            setTimeout(() => {
              const genBtn = $("#generateReport");
              if (genBtn) {
                genBtn.click();
              }
            }, 300);
          }, 0);
        } else {
          // 无筛选参数时也自动生成
          setTimeout(() => {
            const genBtn = $("#generateReport");
            if (genBtn) genBtn.click();
          }, 300);
        }
      }
    }
  });

  function preFillConfig(key, filters) {
    const template = templates[key];
    if (!template) return;
    const form = $("#configForm");
    if (!form) return;
    template.fields.forEach((field) => {
      const [label, type] = field;
      const value = filters[label];
      if (!value) return;
      if (type === "select") {
        const fieldLabels = form.querySelectorAll(".config-field");
        for (const fl of fieldLabels) {
          const span = fl.querySelector("span");
          if (span && span.textContent.trim() === label) {
            const select = fl.querySelector("select");
            if (select) select.value = value;
            break;
          }
        }
      } else if (type === "multi") {
        const fieldsets = form.querySelectorAll(".config-options");
        for (const fs of fieldsets) {
          const legend = fs.querySelector("legend");
          if (legend && legend.textContent.trim() === label) {
            const checkboxes = fs.querySelectorAll("input[type='checkbox']");
            checkboxes.forEach(cb => cb.checked = false);
            const values = Array.isArray(value) ? value : [value];
            const labels = fs.querySelectorAll("label");
            labels.forEach(lbl => {
              const span = lbl.querySelector("span");
              if (span && values.includes(span.textContent.trim())) {
                const cb = lbl.querySelector("input[type='checkbox']");
                if (cb) cb.checked = true;
              }
            });
            break;
          }
        }
      } else if (type === "text") {
        const fieldLabels = form.querySelectorAll(".config-field");
        for (const fl of fieldLabels) {
          const span = fl.querySelector("span");
          if (span && span.textContent.trim() === label) {
            const input = fl.querySelector("input");
            if (input) input.value = value;
            break;
          }
        }
      }
    });
  }

  renderHistory();
  $$(".mode-tab").forEach(tab => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
  $$("[data-template]").forEach(button => button.addEventListener("click", () => openConfig(button.dataset.template)));
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
      <article class="thread-message"><div class="thread-avatar">AI</div><div class="thread-bubble"><div class="answer-tags"><span>继续追问</span></div><p>已基于当前报告继续限定分析范围。可点击上方「摘要洞察 / 详细分析 / 完整报告」切换查看层级，右侧预览面板同步展示完整报告。</p></div></article>`);
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
