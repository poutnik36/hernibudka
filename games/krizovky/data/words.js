(function (root) {
    "use strict";

    const word = (answer, clue, emoji, image) => ({ answer, clue, emoji, ...(image ? { image } : {}) });

    root.CROSSWORD_WORDS = {
        medved: word("MEDVĚD", "Velký chlupáč, který má rád med.", "🐻", "images/medved.webp"),
        tygr: word("TYGR", "Pruhovaná šelma z džungle.", "🐯"),
        mys: word("MYŠ", "Malý hlodavec s dlouhým ocáskem.", "🐭"),
        lev: word("LEV", "Král zvířat s hřívou.", "🦁"),
        pes: word("PES", "Věrný domácí kamarád, který štěká.", "🐶"),
        sova: word("SOVA", "Noční pták s velikýma očima.", "🦉"),
        husa: word("HUSA", "Pták, který kejhá.", "🪿"),
        zirafa: word("ŽIRAFA", "Nejvyšší zvíře s dlouhým krkem.", "🦒"),
        delfin: word("DELFÍN", "Chytrý mořský savec, který skáče nad vlny.", "🐬"),

        most: word("MOST", "Stavba, po které přejdeš přes řeku.", "🌉"),
        ostrava: word("OSTRAVA", "Velké město na severu Moravy.", "🏭"),
        plzen: word("PLZEŇ", "Západočeské město známé pivem.", "🏙️"),
        praha: word("PRAHA", "Hlavní město České republiky.", "🏰", "images/praha.webp"),
        kolin: word("KOLÍN", "Město nad Labem, které je i v písničce.", "🏘️"),
        olomouc: word("OLOMOUC", "Hanácké město se sloupem Nejsvětější Trojice.", "⛲"),
        sokolov: word("SOKOLOV", "Město v Karlovarském kraji.", "🏠"),
        tabor: word("TÁBOR", "Jihočeské město spojené s husity.", "🛡️"),

        bydlet: word("BYDLIT", "Mít někde svůj domov.", "🏠"),
        pycha: word("PÝCHA", "Příliš veliká hrdost na sebe.", "🦚"),
        kopyto: word("KOPYTO", "Tvrdé zakončení nohy koně.", "🐴"),
        myslit: word("MYSLIT", "Používat hlavu a přemýšlet.", "🤔"),
        vysoky: word("VYSOKÝ", "Opak slova nízký.", "📏"),
        slyset: word("SLYŠET", "Vnímat zvuky ušima.", "👂"),
        syry: word("SYRÝ", "Neuvařený nebo neupečený.", "🥔"),
        brzy: word("BRZY", "Za krátkou dobu, nikoli pozdě.", "⏰"),

        saty: word("ŠATY", "Oblečení v jednom kuse, často se sukní.", "👗"),
        kalhoty: word("KALHOTY", "Oblečení se dvěma nohavicemi.", "👖"),
        tricko: word("TRIČKO", "Oblečení s krátkým nebo dlouhým rukávem.", "👕"),
        boty: word("BOTY", "Obouváme si je na nohy.", "👟"),
        bunda: word("BUNDA", "Svrchní oblečení do chladna.", "🧥"),
        ponozky: word("PONOŽKY", "Nosíme je v botách.", "🧦"),
        kabat: word("KABÁT", "Dlouhé teplé svrchní oblečení.", "🧥"),
        zip: word("ZIP", "Zapínání se zoubky a jezdcem.", "🤐"),

        maminka: word("MAMINKA", "Máma v celé své podobě.", "👩"),
        tatinek: word("TATÍNEK", "Táta v celé své podobě.", "👨"),
        kmotra: word("KMOTRA", "Žena, která je někomu za kmotru.", "👩‍🍼"),
        babicka: word("BABIČKA", "Maminka maminky nebo tatínka.", "👵"),
        teta: word("TETA", "Sestra maminky nebo tatínka.", "👩"),
        tata: word("TÁTA", "Jiné krátké slovo pro otce.", "👨"),
        dcera: word("DCERA", "Dítě ženského pohlaví.", "👧"),
        rodina: word("RODINA", "Rodiče, děti a jejich blízcí.", "👨‍👩‍👧‍👦", "images/rodina.webp"),

        skritek: word("SKŘÍTEK", "Malá pohádková bytost s čepičkou.", "🧝"),
        drak: word("DRAK", "Pohádkový tvor, který často chrlí oheň.", "🐉"),
        kral: word("KRÁL", "Panovník s korunou.", "🤴"),
        vila: word("VÍLA", "Kouzelná bytost s křídly.", "🧚"),
        vodnik: word("VODNÍK", "Zelený pohádkový pán rybníka.", "🧌"),
        rytir: word("RYTÍŘ", "Bojovník v brnění.", "⚔️"),
        cert: word("ČERT", "Rohatá pohádková bytost z pekla.", "😈")
    };
})(typeof window !== "undefined" ? window : globalThis);
