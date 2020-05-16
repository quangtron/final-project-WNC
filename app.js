const express = require('express');
const morgan = require('morgan');
require('express-async-errors');

const verify = require('./middlewares/Interbank.mdw');
const verifyTransferMoney = require('./middlewares/money.mdw')
const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.use('/api/users', verify, require('./routes/Interbank.route'));
app.use('/api/transfer-money', verifyTransferMoney, require('./routes/money.route'));

app.use((req, res, next) => {
    res.status(404).send('NOT FOUND');
});

app.use((err, req, res, next) => {
    console.log(err.stack);
    const errStatus = err.status || 500;
    res.status(errStatus).send('View error log in console.');
})

const PORT = 3000;
app.listen(PORT, _ => {
    console.log(`API is running at http://localhost:${PORT}`);
});