const express = require('express');
const low = require('lowdb');
const fileSync = require('lowdb/adapters/FileSync');

// const customers_model = require('../models/customers.model');
const cards_model = require('../models/cards.model');
const debtors_model = require('../models/debtors.model');
const config = require('../config/default.json');

const adapter = new fileSync('./config/default.json');
const db = low(adapter);

const router = express.Router();

router.get('/my-created', async (req, res) => {
    const id_customer = req.token_payload.id;

    const ret = await debtors_model.all_my_created_by_id_customer(id_customer);

    res.status(200).json(ret);
})

router.get('/others-sent', async (req, res) => {
    const id_customer =  req.token_payload.id;
    const card = await cards_model.find_payment_card_by_id_customer(id_customer);
    const card_number = card.card_number;
    
    const ret = await debtors_model.all_others_sent_by_card_number(card_number);

    res.status(200).json(ret);
})

router.post('/add', async (req, res) => {
    if(await cards_model.is_exist(req.body.card_number) === false){
        res.status(404).json({errString: 'Number card is not exist!!!'});
    }
    else{
        const entity_new_debtor = {
            id_customer: req.token_payload.id,
            is_paid: 1,
            card_number: req.body.card_number,
            money: req.body.money,
            message: req.body.message
        }

        const ret = await debtors_model.add(entity_new_debtor);

        res.status(200).json(ret);
    }
})

 module.exports = router;