(function () {
  const data = window.MX_DASHBOARD_DATA || {};
  const colors = ["#2787f5", "#f05b68", "#20b7b3", "#f5a623", "#7569df", "#45b36b", "#8ea0bd"];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function fmt(value) {
    const number = Number(value || 0);
    if (Math.abs(number) >= 100000000) return `${(number / 100000000).toFixed(1)}亿`;
    if (Math.abs(number) >= 10000) return `${(number / 10000).toFixed(1)}万`;
    return number.toLocaleString("zh-CN");
  }

  function percent(value) {
    return `${Number(value || 0).toFixed(1)}%`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function normalizeEmotion(emotion) {
    const positive = ["满意", "愉悦", "期待", "好奇", "惊喜", "信任", "兴奋"];
    const neutral  = ["理性", "观望", "困惑", "怀旧", "被动接受"];
    const negative = ["不满", "厌恶", "失望", "怀疑", "无助", "烦躁", "后悔"];
    const angry    = ["愤怒"];
    if (angry.includes(emotion)) return "愤怒";
    if (positive.includes(emotion)) return "正面";
    if (neutral.includes(emotion)) return "中性";
    if (negative.includes(emotion)) return "负面";
    return "负面";
  }

  function badgeClass(emotion) {
    const category = normalizeEmotion(emotion);
    if (category === "愤怒") return "red";
    if (category === "正面") return "green";
    if (category === "中性") return "amber";
    return "red";
  }

  function kpis(items) {
    return `<div class="kpi-grid">${items.map(item => `
      <div class="kpi">
        <div class="kpi-label">${escapeHtml(item.label)}</div>
        <div class="kpi-value">${escapeHtml(item.value)}</div>
        <div class="kpi-note">${escapeHtml(item.note || "")}</div>
      </div>
    `).join("")}</div>`;
  }

  function card(title, body, tools = "") {
    return `<section class="card">
      <div class="card-header">
        <div class="card-title"><span class="mini-mark"></span>${escapeHtml(title)}</div>
        ${tools}
      </div>
      ${body}
    </section>`;
  }

  function insightList(items) {
    return `<div class="insights">${items.map(item => `<div class="insight">${escapeHtml(item)}</div>`).join("")}</div>`;
  }

  function progressList(items, options = {}) {
    const max = Math.max(...items.map(item => Number(item.value || 0)), 1);
    const color = options.color || colors[0];
    return `<div>${items.map(item => `
      <div class="progress-row">
        <div title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(2, Number(item.value || 0) / max * 100)}%;background:${color}"></div></div>
        <strong>${fmt(item.value)}</strong>
      </div>
    `).join("")}</div>`;
  }

  function table(headers, rows) {
    return `<table class="table">
      <thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>`;
  }

  function examples(items, type = "delivery") {
    return `<div class="quote-list">${items.map(item => {
      const emotion = item.emotion || "理性";
      const meta = type === "delivery"
        ? [item.time, item.city, item.channel, `评分 ${item.score || "-"}`]
        : [item.source || item.platform, item.group || item.time, item.duration ? `${item.duration}s` : (item.interaction ? `互动 ${fmt(item.interaction)}` : "")];
      return `<div class="quote-item">
        <div class="quote-meta">
          ${meta.filter(Boolean).map(m => `<span>${escapeHtml(m)}</span>`).join("")}
          <span class="badge ${badgeClass(emotion)}">${escapeHtml(emotion)}</span>
          ${item.tag ? `<span class="badge">${escapeHtml(item.tag)}</span>` : ""}
        </div>
        <div class="quote-text">${escapeHtml(item.quote)}</div>
      </div>`;
    }).join("")}</div>`;
  }

  function svgLine(id, series, labels, height = 280) {
    const width = 760;
    const pad = { l: 48, r: 20, t: 24, b: 46 };
    const max = Math.max(...series.flatMap(s => s.values), 1);
    const step = labels.length > 1 ? (width - pad.l - pad.r) / (labels.length - 1) : 0;
    const y = value => pad.t + (height - pad.t - pad.b) * (1 - value / max);
    const x = idx => pad.l + idx * step;
    const grid = [0, .25, .5, .75, 1].map(r => {
      const gy = pad.t + (height - pad.t - pad.b) * r;
      return `<line x1="${pad.l}" y1="${gy}" x2="${width - pad.r}" y2="${gy}" stroke="#eef2f8"/><text x="10" y="${gy + 4}" fill="#8b95aa" font-size="12">${fmt(max * (1 - r))}</text>`;
    }).join("");
    const lines = series.map((s, si) => {
      const points = s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
      const dots = s.values.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="${s.color || colors[si]}"/>`).join("");
      return `<polyline fill="none" stroke="${s.color || colors[si]}" stroke-width="3" points="${points}"/>${dots}`;
    }).join("");
    const labelStep = Math.max(1, Math.ceil(labels.length / 8));
    const axisLabels = labels.map((label, i) => i % labelStep === 0 ? `<text x="${x(i)}" y="${height - 14}" text-anchor="middle" fill="#6f7890" font-size="12">${escapeHtml(label.slice(5) || label)}</text>` : "").join("");
    const legend = series.map((s, i) => `<span style="color:${s.color || colors[i]}">■</span> ${escapeHtml(s.name)}`).join("　");
    return `<div class="chart" id="${id}">
      <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" role="img">
        ${grid}
        <line x1="${pad.l}" y1="${height - pad.b}" x2="${width - pad.r}" y2="${height - pad.b}" stroke="#d9e0eb"/>
        ${lines}
        ${axisLabels}
      </svg>
      <div style="text-align:center;color:#6f7890;font-size:13px">${legend}</div>
    </div>`;
  }

  let currentDeliveryData = null;
  let deliveryEventsBound = false;
  let deliveryFiltersBound = false;
  let issuePath = [];
  const issueSelections = {
    1: new Set(),
    2: new Set(),
    3: new Set(),
  };
  let selectedStoreIndex = 0;

  const issueTree = {
    name: "全部问题",
    value: 7289,
    negativeRate: 94.1,
    strongRate: 20.7,
    change: "+3.2pct",
    children: [
      {
        name: "产品体验", value: 2826, negativeRate: 98.4, strongRate: 21.8, subject: "产品 / 门店制作", nature: "高体量，需拆分口味、份量与状态问题",
        children: [
          { name: "产品内容", value: 796, negativeRate: 98.7, strongRate: 22.1, children: [
            { name: "份量少", value: 478, label: true },
            { name: "小料少/漏小料", value: 200, label: true },
            { name: "产品货不对板", value: 118, label: true },
          ] },
          { name: "口味偏好/规格体验", value: 805, negativeRate: 99.0, strongRate: 19.4, children: [
            { name: "口味不合预期/难喝", value: 387, label: true },
            { name: "口味偏淡/水感重", value: 323, label: true },
            { name: "甜度偏高/太甜", value: 162, label: true },
          ] },
          { name: "产品状态异常", value: 403, negativeRate: 99.3, strongRate: 24.6, children: [
            { name: "产品状态异常", value: 230, label: true },
            { name: "到手不冰/温度异常", value: 173, label: true },
          ] },
        ],
      },
      {
        name: "包装打包", value: 1394, negativeRate: 98.9, strongRate: 22.4, subject: "门店 / 打包环节", nature: "高频、低复杂度、强可控",
        children: [
          { name: "物料缺失", value: 933, negativeRate: 98.6, strongRate: 21.4, children: [
            { name: "缺吸管", value: 512, label: true },
            { name: "缺餐具", value: 241, label: true },
            { name: "缺纸巾", value: 116, label: true },
            { name: "缺袋子", value: 42, label: true },
            { name: "缺勺子", value: 22, label: true },
          ] },
          { name: "洒漏问题", value: 218, negativeRate: 94.8, strongRate: 19.7, children: [
            { name: "洒漏", value: 218, label: true },
          ] },
          { name: "包装破损", value: 126, negativeRate: 92.3, strongRate: 15.2, children: [
            { name: "包装破损/杯盖变形", value: 126, label: true },
          ] },
          { name: "打包不规范", value: 74, negativeRate: 91.5, strongRate: 14.1, children: [
            { name: "冷热分装问题", value: 39, label: true },
            { name: "打包遗漏/未复核", value: 35, label: true },
          ] },
          { name: "封口问题", value: 43, negativeRate: 89.8, strongRate: 12.6, children: [
            { name: "封口不规范", value: 43, label: true },
          ] },
        ],
      },
      {
        name: "订单履约", value: 1392, negativeRate: 99.2, strongRate: 25.0, subject: "门店 / 订单执行", nature: "强负向较高，适合进入班次复核",
        children: [
          { name: "备注/定制执行", value: 705, negativeRate: 100, strongRate: 25.6, children: [
            { name: "备注未执行/定制做错", value: 704, label: true },
          ] },
          { name: "商品错漏", value: 603, negativeRate: 99.4, strongRate: 24.0, children: [
            { name: "漏送商品/少送", value: 375, label: true },
            { name: "错送商品/做错口味", value: 228, label: true },
          ] },
          { name: "退款补偿", value: 84, negativeRate: 100, strongRate: 31.8, children: [
            { name: "退款困难/补偿不满", value: 84, label: true },
          ] },
        ],
      },
      {
        name: "服务售后", value: 675, negativeRate: 99.0, strongRate: 28.9, subject: "门店 / 售后响应", nature: "情绪伤害高，需结合商家回复率看闭环",
        children: [
          { name: "服务态度", value: 285, negativeRate: 99.6, strongRate: 31.0, children: [
            { name: "服务态度差", value: 285, label: true },
          ] },
          { name: "商家响应", value: 253, negativeRate: 100, strongRate: 28.4, children: [
            { name: "商家未回复", value: 253, label: true },
          ] },
          { name: "售后处理", value: 137, negativeRate: 98.2, strongRate: 24.1, children: [
            { name: "推诿/不解决", value: 137, label: true },
          ] },
        ],
      },
      {
        name: "配送履约", value: 392, negativeRate: 98.6, strongRate: 19.5, subject: "配送 / 平台", nature: "需区分骑手履约与门店出餐前置问题",
        children: [
          { name: "配送时效", value: 146, negativeRate: 99.3, strongRate: 21.7, children: [
            { name: "配送慢/等太久", value: 146, label: true },
          ] },
          { name: "送达状态", value: 132, negativeRate: 98.1, strongRate: 19.0, children: [
            { name: "送达异常/未收到", value: 132, label: true },
          ] },
          { name: "配送态度", value: 114, negativeRate: 97.8, strongRate: 17.5, children: [
            { name: "配送服务问题", value: 114, label: true },
          ] },
        ],
      },
      {
        name: "食安卫生", value: 232, negativeRate: 99.1, strongRate: 34.0, subject: "门店 / 食安链路", nature: "低频高伤害，需独立风险核查",
        children: [
          { name: "异物杂质", value: 94, negativeRate: 100, strongRate: 36.8, children: [
            { name: "异物/杂质", value: 94, label: true },
          ] },
          { name: "怪味变质", value: 83, negativeRate: 98.8, strongRate: 34.2, children: [
            { name: "怪味/变质", value: 83, label: true },
          ] },
          { name: "饮后不适", value: 55, negativeRate: 98.2, strongRate: 29.7, children: [
            { name: "饮后不适/肠胃不适", value: 55, label: true },
          ] },
        ],
      },
    ],
  };

  const labelProfiles = {
    "缺吸管": {
      value: 512, negativeRate: 98.9, strongRate: 23.6, stores: 219, platform: "美团 / 饿了么", region: "广东 / 河南 / 江苏", subject: "门店打包", nature: "高频、低复杂度、强可控", action: "纳入打包复核 SOP",
      words: ["吸管", "没有", "没给", "喝不了", "漏放", "餐具", "纸巾", "备注", "无语"],
      quotes: ["点了三杯奶茶，一根吸管都没有，根本喝不了。", "吸管都没给，让我怎么喝。", "外卖送到没有吸管也没有纸巾，备注也没人看。"]
    },
    "缺吸管/缺餐具/缺纸巾": {
      value: 933, negativeRate: 98.6, strongRate: 23.4, stores: 612, platform: "饿了么 / 美团", region: "广东 / 江苏 / 浙江", subject: "门店打包", nature: "高频、低复杂度、强可控", action: "纳入打包复核 SOP",
      words: ["吸管", "没有", "喝不了", "漏放", "餐具", "纸巾", "备注", "无语"],
      quotes: ["点了三杯奶茶，一根吸管都没有，根本喝不了。", "吸管都没给，让我怎么喝。", "不满意，没有吸管。"]
    },
    "备注未执行/定制做错": {
      value: 704, negativeRate: 100, strongRate: 25.6, stores: 489, platform: "饿了么 / 美团", region: "广西 / 江苏 / 广东", subject: "门店制作", nature: "高频、强可控，直接影响复购", action: "设置备注复核与异常工单",
      words: ["少冰", "少糖", "去冰", "不要珍珠", "加料", "备注", "没看", "做错"],
      quotes: ["备注永远不看，两三次了，说了不要珍珠还放。", "下次不去那里买了，都不看备注。", "正常冰都没冰块，备注了都不给。"]
    },
    "份量少": {
      value: 478, negativeRate: 98.5, strongRate: 21.2, stores: 354, platform: "饿了么 / 美团", region: "江苏 / 广东 / 山东", subject: "门店制作", nature: "高频体验落差，需核对出品标准", action: "抽检杯量和小料标准",
      words: ["半杯", "越喝越少", "太少", "小料", "空的", "缩水", "离谱"],
      quotes: ["没见过蜜雪冰城圣代外送给半杯的。", "这体积就一半，搞笑呢。", "好喝，就是为什么越喝越少。"]
    },
    "产品状态异常": {
      value: 230, negativeRate: 100, strongRate: 24.6, stores: 211, platform: "饿了么", region: "四川 / 湖北 / 江苏", subject: "产品 / 配送交接", nature: "影响即饮体验，需区分制作与配送时长", action: "监测冰品出餐与配送时长",
      words: ["融化", "不冰", "状态", "变形", "冰淇淋", "干巴巴", "货不对板"],
      quotes: ["买的是冰淇淋，可是里面哪里有冰淇淋。", "圣代送过来已经化了。", "到手一点也不冰。"]
    },
    "洒漏": {
      value: 205, negativeRate: 98.5, strongRate: 26.3, stores: 186, platform: "饿了么 / 美团", region: "四川 / 广东 / 浙江", subject: "门店打包", nature: "高伤害可控，和封口、杯盖、配送交接相关", action: "复核封口机与杯盖压合",
      words: ["撒了", "漏了", "封口", "杯盖", "一半", "袋子", "湿了"],
      quotes: ["送过来都撒了，味道还很奇怪。", "收到的奶茶都没密封，一半是开的。", "外卖袋里面全漏了。"]
    },
    "异物/杂质": {
      value: 94, negativeRate: 100, strongRate: 36.8, stores: 87, platform: "美团 / 饿了么", region: "华南 / 华东", subject: "门店 / 食安链路", nature: "低频高伤害，需独立核查", action: "进入食安红线核查",
      words: ["异物", "头发", "虫子", "杂质", "不敢喝", "恶心", "卫生"],
      quotes: ["喝到一半发现里面有异物，不敢再喝。", "杯子里有杂质，卫生真的要查。", "看见疑似头发，体验很差。"]
    },
    "服务态度差": {
      value: 285, negativeRate: 99.6, strongRate: 31.0, stores: 241, platform: "美团 / 饿了么", region: "广西 / 广东 / 河南", subject: "门店服务", nature: "强负向高，容易引发二次投诉", action: "联动商家回复与服务培训",
      words: ["态度", "推卸", "不解决", "电话", "客服", "垃圾", "不承认"],
      quotes: ["垃圾服务态度，我懒得喷了。", "商家不解决问题，做错了也不承认。", "一直在推卸责任。"]
    },
    "商家未回复": {
      value: 253, negativeRate: 100, strongRate: 28.4, stores: 226, platform: "饿了么", region: "江苏 / 湖北 / 广东", subject: "门店售后", nature: "闭环弱，放大负向体验", action: "提升低分评论回复率",
      words: ["不接", "联系不上", "没人管", "不回复", "电话", "解决"],
      quotes: ["遇到问题不及时接客户电话。", "商家不解决问题也不承认。", "联系不上门店。"]
    },
  };

  // ═══════════════════════════════════════════════════════════
  // 风险权重配置表（三级标签 → 风险系数）
  // 依据：领导意见——不同食安问题严重程度不同，应区别对待
  // 用法：riskWeight[labelName] 获取系数，缺失默认为 1.0
  // ═══════════════════════════════════════════════════════════
  const riskWeight = {
    // ── 食安卫生（最高风险 2.0）────────────────────────────
    "异物/杂质":       2.0,
    "怪味/变质":       2.0,
    "饮后不适/肠胃不适": 2.0,
    // ── 产品状态异常（高 1.8）──────────────────────────────
    "产品状态异常":     1.8,
    "到手不冰/温度异常":1.8,
    // ── 订单履约漏发（中高 1.3）──────────────────────────
    "漏送商品/少送":   1.3,
    "错送商品/做错口味":1.3,
    // ── 备注未执行（中 1.2）──────────────────────────────
    "备注未执行/定制做错": 1.2,
    // ── 物料缺失、份量（低 1.1）──────────────────────────
    "缺吸管":           1.1,
    "缺餐具":           1.1,
    "缺纸巾":           1.1,
    "缺袋子":           1.1,
    "缺勺子":           1.1,
    "份量少":           1.1,
    "小料少/漏小料":   1.1,
    // ── 其余标签默认 1.0（在 calcRiskIndex 里处理）────────
  };

  function calcRiskIndex(node) {
    const name = node.name || "";
    const volume = Number(node.value) || 0;
    const weight = riskWeight[name] || 1.0;
    return Math.round(volume * weight * 10) / 10;
  }

  function getRiskWeight(name) {
    return riskWeight[name] || 1.0;
  }

  function findIssueNode(path) {
    return path.reduce((node, name) => (node.children || []).find(child => child.name === name) || node, issueTree);
  }

  function findPathToLabel(name, node = issueTree, path = []) {
    if (name === "缺吸管/缺餐具/缺纸巾") name = "缺吸管";
    if (node.name === name) return path;
    for (const child of node.children || []) {
      const result = findPathToLabel(name, child, path.concat(child.name));
      if (result) return result;
    }
    return null;
  }

  function issueMetric(node, key, fallback) {
    const profile = labelProfiles[node.name] || {};
    return profile[key] ?? node[key] ?? fallback;
  }

  function activatePage(pageId) {
    $$(".tab").forEach(tab => tab.classList.toggle("active", tab.dataset.target === pageId));
    $$(".page").forEach(page => page.classList.toggle("active", page.id === pageId));
  }

  function drillBars(node) {
    const children = (node.children || []).slice().sort((a, b) => Number(b.value || 0) - Number(a.value || 0));
    const max = Math.max(...children.map(item => Number(item.value || 0)), 1);
    return `<div class="drill-chart">${children.map((item, index) => `
      <button class="drill-row" data-issue-action="drill" data-name="${escapeHtml(item.name)}">
        <span class="rank">${index + 1}</span>
        <span class="drill-main">
          <span class="drill-label">${escapeHtml(item.name)}</span>
          <span class="drill-bar"><span style="width:${Math.max(4, Number(item.value || 0) / max * 100)}%;background:${colors[index % colors.length]}"></span></span>
        </span>
        <span class="drill-num">${fmt(item.value)}</span>
        <span class="drill-risk" title="风险指数">${calcRiskIndex(item)}</span>
        <span class="drill-rate">${percent(issueMetric(item, "negativeRate", 98.4))}</span>
        <span class="drill-rate strong">${percent(issueMetric(item, "strongRate", 20.7))}</span>
        <span class="drill-change">${item.change || ["+8.4%", "+5.1%", "+3.6%", "-1.2%"][index % 4]}</span>
      </button>
    `).join("")}</div>`;
  }

  function breadcrumb() {
    const nodes = ["全部问题"].concat(issuePath);
    return `<div class="crumbs">${nodes.map((name, index) => `
      <button data-issue-action="crumb" data-depth="${index}">${escapeHtml(name)}</button>
      ${index < nodes.length - 1 ? `<span>›</span>` : ""}
    `).join("")}</div>`;
  }

  function quickIssues() {
    return ["缺吸管", "备注未执行/定制做错", "份量少", "产品状态异常", "洒漏", "异物/杂质", "服务态度差", "商家未回复"]
      .map(name => {
        const p = labelProfiles[name] || {};
        return `<button class="quick-issue" data-issue-action="quick" data-label="${escapeHtml(name)}">
          <span>${escapeHtml(name)}</span>
          <small>${fmt(p.value)} 条 | ${name === "异物/杂质" ? "高风险" : "高频可控"}</small>
        </button>`;
      }).join("");
  }

  function explanationCard(node) {
    const isLabel = node.label;
    const p = labelProfiles[node.name] || {};
    const childNames = (node.children || []).slice(0, 4).map(child => child.name);
    return `<div class="issue-explain">
      <div class="explain-eyebrow">${isLabel ? "当前标签" : "当前问题"}</div>
      <h3>${escapeHtml(node.name)}</h3>
      <div class="explain-stats">
        <div><span>问题量</span><strong>${fmt(issueMetric(node, "value", 0))}</strong></div>
        <div><span>风险指数</span><strong style="color:#ef4b6c">${calcRiskIndex(node) !== undefined ? calcRiskIndex(node) : "-"}</strong></div>
        <div><span>负向占比</span><strong>${percent(issueMetric(node, "negativeRate", 94.1))}</strong></div>
        <div><span>强负向占比</span><strong>${percent(issueMetric(node, "strongRate", 20.7))}</strong></div>
      </div>
      ${isLabel ? `
        <dl class="explain-list">
          <dt>高发平台</dt><dd>${escapeHtml(p.platform || "饿了么 / 美团")}</dd>
          <dt>高发区域</dt><dd>${escapeHtml(p.region || "华南 / 华东")}</dd>
          <dt>责任主体</dt><dd>${escapeHtml(p.subject || "门店")}</dd>
          <dt>问题性质</dt><dd>${escapeHtml(p.nature || "高频可控")}</dd>
          <dt>建议动作</dt><dd>${escapeHtml(p.action || "进入专项复核")}</dd>
        </dl>` : `
        <dl class="explain-list">
          <dt>主要下级问题</dt><dd>${escapeHtml(childNames.join(" / ") || "已到最细标签")}</dd>
          <dt>责任主体</dt><dd>${escapeHtml(node.subject || "门店 / 平台 / 产品")}</dd>
          <dt>问题判断</dt><dd>${escapeHtml(node.nature || "通过主图继续点击可下钻到标签与证据")}</dd>
        </dl>`}
    </div>`;
  }

  function platformColumns(profile) {
    const rows = [
      { name: "饿了么", value: Math.round(profile.value * 0.48), rate: 98.9 },
      { name: "美团", value: Math.round(profile.value * 0.39), rate: 98.1 },
      { name: "京东到家", value: Math.round(profile.value * 0.05), rate: 96.8 },
      { name: "未知", value: Math.round(profile.value * 0.08), rate: 99.5 },
    ];
    const max = Math.max(...rows.map(item => item.value), 1);
    return `<div class="platform-columns">${rows.map((item, index) => `
      <div class="platform-column">
        <strong>${fmt(item.value)}</strong>
        <div class="platform-column-track">
          <i style="height:${Math.max(8, item.value / max * 100)}%;background:${colors[index % colors.length]}"></i>
        </div>
        <span>${escapeHtml(item.name)}</span>
        <small>负向 ${percent(item.rate)}</small>
      </div>
    `).join("")}</div>`;
  }

  function comparisonCloud(items, tone) {
    const source = (items || []).length ? items : [{ name: "暂无对应证据词", value: 1 }];
    const max = Math.max(...source.map(item => Number(item.value || 0)), 1);
    const palette = tone === "positive"
      ? ["#1687ff", "#20b7b3", "#09a674", "#ecb400", "#0961d6", "#0ea5a0", "#5b4ec9", "#84a82a", "#f5a623", "#2787f5"]
      : ["#ef4b6c", "#e58b21", "#d63a5a", "#f5a623", "#ef4b6c", "#c47618", "#e05a3e", "#ff7a8a", "#b85c5c", "#d9534f"];
    const positions = [
      {x:35,y:45},{x:58,y:28},{x:18,y:62},{x:72,y:55},{x:45,y:75},
      {x:12,y:35},{x:82,y:40},{x:28,y:18},{x:65,y:70},{x:48,y:50},
      {x:85,y:65},{x:15,y:80},{x:55,y:15},{x:38,y:88},{x:75,y:22},
      {x:22,y:48},{x:62,y:82},{x:42,y:32},{x:78,y:78},{x:8,y:55}
    ];
    const rotations = [0,0,0,-90,0,0,0,-90,0,0,0,0,-90,0,0,0,0,0,-90,0];
    return `<div class="wordcloud-canvas ${tone}">${source.slice(0, 20).map((item, index) => {
      const size = 13 + Math.round(Number(item.value || 0) / max * 38);
      const rotate = rotations[index % rotations.length];
      const opacity = Math.max(0.65, 0.95 - index * 0.025);
      const pos = positions[index % positions.length];
      const weight = Math.round(Number(item.value || 0) / max * 700 + 400);
      return `<span title="出现 ${fmt(item.value)} 次" class="word-item" style="left:${pos.x}%;top:${pos.y}%;font-size:${size}px;color:${palette[index % palette.length]};opacity:${opacity.toFixed(2)};font-weight:${weight};${rotate ? `transform:translate(-50%,-50%) rotate(${rotate}deg)` : `transform:translate(-50%,-50%)`}">${escapeHtml(item.name)}</span>`;
    }).join("")}</div>`;
  }

  function evidenceKeywordSets(node, d) {
    const evidence = d.keywordEvidence || {};
    const buckets = { positive: new Map(), negative: new Map() };
    const addItems = (target, items) => (items || []).forEach(item => {
      target.set(item.name, (target.get(item.name) || 0) + Number(item.value || 0));
    });
    const candidateNodes = node === issueTree
      ? []
      : node.children?.length && node.name.startsWith("已选 ")
        ? node.children
        : [node];
    const sources = [
      ["byTag", "label"],
      ["byL3", "l3"],
      ["byL2", "l2"],
      ["byL1", "l1"],
    ];
    const addEvidence = found => {
      addItems(buckets.positive, found?.positive);
      addItems(buckets.negative, found?.negative);
    };
    if (!candidateNodes.length) {
      Object.values(evidence.byTag || {}).forEach(addEvidence);
    }
    candidateNodes.forEach(item => {
      for (const [group] of sources) {
        const groupData = evidence[group] || {};
        const matchedKey = Object.keys(groupData).find(key => key === item.name || key.includes(item.name) || item.name.includes(key));
        const found = matchedKey ? groupData[matchedKey] : null;
        if (!found) continue;
        addEvidence(found);
        break;
      }
    });
    const sortMap = map => [...map].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    return { positive: sortMap(buckets.positive), negative: sortMap(buckets.negative) };
  }

  function deliveryPosts(items, titleTag) {
    const names = ["kio", "甜心苦瓜", "奶茶测评君", "今日喝茶", "雪王粉丝", "柠檬茶爱好者", "甜品观察员", "外卖体验官"];
    const avatarColors = ["#ff6b6b","#4ecdc4","#45b7d1","#96ceb4","#feca57","#ff9ff3","#54a0ff","#5f27cd"];
    return `<div class="social-post-list">${items.map((item, index) => {
      const name = names[index % names.length];
      const avatarColor = avatarColors[index % avatarColors.length];
      const like = (2.3 + index * 0.8).toFixed(1);
      const comment = (4 + index * 2);
      const share = (12 + index * 5);
      const view = (120 + index * 85);
      return `<article class="social-post">
        <div class="social-post-head">
          <span class="social-avatar" style="background:${avatarColor}">${name.slice(0,1)}</span>
          <div class="social-post-meta">
            <strong>${escapeHtml(name)}</strong>
            <small>${escapeHtml(item.channel || "外卖平台")} · ${escapeHtml((item.time || "").slice(0, 10))} ${escapeHtml((item.time || "").slice(10, 16))}</small>
          </div>
        </div>
        <p class="social-post-body">${escapeHtml(item.quote)}</p>
        ${index % 3 === 0 ? `<div class="social-media-card"><span class="media-tag">视频封面内容识别</span><div class="media-lines"><span></span><span></span></div></div>` : ""}
        <div class="social-post-foot">
          <span class="stat-like">${like}万</span>
          <span class="stat-comment">${comment},${comment * 2 + 47}</span>
          <span class="stat-share">${share}.${share + 5}万</span>
          <span class="stat-view">${view}.${view + 21}万</span>
          <a class="post-detail-link" href="javascript:void(0)">查看详情</a>
        </div>
      </article>`;
    }).join("")}
    <div class="post-pagination">
      <button class="page-btn">‹</button>
      <button class="page-btn active">1</button>
      <button class="page-btn">2</button>
      <button class="page-btn">3</button>
      <span class="page-ellipsis">…</span>
      <button class="page-btn">1000</button>
      <button class="page-btn">›</button>
      <span class="page-jump">跳至 <input type="text" value="1"> 页</span>
    </div>
    </div>`;
  }

  function evidenceArea(node, d) {
    const p = labelProfiles[node.name] || {
      value: issueMetric(node, "value", d.summary.total),
      negativeRate: issueMetric(node, "negativeRate", d.summary.negativeRate),
      strongRate: issueMetric(node, "strongRate", 20.7),
      stores: 420,
      words: [],
      quotes: [],
    };
    const issueSeries = d.hourly.map((x, i) => Math.max(1, Math.round((Number(x.count) * (0.08 + (i % 5) * 0.012)) * (Number(p.value || 500) / 933))));
    const storeSeries = d.hourly.map((x, i) => Math.max(1, Math.round(issueSeries[i] * (0.52 + (i % 3) * 0.04))));
    const regionRows = (d.regions || []).slice(0, 8).map((item, index) => [
      index + 1,
      `${escapeHtml(item.province)} ${escapeHtml(item.city)}`,
      `<strong>${fmt(item.value)}</strong>`,
      fmt(Math.max(3, Math.round(item.value * 0.38))),
      `<span class="badge red">${percent(Math.min(100, item.negativeRate))}</span>`,
      `<span class="badge ${index < 3 ? "red" : "amber"}">${index < 3 ? "高" : "中"}</span>`,
      ["+18.2%", "+12.7%", "+9.4%", "+5.6%", "-2.1%"][index % 5],
    ]);
    const profileQuotes = (p.quotes || []).map((quote, index) => ({
      time: ["2026-05-01 14:12:36", "2026-05-01 00:00:00", "2026-05-01 21:43:03"][index] || "2026-05-01 15:34:42",
      city: ["广东省 肇庆市", "广东省 中山市", "江苏省 无锡市"][index] || "湖南省 长沙市",
      channel: index % 2 ? "美团" : "饿了么",
      score: 1,
      emotion: index === 1 ? "愤怒" : "不满",
      tag: node.name,
      quote,
    }));
    const matched = (d.examples || []).filter(item => item.tag === node.name).slice(0, 3);
    const quotes = node.label
      ? (profileQuotes.concat(matched).length ? profileQuotes.concat(matched) : (d.examples || [])).slice(0, 5)
      : (d.examples || []).slice(0, 5);
    const evidenceWords = evidenceKeywordSets(node, d);
    const cloud = `<div class="wordcloud-section">
      <div class="wordcloud-card">
        <div class="wordcloud-header"><span class="wordcloud-dot positive"></span>正面词云</div>
        ${comparisonCloud(evidenceWords.positive, "positive")}
      </div>
      <div class="wordcloud-card">
        <div class="wordcloud-header"><span class="wordcloud-dot negative"></span>负面词云</div>
        ${comparisonCloud(evidenceWords.negative, "negative")}
      </div>
    </div>`;

    return `<div class="evidence-grid">
      ${card("当前问题趋势", svgLine("issueEvidenceTrend", [
        { name: "问题量", values: issueSeries, color: colors[1] },
        { name: "涉及门店数", values: storeSeries, color: colors[0] },
      ], d.hourly.map(x => x.hour), 230))}
      ${card("平台分布", platformColumns(p))}
      ${card("区域 / 门店 Top 榜", table(["排名", "区域/门店", "评论量", "问题量", "负向占比", "风险", "环比"], regionRows), `<div class="card-tools"><span class="active">${node.label ? "当前标签" : "当前层级"}</span></div>`)}
      ${card("", cloud)}
      <section class="card evidence-quotes">
        <div class="card-header"><div class="card-title"><span class="mini-mark"></span>口碑原帖</div><div class="card-tools"><span class="active">按时间</span><span>按风险</span></div></div>
        ${deliveryPosts(quotes, node.name)}
      </section>
    </div>`;
  }

  function normalizeIssueSelection() {
    if (issuePath.length) {
      Object.values(issueSelections).forEach(set => set.clear());
      issuePath.forEach((name, index) => issueSelections[index + 1]?.add(name));
      issuePath = [];
    }
    const level1Items = issueTree.children || [];
    const selectedLevel1 = level1Items.filter(item => issueSelections[1].has(item.name));
    const level1Scope = selectedLevel1.length ? selectedLevel1 : level1Items;
    const level2Items = level1Scope.flatMap(item => item.children || []);
    const level2Names = new Set(level2Items.map(item => item.name));
    [...issueSelections[2]].forEach(name => { if (!level2Names.has(name)) issueSelections[2].delete(name); });
    const selectedLevel2 = level2Items.filter(item => issueSelections[2].has(item.name));
    const level2Scope = selectedLevel2.length ? selectedLevel2 : level2Items;
    const level3Items = level2Scope.flatMap(item => item.children || []);
    const level3Names = new Set(level3Items.map(item => item.name));
    [...issueSelections[3]].forEach(name => { if (!level3Names.has(name)) issueSelections[3].delete(name); });
    const selectedLevel3 = level3Items.filter(item => issueSelections[3].has(item.name));
    const focusNodes = selectedLevel3.length
      ? selectedLevel3
      : selectedLevel2.length
        ? selectedLevel2
        : selectedLevel1.length
          ? selectedLevel1
          : [issueTree];
    const node = aggregateIssueNodes(focusNodes);
    return { level1Items, level2Items, level3Items, node };
  }

  function aggregateIssueNodes(nodes) {
    if (nodes.length === 1) return nodes[0];
    const value = nodes.reduce((sum, item) => sum + Number(issueMetric(item, "value", 0)), 0);
    const weighted = key => value
      ? nodes.reduce((sum, item) => sum + Number(issueMetric(item, key, 0)) * Number(issueMetric(item, "value", 0)), 0) / value
      : 0;
    return {
      name: nodes[0] === issueTree ? "全部问题" : `已选 ${nodes.length} 项`,
      value,
      negativeRate: weighted("negativeRate") || 94.1,
      strongRate: weighted("strongRate") || 20.7,
      children: nodes,
      subject: "多责任主体",
      nature: "当前指标与证据由多选维度聚合生成",
    };
  }

  function linkedDimensionChart(items, selectedSet, level) {
    const rows = (items || []).slice().sort((a, b) => Number(b.value || 0) - Number(a.value || 0));
    const max = Math.max(...rows.map(item => Number(item.value || 0)), 1);
    return `<div class="linked-bars">${rows.map((item, index) => `
      <button class="linked-bar ${selectedSet.has(item.name) ? "selected" : ""}" data-linked-level="${level}" data-linked-name="${escapeHtml(item.name)}" aria-pressed="${selectedSet.has(item.name)}">
        <span class="linked-check">${selectedSet.has(item.name) ? "✓" : ""}</span>
        <span class="linked-name">${escapeHtml(item.name)}</span>
        <span class="linked-track"><i style="width:${Math.max(5, Number(item.value || 0) / max * 100)}%"></i></span>
        <strong>${fmt(item.value)}</strong>
        <small>${percent(issueMetric(item, "negativeRate", 98.4))}</small>
      </button>
    `).join("")}</div>`;
  }

  function labelOverview(node) {
    const p = labelProfiles[node.name] || {};
    return `<div class="label-detail">
      <div>
        <div class="detail-kicker">标签名称</div>
        <h2>${escapeHtml(node.name)}</h2>
        <p>${escapeHtml(p.nature || "当前标签已进入证据态，可查看趋势、平台、区域、门店和消费者原声。")}</p>
      </div>
      <div class="detail-metrics">
        <div><span>问题量</span><strong>${fmt(p.value || node.value)}</strong></div>
        <div><span>负向占比</span><strong>${percent(p.negativeRate || 98.6)}</strong></div>
        <div><span>强负向占比</span><strong>${percent(p.strongRate || 20.7)}</strong></div>
        <div><span>涉及门店数</span><strong>${fmt(p.stores || 200)}</strong></div>
        <div><span>高发平台</span><strong>${escapeHtml(p.platform || "饿了么")}</strong></div>
        <div><span>责任主体</span><strong>${escapeHtml(p.subject || "门店")}</strong></div>
      </div>
    </div>`;
  }

  function renderIssueDrill() {
    const d = currentDeliveryData;
    const { level1Items, level2Items, level3Items, node } = normalizeIssueSelection();
    const selectionText = [1, 2, 3].map(level => issueSelections[level].size ? [...issueSelections[level]].join("、") : "全部").join(" / ");
    $("#issues").innerHTML = `
      <div class="dashboard-head">
        <div>
          <div class="page-title"><span class="title-mark"></span>体验问题归因</div>
          <p>一级、二级、三级维度均支持多选与取消；未选择时展示当前范围内的全部下级维度。</p>
        </div>
        <div class="sample-note">当前选择：${escapeHtml(selectionText)}</div>
      </div>
      <div class="linked-dimensions">
        ${card("一级维度", linkedDimensionChart(level1Items, issueSelections[1], 1), `<div class="card-tools"><span>${issueSelections[1].size ? `已选 ${issueSelections[1].size}` : "全部"}</span></div>`)}
        ${card("二级维度", linkedDimensionChart(level2Items, issueSelections[2], 2), `<div class="card-tools"><span>${issueSelections[2].size ? `已选 ${issueSelections[2].size}` : "全部"}</span></div>`)}
        ${card("三级维度", linkedDimensionChart(level3Items, issueSelections[3], 3), `<div class="card-tools"><span>${issueSelections[3].size ? `已选 ${issueSelections[3].size}` : "全部"}</span></div>`)}
      </div>
      <div class="issue-summary-row">
        ${card("当前问题摘要", explanationCard(node))}
        ${card("当前维度指标", labelOverview(node))}
      </div>
      <div class="evidence-wrap">${evidenceArea(node, d)}</div>
    `;
  }

  function bindDeliveryEvents() {
    if (deliveryEventsBound) return;
    deliveryEventsBound = true;
    document.addEventListener("click", event => {
      const actionNode = event.target.closest("[data-issue-action], [data-overview-dim], [data-overview-label], [data-risk-target], [data-store-index], [data-linked-level]");
      if (!actionNode || !currentDeliveryData) return;
      if (actionNode.dataset.linkedLevel) {
        const level = Number(actionNode.dataset.linkedLevel);
        const name = actionNode.dataset.linkedName;
        const set = issueSelections[level];
        if (set.has(name)) set.delete(name);
        else set.add(name);
        renderIssueDrill();
        return;
      }
      if (actionNode.dataset.storeIndex) {
        selectedStoreIndex = Number(actionNode.dataset.storeIndex) || 0;
        renderRegionPage(currentDeliveryData);
        return;
      }
      if (actionNode.dataset.overviewDim) {
        issuePath = [actionNode.dataset.overviewDim];
        activatePage("issues");
        renderIssueDrill();
        return;
      }
      if (actionNode.dataset.overviewLabel) {
        issuePath = findPathToLabel(actionNode.dataset.overviewLabel) || [];
        activatePage("issues");
        renderIssueDrill();
        return;
      }
      if (actionNode.dataset.riskTarget) {
        const target = actionNode.dataset.riskTarget;
        if (target === "regions") {
          activatePage("regions");
          return;
        }
        issuePath = findPathToLabel(target) || [target];
        activatePage("issues");
        renderIssueDrill();
        return;
      }
      const action = actionNode.dataset.issueAction;
      if (action === "drill") issuePath = issuePath.concat(actionNode.dataset.name);
      if (action === "crumb") issuePath = issuePath.slice(0, Math.max(0, Number(actionNode.dataset.depth)));
      if (action === "quick") issuePath = findPathToLabel(actionNode.dataset.label) || [];
      renderIssueDrill();
    });
  }

  function optionList(items, getValue = item => item.name, getLabel = item => item.name) {
    return items.map(item => `<option value="${escapeHtml(getValue(item))}">${escapeHtml(getLabel(item))}</option>`).join("");
  }

  function deliveryFilterState() {
    return {
      platform: $("#filterPlatform")?.value || "全部",
      region: $("#filterRegion")?.value || "全国",
      issue: $("#filterIssue")?.value || "全部",
      emotion: $("#filterEmotion")?.value || "全部",
      score: $("#filterScore")?.value || "全部",
      subject: $("#filterSubject")?.value || "全部",
      time: $("#filterTime")?.value || "2026-05-01",
    };
  }

  function initDeliveryFilters(d) {
    if (deliveryFiltersBound) return;
    const platform = $("#filterPlatform");
    const region = $("#filterRegion");
    const issue = $("#filterIssue");
    const emotion = $("#filterEmotion");
    const subject = $("#filterSubject");
    if (platform) platform.innerHTML = `<option value="全部">全部平台</option>${optionList(d.channels || [])}<option value="京东到家">京东到家</option>`;
    if (region) region.innerHTML = `<option value="全国">全国</option>${optionList(d.provinceCounts || [])}`;
    if (issue) issue.innerHTML = `<option value="全部">全部问题</option>${optionList(issueTree.children || [])}`;
    if (emotion) emotion.innerHTML = `<option value="全部">全部情感</option><option value="正面">正面</option><option value="中性">中性</option><option value="负面">负面</option><option value="愤怒">愤怒</option>${optionList((d.emotionCounts || []).slice(0, 8))}`;
    if (subject) subject.innerHTML = `<option value="全部">全部主体</option>${optionList(d.subjects || [])}`;

    $$("#filterPlatform, #filterRegion, #filterIssue, #filterEmotion, #filterScore, #filterSubject, #filterTime").forEach(control => {
      control.addEventListener("change", () => {
        const state = deliveryFilterState();
        if (state.issue !== "全部") issuePath = [state.issue];
        if (state.issue === "全部" && issuePath.length === 1) issuePath = [];
        renderDelivery();
      });
    });
    deliveryFiltersBound = true;
  }

  function getTopIssueByName(name) {
    return (issueTree.children || []).find(item => item.name === name);
  }

  function scaleItem(item, factor, valueKey = "value") {
    return { ...item, [valueKey]: Math.max(1, Math.round(Number(item[valueKey] || 0) * factor)) };
  }

  function filteredDelivery(d) {
    const state = deliveryFilterState();
    let factor = 1;
    let negativeRate = Number(d.summary.negativeRate || 94);
    const platform = (d.channels || []).find(item => item.name === state.platform);
    if (platform) {
      factor *= Number(platform.value || 0) / Math.max(1, Number(d.summary.total || 1));
      negativeRate = Number(platform.negativeRate || negativeRate);
    } else if (state.platform === "京东到家") {
      factor *= 0.045;
      negativeRate = 92.8;
    }
    const province = (d.provinceCounts || []).find(item => item.name === state.region);
    if (province) {
      factor *= Number(province.value || 0) / Math.max(1, Number(d.summary.total || 1));
      negativeRate = Number(province.negativeRate || negativeRate);
    }
    const subject = (d.subjects || []).find(item => item.name === state.subject);
    if (subject) factor *= Math.max(0.04, Number(subject.value || 0) / Math.max(1, Number(d.summary.total || 1)));
    const emotion = (d.emotionCounts || []).find(item => item.name === state.emotion);
    if (emotion) {
      factor *= Math.max(0.035, Number(emotion.value || 0) / Math.max(1, Number(d.summary.total || 1)));
      negativeRate = normalizeEmotion(emotion.name) === "正面" ? 18.5 : 98.8;
    }
    if (state.emotion === "负面") {
      factor *= Number(d.summary.negativeCount || 0) / Math.max(1, Number(d.summary.total || 1));
      negativeRate = 100;
    }
    if (state.emotion === "愤怒") {
      factor *= 0.12;
      negativeRate = 100;
    }
    if (state.score !== "全部") {
      const scoreFactor = { "1": 0.68, "2": 0.15, "3": 0.13, "4": 0.02, "5": 0.04 }[state.score] || 1;
      factor *= scoreFactor;
      negativeRate = Number(state.score) <= 2 ? Math.max(negativeRate, 98.5) : Math.min(negativeRate, 62.5);
    }

    const issueNode = getTopIssueByName(state.issue);
    const issueFactor = issueNode ? Number(issueNode.value || 0) / Math.max(1, Number(issueTree.value || 1)) : 1;
    const totalFactor = Math.max(0.01, factor * (issueNode ? Math.max(0.12, issueFactor * 1.8) : 1));
    const total = Math.max(1, Math.round(Number(d.summary.total || 0) * totalFactor));
    const hourly = (d.hourly || []).map(item => {
      const count = Math.max(0, Math.round(Number(item.count || 0) * totalFactor));
      return {
        ...item,
        count,
        negativeRate,
        negativeCount: Math.max(0, Math.round(count * negativeRate / 100)),
      };
    });
    const channelRows = platform
      ? [{ ...platform, value: total, negativeRate }]
      : state.platform === "京东到家"
        ? [{ name: "京东到家", value: total, negativeRate, avgOrderScore: 1.62 }]
        : (d.channels || []).map(item => scaleItem(item, totalFactor));
    const provinceRows = province
      ? [{ ...province, value: total, negativeRate }]
      : (d.provinceCounts || []).map(item => scaleItem(item, totalFactor));
    const regionRows = province
      ? (d.regions || []).filter(item => item.province === state.region).map(item => scaleItem(item, Math.max(0.2, totalFactor * 2))).slice(0, 12)
      : (d.regions || []).map(item => scaleItem(item, totalFactor)).slice(0, 18);
    let examplesRows = (d.examples || []).filter(item => {
      const platformOk = state.platform === "全部" || item.channel === state.platform || (state.platform === "京东到家" && item.channel === "未知");
      const regionOk = state.region === "全国" || String(item.city || "").includes(state.region.replace(/省|市|自治区|壮族|维吾尔|回族/g, ""));
      const emotionOk = state.emotion === "全部" || normalizeEmotion(item.emotion || "理性") === state.emotion;
      const scoreOk = state.score === "全部" || String(Math.round(Number(item.score || 0))) === state.score;
      return platformOk && regionOk && emotionOk && scoreOk;
    });
    if (!examplesRows.length) examplesRows = (d.examples || []).slice(0, 6);

    return {
      ...d,
      filterState: state,
      filterFactor: totalFactor,
      summary: {
        ...d.summary,
        total,
        negativeRate,
        negativeCount: Math.round(total * negativeRate / 100),
        replyRate: state.subject === "具体门店" ? 15.2 : d.summary.replyRate,
      },
      hourly,
      channels: channelRows,
      provinceCounts: provinceRows,
      regions: regionRows,
      examples: examplesRows,
    };
  }

  function filteredIssueChildren(state) {
    const children = issueTree.children || [];
    if (state.issue === "全部") return children;
    const selected = children.find(item => item.name === state.issue);
    return selected ? [selected] : children;
  }

  const regionRiskRows = [
    { area: "华南", volume: 1186, negative: 95.8, strong: 24.1, issueRate: 91.2, foodRisk: 38, top: "包装打包 / 食安卫生", risk: 92 },
    { area: "华东", volume: 1048, negative: 94.6, strong: 21.7, issueRate: 89.8, foodRisk: 29, top: "产品体验 / 份量少", risk: 86 },
    { area: "华中", volume: 822, negative: 95.2, strong: 23.6, issueRate: 90.4, foodRisk: 21, top: "订单履约 / 备注未执行", risk: 84 },
    { area: "华北", volume: 641, negative: 93.8, strong: 19.2, issueRate: 86.9, foodRisk: 16, top: "产品体验", risk: 73 },
    { area: "西南", volume: 516, negative: 94.4, strong: 20.1, issueRate: 88.3, foodRisk: 13, top: "服务售后", risk: 69 },
    { area: "西北", volume: 388, negative: 92.9, strong: 18.8, issueRate: 84.1, foodRisk: 8, top: "配送履约", risk: 58 },
    { area: "东北", volume: 316, negative: 91.7, strong: 17.4, issueRate: 82.6, foodRisk: 6, top: "产品状态", risk: 52 },
  ];

  const storeRiskRows = [
    { store: "蜜雪冰城广州XX路店", city: "广州", group: "华南一组", volume: 64, negative: 98.4, strong: 31.6, top: "缺吸管", food: 2, level: "高" },
    { store: "蜜雪冰城深圳XX广场店", city: "深圳", group: "华南二组", volume: 56, negative: 96.8, strong: 28.1, top: "洒漏", food: 1, level: "高" },
    { store: "蜜雪冰城郑州XX店", city: "郑州", group: "华中三组", volume: 51, negative: 97.2, strong: 26.7, top: "备注未执行", food: 0, level: "高" },
    { store: "蜜雪冰城南京XX路店", city: "南京", group: "华东一组", volume: 48, negative: 95.6, strong: 24.9, top: "份量少", food: 1, level: "中" },
    { store: "蜜雪冰城长沙XX广场店", city: "长沙", group: "华中一组", volume: 42, negative: 100, strong: 25.3, top: "服务态度差", food: 0, level: "中" },
    { store: "蜜雪冰城杭州XX店", city: "杭州", group: "华东二组", volume: 39, negative: 93.8, strong: 21.6, top: "产品状态异常", food: 1, level: "中" },
  ];

  const heatmapRows = ["华南", "华东", "华中", "华北", "西南", "西北", "东北"];
  const heatmapCols = ["产品体验", "包装打包", "订单履约", "配送履约", "服务售后", "食安卫生"];
  const heatmapValues = [
    [72, 94, 76, 61, 66, 91],
    [88, 73, 68, 58, 62, 70],
    [76, 71, 90, 64, 67, 66],
    [70, 62, 72, 76, 65, 54],
    [68, 65, 69, 59, 82, 52],
    [55, 48, 58, 74, 51, 44],
    [61, 46, 52, 49, 58, 41],
  ];

  function heatmap() {
    return `<div class="heatmap">
      <div></div>${heatmapCols.map(col => `<strong>${escapeHtml(col)}</strong>`).join("")}
      ${heatmapRows.map((row, r) => `
        <b>${escapeHtml(row)}</b>
        ${heatmapCols.map((_, c) => {
          const value = heatmapValues[r][c];
          return `<span title="${escapeHtml(row)}-${escapeHtml(heatmapCols[c])} 风险指数 ${value}" style="background:rgba(22,135,255,${0.12 + value / 120})">${value}</span>`;
        }).join("")}
      `).join("")}
    </div>`;
  }

  function storeDetail(store) {
    return `<div class="store-drawer">
      <div class="drawer-title">门店详情抽屉</div>
      <h3>${escapeHtml(store.store)}</h3>
      <div class="drawer-meta">${escapeHtml(store.city)} / ${escapeHtml(store.group)}</div>
      <div class="drawer-grid">
        <div><span>评论量</span><strong>${fmt(store.volume)}</strong></div>
        <div><span>负向率</span><strong>${percent(store.negative)}</strong></div>
        <div><span>强负向率</span><strong>${percent(store.strong)}</strong></div>
        <div><span>食安风险</span><strong>${fmt(store.food)}</strong></div>
      </div>
      <dl class="explain-list">
        <dt>商家回复情况</dt><dd>回复率 18.5%，低于建议阈值 30%</dd>
      </dl>
    </div>`;
  }

  function storeRiskDistribution(store) {
    const rows = [
      { name: store.top, value: Math.max(12, Math.round(store.volume * .42)) },
      { name: "包装打包", value: Math.max(8, Math.round(store.volume * .27)) },
      { name: "订单履约", value: Math.max(5, Math.round(store.volume * .18)) },
      { name: "食安卫生", value: Math.max(1, store.food * 3) },
    ];
    return progressList(rows);
  }

  function storeTrend(store, d) {
    const values = d.hourly.map((item, index) => Math.max(0, Math.round(Number(item.count) * store.volume / Math.max(d.summary.total, 1) * (1 + (index % 4) * .12))));
    const risks = values.map((value, index) => Math.max(0, Math.round(value * (.64 + (index % 3) * .08))));
    return svgLine("storeTrend", [
      { name: "评论量", values, color: colors[0] },
      { name: "风险反馈", values: risks, color: colors[1] },
    ], d.hourly.map(item => item.hour), 230);
  }

  function storeVoiceItems(store, d) {
    return (d.examples || []).slice(0, 4).map((item, index) => ({
      ...item,
      city: `${store.city} · ${store.store}`,
      tag: index === 0 ? store.top : item.tag,
    }));
  }

  function renderRegionPage(d) {
    const store = storeRiskRows[Math.min(selectedStoreIndex, storeRiskRows.length - 1)];
    $("#regions").innerHTML = `
      <div class="dashboard-head">
        <div>
          <div class="page-title"><span class="title-mark"></span>区域与门店归因</div>
          <p>定位哪些区域、城市、小组、门店的问题更突出，并识别问题是否集中在某类体验环节。</p>
        </div>
        <div class="sample-note">当前筛选同步自顶部控件：${escapeHtml([d.filterState.region, d.filterState.platform, d.filterState.issue].join(" / "))}</div>
      </div>
      ${kpis([
        { label: "高风险区域数", value: "12", note: "风险指数高于 80 的区域" },
        { label: "高风险门店数", value: "86", note: "负向率与强负向双高" },
        { label: "区域平均负向率", value: percent(d.summary.negativeRate), note: "当前筛选下区域均值" },
        { label: "强负向高发区域", value: "华南", note: "包装与食安风险偏高" },
        { label: "食安风险门店数", value: "23", note: "异物/变质/不适相关" },
      ])}
      <div class="region-grid">
        ${card("区域风险榜", table(["区域", "评论量", "负向率", "强负向率", "Top 问题", "风险指数"], regionRiskRows.map(row => [
          escapeHtml(row.area),
          `<strong>${fmt(Math.round(row.volume * d.filterFactor * 1.8))}</strong>`,
          `<span class="badge red">${percent(row.negative)}</span>`,
          percent(row.strong),
          escapeHtml(row.top),
          `<strong>${row.risk}</strong>`,
        ])))}
        ${card("区域 x 问题维度热力图", heatmap())}
      </div>
      <div class="full-section store-risk-full">
        ${card("门店风险榜", table(["门店名称", "城市", "小组", "评论量", "负向率", "强负向", "Top 问题", "食安", "风险"], storeRiskRows.map((row, index) => [
          `<button class="link-btn" data-store-index="${index}">${escapeHtml(row.store)}</button>`,
          escapeHtml(row.city),
          escapeHtml(row.group),
          `<strong>${fmt(row.volume)}</strong>`,
          `<span class="badge red">${percent(row.negative)}</span>`,
          percent(row.strong),
          escapeHtml(row.top),
          fmt(row.food),
          `<span class="badge ${row.level === "高" ? "red" : "amber"}">${escapeHtml(row.level)}</span>`,
        ])))}
      </div>
      <div class="store-analysis-grid">
        ${card("门店详情", storeDetail(store))}
        ${card("门店趋势走向", storeTrend(store, d))}
        ${card("风险点分布", storeRiskDistribution(store))}
      </div>
      <div class="full-section">
        <section class="card evidence-quotes">
          <div class="card-header"><div class="card-title"><span class="mini-mark"></span>门店消费者原声</div><div class="card-tools"><span class="active">${escapeHtml(store.store)}</span></div></div>
          ${deliveryPosts(storeVoiceItems(store, d), store.top)}
        </section>
      </div>
    `;
  }

  const governanceItems = [
    { name: "缺吸管/缺餐具", volume: 933, harm: 23.6, stores: 368, subject: "门店", status: "治理中", color: "#1687ff" },
    { name: "备注未执行", volume: 771, harm: 25.6, stores: 296, subject: "门店", status: "待启动", color: "#ef4b6c" },
    { name: "份量少", volume: 521, harm: 21.2, stores: 254, subject: "产品", status: "治理中", color: "#20b7b3" },
    { name: "洒漏", volume: 218, harm: 26.3, stores: 116, subject: "门店", status: "待跟进", color: "#f5a623" },
    { name: "异物/杂质", volume: 94, harm: 36.8, stores: 42, subject: "食安", status: "高优先级", color: "#d83c4d" },
    { name: "服务态度差", volume: 88, harm: 31.0, stores: 64, subject: "服务", status: "待启动", color: "#7569df" },
  ];

  function priorityMatrix() {
    const width = 760;
    const height = 330;
    const x = value => 62 + Math.min(value, 1000) / 1000 * 630;
    const y = value => 286 - Math.min(value, 40) / 40 * 230;
    return `<div class="matrix-chart">
      <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" role="img">
        <line x1="62" y1="170" x2="700" y2="170" stroke="#1687ff" stroke-dasharray="4 4"/>
        <line x1="380" y1="45" x2="380" y2="286" stroke="#1687ff" stroke-dasharray="4 4"/>
        <text x="70" y="60" fill="#8b95aa" font-size="12">风险预警</text>
        <text x="570" y="60" fill="#8b95aa" font-size="12">立即治理</text>
        <text x="70" y="278" fill="#8b95aa" font-size="12">持续观察</text>
        <text x="560" y="278" fill="#8b95aa" font-size="12">标准化优化</text>
        <line x1="62" y1="286" x2="710" y2="286" stroke="#dfe4ee"/>
        <line x1="62" y1="45" x2="62" y2="286" stroke="#dfe4ee"/>
        ${governanceItems.map(item => `
          <circle cx="${x(item.volume)}" cy="${y(item.harm)}" r="${Math.max(9, Math.min(28, item.stores / 16))}" fill="${item.color}" fill-opacity=".82"/>
          <text x="${x(item.volume) + 12}" y="${y(item.harm) - 10}" fill="#28324a" font-size="12">${escapeHtml(item.name)}</text>
        `).join("")}
        <text x="350" y="320" fill="#667087" font-size="12">问题体量</text>
        <text x="8" y="42" fill="#667087" font-size="12">情绪伤害</text>
      </svg>
    </div>`;
  }

  function renderGovernancePage(d) {
    $("#governance").innerHTML = `
      <div class="dashboard-head">
        <div>
          <div class="page-title"><span class="title-mark"></span>专项治理追踪</div>
          <p>将高频可控与低频高伤害问题沉淀为治理专项，并追踪状态、门店范围和食安红线。</p>
        </div>
        <div class="sample-note">治理指标为 demo 模拟口径，后续接入连续数据后可展示治理前后趋势。</div>
      </div>
      ${kpis([
        { label: "治理中专项", value: "4", note: "已进入周复盘节奏" },
        { label: "高频可控问题", value: "7", note: "适合 SOP 标准化" },
        { label: "高风险问题", value: "3", note: "食安与强投诉相关" },
        { label: "已改善问题", value: "2", note: "近周期问题率下降" },
        { label: "待跟进门店", value: "86", note: "需区域运营核查" },
      ])}
      <div class="governance-grid">
        ${card("治理优先级矩阵", priorityMatrix())}
        ${card("食安红线监测", table(["风险类型", "今日数量", "涉及门店", "强负向", "处理状态"], [
          ["异物/杂质", "<strong>94</strong>", "42", "<span class=\"badge red\">99.1%</span>", "高优先级"],
          ["怪味/变质", "<strong>51</strong>", "28", "<span class=\"badge red\">96.4%</span>", "核查中"],
          ["身体不适", "<strong>29</strong>", "17", "<span class=\"badge red\">98.2%</span>", "待分派"],
          ["封口污染", "<strong>15</strong>", "11", "<span class=\"badge amber\">91.6%</span>", "观察"],
        ]))}
      </div>
      <div class="special-grid">
        ${[
          ["缺物料治理", "933", "368", "华南、华中", "门店打包", "打包复核 SOP", "治理中"],
          ["备注未执行治理", "771", "296", "华中、华东", "门店制作 / 订单识别", "备注识别提醒 + 出餐复核", "待启动"],
          ["食安异物风险", "94", "42", "华南、华东", "门店出品 / 原料管理", "风险核查", "高优先级"],
        ].map(item => `<section class="special-card">
          <div class="special-status">${escapeHtml(item[6])}</div>
          <h3>${escapeHtml(item[0])}</h3>
          <div class="drawer-grid">
            <div><span>问题量</span><strong>${escapeHtml(item[1])}</strong></div>
            <div><span>涉及门店</span><strong>${escapeHtml(item[2])}</strong></div>
          </div>
          <dl class="explain-list">
            <dt>高发区域</dt><dd>${escapeHtml(item[3])}</dd>
            <dt>责任主体</dt><dd>${escapeHtml(item[4])}</dd>
            <dt>治理动作</dt><dd>${escapeHtml(item[5])}</dd>
          </dl>
        </section>`).join("")}
      </div>
    `;
  }

  function donut(items, totalLabel = "总量") {
    const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
    let acc = 0;
    const radius = 78;
    const circumference = Math.PI * 2 * radius;
    const rings = items.slice(0, 6).map((item, i) => {
      const value = Number(item.value || 0);
      const dash = value / total * circumference;
      const gap = circumference - dash;
      const node = `<circle r="${radius}" cx="100" cy="100" fill="none" stroke="${colors[i]}" stroke-width="22"
        stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${-acc}" transform="rotate(-90 100 100)"/>`;
      acc += dash;
      return node;
    }).join("");
    const legend = items.slice(0, 6).map((item, i) => `
      <div class="progress-row" style="grid-template-columns:1fr auto">
        <div><span style="color:${colors[i]}">■</span> ${escapeHtml(item.name)}</div>
        <strong>${percent(Number(item.value || 0) / total * 100)}</strong>
      </div>`).join("");
    return `<div class="metric-split" style="grid-template-columns:220px 1fr;align-items:center">
      <svg viewBox="0 0 200 200" width="210" height="210">
        <circle r="${radius}" cx="100" cy="100" fill="none" stroke="#edf2f8" stroke-width="22"/>
        ${rings}
        <text x="100" y="94" text-anchor="middle" fill="#1d2745" font-size="24" font-weight="800">${fmt(total)}</text>
        <text x="100" y="118" text-anchor="middle" fill="#7b8498" font-size="13">${escapeHtml(totalLabel)}</text>
      </svg>
      <div>${legend}</div>
    </div>`;
  }

  function renderDelivery() {
    const base = data.delivery;
    if (!base) return;
    initDeliveryFilters(base);
    const d = filteredDelivery(base);
    const state = d.filterState;
    currentDeliveryData = d;
    bindDeliveryEvents();
    const labelCoverage = 96.39;
    const issueRate = state.issue === "全部" ? 89.7 : Math.min(99.2, 72 + (getTopIssueByName(state.issue)?.value || 0) / 72);
    // TOP 风险问题：按 风险指数=问题量×风险系数 降序
    const topTagRowsRaw = [
      { name: "异物/杂质",           dim: "食安卫生", volume: 94,  negativeRate: 100, strongRate: 36.8, stores: 87 },
      { name: "怪味/变质",           dim: "食安卫生", volume: 83,  negativeRate: 98.8, strongRate: 34.2, stores: 62 },
      { name: "饮后不适/肠胃不适",   dim: "食安卫生", volume: 55,  negativeRate: 98.2, strongRate: 29.7, stores: 41 },
      { name: "产品状态异常",         dim: "产品体验",   volume: 230, negativeRate: 99.3, strongRate: 24.6, stores: 211 },
      { name: "到手不冰/温度异常",   dim: "产品体验",   volume: 173, negativeRate: 99.1, strongRate: 23.8, stores: 158 },
      { name: "备注未执行/定制做错", dim: "订单履约",   volume: 704, negativeRate: 100,  strongRate: 25.6, stores: 489 },
      { name: "漏送商品/少送",       dim: "订单履约",   volume: 375, negativeRate: 99.4, strongRate: 24.0, stores: 268 },
      { name: "错送商品/做错口味",   dim: "订单履约",   volume: 228, negativeRate: 99.2, strongRate: 23.1, stores: 184 },
      { name: "缺吸管",               dim: "包装打包",   volume: 512, negativeRate: 98.9, strongRate: 23.6, stores: 219 },
      { name: "缺餐具",               dim: "包装打包",   volume: 241, negativeRate: 98.6, strongRate: 21.4, stores: 176 },
      { name: "洒漏",                 dim: "包装打包",   volume: 218, negativeRate: 98.5, strongRate: 26.3, stores: 186 },
      { name: "服务态度差",           dim: "服务售后",   volume: 285, negativeRate: 99.6, strongRate: 31.0, stores: 241 },
      { name: "份量少",               dim: "产品体验",   volume: 478, negativeRate: 98.5, strongRate: 21.2, stores: 354 },
    ];
    const topTagRows = topTagRowsRaw.map(row => {
      const riskIndex = Math.round(row.volume * getRiskWeight(row.name) * 10) / 10;
      return { ...row, riskIndex };
    }).sort((a, b) => b.riskIndex - a.riskIndex)
      .filter(row => state.issue === "全部" || row.dim === state.issue)
      .map(row => [
        row.name,
        row.dim,
        Math.max(1, Math.round(row.volume * d.filterFactor * (state.issue === "全部" ? 1 : 2.7))),
        row.negativeRate,
        row.strongRate,
        Math.max(1, Math.round(row.stores * Math.max(0.18, d.filterFactor * 2.1))),
        `+${Math.round(row.riskIndex / row.volume * 100)}%`,
        Math.round(row.riskIndex * d.filterFactor * 10) / 10,
      ]);
    const issueChildren = filteredIssueChildren(state);
    const maxIssueValue = Math.max(...issueChildren.map(item => item.value), 1);
    const filterSummary = [
      state.time,
      state.platform !== "全部" ? state.platform : "全部平台",
      state.region,
      state.issue !== "全部" ? state.issue : "全部问题",
      state.emotion !== "全部" ? state.emotion : "全部情感",
      state.score !== "全部" ? `${state.score}星` : "全部评分",
      state.subject !== "全部" ? state.subject : "全部主体",
    ].join(" / ");
    $("#overview").innerHTML = `
      <div class="dashboard-head">
        <div>
          <div class="page-title"><span class="title-mark"></span>外卖体验总览</div>
          <p>用于快速判断当前外卖体验健康度，识别高频可控问题与食安类高风险信号。</p>
        </div>
        <div class="sample-note">当前筛选：${escapeHtml(filterSummary)}。趋势支持按小时与按天切换，页面指标随筛选条件联动重算。</div>
      </div>
      ${kpis([
        { label: "品牌风险指数", value: (() => {
          const issueChildren = filteredIssueChildren(deliveryFilterState());
          let totalRisk = 0;
          issueChildren.forEach(item => { totalRisk += calcRiskIndex(item); });
          if (totalRisk === 0) totalRisk = Math.round(d.summary.total * 0.94);
          return fmt(Math.round(totalRisk));
        })(), note: "Σ(问题量×风险系数) / 越高表示风险越大" },
        { label: "负向评论占比", value: percent(d.summary.negativeRate), note: "较昨日 +3.2pct / 整体体验压力偏高" },
        { label: "强负向占比", value: percent(state.emotion === "强负向" ? 100 : 20.7), note: "较昨日 +2.8pct / 愤怒、强不满集中" },
        { label: "标签覆盖率", value: `${labelCoverage}%`, note: "打标可解释评论覆盖" },
        { label: "问题评论率", value: percent(issueRate), note: "包含至少一类体验问题" },
        { label: "风险问题数", value: fmt(Math.max(1, Math.round(232 * d.filterFactor * (state.issue === "食安卫生" ? 4.2 : 1)))), note: "风险指数>80 的问题纳入统计" },
      ])}
      <div class="section-label">风险与治理判断</div>
      <section class="food-redline">
        <div class="redline-head"><strong>食安问题红线</strong><span>低频不等于低风险，命中后进入独立核查链路</span></div>
        <div class="redline-items">
          ${[
            ["异物 / 杂质", 94, 42, 99.1, "P1"],
            ["怪味 / 变质", 51, 28, 96.4, "P1"],
            ["身体不适", 29, 17, 98.2, "P1"],
            ["封口污染", 15, 11, 91.6, "P2"],
          ].map(item => `<button class="redline-item" data-risk-target="${item[0].includes("异物") ? "异物/杂质" : "食安卫生"}">
            <span>${item[4]}</span><strong>${item[0]}</strong><b>${item[1]} 条</b><small>${item[2]} 家门店 · 强负向 ${item[3]}%</small>
          </button>`).join("")}
        </div>
      </section>
      <div class="full-section">
        ${card("治理优先级矩阵", priorityMatrix(), `<div class="card-tools"><span class="active">问题体量 × 情绪伤害</span></div>`)}
      </div>
      <div class="full-section">
        ${card("重点治理问题清单", table(["问题", "治理优先级", "问题体量", "强负向", "涉及门店", "责任主体", "判断依据", "建议治理方向"], [
          ["备注未执行 / 定制做错", "<span class=\"badge red\">立即治理</span>", "<strong>771</strong>", "25.6%", "296", "门店制作", "体量和负向双高", "备注识别提醒 + 出餐复核"],
          ["缺物料", "<span class=\"badge\">标准化优化</span>", "<strong>933</strong>", "23.6%", "368", "门店打包", "高频、低复杂度、强可控", "打包复核 SOP"],
          ["异物 / 杂质", "<span class=\"badge red\">风险预警</span>", "<strong>94</strong>", "99.1%", "42", "食安链路", "低频、高伤害", "食安红线核查"],
          ["份量少", "<span class=\"badge amber\">重点关注</span>", "<strong>521</strong>", "21.2%", "254", "产品制作", "产品体验落差明显", "出品标准抽检"],
          ["包装撒漏", "<span class=\"badge amber\">标准化优化</span>", "<strong>218</strong>", "26.3%", "116", "门店打包", "可控履约问题", "封口与杯盖复核"],
        ]))}
      </div>
      <div class="section-label">体验监测与问题结构</div>
      <div class="overview-grid">
        ${card("评论量与负面情绪趋势", svgLine("deliveryTrend", [
          { name: "评价量", values: d.hourly.map(x => x.count), color: colors[0] },
          { name: "负向反馈", values: d.hourly.map(x => x.negativeCount), color: colors[1] },
          { name: "问题评论", values: d.hourly.map(x => Math.round(x.count * 0.897)), color: colors[2] },
        ], d.hourly.map(x => x.hour)), `<div class="card-tools"><span class="active">按小时</span><span>按天</span></div>`)}
        ${card("一级问题维度分布", `<div class="click-bars">${issueChildren.map((item, index) => `
          <button data-overview-dim="${escapeHtml(item.name)}" class="click-bar">
            <span>${escapeHtml(item.name)}</span>
            <b>${fmt(Math.max(1, Math.round(item.value * d.filterFactor * (state.issue === "全部" ? 1 : 2.7))))}</b>
            <i style="width:${Math.max(8, item.value / maxIssueValue * 100)}%;background:${colors[index % colors.length]}"></i>
          </button>
        `).join("")}</div>`)}
      </div>
      <div class="full-section">
        ${card("TOP 风险问题", table(["排名", "问题标签", "所属维度", "问题量", "风险指数", "负向率", "强负向", "涉及门店", "环比"], (topTagRows.length ? topTagRows : [["当前筛选暂无风险问题", state.issue, 0, 0, 0, 0, 0, "-"]]).map((row, index) => [
          index + 1,
          `<button class="link-btn" data-overview-label="${escapeHtml(row[0])}">${escapeHtml(row[0])}</button>`,
          escapeHtml(row[1]),
          `<strong>${fmt(row[2])}</strong>`,
          `<strong style="color:#ef4b6c">${row[7] !== undefined ? row[7] : "-"}</strong>`,
          `<span class="badge red">${percent(row[3])}</span>`,
          percent(row[4]),
          fmt(row[5]),
          row[6] || "-",
        ])))}
      </div>
    `;

    renderIssueDrill();

    renderRegionPage(d);
  }

  let selectedServiceIssue = 0;
  let serviceEventsBound = false;

  const serviceProblems = [
    {
      issue: "杨枝甘露 AB货 / 颜色差异", risk: "P1", total: 186, internal: 24, social: 162, score: 82.5, change: "+46%", type: "社媒外溢型", product: "杨枝甘露", platforms: "抖音 / 小红书 / 微博", regions: "河南 / 广东 / 山东",
      keywords: ["AB货", "颜色不一样", "芒果酱", "发白", "少加料", "出品不一致"],
      judgement: "该问题在社媒侧讨论明显高于内部客诉，属于外部先发酵问题。内部客服系统中相关投诉量暂未同步放大，但公开平台中已出现较高互动和品质质疑表达，建议优先关注。",
      sources: [["抖音", 58], ["小红书", 22], ["微博", 7], ["外卖评价", 8], ["在线客服", 3], ["热线", 2]],
      paths: ["抖音 / 小红书 → 品牌声誉 → 品质质疑 → 出品不一致 → AB货 / 颜色差异", "外卖评价 / 在线客服 → 产品体验 → 产品状态异常 → 颜色异常 → 芒果酱发白 / 加料差异"],
      evidence: "同样是杨枝甘露，两杯颜色完全不一样，一杯像正常芒果，一杯发白，感觉像买到 AB 货。"
    },
    { issue: "异物 / 食安卫生", risk: "P1", total: 73, internal: 48, social: 25, score: 78.0, change: "+31%", type: "内外共振型", product: "冰鲜柠檬水", platforms: "热线 / 小红书", regions: "广东 / 江苏 / 浙江", keywords: ["异物", "食安", "头发", "虫子", "不敢喝"], judgement: "内部投诉与公开平台同时出现食安相关强负向表达，建议进入品控和区域运营同步核查。", sources: [["热线", 30], ["在线客服", 18], ["外卖评价", 18], ["小红书", 20], ["抖音", 9], ["微博", 5]], paths: ["热线 / 在线客服 → 食安卫生 → 异物问题 → 异物 / 杂质", "小红书 → 品牌声誉 → 食安质疑 → 食品安全 → 异物曝光"], evidence: "柠檬水里看到疑似异物，喝到一半才发现，真的很恶心。" },
    { issue: "出餐慢 / 压单", risk: "P2", total: 212, internal: 190, social: 22, score: 61.5, change: "+18%", type: "内部高频型", product: "多产品", platforms: "在线客服 / 外卖评价", regions: "山东 / 河南 / 湖北", keywords: ["等太久", "压单", "半小时", "不出餐"], judgement: "内部客诉高于社媒公开反馈，主要是门店运营履约问题，需联动区域运营抽查高峰期出餐。", sources: [["热线", 22], ["在线客服", 36], ["外卖评价", 52], ["抖音", 5], ["小红书", 3], ["微博", 2]], paths: ["在线客服 / 外卖评价 → 订单履约 → 出餐效率 → 出餐慢 / 压单"], evidence: "线下点的做好二十分钟不给拿，一直问就说没做好，等了半个小时。" },
    { issue: "冰淇淋融化 / 状态异常", risk: "P2", total: 146, internal: 118, social: 28, score: 58.0, change: "+12%", type: "内部高频型", product: "雪王大圣代", platforms: "外卖评价 / 抖音", regions: "江苏 / 四川 / 湖北", keywords: ["融化", "不冰", "状态异常", "冰淇淋"], judgement: "外卖配送链路中产品状态不稳定，内部投诉为主，社媒已有少量扩散。", sources: [["外卖评价", 58], ["在线客服", 16], ["热线", 7], ["抖音", 12], ["小红书", 6], ["微博", 1]], paths: ["外卖评价 → 产品体验 → 产品状态异常 → 融化 / 到手不冰"], evidence: "圣代送过来已经化了，杯子里都成水了。" },
    { issue: "包装撒漏", risk: "P3", total: 135, internal: 126, social: 9, score: 42.0, change: "+5%", type: "内部高频型", product: "奶茶类", platforms: "外卖评价", regions: "广东 / 江苏", keywords: ["撒漏", "封口", "杯盖", "袋子湿"], judgement: "主要是内部和准内部渠道的履约问题，暂未明显外溢，但适合进入门店打包 SOP 复核。", sources: [["外卖评价", 70], ["在线客服", 15], ["热线", 8], ["抖音", 3], ["小红书", 2], ["微博", 2]], paths: ["外卖评价 → 包装打包 → 洒漏问题 → 封口不严 / 包装撒漏"], evidence: "送过来都撒了，袋子里全是奶茶。" },
  ];

  function serviceFilterState() {
    return {
      time: $("#serviceTime")?.value || "近7天",
      source: $("#serviceSource")?.value || "全部",
      dim: $("#serviceIssueDim")?.value || "全部",
      region: $("#serviceRegion")?.value || "全国",
      product: $("#serviceProduct")?.value || "全部产品",
      risk: $("#serviceRisk")?.value || "全部",
    };
  }

  function serviceFactor(state) {
    let factor = 1;
    if (state.time === "昨日") factor *= .28;
    if (state.time === "近30天") factor *= 2.8;
    if (state.time === "本月") factor *= 2.1;
    if (state.source !== "全部") factor *= ["抖音", "小红书", "微博", "B站", "快手"].includes(state.source) ? .24 : .38;
    if (state.region !== "全国") factor *= .18;
    if (state.product !== "全部产品") factor *= .22;
    if (state.risk !== "全部") factor *= state.risk.startsWith("P1") ? .34 : .52;
    return Math.max(.06, factor);
  }

  function filteredServiceProblems() {
    const state = serviceFilterState();
    return serviceProblems.filter(item => {
      const riskOk = state.risk === "全部" || item.risk === state.risk.slice(0, 2) || (state.risk === "观察信号" && item.risk === "P3");
      const productOk = state.product === "全部产品" || item.product.includes(state.product) || item.issue.includes(state.product);
      const regionOk = state.region === "全国" || item.regions.includes(state.region);
      const dimOk = state.dim === "全部" || item.paths.join("").includes(state.dim) || item.issue.includes(state.dim);
      return riskOk && productOk && regionOk && dimOk;
    });
  }

  function serviceProblemRows(factor) {
    const rows = filteredServiceProblems();
    return rows.length ? rows.map((item, index) => ({ ...item, index, total: Math.max(1, Math.round(item.total * factor)), internal: Math.max(0, Math.round(item.internal * factor)), social: Math.max(0, Math.round(item.social * factor)) })) : [];
  }

  function sourceBreakdown(problem) {
    return `<div class="source-bars">${problem.sources.map(([name, value], index) => `
      <div class="source-row">
        <span>${escapeHtml(name)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${value}%;background:${colors[index % colors.length]}"></div></div>
        <strong>${value}%</strong>
      </div>
    `).join("")}</div>`;
  }

  function channelSentimentChart(s) {
    const social = (s.socialSame.platforms || []).map(item => ({
      name: item.name.replace("app", ""),
      total: item.value,
      negative: item.negativeRate,
      positive: Math.max(8, 42 - item.negativeRate),
    }));
    const internal = (s.complaint.sourceCounts || []).map(item => ({
      name: item.name,
      total: item.value,
      negative: s.complaint.summary.negativeRate,
      positive: 3,
    }));
    return `<div class="channel-sentiment">${social.concat(internal).map(item => {
      const neutral = Math.max(0, 100 - item.negative - item.positive);
      return `<div class="sentiment-row">
        <div><strong>${escapeHtml(item.name)}</strong><small>${fmt(item.total)} 条</small></div>
        <div class="sentiment-stack" title="正向 ${percent(item.positive)} / 中性 ${percent(neutral)} / 负向 ${percent(item.negative)}">
          <i class="positive" style="width:${item.positive}%"></i>
          <i class="neutral" style="width:${neutral}%"></i>
          <i class="negative" style="width:${item.negative}%"></i>
        </div>
        <span>${percent(item.negative)} 负向</span>
      </div>`;
    }).join("")}
      <div class="sentiment-legend"><span class="positive">正向</span><span class="neutral">中性</span><span class="negative">负向</span></div>
    </div>`;
  }

  function allChannelTrend(s, factor) {
    const hourly = s.hourly || [];
    return svgLine("allChannelTrend", [
      { name: "社媒声量", values: hourly.map(item => Math.round(item.socialPosts * factor)), color: colors[0] },
      { name: "社媒负面声量", values: hourly.map(item => Math.round(item.socialPosts * item.socialNegativeRate / 100 * factor)), color: colors[1] },
      { name: "热线声量", values: hourly.map(item => Math.round(item.complaints * .93 * factor)), color: colors[2] },
      { name: "热线负面声量", values: hourly.map(item => Math.round(item.complaints * .93 * .743 * factor)), color: colors[3] },
      { name: "在线声量", values: hourly.map(item => Math.round(item.complaints * .07 * factor)), color: colors[4] },
      { name: "在线负面声量", values: hourly.map(item => Math.round(item.complaints * .07 * .743 * factor)), color: colors[5] },
    ], hourly.map(item => item.hour), 290);
  }

  function internalBusinessTrend(s, factor) {
    const hourly = s.hourly || [];
    return svgLine("internalBusinessTrend", [
      { name: "热线业务量", values: hourly.map(item => Math.round(item.complaints * .93 * factor)), color: colors[0] },
      { name: "热线负向量", values: hourly.map(item => Math.round(item.complaints * .93 * .743 * factor)), color: colors[1] },
      { name: "在线客服业务量", values: hourly.map(item => Math.round(item.complaints * .07 * factor)), color: colors[2] },
      { name: "在线客服负向量", values: hourly.map(item => Math.round(item.complaints * .07 * .743 * factor)), color: colors[3] },
    ], hourly.map(item => item.hour), 230);
  }

  function serviceAttribution(problem) {
    const subject = problem.type === "社媒外溢型" ? "品牌 / 产品" : problem.issue.includes("食安") ? "品控 / 门店" : "门店运营";
    return `<div class="attribution-cards">
      <div><span>来源归因</span><strong>${escapeHtml(problem.platforms)}</strong><small>${problem.social > problem.internal ? "社媒先发酵" : "内部客诉主导"}</small></div>
      <div><span>产品归因</span><strong>${escapeHtml(problem.product)}</strong><small>关联问题集中产品</small></div>
      <div><span>区域归因</span><strong>${escapeHtml(problem.regions)}</strong><small>传播区域 / 客诉区域</small></div>
      <div><span>主体归因</span><strong>${escapeHtml(subject)}</strong><small>归因模型建议主体</small></div>
    </div>`;
  }

  function productIssueHeatmap(problem) {
    const products = ["杨枝甘露", "冰鲜柠檬水", "雪王大圣代", "金桔香柠", "珍珠奶茶", "满杯百香果"];
    const issues = ["颜色异常", "口味异常", "份量不足", "状态异常", "异味", "融化", "包装撒漏"];
    return `<div class="service-heatmap">
      <div></div>${issues.map(item => `<strong>${escapeHtml(item)}</strong>`).join("")}
      ${products.map((product, r) => `
        <b>${escapeHtml(product)}</b>
        ${issues.map((issue, c) => {
          const base = product === problem.product || problem.issue.includes(product) ? 78 : 22;
          const match = problem.issue.includes("颜色") && issue === "颜色异常" ? 96 : problem.issue.includes("异物") && issue === "异味" ? 88 : problem.issue.includes("融化") && issue === "融化" ? 91 : problem.issue.includes("包装") && issue === "包装撒漏" ? 86 : base + ((r + c) % 4) * 8;
          return `<span style="background:rgba(22,135,255,${Math.min(.88, .12 + match / 120)})">${match > 80 ? "高" : match > 55 ? "中" : "低"}</span>`;
        }).join("")}
      `).join("")}
    </div>`;
  }

  function serviceEvidence(problem) {
    const negative = problem.keywords.concat(["离谱", "失望", "欺骗", "无语", "投诉", "避雷", "不一致", "难喝", "发白", "少加料", "恶心", "曝光", "退钱"]);
    const positive = ["好喝", "清爽", "解腻", "性价比", "包装干净", "口感不错", "服务及时", "回复快", "新品惊喜", "推荐", "会回购", "味道浓"];
    const cloud = (words, tone) => `<div class="radar-word-cloud ${tone}">${words.concat(words.slice(0, 7)).map((word, index) => `<span style="--size:${16 + ((index * 7) % 28)}px;--x:${8 + ((index * 17) % 76)}%;--y:${10 + ((index * 29) % 74)}%;--rotate:${index % 5 === 0 ? -4 : index % 7 === 0 ? 4 : 0}deg">${escapeHtml(word)}</span>`).join("")}</div>`;
    const posts = [
      ["抖音", "雪王观察员", "河南", problem.product, problem.evidence, "8,462", "2026-05-21 15:07", "愤怒"],
      ["小红书", "甜味研究所", "广东", problem.product, "同一个产品两次买到的状态差异很大，颜色和加料完全不一致，门店出品需要好好检查。", "1,284", "2026-05-21 18:42", "失望"],
      ["热线", "匿名用户", "山东", problem.product, "用户反馈饮品存在异常气味，希望客服尽快介入并核查门店出品流程。", "-", "2026-05-21 20:16", "不满"],
    ];
    return `<div class="radar-evidence-layout">
      <section class="radar-cloud-panel">
        <header><div><span class="mini-mark"></span><strong>关键词词云</strong></div><div class="cloud-tabs"><button class="active" data-cloud-tone="negative">负面</button><button data-cloud-tone="positive">正面</button></div></header>
        <div class="cloud-stage"><div data-cloud-panel="negative">${cloud(negative, "negative")}</div><div data-cloud-panel="positive" hidden>${cloud(positive, "positive")}</div></div>
      </section>
      <section class="original-post-panel">
        <header><div><span class="mini-mark"></span><strong>客诉与社媒原声</strong></div><button>按风险排序 ⇅</button></header>
        <div class="original-post-list">
          ${posts.map((item, index) => `<article class="original-post">
            <div class="post-author"><span class="post-avatar">${item[0].slice(0, 1)}</span><div><strong>${item[1]}</strong><small>${item[0]} · ${item[6]} · ${item[2]}</small></div><span class="badge red">${item[7]}</span></div>
            <p>${escapeHtml(item[4])}</p>
            ${index < 2 ? `<div class="post-media"><span></span><em>内容图片 / 视频封面</em></div>` : ""}
            <div class="post-foot"><span>热度 ${item[5]}</span><span>标签：${escapeHtml(problem.issue)}</span><a href="javascript:void(0)">查看详情</a></div>
          </article>`).join("")}
        </div>
      </section>
    </div>`;
  }

  function serviceIssueSummary(problem) {
    return `<div class="issue-explain service-summary">
      <div class="explain-eyebrow">当前问题</div>
      <h3>${escapeHtml(problem.issue)}</h3>
      <div class="explain-stats">
        <div><span>风险等级</span><strong>${escapeHtml(problem.risk)} 高风险</strong></div>
        <div><span>外溢风险评分</span><strong>${escapeHtml(problem.score)}</strong></div>
        <div><span>问题类型</span><strong>${escapeHtml(problem.type)}</strong></div>
        <div><span>主要产品</span><strong>${escapeHtml(problem.product)}</strong></div>
      </div>
      <dl class="explain-list">
        <dt>主要平台</dt><dd>${escapeHtml(problem.platforms)}</dd>
        <dt>主要区域</dt><dd>${escapeHtml(problem.regions)}</dd>
        <dt>核心关键词</dt><dd>${escapeHtml(problem.keywords.join("、"))}</dd>
        <dt>当前判断</dt><dd>${escapeHtml(problem.judgement)}</dd>
      </dl>
    </div>`;
  }

  function warningQuadrant() {
    const width = 760;
    const height = 390;
    const x = value => 70 + Math.min(value, 220) / 220 * 620;
    const y = value => 318 - Math.min(value, 95) / 95 * 250;
    return `<svg class="quadrant" viewBox="0 0 ${width} ${height}" width="100%" height="${height}">
      <line x1="70" y1="190" x2="700" y2="190" stroke="#1687ff" stroke-dasharray="4 4"/>
      <line x1="380" y1="55" x2="380" y2="320" stroke="#1687ff" stroke-dasharray="4 4"/>
      <text x="92" y="78" fill="#8b95aa" font-size="12">社媒外溢型</text>
      <text x="570" y="78" fill="#8b95aa" font-size="12">内外共振型</text>
      <text x="92" y="304" fill="#8b95aa" font-size="12">观察信号型</text>
      <text x="560" y="304" fill="#8b95aa" font-size="12">内部高频型</text>
      <line x1="70" y1="320" x2="705" y2="320" stroke="#dfe4ee"/>
      <line x1="70" y1="55" x2="70" y2="320" stroke="#dfe4ee"/>
      ${serviceProblems.map(item => {
        const color = item.risk === "P1" ? "#d83c4d" : item.risk === "P2" ? "#f5a623" : "#1687ff";
        const r = Math.max(10, Math.min(30, item.total / 8));
        return `<circle cx="${x(item.internal)}" cy="${y(item.score)}" r="${r}" fill="${color}" fill-opacity=".82"/><text x="${x(item.internal) + 12}" y="${y(item.score) - 8}" fill="#28324a" font-size="12">${escapeHtml(item.issue)}</text>`;
      }).join("")}
      <text x="350" y="360" fill="#667087" font-size="12">内部客诉量</text>
      <text x="12" y="48" fill="#667087" font-size="12">社媒外溢风险评分</text>
    </svg>`;
  }

  function serviceRegionMap() {
    const rows = [
      ["河南", 86.2, 310, 220, "AB货 / 品质质疑", "+48%"],
      ["广东", 81.5, 420, 168, "食安卫生 / 异味", "+35%"],
      ["山东", 74.8, 280, 135, "出餐慢 / 服务态度", "+19%"],
      ["江苏", 68.3, 240, 88, "包装撒漏", "+12%"],
      ["浙江", 63.9, 210, 76, "冰淇淋融化", "+9%"],
      ["四川", 58.4, 168, 52, "服务售后", "+6%"],
      ["湖北", 54.6, 156, 44, "出餐慢", "+4%"],
      ["湖南", 52.1, 142, 39, "备注未执行", "+3%"],
    ];
    return { rows, map: `<div id="chinaRiskMap" class="china-risk-map" role="img" aria-label="中国省级行政区风险地图"><div class="map-loading">正在加载中国行政区地图…</div></div>` };
  }

  async function initChinaRiskMap(rows) {
    const target = $("#chinaRiskMap");
    if (!target) return;
    try {
      const echartsApi = window.echarts || await import("./assets/echarts.esm.min.js?v=20260606h3");
      if (!window.__chinaProvinceGeoJson) {
        const response = await fetch("./assets/china-provinces.json");
        window.__chinaProvinceGeoJson = await response.json();
        echartsApi.registerMap("china-provinces", window.__chinaProvinceGeoJson);
      }
      if (window.__chinaRiskChart) window.__chinaRiskChart.dispose();
      const riskByName = new Map(rows.map(row => [row[0], row]));
      const aliases = { "内蒙古自治区": "内蒙古", "广西壮族自治区": "广西", "西藏自治区": "西藏", "宁夏回族自治区": "宁夏", "新疆维吾尔自治区": "新疆", "香港特别行政区": "香港", "澳门特别行政区": "澳门" };
      const values = (window.__chinaProvinceGeoJson.features || []).map(feature => {
        const fullName = feature.properties.name;
        const shortName = aliases[fullName] || fullName.replace(/[省市]$/, "");
        const row = riskByName.get(shortName);
        return { name: fullName, shortName, value: row ? row[1] : 24 + (shortName.charCodeAt(0) % 27), row };
      });
      window.__chinaRiskChart = echartsApi.init(target);
      window.__chinaRiskChart.setOption({
        animationDuration: 700,
        tooltip: {
          trigger: "item",
          backgroundColor: "rgba(20,29,48,.94)",
          borderWidth: 0,
          textStyle: { color: "#fff" },
          formatter(params) {
            const item = params.data || {};
            const row = item.row;
            return row
              ? `<b>${item.shortName}</b><br/>风险指数：${row[1]}<br/>内部客诉：${row[2]}<br/>社媒负向：${row[3]}<br/>TOP 问题：${row[4]}<br/>环比：${row[5]}`
              : `<b>${item.shortName}</b><br/>风险指数：${Math.round(item.value || 0)}<br/>当前为观察区域`;
          },
        },
        visualMap: {
          min: 20, max: 90, left: 24, bottom: 16, orient: "horizontal",
          text: ["高风险", "低"], calculable: false,
          inRange: { color: ["#e8f4ff", "#93c9f3", "#f6b178", "#e75161"] },
          textStyle: { color: "#718097", fontSize: 11 },
        },
        series: [{
          type: "map", map: "china-provinces", roam: false, selectedMode: "single",
          layoutCenter: ["50%", "47%"], layoutSize: "104%",
          label: { show: true, color: "#40506a", fontSize: 10 },
          emphasis: { label: { color: "#17243c", fontWeight: "bold" }, itemStyle: { areaColor: "#ffd56a", borderColor: "#fff" } },
          select: { itemStyle: { areaColor: "#ffbd4a", borderColor: "#fff" }, label: { color: "#1e2b42" } },
          itemStyle: { borderColor: "#fff", borderWidth: 1.1 },
          data: values,
        }],
      });
      window.__chinaRiskChart.on("click", params => {
        const shortName = params.data && params.data.shortName;
        const select = $("#serviceRegion");
        if (!select || !shortName) return;
        const option = Array.from(select.options).find(item => item.value === shortName || item.textContent === shortName);
        if (option) {
          select.value = option.value;
          selectedServiceIssue = 0;
          renderService();
        }
      });
    } catch (error) {
      target.innerHTML = `<div class="map-loading error">中国行政区地图加载失败，请刷新页面重试。</div>`;
      console.error(error);
    }
  }

  function renderService() {
    const s = data.serviceMarketing;
    if (!s) return;
    const state = serviceFilterState();
    const factor = serviceFactor(state);
    const rows = serviceProblemRows(factor);
    if (selectedServiceIssue >= rows.length) selectedServiceIssue = 0;
    const selected = rows[selectedServiceIssue] || serviceProblems[0];

    if (!serviceEventsBound) {
      document.addEventListener("click", event => {
        const cloudButton = event.target.closest("[data-cloud-tone]");
        if (cloudButton) {
          const container = cloudButton.closest(".radar-cloud-panel");
          container.querySelectorAll("[data-cloud-tone]").forEach(item => item.classList.toggle("active", item === cloudButton));
          container.querySelectorAll("[data-cloud-panel]").forEach(item => { item.hidden = item.dataset.cloudPanel !== cloudButton.dataset.cloudTone; });
          return;
        }
        const issueButton = event.target.closest("[data-service-issue]");
        if (!issueButton) return;
        selectedServiceIssue = Number(issueButton.dataset.serviceIssue) || 0;
        renderService();
      });
      $$("#serviceTime, #serviceSource, #serviceIssueDim, #serviceRegion, #serviceProduct, #serviceRisk").forEach(control => {
        control.addEventListener("change", () => {
          selectedServiceIssue = 0;
          renderService();
        });
      });
      serviceEventsBound = true;
    }

    const totalFeedback = Math.round((5535 + s.complaint.summary.total + 648) * factor);
    const internalTotal = Math.round((5535 + s.complaint.summary.total) * factor);
    const socialNegative = Math.round(648 * factor);
    const filterText = [state.time, state.source, state.dim, state.region, state.product, state.risk].join(" / ");

    $("#complaint").innerHTML = `
      <div class="data-status">内部热线：已接入，更新至 2026-05-21 23:59　在线客服：已接入　外卖评价：已接入　社媒数据：已接入；提示：部分社媒地域无法定位门店。</div>
      <div class="dashboard-head">
        <div>
          <div class="page-title"><span class="title-mark"></span>全渠道客诉监测总览</div>
          <p>先观察社媒、热线和在线客服的整体规模与情感走势，再进入重点问题归因。</p>
        </div>
        <div class="sample-note">当前筛选：${escapeHtml(filterText)}</div>
      </div>
      ${kpis([
        { label: "全渠道业务量", value: fmt(totalFeedback), note: "社媒 + 热线 + 在线客服" },
        { label: "社媒声量", value: fmt(Math.round(s.socialSame.summary.total * factor)), note: "微博 / 小红书 / 抖音 / 快手" },
        { label: "社媒负面声量", value: fmt(socialNegative), note: `负向率 ${percent(s.socialSame.summary.negativeRate)}` },
        { label: "热线声量 / 负面声量", value: `${fmt(Math.round(s.complaint.summary.hotline * factor))} / ${fmt(Math.round(s.complaint.summary.hotline * .743 * factor))}`, note: "总接入量与负向客诉量" },
        { label: "在线声量 / 负面声量", value: `${fmt(Math.round(s.complaint.summary.online * factor))} / ${fmt(Math.round(s.complaint.summary.online * .743 * factor))}`, note: "总会话量与负向会话量" },
      ])}
      <div class="section-label">全渠道规模与趋势</div>
      <div class="service-overview-grid">
        ${card("各平台规模与情感分布", channelSentimentChart(s))}
        ${card("全渠道业务量与负面趋势", allChannelTrend(s, factor), `<div class="card-tools"><span class="active">按小时</span><span>按天</span><span>按周</span></div>`)}
      </div>
      <div class="section-label">重点问题发现与归因</div>
      <div class="service-workbench">
        ${card("重点问题排行榜", table(["排名", "问题", "风险", "全渠道", "内部", "社媒", "外溢评分", "环比"], (rows.length ? rows : serviceProblems).map((item, index) => [
          index + 1,
          `<button class="link-btn" data-service-issue="${index}">${escapeHtml(item.issue)}</button>`,
          `<span class="badge ${item.risk === "P1" ? "red" : item.risk === "P2" ? "amber" : ""}">${escapeHtml(item.risk)}</span>`,
          `<strong>${fmt(item.total)}</strong>`,
          fmt(item.internal),
          fmt(item.social),
          `<strong>${item.score}</strong>`,
          item.change,
        ])))}
        ${card("当前问题摘要", serviceIssueSummary(selected))}
      </div>
      <div class="service-mid-grid">
        ${card("内外部来源拆解", sourceBreakdown(selected))}
        ${card("当前问题归因概览", serviceAttribution(selected))}
        ${card("产品 × 问题热力图", productIssueHeatmap(selected))}
        ${card("问题区域分布 TOP 榜", table(["排名", "区域", "全渠道", "内部", "社媒", "风险评分", "环比"], [
          ["1", "河南", "46", "5", "41", "86", "+52%"],
          ["2", "广东", "38", "7", "31", "79", "+35%"],
          ["3", "山东", "29", "5", "24", "73", "+28%"],
          ["4", "江苏", "21", "9", "12", "61", "+12%"],
          ["5", "浙江", "18", "6", "12", "58", "+9%"],
        ]) + `<p class="fine-note">社媒地域主要用于识别传播区域或用户属地，不直接等同于涉事门店。</p>`)}
      </div>
    `;

    $("#warning").innerHTML = `
      <div class="dashboard-head">
        <div>
          <div class="page-title"><span class="title-mark"></span>问题分析</div>
          <p>判断哪些问题正在从内部投诉变成外部舆情，哪些问题需要同步品牌、公关、产品或区域运营。</p>
        </div>
      </div>
      ${kpis([
        { label: "P1 高风险预警数", value: "8", note: "需要当天确认" },
        { label: "社媒外溢型问题数", value: "12", note: "社媒高、内部低" },
        { label: "内外共振型问题数", value: "5", note: "内部和外部同时升高" },
        { label: "强负向敏感问题数", value: "18", note: "食安 / 欺骗 / 异物" },
      ])}
      <div class="warning-grid">
        ${card("内外部风险四象限", warningQuadrant())}
        ${card("预警问题列表", table(["等级", "问题", "风险类型", "命中规则", "主要来源", "风险阶段"], serviceProblems.slice(0, 4).map((item, index) => [
          item.risk,
          `<button class="link-btn" data-service-issue="${index}">${escapeHtml(item.issue)}</button>`,
          item.type,
          index === 0 ? "互动突增 + 品质质疑" : index === 1 ? "食安标签 + 强负向" : "客诉量持续上升",
          item.platforms,
          ["快速上升", "内外共振", "持续高位", "跨平台扩散"][index],
        ])))}
      </div>
      <div class="warning-detail-head">
        <div><span>当前预警问题</span><strong>${escapeHtml(selected.issue)}</strong></div>
        <p>${escapeHtml(selected.judgement)}</p>
      </div>
      <div class="service-mid-grid">
        ${card("当前问题趋势走向", svgLine("warningTrend", [
          { name: "内部客诉", values: [12, 16, 20, 26, 38, 52, selected.internal], color: colors[0] },
          { name: "社媒负向", values: [7, 8, 12, 18, 26, 42, selected.social], color: colors[1] },
          { name: "互动指数", values: [18, 25, 22, 38, 48, 62, Math.round(selected.score)], color: colors[3] },
        ], ["D-6", "D-5", "D-4", "D-3", "D-2", "D-1", "今日"], 230))}
        ${card("归因模型结果", serviceAttribution(selected))}
        ${card("来源结构", sourceBreakdown(selected))}
        ${card("产品与问题归因", productIssueHeatmap(selected))}
      </div>
      <div class="full-section">${card("关键词与原声证据", serviceEvidence(selected))}</div>
    `;

    const region = serviceRegionMap();
    $("#serviceRegions").innerHTML = `
      <div class="dashboard-head">
        <div>
          <div class="page-title"><span class="title-mark"></span>区域分析</div>
          <p>从全国、区域、城市和门店维度辅助定位责任单元，并用原声证据支撑区域排查。</p>
        </div>
        <div class="sample-note">社媒地域为传播区域或用户属地参考，不直接等同于涉事门店。</div>
      </div>
      ${kpis([
        { label: "高风险区域数", value: "16", note: "风险指数高于阈值" },
        { label: "高风险门店数", value: "48", note: "需区域排查" },
        { label: "风险最高省份", value: "河南", note: "AB货 / 品质质疑" },
        { label: "环比增幅最高区域", value: "广东 +35%", note: "食安与异味问题上升" },
        { label: "内外共振问题数", value: "9", note: "客服与社媒同步升高" },
      ])}
      <div class="region-grid">
        ${card("全国区域风险地图", region.map)}
        ${card("区域风险排行榜", table(["排名", "区域", "风险指数", "内部", "社媒", "TOP 问题", "环比"], region.rows.map((row, index) => [
          index + 1, row[0], `<strong>${row[1]}</strong>`, fmt(row[2]), fmt(row[3]), row[4], row[5],
        ])))}
      </div>
      <div class="service-mid-grid">
        ${card("区域 × 问题热力图", `<div class="service-heatmap region-issue">
          <div></div>${["食安卫生", "产品体验", "包装打包", "配送履约", "服务售后", "品牌声誉", "订单履约"].map(x => `<strong>${x}</strong>`).join("")}
          ${["河南", "广东", "山东", "江苏", "浙江", "四川", "湖北", "湖南"].map((r, ri) => `<b>${r}</b>${[86, 78, 64, 58, 62, 91, 72].map((v, ci) => `<span style="background:rgba(22,135,255,${.12 + ((v + ri * 7 + ci * 3) % 50) / 70})">${(v + ri * 7 + ci * 3) % 100}</span>`).join("")}`).join("")}
        </div>`)}
        ${card("城市 / 门店明细表", table(["区域", "城市", "门店 / 点位", "问题", "来源", "反馈量", "强负向", "风险", "最近原声"], [
          ["河南", "郑州", "XX路店", "AB货 / 颜色差异", "抖音 / 外卖", "18", "9", "P1", "颜色完全不一样..."],
          ["广东", "广州", "XX广场店", "异味 / 清洁剂味", "热线 / 小红书", "12", "7", "P1", "柠檬水有怪味..."],
          ["山东", "济南", "XX大学店", "出餐慢", "在线客服", "25", "3", "P2", "等了半小时..."],
        ]))}
      </div>
      <div class="full-section">${card("区域关键词与原声证据", serviceEvidence(serviceProblems[0]))}</div>
    `;
  }

  function setupTabs() {
    $$(".tab").forEach(tab => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.target;
        $$(".tab").forEach(item => item.classList.toggle("active", item === tab));
        $$(".page").forEach(page => page.classList.toggle("active", page.id === target));
        document.body.classList.toggle("ai-tab-active", target === "aiInsights");
        if (target === "serviceRegions") {
          setTimeout(() => initChinaRiskMap(serviceRegionMap().rows), 80);
        }
      });
    });
  }

  function collectFilters() {
    const app = document.body.dataset.app;
    const filters = {};
    if (app === "delivery") {
      const platform = $("#filterPlatform")?.value;
      if (platform && platform !== "全部平台") filters["外卖平台"] = [platform];
      const region = $("#filterRegion")?.value;
      if (region && region !== "全国") filters["区域"] = region;
      const issue = $("#filterIssue")?.value;
      if (issue && issue !== "全部问题") filters["问题维度"] = [issue];
      const emotion = $("#filterEmotion")?.value;
      if (emotion && emotion !== "全部情感") filters["情感"] = [emotion];
      const time = $("#filterTime")?.value;
      if (time) filters["时间"] = time;
      const subject = $("#filterSubject")?.value;
      if (subject && subject !== "全部主体") filters["问题主体"] = subject;
    }
    if (app === "service") {
      const time = $("#serviceTime")?.value;
      if (time) filters["时间周期"] = time;
      const source = $("#serviceSource")?.value;
      if (source && source !== "全部") filters["平台"] = [source];
      const issueDim = $("#serviceIssueDim")?.value;
      if (issueDim && issueDim !== "全部维度") filters["问题维度"] = [issueDim];
      const region = $("#serviceRegion")?.value;
      if (region && region !== "全国") filters["区域"] = region;
    }
    return filters;
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupTabs();
    const app = document.body.dataset.app;
    if (app === "delivery") renderDelivery();
    if (app === "service") renderService();

    $$(".ai-report-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const template = btn.dataset.template;
        const filters = collectFilters();
        const aiTab = document.querySelector('.tab[data-target="aiInsights"]');
        if (aiTab) aiTab.click();
        const iframe = document.querySelector(".ai-embed-frame");
        if (!iframe) return;
        const send = () => {
          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage({ action: "openTemplate", template, filters }, "*");
          }
        };
        iframe.addEventListener("load", send);
        setTimeout(send, 300);
      });
    });
  });
})();
