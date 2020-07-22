const express = require('express');
const bcrypt = require('bcryptjs');
const low = require('lowdb');
const fileSync = require('lowdb/adapters/FileSync');

const customers_model = require('../models/customers.model');
const cards_model = require('../models/cards.model');
const config = require('../config/default.json');

const adapter = new fileSync('./config/default.json');
const db = low(adapter);

const router = express.Router();

router.get('/detail', async (req, res) => {
    const id = req.token_payload.id;
    
    const ret = await customers_model.detail(id);

    return res.status(200).json(ret);
})

router.post('/change-password', async(req, res) => {
    const id = req.token_payload.id;
    const ret = await customers_model.detail(id);

    if(!bcrypt.compareSync(req.body.current_password, ret.password)){
        return res.status(203).json({is_error: true, msg: "Mật khẩu hiện tại không đúng!"});
    }

    const new_password = req.body.new_password;

    if(new_password !== req.body.confirm_password){
        return res.status(203).json({is_error: true, msg: "Mật khẩu nhập lại không đúng!"});
    }

    const new_password_hash = bcrypt.hashSync(new_password);
    ret.password = new_password_hash;

    await customers_model.edit({_id: id}, ret);

    return res.status(200).json(ret);
})

router.get('/teller', async (req, res) => {
    const ret = await customers_model.all_customer();
        
    return res.status(200).json(ret);
})

router.get('/teller/detail/:id', async (req, res) => {
    const id = req.params.id;
    
    const ret = await customers_model.detail(id);

    return res.status(200).json(ret);
})

router.get('/teller/cards/:id', async (req, res) => {
    const id = req.params.id;
    
    const ret = await cards_model.find_by_id_customer(id);

    return res.status(200).json(ret);
})

router.post('/teller/add', async (req, res) => {
    // const {full_name, address, email, 
    //        phone_number, username, 
    //        password, day_of_birth} = req.body;
    if(await customers_model.is_exist(req.body.username)){
        return res.status(203).json({is_error: true, msg: "Tên đăng nhập đã tồn tại!"});
    }

    const new_customer = {...req.body, permission: 2, is_delete: 0};
    const customer = await customers_model.add(new_customer);

    await db.update('account_default.pre_card_number', n => n + 1).write();
    const card_number_temp = await db.get('account_default.pre_card_number').value();

    const entity_card = {
        id_customer: customer._id,
        id_type_card: 1,
        card_number: card_number_temp,
        balance: config.account_default.balance_default,
        is_delete: 0
    }

    const card = await cards_model.add(entity_card);
    const result = {customer, card}

    return res.status(200).json(result);
})

router.post('/teller/edit/:id', async (req, res) => {
    const condition = {_id: req.params.id};
    const entity = req.body;

    const ret = await customers_model.edit(condition, entity);

    return res.status(200).json(ret);
})

router.post('/teller/delete/:id', async (req, res) => {
    const id = req.params.id;

    await cards_model.del_all_by_id_customer(id); 
    const ret = await customers_model.del(id);
    // const card = await cards_model.find_by_id_customer(id);

    return res.status(200).json(ret);
})

//admin
router.get('/admin', async (req, res) => {
    const ret = await customers_model.all_teller();

    return res.status(200).json(ret);
})

router.get('/admin/detail/:id', async (req, res) => {
    const id = req.params.id;
    
    const ret = await customers_model.detail(id);

    return res.status(200).json(ret);
})

router.post('/admin/add', async (req, res) => {
    const {full_name, address, email, 
           phone_number, username, 
           password, day_of_birth} = req.body;

    const permission = 1;

    const new_teller = {
        full_name,
        address,
        email,
        phone_number,
        username,
        password,
        day_of_birth,
        permission,
        is_delete: 0
    }

    const ret = await customers_model.add(new_teller);

    return res.status(200).json(ret);
})

router.post('/admin/edit/:id', async (req, res) => {
    const condition = {_id: req.params.id};
    const entity = req.body;

    const ret = await customers_model.edit(condition, entity);

    return res.status(200).json(ret);
})

router.post('/admin/delete/:id', async (req, res) => {
    const id = req.params.id;

    const ret = await customers_model.del(id);

    return res.status(200).json(ret);
})

module.exports = router