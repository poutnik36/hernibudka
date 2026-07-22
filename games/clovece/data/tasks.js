(function(root){"use strict";
const groups={
"český jazyk":["Vyjmenuj vyjmenovaná slova po B.","Řekni slovo se třemi slabikami.","Najdi rým ke slovu kočka.","Řekni množné číslo slova kuře.","Vymysli větu se slovem duha.","Vyhláskuj svoje jméno."],
"matematika":["Spočítej 7 + 8.","Kolik je 6 × 4?","Odečti 9 od 20.","Doplň řadu 2, 4, 6, ...","Kolik rohů mají dva čtverce?","Rozděl 18 na dvě stejné části."],
"příroda":["Vyjmenuj čtyři roční období.","Řekni tři lesní živočichy.","Co potřebuje rostlina k růstu?","Jmenuj dva stěhovavé ptáky.","Řekni tři druhy ovoce.","Které zvíře prospí zimu?"],
"paměť":["Zopakuj: strom, vlak, míč, slunce.","Vyjmenuj poslední tři hráče po směru hry.","Zavři oči a řekni barvu své figurky.","Zapamatuj si: 3, 8, 1, 5 a zopakuj.","Řekni, co jsi dnes snídal/a.","Vyjmenuj tři předchozí hody, pokud si je pamatuješ."],
"pohyb":["Třikrát zatleskej a dvakrát dupni.","Pětkrát se protáhni ke stropu.","Udělej tři dřepy.","Stůj pět sekund na jedné noze.","Zakruž třikrát rameny.","Předveď pomalý běh na místě."],
"veselý úkol":["Deset sekund mluv jako robot.","Udělej co nejveselejší obličej.","Řekni vtipný pozdrav mimozemšťana.","Zasměj se jako pohádkový obr.","Vymysli legrační jméno pro ponožku.","Předveď ospalého draka."],
"slovní zásoba":["Řekni opak slova velký.","Jmenuj tři věci, které jsou kulaté.","Řekni pět slov začínajících na K.","Najdi jiné slovo pro hezký.","Jmenuj tři věci v kuchyni.","Řekni dvě slova končící na A."],
"logika":["Co nepatří do řady: pes, kočka, stůl, kůň?","Dokonči: ráno, poledne, večer, ...","Které číslo je větší: 37 nebo 73?","Máš dvě jablka a jedno přidáš. Kolik jich máš?","Co je těžší: pírko, nebo kámen?","Najdi pravidlo řady 1, 3, 5, 7."],
"rodina a okolí":["Řekni jednu věc, s níž doma pomáháš.","Jmenuj tři místa ve svém okolí.","Řekni něco milého hráči po levici.","Vyjmenuj členy své domácnosti.","Jak bezpečně přejdeš silnici?","Řekni oblíbenou společnou rodinnou činnost."],
"rychlá pantomima":["Předveď tučňáka.","Předveď čištění zubů.","Předveď řízení autobusu.","Předveď kočku, která se protahuje.","Předveď létajícího ptáka.","Předveď stavění sněhuláka."]};
let index=0;root.LUDO_TASKS=Object.entries(groups).flatMap(([category,prompts])=>prompts.map(prompt=>({id:`task-${String(++index).padStart(3,"0")}`,category,prompt,ageMin:7,ageMax:12})));
})(typeof window!=="undefined"?window:globalThis);
