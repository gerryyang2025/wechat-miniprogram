const { getDetailCourse } = require("../../mock/course-data");

Page({
  data: {
    product: getDetailCourse("course-1")
  },

  onLoad(options = {}) {
    const courseId = decodeURIComponent(options.courseId || "course-1");
    const product = getDetailCourse(courseId);

    this.setData({
      product
    });
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onPrimaryTap() {
    const { product } = this.data;

    if (product.primaryActionType === "learning") {
      wx.reLaunch({
        url: "/pages/learning/learning"
      });
      return;
    }

    wx.showToast({
      title: "购买流程后续接入",
      icon: "none"
    });
  },

  onSecondaryTap() {
    wx.navigateTo({
      url:
        `/pages/consultation/consultation?scene=course` +
        `&title=${encodeURIComponent(this.data.product.title)}`
    });
  }
});
