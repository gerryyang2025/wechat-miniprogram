const { clone } = require("./shared");

const bootcampCatalog = {
  "camp-7day-growth": {
    id: "camp-7day-growth",
    title: "7 天私域增长训练营",
    subtitle: "7 天建立内容分发、社群互动和转化动作的基础节奏",
    status: "进行中 · Day 2 / 7",
    coverTheme: "camp-cover",
    coverHint: "内容分发 / 社群互动 / 转化动作",
    description:
      "这是一套偏实战型的私域训练营，按照每天一个主题动作推进，帮助你在一周内搭建起基础的内容经营节奏和社群转化意识。",
    suitable: ["内容型创业者", "教培讲师", "私域初学者", "需要陪跑节奏的人"],
    support: ["每日任务拆解", "打卡反馈", "训练营公告同步", "示例作业参考"],
    progress: {
      completedDays: 2,
      totalDays: 7,
      streakText: "已连续完成 2 天"
    },
    todayFocus: {
      dayLabel: "Day 2 今日任务",
      title: "朋友圈内容拆解与发布",
      desc: "完成 1 条朋友圈内容拆解，输出自己的改写版本，并在晚上 21:00 前提交打卡。",
      tasks: [
        "观看示例短课：朋友圈内容结构拆解",
        "完成 1 条朋友圈内容改写",
        "在训练营内提交今日打卡"
      ]
    },
    schedule: [
      {
        day: "Day 1",
        title: "个人定位与内容边界",
        status: "已完成"
      },
      {
        day: "Day 2",
        title: "朋友圈内容拆解与发布",
        status: "进行中"
      },
      {
        day: "Day 3",
        title: "社群互动与提问设计",
        status: "待开始"
      },
      {
        day: "Day 4",
        title: "转化话术与成交提醒",
        status: "待开始"
      }
    ],
    notices: [
      "今日打卡截止时间为 21:00，请在训练营内完成提交。",
      "晚间会同步发布优秀作业参考，便于对照调整。"
    ]
  }
};

function getBootcamp(campId = "camp-7day-growth") {
  return clone(bootcampCatalog[campId] || bootcampCatalog["camp-7day-growth"]);
}

module.exports = {
  getBootcamp
};
