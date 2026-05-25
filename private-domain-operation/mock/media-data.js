const { clone } = require("./shared");

const courseMediaCatalog = {
  "player-ip-course": {
    coverUrl: "/assets/home/banner1.jpg",
    duration: "内容更新中",
    sourceLabel: "系列课",
    videoUrl: "",
    resourceState: "preparing"
  },
  "player-aigc-video": {
    coverUrl: "/assets/home/banner1.jpg",
    duration: "03:22",
    sourceLabel: "录播课程",
    videoUrl: "https://media.w3.org/2010/05/sintel/trailer.mp4",
    resourceState: "ready"
  },
  "player-wechat-game": {
    coverUrl: "/assets/home/banner2.jpg",
    duration: "项目演示",
    sourceLabel: "项目实战",
    videoUrl: "http://106.55.160.81:8080/wechat-plane-game.mov",
    resourceState: "ready"
  },
  "player-short-video": {
    coverUrl: "/assets/home/banner1.jpg",
    duration: "试看内容",
    sourceLabel: "会员试看",
    videoUrl: "",
    resourceState: "preview"
  },
  "player-circle-conversion": {
    coverUrl: "/assets/home/banner2.jpg",
    duration: "图文试看",
    sourceLabel: "图文内容",
    videoUrl: "",
    resourceState: "preview"
  }
};

const plannedCourseMediaSamples = [
  {
    id: "planned-ip-positioning",
    playerCourseId: "player-ip-course",
    title: "个人IP定位拆解",
    coverUrl: "/assets/home/banner1.jpg",
    duration: "待补充",
    videoUrl: "",
    resourceState: "planned"
  },
  {
    id: "planned-private-domain-funnel",
    playerCourseId: "player-ip-course",
    title: "私域转化路径设计",
    coverUrl: "/assets/home/banner2.jpg",
    duration: "待补充",
    videoUrl: "",
    resourceState: "planned"
  },
  {
    id: "planned-live-review-template",
    playerCourseId: "player-short-video",
    title: "直播复盘模板示例",
    coverUrl: "/assets/home/banner1.jpg",
    duration: "待补充",
    videoUrl: "",
    resourceState: "planned"
  }
];

function getCourseMedia(playerCourseId = "") {
  return clone(courseMediaCatalog[playerCourseId] || {
    coverUrl: "/assets/home/banner1.jpg",
    duration: "",
    sourceLabel: "录播课程",
    videoUrl: "",
    resourceState: "preparing"
  });
}

function getPlannedCourseMediaSamples() {
  return clone(plannedCourseMediaSamples);
}

module.exports = {
  getCourseMedia,
  getPlannedCourseMediaSamples
};
