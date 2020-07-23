function create_quiz() {
    var formData = new FormData();

    var file_field = document.getElementById("presentation_file");

    formData.append("presentation_file", file_field.files[0]);

    var button = document.getElementById('join_button');
    button.innerHTML = 'Criando…';
    button.disabled = true;

    var request = new XMLHttpRequest();
    request.open("POST", "<##API_URL##>/new_game");
    request.onreadystatechange = function() {
        if (this.readyState === 4 && this.status == 200) {
            console.log(this.response);
            var json = JSON.parse(this.responseText);
            var new_url = "<##FRONT_URL##>/game.html?";
            new_url += "game_id=" + json.game_id;
            new_url += "&"
            new_url += "player_id=" + json.player_id;
            window.location = new_url;
        } else if (this.readyState === 4) {
            button.innerHTML = 'ERROR!';
            button.disabled = false;
        }
    }
    request.send(formData);
}

function join_quiz() {
    var formData = new FormData();

    var player_name = document.getElementById("player_name").value;
    var game_id = document.getElementById("game_id").value;

    formData.append("player_name", player_name);
    formData.append("game_id", game_id);

    var request = new XMLHttpRequest();
    request.open("POST", "<##API_URL##>/new_player");
    request.onreadystatechange = function() {
        if (this.readyState === 4 && this.status == 200) {
            console.log(this.response);
            var json = JSON.parse(this.responseText);
            var new_url = "<##FRONT_URL##>/game.html?";
            new_url += "game_id=" + json.game_id;
            new_url += "&"
            new_url += "player_id=" + json.player_id;
            window.location = new_url;
        }
    }
    request.send(formData);
}

window.onload = function() {
    var url_string = window.location;
    var url = new URL(url_string);
    game_id = url.searchParams.get("game_id");

    document.getElementById('game_id').value = game_id;
}
