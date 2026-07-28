(function (root, factory) {
  const data = factory();
  if (typeof module === "object" && module.exports) module.exports = data;
  root.DrawingThemes = data;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  return {
    default: {
      name: "Malířská dílna",
      icons: { brush: "🖌️", clock: "⏳", trophy: "🏆", palette: "🎨" },
      images: { palette: "", brush: "", clock: "", trophy: "" }
    }
  };
});
