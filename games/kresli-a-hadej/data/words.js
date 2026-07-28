(function (root, factory) {
  const data = factory();
  if (typeof module === "object" && module.exports) module.exports = data;
  root.DrawingWords = data;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const groups = {
    zvirata: ["pes","kočka","kůň","kráva","prase","ovce","koza","slepice","kachna","husa","králík","myš","ježek","veverka","liška","vlk","medvěd","jelen","srna","zajíc","lev","tygr","slon","žirafa","zebra","opice","klokan","panda","krokodýl","želva","had","žába","ryba","žralok","velryba","delfín","chobotnice","motýl","včela","beruška"],
    predmety: ["židle","stůl","postel","skříň","lampa","hrnek","talíř","lžíce","vidlička","nůž","deštník","klíč","hodiny","telefon","počítač","televize","fotoaparát","kniha","tužka","nůžky","kladivo","lopata","koště","kbelík","kartáček","hřeben","batoh","kufr","brýle","klobouk","bota","míč","koloběžka","kolo","auto","vlak","loď","letadlo","raketa","dalekohled"],
    jidlo: ["jablko","hruška","banán","pomeranč","jahoda","meloun","třešně","hrozny","mrkev","rajče","okurka","brambora","hrášek","houba","chléb","rohlík","sýr","vejce","máslo","jogurt","polévka","špagety","pizza","hamburger","párek","řízek","salát","dort","koláč","sušenka","zmrzlina","čokoláda","bonbon","lízátko","popcorn","palačinka","med","čaj","limonáda","snídaně"],
    povolani: ["lékař","zubař","zdravotní sestra","hasič","policista","učitel","kuchař","pekař","prodavač","pošťák","řidič","pilot","strojvedoucí","námořník","farmář","zahradník","zedník","malíř pokojů","truhlář","opravář","kadeřník","krejčí","fotograf","novinář","herec","zpěvák","hudebník","tanečník","kouzelník","klaun","sportovec","fotbalista","rozhodčí","vědec","astronaut","archeolog","knihovník","zvěrolékař","záchranář","průvodce"],
    cinnosti: ["běhání","skákání","plavání","lyžování","bruslení","jízda na kole","kopání do míče","házení","chytání","tančení","zpívání","čtení","psaní","malování","vaření","pečení","uklízení","zametání","zalévání","sázení stromu","krmení zvířat","venčení psa","spaní","zívání","smích","pláč","mávání","tleskání","telefonování","fotografování","nakupování","rybaření","stanování","rozdělávání ohně","stavění sněhuláka","pouštění draka","balení dárku","čištění zubů","mytí nádobí","oprava auta"],
    pohadky: ["princezna","princ","král","královna","rytíř","hrad","koruna","drak","jednorožec","víla","skřítek","čarodějnice","kouzelník","obr","trpaslík","mořská panna","vodník","čert","anděl","duch","strašidlo","mluvící kočka","létající koberec","kouzelná hůlka","zlatá rybka","křišťálová koule","zakletý zámek","perníková chaloupka","sedm trpaslíků","otrávené jablko","skleněný střevíček","červená karkulka","vlk v posteli","žabí princ","drak se třemi hlavami","poklad","tajná chodba","kouzelný lektvar","mapa pokladu","meč v kameni"],
    priroda: ["slunce","měsíc","hvězda","duha","mrak","déšť","sníh","blesk","bouřka","vítr","hora","kopec","skála","jeskyně","sopka","les","strom","pařez","květina","tráva","kapradí","řeka","potok","vodopád","jezero","moře","ostrov","pláž","poušť","ledovec","bahno","louka","pole","západ slunce","zatmění měsíce","sněhová vločka","kaluž","včelí úl","mraveniště","pavučina"],
    souslovi: ["horký čaj","červený balón","modré auto","zelený klobouk","velký dům","malá myš","spící kočka","veselý pes","smutný klaun","hladový medvěd","tančící slon","zpívající pták","létající ryba","běžící želva","skákající žába","prasklý deštník","rozbité hodiny","ztracený klíč","tajný dopis","kouzelná kniha","narozeninový dort","vánoční stromeček","sněhulák s kloboukem","hrad na písku","loď v bouři","vlak v tunelu","auto bez kola","raketa na měsíci","piknik v lese","výlet do hor","den u moře","noc pod stanem","pes na vodítku","kočka na stromě","pták v kleci","ryba v akváriu","žába v rybníce","dárek s mašlí","hrnek s čajem","košík hub"]
  };
  const labels = { zvirata:"Zvířata", predmety:"Předměty", jidlo:"Jídlo", povolani:"Povolání", cinnosti:"Činnosti", pohadky:"Pohádkové motivy", priroda:"Příroda", souslovi:"Jednoduchá sousloví" };
  const difficulties = ["lehké", "střední", "těžké"];
  const words = Object.entries(groups).flatMap(([category, items]) =>
    items.map((text, index) => ({ text, category, difficulty: difficulties[Math.min(2, Math.floor(index / 14))] }))
  );
  return { words, categories: labels, difficulties };
});
