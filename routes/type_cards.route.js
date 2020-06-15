const express = require('express');
const mongoose = require('mongoose');
const type_cards_model = require('../models/type_cards.model');
const route = express.Router();

route.get('/', async (req, res) => {
    const ret = await type_cards_model.all();
        
    res.status(200).json(ret);
})

route.get('/:id', async (req, res) => {
    const id = req.params.id;
    
    const ret = await type_cards_model.detail(id);

    res.status(200).json(ret);
})

route.post('/add', async (req, res) => {
    const new_customer = req.body;
    
    const ret = await type_cards_model.add(new_customer);

    res.status(200).json(ret);
})

route.post('/edit/:id', async (req, res) => {
    const condition = {_id: req.params.id};
    const entity = req.body;

    const ret = await type_cards_model.edit(condition, entity);

    res.status(200).json(ret);
})

route.post('/delete/:id', async (req, res) => {
    const id = req.params.id;

    const ret = await type_cards_model.del(id);

    res.status(200).json(ret);
})

route.get('/id/:name', async (req, res) => {
    const name = req.params.name;
    
    const ret = await type_cards_model.find_id_by_name_type(name);

    res.status(200).json(ret);
})

module.exports = route