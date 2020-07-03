const express = require('express');
const moment = require('moment');
const crypto = require('crypto');
const cryptoJS = require('crypto-js');
const openpgp = require('openpgp');
const axios = require('axios');

const cards_model = require('../models/cards.model');
const customers_model = require('../models/customers.model');
const transactions_model = require('../models/transactions.model');
const interbanks_model = require('../models/interbanks.model');
const config = require('../config/default.json');

const router = express.Router();

//customer
router.post('/customer/sending/add', async (req, res) => {
    const { card_number, money, type_paid, message, partner_code } = req.body;
    const id_customer = req.token_payload.id;
    const card_detail_sender = await cards_model.find_payment_card_by_id_customer(id_customer);

    if(partner_code === 1){
        if(await cards_model.is_exist(card_number) === false){
            return res.status(204).json({is_error: true});
        }

        let total_amount = money + config.account_default.card_maintenance_fee;

        if(type_paid === 1){
            total_amount += config.account_default.transaction_fee;
        }

        if(card_detail_sender.balance < total_amount){
            console.log('Balance is not enough!');
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
            id_partner_bank: partner_code,
            message,
            date_created: moment().format('YYYY-MM-DD HH:mm:ss')
        });

        res.status(200).json(req.body);
    }
    // else if(partner_code === 2){
    //     let total_amount = money + config.account_default.card_maintenance_fee;

    //     if(type_paid === 1){
    //         total_amount += config.account_default.transaction_fee;
    //     }

    //     if(card_detail_sender.balance < total_amount){
    //         console.log('khong du tien');
    //         return res.status(400).json({is_error: true});
    //     }

    //     //Tạo chữ kí 
    //     const partner_bank = config.interbank.partner_bank.filter(bank => bank.partner_code.toString() === partner_code.toString());    
    //     const privateKeyArmored = partner_bank[0].my_private_key;
    //     const passphrase = `nhom17`; // what the private key is encrypted with

    //     const headerTs = moment().unix();
    //     // var data = headerTs + JSON.stringify({accountID: card_number, newBalance: money});

    //     const body = {
    //         accountID: card_number.toString(), newBalance: money.toString()
    //     }

    //     //Create Sign to Compare
    //     const { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
        
    //     await privateKey.decrypt(passphrase);

    //     const { data: cleartext } = await openpgp.sign({
    //         message: openpgp.cleartext.fromText(JSON.stringify(body)), // CleartextMessage or Message object
    //         privateKeys: [privateKey]                         // for signing
    //     });

    //     // console.log('data', cleartext);
    //     var data = headerTs + JSON.stringify(body);
    //     const sign = await cryptoJS.HmacSHA256(data, config.interbank.secretKey).toString();
        
    //     console.log(headerTs, sign);
    //     // console.log(sign);
    //     // console.log(headerTs);

    //     await axios.post('https://wnc-api-banking.herokuapp.com/api/RSATransfer',
    //         body, 
    //         {
    //             headers: {
    //                 'ts': headerTs,
    //                 'partner-code': partner_code,
    //                 'sign': sign
    //             }
    //         }
    //     ).then(async response => {
    //         if(response.data.status === 'OK'){ // thanh cong
    //             card_detail_sender.balance -= total_amount - config.account_default.card_maintenance_fee;
        
    //             await cards_model.edit({_id: card_detail_sender._id}, card_detail_sender);
        
    //             await transactions_model.add({
    //                 ...req.body,
    //                 card_number_sender: card_detail_sender.card_number,
    //                 card_number_receiver: card_number,
    //                 id_type_transaction: 1,
    //                 id_partner_bank: partner_code,
    //                 message,
    //                 date_created: moment().format('YYYY-MM-DD HH:mm:ss')
    //             });
        
    //             res.status(200).json(req.body);        
    //         }
    //         else{
    //             return res.status(400).json({is_error: true});
    //         }
    //     }).catch(error => {
    //         // console.log('err12312312', error)
    //         return res.status(400).json({is_error: true});
    //     })
    // }
    else{ // partner_code === 3 
        let total_amount = money + config.account_default.card_maintenance_fee;

        if(type_paid === 1){
            total_amount += config.account_default.transaction_fee;
        }

        if(card_detail_sender.balance < total_amount){
            console.log('Balance is not enough!');
            return res.status(400).json({is_error: true});
        }

        const headerTs = moment().unix();

        const transfer = await interbanks_model.transfer(headerTs, card_number, partner_code, money);

        if(transfer === true){ // thanh cong
            card_detail_sender.balance -= total_amount - config.account_default.card_maintenance_fee;
        
            await cards_model.edit({_id: card_detail_sender._id}, card_detail_sender);

            await transactions_model.add({
                ...req.body,
                card_number_sender: card_detail_sender.card_number,
                card_number_receiver: card_number,
                id_type_transaction: 1,
                id_partner_bank: partner_code,
                message,
                date_created: moment().format('YYYY-MM-DD HH:mm:ss')
            });

            res.status(200).json(req.body);        

        }
        else{
            return res.status(400).json({is_error: true});
        }

        //Tạo chữ kí 
        // const partner_bank = config.interbank.partner_bank.filter(bank => bank.partner_code.toString() === partner_code.toString());    
        // const my_private_key = partner_bank[0].my_private_key;
        
        // const body = {
        //     card_number: card_number, money: money
        // }

        // const headerTs = moment().unix();
        
        // var data = headerTs + JSON.stringify(body);

        // const sign = crypto.createSign('SHA256');

        // sign.write(data); // đưa data cần kí vào đây
        // const signature = sign.sign(my_private_key, 'hex'); // tạo chữ kí bằng private key
        
        // await axios.post('https://api-internet-banking-17.herokuapp.com/api/interbank/rsa-transfer',
        //     body, 
        //     {
        //         headers: {
        //             'ts': headerTs,
        //             'partner-code': partner_code,
        //             'sign': signature
        //         }
        //     }
        // ).then(async response => {
        //     // Verify
        //     const your_public_key = partner_bank[0].your_public_key;
        //     const verify = crypto.createVerify('SHA256');
        //     verify.write(response.data.msg);
        //     verify.end();
            
        //     if(!verify.verify(your_public_key, response.data.sign, 'hex')){ // truyen public key, chu ky vào để verify
        //         res.status(503).json({msg: 'SIGNATURE IS WRONG!'});
        //     }

        //     // if(response.data.msg === 'SUCCESSED!'){ // thanh cong
        //         card_detail_sender.balance -= total_amount - config.account_default.card_maintenance_fee;
        
        //         await cards_model.edit({_id: card_detail_sender._id}, card_detail_sender);
        
        //         await transactions_model.add({
        //             ...req.body,
        //             card_number_sender: card_detail_sender.card_number,
        //             card_number_receiver: card_number,
        //             id_type_transaction: 1,
        //             id_partner_bank: partner_code,
        //             message,
        //             date_created: moment().format('YYYY-MM-DD HH:mm:ss')
        //         });
        
        //         res.status(200).json(req.body);        
        //     // }
        //     // else{
        //     //     return res.status(400).json({is_error: true});
        //     // }
        // }).catch(error => {
        //     return res.status(400).json({is_error: true});
        // })
    }
})

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
            const sender = await interbanks_model.get_info_customer(item.card_number_sender, item.id_partner_bank);
            if(sender !== false){
                const entity_ret_item = {
                    _id: item._id,
                    full_name: sender.info.clientName,
                    card_number: item.card_number_sender,
                    bank_name: sender.bank_name,
                    money: item.money,
                    message: item.message,
                    date_created: item.date_created
                }

                ret.push(entity_ret_item);
            }
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
            const receiver = await interbanks_model.get_info_customer(item.card_number_receiver, item.id_partner_bank);
            if(receiver !== false){
                const entity_ret_item = {
                    _id: item._id,
                    full_name: receiver.info.clientName,
                    card_number: item.card_number_receiver,
                    bank_name: receiver.bank_name,
                    money: item.money,
                    message: item.message,
                    date_created: item.date_created
                }

                ret.push(entity_ret_item);
            }
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
            if(sender !== false){
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
        }
        else{
            const sender = await interbanks_model.get_info_customer(item.card_number_sender, item.id_partner_bank);

            const entity_ret_item = {
                _id: item._id,
                full_name: sender.info.clientName,
                card_number: item.card_number_sender,
                bank_name: sender.bank_name,
                money: item.money,
                message: item.message,
                date_created: item.date_created
            }

            ret.push(entity_ret_item);
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
            const receiver = await interbanks_model.get_info_customer(item.card_number_receiver, item.id_partner_bank);
            if(receiver !== false){
                const entity_ret_item = {
                    _id: item._id,
                    full_name: receiver.info.clientName,
                    card_number: item.card_number_receiver,
                    bank_name: receiver.bank_name,
                    money: item.money,
                    message: item.message,
                    date_created: item.date_created
                }

                ret.push(entity_ret_item);
            }
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

//Admin
router.get('/admin', async (req, res) => {
    const transactions = await transactions_model.all_transactions_interbank();
    const ret = [];

    const promises = transactions.map(async transaction => {
        /*if(await cards_model.is_exist(transaction.card_number_sender) === false ){
            const sender = await interbanks_model.get_info_customer(transaction.card_number_sender, transaction.id_partner_bank);
            const card_receiver = await cards_model.find_detail_by_card_number(transaction.card_number_receiver);
            const receiver = await customers_model.detail(card_receiver.id_customer);

            const entity_ret_item = {
                bank_name: sender.bank_name,
                full_name_sender: sender.info.clientName,
                card_number_sender: transaction.card_number_sender,
                full_name_receiver: receiver.full_name,
                card_number_receiver: transaction.card_number_receiver,
                type_transaction: 'Nhan Tien',
                money: transaction.money,
                message: transaction.message,
                date_created: transaction.date_created
            }

            ret.push(entity_ret_item);
        }
        else{
            const receiver = await interbanks_model.get_info_customer(transaction.card_number_receiver, transaction.id_partner_bank);
            const card_sender = await cards_model.find_detail_by_card_number(transaction.card_number_sender);
            const sender = await customers_model.detail(card_sender.id_customer);
            
            const entity_ret_item = {
                bank_name: receiver.bank_name,
                full_name_sender: sender.full_name,
                card_number_sender: transaction.card_number_sender,
                full_name_receiver: receiver.info.clientName,
                card_number_receiver: transaction.card_number_receiver,
                type_transaction: 'Chuyen Tien',
                money: transaction.money,
                message: transaction.message,
                date_created: transaction.date_created
            }

            ret.push(entity_ret_item);
        }*/

        const partner_bank = config.interbank.partner_bank.filter(bank => bank.partner_code.toString() === transaction.id_partner_bank.toString());
        const bank_name = partner_bank[0].name;

        if(await cards_model.is_exist(transaction.card_number_sender) === false ){
            const entity_ret_item = {
                bank_name: bank_name,
                // full_name_sender: sender.info.clientName,
                card_number_sender: transaction.card_number_sender,
                // full_name_receiver: receiver.full_name,
                card_number_receiver: transaction.card_number_receiver,
                type_transaction: 'Nhan Tien',
                money: transaction.money,
                message: transaction.message,
                date_created: transaction.date_created
            }

            ret.push(entity_ret_item);
        }else{
            const entity_ret_item = {
                bank_name: bank_name,
                // full_name_sender: sender.full_name,
                card_number_sender: transaction.card_number_sender,
                // full_name_receiver: receiver.info.clientName,
                card_number_receiver: transaction.card_number_receiver,
                type_transaction: 'Chuyen Tien',
                money: transaction.money,
                message: transaction.message,
                date_created: transaction.date_created
            }

            ret.push(entity_ret_item);
        }
    })

    await Promise.all(promises);

    res.status(200).json(ret);
})

router.post('/admin/partner-bank', async (req, res) => {
    const {partner_code} = req.body;
    const transactions = await transactions_model.all_transactions_interbank_by_partner_code(partner_code);

    const ret = [];

    const promises = transactions.map(async transaction => {
        if(await cards_model.is_exist(transaction.card_number_sender) === false ){
            const sender = await interbanks_model.get_info_customer(transaction.card_number_sender, transaction.id_partner_bank);
            const card_receiver = await cards_model.find_detail_by_card_number(transaction.card_number_receiver);
            const receiver = await customers_model.detail(card_receiver.id_customer);

            const entity_ret_item = {
                bank_name: sender.bank_name,
                full_name_sender: sender.info.clientName,
                card_number_sender: transaction.card_number_sender,
                full_name_receiver: receiver.full_name,
                card_number_receiver: transaction.card_number_receiver,
                type_transaction: 'Nhan Tien',
                money: transaction.money,
                message: transaction.message,
                date_created: transaction.date_created
            }

            ret.push(entity_ret_item);
        }
        else{
            const receiver = await interbanks_model.get_info_customer(transaction.card_number_receiver, transaction.id_partner_bank);
            const card_sender = await cards_model.find_detail_by_card_number(transaction.card_number_sender);
            const sender = await customers_model.detail(card_sender.id_customer);
            
            const entity_ret_item = {
                bank_name: receiver.bank_name,
                full_name_sender: sender.full_name,
                card_number_sender: transaction.card_number_sender,
                full_name_receiver: receiver.info.clientName,
                card_number_receiver: transaction.card_number_receiver,
                type_transaction: 'Chuyen Tien',
                money: transaction.money,
                message: transaction.message,
                date_created: transaction.date_created
            }

            ret.push(entity_ret_item);
        }
    })

    await Promise.all(promises);

    res.status(200).json(ret);
})

// router.post('/admin/duration', async (req, res) => {
//     const {start_time, end_time} = req.body;
//     const transactions = await transactions_model.all_transactions_interbank();

//     const ret = [];

//     const promises = transactions.map(async transaction => {
//         const date_created = moment(transaction.date_created).format('YYYY-MM-DD');
        
//         if (moment(date_created).format('x') >= moment(start_time).format('x') && moment(date_created).format('x') <= moment(end_time).format('x')){     
//             if(await cards_model.is_exist(transaction.card_number_sender) === false ){
//                 const sender = await interbanks_model.get_info_customer(transaction.card_number_sender, transaction.id_partner_bank);
//                 const card_receiver = await cards_model.find_detail_by_card_number(transaction.card_number_receiver);
//                 const receiver = await customers_model.detail(card_receiver.id_customer);

//                 const entity_ret_item = {
//                     bank_name: sender.bank_name,
//                     full_name_sender: sender.info.clientName,
//                     card_number_sender: transaction.card_number_sender,
//                     full_name_receiver: receiver.full_name,
//                     card_number_receiver: transaction.card_number_receiver,
//                     type_transaction: 'Nhan Tien',
//                     money: transaction.money,
//                     message: transaction.message,
//                     date_created: transaction.date_created
//                 }

//                 ret.push(entity_ret_item);
//             }
//             else{
//                 const receiver = await interbanks_model.get_info_customer(transaction.card_number_receiver, transaction.id_partner_bank);
//                 const card_sender = await cards_model.find_detail_by_card_number(transaction.card_number_sender);
//                 const sender = await customers_model.detail(card_sender.id_customer);
                
//                 const entity_ret_item = {
//                     bank_name: receiver.bank_name,
//                     full_name_sender: sender.full_name,
//                     card_number_sender: transaction.card_number_sender,
//                     full_name_receiver: receiver.info.clientName,
//                     card_number_receiver: transaction.card_number_receiver,
//                     type_transaction: 'Chuyen Tien',
//                     money: transaction.money,
//                     message: transaction.message,
//                     date_created: transaction.date_created
//                 }

//                 ret.push(entity_ret_item);
//             }
//         }
//     })

//     await Promise.all(promises);

//     res.status(200).json(ret);
// })

module.exports = router;