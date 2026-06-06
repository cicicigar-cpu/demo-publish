(function () {
  const embedContext = new URLSearchParams(window.location.search).get("embed");
  if (embedContext) {
    document.body.classList.add("embedded");
    document.body.dataset.embedContext = embedContext;
  }

  const reports = {
    mint: {
      title: "蜜雪冰城薄荷系列新品口碑分析与 POC 验证报告",
      shortTitle: "新品口碑报告",
      type: "新品口碑",
      scope: "微博 / 小红书 / 抖音新品口碑",
      url: "./reports/mint-product-report.html",
    },
    delivery: {
      title: "蜜雪冰城外卖评论体验诊断 POC 报告",
      shortTitle: "外卖评价分析",
      type: "外卖体验",
      scope: "外卖评价与标签归因数据",
      url: "./reports/delivery-report.html",
    },
    complaint: {
      title: "蜜雪冰城全渠道客诉聚合与专题洞察报告",
      shortTitle: "客诉分析报告",
      type: "全渠道客诉",
      scope: "热线 / 在线客服 / 外卖评价 / 社媒",
      url: "./reports/complaint-report.html",
    },
  };

  const templates = {
    mint: {
      title: "新品口碑报告",
      description: "配置新品监测范围，生成平台声量、情感、关键词与代表性原声分析。",
      fields: [
        ["时间", "select", ["近 7 天", "近 30 天", "本月", "自定义"]],
        ["平台", "multi", ["全部平台", "微博", "小红书", "抖音", "B站", "快手"]],
        ["关键词", "text", "输入新品名、口味或核心关键词"],
      ],
    },
    delivery: {
      title: "外卖评价分析",
      description: "配置外卖评价范围，生成体验趋势、问题结构、区域门店与消费者原声分析。",
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
      description: "融合内部客诉和公开社媒数据，生成问题发现、风险归因与外溢监测报告。",
      fields: [
        ["时间周期", "select", ["昨日", "近 7 天", "近 30 天", "本月", "自定义"]],
        ["情感", "multi", ["全部情感", "强负", "中负", "中性", "正向"]],
        ["平台", "multi", ["全部来源", "热线", "在线客服", "外卖评价", "微博", "小红书", "抖音", "B站", "快手"]],
        ["区域", "select", ["全国", "河南", "广东", "山东", "江苏", "浙江", "四川", "湖北"]],
        ["问题维度", "multi", ["全部问题", "产品体验", "食安卫生", "服务售后", "配送履约", "包装打包", "订单履约", "品牌声誉"]],
      ],
    },
  };

  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  let activeTemplate = "mint";

  if (embedContext === "delivery") {
    document.title = "外卖评价看板 AI 洞察";
    document.querySelector(".data-scope").textContent = "数据范围：外卖评价 / 标签 / 区域 / 门店";
  }
  if (embedContext === "service") {
    document.title = "客诉看板 AI 洞察";
    document.querySelector(".data-scope").textContent = "数据范围：热线 / 在线客服 / 外卖评价 / 社媒";
  }

  function showWorkspace(view) {
    $("#workspaceView").hidden = false;
    $("#reportView").hidden = true;
    $$(".ai-nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === view));
    const research = view === "research";
    $("#chatPanel").hidden = research;
    $("#researchPanel").hidden = !research;
    $("#workspaceTitle").textContent = research ? "深度研究" : "即时问答";
    $("#workspaceSubtitle").textContent = research
      ? "仅保留框架式分析，按固定步骤完成数据研究与报告组织。"
      : "围绕外卖评价、客诉与新品口碑数据快速提问。";
  }

  function openReport(key) {
    const report = reports[key];
    if (!report) return;
    $("#workspaceView").hidden = true;
    $("#reportView").hidden = false;
    $("#reportFrame").src = report.url;
    $("#reportTitle").textContent = report.title;
    $("#reportMeta").textContent = `${report.type} · 历史报告`;
    $("#reportInspectorTitle").textContent = report.shortTitle;
    $("#reportType").textContent = report.type;
    $("#reportScope").textContent = report.scope;
    $("#openReport").href = report.url;
    $$(".history-item, .report-rail button").forEach(item => item.classList.toggle("active", item.dataset.report === key));
  }

  function fieldMarkup(field) {
    const [label, type, options] = field;
    if (type === "text") {
      return `<label class="field"><span>${label}</span><input name="${label}" placeholder="${options}"></label>`;
    }
    if (type === "select") {
      return `<label class="field"><span>${label}</span><select name="${label}">${options.map(option => `<option>${option}</option>`).join("")}</select></label>`;
    }
    return `<fieldset class="field"><legend>${label}</legend><div class="option-grid">${options.map((option, index) => `
      <label><input type="checkbox" name="${label}" value="${option}" ${index === 0 ? "checked" : ""}><span>${option}</span></label>
    `).join("")}</div></fieldset>`;
  }

  function openConfig(key) {
    const template = templates[key];
    if (!template) return;
    activeTemplate = key;
    $("#configTitle").textContent = template.title;
    $("#configDescription").textContent = template.description;
    $("#configForm").innerHTML = template.fields.map(fieldMarkup).join("");
    $("#generationStatus").hidden = true;
    $("#configDrawer").classList.add("open");
    $("#configDrawer").setAttribute("aria-hidden", "false");
    $("#drawerMask").hidden = false;
  }

  function closeConfig() {
    $("#configDrawer").classList.remove("open");
    $("#configDrawer").setAttribute("aria-hidden", "true");
    $("#drawerMask").hidden = true;
  }

  $$(".ai-nav-item").forEach(item => item.addEventListener("click", () => showWorkspace(item.dataset.view)));
  $$("[data-report]").forEach(item => item.addEventListener("click", () => openReport(item.dataset.report)));
  $$("[data-template]").forEach(item => item.addEventListener("click", () => openConfig(item.dataset.template)));
  $("#closeReport").addEventListener("click", () => showWorkspace("chat"));
  $("#closeDrawer").addEventListener("click", closeConfig);
  $("#cancelConfig").addEventListener("click", closeConfig);
  $("#drawerMask").addEventListener("click", closeConfig);
  $("#regenerateReport").addEventListener("click", () => {
    const active = $(".report-rail button.active");
    openConfig(active?.dataset.report || "mint");
  });

  $$(".prompt-suggestions button").forEach(button => button.addEventListener("click", () => {
    $("#chatInput").value = button.textContent;
    $("#chatInput").focus();
  }));

  $("#chatForm").addEventListener("submit", event => {
    event.preventDefault();
    const input = $("#chatInput");
    const value = input.value.trim();
    if (!value) return;
    $("#chatMessages").innerHTML += `<div class="message user">${value}</div><div class="message assistant"><strong>AI 洞察</strong><p>已基于当前 VOC 数据识别问题范围。你可以继续指定时间、平台、区域或问题维度，我会进一步拆解趋势与证据。</p></div>`;
    input.value = "";
  });

  $("#generateReport").addEventListener("click", () => {
    const status = $("#generationStatus");
    status.hidden = false;
    status.innerHTML = "<strong>正在生成报告框架</strong><span>读取参数 → 聚合数据 → 生成图表与结论</span>";
    setTimeout(() => {
      status.innerHTML = `<strong>报告已生成</strong><span>已使用“${templates[activeTemplate].title}”模板生成预览。</span><button type="button" id="viewGenerated">查看报告</button>`;
      $("#viewGenerated").addEventListener("click", () => {
        closeConfig();
        openReport(activeTemplate);
      });
    }, 700);
  });
})();
