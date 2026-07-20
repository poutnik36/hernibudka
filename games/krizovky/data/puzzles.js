(function (root) {
    "use strict";

    const make = (id, category, title, secret, prompt, rows) => ({
        id,
        category,
        title,
        secret,
        prompt,
        secretColumn: 5,
        placements: rows.map(([wordId, secretIndex], row) => ({
            wordId,
            row,
            col: 5 - secretIndex,
            secretIndex
        }))
    });

    root.CROSSWORD_PUZZLES = [
        make("animals-mys", "animals", "Kočičí úlovek", "MYŠ", "Co loví kočka u počítače?", [["medved", 0], ["tygr", 1], ["mys", 2]]),
        make("animals-les", "animals", "Výlet do přírody", "LES", "Kam si zvířátka chodí pro šišky?", [["lev", 0], ["pes", 1], ["sova", 0]]),
        make("animals-haf", "animals", "Psí řeč", "HAF", "Jak pozdraví veselý pejsek?", [["husa", 0], ["zirafa", 3], ["delfin", 3]]),

        make("cities-mapa", "cities", "Na výletě", "MAPA", "Co pomůže najít správnou cestu?", [["most", 0], ["ostrava", 4], ["plzen", 0], ["praha", 2]]),
        make("cities-vlak", "cities", "Cesta po kolejích", "VLAK", "Čím můžeme cestovat z města do města?", [["ostrava", 5], ["plzen", 1], ["praha", 2], ["kolin", 0]]),
        make("cities-most", "cities", "Přes řeku", "MOST", "Po čem přejdeme z jednoho břehu na druhý?", [["most", 0], ["olomouc", 0], ["sokolov", 0], ["tabor", 0]]),

        make("selected-byk", "selectedWords", "Tvrdé Y", "BÝK", "Které zvíře má rohy a ve slově tvrdé Ý?", [["bydlet", 0], ["pycha", 1], ["kopyto", 0]]),
        make("selected-mys", "selectedWords", "Chytrá tajenka", "MYŠ", "Které malé zvíře patří mezi vyjmenovaná slova?", [["myslit", 0], ["vysoky", 1], ["slyset", 3]]),
        make("selected-syr", "selectedWords", "Dobrota", "SÝR", "Co dobrého vzniká z mléka?", [["syry", 0], ["pycha", 1], ["brzy", 1]]),

        make("clothes-saty", "clothes", "Do společnosti", "ŠATY", "Co si můžeme obléct na slavnost?", [["saty", 0], ["kalhoty", 1], ["tricko", 0], ["boty", 3]]),
        make("clothes-bota", "clothes", "Na nohu", "BOTA", "Co chrání chodidlo venku?", [["bunda", 0], ["ponozky", 1], ["tricko", 0], ["kabat", 1]]),
        make("clothes-zip", "clothes", "Rychlé zapínání", "ZIP", "Co má zoubky, ale nekouše?", [["zip", 0], ["tricko", 2], ["ponozky", 0]]),

        make("family-mama", "family", "Nejmilejší oslovení", "MÁMA", "Jak krátce oslovíme maminku?", [["maminka", 0], ["tata", 1], ["kmotra", 1], ["babicka", 1]]),
        make("family-tata", "family", "Rodinný hrdina", "TÁTA", "Jak krátce oslovíme tatínka?", [["teta", 0], ["tata", 1], ["tatinek", 0], ["babicka", 1]]),
        make("family-doma", "family", "Nejlepší místo", "DOMA", "Kde je nám s rodinou nejlépe?", [["dcera", 0], ["rodina", 1], ["maminka", 0], ["babicka", 1]]),

        make("fairy-kral", "fairyTales", "Na zámku", "KRÁL", "Kdo nosí korunu a vládne království?", [["skritek", 1], ["drak", 1], ["kral", 2], ["vila", 2]]),
        make("fairy-drak", "fairyTales", "Ohnivá tajenka", "DRAK", "Kdo má křídla a chrlí oheň?", [["vodnik", 2], ["kral", 1], ["vila", 3], ["skritek", 1]]),
        make("fairy-cary", "fairyTales", "Kouzelná slova", "ČÁRY", "Co umí kouzelník s hůlkou?", [["cert", 0], ["kral", 2], ["drak", 1], ["rytir", 1]])
    ];
})(typeof window !== "undefined" ? window : globalThis);
