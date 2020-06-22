const express = require('express');
const create_error = require('http-errors');
const moment = require('moment');
const low = require('lowdb');
const fileSync = require('lowdb/adapters/FileSync');

const customers_model = require('../models/customers.model');
const cards_model = require('../models/cards.model');
const debtors_model = require('../models/debtors.model');
const notifications_cancel_debt_model = require('../models/notifications_cancel_debt.model');
const transactions_model = require('../models/transactions.model');
const config = require('../config/default.json');

const adapter = new fileSync('./config/default.json');
const db = low(adapter);

const router = express.Router();

router.get('/my-created', async (req, res) => {
    // ret = { // mình tạo
    //     _id,
    //     full_name (người nợ),
    //     card_number (người nợ),
    //     money,
    //     message
    // }
    const id_customer = req.token_payload.id;

    const debtors = await debtors_model.all_my_created_by_id_customer(id_customer);
    const ret = [];

    const promises = debtors.map(async item => {
        const card_debtor = await cards_model.find_detail_by_card_number(item.card_number);
        const debtor = await customers_model.detail(card_debtor.id_customer);
        const entity_debtor = {
            _id: item._id,
            full_name: debtor.full_name,
            card_number: item.card_number,
            money: item.money,
            message: item.message
        }
        
        ret.push(entity_debtor);
    })

    await Promise.all(promises);

    res.status(200).json(ret);
})

router.get('/others-sent', async (req, res) => {
    // ret = { // người khác gửi
    //     _id,
    //     full_name (người gửi),
    //     card_number (người gửi),
    //     money,
    //     message
    // }
    const id_customer =  req.token_payload.id;
    const card = await cards_model.find_payment_card_by_id_customer(id_customer);
    const card_number = card.card_number;
    
    const debtors = await debtors_model.all_others_sent_by_card_number(card_number);
    const ret = [];

    const promises = debtors.map(async item => {
        const sender = await customers_model.detail(item.id_customer);

        const card_sender = await cards_model.find_payment_card_by_id_customer(sender._id);
        
        const entity_sender = {
            _id: item._id,
            full_name: sender.full_name,
            card_number: card_sender.card_number,
            money: item.money,
            message: item.message
        }

        ret.push(entity_sender);
    })

    await Promise.all(promises);
    
    res.status(200).json(ret);
})

router.get('/my-created/unpaid', async (req, res) => {
    const id_customer = req.token_payload.id;

    const debtors = await debtors_model.all_my_created_unpaid_by_id_customer(id_customer);
    const ret = [];

    const promises = debtors.map(async item => {
        const card_debtor = await cards_model.find_detail_by_card_number(item.card_number);
        const debtor = await customers_model.detail(card_debtor.id_customer);
        const entity_debtor = {
            _id: item._id,
            full_name: debtor.full_name,
            card_number: item.card_number,
            money: item.money,
            message: item.message
        }
        
        ret.push(entity_debtor);
    })

    await Promise.all(promises);

    res.status(200).json(ret);

})

router.get('/others-sent/unpaid', async (req, res) => {
    const id_customer =  req.token_payload.id;
    const card = await cards_model.find_payment_card_by_id_customer(id_customer);
    const card_number = card.card_number;
    
    const debtors = await debtors_model.all_others_sent_unpaid_by_card_number(card_number);
    const ret = [];

    const promises = debtors.map(async item => {
        const sender = await customers_model.detail(item.id_customer);

        const card_sender = await cards_model.find_payment_card_by_id_customer(sender._id);
        
        const entity_sender = {
            _id: item._id,
            full_name: sender.full_name,
            card_number: card_sender.card_number,
            money: item.money,
            message: item.message
        }

        ret.push(entity_sender);
    })

    await Promise.all(promises);
    
    res.status(200).json(ret);

})

router.post('/add', async (req, res) => {
    if(await cards_model.is_exist(req.body.card_number) === false){
        res.status(404).json({is_error: true});
        throw create_error(400, 'Number card is not exist!');
    }
    const entity_new_debtor = {
        id_customer: req.token_payload.id,
        is_paid: 1,
        card_number: req.body.card_number,
        money: req.body.money,
        message: req.body.message
    }

    const ret = await debtors_model.add(entity_new_debtor);

    res.status(200).json(ret);
})

router.post('/delete/:id', async (req, res) => {
    const id_customer = req.token_payload.id;
    const id_debtor = req.params.id;

    const card_customer = await cards_model.find_payment_card_by_id_customer(id_customer);
    const debtor = await debtors_model.detail(id_debtor);

    if(id_customer.toString() === debtor.id_customer.toString()){ // them thong bao huy nhac no do minh tao
        const card_debtor = await cards_model.find_detail_by_card_number(debtor.card_number);
        
        const entity_new_notification_cancel_debt = {
            id_customer: card_debtor.id_customer,
            message: req.body.message,
            is_notified: 1
        }

        await notifications_cancel_debt_model.add(entity_new_notification_cancel_debt);
    }  
    else { // them thong bao huy nhac no do nguoi khac gui
        const entity_new_notification_cancel_debt = {
            id_customer: debtor.id_customer,
            message: req.body.message,
            is_notified: 1
        } 

        await notifications_cancel_debt_model.add(entity_new_notification_cancel_debt);
    }

    const ret = await debtors_model.del(id_debtor);

    res.status(200).json(ret);
})

router.post('/transaction/reminding-debt/:id', async (req, res) => {
    const id_customer = req.token_payload.id;
    const id_debtor = req.params.id;

    const debtor = await debtors_model.detail(id_debtor);

    // Vì chỉ thanh toán nhắc nợ những nợ do người khac gửi nên không cần so sánh để kiểm tra cái nào do người khác gửi
    const card_receiver = await cards_model.find_payment_card_by_id_customer(debtor.id_customer); // card detail cua nguoi se nhan tien (nguoi nhac no)
    const card_sender = await cards_model.find_payment_card_by_id_customer(id_customer); // card detail cua nguoi tra no 
    
    let total_amount = debtor.money + config.account_default.card_maintenance_fee + config.account_default.transaction_fee;
    
    if(card_sender.balance < total_amount){
        res.status(400).json({is_error: true});
        throw create_error(400, 'Balance is not enough!');
    }

    card_sender.balance -= total_amount - config.account_default.card_maintenance_fee;
    card_receiver.balance += debtor.money;

    await cards_model.edit({_id: card_sender._id}, card_sender);
    await cards_model.edit({_id: card_receiver._id}, card_receiver);

    debtor.is_paid = 2;
    await debtors_model.edit({_id: id_debtor}, debtor);

    const entity_new_transaction = {
        id_customer: id_customer,
        id_type_transaction: 2,
        id_partner_bank: 1,
        card_number: card_receiver.card_number,
        message: 'Thanh toán nợ',
        money: debtor.money,
        type_paid: 1,
        date_created: moment().format('YYYY-MM-DD HH:mm:ss')
    }

    const ret = await transactions_model.add(entity_new_transaction);

    res.status(200).json(ret);
})

 module.exports = router;