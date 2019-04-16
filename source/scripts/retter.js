//elementene våre
bodyEl = document.querySelector('body');
buttonEl = document.querySelector('#button');
textEl = document.querySelector('#text');
resEl = document.querySelector('#result');
loadingEl = document.querySelector('#loading');
mainEl = document.querySelector('#main');

mainEl.style.display = "block";
loadingEl.style.display = "none";

//henter dataen
var fullform = $.csv.toArrays(fullform_nn);
//var paradigme = $.csv.toArrays(paradigme_nn);
var frekvens = $.csv.toArrays(ord_frekvens);

function extract_frequency(source) {
    var ret = {};
    for (var i = 0; i < source.length; i++) {
        //frekvens med ordet som nøkkel og frekvens som verdi
        ret[source[i][1]] = Number(source[i][0]);
    }
    return ret;
}

function extract_data(source) {
    var ret = {};
    //sorterer dataen etter ID
    for (var i = 0; i < source.length; i++) {
        var key = source[i][0];             //id nummber
        var value = source[i].slice(1);     //resten

        //vi sjekker om formen er unormert (det siste order er unormert)
        if (value[2].length >= 7 && value[2][value[2].length - 8] === 'u')
            continue;

        if (key in ret) {
            ret[key].push(value);
        }
        else {
            ret[key] = [value];
        }
    }
    return ret;
}

function is_instance(ord, type) {
    return ord[2].substr(0, type.length) === type;
}

function get_type_from_word(word) {
    var arr = word.split(" ");
    //ordtype, bøynngsform
    var ret = [arr[0], arr[1]];
    return ret;
}

//lager en array med info basert på om infoen inneholder den
function get_desc(info, arr) {
    var ret = [];
    //går gjennom alle forklaringene
    for (var i = 0; i < arr.length; i++) {
        //og sjekker om den finnes (ta med mellomrom)
        if (info.includes(" " + arr[i] + " ")) {
            ret.push(arr[i]);
        }
    }
    return ret;
}

//lager en ordbok med hva slags type ord vi har (verb, subs. osv.)
function extract_types(data) {
    var ret = {};
    //går gjennom all id-nummerne
    for (var key in data) {
        //går gjennom alle formene til hvert id-nummer
        for (var j = 0; j < data[key].length; j++) {
            //vi tar med alle mulige bøyninger
            var ord = data[key][j][1];
            //array me info om dette ordet
            var info = data[key][j][2];
            //klassen er den første infoen i lista
            var klasse = info.split(" ")[0];
            //foraklring av ordet av denne klassen
            var desc = [];

            switch (klasse) {
                case "subst":
                    desc = get_desc(info, ["ub", "bu", "fl", "mask", "fem", "nøyt", "eint"]);
                    break;
                case "verb":
                    desc = get_desc(info, ["inf", "pres", "pret", "perf-part"]);
                    break;
                case "adj":
                    desc = get_desc(info, ["nøyt", "m/f", "ub", "bu", "fl", "eint"]);
                    break;
                default:
            }
            //legger til forklaringer i ordet og klassen
            if (ord in ret && klasse in ret[ord]) {
                for (var i = 0; i < desc.length; i++) {
                    ret[ord][klasse].push(desc[i]);
                }
            }
            else {
                if (ord in ret) {
                    ret[ord][klasse] = desc;
                }
                else {
                    //ordbok med ordbøker
                    ret[ord] = {};
                    ret[ord][klasse] = desc;
                }

            }
        }
    }
    return ret;
}

function print(id) {                                                        //debug
    for (var i = 0; i < data[id].length; i++) {
        console.log("verb:");
        console.log(data[id][i][0] + " " + data[id][i][1] + " " + data[id][i][2]);
    }
}

//lager en ordbok fra en array for rask lookup
function get_dict(arr) {
    ret = {};
    for (var i = 0; i < arr.length; i++) {
        ret[arr[i]] = true;
    }
    return ret;
}
//print("110377");

//legg til alle besteme substantiv her også
var subjekter =
    get_dict(["eg", "du", "han", "ho", "det", "vi", "me", "de", "dokker", "dei", "ein", "og"]);

var prepisisjoner =
    get_dict(["av", "gjennom", "mellom", "rundt", "bak", "hos", "føre", "mot", "til",
              "blant", "i", "innan", "innanfor", "ovanfor", "ved", "frå", "med", "på",
              "bortanfor"]);

var adverb =
    get_dict(["ikkje", "heller", "aldri", "alltid", "berre"]);

var egendef_typ = {
    "sub": subjekter,
    "prep": prepisisjoner,
    "adv": adverb
};

//ordbok med id nummer som nøkkel
var data = extract_data(fullform);
//ord som nøkkel med value: klasse -> [info til klassen]
var type = extract_types(data);
//ord som nøkkel og frekvenstall som value
var freq = extract_frequency(frekvens);

//fjerner alle tegnene i arr og retunrer array av ord
function format(text, arr) {
    var ret = text;
    for (var i = 0; i < arr.length; i++) {
        ret = ret.split(arr[i]).join("");
    }
    return ret.toLowerCase().split(' ');
}

//retunerer et popup-vindu med info om et ord
function popup_elmnt(ord) {
    //rammen
    var retEl = document.createElement("div");
    retEl.classList.add("drag-box");

    //overskriften
    var headerEl = document.createElement("div");
    headerEl.classList.add("drag-header");
    headerEl.innerHTML = 'Data fra ordbnaken om "' + ord + '"';
    retEl.appendChild(headerEl);

    if (ord in type) {
        //går gjennom alle klassene
        for (var klasse in type[ord]) {
            //lager elementet
            var meldingEl = document.createElement("div");
            meldingEl.innerHTML = '<h3>' + klasse + '</h3>';
            meldingEl.innerHTML += type[ord][klasse];
            meldingEl.innerHTML += '<br>';

            //legger det til
            retEl.appendChild(meldingEl);
        }
    }
    else {
        var meldingEl = document.createElement("p");
        meldingEl.innerHTML = 'Ingen data i ordboka :(';
        retEl.appendChild(meldingEl);
    }

    return retEl;
}

//returnerer span element med nyttig info
function create_word(orig, word, color, counter, text = false) {
    var retEl = document.createElement("span");

    //legger til ordet og farge
    retEl.innerHTML = orig;
    if (text)
        retEl.classList.add("tooltip");
    retEl.setAttribute('id', "ord" + counter);
    retEl.style.color = color;

    //popup
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id == "ord" + counter) {
            var popupEl = popup_elmnt(word);
            bodyEl.appendChild(popupEl);
            dragElement(popupEl);
        }
    });

    if (text) {
        //lager tipsboksen
        var tipEl = document.createElement("span");
        tipEl.innerHTML = text;
        tipEl.classList.add("tooltiptext");
        retEl.appendChild(tipEl);
    }
    return retEl;
}

//vi må holde styr på tidligere ord når vi proserer teksten
var prev = "";
var cur = "";
var tip = "";
var warnings = 0;

function samsvar_aux(ord, desc, meld) {
    var ret = "";

    //hvis ikke i ordboka
    if (!(ord in type)) {
        warnings += 1;
        ret += "Dette ordet er ikkje " + meld;
        //antar at neste ord fortsatt bøyes etter samsvar
        cur += " " + desc + " ";
    }
    //riktig bøyd substantiv
    else if ("subst" in type[ord] && type[ord].subst.includes(desc)) {
        cur += " " + desc + " ";
    }
    //riktig bøyd adjektiv (må ta hensyn til forskjellig data for adj)
    else if ("adj" in type[ord] && type[ord].adj.includes(desc) ||
             "adj" in type[ord] && desc === "mask" && type[ord].adj.includes("m/f") ||
             "adj" in type[ord] && desc === "fem" && type[ord].adj.includes("m/f"))
    {
        cur += " " + desc + " ";
    }
    //ordet er bøyd feil
    else if ("subst" in type[ord] || "adj" in type[ord]) {
        warnings += 1;
        ret += "Dette ordet er ikkje " + meld;
        cur += " " + desc + " ";
    }
    //ellers går vi videre uten å gjøre mykje
    return ret;
}

function samsvar(ord) {
    console.log(ord);
    var ret = "";

    if (prev.includes(" bu ")) {
        ret += samsvar_aux(ord, "bu", "i bestemt form");
    }
    if (prev.includes(" ub ")) {
        ret += samsvar_aux(ord, "ub", "i ubestemt form");
    }

    //bøye etter tall
    if (prev.includes(" eint ")) {
        ret += samsvar_aux(ord, "eint", "i eintall");
    }
    if (prev.includes(" fl ")) {
        ret += samsvar_aux(ord, "fl", "i flertall");
    }

    //bøye etter kjønn
    if (prev.includes(" mask ")) {
        ret += samsvar_aux(ord, "mask", "i hankjønn");
    }
    if (prev.includes(" fem ")) {
        ret += samsvar_aux(ord, "fem", "i hokjønn");
    }
    if (prev.includes(" nøyt ")) {
        ret += samsvar_aux(ord, "nøyt", "i inkjekjønn");
    }

    //oppsett over hvilke ord som medfører hvilke samsvar
    var sam = {
        "mask": ["ein"],
        "fem": ["ei"],
        "nøyt": ["eit"],
        "bu": ["den", "det", "dei", "alle"],
        "ub": ["ein", "ei", "eit", "nokre", "nokon"],
        "eint": ["ein", "eit", "ei"],
        "fl": ["nokre", "nokon", "alle"]
    };

    //sjekker om vi har pronomen som leder opp til samsvar
    for (var desc in sam) {
        if (sam[desc].includes(ord)) {
            cur += " " + desc + " ";
        }
    }
    return ret;
}

function hyppighet(ord) {
    var ret = "";
    //sjekker om det er mye brukt
    if (!(ord in freq)) {
        ret += "Dette ordet er sjeldent brukt.";
        if (ord in type) {
            //lister alle formene som finnes
            ret += " Men det finnes ordboka som: ";
            for (var klasse in type[ord]) {
                tip += klasse + ", ";
            }
            ret += "<br><br>";
        }
        else {
            tip += " Og det finnes ikke i ordboka.<br><br>";
            warnings += 1;
        }
        //retEl.appendChild(create_mark(ord, "#f0f", tip));
    }
    return ret;
}

function verb(ord) {
    var ret = "";
    //antar at verb hvis etterføler mulig subjekt
    if (prev === "sub") {
        if (ord in type && "verb" in type[ord]) {
            ret += "Denne verbbøyninga finst i ordboka<br>";
            //retEl.appendChild(create_mark(orig[i], "#0f0", "Dette er et verb"));
        }
        else {
            ret += "Hvis verb, så feil bøyd.<br>";
            //retEl.appendChild(create_mark(orig[i], "#f00", "Hvis verb, så bøyd feil"));
            warnings += 1;
        }
    }
    return ret;
}

function substantiv(ord) {
    var ret = "";
    //sjekker om substantiv
    if (ord in type && "subst" in type[ord]) {
        cur += "sub";
        ret += "Dette ordet kan verte eit substantiv.<br>";
        //retEl.appendChild(create_mark(orig[i], "#00f", "Substantiv"));
    }
    return ret;
}

//hovedretteren vår. Git tilbake et p-element med markeringer-------------------
function process(text) {
    //originaltekst med tegnsetting
    var orig = text.split(' ');
    //formaterer ordene vi skal jobbe med
    var words = format(text, [".", ",", '"', "«", "»"]);

    //ordteller
    var counter = 0;

    //alt skal lagres her
    retEl = document.createElement("p");

    //går gjennom alle ordene i teksten
    for (var i = 0; i < words.length; i++) {
        var ord = words[i]; //plukker ut ordet
        tip = "";           //teksten som skal komme opp
        cur = "";           //klassen på ordet vårt
        warnings = 0;       //antall advarsler
        var color = "#000"; //fargen på ordet


        //......................................................................

        //sjekker om vi har definert ordet på egenhånd
        for (var klasse in egendef_typ) {
            if (ord in egendef_typ[klasse]) {
                cur = klasse;
                warnings = -999;
            }
        }

        //vi ignorer adverb
        if (cur.includes("adv")) {
            cur = prev;
        }

        tip += hyppighet(ord);
        tip += verb(ord);
        tip += substantiv(ord);
        tip += samsvar(ord);
        //......................................................................

        //så lager vi markering
        if (warnings > 0) {
            color = "#f00";
        }

        //bare lag merke hvis det er noe å merke seg
        if (warnings > 0) {
            //legger til ordet
            retEl.appendChild(create_word(orig[i], ord, color, counter, tip));
        }
        else {
            retEl.appendChild(create_word(orig[i], ord, color, counter));
        }
        //må legge til mellomrom
        retEl.innerHTML += '&nbsp;';

        //klar til neste ord
        prev = cur;
        counter += 1;
    }
    return retEl;
}


buttonEl.addEventListener('click', function(e) {
    //henter tekst fra feltet
    var input = textEl.value;

    prev = "";
    cur = "";
    var output = process(input);

    resEl.innerHTML = "";
    resEl.appendChild(output);
});

console.log(type.djupt);                                //debug
console.log(type.skriven);

//lukk all popup når esc klikkes
document.addEventListener('keydown', function(e) {
    var x = e.keyCode;
    if (x === 27) {
        var popupsEl = document.querySelectorAll('.drag-box');
        for (var i = 0; i < popupsEl.length; i++) {
            bodyEl.removeChild(popupsEl[i]);
        }
    }
});


// TODO:
/*
inf etter å, skulle
perf-part etter har/hadde'
sjekke samsvar

DONE klikke på ord for å få opp ordboka

backend:
intrsukser på start
CSS
ordentlig formatert ordbok
*/
