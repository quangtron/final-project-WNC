const axios = require('axios');
const config = require('../config/default.json');
const moment = require('moment');
const cryptoJS = require('crypto-js');
const crypto = require('crypto');
const openpgp = require('openpgp');

const cards_model = require('../models/cards.model');
const customers_model = require('../models/customers.model');

module.exports = {
    get_info_customer: async (_card_number, _partner_code) => {
        if(_partner_code === 2){ // (PGP)
            //Tạo chữ kí để gọi api truy vấn thông tin của ngân hàng khác
            const card_number = _card_number.toString();
            const body = {
                accountID: card_number
            }

            const data = moment().unix() + JSON.stringify(body);
            var signature = cryptoJS.HmacSHA256(data, config.interbank.secretKey).toString();
            
            let ret;

            await axios.post('https://wnc-api-banking.herokuapp.com/api/RSABank/users', 
                body,
                {
                    headers: 
                    {
                        'ts': moment().unix(),
                        'partner_code': _partner_code,
                        'sign': signature
                    },
            }).then(response => {
                if(response.data.length === 0){
                    ret = false;
                }
                else{
                    const partner_bank = config.interbank.partner_bank.filter(bank => bank.partner_code.toString() === _partner_code.toString())

                    ret = {
                        info: {...response.data[0], card_number: _card_number},
                        bank_name: partner_bank[0].name,
                    }
                }
            }).catch(error => {
                ret = false;
            })

            return ret;
        }
        else{ // _partner_code === 3 (RSA)
            //Tạo chữ kí để gọi api truy vấn thông tin của ngân hàng khác
            // const card_number = _card_number.toString();
            const body = {
                card_number: _card_number
            }

            const data = moment().unix() + JSON.stringify(body);
            var signature = cryptoJS.HmacSHA256(data, config.interbank.secretKey).toString();
            
            let ret;

            await axios.post('https://api-internet-banking-17.herokuapp.com/api/interbank/rsa-customer', 
                body,
                {
                    headers: 
                    {
                        'ts': moment().unix(),
                        'partner_code': _partner_code,
                        'sign': signature
                    },
            }).then(response => {
                const partner_bank = config.interbank.partner_bank.filter(bank => bank.partner_code.toString() === _partner_code.toString())

                ret = {
                    info: response.data,
                    bank_name: partner_bank[0].name,
                }

            }).catch(error => {
                ret = false;
            })

            return ret;
        }
    },
    transfer: async (_ts, _card_number, _partner_code, _money, _message, _id_customer) => {
        const card_detail_sender = await cards_model.find_payment_card_by_id_customer(_id_customer);
        const sender = await customers_model.detail(_id_customer);
        let ret;

        if(_partner_code === 2){ //(PGP)
            //Tạo chữ kí 
            const partner_bank = config.interbank.partner_bank.filter(bank => bank.partner_code.toString() === _partner_code.toString());    
            const privateKeyArmored = partner_bank[0].my_pgp_private_key;
            const passphrase = `nhom17`; // what the private key is encrypted with
            
            const body = {
                accNumber: _card_number.toString(),
                newBalance: _money.toString(),
                message: _message,
                senderName: sender.full_name,
                senderNumber: card_detail_sender.card_number.toString()
            }
    
            const { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
            await privateKey.decrypt(passphrase);
    
            const { data: cleartext } = await openpgp.sign({
                message: openpgp.cleartext.fromText(JSON.stringify(body)), // CleartextMessage or Message object
                privateKeys: [privateKey]                         // for signing
            });
    
            var data = _ts + {cleartext};
            const sign = cryptoJS.HmacSHA256(data, "secretKey").toString();
    
            await axios.post('https://wnc-api-banking.herokuapp.com/api/RSATransfer',
                {cleartext}, 
                {
                    headers: {
                        'ts': _ts,
                        'partner_code': _partner_code,
                        'sign': sign
                    }
                }
            ).then(async response => {
                let cleartext = response.data.cleartext;
                let dataObj = cleartext.slice(
                    cleartext.indexOf('{'),
                    cleartext.indexOf('}') + 1
                );
                let data = JSON.parse(dataObj);
                if(data.success === true){ // thanh cong
                    ret = true;
                }
            }).catch(error => {
                ret = false;
            })
        }
        else{ // (RSA)
            //Tạo chữ kí 
            const partner_bank = config.interbank.partner_bank.filter(bank => bank.partner_code.toString() === _partner_code.toString());    
            const my_private_key = partner_bank[0].my_rsa_private_key;
            
            const body = {
                card_number: _card_number, money: _money
            }
            
            var data = _ts + JSON.stringify(body);

            const sign = crypto.createSign('SHA256');

            sign.write(data); // đưa data cần kí vào đây
            const signature = sign.sign(my_private_key, 'hex'); // tạo chữ kí bằng private key
            
            await axios.post('https://api-internet-banking-17.herokuapp.com/api/interbank/rsa-transfer',
                body, 
                {
                    headers: {
                        'ts': _ts,
                        'partner_code': _partner_code,
                        'sign': signature
                    }
                }
            ).then(async response => {
                // Verify
                const your_public_key = partner_bank[0].your_rsa_public_key;
                const verify = crypto.createVerify('SHA256');
                verify.write(response.data.msg);
                verify.end();
                
                if(!verify.verify(your_public_key, response.data.sign, 'hex')){ // truyen public key, chu ky vào để verify
                    ret = false;
                }
                else{
                    ret = true;
                }
            }).catch(error => {
                ret = false;
            })

        }

        return ret;
    }
}