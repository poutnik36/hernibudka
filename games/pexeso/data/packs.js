(function (root) {
    "use strict";

    const item = (folder, id, label, fallback) => ({
        id,
        label,
        image: `../../assets/images/pexeso/${folder}/${id}.webp`,
        fallback,
        alt: label
    });

    root.MEMORY_PACKS = {
        animals: {
            id: "animals", title: "Zvířata", icon: "🐾",
            cards: [
                item("animals", "cat", "Kočka", "🐱"), item("animals", "dog", "Pes", "🐶"),
                item("animals", "mouse", "Myš", "🐭"), item("animals", "rabbit", "Králík", "🐰"),
                item("animals", "fox", "Liška", "🦊"), item("animals", "bear", "Medvěd", "🐻"),
                item("animals", "panda", "Panda", "🐼"), item("animals", "frog", "Žába", "🐸"),
                item("animals", "lion", "Lev", "🦁"), item("animals", "tiger", "Tygr", "🐯"),
                item("animals", "cow", "Kráva", "🐮"), item("animals", "pig", "Prasátko", "🐷"),
                item("animals", "monkey", "Opice", "🐵"), item("animals", "chicken", "Slepice", "🐔"),
                item("animals", "penguin", "Tučňák", "🐧"), item("animals", "owl", "Sova", "🦉"),
                item("animals", "elephant", "Slon", "🐘"), item("animals", "giraffe", "Žirafa", "🦒")
            ]
        },
        fairyTales: {
            id: "fairyTales", title: "Pohádkové motivy", icon: "✨",
            cards: [
                item("fairy-tales", "dragon", "Drak", "🐉"), item("fairy-tales", "princess", "Princezna", "👸"),
                item("fairy-tales", "prince", "Princ", "🤴"), item("fairy-tales", "castle", "Hrad", "🏰"),
                item("fairy-tales", "fairy", "Víla", "🧚"), item("fairy-tales", "elf", "Skřítek", "🧝"),
                item("fairy-tales", "wizard", "Kouzelník", "🧙"), item("fairy-tales", "mermaid", "Mořská panna", "🧜"),
                item("fairy-tales", "unicorn", "Jednorožec", "🦄"), item("fairy-tales", "crown", "Koruna", "👑"),
                item("fairy-tales", "key", "Kouzelný klíč", "🗝️"), item("fairy-tales", "crystal", "Drahokam", "💎"),
                item("fairy-tales", "wand", "Kouzelná hůlka", "🪄"), item("fairy-tales", "book", "Kniha kouzel", "📖"),
                item("fairy-tales", "shield", "Štít", "🛡️"), item("fairy-tales", "sword", "Meč", "⚔️"),
                item("fairy-tales", "potion", "Kouzelný lektvar", "🧪"), item("fairy-tales", "treasure", "Poklad", "🪙")
            ]
        },
        vehicles: {
            id: "vehicles", title: "Dopravní prostředky", icon: "🚦",
            cards: [
                item("vehicles", "car", "Auto", "🚗"), item("vehicles", "taxi", "Taxi", "🚕"),
                item("vehicles", "bus", "Autobus", "🚌"), item("vehicles", "trolleybus", "Trolejbus", "🚎"),
                item("vehicles", "race-car", "Závodní auto", "🏎️"), item("vehicles", "police-car", "Policejní auto", "🚓"),
                item("vehicles", "ambulance", "Sanitka", "🚑"), item("vehicles", "fire-engine", "Hasičské auto", "🚒"),
                item("vehicles", "truck", "Nákladní auto", "🚚"), item("vehicles", "tractor", "Traktor", "🚜"),
                item("vehicles", "scooter", "Koloběžka", "🛴"), item("vehicles", "bicycle", "Jízdní kolo", "🚲"),
                item("vehicles", "motorcycle", "Motorka", "🏍️"), item("vehicles", "train", "Vlak", "🚆"),
                item("vehicles", "tram", "Tramvaj", "🚋"), item("vehicles", "airplane", "Letadlo", "✈️"),
                item("vehicles", "helicopter", "Vrtulník", "🚁"), item("vehicles", "boat", "Loď", "⛵")
            ]
        },
        professions: {
            id: "professions", title: "Povolání", icon: "🧑‍🔧",
            cards: [
                item("professions", "doctor", "Lékař", "🧑‍⚕️"), item("professions", "firefighter", "Hasič", "🧑‍🚒"),
                item("professions", "police", "Policista", "👮"), item("professions", "teacher", "Učitel", "🧑‍🏫"),
                item("professions", "cook", "Kuchař", "🧑‍🍳"), item("professions", "farmer", "Farmář", "🧑‍🌾"),
                item("professions", "mechanic", "Mechanik", "🧑‍🔧"), item("professions", "scientist", "Vědec", "🧑‍🔬"),
                item("professions", "artist", "Malíř", "🧑‍🎨"), item("professions", "pilot", "Pilot", "🧑‍✈️"),
                item("professions", "astronaut", "Kosmonaut", "🧑‍🚀"), item("professions", "judge", "Soudce", "🧑‍⚖️"),
                item("professions", "builder", "Stavitel", "👷"), item("professions", "detective", "Detektiv", "🕵️"),
                item("professions", "guard", "Strážce", "💂"), item("professions", "singer", "Zpěvák", "🧑‍🎤"),
                item("professions", "office-worker", "Úředník", "🧑‍💼"), item("professions", "technician", "Technik", "🧑‍💻")
            ]
        }
    };
})(typeof window !== "undefined" ? window : globalThis);
