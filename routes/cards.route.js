const express = require('express');
const create_error = require('http-errors');
const low = require('lowdb');
const fileSync = require('lowdb/adapters/FileSync');

const cards_model = require('../models/cards.model');
const customers_model = require('../models/customers.model');
const type_cards_model = require('../models/type_cards.model');

const adapter = new fileSync('./config/default.json');
const db = low(adapter);

const router = express.Router();

router.get('/', async (req, res) => {
    const ret = await cards_model.all();

    res.status(200).json(ret);
})

router.get('/customer', async (req, res) => {
    const id = req.token_payload.id;

    const ret = await cards_model.find_by_id_customer(id);

    res.status(200).json(ret);
})

router.get('/customer/detail', async (req, res) => {
    if(await cards_model.is_exist(req.body.card_number) === false){
        throw create_error(400, 'Number card is not exist!');
    }

    const card = await cards_model.find_detail_by_card_number(req.body.card_number);
    const customer = await customers_model.detail(card.id_customer);

    const ret = {
        card_number: card.card_number,
        full_name: customer.full_name,
        phone_number: customer.phone_number,
        address: customer.address
    }
    
    res.status(200).json(ret);
})

router.post('/customer/add', async (req, res) => {
    await db.update('account_default.saving_card_number', n => n + 1).write();
    const card_number_temp = await db.get('account_default.saving_card_number').value();

    const entity_card = {
        id_customer: req.token_payload.id,
        id_type_card: 2,
        card_number: card_number_temp,
        balance: req.body.money,
    }

    const ret = await cards_model.add(entity_card);

    res.status(200).json(ret);
})

router.post('/customer/edit/:id', async (req, res) => {
    if(await cards_model.is_exist(req.body.card_number) === true){
        res.status(404).json('err_string: Number card is existed!!!');
    }
    else{
        const condition = {_id: req.params.id};
        const entity = req.body;

        const ret = await cards_model.edit(condition, entity);

        res.status(200).json(ret);
    }
})

router.post('/customer/delete/:id', async (req, res) => {
    const id = req.params.id;

    const ret = await cards_model.del(id);

    res.status(200).json(ret);
})

router.get('/id/:card_number', async (req, res) => {
    const card_number = req.params.card_number;
    
    const ret = await cards_model.find_id_by_card_number(card_number);

    res.status(200).json(ret);
})

module.exports = router;