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
    all_receiving_by_card_number: _card_number => {
        return Transactions.find({card_number: _card_number, id_type_transaction: 1});
    },
    all_sending_by_id_customer: _id_customer => {
        return Transactions.find({id_customer: _id_customer, id_type_transaction: 1});
    },
    all_reminding_debt_by_id_customer: _id_customer => {
        return Transactions.find({id_customer: _id_customer, id_type_transaction: 2});
    }
}