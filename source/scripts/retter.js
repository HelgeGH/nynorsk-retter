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

//lager en ordbok med hva slags type ord vi har (verb, subs. osv.)
function extract_types(data) {
    var ret = {};
    //går gjennom all id-nummerne
    for (var key in data) {
        //går gjennom alle formene til hvert id-nummer
        for (var j = 0; j < data[key].length; j++) {
            //vi tar med alle mulige bøyninger
            var ord = data[key][j][1];
            if (is_instance(data[key][j], "verb") || is_instance(data[key][j], "subst")) {
                //ordet er lagt til fra før av
                if (ord in ret) {
                    ret[ord].push(get_type_from_word(data[key][j][2]));
                }
                else {
                    ret[ord] = [get_type_from_word(data[key][j][2])];
                }
            }
        }
    }
    return ret;
}

function print(id) {
    for (var i = 0; i < data[id].length; i++) {
        console.log("verb:");
        console.log(data[id][i][0] + " " + data[id][i][1] + " " + data[id][i][2]);
    }
}
//print("110377");

//elementene våre
bodyEl = document.querySelector('body');
buttonEl = document.querySelector('#button');
textEl = document.querySelector('#text');
resEl = document.querySelector('#result');

//legg til alle besteme substantiv her også
var subjekter = {"dei":1, "han":1, "ho":1, "me":1, "vi":1, "du":1, "dere":1, "eg":1, "det":1, "som":1};

//ordbok med id nummer som nøkkel
var data = extract_data(fullform);
//ord som nøkkel med arr av [type, bøyning] som value
var type = extract_types(data);
//ord som nøkkel og frekvenstall som value
var freq = extract_frequency(frekvens);



//returnerer span element med nyttig info
function create_mark(word, color, text) {
    var retEl = document.createElement("span");
    //legger til ordet og farge
    retEl.innerHTML = word;
    retEl.classList.add("tooltip");
    retEl.style.color = color;

    //lager tipsboksen
    var tipEl = document.createElement("span");
    tipEl.innerHTML = text;
    tipEl.classList.add("tooltiptext");
    retEl.appendChild(tipEl);

    return retEl;
}

function get_types(ord) {
    var ret = [];
    if (ord in type) {
        for (var i = 0; i < type[ord].length; i++) {
            //legg til typen
            ret.push(type[ord][i][0]);
        }
    }
    return ret;
}

//hovedretteren vår. Git tilbake et p-element med markeringer-------------------
function process(text) {
    //originaltekst med tegnsetting
    var orig = text.split(' ');
    //formaterer ordene vi skal jobbe med
    var words = text.split('.').join("").split(',').join("").toLowerCase().split(' ');

    //holder styr på ordtyper
    types = new Array(words.length);

    //alt skal lagres her
    retEl = document.createElement("p");

    //går gjennom alle ordene i teksten
    for (var i = 0; i < words.length; i++) {
        var ord = words[i]; //plukker ut ordet

        //sjekker om det er mye brukt
        if (!(ord in freq)) {
            var tip = "Dette ordet er sjeldent brukt.";
            if (ord in type) {
                tip += " Men det er i ordboka: " + type[ord];
            }
            else {
                tip += " Og det finnes ikke i ordboka.";
            }
            retEl.appendChild(create_mark(ord, "#f0f", tip));
        }
        //sjekker om standard subjektspronomen
        else if (words[i] in subjekter) {
            types[i] = "sub";
            retEl.appendChild(create_mark(orig[i], "#0ff", "Dette er et subjekt"));
        }
        //antar at verb hvis etterføler mulig subjekt
        else if (i > 0 && types[i - 1] === "sub") {
            if (get_types(ord).includes("verb")) {
                retEl.appendChild(create_mark(orig[i], "#0f0", "Dette er et verb"));
            }
            else {
                retEl.appendChild(create_mark(orig[i], "#f00", "Hvis verb, så bøyd feil"));
            }
        }
        //sjekker om substantiv
        else if (get_types(ord).includes("subst")) {
            types[i] = "sub";
            retEl.appendChild(create_mark(orig[i], "#00f", "Substantiv"));
        }
        //ellers lager vi ingen kommentarer
        else {
            ordEl = document.createElement("span");
            ordEl.innerHTML = orig[i];
            retEl.appendChild(ordEl);
        }
        //må legge til mellomrom
        retEl.innerHTML += '&nbsp;';
    }
    return retEl;
}


buttonEl.addEventListener('click', function(e) {
    //henter tekst fra feltet
    var input = textEl.value;

    var output = process(input);

    resEl.innerHTML = "";
    resEl.appendChild(output);
});
