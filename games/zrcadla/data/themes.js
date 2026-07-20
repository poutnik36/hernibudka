(function (root) {
    "use strict";

    root.MIRROR_THEME = {
        flashlight: { image: "../../assets/images/zrcadla/flashlight.webp", fallback: "🔦", alt: "Baterka" },
        target: { image: "../../assets/images/zrcadla/target.webp", fallback: "⭐", alt: "Cíl" },
        mirror: {
            frontImage: "../../assets/images/zrcadla/mirror-front.webp",
            backImage: "../../assets/images/zrcadla/mirror-back.webp",
            fallbackFrontColor: "#bde8ff",
            fallbackBackColor: "#725847"
        },
        grid: { image: "../../assets/images/zrcadla/grid-background.webp", background: "#f3fbff" },
        beam: { image: "../../assets/images/zrcadla/beam-glow.webp", color: "#ffdf33", glow: "#ff8f00" },
        success: { image: "../../assets/images/zrcadla/success.webp", fallback: "✨" }
    };
})(typeof window !== "undefined" ? window : globalThis);
