const { getConsultationPageData } = require("../../mock/service-data");

function decodeValue(value = "") {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

Page({
  data: getConsultationPageData(),

  onLoad(options = {}) {
    const scene = decodeValue(options.scene || "profile");
    const targetTitle = decodeValue(options.title);

    this.setData(getConsultationPageData(scene, targetTitle));
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onQuickQuestionTap(event) {
    const { question } = event.currentTarget.dataset;
    const { draftMessage } = this.data;

    this.setData({
      draftMessage: draftMessage ? `${draftMessage}\n${question}` : question
    });
  },

  onInputChange(event) {
    this.setData({
      draftMessage: event.detail.value
    });
  },

  onSubmitTap() {
    wx.showToast({
      title: this.data.submitTitle,
      icon: "none"
    });
  }
});
