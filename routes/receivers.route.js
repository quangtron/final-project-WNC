const express = require('express');

const receivers_model = require('../models/receivers.model');
const customers_model = require('../models/customers.model');
const cards_model = require('../models/cards.model');

const router = express.Router();

router.get('/', async (req, res) => {
    const id_customer = req.token_payload.id;
    const ret = await receivers_model.all(id_customer);

    return res.status(200).json(ret);
})

// route.get('/:id', async (req, res) => {
//     const id = req.params.id;
    
//     const ret = await receivers_model.detail(id);

//     res.status(200).json(ret);
// })

router.get('/customer', async (req, res) => {
    const id = req.token_payload.id;

    const ret = await receivers_model.find_by_id_customer(id);

    return res.status(200).json(ret);
})

router.post('/customer/add', async (req, res) => {
    if(await cards_model.is_exist(req.body.card_number) === false){
        return res.status(400).json({is_error: true});
    }

    const id_customer = req.token_payload.id;
    const card_receiver = await cards_model.find_detail_by_card_number(req.body.card_number); 
    const receiver = await customers_model.detail(card_receiver.id_customer);

    var reminiscent_name = req.body.reminiscent_name;

    if(req.body.reminiscent_name === ''){
        reminiscent_name = receiver.full_name;
    }

    const new_receiver = {
        id_customer: id_customer,
        card_number: req.body.card_number,
        reminiscent_name: reminiscent_name,
        is_delete: 0
    }

    const ret = await receivers_model.add(new_receiver);

    return res.status(200).json(ret);
})

router.post('/customer/edit/:id', async (req, res) => {
    if(await cards_model.is_exist(req.body.card_number) === false){
        return res.status(400).json({is_error: true});
    }
    else{
        const card_receiver = await cards_model.find_detail_by_card_number(req.body.card_number);
        const id_receiver = card_receiver.id_customer;
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

        return res.status(200).json(ret);
    }
})

router.post('/customer/delete/:id', async (req, res) => {
    const id = req.params.id;

    const ret = await receivers_model.del(id);

    return res.status(200).json(ret);
})

router.get('/id/:card_number', async (req, res) => {
    const card_number = req.params.card_number;
    
    const ret = await receivers_model.find_id_by_card_number(card_number);

    return res.status(200).json(ret);
})

module.exports = router;