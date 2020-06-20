const express = require('express');
const low = require('lowdb');
const fileSync = require('lowdb/adapters/FileSync');

const customers_model = require('../models/customers.model');
const cards_model = require('../models/cards.model');
const config = require('../config/default.json');

const adapter = new fileSync('./config/default.json');
const db = low(adapter);

const router = express.Router();

router.get('/', async (req, res) => {
    const ret = await customers_model.all();
        
    res.status(200).json(ret);
})

router.get('/detail/:id', async (req, res) => {
    const id = req.params.id;
    
    const ret = await customers_model.detail(id);

    res.status(200).json(ret);
})

router.get('/detail', async (req, res) => {
    const id = req.token_payload.id;
    
    const ret = await customers_model.detail(id);

    res.status(200).json(ret);
})

router.post('/add-customer', async (req, res) => {
    // const {full_name, address, email, 
    //        phone_number, username, 
    //        password, day_of_birth, permission} = req.body;

    const new_customer = req.body;
    const customer = await customers_model.add(new_customer);

    await db.update('account_default.pre_card_number', n => n + 1).write();
    const card_number_temp = await db.get('account_default.pre_card_number').value();

    const entity_card = {
        id_customer: customer._id,
        id_type_card: 1,
        card_number: card_number_temp,
        balance: config.account_default.balance_default,
    }

    const card = await cards_model.add(entity_card);
    const result = {customer, card}

    res.status(200).json(result);
})

router.post('/edit/:id', async (req, res) => {
    const condition = {_id: req.params.id};
    const entity = req.body;

    const ret = await customers_model.edit(condition, entity);

    res.status(200).json(ret);
})

router.post('/delete-customer/:id', async (req, res) => {
    const id = req.params.id;

    const ret = await customers_model.del(id);

    res.status(200).json(ret);
})

router.get('/id/:username', async (req, res) => {
    const username = req.params.username;
    
    const ret = await customers_model.find_id_by_username(username);

    res.status(200).json(ret);
})

module.exports = router