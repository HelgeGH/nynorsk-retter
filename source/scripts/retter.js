//henter dataen
var fullform = $.csv.toArrays(fullform_nn);
//var paradigme = $.csv.toArrays(paradigme_nn);


function extract_data(source) {
    var ret = {};
    //sorterer dataen etter ID
    for (var i = 0; i < source.length; i++) {
        var key = source[i][0];
        var value = source[i].slice(1);

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

function get_verbs(data) {
    var ret = {};
    //gpr gjennom all dataen og sjekker om ting er verb
    for (var key in data) {
        for (var j = 0; j < data[key].length; j++) {
            if (is_instance(data[key][j], "verb")) {
                ret[data[key][j][1]] = data[key][j];
            }
        }
    }
    return ret;
}

//ordbok med id som nøkkel
var data = extract_data(fullform);
var verbs = get_verbs(data);

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
var subjekter = {"dei":1, "han":1, "ho":1, "me":1, "vi":1, "du":1, "dere":1, "eg":1, "det":1};

//prosserer en streng med tekst
function process(text) {
    //fjern punktum og
    words = text.split('.').join("").split(' ');
    type = new Array(words.length);

    res = "";
    for (var i = 0; i < words.length; i++) {
        if (words[i] in subjekter) {
            type[i] = "sub";
            res += "<span style='color:blue'>" + words[i] + "</span>";
        }
        else if (type[i - 1] === "sub") {
            if (words[i] in verbs) {
                res += "<span style='color:green'>" + words[i] + "</span>";
            }
            else {
                res += "<span style='color:red'>" + words[i] + "</span>";
            }
        }
        else {
            res += words[i];
        }
        res += " ";
    }
    return res;
}


buttonEl.addEventListener('click', function(e) {
    //henter tekst fra feltet
    var text = textEl.value.toLowerCase();

    var res = process(text);

    resEl.innerHTML = res;

});
