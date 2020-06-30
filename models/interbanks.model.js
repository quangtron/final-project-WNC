const axios = require('axios');
const config = require('../config/default.json');
const moment = require('moment');
const cryptoJS = require('crypto-js');

module.exports = {
    get_info_customer: async (_card_number, _partner_code) => {
        if(_partner_code === 2){
            //Tạo chữ kí để gọi api truy vấn thông tin của ngân hàng khác
            const card_number = _card_number.toString();
            const data = moment().unix() + JSON.stringify({accountID: card_number});
            var signature = cryptoJS.HmacSHA256(data, config.interbank.secretKey).toString();

            let ret;

            await axios.get('https://wnc-api-banking.herokuapp.com/RSABank/users', {
                headers: {
                    'ts': moment().unix(),
                    'partner-code': _partner_code,
                    'sign': signature
                },
                data: {
                    accountID: card_number
                }
            }).then(response => {
                const partner_bank = config.interbank.partner_bank.filter(bank => bank.partner_code.toString() === _partner_code.toString())

                ret = {
                    info: response.data[0],
                    bank_name: partner_bank[0].name,
                }

            })

            return ret;
        }
        // if(_partner_code === 3){

        // }
    }
}