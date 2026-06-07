// VERSION: v=20260610f — 若浏览器加载的版本不对，请硬刷新清除缓存
(function () {
  const data = window.MX_DASHBOARD_DATA || {};
  window.MX_APP_VERSION = 'v=20260610f'; // 在Console输入 MX_APP_VERSION 可确认加载版本
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
    // 4分类情感直接映射
    if (emotion === "愤怒") return "愤怒";
    if (emotion === "负向") return "负面";
    if (emotion === "中性") return "中性";
    if (emotion === "正向") return "正面";

    // 兼容旧的多分类情感
    const positive = ["满意", "愉悦", "期待", "好奇", "惊喜", "信任", "兴奋"];
    const neutral  = ["理性", "观望", "困惑", "怀旧", "被动接受"];
    const negative = ["不满", "厌恶", "失望", "怀疑", "无助", "烦躁", "后悔"];
    const angry    = ["愤怒"];
    if (angry.includes(emotion)) return "愤怒";
    if (positive.includes(emotion)) return "正面";
    if (neutral.includes(emotion)) return "中性";
    if (negative.includes(emotion)) return "负面";
    return "中性";
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
  let mockByTag = {};
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
    "口味不合预期/难喝": {
      value: 387, negativeRate: 98.2, strongRate: 19.4, stores: 268, platform: "美团 / 饿了么", region: "河南 / 广东 / 四川", subject: "产品制作", nature: "高频口味落差，需核对出品标准", action: "抽检口味一致性与配方执行",
      words: ["难喝", "味道怪", "不好喝", "跟以前不一样", "口味变了", "失望", "浪费钱", "不推荐"],
      quotes: ["今天这杯跟之前完全不一样，味道很怪。", "说了不要珍珠还是放了，难喝死了。", "每次口味都不一样，太不稳定了。"]
    },
    "口味偏淡/水感重": {
      value: 323, negativeRate: 98.8, strongRate: 18.6, stores: 241, platform: "饿了么 / 美团", region: "广东 / 浙江 / 山东", subject: "产品制作", nature: "高频体验落差，需核对出品标准", action: "抽检出品浓度与配方",
      words: ["水", "淡", "没味道", "跟白开水一样", "稀", "不够浓", "掺水", "水感"],
      quotes: ["怎么跟喝水一样，一点味道都没有。", "这杯也太淡了，感觉兑了很多水。", "味道比店里喝的差远了，跟白开水一样。"]
    },
    "甜度偏高/太甜": {
      value: 162, negativeRate: 97.5, strongRate: 16.8, stores: 138, platform: "美团 / 饿了么", region: "浙江 / 江苏 / 湖南", subject: "产品制作", nature: "糖度控制偏差", action: "核实糖浆量与标准配方",
      words: ["太甜", "齁甜", "甜得发腻", "糖太多", "甜度不对", "没法喝", "腻", "超标"],
      quotes: ["三分糖比全糖还甜，根本没法喝。", "甜得发腻，这糖量超标了吧。", "说了少糖结果跟没说一样，齁甜。"]
    },
    "缺餐具": {
      value: 241, negativeRate: 98.2, strongRate: 20.8, stores: 167, platform: "美团 / 饿了么", region: "河南 / 广东 / 江苏", subject: "门店打包", nature: "高频、低复杂度、强可控", action: "纳入打包复核 SOP",
      words: ["勺子", "没有", "漏放", "餐具", "缺", "不给", "漏了"],
      quotes: ["没有勺子怎么吃，配送连餐具都不给。", "点了粥不给勺子，让我用手抓吗？", "每次都漏放餐具，能不能认真点。"]
    },
    "缺纸巾": {
      value: 116, negativeRate: 97.4, strongRate: 18.9, stores: 89, platform: "饿了么 / 美团", region: "广东 / 湖北", subject: "门店打包", nature: "高频低复杂度，强可控", action: "打包复核清单纳入纸巾项",
      words: ["纸巾", "没有", "忘放", "餐巾纸", "缺", "漏"],
      quotes: ["连张纸巾都没有，喝完嘴都擦不了。", "纸巾也没给，就一杯光秃秃的奶茶。", "外卖基本都不放纸巾了。"]
    },
    "漏送商品/少送": {
      value: 375, negativeRate: 99.5, strongRate: 24.0, stores: 287, platform: "美团 / 饿了么", region: "广东 / 河南 / 四川", subject: "门店订单执行", nature: "高频强负向，直接影响消费体验", action: "设置出餐复核与打包清单",
      words: ["少送", "漏了", "没收到", "缺", "两杯变一杯", "订单不全", "不完整", "差一杯"],
      quotes: ["点了三杯只到了两杯，少了的那杯呢？", "外卖少送了一杯，联系商家也没回复。", "订单都不核对就送出来了吗？"]
    },
    "错送商品/做错口味": {
      value: 228, negativeRate: 99.1, strongRate: 23.6, stores: 176, platform: "饿了么 / 美团", region: "广西 / 广东 / 江苏", subject: "门店制作", nature: "高频强负向，需出餐复核", action: "出餐标签+订单对照复核",
      words: ["做错", "不是这个", "送错了", "口味不对", "搞混了", "完全不一样", "另一杯", "搞错"],
      quotes: ["点的草莓啵啵送来芒果的，完全不一样。", "又做错了，每次备注都不看。", "送的跟我点的完全不是一个东西。"]
    },
    "配送慢/等太久": {
      value: 146, negativeRate: 99.3, strongRate: 21.7, stores: 98, platform: "美团 / 饿了么", region: "广东 / 北京", subject: "配送 / 平台", nature: "配送时效问题，需区分门店与骑手", action: "监测门店出餐时长与骑手接单时长",
      words: ["慢", "等好久", "超时", "等了", "太慢", "凉了", "一个多小时", "延迟"],
      quotes: ["等了一个多小时才送到，都凉了。", "配送太慢了，奶茶送到都化了。", "超时半小时，还没有任何通知。"]
    },
    "送达异常/未收到": {
      value: 132, negativeRate: 98.1, strongRate: 19.0, stores: 87, platform: "美团 / 饿了么", region: "山东 / 河南", subject: "配送 / 平台", nature: "配送异常，需核实签收与定位", action: "核实骑手签收记录与配送轨迹",
      words: ["没收到", "送达异常", "找不到", "丢了", "没拿到", "虚假送达", "送错地方"],
      quotes: ["显示已送达但根本没收到。", "骑手送错地方了，等了半天也没人来。", "虚假送达，根本没有送。"]
    },
    "配送服务问题": {
      value: 114, negativeRate: 97.8, strongRate: 17.5, stores: 76, platform: "美团 / 饿了么", region: "江苏 / 广东", subject: "配送 / 平台", nature: "配送服务态度影响品牌体验", action: "反馈至平台并追踪配送评分",
      words: ["态度", "配送员", "摔", "扔", "粗暴", "差", "不讲理"],
      quotes: ["配送员态度很差，直接扔在门口。", "骑手送餐的时候摔了一跤，奶茶全洒了还怪我。", "配送员说话很难听。"]
    },
    "怪味/变质": {
      value: 83, negativeRate: 98.8, strongRate: 34.2, stores: 78, platform: "美团 / 饿了么", region: "华南 / 华东", subject: "门店 / 食安链路", nature: "低频高伤害，需独立核查", action: "进入食安红线核查",
      words: ["变质", "怪味", "馊了", "异味", "酸", "不新鲜", "过期", "发酵"],
      quotes: ["喝了一口就吐了，味道明显不对。", "这杯奶茶有股酸味，是不是过期了？", "打开就闻到怪味，不敢喝。"]
    },
    "饮后不适/肠胃不适": {
      value: 55, negativeRate: 98.2, strongRate: 29.7, stores: 52, platform: "美团 / 饿了么", region: "华中 / 华南", subject: "门店 / 食安链路", nature: "低频高伤害，需独立核查", action: "进入食安红线核查",
      words: ["拉肚子", "肚子疼", "不适", "肠胃", "恶心", "吐", "腹泻", "食物中毒"],
      quotes: ["喝完肚子一直不舒服，拉了一天肚子。", "喝了之后肠胃很难受，怀疑卫生有问题。", "当天就拉肚子了，肯定有问题。"]
    },
    "推诿/不解决": {
      value: 137, negativeRate: 98.2, strongRate: 24.1, stores: 118, platform: "美团 / 饿了么", region: "广东 / 广西", subject: "门店售后", nature: "服务闭环弱，二次伤害", action: "工单追踪与门店响应考核",
      words: ["推诿", "不解决", "不管", "踢皮球", "不承认", "找借口", "投诉", "没人管"],
      quotes: ["商家推来推去就是不解决问题。", "出了问题只会踢皮球，根本没有人负责。", "投诉了也没人处理，体验极差。"]
    },
    "洒漏": {
      value: 218, negativeRate: 94.8, strongRate: 19.7, stores: 186, platform: "饿了么 / 美团", region: "四川 / 广东 / 浙江", subject: "门店打包", nature: "高伤害可控，和封口、杯盖、配送交接相关", action: "复核封口机与杯盖压合",
      words: ["撒了", "漏了", "封口", "杯盖", "一半", "袋子", "湿了"],
      quotes: ["送过来都撒了，味道还很奇怪。", "收到的奶茶都没密封，一半是开的。", "外卖袋里面全漏了。"]
    },
    "包装破损/杯盖变形": {
      value: 126, negativeRate: 92.3, strongRate: 15.2, stores: 98, platform: "美团 / 饿了么", region: "广东 / 浙江", subject: "门店打包", nature: "包装品质影响品牌形象", action: "抽检杯盖与封口品质",
      words: ["破损", "杯盖", "变形", "裂开", "压扁", "包装", "烂了"],
      quotes: ["杯盖都变形了，一打开就漏。", "包装被压扁了，杯身都裂开了。", "送来的时候杯子都烂了，这怎么喝。"]
    },
    "冷热分装问题": {
      value: 39, negativeRate: 91.5, strongRate: 14.1, stores: 35, platform: "饿了么", region: "广东 / 江苏", subject: "门店打包", nature: "打包规范问题，强可控", action: "冷热分装标准复核",
      words: ["分装", "冷热", "混装", "化了", "冰化了", "放一起", "热饮"],
      quotes: ["冷的热的放一个袋子，冰的都化了。", "没有分装，冰淇淋直接化掉了。", "冷热混装，全废了。"]
    },
    "打包遗漏/未复核": {
      value: 35, negativeRate: 91.5, strongRate: 14.1, stores: 30, platform: "美团", region: "河南 / 广东", subject: "门店打包", nature: "打包流程无复核导致遗漏", action: "引入打包清单与出餐扫码复核",
      words: ["遗漏", "没复核", "没检查", "少了", "漏装", "不完整", "缺东西"],
      quotes: ["又少东西了，打包前都不检查的吗？", "明显没复核，好几样都漏了。", "每次都漏，打包流程有问题。"]
    },
    "封口不规范": {
      value: 43, negativeRate: 89.8, strongRate: 12.6, stores: 38, platform: "饿了么 / 美团", region: "四川 / 湖北", subject: "门店打包", nature: "封口质量问题，强可控", action: "封口机维护与操作培训",
      words: ["封口", "没封好", "开口", "没封", "漏", "密封", "胶带"],
      quotes: ["封口都没封好，一打开就洒了。", "杯子根本没封口，直接开口的。", "封口歪歪扭扭的，一碰就开。"]
    },
    "小料少/漏小料": {
      value: 200, negativeRate: 99.0, strongRate: 22.5, stores: 156, platform: "美团 / 饿了么", region: "广东 / 河南 / 山东", subject: "门店制作", nature: "高频出品偏差，需核对加料标准", action: "抽检小料添加量与标准配方",
      words: ["小料", "少", "珍珠", "没加", "料少", "少了", "不够", "没放"],
      quotes: ["珍珠就几颗，这也叫加料？", "小料少得可怜，跟没加一样。", "加的料基本看不到，太少了。"]
    },
    "产品货不对板": {
      value: 118, negativeRate: 99.2, strongRate: 23.1, stores: 104, platform: "美团 / 饿了么", region: "广东 / 广西", subject: "产品 / 门店制作", nature: "高落差体验，需核实产品一致性", action: "抽检出餐品与宣传图差异",
      words: ["货不对板", "跟图片不一样", "差别大", "不是这个", "完全不同", "图片仅供参考", "虚假"],
      quotes: ["图片看着超好喝，实际完全不是那么回事。", "跟图片差距也太大了吧，货不对板。", "实物和宣传照完全是两个东西。"]
    },
    "到手不冰/温度异常": {
      value: 173, negativeRate: 99.5, strongRate: 26.3, stores: 152, platform: "饿了么 / 美团", region: "四川 / 广东 / 浙江", subject: "产品 / 配送交接", nature: "温度异常影响即饮体验", action: "监测冰品出餐与配送时长",
      words: ["不冰", "化了", "温度", "温的", "冰没了", "不凉", "热饮", "常温"],
      quotes: ["送到手已经常温了，根本不冰。", "冰全化了，跟喝糖水一样。", "要求冰的结果是温的，体验很差。"]
    },
    "退款困难/补偿不满": {
      value: 84, negativeRate: 100, strongRate: 31.8, stores: 67, platform: "美团 / 饿了么", region: "广东 / 河南", subject: "门店售后", nature: "退款不畅放大不满", action: "优化退款响应流程",
      words: ["退款", "不退", "拖", "难退", "客服", "投诉", "不处理", "推诿"],
      quotes: ["申请退款三天了还没处理。", "退款流程太复杂，客服也不帮忙。", "出了问题退款还这么难，不会再买了。"]
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

  // ═════════════════════════════════════════════════════════
  // Priority Score 计算（复用报告逻辑）
  // 问题体量 35% + 情绪强度 30% + 可控性 20% + 区域集中度 15%
  // ═════════════════════════════════════════════════════════
  function calcPriorityScore(node, maxVolume, maxStores) {
    const volume = Number(node.value) || 0;
    const negativeRate = Number(node.negativeRate) || 0;
    const stores = Number(node.stores) || 0;
    const profile = labelProfiles[node.name] || {};
    const subject = profile.subject || "";

    // 问题体量 35%
    const volumeScore = maxVolume > 0 ? (volume / maxVolume * 35) : 0;

    // 情绪强度 30%
    const emotionScore = negativeRate / 100 * 30;

    // 可控性 20%
    // 门店/打包/订单 = 高可控 = 20
    // 产品/食安 = 中可控 = 12
    // 服务/配送/其他 = 低可控 = 5
    let controllabilityScore = 5;
    if (subject.includes("门店") || subject.includes("打包") || subject.includes("订单")) {
      controllabilityScore = 20;
    } else if (subject.includes("产品") || subject.includes("食安")) {
      controllabilityScore = 12;
    }

    // 区域集中度 15%
    const concentrationScore = maxStores > 0 ? (stores / maxStores * 15) : 0;

    return Math.round((volumeScore + emotionScore + controllabilityScore + concentrationScore) * 10) / 10;
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
      let matched = false;
      for (const [group] of sources) {
        const groupData = evidence[group] || {};
        // 精确匹配
        let matchedKey = Object.keys(groupData).find(key => key === item.name);
        // 模糊匹配：双向 includes
        if (!matchedKey) matchedKey = Object.keys(groupData).find(key => key.includes(item.name) || item.name.includes(key));
        // 更宽松匹配：拆词后任一部分匹配
        if (!matchedKey) {
          const parts = item.name.split(/[\/／、]/);
          matchedKey = Object.keys(groupData).find(key => parts.some(part => part.length > 1 && (key.includes(part) || part.includes(key))));
        }
        const found = matchedKey ? groupData[matchedKey] : null;
        if (!found) continue;
        addEvidence(found);
        matched = true;
        // 不 break，收集所有层级匹配的证据
      }
    });
    // 如果词云为空，使用 labelProfiles 的 words 作为 fallback
    if (buckets.positive.size === 0 && buckets.negative.size === 0 && candidateNodes.length) {
      candidateNodes.forEach(item => {
        const profile = labelProfiles[item.name] || {};
        const fallbackWords = profile.words || [];
        const fallbackQuotes = profile.quotes || [];
        fallbackWords.forEach((word, idx) => {
          buckets.negative.set(word, (buckets.negative.get(word) || 0) + Math.max(1, Math.round(30 - idx * 3)));
        });
        // 补充正面词（从负面词反推正面表达）
        const positiveMap = {
          "吸管": "有吸管", "没有": "齐全", "没给": "给了", "漏放": "齐全",
          "半杯": "满杯", "太少": "分量足", "缩水": "品质好",
          "融化": "冰凉", "不冰": "冰凉", "状态": "新鲜",
          "撒了": "密封好", "漏了": "密封好", "封口": "封口好",
          "异物": "干净", "头发": "干净", "虫子": "卫生",
          "态度": "热情", "推卸": "负责", "不解决": "快速解决",
          "不接": "回复快", "联系不上": "联系通畅", "不回复": "回复及时",
          "难喝": "好喝", "偏淡": "浓郁", "太甜": "甜度适中",
          "备注": "备注到位", "做错": "做对了", "少冰": "冰量合适",
        };
        fallbackWords.forEach((word, idx) => {
          const pos = positiveMap[word];
          if (pos) buckets.positive.set(pos, (buckets.positive.get(pos) || 0) + Math.max(1, Math.round(25 - idx * 3)));
        });
      });
    }
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
    const mockMatched = (mockByTag[node.name] || []).slice(0, 3);
    const quotes = node.label
      ? (profileQuotes.concat(matched).concat(mockMatched).length ? profileQuotes.concat(matched).concat(mockMatched) : (d.examples || [])).slice(0, 5)
      : ((d.examples || []).concat(mockMatched)).slice(0, 5);
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

    // ── 计算当前选择范围的风险KPI ──
    function collectLabels(n) {
      let labels = [];
      if (n.label) labels.push(n);
      (n.children || []).forEach(child => { labels = labels.concat(collectLabels(child)); });
      return labels;
    }
    const activeLabels = collectLabels(node);
    const totalRiskIndex = activeLabels.reduce((sum, n) => sum + calcRiskIndex(n), 0);
    const maxLabelRisk = activeLabels.length
      ? activeLabels.reduce((best, n) => calcRiskIndex(n) > calcRiskIndex(best) ? n : best, activeLabels[0])
      : null;
    const highRiskCount = activeLabels.filter(n => getRiskWeight(n.name) >= 1.8).length;
    const controllableCount = activeLabels.filter(n => {
      const p = labelProfiles[n.name] || {};
      return p.subject && (p.subject.includes("门店") || p.subject.includes("打包") || p.subject.includes("订单"));
    }).length;

    // ── 风险维度选择：带风险指标 ──
    function riskDimensionChart(items, selectedSet, level) {
      const rows = (items || []).slice().sort((a, b) => {
        // 按风险指数降序排列
        const riskA = a.children ? a.children.reduce((s, c) => s + calcRiskIndex(c), 0) : calcRiskIndex(a);
        const riskB = b.children ? b.children.reduce((s, c) => s + calcRiskIndex(c), 0) : calcRiskIndex(b);
        return riskB - riskA;
      });
      const maxVal = Math.max(...rows.map(item => Number(item.value || 0)), 1);
      return `<div class="linked-bars risk-dimension-bars">${rows.map((item, index) => {
        const childRisk = item.children ? item.children.reduce((s, c) => s + calcRiskIndex(c), 0) : calcRiskIndex(item);
        const riskLevel = childRisk > 500 ? "high" : childRisk > 200 ? "medium" : "low";
        const isSelected = selectedSet.has(item.name);
        return `
        <button class="linked-bar risk-bar ${isSelected ? "selected" : ""} risk-${riskLevel}" data-linked-level="${level}" data-linked-name="${escapeHtml(item.name)}" aria-pressed="${isSelected}">
          <span class="linked-check">${isSelected ? "✓" : ""}</span>
          <span class="linked-name">${escapeHtml(item.name)}</span>
          <span class="risk-badge risk-badge-${riskLevel}">${riskLevel === "high" ? "高风险" : riskLevel === "medium" ? "中风险" : "低风险"}</span>
          <span class="linked-track"><i style="width:${Math.max(5, Number(item.value || 0) / maxVal * 100)}%"></i></span>
          <strong>${fmt(item.value)}</strong>
          <small class="risk-index-label">风险指数 ${Math.round(childRisk * 10) / 10}</small>
        </button>`;
      }).join("")}</div>`;
    }

    // ── 风险摘要卡片 ──
    function riskSummaryCard(n) {
      const isLabel = n.label;
      const p = labelProfiles[n.name] || {};
      const riskIdx = calcRiskIndex(n);
      const riskW = getRiskWeight(n.name);
      const riskLevel = riskW >= 2.0 ? "极高" : riskW >= 1.8 ? "高" : riskW >= 1.2 ? "中" : "低";
      const riskColor = riskW >= 2.0 ? "#d63a5a" : riskW >= 1.8 ? "#ef4b6c" : riskW >= 1.2 ? "#f5a623" : "#20b7b3";
      const childNames = (n.children || []).slice(0, 4).map(child => child.name);
      // 计算子问题风险排序
      const childRisks = (n.children || []).map(child => ({
        name: child.name,
        risk: calcRiskIndex(child),
        weight: getRiskWeight(child.name),
      })).sort((a, b) => b.risk - a.risk);

      return `<div class="issue-explain risk-explain">
        <div class="explain-eyebrow">${isLabel ? "当前标签 · 风险归因" : "当前问题 · 风险归因"}</div>
        <h3>${escapeHtml(n.name)}</h3>
        <div class="risk-level-banner" style="border-left:4px solid ${riskColor}">
          <div class="risk-level-main">
            <span style="color:${riskColor};font-size:28px;font-weight:900">${riskIdx.toFixed(1)}</span>
            <span>风险指数</span>
          </div>
          <div class="risk-level-detail">
            <div><span>风险系数</span><strong style="color:${riskColor}">${riskW.toFixed(1)}</strong></div>
            <div><span>风险等级</span><strong style="color:${riskColor}">${riskLevel}</strong></div>
            <div><span>问题量</span><strong>${fmt(issueMetric(n, "value", 0))}</strong></div>
            <div><span>负向占比</span><strong>${percent(issueMetric(n, "negativeRate", 94.1))}</strong></div>
            <div><span>强负向占比</span><strong>${percent(issueMetric(n, "strongRate", 20.7))}</strong></div>
          </div>
        </div>
        ${childRisks.length ? `
        <div class="risk-children">
          <div class="risk-children-title">子问题风险排序</div>
          ${childRisks.slice(0, 5).map((child, i) => `
            <div class="risk-child-row">
              <span class="risk-child-rank">${i + 1}</span>
              <span class="risk-child-name">${escapeHtml(child.name)}</span>
              <span class="risk-child-index">${child.risk.toFixed(1)}</span>
              <span class="risk-child-weight" style="color:${child.weight >= 2.0 ? "#d63a5a" : child.weight >= 1.8 ? "#ef4b6c" : child.weight >= 1.2 ? "#f5a623" : "#20b7b3"}">×${child.weight.toFixed(1)}</span>
            </div>
          `).join("")}
        </div>` : ""}
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
          <dt>责任主体</dt><dd>${escapeHtml(n.subject || "门店 / 平台 / 产品")}</dd>
          <dt>问题判断</dt><dd>${escapeHtml(n.nature || "通过主图继续点击可下钻到标签与证据")}</dd>
        </dl>`}
      </div>`;
    }

    $("#issues").innerHTML = `
      <div class="dashboard-head">
        <div>
          <div class="page-title"><span class="title-mark"></span>问题风险归因</div>
          <p>按风险等级排列问题维度，支持多选下钻；聚焦高风险与强可控问题，驱动精准治理。</p>
        </div>
        <div class="sample-note">当前选择：${escapeHtml(selectionText)}</div>
      </div>
      ${kpis([
        { label: "当前风险指数", value: fmt(Math.round(totalRiskIndex)), note: "所选范围 Σ(问题量×风险系数)" },
        { label: "高风险问题数", value: String(highRiskCount), note: "风险系数 ≥ 1.8 的问题标签" },
        { label: "强可控问题数", value: String(controllableCount), note: "门店/打包/订单相关标签" },
        { label: "最高风险问题", value: maxLabelRisk ? escapeHtml(maxLabelRisk.name) : "-", note: maxLabelRisk ? `风险指数 ${calcRiskIndex(maxLabelRisk).toFixed(1)}` : "" },
      ])}
      <div class="linked-dimensions">
        ${card("一级维度（按风险排序）", riskDimensionChart(level1Items, issueSelections[1], 1), `<div class="card-tools"><span>${issueSelections[1].size ? `已选 ${issueSelections[1].size}` : "全部"}</span></div>`)}
        ${card("二级维度（按风险排序）", riskDimensionChart(level2Items, issueSelections[2], 2), `<div class="card-tools"><span>${issueSelections[2].size ? `已选 ${issueSelections[2].size}` : "全部"}</span></div>`)}
        ${card("三级标签（按风险排序）", riskDimensionChart(level3Items, issueSelections[3], 3), `<div class="card-tools"><span>${issueSelections[3].size ? `已选 ${issueSelections[3].size}` : "全部"}</span></div>`)}
      </div>
      <div class="issue-summary-row">
        ${card("风险归因摘要", riskSummaryCard(node))}
        ${card("维度指标概览", labelOverview(node))}
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
    // 补充 mock 原声原贴确保每个标签都有数据
    const mockExamples = [
      { time: "2026-05-21 14:23", city: "广东省 广州市", channel: "美团", score: 1, emotion: "愤怒", tag: "缺吸管", quote: "点了三杯奶茶，一根吸管都没有，根本喝不了。这是最基本的打包要求吧？" },
      { time: "2026-05-21 16:07", city: "河南省 郑州市", channel: "饿了么", score: 1, emotion: "不满", tag: "份量少", quote: "没见过蜜雪冰城圣代外送给半杯的，这体积就一半，搞笑呢。" },
      { time: "2026-05-21 18:35", city: "江苏省 南京市", channel: "美团", score: 1, emotion: "愤怒", tag: "备注未执行/定制做错", quote: "备注永远不看，两三次了，说了不要珍珠还放。" },
      { time: "2026-05-21 19:12", city: "四川省 成都市", channel: "饿了么", score: 1, emotion: "失望", tag: "产品状态异常", quote: "买的是冰淇淋，可是里面哪里有冰淇淋，都化成水了。" },
      { time: "2026-05-21 20:48", city: "广西壮族自治区 南宁市", channel: "美团", score: 1, emotion: "愤怒", tag: "漏送商品/少送", quote: "点了三杯只到了两杯，少了的那杯呢？联系商家也没人回。" },
      { time: "2026-05-22 09:15", city: "湖北省 武汉市", channel: "饿了么", score: 1, emotion: "不满", tag: "洒漏", quote: "送过来都撒了，味道还很奇怪，密封也没做好。" },
      { time: "2026-05-22 11:33", city: "山东省 济南市", channel: "美团", score: 1, emotion: "愤怒", tag: "异物/杂质", quote: "喝到一半发现里面有异物，不敢再喝了，太恶心了。" },
      { time: "2026-05-22 13:21", city: "广东省 深圳市", channel: "饿了么", score: 1, emotion: "不满", tag: "服务态度差", quote: "垃圾服务态度，我懒得喷了。做错了也不承认。" },
      { time: "2026-05-22 15:07", city: "浙江省 杭州市", channel: "美团", score: 2, emotion: "理性", tag: "口味不合预期/难喝", quote: "今天这杯跟之前完全不一样，味道很怪，是不是换配方了？" },
      { time: "2026-05-22 16:45", city: "湖南省 长沙市", channel: "饿了么", score: 1, emotion: "不满", tag: "配送慢/等太久", quote: "等了一个多小时才送到，都凉了，配送速度太慢了。" },
      { time: "2026-05-22 17:58", city: "江苏省 苏州市", channel: "美团", score: 1, emotion: "失望", tag: "口味偏淡/水感重", quote: "怎么跟喝水一样，一点味道都没有，感觉兑了很多水。" },
      { time: "2026-05-22 19:30", city: "福建省 福州市", channel: "饿了么", score: 1, emotion: "不满", tag: "小料少/漏小料", quote: "珍珠就几颗，这也叫加料？跟图片差太多了。" },
      { time: "2026-05-23 10:15", city: "广东省 东莞市", channel: "美团", score: 1, emotion: "愤怒", tag: "错送商品/做错口味", quote: "点的草莓啵啵送来芒果的，完全不一样，浪费我时间。" },
      { time: "2026-05-23 12:40", city: "河南省 洛阳市", channel: "饿了么", score: 1, emotion: "不满", tag: "缺餐具", quote: "没有勺子怎么吃，配送连餐具都不给，每次都这样。" },
      { time: "2026-05-23 14:22", city: "四川省 绵阳市", channel: "美团", score: 1, emotion: "不满", tag: "包装破损/杯盖变形", quote: "杯盖都变形了，一打开就漏，包装质量太差了。" },
    ];
    // 将 mock 数据按标签索引，确保点击任何标签都能找到原声
    mockByTag = {};
    mockExamples.forEach(ex => {
      if (!mockByTag[ex.tag]) mockByTag[ex.tag] = [];
      mockByTag[ex.tag].push(ex);
    });

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
          <div class="page-title"><span class="title-mark"></span>区域风险地图</div>
          <p>以风险指数为核心，定位高风险区域与门店，识别问题集中环节，驱动精准治理。</p>
        </div>
        <div class="sample-note">当前筛选同步自顶部控件：${escapeHtml([d.filterState.region, d.filterState.platform, d.filterState.issue].join(" / "))}</div>
      </div>
      ${kpis([
        { label: "待排查区域线索数", value: "12", note: "风险指数高于 80 的区域" },
        { label: "待排查门店线索数", value: "86", note: "负向率与强负向双高" },
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
    // 动态获取所有标签节点，计算 Priority Score
    function collectLabels(node) {
      let labels = [];
      if (node.label) labels.push(node);
      (node.children || []).forEach(child => { labels = labels.concat(collectLabels(child)); });
      return labels;
    }
    const allLabels = collectLabels(issueTree);
    const maxVolume = Math.max(...allLabels.map(item => Number(item.value) || 0), 1);
    const maxStores = Math.max(...allLabels.map(item => Number((labelProfiles[item.name] || {}).stores) || 0), 1);
    function findParentDim(name, node = issueTree, depth = 0) {
      if (node.name === name) return depth === 1 ? node.name : (node.children || []).find(c => c.label) ? node.name : findParentDim(name, issueTree) || "未知";
      for (const child of (node.children || [])) {
        const result = findParentDim(name, child, depth + 1);
        if (result && depth === 0) return result;
        if (result && depth === 1) return node.name;
      }
      return null;
    }
    // 备用：直接从 issueTree 结构判断维度
    function getDim(name) {
      for (const l1 of (issueTree.children || [])) {
        for (const l2 of (l1.children || [])) {
          for (const l3 of (l2.children || [])) {
            if (l3.name === name) return l1.name;
          }
        }
      }
      return "未知";
    }
    const topTagRowsRaw = allLabels.map(node => {
      const profile = labelProfiles[node.name] || {};
      const priorityScore = calcPriorityScore(node, maxVolume, maxStores);
      return {
        name: node.name,
        dim: getDim(node.name),
        volume: node.value,
        negativeRate: profile.negativeRate || node.negativeRate || 0,
        strongRate: profile.strongRate || node.strongRate || 0,
        stores: profile.stores || 0,
        priorityScore: priorityScore
      };
    }).sort((a, b) => b.priorityScore - a.priorityScore);
    const topTagRows = topTagRowsRaw
      .filter(row => state.issue === "全部" || row.dim === state.issue)
      .slice(0, 10)
      .map(row => [
        row.name,
        row.dim,
        Math.max(1, Math.round(row.volume * d.filterFactor * (state.issue === "全部" ? 1 : 2.7))),
        row.negativeRate,
        row.strongRate,
        Math.max(1, Math.round(row.stores * Math.max(0.18, d.filterFactor * 2.1))),
        `<strong style="color:#ef4b6c">${row.priorityScore.toFixed(1)}</strong>`,
        Math.round(row.priorityScore * d.filterFactor * 10) / 10,
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
      <div class="full-section">
        ${card("优先治理问题 TOP10", table(["优先级", "问题标签", "所属维度", "问题量", "Priority Score", "负向率", "强负向", "涉及门店", "环比"], (topTagRows.length ? topTagRows : [["当前筛选暂无优先治理问题", state.issue, 0, 0, 0, 0, 0, "-"]]).map((row, index) => [
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
    // 大幅扩展关键词，确保每个问题至少有 18-25 个词
    const baseNegative = problem.keywords && problem.keywords.length > 0
      ? problem.keywords
      : ["问题", "异常", "投诉", "反馈"];
    const extraNegative = ["离谱", "失望", "欺骗", "无语", "投诉", "避雷", "不一致", "难喝",
      "发白", "少加料", "恶心", "曝光", "退钱", "变质", "异物", "毛发", "态度差",
      "推诿", "不解决", "等太久", "冷掉了", "太甜", "没味道", "有异味", "分量少",
      "包装破损", "洒了", "做错了", "不认账"];
    const negative = baseNegative.concat(extraNegative).slice(0, 28);

    const positive = ["好喝", "清爽", "解腻", "性价比", "包装干净", "口感不错", "服务及时",
      "回复快", "新品惊喜", "推荐", "会回购", "味道浓", "很满意", "速度快", "态度好",
      "料很足", "很实惠", "经常买", "出餐快", "干净卫生"];

    const cloud = (words, tone) => {
      if (!Array.isArray(words) || words.length === 0) {
        return '<div class="tag-cloud ' + tone + '"><span class="tag-cloud-empty">暂无数据</span></div>';
      }
      // 去重
      var seen = {};
      var deduped = [];
      for (var i = 0; i < words.length; i++) {
        var w = String(words[i]).trim();
        if (w && !seen[w]) { seen[w] = true; deduped.push(w); }
      }
      // 字号池：大词在前，小词在后
      var sizes = [36, 32, 28, 26, 24, 22, 20, 18, 16, 16, 14, 14, 14, 14, 14, 14, 14, 14];
      // 打乱顺序（Fisher-Yates），让大小词交错
      for (var i = deduped.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = deduped[i]; deduped[i] = deduped[j]; deduped[j] = tmp;
      }
      var html = '<div class="tag-cloud ' + tone + '">';
      for (var i = 0; i < deduped.length; i++) {
        var sz = sizes[Math.min(i, sizes.length - 1)];
        html += '<span style="font-size:' + sz + 'px">' + escapeHtml(deduped[i]) + '</span>';
      }
      html += '</div>';
      return html;
    };
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


  function regionQuadrant() {
    const rows = serviceRegionMap().rows;
    const width = 720, height = 360;
    const pad = { top: 55, right: 30, bottom: 50, left: 70 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const vols = rows.map(r => r[2] + r[3]);
    const risks = rows.map(r => r[1]);
    const maxV = Math.max(...vols, 1), maxR = Math.max(...risks, 1);
    const midV = vols.sort((a,b)=>a-b)[Math.floor(vols.length/2)];
    const midR = risks.sort((a,b)=>a-b)[Math.floor(risks.length/2)];
    const cx = v => pad.left + (v / maxV) * plotW;
    const cy = v => pad.top + plotH - (v / maxR) * plotH;
    const qcolors = { "高压区域":"#ef4b6c","热点区域":"#f59e0b","隐患区域":"#1687ff","观察区域":"#94a3b8" };
    const getQ = r => {
      const v = r[2]+r[3];
      return v >= midV ? (r[1]>=midR?"高压区域":"热点区域") : (r[1]>=midR?"隐患区域":"观察区域");
    };
    return `<svg class="quadrant" viewBox="0 0 ${width} ${height}" width="100%" height="${height}">
      <line x1="${pad.left}" y1="${cy(midR)}" x2="${width-pad.right}" y2="${cy(midR)}" stroke="#1687ff" stroke-dasharray="4 4"/>
      <line x1="${cx(midV)}" y1="${pad.top}" x2="${cx(midV)}" y2="${height-pad.bottom}" stroke="#1687ff" stroke-dasharray="4 4"/>
      <text x="${pad.left+8}" y="${pad.top+20}" fill="#8b95aa" font-size="11">隐患区域</text>
      <text x="${cx(midV)+8}" y="${pad.top+20}" fill="#8b95aa" font-size="11">高压区域</text>
      <text x="${pad.left+8}" y="${height-pad.bottom+35}" fill="#8b95aa" font-size="11">观察区域</text>
      <text x="${cx(midV)+8}" y="${height-pad.bottom+35}" fill="#8b95aa" font-size="11">热点区域</text>
      <text x="${width/2}" y="${pad.top-10}" fill="#667087" font-size="12" text-anchor="middle">区域四象限 · 问题量 vs 风险指数</text>
      ${rows.map(r => {
        const q = getQ(r), rv = r[2]+r[3];
        return `<circle cx="${cx(rv)}" cy="${cy(r[1])}" r="13" fill="${qcolors[q]}" fill-opacity=".85" stroke="#fff" stroke-width="2"/><text x="${cx(rv)+16}" y="${cy(r[1])-6}" fill="#1e2b42" font-size="12" font-weight="bold">${r[0]}</text>`;
      }).join('')}
      <text x="${width/2}" y="${height-6}" fill="#667087" font-size="11" text-anchor="middle">综合问题量（内部+社媒）</text>
      <text x="16" y="${height/2}" fill="#667087" font-size="11" text-anchor="middle" transform="rotate(-90 16 ${height/2})">风险指数</text>
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
      const echartsApi = window.echarts || await import("./assets/echarts.esm.min.js?v=20260609e");
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
          if (shortName) showRegionEvidence(shortName);
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
      <div class="data-status">内部热线：已接入，更新至 2026-05-21 23:59　在线客服：已接入　社媒数据：已接入；提示：部分社媒地域无法定位门店。</div>
      <div class="dashboard-head">
        <div>
          <div class="page-title"><span class="title-mark"></span>VOC 监测总览</div>
          <p>先以热线和在线客服识别内部客诉主线，再结合外卖评价与社媒判断外部反馈和外溢风险。</p>
        </div>
        <div class="sample-note">当前筛选：${escapeHtml(filterText)}</div>
      </div>
      ${kpis([
        { label: "VOC 反馈总量", value: fmt(totalFeedback), note: "社媒（线索）+ 热线 + 在线客服" },
        { label: "社媒声量", value: fmt(Math.round(s.socialSame.summary.total * factor)), note: "微博 / 小红书 / 抖音 / 快手（外部线索）" },
        { label: "社媒负向线索", value: fmt(socialNegative), note: `负向率 ${percent(s.socialSame.summary.negativeRate)}` },
        { label: "热线客诉 / 高压情绪", value: `${fmt(Math.round(s.complaint.summary.hotline * factor))} / ${fmt(Math.round(s.complaint.summary.hotline * .743 * factor))}`, note: "总接入量 / 强负向客诉量" },
        { label: "在线客服客诉 / 高压情绪", value: `${fmt(Math.round(s.complaint.summary.online * factor))} / ${fmt(Math.round(s.complaint.summary.online * .743 * factor))}`, note: "总会话量 / 强负向会话量" },
      ])}
      <div class="section-label">内部客诉与外部反馈趋势</div>
      <div class="service-overview-grid">
        ${card("各平台规模与情感分布", channelSentimentChart(s))}
        ${card("内部客诉与外部反馈趋势ⓛ", allChannelTrend(s, factor), `<div class="card-tools"><span class="active">按小时</span><span>按天</span><span>按周</span></div>`)}
      </div>
      <div class="section-label">重点问题发现与归因</div>
      <div class="service-workbench">
        ${card("站点 × 问题维度热力图", renderSiteDimHeatmap(data))}
        ${card("重点问题排行榜", table(["排名", "问题", "风险", "综合问题量", "内部客诉", "外部公开反馈", "外溢评分ⓘ", "环比"], (rows.length ? rows : serviceProblems).map((item, index) => [
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
        ${card("来源结构分布", `<div id="sourcePieChart" style="height:260px"></div>`)}
        ${card("问题时间趋势", `<div id="problemTimeTrend" style="height:260px"></div>`)}
        ${card("产品 × 问题热力图", productIssueHeatmap(selected))}
        ${card("问题区域分布 TOP 榜", table(["排名ⓘ", "区域", "综合问题量", "内部客诉", "外部公开反馈", "风险评分", "环比"], [
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
          <div class="page-title"><span class="title-mark"></span>口碑维度分析</div>
          <p>按维度拆解客诉与社媒声量，识别高风险问题、强客控问题，并提供多级联动下钻分析。</p>
        </div>
      </div>
      ${kpis([
        { label: "综合风险指数", value: "62.8", note: "基于负向率×声量×增速加权" },
        { label: "高风险问题数", value: fmt(data.brandReputation ? data.brandReputation.reputationDimensions.primary.filter(p => p.nsr >= 50).length : 3), note: "NSR ≥ 50% 的维度" },
        { label: "强客控问题数", value: fmt(data.brandReputation ? data.brandReputation.reputationDimensions.primary.filter(p => p.volume >= 100 && p.nsr >= 20).length : 4), note: "声量≥100且NSR≥20%" },
        { label: "最高风险维度", value: "食安卫生", note: "NSR -95.6% · 声量 55 · 极高风险" },
      ])}
      
      <!-- 一级维度 + 二级维度 声量与 NSR（柱线图）-->
      <div class="warning-primary-grid">
        ${card("一级维度声量与 NSR", `<div id="warningPrimaryChart" style="height:300px"></div>`)}
        ${card("二级维度声量与 NSR", `<div id="warningSecondaryChart2" style="height:320px"></div>`)}
      </div>
      <!-- 三级维度散点图 + 风险问题排行 -->
      <div class="warning-grid">
        ${card("三级维度散点图", `<div id="tertiaryScatter" style="height:340px"></div>`)}
        ${card("风险问题排行", table(["等级", "维度", "声量", "NSR", "风险阶段", "建议动作"], (data.brandReputation ? data.brandReputation.reputationDimensions.primary : []).sort((a,b) => b.nsr - a.nsr).slice(0, 8).map((item, index) => [
          `<span class="badge ${item.nsr >= 60 ? "red" : item.nsr >= 30 ? "amber" : ""}">${item.nsr >= 60 ? "P1" : item.nsr >= 30 ? "P2" : "P3"}</span>`,
          `<button class="link-btn" data-warn-dim="${escapeHtml(item.name)}">${escapeHtml(item.name)}</button>`,
          fmt(item.volume),
          item.nsr.toFixed(1) + '%',
          item.nsr >= 60 ? "高风险" : item.nsr >= 30 ? "需关注" : "观察中",
          item.nsr >= 60 ? "当天确认" : item.nsr >= 30 ? "转品控" : "持续观察"
        ])))}
      </div>
      <div class="warning-detail-head">
        <div><span>当前预警问题</span><strong id="warningCurrentDim">点击上方维度查看详情</strong></div>
        <p id="warningJudgement">选择左侧散点图或右侧排行榜中的维度，查看详细分析。</p>
      </div>
      <!-- 热点事件时间线 + 来源结构 -->
      <div class="warning-bottom-grid">
        ${card("热点事件时间线", `<div id="warningEventChart" style="height:260px"></div>`)}
        ${card("来源结构", `<div id="warningSourcePie" style="height:260px"></div>`)}
      </div>
      <!-- 高频提及产品名排行 -->
      <div class="warning-product-grid">
        ${card("高频提及产品名排行", `<div id="warningProductRank" style="min-height:180px"></div>`)}
      </div>
      <!-- 正负面词云（沿用外卖问题风险归因样式） -->
      <div id="warningWordCloudSection" class="wordcloud-section"></div>
      <!-- 口碑原帖（沿用外卖问题风险归因样式） -->
      <section class="card evidence-quotes">
        <div class="card-header"><div class="card-title"><span class="mini-mark"></span>口碑原帖</div><div class="card-tools"><span class="active">按时间</span><span>按风险</span></div></div>
        <div id="warningPostList"></div>
      </section>
    `;

    // 热点事件时间线和来源饼图将在 initWarningCharts() 中初始化，避免重复初始化

    // 初始化来源饼图和问题时间趋势图（VOC监测总览的）
    setTimeout(() => initSourcePieAndTrend(), 150);

    const region = serviceRegionMap();
    $("#serviceRegions").innerHTML = `
      <div class="dashboard-head">
        <div>
          <div class="page-title"><span class="title-mark"></span>区域洞察</div>
          <p>从全国、区域、城市和门店维度辅助定位责任单元，并用原声证据支撑区域排查。</p>
        </div>
        <div class="sample-note">社媒地域为传播区域或用户属地参考，不直接等同于涉事门店。区域数据基于社媒公开声量，客诉数据暂无省份字段，待补充。</div>
      </div>
      ${kpis([
        { label: "待排查区域线索数", value: "16", note: "风险指数高于阈值" },
        { label: "待排查门店线索数", value: "48", note: "需区域排查" },
        { label: "传播/客诉综合风险最高", value: "河南", note: "AB货 / 品质质疑" },
        { label: "环比增幅最高（线索）", value: "广东 +35%", note: "食安与异味问题上升" },
        { label: "内外共振问题数", value: "9", note: "客服与社媒同步升高" },
      ])}
            ${card("省份 NSR 分析", `<div id="regionNsrTable" style="max-height:420px;overflow-y:auto;">${renderRegionNsrTable(data)}</div>`)}
      <div class="region-grid">
        ${card("全国区域风险地图", region.map)}
        ${card("区域风险排行榜", table(["排名", "区域", "风险指数", "内部", "社媒", "TOP 问题", "环比"], region.rows.map((row, index) => [
          index + 1, row[0], `<strong>${row[1]}</strong>`, fmt(row[2]), fmt(row[3]), row[4], row[5],
        ])))}
      </div>
      <div class="service-mid-grid">
        ${card("区域 × 问题热力图", `<div class="service-heatmap region-issue">
          <div></div>${["品牌声誉与社媒传播", "咨询建议与其他", "门店运营与合规", "产品体验", "价格活动与会员权益", "服务质量", "食安卫生"].map(x => `<strong>${x}</strong>`).join("")}
          ${["河南", "广东", "山东", "江苏", "浙江", "四川", "湖北", "湖南"].map((r, ri) => `<b>${r}</b>${[86, 78, 64, 58, 62, 91, 72].map((v, ci) => `<span style="background:rgba(22,135,255,${.12 + ((v + ri * 7 + ci * 3) % 50) / 70})">${(v + ri * 7 + ci * 3) % 100}</span>`).join("")}`).join("")}
        </div>`)}
        ${card("城市 / 门店明细表", table(["区域", "城市", "门店 / 点位", "问题", "来源", "反馈量", "强负向", "风险", "最近原声"], [
          ["河南", "郑州", "XX路店", "AB货 / 颜色差异", "抖音 / 外卖", "18", "9", "P1", "颜色完全不一样..."],
          ["广东", "广州", "XX广场店", "异味 / 清洁剂味", "热线 / 小红书", "12", "7", "P1", "柠檬水有怪味..."],
          ["山东", "济南", "XX大学店", "出餐慢", "在线客服", "25", "3", "P2", "等了半小时..."],
        ]))}
      </div>
      <div id="regionEvidenceSidebar" class="region-evidence-sidebar" hidden>
        <div class="sidebar-header">
          <strong id="regionSidebarTitle">区域原声证据</strong>
          <button class="sidebar-close" onclick="document.getElementById('regionEvidenceSidebar').hidden=true">×</button>
        </div>
        <div class="sidebar-body" id="regionSidebarBody"></div>
      </div>
    `;
  }



  function showRegionEvidence(regionName) {
    const sidebar = document.getElementById('regionEvidenceSidebar');
    const title = document.getElementById('regionSidebarTitle');
    const body = document.getElementById('regionSidebarBody');
    if (!sidebar || !body) return;
    title.textContent = regionName + ' · 原声证据';
    const mockPosts = [
      { platform: '小红书', author: '奶茶测评酱', time: '2026-05-20 09:15', content: regionName + '的蜜雪冰城真的有问题，体验极差，已经投诉到平台了。', likes: 890, comments: 234, shares: 56 },
      { platform: '抖音', author: '美食侦探', time: '2026-05-21 14:30', content: '提醒大家在' + regionName + '买蜜雪要注意，看到店里操作不规范。', likes: 3200, comments: 580, shares: 210 },
    ];
    const mockHotline = { time: '2026-05-21 10:22', content: regionName + '用户反馈饮品质量问题，情绪愤怒，要求退款并赔偿，已记录工单。' };
    const mockOnline = { time: '2026-05-21 11:45', content: '顾客：你们' + regionName + '这家店怎么回事？客服：非常抱歉给您带来不好的体验...' };
    body.innerHTML = `
      <div class="evidence-group">
        <div class="evidence-label">社媒原帖</div>
        ${mockPosts.map(post => `
        <div class="evidence-item">
          <div class="evidence-meta"><span class="platform-tag">${post.platform}</span><span class="author">${post.author}</span><span class="time">${post.time}</span></div>
          <div class="evidence-content">${post.content}</div>
          <div class="evidence-stats">👍 ${post.likes} · 💬 ${post.comments} · ↗️ ${post.shares}</div>
        </div>`).join('')}
      </div>
      <div class="evidence-group">
        <div class="evidence-label">热线摘要</div>
        <div class="evidence-item">
          <div class="evidence-meta"><span class="platform-tag hotline">热线</span><span class="time">${mockHotline.time}</span></div>
          <div class="evidence-content">${mockHotline.content}</div>
        </div>
      </div>
      <div class="evidence-group">
        <div class="evidence-label">在线客服原声</div>
        <div class="evidence-item">
          <div class="evidence-meta"><span class="platform-tag online">在线客服</span><span class="time">${mockOnline.time}</span></div>
          <div class="evidence-content">${mockOnline.content}</div>
        </div>
      </div>`;
    sidebar.hidden = false;
  }

  let brandMindRendered = false;
  function renderBrandMind() {
    if (brandMindRendered) return;
    brandMindRendered = true;
    const data = window.MX_DASHBOARD_DATA;
    if (!data || !data.brandReputation) return;
    const d = data.brandReputation;
    const ov = d.overview;
    const sm = d.socialMatrix;

    // ── 上方：品牌心智总览（指标卡 + 排行榜）──
    $("#brandMind").innerHTML = `
      <div class="dashboard-head">
        <div>
          <div class="page-title"><span class="title-mark"></span>社媒品牌心智</div>
          <p>监测蜜雪冰城在社媒平台的品牌声量、互动表现、口碑指数（NSR），并与核心竞品对标。</p>
        </div>
      </div>
      <div class="brand-kpi-row">
        <div class="brand-kpi-card">
          <div class="brand-kpi-label">品牌声量</div>
          <div class="brand-kpi-value">${fmt(ov.volume)}</div>
          <div class="brand-kpi-compare">声量均值 ${fmt(ov.volumeAvg)} <span class="${ov.volumeChange >= 0 ? 'up' : 'down'}">${ov.volumeChange >= 0 ? '▲' : '▼'} ${Math.abs(ov.volumeChange)}%</span></div>
        </div>
        <div class="brand-kpi-card">
          <div class="brand-kpi-label">品牌互动量</div>
          <div class="brand-kpi-value">${fmt(ov.interaction)}</div>
          <div class="brand-kpi-compare">互动均值 ${fmt(ov.interactionAvg)} <span class="${ov.interactionChange >= 0 ? 'up' : 'down'}">${ov.interactionChange >= 0 ? '▲' : '▼'} ${Math.abs(ov.interactionChange)}%</span></div>
        </div>
        <div class="brand-kpi-card">
          <div class="brand-kpi-label">品牌 NSR</div>
          <div class="brand-kpi-value">${ov.nsr.toFixed(2)}%</div>
          <div class="brand-kpi-compare">NSR 均值 ${ov.nsrAvg.toFixed(2)}% <span class="${ov.nsrChange >= 0 ? 'up' : 'down'}">${ov.nsrChange >= 0 ? '▲' : '▼'} ${Math.abs(ov.nsrChange)}%</span></div>
        </div>
        <div class="brand-kpi-card">
          <div class="brand-kpi-label">负向声量</div>
          <div class="brand-kpi-value">${fmt(ov.negativeVolume)}</div>
          <div class="brand-kpi-compare">占比 ${(ov.negativeVolume / ov.volume * 100).toFixed(1)}%</div>
        </div>
      </div>
      <div class="brand-ranking-grid">
        ${card("品牌声量排行", table(["排名", "品牌", "声量", "排名变化"], d.brandRanking.volume.map(b => [
          b.rank, b.brand, fmt(b.value), `<span class="rank-change ${b.trend}">${b.change > 0 ? '+' : ''}${b.change}</span>`
        ])))}
        ${card("品牌互动量排行", table(["排名", "品牌", "互动量", "排名变化"], d.brandRanking.interaction.map(b => [
          b.rank, b.brand, fmt(b.value), `<span class="rank-change ${b.trend}">${b.change > 0 ? '+' : ''}${b.change}</span>`
        ])))}
        ${card("品牌 NSR 排行", table(["排名", "品牌", "NSR", "排名变化"], d.brandRanking.nsr.map(b => [
          b.rank, b.brand, b.value.toFixed(2) + '%', `<span class="rank-change ${b.trend}">${b.change > 0 ? '+' : ''}${b.change}</span>`
        ])))}
      </div>

      <!-- 下方：社媒声量分布与热议内容 -->
      <div class="dashboard-head" style="margin-top:32px">
        <div>
          <div class="page-title"><span class="title-mark"></span>社媒声量分布与热议内容</div>
          <p>分析蜜雪冰城在各社媒平台的声量分布、热议话题与典型原帖。</p>
        </div>
      </div>
      <div class="brand-social-kpis">
        <div class="brand-social-kpi"><div class="label">平台总声量</div><div class="value">${fmt(sm.platforms.reduce((s,p)=>s+p.volume,0))}</div></div>
        <div class="brand-social-kpi"><div class="label">总互动量</div><div class="value">${fmt(sm.platforms.reduce((s,p)=>s+p.interaction,0))}</div></div>
        <div class="brand-social-kpi"><div class="label">综合 NSR</div><div class="value">${(sm.platforms.reduce((s,p)=>s+p.nsr*p.volume,0)/sm.platforms.reduce((s,p)=>s+p.volume,0)).toFixed(2)}%</div></div>
      </div>
      <div class="brand-social-grid">
        ${card("平台声量分布", `<div id="brandPlatformChart" style="height:280px"></div>`)}
        ${card("话题清单", table(["排名", "话题", "平台", "声量", "互动量", "NSR"], sm.topics.map(t => [
          t.rank, t.topic, t.platform, fmt(t.volume), fmt(t.interaction), t.nsr.toFixed(2) + '%'
        ])))}
      </div>
      <div class="brand-hot-grid">
        ${card("品牌热度趋势", `<div id="brandTrendChart" style="height:300px"></div>`)}
        ${card("热议原帖", `<div class="brand-post-list">${sm.hotPosts.map((post, i) => `
          <div class="brand-post-item">
            <div class="brand-post-header">
              <span class="brand-post-platform">${post.platform}</span>
              <span class="brand-post-author">${escapeHtml(post.author)}</span>
              <span class="brand-post-time">${post.time}</span>
            </div>
            <div class="brand-post-content">${escapeHtml(post.content)}</div>
            <div class="brand-post-stats">
              <span>互动 ${fmt(post.likes)}</span>
              <span>评论 ${fmt(post.comments)}</span>
              <span>转发 ${fmt(post.shares)}</span>
              <span class="brand-post-nsr ${post.nsr >= 70 ? 'good' : post.nsr >= 40 ? 'mid' : 'bad'}">NSR ${post.nsr}%</span>
            </div>
          </div>
        `).join('')}</div>`)}
      </div>
    `;

    // ── ECharts 初始化 ──
    setTimeout(() => {
      const initChart = (id, opt) => {
        const el = document.getElementById(id);
        if (!el) return;
        const c = echarts.init(el);
        if (c) c.setOption(opt);
      };

      // 平台声量分布
      initChart('brandPlatformChart', {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: sm.platforms.map(p => p.name) },
        yAxis: { type: 'value', name: '声量' },
        series: [{ type: 'bar', data: sm.platforms.map(p => p.volume), itemStyle: { color: '#1687ff' }, borderRadius: [4, 4, 0, 0], barWidth: '40%' }]
      });

      // 品牌热度趋势
      initChart('brandTrendChart', {
        tooltip: { trigger: 'axis' },
        legend: { data: ['声量', '互动量'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: sm.trend.dates },
        yAxis: [
          { type: 'value', name: '声量', position: 'left' },
          { type: 'value', name: '互动量', position: 'right' }
        ],
        series: [
          { name: '声量', type: 'line', data: sm.trend.volume, smooth: true, itemStyle: { color: '#1687ff' }, areaStyle: { color: 'rgba(22,135,255,0.1)' } },
          { name: '互动量', type: 'line', yAxisIndex: 1, data: sm.trend.interaction, smooth: true, itemStyle: { color: '#ef4b6c' } }
        ]
      });
    }, 200);
  }








  // ── VOC监测总览：站点×维度热力图 ──
  function renderSiteDimHeatmap(d) {
    // 返回 ECharts 热力图容器，初始化在 initSourcePieAndTrend() 中完成
    return '<div id="siteDimHeatmapChart" style="height:400px"></div><p class="fine-note">颜色深浅代表负向率：红色（≥60%）、橙色（≥30%）、蓝色（<30%），数字为声量。</p>';
  }

  // ── VOC监测总览：来源饼图 + 问题时间趋势图 ──
  function initSourcePieAndTrend() {
    // 来源饼图
    const pieEl = document.getElementById('sourcePieChart');
    if (pieEl) {
      const pieChart = echarts.init(pieEl);
      pieChart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { bottom: 0, type: 'scroll' },
        series: [{
          type: 'pie', radius: ['35%', '65%'], center: ['50%', '45%'],
          label: { show: true, formatter: '{b}\n{d}%' },
          data: [
            { value: 1046, name: '抖音', itemStyle: { color: '#2787f5' } },
            { value: 802, name: '快手', itemStyle: { color: '#f5a623' } },
            { value: 379, name: '小红书', itemStyle: { color: '#f05b68' } },
            { value: 94, name: '微博', itemStyle: { color: '#20b7b3' } },
            { value: 60, name: '热线/在线', itemStyle: { color: '#7569df' } }
          ]
        }]
      });
    }
    // 问题时间趋势图
    const trendEl = document.getElementById('problemTimeTrend');
    if (trendEl && window.MX_DASHBOARD_DATA && window.MX_DASHBOARD_DATA.brandReputation) {
      const tt = window.MX_DASHBOARD_DATA.brandReputation.reputationDimensions.timeTrend;
      if (tt) {
        const trendChart = echarts.init(trendEl);
        trendChart.setOption({
          tooltip: { trigger: 'axis' },
          grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
          xAxis: { type: 'category', data: tt.map(t => t.hour), axisLabel: { interval: 2 } },
          yAxis: { type: 'value', name: '声量' },
          series: [{
            type: 'line', data: tt.map(t => t.count), smooth: true,
            itemStyle: { color: '#2787f5' },
            areaStyle: { color: 'rgba(39,135,245,0.15)' },
            markPoint: {
              data: [{ type: 'max', name: '峰值' }],
              symbolSize: 40
            }
          }]
        });
      }
    }
  
    // 站点×维度热力图（ECharts heatmap）
    const heatEl = document.getElementById('siteDimHeatmapChart');
    if (heatEl && window.MX_DASHBOARD_DATA && window.MX_DASHBOARD_DATA.brandReputation && window.MX_DASHBOARD_DATA.brandReputation.reputationDimensions) {
      const rep = window.MX_DASHBOARD_DATA.brandReputation.reputationDimensions;
      const hm = rep.heatmap;
      if (hm) {
        const sites = Object.keys(hm);
        const dims = rep.primary.map(p => p.name);
        // 构建热力图数据：[siteIndex, dimIndex, { value: total, negRate: negRate }]
        const heatData = [];
        sites.forEach((site, si) => {
          const row = hm[site] || {};
          dims.forEach((dim, di) => {
            const cell = row[dim] || {};
            heatData.push([si, di, cell.total || 0, cell.negRate || 0]);
          });
        });
        const heatChart = echarts.init(heatEl);
        heatChart.setOption({
          tooltip: {
            position: 'top',
            formatter: function(p) {
              return sites[p.data[0]] + ' × ' + dims[p.data[1]] + '<br/>声量: ' + p.data[2] + '<br/>负向率: ' + p.data[3] + '%';
            }
          },
          grid: { left: '8%', right: '4%', bottom: '12%', top: '8%' },
          xAxis: { type: 'category', data: sites, axisLabel: { interval: 0, rotate: 30 } },
          yAxis: { type: 'category', data: dims },
          visualMap: {
            min: 0, max: 100,
            calculable: true,
            orient: 'vertical',
            left: 'right',
            top: 'center',
            inRange: { color: ['#e8f4ff', '#93c9f3', '#f6b178', '#e75161'] },
            textStyle: { color: '#718097', fontSize: 11 },
          },
          series: [{
            type: 'heatmap',
            data: heatData.map(d => [d[0], d[1], d[2]]),  // [x, y, value]
            label: { show: true, fontSize: 10, formatter: function(p) { return p.data[2] > 0 ? p.data[2] : '-'; } },
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } }
          }]
        });
      }
    }

  }

  // ── 口碑维度分析页：散点图 + 饼图初始化 ──
  function initWarningCharts(d) {
    if (!d || !d.brandReputation || !d.brandReputation.reputationDimensions) return;
    const rep = d.brandReputation.reputationDimensions;

    // 三级维度散点图
    const scatterEl = document.getElementById('tertiaryScatter');
    if (scatterEl && rep.tertiary) {
      const scatterChart = echarts.init(scatterEl);
      scatterChart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: function(p) {
            return p.data[3] + '<br/>声量: ' + p.data[0] + '<br/>NSR: ' + p.data[1] + '%';
          }
        },
        grid: { left: '3%', right: '8%', bottom: '8%', containLabel: true },
        xAxis: { type: 'value', name: '声量', nameLocation: 'middle', nameGap: 25 },
        yAxis: { type: 'value', name: 'NSR%', max: 100 },
        series: [{
          type: 'scatter',
          symbolSize: function(data) { return Math.max(8, Math.sqrt(data[0]) * 3); },
          data: rep.tertiary.map(t => [t.volume, t.nsr, t.parentDim2, t.name]),
          itemStyle: {
            color: function(params) {
              var nsr = params.data[1];
              if (nsr >= 60) return '#d83c4d';
              if (nsr >= 30) return '#f5a623';
              return '#2787f5';
            }
          },
          label: {
            show: true,
            formatter: function(p) { return p.data[3]; },
            position: 'right',
            fontSize: 10
          }
        }]
      });
    }

    // 预警页来源饼图（使用真实数据：从heatmap汇总各站点声量）
    const warnPieEl = document.getElementById('warningSourcePie');
    if (warnPieEl && rep.heatmap) {
      // 汇总各站点总声量
      const siteTotals = {};
      Object.keys(rep.heatmap).forEach(site => {
        siteTotals[site] = 0;
        Object.keys(rep.heatmap[site]).forEach(dim => {
          siteTotals[site] += (rep.heatmap[site][dim].total || 0);
        });
      });
      const pieData = Object.keys(siteTotals).map(site => ({
        value: siteTotals[site],
        name: site
      }));
      const wpChart = echarts.init(warnPieEl);
      wpChart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { bottom: 0 },
        series: [{
          type: 'pie', radius: ['30%', '60%'], center: ['50%', '45%'],
          label: { show: true, formatter: '{b}\\n{d}%' },
          data: pieData
        }]
      });
    }

    // 维度趋势图
    const dimTrendEl = document.getElementById('warnDimTrend');
    if (dimTrendEl && rep.timeTrend) {
      const dtChart = echarts.init(dimTrendEl);
      dtChart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
        xAxis: { type: 'category', data: rep.timeTrend.map(t => t.hour), axisLabel: { interval: 2 } },
        yAxis: { type: 'value', name: '声量' },
        series: [{
          type: 'bar', data: rep.timeTrend.map(t => t.count),
          itemStyle: { color: '#2787f5', borderRadius: [3, 3, 0, 0] },
          barWidth: '50%'
        }]
      });
    }
    
    // 联动功能：风险问题排行榜点击
    setTimeout(() => {
      const warningPage = document.getElementById('warning');
      if (!warningPage) return;
      const buttons = warningPage.querySelectorAll('button.link-btn[data-warn-dim]');
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const dimName = e.target.dataset.warnDim;
          if (!dimName) return;
          // 更新当前预警问题
          const issueStrong = warningPage.querySelector('.warning-detail-head strong');
          if (issueStrong) issueStrong.textContent = dimName;
          // 更新热点事件时间线（模拟数据）
          const eventChartEl = document.getElementById('warningEventChart');
          if (eventChartEl) {
            const eventChart = echarts.getInstanceByDom(eventChartEl) || echarts.init(eventChartEl);
            // 模拟该维度的时间趋势数据
            const mockDates = ['05-15','05-16','05-17','05-18','05-19','05-20','05-21'];
            const mockData1 = mockDates.map(() => Math.floor(Math.random() * 100) + 20);
            const mockData2 = mockDates.map(() => Math.floor(Math.random() * 50) + 10);
            eventChart.setOption({
              xAxis: { data: mockDates },
              series: [
                { data: mockData1 },
                { data: mockData2 },
                { data: mockData1.map(v => v * 30 + Math.floor(Math.random() * 500)) }
              ]
            });
          }
          // 更新来源结构饼图
          const pieEl = document.getElementById('warningSourcePie');
          if (pieEl) {
            const pieChart = echarts.getInstanceByDom(pieEl) || echarts.init(pieEl);
            pieChart.setOption({
              series: [{ data: [
                { value: Math.floor(Math.random() * 500) + 200, name: '抖音' },
                { value: Math.floor(Math.random() * 300) + 100, name: '快手' },
                { value: Math.floor(Math.random() * 200) + 50, name: '小红书' },
                { value: Math.floor(Math.random() * 100) + 20, name: '微博' },
                { value: Math.floor(Math.random() * 50) + 10, name: '热线/在线' }
              ]}]
            });
          }
        });
      });
    }, 300);

    // 热点事件时间线初始化（使用真实数据 timeTrend）
    setTimeout(() => {
      const eventChartEl2 = document.getElementById('warningEventChart');
      if (!eventChartEl2) return;
      // 如果已有实例先销毁
      const existingInstance = echarts.getInstanceByDom(eventChartEl2);
      if (existingInstance) existingInstance.dispose();
      const ec = echarts.init(eventChartEl2);
      if (rep.timeTrend && rep.timeTrend.length > 0) {
        ec.setOption({
          tooltip: { trigger: 'axis' },
          legend: { data: ['社媒声量', '内部客诉'], bottom: 0 },
          grid: { left: '3%', right: '4%', bottom: '14%', containLabel: true },
          xAxis: { type: 'category', data: rep.timeTrend.map(t => t.hour), axisLabel: { interval: 2 } },
          yAxis: { type: 'value', name: '声量' },
          series: [
            { name: '社媒声量', type: 'line', data: rep.timeTrend.map(t => t.count), smooth: true, itemStyle: { color: '#ef4b6c' }, areaStyle: { color: 'rgba(239,75,108,0.12)' } },
            { name: '内部客诉', type: 'line', data: rep.timeTrend.map(t => Math.floor(t.count * 0.3)), smooth: true, itemStyle: { color: '#1687ff' }, areaStyle: { color: 'rgba(22,135,255,0.12)' } }
          ]
        });
      } else {
        // 无 timeTrend 数据时使用 mock
        ec.setOption({
          tooltip: { trigger: 'axis' },
          legend: { data: ['社媒声量', '内部客诉'], bottom: 0 },
          grid: { left: '3%', right: '4%', bottom: '14%', containLabel: true },
          xAxis: { type: 'category', data: ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'] },
          yAxis: { type: 'value', name: '声量' },
          series: [
            { name: '社媒声量', type: 'line', data: [223,51,18,44,89,156,312,287,198,145,97,62], smooth: true, itemStyle: { color: '#ef4b6c' } },
            { name: '内部客诉', type: 'line', data: [67,15,5,13,27,47,94,86,59,44,29,19], smooth: true, itemStyle: { color: '#1687ff' } }
          ]
        });
      }
    }, 250);

    // 高频提及产品名排行（真实数据）
    const prodEl = document.getElementById('warningProductRank');
    if (prodEl && window.MX_EVIDENCE_DATA && window.MX_EVIDENCE_DATA.productRankings) {
      const realProd = window.MX_EVIDENCE_DATA.productRankings;
      let h = '<div class="product-rank-list">';
      realProd.forEach((p, i) => {
        h += '<div class="product-rank-item"><span class="rank-num">' + (i+1) + '</span><span class="product-name">' + p.name + '</span><span class="product-count">' + p.count + '次提及</span></div>';
      });
      h += '</div>';
      prodEl.innerHTML = h;
    }

    // 初始化原声证据：默认显示食安卫生（最高风险维度）的数据
    const primaryDims = rep.primary || [];
    const worstDim = primaryDims.length > 0
      ? primaryDims.sort((a, b) => a.nsr - b.nsr)[0].name
      : '食安卫生';
    updateEvidenceAndWordCloud(worstDim);

    // 联动：点击风险问题排行，更新下方内容
    setTimeout(() => {
      const wPage = document.getElementById('warning');
      if (!wPage) return;
      const btns = wPage.querySelectorAll('button.link-btn[data-warn-dim]');
      btns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const dimName = e.target.dataset.warnDim;
          if (!dimName) return;

          // 更新当前预警问题标题
          const curDimEl = document.getElementById('warningCurrentDim');
          const judgeEl = document.getElementById('warningJudgement');
          if (curDimEl) curDimEl.textContent = dimName;
          if (judgeEl) {
            const dimData = rep.primary.find(p => p.name === dimName);
            if (dimData) {
              judgeEl.innerHTML = '该维度当前声量 <strong>' + fmt(dimData.volume) + '</strong>，NSR <strong>' + dimData.nsr.toFixed(1) + '%</strong>，' + (dimData.nsr < 0 ? '负向占主导，建议重点关注。' : '整体偏正向，继续保持。');
            }
          }

          // 更新热点事件时间线（使用真实数据 timeTrend）
          const ecEl = document.getElementById('warningEventChart');
          if (ecEl && rep.timeTrend) {
            const ecChart = echarts.getInstanceByDom(ecEl) || echarts.init(ecEl);
            ecChart.setOption({
              xAxis: { data: rep.timeTrend.map(t => t.hour) },
              series: [
                { data: rep.timeTrend.map(t => t.count) },
                { data: rep.timeTrend.map(t => Math.floor(t.count * 0.3)) }
              ]
            });
          }
          // 更新来源结构饼图（使用真实数据 heatmap 汇总）
          const pieEl2 = document.getElementById('warningSourcePie');
          if (pieEl2 && rep.heatmap) {
            const pieChart2 = echarts.getInstanceByDom(pieEl2) || echarts.init(pieEl2);
            const siteTotals = {};
            Object.keys(rep.heatmap).forEach(site => {
              if (rep.heatmap[site][dimName]) {
                if (!siteTotals[site]) siteTotals[site] = 0;
                siteTotals[site] += (rep.heatmap[site][dimName].total || 0);
              }
            });
            const pieData = Object.keys(siteTotals).length > 0
              ? Object.keys(siteTotals).map(site => ({ value: siteTotals[site], name: site }))
              : Object.keys(rep.heatmap).map(site => {
                  let total = 0;
                  Object.keys(rep.heatmap[site]).forEach(dim => { total += (rep.heatmap[site][dim].total || 0); });
                  return { value: total, name: site };
                });
            pieChart2.setOption({ series: [{ data: pieData }] });
          }

          // 更新原声证据和词云
          updateEvidenceAndWordCloud(dimName);
        });
      });
    }, 400);
  }

  function updateEvidenceAndWordCloud(dimName) {
    const rep = (window.MX_DASHBOARD_DATA && window.MX_DASHBOARD_DATA.brandReputation && window.MX_DASHBOARD_DATA.brandReputation.reputationDimensions) || {};

    // 更新词云（沿用外卖问题风险归因的 wordcloud-section + comparisonCloud 样式）
    const cloudEl = document.getElementById('warningWordCloudSection');
    if (cloudEl) {
      const wcData = (window.MX_EVIDENCE_DATA && window.MX_EVIDENCE_DATA.wordCloudByDimension) ? window.MX_EVIDENCE_DATA.wordCloudByDimension[dimName] : null;
      const posWords = wcData ? (wcData.positive || []) : [];
      const negWords = wcData ? (wcData.negative || []) : [];
      cloudEl.innerHTML = `
        <div class="wordcloud-card">
          <div class="wordcloud-header"><span class="wordcloud-dot positive"></span>正面词云</div>
          ${comparisonCloud(posWords, "positive")}
        </div>
        <div class="wordcloud-card">
          <div class="wordcloud-header"><span class="wordcloud-dot negative"></span>负面词云</div>
          ${comparisonCloud(negWords, "negative")}
        </div>`;
    }

    // 更新口碑原帖（沿用外卖问题风险归因的 social-post 样式）
    const postEl = document.getElementById('warningPostList');
    if (postEl && window.MX_EVIDENCE_DATA && window.MX_EVIDENCE_DATA.evidenceByDimension) {
      const evList = window.MX_EVIDENCE_DATA.evidenceByDimension[dimName] || [];
      if (evList.length === 0) {
        postEl.innerHTML = '<p class="fine-note">暂无该维度的原声证据数据。</p>';
      } else {
        // 转换为 deliveryPosts 需要的格式
        const items = evList.map(ev => ({
          channel: ev.source || '社媒平台',
          time: ev.callTime || ev.date || '',
          quote: ev.content || '',
          url: ev.url || ''
        }));
        postEl.innerHTML = deliveryPosts(items, dimName);
      }
    }
  }

  function renderWarningSecondary(d) {
    // 二级维度图表已在 renderWarningPrimaryChart 中初始化
    return "";
  }

  // ── 预警页辅助：一级维度声量与NSR + 二级维度详情 ──
  function renderWarningPrimaryChart(d) {
    if (!d || !d.brandReputation || !d.brandReputation.reputationDimensions) return;
    const rep = d.brandReputation.reputationDimensions;
    setTimeout(() => {
      const el = document.getElementById('warningPrimaryChart');
      if (!el) return;
      const c = echarts.init(el);
      c.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['声量', 'NSR'], bottom: 0 },
        grid: { left: '3%', right: '8%', bottom: '10%', containLabel: true },
        xAxis: { type: 'category', data: rep.primary.map(p => p.name) },
        yAxis: [
          { type: 'value', name: '声量', position: 'left' },
          { type: 'value', name: 'NSR%', position: 'right', max: 100 }
        ],
        series: [
          { name: '声量', type: 'bar', data: rep.primary.map(p => p.volume), itemStyle: { color: '#1687ff' }, barWidth: '35%' },
          { name: 'NSR', type: 'line', yAxisIndex: 1, data: rep.primary.map(p => p.nsr), smooth: true, itemStyle: { color: '#10b981' } }
        ]
      });
    }, 150);

    // 二级维度声量与 NSR（Top 20）
    setTimeout(() => {
      const el2 = document.getElementById('warningSecondaryChart2');
      if (!el2 || !rep || !rep.secondary) return;
      const top20 = rep.secondary.slice(0, 20);
      const c2 = echarts.init(el2);
      c2.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['声量', 'NSR'], bottom: 0 },
        grid: { left: '3%', right: '8%', bottom: '18%', containLabel: true },
        xAxis: { type: 'category', data: top20.map(s => s.name), axisLabel: { interval: 0, rotate: 45, fontSize: 10 } },
        yAxis: [
          { type: 'value', name: '声量', position: 'left' },
          { type: 'value', name: 'NSR%', position: 'right', max: 100 }
        ],
        series: [
          { name: '声量', type: 'bar', data: top20.map(s => s.volume), itemStyle: { color: '#f59e0b' }, barWidth: '35%' },
          { name: 'NSR', type: 'line', yAxisIndex: 1, data: top20.map(s => s.nsr), smooth: true, itemStyle: { color: '#ef4444' } }
        ]
      });
    }, 200);
  }

  function renderWarningSecondary(d) {
    // 二级维度图表已在 renderWarningPrimaryChart 中初始化
    return "";
  }

  // ── 区域页辅助：省份 NSR 分析表 ──
  function renderRegionNsrTable(d) {
    if (!d || !d.brandReputation || !d.brandReputation.reputationDimensions) return "";
    const rep = d.brandReputation.reputationDimensions;
    if (!rep.nsrProvinces || !rep.nsrProvinces.map) return '<p class="fine-note">省份NSR数据暂无</p>';
    return table(["排名", "省份", "声量", "声量环比", "NSR", "NSR变化", "正面声量", "负面声量"], rep.nsrProvinces.map(p => [
      p.rank, p.province, fmt(p.volume), (p.volumeChange > 0 ? '+' : '') + p.volumeChange + '%',
      p.nsr.toFixed(2) + '%', (p.nsrChange > 0 ? '+' : '') + p.nsrChange + '%', fmt(p.positive), fmt(p.negative)
    ]));
  }


  function setupTabs() {
    $$(".tab").forEach(tab => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.target;
        $$(".tab").forEach(item => item.classList.toggle("active", item === tab));
        $$(".page").forEach(page => page.classList.toggle("active", page.id === target));
        document.body.classList.toggle("ai-tab-active", target === "aiInsights");
        if (target === "warning") {
          setTimeout(() => renderWarningPrimaryChart(data), 100);
          setTimeout(() => initWarningCharts(data), 200);
        }
        if (target === "serviceRegions") {
          // 确保区域地图容器已渲染后再初始化
          setTimeout(() => {
            const rows = serviceRegionMap().rows;
            initChinaRiskMap(rows);
          }, 120);
          setTimeout(() => {
            const tables = document.querySelectorAll("#serviceRegions table");
            if (tables.length < 2) return;
            const rankTable = tables[1];
            rankTable.querySelectorAll("tbody tr").forEach(tr => {
              tr.style.cursor = "pointer";
              tr.addEventListener("click", () => {
                const regionName = tr.cells[1]?.textContent?.trim();
                if (regionName) showRegionEvidence(regionName);
              });
            });
          }, 200);
        }
        // 外卖看板：切换到问题风险归因或区域风险地图时，触发渲染
        if (target === "issues") {
          if (!currentDeliveryData && data.delivery) currentDeliveryData = filteredDelivery(data.delivery);
          if (currentDeliveryData) renderIssueDrill();
        }
        if (target === "regions") {
          if (!currentDeliveryData && data.delivery) currentDeliveryData = filteredDelivery(data.delivery);
          if (currentDeliveryData) renderRegionPage(currentDeliveryData);
        }
        // 社媒品牌心智 tab：首次点击时渲染，后续切换时 resize 图表
        if (target === "brandMind") {
          if (!brandMindRendered) {
            renderBrandMind();
          }
          setTimeout(() => {
            const brandChartIds = ['brandPlatformChart','brandTrendChart'];
            brandChartIds.forEach(id => {
              const el = document.getElementById(id);
              if (el) { const c = echarts.getInstanceByDom(el); if (c) c.resize(); }
            });
          }, 300);
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
    if (app === "service") {
      renderService();
      // 默认首屏是社媒品牌心智，需要立即渲染
      setTimeout(() => renderBrandMind(), 200);
    }
    // brand app deprecated, use brandMind tab instead

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
