const { getPlayerCourse } = require("../../mock/course-data");

Page({
  data: {
    currentBannerIndex: 0,
    bannerAutoplay: true,
    bannerList: [
      {
        id: "banner-1",
        src: "/assets/home/banner1.jpg"
      },
      {
        id: "banner-2",
        src: "/assets/home/banner2.jpg"
      }
    ],
    purchasedCourses: [
      {
        id: "owned-course-aigc",
        badge: "录播课",
        title: "AIGC 视频制作",
        meta: "可直接学习 · 03:22",
        action: "去学习",
        theme: "cyan",
        monogram: "AI"
      },
      {
        id: "owned-course-wechat-game",
        badge: "录播课",
        title: "微信小游戏开发",
        meta: "可直接学习 · 项目实战",
        action: "去学习",
        theme: "indigo",
        monogram: "WX"
      },
      {
        id: "owned-course-1",
        badge: "录播课",
        title: "个人 IP 内容变现实战课",
        meta: "已学 4 / 12 节",
        action: "继续看",
        theme: "purple",
        monogram: "IP"
      }
    ],
    recommendedCourses: [
      {
        id: "course-1",
        coverTheme: "cover-purple",
        tag: "系列课",
        title: "个人 IP 内容变现实战课",
        author: "Gerry",
        meta: "12 节课程 · 适合 0 到 1 搭建",
        price: "¥299",
        hint: "定位 / 选题 / 成交路径"
      },
      {
        id: "course-2",
        coverTheme: "cover-blue",
        tag: "视频课",
        title: "短视频表达与节奏训练",
        author: "Gerry",
        meta: "8 节课程 · 口播拍摄训练",
        price: "会员可学",
        hint: "口播结构 / 镜头状态 / 节奏感"
      },
      {
        id: "course-3",
        coverTheme: "cover-indigo",
        tag: "图文课",
        title: "朋友圈内容转化模型",
        author: "Gerry",
        meta: "6 节课程 · 图文成交训练",
        price: "¥129",
        hint: "内容铺垫 / 信任积累 / 转化动作"
      }
    ],
    featureCards: [
      {
        id: "feature-1",
        type: "camp",
        eyebrow: "训练营推荐",
        title: "7 天私域增长训练营",
        desc: "每天一个内容动作，沉淀可复用的私域运营节奏。",
        action: "查看详情"
      },
      {
        id: "feature-2",
        type: "live",
        eyebrow: "直播推荐",
        title: "今晚 20:00 私域运营直播答疑",
        desc: "聚焦内容变现、学员转化和日常运营问题。",
        action: "预约提醒"
      },
      {
        id: "feature-3",
        type: "member",
        eyebrow: "会员推荐",
        title: "年度会员计划",
        desc: "解锁录播课、训练营精选内容和直播回放权益。",
        action: "了解权益"
      }
    ]
  },

  getLiveEntry() {
    return {
      liveId: "live-private-domain-qa",
      mode: "upcoming"
    };
  },

  getPlayableCourseByOwnedId(ownedId) {
    const courseMap = {
      "owned-course-aigc": "player-aigc-video",
      "owned-course-wechat-game": "player-wechat-game"
    };

    return getPlayerCourse(courseMap[ownedId]);
  },

  onShow() {
    this.resumeBannerAutoplay();
  },

  onHide() {
    this.pauseBannerAutoplay();
  },

  onUnload() {
    this.pauseBannerAutoplay();
  },

  onSearchTap() {
    wx.showToast({
      title: "原型阶段暂不支持搜索",
      icon: "none"
    });
  },

  onViewAllOwned() {
    wx.reLaunch({
      url: "/pages/learning/learning"
    });
  },

  onOwnedCourseTap(event) {
    const { ownedId } = event.currentTarget.dataset;
    const targetCourse = this.getPlayableCourseByOwnedId(ownedId);

    if (targetCourse) {
      wx.navigateTo({
        url: `/pages/course-player/course-player?courseId=${encodeURIComponent(targetCourse.id)}`
      });
      return;
    }

    this.onViewAllOwned();
  },

  onCardTap(event) {
    const { courseId } = event.currentTarget.dataset;

    wx.navigateTo({
      url: `/pages/product-detail/product-detail?courseId=${encodeURIComponent(courseId)}`
    });
  },

  onFeatureTap(event) {
    const { label, featureType } = event.currentTarget.dataset;

    if (featureType === "camp") {
      wx.navigateTo({
        url: "/pages/bootcamp-detail/bootcamp-detail?campId=camp-7day-growth"
      });
      return;
    }

    if (featureType === "live") {
      const { liveId, mode } = this.getLiveEntry();

      wx.navigateTo({
        url: `/pages/live-detail/live-detail?liveId=${encodeURIComponent(liveId)}&mode=${encodeURIComponent(mode)}`
      });
      return;
    }

    wx.showToast({
      title: `${label}功能下一步接入`,
      icon: "none"
    });
  },

  onOpenLiveCenter() {
    wx.navigateTo({
      url: "/pages/live-list/live-list"
    });
  },

  onBannerChange(event) {
    this.setData({
      currentBannerIndex: event.detail.current
    });
  },

  pauseBannerAutoplay() {
    if (this.bannerAutoplayTimer) {
      clearTimeout(this.bannerAutoplayTimer);
      this.bannerAutoplayTimer = null;
    }

    this.setData({
      bannerAutoplay: false
    });
  },

  resumeBannerAutoplay() {
    if (this.bannerAutoplayTimer) {
      clearTimeout(this.bannerAutoplayTimer);
      this.bannerAutoplayTimer = null;
    }

    this.setData({
      bannerAutoplay: false
    });

    this.bannerAutoplayTimer = setTimeout(() => {
      this.setData({
        bannerAutoplay: true
      });
      this.bannerAutoplayTimer = null;
    }, 160);
  }
});
