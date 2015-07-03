function Util()
{
    this.updatesignalimage = function(peripheral)
    {
        if(Math.abs(peripheral.rssi) <10 ) {
            peripheral.image = "images/signal_5@2x.png";
        }
        else if(Math.abs(peripheral.rssi) <30 ) {
            peripheral.image = "images/signal_4@2x.png";
        }
        else if(Math.abs(peripheral.rssi) <50 ) {
            peripheral.image = "images/signal_3@2x.png";
        }
        else if(Math.abs(peripheral.rssi) <70 ) {
            peripheral.image = "images/signal_2@2x.png";
        }
        else {
            peripheral.image = "images/signal_1@2x.png";
        }
        
        return peripheral;
    };
    
    this.hex2a = function(hexx) {
        var str = '';
        if(hexx) {
            var hex = hexx.toString();
            for (var i = 0; i < hex.length; i += 2)
                str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        return str;
    };
    
    this.hex2dec = function(hexx) {
        var str = '';
        if(hexx) {
            str = parseInt(hexx,16);
        }
        return str;
    };
    
    this.hex2b = function(hexx) {
        var num = hex2i(hexx);
        return num.toString(2);
    };
    
    this.a2hex = function(asci){
        var str = '';
        for (a = 0; a < asci.length; a++) {
            str = str + asci.charCodeAt(a).toString(16);
        }
        return str;
    };
    
    this.dec2hex = function(d) {
        var hex = Number(d).toString(16);
        while (hex.length < 2) {
            hex = "0" + hex;
        }
        return hex;
    };
    
    this.show_alert = function(message) {
        $('#customalert').addClass('alert-show');
        $('.alert-box').show();
        
        // display the message
        $('#alertmessage').html(message);
    };
    
    this.hide_alert = function () {
        $('#customalert').removeClass('alert-show');
        $('.alert-box').hide();
    };
    
    return this;
}

app.filter('orderObjectBy', function() {
           return function(items, field, reverse) {
           var filtered = [];
           angular.forEach(items, function(item) {
                           filtered.push(item);
                           });
           if(reverse){
           return filtered;
           }
           
           filtered.sort(function (a, b) {
                         return (Math.abs(a[field]) > Math.abs(b[field]) ? 1 : -1);
                         });
           
           return filtered;
           };
});

