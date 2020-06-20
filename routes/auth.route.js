const express = require('express');
const jwt = require('jsonwebtoken');
const rand_token = require('rand-token');
const create_error = require('http-errors');

const auth_model = require('../models/auth.model');
const customer_model = require('../models/customers.model');
const config = require('../config/default.json');

const router = express.Router();

router.post('/', async (req, res) => {
    const ret = await auth_model.login(req.body);

    if(ret === null){
        return res.json({
            authenticated: false
        })
    }

    const id = ret.id;
    const access_token = generate_access_token(id);
    const refresh_token = rand_token.generate(config.auth.refresh_token_sz);

    await customer_model.update_refresh_token(id, refresh_token);

    return res.json({
        access_token,
        refresh_token
    })
})

router.post('/refresh', async (req, res) => {
    jwt.verify(req.headers['x_access_token'], config.auth.secret, { ignoreExpiration: true }, async function(err, payload) {
        if(err){
            throw create_error(400, 'Something wrong!');
        }

        const { id } = payload;
        const ret = await customer_model.verify_refresh_token(id, req.headers['x_refresh_token']);

        if(ret === false){
            throw create_error(400, 'Invalid refresh token!');
        }

        const refresh_token = rand_token.generate(config.auth.refresh_token_sz);

        await customer_model.update_refresh_token(id, refresh_token);

        const access_token = generate_access_token(id);
        
        res.json({ access_token, refresh_token });
    })
})

const generate_access_token = id => {
    const payload = { id }
    const access_token = jwt.sign(payload, config.auth.secret, {
        expiresIn: config.auth.expires_in
    });

    return access_token;
}

module.exports = router;