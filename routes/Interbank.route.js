const express = require('express');
const create_error = require('http-errors');

const cards_model = require('../models/cards.model');
const customers_model = require('../models/customers.model');

const router = express.Router();

router.get('/', async(req, res) => {
    if(await cards_model.is_exist(req.body.card_number) === false){
        throw create_error(404, 'Number card is not exist!')
    }

    const card_receiver = await cards_model.find_detail_by_card_number(req.body.card_number); 
    const receiver = await customers_model.detail(card_receiver.id_customer);

    res.json({
        card_number: req.body.card_number,
        name: receiver.full_name,
    })
})

module.exports = router;