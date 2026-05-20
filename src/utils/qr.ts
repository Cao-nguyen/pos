export function generateVietQR(baseString: string, amount: number, note: string): string {
    if (!baseString) return '';
    
    // Check if the base string already has an amount or note (it shouldn't based on the user's string)
    // Strip CRC at the end (like `6304XXXX`)
    const base = baseString.slice(0, baseString.indexOf('6304'));
    if (!base) return baseString;

    // Tag 54: Amount
    const amountStr = amount.toString();
    const tag54 = "54" + amountStr.length.toString().padStart(2, '0') + amountStr;

    // Tag 62: Additional Data -> Tag 08: Purpose of transaction
    let tag62 = '';
    if (note) {
        // Tag 08: Purpose of transaction
        const tag08 = "08" + note.length.toString().padStart(2, '0') + note;
        tag62 = "62" + tag08.length.toString().padStart(2, '0') + tag08;
    }

    const newBase = base + (amount > 0 ? tag54 : '') + tag62 + "6304";

    function crc16(data: string) {
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

    return newBase + crc16(newBase);
}
