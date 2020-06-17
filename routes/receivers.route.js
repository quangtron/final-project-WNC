const express = require('express');
const mongoose = require('mongoose');
const receivers_model = require('../models/receivers.model');
const customers_model = require('../models/customers.model');
const cards_model = require('../models/cards.model');
const route = express.Router();

route.get('/', async (req, res) => {
    const id_customer = req.token_payload.id;
    const ret = await receivers_model.all(id_customer);

    res.status(200).json(ret);
})

route.get('/:id', async (req, res) => {
    const id = req.params.id;
    
    const ret = await receivers_model.detail(id);

    res.status(200).json(ret);
})

route.post('/add', async (req, res) => {
    if(await cards_model.is_exist(req.body.card_number) === false){
        res.status(404).json('err_string: Number card is not exist!!!');
    }
    else{
        const id_customer = req.token_payload.id;
        const card_receiver = await cards_model.detail(req.body.card_number);
        const id_receiver = card_receiver[0].id_customer;
        const receiver = await customers_model.detail(id_receiver);

        var reminiscent_name = req.body.reminiscent_name;

        if(req.body.reminiscent_name === ''){
            reminiscent_name = receiver.full_name;
        }

        const new_receiver = {
            id_customer: id_customer,
            card_number: req.body.card_number,
            reminiscent_name: reminiscent_name
        }

        const ret = await receivers_model.add(new_receiver);

        res.status(200).json(ret);
    }
})

route.post('/edit/:id', async (req, res) => {
    if(await cards_model.is_exist(req.body.card_number) === false){
        res.status(404).json('err_string: Number card is not exist!!!');
    }
    else{
        const card_receiver = await cards_model.detail(req.body.card_number);
        const id_receiver = card_receiver[0].id_customer;
        const receiver = await customers_model.detail(id_receiver);

        var reminiscent_name = req.body.reminiscent_name;

        if(req.body.reminiscent_name === ''){
            reminiscent_name = receiver.full_name;
        }

        const condition = {_id: req.params.id};
        const entity = {
            card_number: req.body.card_number,
            reminiscent_name: reminiscent_name
        }

        const ret = await receivers_model.edit(condition, entity);

        res.status(200).json(ret);
    }
})

route.post('/delete/:id', async (req, res) => {
    const id = req.params.id;

    const ret = await receivers_model.del(id);

    res.status(200).json(ret);
})

route.get('/id/:card_number', async (req, res) => {
    const card_number = req.params.card_number;
    
    const ret = await receivers_model.find_id_by_card_number(card_number);

    res.status(200).json(ret);
})

module.exports = route;