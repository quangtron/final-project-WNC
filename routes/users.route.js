const express = require('express');
const usersModel = require('../models/users.model');

const router = express.Router();

router.post('/signup', async(req, res) => {
    const result = await usersModel.addUser(req.body);
    const ret = {
        id: result.insertId,
        ...req.body
    }
    
    delete ret.password;
    res.status(201).json(ret);
})

router.get('/all', async (req, res) => {
    const result = await usersModel.all();
    res.json(result);
})

module.exports = router;