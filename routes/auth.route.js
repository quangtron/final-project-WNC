const express = require('express');
const jwt = require('jsonwebtoken');
const randToken = require('rand-token');
const createError = require('http-errors');

const authModel = require('../models/auth.model');
const userModel = require('../models/users.model');
const config = require('../config/default.json');

const router = express.Router();

router.post('/', async (req, res) => {
    const ret = await authModel.login(req.body);

    if(ret === null){
        return res.json({
            authenticated: false
        })
    }

    const userId = ret.ID;
    const access_token = generateAccessToken(userId);
    const refresh_token = randToken.generate(config.auth.refreshTokenSz);

    await userModel.updateRefreshToken(userId, refresh_token);

    return res.json({
        access_token,
        refresh_token
    })
})

router.post('/refresh', async (req, res) => {
    jwt.verify(req.body.accessToken, config.auth.secret, { ignoreExpiration: true }, async function(err, payload) {
        if(err){
            throw createError(400, 'Something wrong!');
        }

        const { userId } = payload;
        const ret = await userModel.verifyRefreshToken(userId, req.body.refreshToken);

        if(ret === false){
            throw createError(400, 'Invalid refresh token!');
        }

        const accessToken = generateAccessToken(userId);
        res.json({ accessToken });
    })
})

const generateAccessToken = userId => {
    const payload = { userId }
    const accessToken = jwt.sign(payload, config.auth.secret, {
        expiresIn: config.auth.expiresIn
    });

    return accessToken;
}

module.exports = router;