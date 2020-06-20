const express = require('express');
const create_error = require('http-errors');
const moment = require('moment');

const cards_model = require('../models/cards.model');
const customers_model = require('../models/customers.model');
const transactions_model = require('../models/transactions.model');
const config = require('../config/default.json');

const router = express.Router();

router.post('/customer/sending/add', async (req, res) => {
    const { card_number, money, type_paid } = req.body;
    const id_customer = req.token_payload.id;

    if(await cards_model.is_exist(card_number) === false){
        throw create_error(400, 'Number card is not exist!');
    }

    const card_detail_sender = await cards_model.find_payment_card_by_id_customer(id_customer);

    let total_amount = money + config.account_default.card_maintenance_fee;

    if(type_paid === 1){
        total_amount += config.account_default.transaction_fee;
    }

    if(card_detail_sender.balance < total_amount){
        throw create_error(400, 'Balance is not enough!');
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
        id_customer,
        id_type_transaction: 1,
        id_partner_bank: 1,
        date_created: moment().format('YYYY-MM-DD HH:mm:ss')
    });

    res.status(200).json(req.body);
})

router.get('/customer/receiving', async (req, res) => {
    const id_customer = req.token_payload.id;
    const card = await cards_model.find_payment_card_by_id_customer(id_customer);
    const card_number = card.card_number;

    const transactions = await transactions_model.all_receiving_by_card_number(card_number);
    const ret = [];

    const promises = transactions.map(async item => {
        const sender = await customers_model.detail(item.id_customer);
        const card_sender = await cards_model.find_payment_card_by_id_customer(sender._id);

        const entity_ret_item = {
            _id: item._id,
            full_name: sender.full_name,
            card_number: card_sender.card_number,
            money: item.money,
            message: item.message,
            date_created: item.date_created
        }

        ret.push(entity_ret_item);
    })
    
    await Promise.all(promises);

    res.status(200).json(ret);
})

router.get('/customer/sending', async (req, res) => {
    const id_customer = req.token_payload.id;

    const transactions = await transactions_model.all_sending_by_id_customer(id_customer);
    const ret = [];

    const promises = transactions.map(async item => {
        const card_receiver = await cards_model.find_detail_by_card_number(item.card_number);
        const receiver = await customers_model.detail(card_receiver.id_customer);
        
        const entity_ret_item = {
            _id: item._id,
            full_name: receiver.full_name,
            card_number: item.card_number,
            money: item.money,
            message: item.message,
            date_created: item.date_created
        }

        ret.push(entity_ret_item);
    })

    await Promise.all(promises);

    res.status(200).json(ret);
})

router.get('/customer/reminding-debt', async (req, res) => {
    const id_customer = req.token_payload.id;

    const transactions = await transactions_model.all_reminding_debt_by_id_customer(id_customer);
    const ret = [];

    const promises = transactions.map(async item => {
        const card_receiver = await cards_model.find_detail_by_card_number(item.card_number);
        const receiver = await customers_model.detail(card_receiver.id_customer);
        
        const entity_ret_item = {
            _id: item._id,
            full_name: receiver.full_name,
            card_number: item.card_number,
            money: item.money,
            message: item.message,
            date_created: item.date_created
        }

        ret.push(entity_ret_item);
    })

    await Promise.all(promises);

    res.status(200).json(ret);

})

module.exports = router;