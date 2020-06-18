const express = require('express');
const morgan = require('morgan');
require('express-async-errors');
const cors = require('cors');

const verify = require('./middlewares/Interbank.mdw');
const verify_transfer_money = require('./middlewares/money.mdw');
const verify_token = require('./middlewares/auth.mdw');
const connectDB = require('./uitls/connection');

const app = express();

//connect database mongodb
connectDB();

app.use(morgan('dev'));
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('hello');
})

//customers
app.use('/auth', require('./routes/auth.route'));
app.use('/customers', verify_token, require('./routes/customers.route'));

//API Interbank
app.use('/api/users', verify, require('./routes/Interbank.route'));
app.use('/api/transfer-money', verify_transfer_money, require('./routes/money.route'));

//type-cards
app.use('/type-cards', require('./routes/type_cards.route'));
//cards
app.use('/cards', verify_token, require('./routes/cards.route'));
//receivers
app.use('/receivers', verify_token, require('./routes/receivers.route'));

app.use((req, res, next) => {
    res.status(404).send('NOT FOUND');
});

app.use((err, req, res, next) => {
    console.log(err.stack);
    const errStatus = err.status || 500;
    res.status(errStatus).send('View error log in console.');
})

const PORT = 80;
app.listen(PORT, _ => {
    console.log(`API is running at PORT: ${PORT}`);
});