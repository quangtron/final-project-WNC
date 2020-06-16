const express = require('express');
const morgan = require('morgan');
require('express-async-errors');
const cors = require('cors');

const verify = require('./middlewares/Interbank.mdw');
const verifyTransferMoney = require('./middlewares/money.mdw');
const verifyToken = require('./middlewares/auth.mdw');
const connectDB = require('./uitls/connection');

const app = express();

//connect database mongodb
connectDB();

app.use(morgan('dev'));
app.use(express.json());
app.use(cors());

//users
app.use('/auth', require('./routes/auth.route'));
app.use('/user', verifyToken, require('./routes/users.route'));

//API Interbank
app.use('/api/users', verify, require('./routes/Interbank.route'));
app.use('/api/transfer-money', verifyTransferMoney, require('./routes/money.route'));

//customers
app.use('/customers', require('./routes/customers.route'));
//type-cards
app.use('/type-cards', require('./routes/type_cards.route'));
//cards
app.use('/cards', require('./routes/cards.route'));
//receivers
app.use('/receivers', require('./routes/receivers.route'));

app.use((req, res, next) => {
    res.status(404).send('NOT FOUND');
});

app.use((err, req, res, next) => {
    console.log(err.stack);
    const errStatus = err.status || 500;
    res.status(errStatus).send('View error log in console.');
})

const PORT = 3333;
app.listen(PORT, '0.0.0.0', _ => {
    console.log(`API is running at PORT: ${PORT}`);
});