Component({
  properties: {
    current: {
      type: String,
      value: "home"
    }
  },

  methods: {
    handleNavigate(event) {
      const page = event.currentTarget.dataset.page;

      if (!page || page === this.properties.current) {
        return;
      }

      wx.reLaunch({
        url: `/pages/${page}/${page}`
      });
    }
  }
});
