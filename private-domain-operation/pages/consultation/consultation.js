const {
  appendConsultationDraft,
  getConsultationPageData,
  getConsultationSubmitFeedback,
  normalizeConsultationDraft
} = require("../../mock/service-data");
const { parseConsultationOptions } = require("../../utils/navigation");

Page({
  data: getConsultationPageData(),

  onLoad(options = {}) {
    const { scene, title: targetTitle } = parseConsultationOptions(options);

    this.setData(getConsultationPageData(scene, targetTitle));
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1
    });
  },

  onQuickQuestionTap(event) {
    const { question } = event.currentTarget.dataset;

    this.setData({
      draftMessage: appendConsultationDraft(this.data.draftMessage, question)
    });
  },

  onInputChange(event) {
    this.setData({
      draftMessage: normalizeConsultationDraft(event.detail.value)
    });
  },

  onSubmitTap() {
    const feedback = getConsultationSubmitFeedback(this.data.scene, this.data.targetTitle);

    wx.showToast({
      title: feedback.title,
      icon: "none"
    });
  }
});
