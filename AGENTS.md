# AGENTS.md — Herní budka

Tento soubor obsahuje závazné pokyny pro všechny kódovací agenty pracující v repozitáři `poutnik36/hernibudka`.

## 1. Cíl projektu

`hernibudka.cz` je jednoduchý web s krátkými hrami pro děti. Web má být veselý, srozumitelný, bezpečný, použitelný na počítači, tabletu i telefonu a dostupný bez registrace.

Projekt je publikován pomocí GitHub Pages. Jde o čistě statický web bez serverové části.

## 2. Základní technická pravidla

- Používej čisté HTML, CSS a JavaScript bez frameworku a bez nutnosti sestavení projektu.
- Nepřidávej Node.js, npm, bundler ani jiný build krok, pokud to není výslovně schváleno vlastníkem repozitáře.
- Každá hra musí být oddělena do vlastní složky a nemá být implementována uvnitř hlavního `index.html`.
- Sdílené styly, skripty a komponenty ukládej do společných složek `assets/css`, `assets/js`, `assets/images` a případně `assets/audio`.
- Používej relativní odkazy, aby web fungoval na GitHub Pages i na vlastní doméně.
- Zachovej soubor `CNAME`. Nikdy ho nemaž ani neměň bez výslovného požadavku vlastníka.
- Zachovej soubor `pozadi.png`. Slouží jako základní grafika úvodní stránky s budkou a okny.
- Všechny texty pro uživatele piš česky a v UTF-8.
- Nezaváděj databázi, přihlášení, účty ani odesílání osobních údajů.
- Případné nastavení, skóre a rozehrané hry ukládej pouze lokálně pomocí `localStorage`.
- Nepřidávej analytiku, reklamní skripty, cookies ani externí sledování.
- Nepoužívej vzdálené CDN, pokud lze soubor bezpečně uložit přímo do repozitáře.
- Nepoužívej grafiku, hudbu ani zvuky s nejasnou licencí.

## 3. Doporučená struktura repozitáře

```text
/
├── index.html
├── CNAME
├── AGENTS.md
├── pozadi.png
├── assets/
│   ├── css/
│   │   ├── shared.css
│   │   └── home.css
│   ├── js/
│   │   └── shared.js
│   ├── images/
│   └── audio/
└── games/
    ├── robot/
    │   ├── index.html
    │   ├── robot.css
    │   └── robot.js
    ├── bludiste/
    │   ├── index.html
    │   ├── bludiste.css
    │   └── bludiste.js
    ├── krizovky/
    │   ├── index.html
    │   ├── krizovky.css
    │   ├── krizovky.js
    │   └── data/
    └── pexeso/
        ├── index.html
        ├── pexeso.css
        ├── pexeso.js
        └── data/
```

Od této struktury se lze odchýlit pouze tehdy, když tím vznikne prokazatelně přehlednější řešení.

## 4. Úvodní stránka

Původní `index.html` je pouze provizorní stránka se slovíčky a má být nahrazen rozcestníkem Herní budky.

Požadavky:

- Použij `pozadi.png` jako hlavní vizuál budky.
- Do oken budky umísti odkazy na jednotlivé hry.
- Klikací oblasti nad okny definuj procentuálními souřadnicemi, ne pevnými pixely, aby byly responzivní.
- Každé okno musí mít viditelný název hry a dostatečně velkou klikací oblast.
- Přidej i alternativní seznam her pod obrázkem, aby navigace fungovala při špatném načtení obrázku, pro malé displeje a pro asistivní technologie.
- Prázdná nebo připravovaná hra má být označena textem `Připravujeme`, nikoliv odkazem na neexistující stránku.
- Hlavní nadpis: `Herní budka`.
- Krátký podnadpis může být například: `Otevři okno a vyber si hru.`

## 5. Společné UX požadavky

Každá hra musí:

- fungovat myší, dotykem a pokud je to rozumné také klávesnicí;
- používat Pointer Events (`pointerdown`, `pointermove`, `pointerup`) místo oddělené implementace myši a dotyku;
- mít velké ovládací prvky vhodné pro děti;
- zabránit nechtěnému posouvání stránky během tažení herního prvku;
- obsahovat tlačítko `Zpět do budky`;
- obsahovat tlačítko `Nová hra` nebo `Zkusit znovu`;
- jasně odlišovat úspěch, chybu a právě vybraný prvek;
- nepoužívat trestající nebo zesměšňující texty;
- zobrazovat krátké pozitivní zprávy, například `Výborně!`, `To je ono!`, `Zkus to ještě jednou.`;
- být responzivní alespoň od šířky 320 px;
- fungovat v aktuálních verzích Chrome, Edge, Firefox a Safari;
- respektovat `prefers-reduced-motion` a umožnit omezení animací;
- mít smysluplné `aria-label`, stavové texty a dostatečný kontrast;
- nepřehrávat zvuk automaticky před první interakcí uživatele;
- umožnit vypnutí zvuku, pokud bude zvuk přidán.

## 6. Hra 1 — Cesta robota

### Základní princip

Na mřížce se vygeneruje start, cíl a platná cesta. Pod mřížkou jsou programové příkazy. Hráč skládá příkazy do správného pořadí a následně spustí robota.

Příklad cesty:

```text
START → → ↑ → → ↓ ↓ CÍL
```

Správný program:

```text
doprava, doprava, nahoru, doprava, doprava, dolů, dolů
```

### Povinná první verze

- mřížka alespoň 5 × 5;
- náhodný start a cíl;
- generování platné cesty bez opakování polí;
- příkazy `nahoru`, `dolů`, `vlevo`, `vpravo`;
- přidávání příkazů kliknutím nebo dotykem;
- možnost odebrat poslední příkaz a vymazat celý program;
- vizuální spuštění robota krok za krokem;
- kontrola nárazu do okraje nebo vstupu na chybné pole;
- po správném řešení možnost vytvořit další úlohu;
- volba obtížnosti, která mění velikost mřížky a délku cesty.

### Pozdější rozšíření

- překážky;
- příkaz `skoč`;
- opakovací příkaz, například `opakuj 3×`;
- hledání nejkratší cesty;
- průchod vyznačeným čtvercem nebo kontrolním bodem;
- omezený počet příkazů.

Generátor musí vždy před zobrazením ověřit, že úloha má řešení. U režimu nejkratší cesty použij BFS a porovnej program hráče s minimální délkou řešení.

## 7. Hra 2 — Bludiště s mrkví a zajícem

### Základní princip

Hráč uchopí mrkev myší nebo prstem a táhne ji od startu bludiště k zajícovi v cíli. Za mrkví se vykresluje barevná stopa.

### Požadavky

- bludiště generuj algoritmicky, například recursive backtracker nebo randomized DFS;
- každé vygenerované bludiště musí mít platnou cestu od startu k cíli;
- vykreslení preferuj pomocí `<canvas>` nebo SVG;
- souřadnice ukazatele převáděj korektně podle skutečné velikosti canvasu a CSS měřítka;
- tažení se smí pohybovat pouze otevřenými chodbami;
- při dotyku stěny zobraz jemnou zpětnou vazbu a vrať mrkev na poslední platné místo, nikoliv automaticky na úplný začátek;
- cesta za hráčem má být viditelná;
- po dosažení zajíce zobraz krátkou animaci a nabídni nové bludiště;
- nabídni alespoň tři obtížnosti podle velikosti mřížky;
- start a cíl umísti dostatečně daleko od sebe;
- na mobilu zakaž při aktivním tažení scroll a zoom gesta pouze uvnitř herní plochy.

První verze může použít jednoduché SVG ilustrace nebo emoji mrkve a zajíce. Vlastní obrázky nejsou podmínkou funkčnosti.

## 8. Hra 3 — Dětské křížovky

### Základní princip

Hráč zvolí tematickou kategorii a hra vytvoří jednoduchou křížovku. Vybraná písmena vytvoří tajenku, která může doplnit dětský vtip nebo krátkou hádanku.

### Kategorie

První datové sady:

- zvířátka;
- města;
- vyjmenovaná slova;
- oblečení;
- rodina.

### Požadavky

- data odděl od kódu do JSON nebo JS datových souborů;
- každá položka má obsahovat řešení, nápovědu, kategorii a případně vhodné písmeno tajenky;
- podporuj českou diakritiku;
- pro technické porovnání lze používat normalizovanou podobu bez diakritiky, ale v mřížce zobrazuj správný český zápis;
- nevyžaduj od dítěte zadávání mezer a pomlček do samostatných polí;
- umožni pohyb mezi políčky klávesnicí i dotykem;
- nabídni kontrolu jednoho slova i celé křížovky;
- chybně vyplněná pole zvýrazni až po vyžádané kontrole;
- tajenku zobraz až po dokončení nebo po použití nápovědy;
- vtipy musí být krátké, neškodné a vhodné pro děti.

### Generování

Křížovky jsou z uvedených her algoritmicky nejnáročnější. Postupuj ve dvou fázích:

1. vytvoř několik ověřených šablon mřížek pro jednotlivé délky tajenek;
2. až poté případně implementuj plně procedurální umísťování slov s backtrackingem.

Generátor musí mít limit počtu pokusů a při neúspěchu použít bezpečnou předpřipravenou šablonu. Nikdy nesmí zamrznout v nekonečné smyčce.

## 9. Hra 4 — Pexeso pro dva hráče

### Základní princip

Dva hráči se střídají na jednom zařízení a hledají dvojice stejných karet.

### Kategorie

- zvířata;
- pohádky;
- auta;
- lidé nebo povolání;
- další kategorie lze doplňovat datově.

### Požadavky

- volba jmen hráčů nebo výchozí názvy `Hráč 1` a `Hráč 2`;
- volba velikosti mřížky, například 4 × 3, 4 × 4 a 6 × 4;
- vždy sudý počet karet;
- zamíchání pomocí Fisher–Yates algoritmu;
- během vyhodnocování dvojice uzamkni další klikání;
- shodná dvojice zůstává odkrytá a stejný hráč pokračuje;
- při neshodě se po krátké prodlevě karty zakryjí a hráči se vystřídají;
- zobraz aktuálního hráče, počet získaných dvojic a konečný výsledek;
- ošetři remízu;
- karty musí být dostatečně velké pro dotyk;
- animace otočení karty nesmí být podmínkou funkčnosti.

První verze může používat emoji, jednoduché SVG nebo barevné symboly. Datový model připrav tak, aby bylo možné později snadno přidat vlastní obrázky.

## 10. Grafika a multimédia

Agent smí bez dodaných obrázků:

- vytvářet CSS ilustrace;
- vytvářet vlastní jednoduché SVG ikony a postavičky;
- používat emoji jako dočasné nebo finální symboly;
- procedurálně vykreslovat tvary na canvasu;
- vytvářet jednoduché zvuky pomocí Web Audio API.

Agent nesmí:

- stahovat náhodné obrázky z internetu bez jasné licence;
- kopírovat známé pohádkové postavy, loga automobilek nebo jiné chráněné značky;
- přidávat obrázky generované externí službou bez uvedení původu a souhlasu vlastníka projektu.

Pro osobitější vzhled může vlastník dodat PNG, WebP nebo SVG. Preferuj WebP pro fotografie a PNG/SVG pro průhlednou herní grafiku. U obrázků používej popisné názvy souborů bez mezer a bez diakritiky.

## 11. Pořadí implementace

Doporučené pořadí práce:

1. nový responzivní rozcestník v `index.html` s použitím `pozadi.png`;
2. společné styly a navigace;
3. Cesta robota — základní verze;
4. Pexeso — základní verze;
5. Bludiště — základní verze;
6. Křížovky s ověřenými šablonami;
7. rozšíření obtížností, zvuků, statistik a dalších kategorií.

Nevytvářej všechny hry v jednom rozsáhlém commitu. Každou hru implementuj samostatně a udržuj web po každém kroku funkční.

## 12. Pracovní postup agenta

Před změnou:

1. přečti tento soubor;
2. prohlédni aktuální strukturu repozitáře;
3. ověř, že změna neodstraní `CNAME` ani potřebné obrázky;
4. stručně popiš plán změn.

Při změně:

- preferuj malý, přehledný rozsah;
- nepřepisuj nesouvisející soubory;
- odděluj data od logiky;
- komentuj pouze složitější algoritmy;
- nepřidávej minifikované soubory;
- nevkládej tajné klíče ani přístupové údaje.

Po změně:

- zkontroluj odkazy a cesty k souborům s ohledem na GitHub Pages;
- ověř stránku při šířkách přibližně 320, 768 a 1280 px;
- ověř základní ovládání myší a dotykovým ukazatelem;
- zkontroluj konzoli prohlížeče;
- ověř, že neexistují nekonečné smyčky generátorů;
- stručně popiš provedené změny a známá omezení.

Pokud agent může vytvářet větve a pull requesty, preferuj pro větší změny samostatnou větev a PR. Přímý commit do `main` používej jen pro malé a jasně vyžádané úpravy.

## 13. Kritéria dokončení první etapy

První etapa je dokončena, když:

- `hernibudka.cz` zobrazuje responzivní rozcestník;
- `pozadi.png` je použit jako hlavní grafika;
- odkazy do oken fungují nebo jsou označeny jako připravované;
- alespoň jedna hra je plně hratelná na počítači i telefonu;
- žádná stránka nevyžaduje server, účet ani externí API;
- konzole prohlížeče neobsahuje chyby;
- soubor `CNAME` zůstává zachován.
