const Transactions = require('../schemas/transactions.chema');

module.exports = {
    all: _ => {
        return Transactions.find();
    },
    detail: id => {
        return Transactions.findById(id);
    },
    add: entity => {
        return Transactions.create(entity);
    },
}