const str = "0002010102111531397007040052044600009362810200938550010A000000727012500069704230111936281020090208QRIBFTTA5204513753037045802VN5913LY CAO NGUYEN6006Ha Noi8707CLASSIC6304916D";

// Strip CRC 6304916D
const base = str.slice(0, -8);

// Tag 54: Amount
const amount = "150000";
const tag54 = "54" + amount.length.toString().padStart(2, '0') + amount;

// Tag 62: Additional Data -> Tag 08: Purpose of transaction
const note = "LST150K";
const tag08 = "08" + note.length.toString().padStart(2, '0') + note;
const tag62 = "62" + tag08.length.toString().padStart(2, '0') + tag08;

const newBase = base + tag54 + tag62 + "6304";

// crc16 ccitt false
function crc16(data) {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) > 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

console.log(newBase + crc16(newBase));
