"use strict";

window.MAZE_THEMES = Object.freeze({
    forest: Object.freeze({
        name: "Les",
        player: Object.freeze({
            image: "../../assets/images/bludiste/carrot.webp",
            fallback: "🥕",
            alt: "Mrkev"
        }),
        goal: Object.freeze({
            image: "../../assets/images/bludiste/rabbit.webp",
            fallback: "🐰",
            alt: "Zajíček"
        }),
        background: Object.freeze({
            image: "../../assets/images/bludiste/background.webp",
            fallbackColor: "#f8f1d4"
        }),
        walls: Object.freeze({
            image: "../../assets/images/bludiste/wall-texture.webp",
            color: "#245b3d",
            accentColor: "#173c33"
        }),
        trailColor: "#ef7d31",
        successColor: "#3b862f"
    })
});

window.MAZE_THEME = window.MAZE_THEMES.forest;
