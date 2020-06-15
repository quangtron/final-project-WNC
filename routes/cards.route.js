const express = require('express');
const mongoose = require('mongoose');
const cards_model = require('../models/cards.model');
const customers_model = require('../models/customers.model');
const type_cards_model = require('../models/type_cards.model');
const route = express.Router();

route.get('/', async (req, res) => {
    const ret = await cards_model.all();

    res.status(200).json(ret);
})

route.get('/:card_number', async (req, res) => {
    const card_number = req.params.card_number;
    
    const ret = await cards_model.detail(card_number);

    res.status(200).json(ret);
})

route.post('/add', async (req, res) => {
    const new_card = { //entity
        id_customer: await customers_model.find_id_by_username(req.body.username),
        id_type_card: await type_cards_model.find_id_by_name_type(req.body.name_type_card),
        card_number: req.body.card_number,
        balance: 100000
    }

    const ret = await cards_model.add(new_card);

    res.status(200).json(ret);
})

route.post('/edit/:card_number', async (req, res) => {
    const condition = {card_number: req.params.card_number};
    const entity = req.body;

    const ret = await cards_model.edit(condition, entity);

    res.status(200).json(ret);
})

route.post('/delete/:card_number', async (req, res) => {
    const card_number = req.params.card_number;

    const ret = await cards_model.del(card_number);

    res.status(200).json(ret);
})

route.get('/id/:card_number', async (req, res) => {
    const card_number = req.params.card_number;
    
    const ret = await cards_model.find_id_by_card_number(card_number);

    res.status(200).json(ret);
})

module.exports = route;