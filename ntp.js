var offset = 0.0;  // initial guess

function sync_clock(callback) {
    var url = "<##API_URL##>/epoch";

    var request = new XMLHttpRequest();
    request.open("GET", "<##API_URL##>/epoch");
    var start = 0;
    request.onreadystatechange = function() {
        if (this.readyState === 4 && this.status == 200) {
            var end = + new Date();
            var json = JSON.parse(this.responseText);
            var round_trip_time = (end - start)/2;
            offset = json.epoch - (+ new Date()) + round_trip_time;
            console.log('offset: ' + offset);
            console.log('now: ' + synced_epoch());
            callback();
        }
    }
    start = + new Date();
    request.send();
}

function synced_epoch() {
    return + new Date() + offset;
}
