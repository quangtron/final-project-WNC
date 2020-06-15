const express = require('express');
const mongoose =  require('mongoose');
const customers_model = require('../models/customers.model');
const route = express.Router();

route.get('/', async (req, res) => {
    const ret = await customers_model.all();
        
    res.status(200).json(ret);
})

route.get('/:id', async (req, res) => {
    const id = req.params.id;
    
    const ret = await customers_model.detail(id);

    res.status(200).json(ret);
})

route.post('/add', async (req, res) => {
    // const {full_name, address, email, 
    //        phone_number, username, 
    //        password, day_of_birth, permission} = req.body;

    // const new_customer = {}
    // new_customer.full_name = full_name;
    // new_customer.address = address;
    // new_customer.email = email;
    // new_customer.phone_number = phone_number;
    // new_customer.username = username;
    // new_customer.password = password;
    // new_customer.day_of_birth = day_of_birth;
    // new_customer.permission = permission;

    const new_customer = req.body;
    
    const ret = await customers_model.add(new_customer);

    res.status(200).json(ret);
})

route.post('/edit/:id', async (req, res) => {
    const condition = {_id: req.params.id};
    const entity = req.body;

    const ret = await customers_model.edit(condition, entity);

    res.status(200).json(ret);
})

route.post('/delete/:id', async (req, res) => {
    const id = req.params.id;

    const ret = await customers_model.del(id);

    res.status(200).json(ret);
})

route.get('/id/:username', async (req, res) => {
    const username = req.params.username;
    
    const ret = await customers_model.find_id_by_username(username);

    res.status(200).json(ret);
})

module.exports = route