var game_id = 0;
var game = 0;
var current_slide = null;
var is_host = false;
var player_id = 0;
var slides = [];
var socket = 0;
var fire_timer = null;
var auto_hand = false;

window.onload = function() {
    get_game();
}

function register_keys() {
    document.body.onkeydown = function(e) {
        if (is_host) {
            var delta = 0;
            if (e.keyCode === 39) {
                delta = 1;
                e.preventDefault();
            }
            if (e.keyCode === 37) {
                delta = -1;
                e.preventDefault();
            }
            if (delta != 0) {
                console.log("slide delta ", delta);
                socket.emit('change_slide', {
                    'game_id': game_id,
                    'player_id': player_id,
                    'current_slide': current_slide + delta
                });
            }
        }
        if (e.keyCode === 32) {
            e.preventDefault();
            raise_hand();
        }
    }
}

function raise_hand() {
    socket.emit('raise_hand', {
        'was_executed_at': synced_epoch(),
        'game_id': game_id,
        'player_id': player_id
    });
}

function join_socketio() {
    socket = io('<##API_URL##>/');
    socket.on('connect', function(){
        console.log('connected');
        console.log('joining ' + game_id);
        socket.emit('join', {room: game_id});
    });
    socket.on('joined', function(){
        console.log('joined');
    });
    socket.on('left', function(){
        console.log('left');
    });
    socket.on('changed_slide', (data) => {
        var when = data.will_execute_at;
        run_at(function() {
            current_slide = data.current_slide;
            console.log("current_slide: " + current_slide);
            populate_slide();
        }, when);
    });
    socket.on('raised_hands', (data) => {
        var raised_hands = data.hands;
        console.log("raised_hands: " + data);
        populate_raised_hands(raised_hands);
    });
    socket.on('fire', (data) => {
        var when = data.will_execute_at;
        run_at(function() {
            show_fire();
        }, when);
    });
    socket.on('changed_players', (data) => {
        var players = data.players;
        game.players = players;
        populate_players();
    });
    socket.on('disconnect', function(){
        console.log('disconnected');
    });
}

function run_at(what, when) {
    var now = synced_epoch();
    var delta = Math.max(0, when - now);
    setTimeout(what, delta);
}

function show_fire() {
    if (!is_host && auto_hand) {
        raise_hand();
        auto_hand = false;
    }
    console.log('received_fire');
    var container = document.getElementById('fire_container');
    container.innerHTML = '<h1 style="color: red;font-size: 64px;">💥🔫</h1>';
    if (fire_timer) {
        clearTimeout(fire_timer);
    }
    fire_timer = setTimeout(clear_fire, 5000);
}

function clear_fire() {
    fire_timer = null;
    var container = document.getElementById('fire_container');
    container.innerHTML = '';
}

function get_game() {
    var url_string = window.location;
    var url = new URL(url_string);
    game_id = url.searchParams.get("game_id");
    player_id = url.searchParams.get("player_id");

    var request = new XMLHttpRequest();
    request.open("GET", "<##API_URL##>/game?game_id=" + game_id + '&player_id=' + player_id);
    request.onreadystatechange = function() {
        if (this.readyState === 4 && this.status == 200) {
            console.log(this.response);
            var json = JSON.parse(this.responseText);
            console.log(json);
            game_id = json.game.id;
            game = json.game;
            current_slide = game.current_slide;
            is_host = json.is_host;
            sync_clock(function() {
                download_slide(0);
            });
        }
    }
    request.send();
}

function populate_game_id() {
    var url = "<##FRONT_URL##>/?game_id=" + game_id;
    var content = "Link do Jogo: ";
    content += "<b><a href=\"" + url;
    content += "\">" + url + "</a></b>";
    document.getElementById("game_id").innerHTML = content;
}

function download_slide(n) {
    if (n >= game.number_of_slides) {
        start_game();
        return;
    }

    document.getElementById("game_id").innerHTML = "Carregando: <b>" + (n / game.number_of_slides * 100).toFixed(2) + "%</b>";

    var request = new XMLHttpRequest();
    request.open("GET", "<##API_URL##>/slide?game_id=" + game_id + "&slide=" + n);
    request.responseType = 'arraybuffer';
    request.onreadystatechange = function() {
        if (this.readyState === 4 && this.status == 200) {
            slides.push(this.response);
            console.log("slides:", slides.length);
            download_slide(n + 1);
        }
    }
    request.send();
}

function start_game() {
    populate_game_id();
    join_socketio();
    register_keys();
    setup_slide_for_host();
    populate_slide();
    populate_players();
    populate_reset_button();
}

function setup_slide_for_host() {
    if (is_host) {
        var container = document.getElementById('first_row');
        var original_slide = document.getElementById('slide_image');
        original_slide.style.width = "50%";

        var next_slide = document.createElement("img");
        next_slide.className = "column";
        next_slide.id = "next_slide";
        next_slide.style.width = "20%";
        container.insertBefore(next_slide, container.children[1]);
    }
}

function populate_reset_button() {
    if (is_host) {
        var div = document.getElementById('reset_button_div');
        div.innerHTML = '<button onclick="reset_hands();">RESET</button>';
    } else {
        var div = document.getElementById('reset_button_div');
        div.innerHTML = '<button style="height:100px;width:100px" onmousedown="raise_hand();">👆</button>';
    }
}

function reset_hands() {
    socket.emit('reset_hands', {
        'game_id': game_id,
        'player_id': player_id,
    });
}

function populate_slide() {
    var image = slides[current_slide];
    image = 'data:image/jpeg;base64,' + base64ArrayBuffer(image);
    document.getElementById("slide_image").src = image;

    if (is_host) {
        if (current_slide + 1 < slides.length) {
            var next_image = slides[current_slide + 1];
            next_image = 'data:image/jpeg;base64,' + base64ArrayBuffer(next_image);
            document.getElementById("next_slide").src = next_image;
        } else {
            document.getElementById("next_slide").src = "https://dummyimage.com/600x400/000/fff.png&text=FIM"
        }
    }
}

function populate_raised_hands(raised_hands) {
    var div = document.getElementById('raised_hands');
    div.innerHTML = "";

    var list = "<ol>";
    raised_hands = raised_hands.map( (hand) => {
        return "<li><b>" + escapeHtml(hand['player']) + "</b> (" + hand['delay'].toFixed(2) + " ms)</li>";
    });
    list += raised_hands.join("");
    list += "</ol>"

    div.innerHTML = list;
}

function populate_players() {
    var div = document.getElementById('players');
    div.innerHTML = "";

    for (var i = 0; i < game.players.length; i++) {
        var player = game.players[i];
        console.log('populating: ' + player.id + "p: " + player.points);

        if (is_host) {
            var button = document.createElement('button');
            button.innerHTML = "-";
            button.onclick = make_point_callback(player.id, player.points - 1);
            div.appendChild(button);
        }

        var text = document.createElement('spam');
        text.innerHTML = escapeHtml(player.name) + ": " + player.points;
        div.appendChild(text);

        if (is_host) {
            var button = document.createElement('button');
            button.innerHTML = "+";
            button.onclick = make_point_callback(player.id, player.points + 1);
            div.appendChild(button);
        }

        if (i < game.players.length - 1) {
            var separator = document.createElement('spam');
            separator.innerHTML = "&nbsp;&nbsp;|&nbsp;&nbsp;";
            div.appendChild(separator);
        }
    }
}

function make_point_callback(player_id, points) {
    return function() {
        change_points(player_id, points);
    };
}

function change_points(player_to_change_id, points) {
    console.log('change_points: ' + player_to_change_id + "p: " + points);
    socket.emit('change_points', {
        'game_id': game_id,
        'host_id': player_id,
        'player_id': player_to_change_id,
        'points': points
    });
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
