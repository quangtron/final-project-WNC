const express = require('express');
const notifications_cancel_debt_model = require('../models/notifications_cancel_debt.model');

const router = express.Router();

router.get('/', async(req, res) => {
    const id_customer = req.token_payload.id;
    const ret = await notifications_cancel_debt_model.all(id_customer);

    res.status(200).json(ret);
})

router.get('/non-notifications', async(req, res) => {
    const id_customer = req.token_payload.id;
    const ret = await notifications_cancel_debt_model.all_non_notifications(id_customer);

    res.status(200).json(ret);
})

router.get('/notified', async(req, res) => {
    const id_customer = req.token_payload.id;
    const ret = await notifications_cancel_debt_model.all_notified(id_customer);

    res.status(200).json(ret);
})

module.exports = router;