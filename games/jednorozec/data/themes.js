(function (root) {
    "use strict";

    root.UNICORN_THEME = {
        player: {
            idleImage: "../../assets/images/jednorozec/unicorn.webp",
            flapUpImage: "../../assets/images/jednorozec/unicorn-wing-up.webp",
            flapDownImage: "../../assets/images/jednorozec/unicorn-wing-down.webp",
            fallback: "🦄",
            alt: "Létající jednorožec"
        },
        cloud: {
            images: [
                "../../assets/images/jednorozec/cloud.webp",
                "../../assets/images/jednorozec/cloud-variant-2.webp"
            ],
            fallback: "☁️",
            alt: "Obláček"
        },
        background: {
            image: "../../assets/images/jednorozec/background.webp",
            fallbackColors: ["#8ed8ff", "#f6c9ff"]
        }
    };
})(typeof window !== "undefined" ? window : globalThis);
