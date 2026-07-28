(function (root) {
  "use strict";
  root.WORD_BOMB_THEME = {
    bomb: {
      image: "../../assets/images/slovni-bombicka/bomb.webp",
      fallback: "💣",
      alt: "Veselá časovaná bombička",
    },
    spark: {
      image: "../../assets/images/slovni-bombicka/spark.webp",
      fallback: "✨",
      alt: "Jiskra",
    },
    explosion: {
      image: "../../assets/images/slovni-bombicka/explosion.webp",
      fallback: "💥",
      alt: "Barevný výbuch",
    },
    background: {
      image: "../../assets/images/slovni-bombicka/background.webp",
      fallbackColor: "#eef8d8",
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
