(function (root) {
  root.SNAKE_THEME = {
    head: {
      image: "../../assets/images/had/head.webp",
      fallbackColor: "#1b5e20",
    },
    body: {
      image: "../../assets/images/had/body.webp",
      fallbackColor: "#66bb6a",
    },
    tail: {
      image: "../../assets/images/had/tail.webp",
      fallbackColor: "#a5d66a",
    },
    food: {
      image: "../../assets/images/had/food.webp",
      fallback: "●",
      fallbackColor: "#e53935",
    },
    bonusFood: {
      image: "../../assets/images/had/bonus-food.webp",
      fallback: "★",
      fallbackColor: "#ffb300",
    },
    obstacle: {
      image: "../../assets/images/had/obstacle.webp",
      fallbackColor: "#6d4c41",
    },
    background: {
      image: "../../assets/images/had/background.webp",
      fallbackColor: "#e7f5d1",
    },
    gameOver: { image: "../../assets/images/had/game-over.webp" },
  };
})(typeof window !== "undefined" ? window : globalThis);
