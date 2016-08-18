function Util() {

    this.updatesignalimage = function(peripheral) {
        if (!(peripheral && peripheral.rssi)) {
            return peripheral;
        }
        if (Math.abs(peripheral.rssi) < 45) {
            peripheral.image = 'images/signal_5@2x.png';
        } else if (Math.abs(peripheral.rssi) < 55) {
            peripheral.image = 'images/signal_4@2x.png';
        } else if (Math.abs(peripheral.rssi) < 65) {
            peripheral.image = 'images/signal_3@2x.png';
        } else if (Math.abs(peripheral.rssi) < 75) {
            peripheral.image = 'images/signal_2@2x.png';
        } else {
            peripheral.image = 'images/signal_1@2x.png';
        }

        return peripheral;
    };

    this.pushUniqueObj = function(array, item) {
        var found = false,
            idx = -1;
        if (typeof array !== 'undefined') {
            for (idx = 0; idx < array.length; idx++) {
                if (array[idx].uuid === item.uuid) {
                    found = true;
                    break;
                }
            }
        } else {
            array = [];
        }
        if (found) {
            array.splice(idx, 1, item);
            return array;
        } else {
            array.push(item);
            return array;
        }
    };

    this.isEmpty = function(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop))
                return false;
        }
        return JSON.stringify(obj) === JSON.stringify({});
    };

    this.isValidHex = function(sNum){
        var isHex = false;
        for (var i = 0; i < sNum.length; i++) {
            if((typeof sNum[i] === 'string') && ! isNaN( parseInt(sNum[i], 16) )){
                isHex = true;
            }else{
                isHex = false;
                return isHex;
            }
        }
      return isHex;
    };

    this.hex2a = function(hexx) {
        if(hexx){
            var hex = hexx.toString();
            var str = '';
            for (var i = 0; i < hex.length; i += 2) {
                str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
            }
            return str;
        }
    };

    this.hex2dec = function(hexx) {
        return parseInt(hexx, 16);
    };

    this.hex2b = function(hexx) {
        var num = hex2i(hexx);
        return num.toString(2);
    };

    this.a2hex = function(asci) {
        var str = '';
        for (var a = 0; a < asci.length; a++) {
            str = str + asci.charCodeAt(a).toString(16);
        }
        return str;
    };

    this.dec2hex = function(d) {
        var hex = Number(d).toString(16);
        while (hex.length < 2) {
            hex = '0' + hex;
        }

        return hex;
    };

    return this;
}