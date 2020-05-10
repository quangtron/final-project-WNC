const express = require('express');
const createError = require('http-errors');

const usersModel = require('../models/Interbank.model');

const router = express.Router();

router.post('/', async(req, res) => {
    const result = await usersModel.add(req.body);
    res.status(201).json(result);
})

router.get('/', async(req, res) => {
    const rows = await usersModel.singleByUsername(req.body.username);

    if(rows.length === 0){
        throw createError(400, 'Invalid username!');
    }

    res.json({
        name: rows[0].name,
        cardNumber: rows[0].cardNumber
    })
})

module.exports = router;