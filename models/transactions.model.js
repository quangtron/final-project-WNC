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
    all_receiving_by_card_number_receiver: _card_number_receiver => {
        return Transactions.find({card_number_receiver: _card_number_receiver, id_type_transaction: 1});
    },
    all_sending_by_card_number_sender: _card_number_sender => {
        return Transactions.find({card_number_sender: _card_number_sender, id_type_transaction: 1});
    },
    all_reminding_debt_by_card_number_sender: _card_number_sender => {
        return Transactions.find({card_number_sender: _card_number_sender, id_type_transaction: 2});
    }
}