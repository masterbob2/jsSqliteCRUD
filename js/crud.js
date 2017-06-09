/**
 * Created by soren on 08/06/2017.
 */

// **********************************************************************************************************
// SQL.js databasen skal indlæses og udlæses til og fra local storage som det første og det sidste.
// **********************************************************************************************************

// from https://github.com/kripken/sql.js/wiki/Persisting-a-Modified-Database
function toBinArray (str) {
    var l = str.length,
        arr = new Uint8Array(l);
    for (var i=0; i<l; i++) arr[i] = str.charCodeAt(i);
    return arr;
}

// from https://github.com/kripken/sql.js/wiki/Persisting-a-Modified-Database
function toBinString (arr) {
    var uarr = new Uint8Array(arr);
    var strings = [], chunksize = 0xffff;
    // There is a maximum stack size. We cannot call String.fromCharCode with as many arguments as we want
    for (var i=0; i*chunksize < uarr.length; i++){
        strings.push(String.fromCharCode.apply(null, uarr.subarray(i*chunksize, (i+1)*chunksize)));
    }
    return strings.join('');
}


// når siden loades
window.addEventListener('load', function () {
    console.log("loading...");
    db = new SQL.Database(toBinArray(localStorage.getItem('minDB')));
    //db = new SQL.Database();
})

// når siden "unloades", dvs at brugeren navigerer væk eller lukker vinduet/fanen
window.addEventListener('unload', function () {
    console.log("UNloading ...")
    localStorage.setItem('minDB', toBinString(db.export()) );
})

window.addEventListener('load', function () {
    console.log("delayed running...")

    // from https://github.com/kripken/sql.js#examples

    //Create the database
    // Run a query without reading the results
    db.run("CREATE TABLE IF NOT EXISTS person (ID INTEGER primary key autoincrement, navn varchar(80), loen decimal);");
    // Insert two rows: (1,111) and (2,222)
    db.run("INSERT OR REPLACE INTO person VALUES (?, ?, ?), (?, ?, ?)",
        [   1, "Børge", 100000,
            2, "Finn ", 200000
        ]);

    // Prepare a statement
    var stmt = db.prepare("SELECT * FROM person");
    stmt.getAsObject(); // {col1:1, col2:111}

    // Bind new values
    while (stmt.step()) { //
        var row = stmt.getAsObject();
        // [...] do something with the row of result

        console.log(JSON.stringify(row));
    }
    refreshListe();
});

// **********************************************************************************************************
// GUI events
// **********************************************************************************************************

function hideAllPanels() {
    var panels = document.querySelectorAll('.panel');
    for (var i = 0; i < panels.length; i++) {
        panels[i].style.display = 'none';
    }
}

/*********** CREATE ************/

// tilføj-element-knappen
add.addEventListener('click', function () {
    hideAllPanels();
    // vis form + skjul knap
    nytElement.style.display = 'block';
    add.style.display = 'none';
})

addNewItem.addEventListener('click', function () {
    // insert

    insertItem(nytNavn.value, nytLoen.value);

    //nytID.value = '';
    nytNavn.value = '';
    nytLoen.value = '';

    // skjul gui + vis knap
    nytElement.style.display = 'none';
    add.style.display = 'inline-block';

    refreshListe();

    return false;
})

/*********** READ ************/

// vis-element-knappen


function registerVisKnapEvents() { // først når alle knapperne er loaded
    var visKnapper = document.querySelectorAll('.visPost')
    for (var i = 0; i < visKnapper.length; i++) {
        visKnapper[i].addEventListener('click', function () {
            // vis form
            hideAllPanels();
            visElement.style.display = 'block';

            // READ DATA

            var id = this.dataset.id;
            var item = getItem(id);

            visID.value = item.ID;
            visNavn.value = item.navn;
            visLoen.value = item.loen;
        })
    }

}

closeShowItem.addEventListener('click', function () {
    // skjul gui + vis knap
    visElement.style.display = 'none';
    //add.style.display = 'inline-block';

    return false;
})

/*********** UPDATE ************/

// tilføj-element-knappen
function registerRedigerKnapEvents() { // først når alle knapperne er loaded
    var redigerKnapper = document.querySelectorAll('.redigerPost')
    for (var i = 0; i < redigerKnapper.length; i++) {
        redigerKnapper[i].addEventListener('click', function () {
            // vis form
            hideAllPanels();
            redigerElement.style.display = 'block';

            // READ DATA

            var id = this.dataset.id;
            var item = getItem(id);

            redigerID.value = item.ID;
            redigerNavn.value = item.navn;
            redigerLoen.value = item.loen;
        })
    }

}

storeItem.addEventListener('click', function () {
    // insert

    updateItem(redigerID.value, redigerNavn.value, redigerLoen.value);

    redigerID.value = '';
    redigerNavn.value = '';
    redigerLoen.value = '';

    // skjul gui + vis knap
    redigerElement.style.display = 'none';

    refreshListe();

    return false;
})

/*********** DELETE ************/

// tilføj-element-knappen
function registerSletKnapEvents() { // først når alle knapperne er loaded
    var sletKnapper = document.querySelectorAll('.sletPost')
    for (var i = 0; i < sletKnapper.length; i++) {
        sletKnapper[i].addEventListener('click', function () {
            // vis form
            hideAllPanels();
            sletElement.style.display = 'block';

            // READ DATA

            var id = this.dataset.id;
            var item = getItem(id);

            sletID.value = item.ID;
            sletNavn.value = item.navn;
            sletLoen.value = item.loen;
        })
    }

}

removeItem.addEventListener('click', function () {
    // insert

    deleteItem(sletID.value);

    sletID.value = '';
    sletNavn.value = '';
    sletLoen.value = '';

    // skjul gui + vis knap
    sletElement.style.display = 'none';

    refreshListe();

    return false;
})


/*********** LISTE ************/

// refresh indhold når siden
function refreshListe(){
    console.log("refreshing liste");
    // Slet alt, undtagen li-template'en
    liste.innerHTML = '<li class="template">'
        + '<button class="visPost" data-id="0">Vis</button>'
        + '<button class="redigerPost" data-id="0">Rediger</button>'
        + '<button class="sletPost" data-id="0">Slet</button>'
        + ''
        + '<span class="dataitem idField" id="ID">#1</span>'
        + '<span class="dataitem textField" id="navn">Børge</span>'
        + '<span class="dataitem numericField" id="loen">100.000</span>'
        + '</li>';

    var stmt = loadAll();
    while(stmt.step())
    {
        var row = stmt.getAsObject();
        var newItem = liste.querySelector('li').cloneNode(true);

        newItem.classList.remove('template');

        newItem.querySelector('.visPost').dataset.id = row.ID;
        newItem.querySelector('.redigerPost').dataset.id = row.ID;
        newItem.querySelector('.sletPost').dataset.id = row.ID;

        newItem.children.ID.innerText = row.ID;
        newItem.children.navn.innerText = row.navn;
        newItem.children.loen.innerText = row.loen;

        newItem.style.display = "block";

        liste.appendChild(newItem);
    }
    registerVisKnapEvents();
    registerRedigerKnapEvents();
    registerSletKnapEvents();
}

// **********************************************************************************************************
// CRUD operationer
// **********************************************************************************************************

// ja, loadAll indlæser alle poster
function loadAll() {
    var stmt = db.prepare("SELECT * FROM person");
    return stmt;
}


function getItem(id){
    var stmt = db.prepare("SELECT * FROM person WHERE ID = $id");
    var row = stmt.getAsObject({$id: Number(id)});

    return row;
}

function insertItem(navn, loen) {
    console.log("indsætter " + navn + loen);
    var stmt = db.run("INSERT INTO person (navn, loen) VALUES (?, ?)", [navn, loen]);
}

function updateItem(id, navn, loen) {
    console.log("opdaterer " + id + navn + loen);
    //var stmt = db.run("INSERT INTO person (navn, loen) VALUES (?, ?)", [navn, loen]);
}

function deleteItem(id) {
    console.log("sletter " + id );
    //var stmt = db.run("INSERT INTO person (navn, loen) VALUES (?, ?)", [navn, loen]);
}