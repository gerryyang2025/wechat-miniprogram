Page({
  data: {
    metrics: [
      { label: "课程数", value: "6", note: "已发布 4 门" },
      { label: "训练营数", value: "2", note: "进行中 1 个" },
      { label: "直播场次", value: "5", note: "本周 2 场" },
      { label: "学习人数", value: "328", note: "近 7 日 +18" }
    ],
    todos: [
      {
        id: "todo-course",
        tag: "待发布",
        title: "完善《个人 IP 内容变现实战课》第 5 节课程说明",
        note: "建议补充学习目标与课后作业提示"
      },
      {
        id: "todo-live",
        tag: "待配置",
        title: "配置下一场直播的观看范围与回放说明",
        note: "需明确课程学员 / 训练营成员的观看权限"
      },
      {
        id: "todo-feedback",
        tag: "待处理",
        title: "查看最近新增的课程咨询与训练营反馈",
        note: "可优先处理 AIGC 视频制作相关问题"
      }
    ],
    shortcuts: [
      { key: "product", label: "商品管理", hint: "课程 / 训练营 / 会员" },
      { key: "live", label: "直播管理", hint: "直播配置 / 回放说明" },
      { key: "user", label: "用户管理", hint: "学员 / 标签 / 跟进" },
      { key: "content", label: "内容运营", hint: "Banner / 推荐位 / 公告" }
    ],
    activities: [
      {
        id: "activity-1",
        title: "AIGC 视频制作已更新到课程推荐区",
        time: "今天 10:20",
        note: "首页已展示为已购课程与课程推荐示例。"
      },
      {
        id: "activity-2",
        title: "私域运营直播答疑回放状态已完善",
        time: "昨天 21:40",
        note: "直播列表、详情页和直播间已补充回放重点片段提示。"
      },
      {
        id: "activity-3",
        title: "训练营详情页公告区已上线原型",
        time: "昨天 16:05",
        note: "支持展示最新公告、打卡进度和课表预览。"
      }
    ]
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onShortcutTap(event) {
    const { label } = event.currentTarget.dataset;

    if (label === "商品管理") {
      wx.navigateTo({
        url: "/pages/product-management/product-management"
      });
      return;
    }

    if (label === "直播管理") {
      wx.navigateTo({
        url: "/pages/live-management/live-management"
      });
      return;
    }

    if (label === "用户管理") {
      wx.navigateTo({
        url: "/pages/user-management/user-management"
      });
      return;
    }

    if (label === "内容运营") {
      wx.navigateTo({
        url: "/pages/content-ops/content-ops"
      });
      return;
    }

    wx.showToast({
      title: `${label}下一步接入`,
      icon: "none"
    });
  },

  onTodoTap(event) {
    const { title } = event.currentTarget.dataset;

    wx.showToast({
      title,
      icon: "none"
    });
  }
});
