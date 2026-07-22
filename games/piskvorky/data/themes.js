(function (r) {
  r.TICTACTOE_THEME = {
    X: {
      image: "../../assets/images/piskvorky/cross.webp",
      fallback: "X",
      color: "#d32f2f",
      alt: "Červený křížek",
    },
    O: {
      image: "../../assets/images/piskvorky/circle.webp",
      fallback: "O",
      color: "#1565c0",
      alt: "Modré kolečko",
    },
    background: "../../assets/images/piskvorky/board-background.webp",
    victory: "../../assets/images/piskvorky/victory.webp",
  };
})(typeof window !== "undefined" ? window : globalThis);
