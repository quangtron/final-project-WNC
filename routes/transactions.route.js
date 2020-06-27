const express = require('express');
const moment = require('moment');
const cryptoJS = require('crypto-js');
const openpgp = require('openpgp');
const axios = require('axios');

const cards_model = require('../models/cards.model');
const customers_model = require('../models/customers.model');
const transactions_model = require('../models/transactions.model');
const config = require('../config/default.json');

const router = express.Router();

//customer
router.post('/customer/sending/add', async (req, res) => {
    const { card_number, money, type_paid, message, id_partner_code } = req.body;
    const id_customer = req.token_payload.id;
    const card_detail_sender = await cards_model.find_payment_card_by_id_customer(id_customer);

    if(id_partner_code === 1){
        if(await cards_model.is_exist(card_number) === false){
            return res.status(204).json({is_error: true});
        }

        let total_amount = money + config.account_default.card_maintenance_fee;

        if(type_paid === 1){
            total_amount += config.account_default.transaction_fee;
        }

        if(card_detail_sender.balance < total_amount){
            console.log('khong du tien');
            return res.status(400).json({is_error: true});
        }

        card_detail_sender.balance -= total_amount - config.account_default.card_maintenance_fee;

        const card_detail_receiver = await cards_model.find_detail_by_card_number(card_number);
        card_detail_receiver.balance += money;

        if(type_paid === 2){
            card_detail_receiver.balance -= config.account_default.transaction_fee;
        }

        await cards_model.edit({_id: card_detail_sender._id}, card_detail_sender);
        await cards_model.edit({_id: card_detail_receiver._id}, card_detail_receiver);

        await transactions_model.add({
            ...req.body,
            card_number_sender: card_detail_sender.card_number,
            card_number_receiver: card_detail_receiver.card_number,
            id_type_transaction: 1,
            id_partner_bank: id_partner_code,
            message,
            date_created: moment().format('YYYY-MM-DD HH:mm:ss')
        });

        res.status(200).json(req.body);
    }
    else{
        let total_amount = money + config.account_default.card_maintenance_fee;

        if(type_paid === 1){
            total_amount += config.account_default.transaction_fee;
        }

        if(card_detail_sender.balance < total_amount){
            console.log('khong du tien');
            return res.status(400).json({is_error: true});
        }

        //Tạo chữ kí 
        const privateKeyArmored = config.PGP.privateKey;

        const headerTs = moment().unix();
        var data = headerTs + JSON.stringify({accountID: card_number, newBalance: money});

        //Create Sign to Compare
        const sign = await cryptoJS.HmacSHA256(data, privateKeyArmored).toString();
        // console.log(sign);
        // console.log(headerTs);

        const body = {
            accountID: card_number, newBalance: money
        }

        await axios.post('https://wnc-api-banking.herokuapp.com/api/PGP/users',
            body, 
            {
                headers: {
                    'ts': headerTs,
                    'partner-code': id_partner_code,
                    'sign': sign
                }
            }
        ).then(async response => {
            if(response.data.status === 'OK'){ // thanh cong
                card_detail_sender.balance -= total_amount - config.account_default.card_maintenance_fee;
        
                await cards_model.edit({_id: card_detail_sender._id}, card_detail_sender);
        
                await transactions_model.add({
                    ...req.body,
                    card_number_sender: card_detail_sender.card_number,
                    card_number_receiver: card_number,
                    id_type_transaction: 1,
                    id_partner_bank: id_partner_code,
                    message,
                    date_created: moment().format('YYYY-MM-DD HH:mm:ss')
                });
        
                res.status(200).json(req.body);        
            }
            else{
                return res.status(400).json({is_error: true});
            }
        }).catch(error => {
            // console.log('err12312312', error)
            return res.status(400).json({is_error: true});
        })

    }
})

// router.post('/customer/sending/add/temp', async (req, res) => {
//     if(await cards_model.is_exist(req.body.card_number) === false){
//         // return res.status(400).json({is_error: true});

//         //Tạo chữ kí 
//         const privateKeyArmored = config.PGP.privateKey;
//         // console.log(privateKeyArmored);
//         const passphrase = `thanhtri`; // what the private key is encrypted with
        
//         // const card_number = req.body.card_number;
//         // const ts = moment().unix();
//         // const data = ts + JSON.stringify(req.body);

//         // const { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
//         // await privateKey.decrypt(passphrase);
     
//         // const { signature: detachedSignature } = await openpgp.sign({
//         //     message: openpgp.cleartext.fromText(data), // CleartextMessage or Message object
//         //     privateKeys: [privateKey],                            // for signing
//         //     detached: true
//         // });
//         // console.log(detachedSignature);
//         // console.log(ts);
//         const card_number = req.body.card_number.toString();
//         const money = req.body.money.toString()
//         const id_partner_code =  req.body.id_partner_code;
//         // const data = moment().unix() + JSON.stringify({accountID: card_number});
//         // var signature = cryptoJS.HmacSHA256(data, config.interbank.secretKey).toString();

//         // const sign = await cryptoJS.SHA256(data, privateKeyArmored).toString();
//         // console.log(sign);

//         // console.log({accountID: card_number, newBalance: money});

//         const headerTs = moment().unix();
        
//         var data = headerTs + JSON.stringify({accountID: card_number, newBalance: money});

//         //Create Sign to Compare
//         const sign = await cryptoJS.HmacSHA256(data, privateKeyArmored).toString();
//         // console.log(sign);
//         // console.log(headerTs);

//         const body = {
//             accountID: card_number, newBalance: money
//         }

//         await axios.post('https://wnc-api-banking.herokuapp.com/api/PGP/users',
//             body, 
//             {
//                 headers: {
//                     'ts': headerTs,
//                     'partner-code': '2',
//                     'sign': sign
//                 }
//             }
//         ).then(response => {
//             if(response.data.status === 'OK'){ // thanh cong
                
//                 const new_transaction = {
//                     ...req.body,
//                     card_number_sender: card_detail_sender.card_number,
//                     card_number_receiver: card_detail_receiver.card_number,
//                     id_type_transaction: 1, // chuyen tien
//                     id_partner_bank: id_partner_code,
//                     date_created: moment().format('YYYY-MM-DD HH:mm:ss')
//                 };

//                 return res.status(200).json(response.data);
//             }
//             else{
//                 return res.status(400).json({is_error: true});
//             }
//         }).catch(error => {
//             // console.log('err12312312', error)
//             return res.status(400).json({is_error: true});
//         })
//     }else{
        
//         return res.status(200).json({msg: 'exist card number!'});
//     }
// })

router.get('/customer/receiving', async (req, res) => {
    const id_customer = req.token_payload.id;
    const card = await cards_model.find_payment_card_by_id_customer(id_customer);
    const card_number = card.card_number;

    const transactions = await transactions_model.all_receiving_by_card_number_receiver(card_number);
    const ret = [];

    const promises = transactions.map(async item => {
        if(item.id_partner_bank === 1){
            const card_sender = await cards_model.find_detail_by_card_number(item.card_number_sender);
            const sender = await customers_model.detail(card_sender.id_customer);

            const entity_ret_item = {
                _id: item._id,
                full_name: sender.full_name,
                card_number: card_sender.card_number,
                bank_name: 'Noi Bo',
                money: item.money,
                message: item.message,
                date_created: item.date_created
            }

            ret.push(entity_ret_item);
        }else{
            //Tạo chữ kí để gọi api truy vấn thông tin của ngân hàng khác
            const card_number_sender = item.card_number_sender.toString();
            const data = moment().unix() + JSON.stringify({accountID: card_number_sender});
            var signature = cryptoJS.HmacSHA256(data, config.interbank.secretKey).toString();

            await axios.get('https://wnc-api-banking.herokuapp.com/api/users', {
                headers: {
                    'ts': moment().unix(),
                    'partner-code': item.id_partner_bank.toString(),
                    'sign': signature
                },
                data: {
                    accountID: card_number_sender
                }
            }).then(response => {
                const sender = response.data[0];
                
                const partner_bank = config.interbank.partner_bank.filter(bank => bank.partner_code.toString() === item.id_partner_bank.toString())

                const entity_ret_item = {
                    _id: item._id,
                    full_name: sender.clientName,
                    card_number: item.card_number_sender,
                    bank_name: partner_bank[0].name,
                    money: item.money,
                    message: item.message,
                    date_created: item.date_created
                }
    
                ret.push(entity_ret_item);
            })
        }
    })
    
    await Promise.all(promises);

    return res.status(200).json(ret);
})

router.get('/customer/sending', async (req, res) => {
    const id_customer = req.token_payload.id;
    const card = await cards_model.find_payment_card_by_id_customer(id_customer);
    const card_number = card.card_number;

    const transactions = await transactions_model.all_sending_by_card_number_sender(card_number);
    const ret = [];

    const promises = transactions.map(async item => {
        if(item.id_partner_bank === 1){
            const card_receiver = await cards_model.find_detail_by_card_number(item.card_number_receiver);
            const receiver = await customers_model.detail(card_receiver.id_customer);
            
            const entity_ret_item = {
                _id: item._id,
                full_name: receiver.full_name,
                card_number: item.card_number_receiver,
                bank_name: 'Noi Bo',
                money: item.money,
                message: item.message,
                date_created: item.date_created
            }

            ret.push(entity_ret_item);
        }else{
            //Tạo chữ kí để gọi api truy vấn thông tin của ngân hàng khác
            const card_number_receiver = item.card_number_receiver.toString();
            const data = moment().unix() + JSON.stringify({accountID: card_number_receiver});
            var signature = cryptoJS.HmacSHA256(data, config.interbank.secretKey).toString();

            await axios.get('https://wnc-api-banking.herokuapp.com/api/users', {
                headers: {
                    'ts': moment().unix(),
                    'partner-code': item.id_partner_bank,
                    'sign': signature
                },
                data: {
                    accountID: card_number_receiver
                }
            }).then(response => {
                const receiver = response.data[0];
                
                const partner_bank = config.interbank.partner_bank.filter(bank => bank.partner_code.toString() === item.id_partner_bank.toString())

                const entity_ret_item = {
                    _id: item._id,
                    full_name: receiver.clientName,
                    card_number: item.card_number_receiver,
                    bank_name: partner_bank[0].name,
                    money: item.money,
                    message: item.message,
                    date_created: item.date_created
                }
    
                ret.push(entity_ret_item);
            })
        }
    })

    await Promise.all(promises);

    return res.status(200).json(ret);
})

router.get('/customer/reminding-debt', async (req, res) => {
    const id_customer = req.token_payload.id;
    const card = await cards_model.find_payment_card_by_id_customer(id_customer);
    const card_number = card.card_number;

    const transactions = await transactions_model.all_reminding_debt_by_card_number_sender(card_number);
    const ret = [];

    const promises = transactions.map(async item => {
        const card_receiver = await cards_model.find_detail_by_card_number(item.card_number);
        const receiver = await customers_model.detail(card_receiver.id_customer);
        
        const entity_ret_item = {
            _id: item._id,
            full_name: receiver.full_name,
            card_number: item.card_number_receiver,
            bank_name: 'Noi Bo',
            money: item.money,
            message: item.message,
            date_created: item.date_created
        }

        ret.push(entity_ret_item);
    })

    await Promise.all(promises);

    return res.status(200).json(ret);
})

//Teller
router.post('/teller/sending/add', async (req, res) => {
    const { card_number, money } = req.body;
    // const id_customer = req.token_payload.id;

    if(await cards_model.is_exist(card_number) === false){
        return res.status(204).json({is_error: true});
    }

    const card_receiver = await cards_model.find_detail_by_card_number(card_number);
    card_receiver.balance += money;

    await cards_model.edit({_id: card_receiver._id}, card_receiver);

    // await transactions_model.add({
    //     ...req.body,
    //     id_customer,
    //     id_type_transaction: 1,
    //     id_partner_bank: 1,
    //     date_created: moment().format('YYYY-MM-DD HH:mm:ss')
    // });

    return res.status(200).json(req.body);
})

router.get('/teller/receiving', async (req, res) => {
    const {card_number} = req.body;

    const transactions = await transactions_model.all_receiving_by_card_number_receiver(card_number);
    const ret = [];

    const promises = transactions.map(async item => {
        if(item.id_partner_bank === 1){
            const card_sender = await cards_model.find_detail_by_card_number(item.card_number_sender);
            const sender = await customers_model.detail(card_sender.id_customer);
            
            const entity_ret_item = {
                _id: item._id,
                full_name: sender.full_name,
                card_number: card_sender.card_number,
                bank_name: "Noi Bo",
                money: item.money,
                message: item.message,
                date_created: item.date_created
            }

            ret.push(entity_ret_item);
        }
        else{
            //Tạo chữ kí để gọi api truy vấn thông tin của ngân hàng khác
            const card_number_sender = item.card_number_sender.toString();
            const data = moment().unix() + JSON.stringify({accountID: card_number_sender});
            var signature = cryptoJS.HmacSHA256(data, config.interbank.secretKey).toString();

            await axios.get('https://wnc-api-banking.herokuapp.com/api/users', {
                headers: {
                    'ts': moment().unix(),
                    'partner-code': item.id_partner_bank,
                    'sign': signature
                },
                data: {
                    accountID: card_number_sender
                }
            }).then(response => {
                const sender = response.data[0];
                
                const partner_bank = config.interbank.partner_bank.filter(bank => bank.partner_code.toString() === item.id_partner_bank.toString())

                const entity_ret_item = {
                    _id: item._id,
                    full_name: sender.clientName,
                    card_number: item.card_number_sender,
                    bank_name: partner_bank[0].name,
                    money: item.money,
                    message: item.message,
                    date_created: item.date_created
                }
    
                ret.push(entity_ret_item);
            })
        }
    })
    
    await Promise.all(promises);

    return res.status(200).json(ret);
})

router.get('/teller/sending', async (req, res) => {
    const {card_number} = req.body;
    // const card_customer = await cards_model.find_detail_by_card_number(card_number);

    const transactions = await transactions_model.all_sending_by_card_number_sender(card_number);
    const ret = [];

    const promises = transactions.map(async item => {
        if(item.id_partner_bank === 1){
            const card_receiver = await cards_model.find_detail_by_card_number(item.card_number_receiver);
            const receiver = await customers_model.detail(card_receiver.id_customer);
            
            const entity_ret_item = {
                _id: item._id,
                full_name: receiver.full_name,
                card_number: item.card_number_receiver,
                bank_name: 'Noi Bo',
                money: item.money,
                message: item.message,
                date_created: item.date_created
            }

            ret.push(entity_ret_item);
        }else{
            //Tạo chữ kí để gọi api truy vấn thông tin của ngân hàng khác
            const card_number_receiver = item.card_number_receiver.toString();
            const data = moment().unix() + JSON.stringify({accountID: card_number_receiver});
            var signature = cryptoJS.HmacSHA256(data, config.interbank.secretKey).toString();

            await axios.get('https://wnc-api-banking.herokuapp.com/api/users', {
                headers: {
                    'ts': moment().unix(),
                    'partner-code': item.id_partner_bank,
                    'sign': signature
                },
                data: {
                    accountID: card_number_receiver
                }
            }).then(response => {
                const receiver = response.data[0];
                
                const partner_bank = config.interbank.partner_bank.filter(bank => bank.partner_code.toString() === item.id_partner_bank.toString())

                const entity_ret_item = {
                    _id: item._id,
                    full_name: receiver.clientName,
                    card_number: item.card_number_receiver,
                    bank_name: partner_bank[0].name,
                    money: item.money,
                    message: item.message,
                    date_created: item.date_created
                }
    
                ret.push(entity_ret_item);
            })
        }
    })

    await Promise.all(promises);

    return res.status(200).json(ret);
})

router.get('/teller/reminding-debt', async (req, res) => {
    const {card_number} = req.body;
    // const card_customer = await cards_model.find_detail_by_card_number(card_number);
    
    const transactions = await transactions_model.all_reminding_debt_by_card_number_sender(card_number);
    const ret = [];

    const promises = transactions.map(async item => {
        const card_receiver = await cards_model.find_detail_by_card_number(item.card_number.receiver);
        const receiver = await customers_model.detail(card_receiver.id_customer);
        
        const entity_ret_item = {
            _id: item._id,
            full_name: receiver.full_name,
            card_number: item.card_number_receiver,
            bank_name: 'Noi Bo',
            money: item.money,
            message: item.message,
            date_created: item.date_created
        }

        ret.push(entity_ret_item);
    })

    await Promise.all(promises);

    return res.status(200).json(ret);

})

module.exports = router;