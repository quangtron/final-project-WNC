const express = require('express');
const mongoose =  require('mongoose');
const customers_model = require('../models/customers.model');
const router = express.Router();

router.get('/', async (req, res) => {
    const ret = await customers_model.all();
        
    res.status(200).json(ret);
})

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    
    const ret = await customers_model.detail(id);

    res.status(200).json(ret);
})

router.post('/add', async (req, res) => {
    // const {full_name, address, email, 
    //        phone_number, username, 
    //        password, day_of_birth, permission} = req.body;

    const new_customer = req.body;
    
    const ret = await customers_model.add(new_customer);

    res.status(200).json(ret);
})

router.post('/edit/:id', async (req, res) => {
    const condition = {_id: req.params.id};
    const entity = req.body;

    const ret = await customers_model.edit(condition, entity);

    res.status(200).json(ret);
})

router.post('/delete/:id', async (req, res) => {
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