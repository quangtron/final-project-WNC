const Debtors = require('../schemas/debtors.schema');

module.exports = {
    all_my_created_by_id_customer: _id_customer => {
        return Debtors.find({id_customer: _id_customer});
    },
    all_others_sent_by_card_number: _card_number  => {
        return Debtors.find({card_number: _card_number});
    },
    all_my_created_unpaid_by_id_customer: _id_customer => {
        return Debtors.find({id_customer: _id_customer, is_paid: 1});
    },
    all_others_sent_unpaid_by_card_number: _card_number  => {
        return Debtors.find({card_number: _card_number, is_paid: 1});
    },
    detail: id => {
        return Debtors.findById(id);
    },
    add: entity => {
        return Debtors.create(entity);
    },
    del: id => {
        return Debtors.findByIdAndRemove(id);
    },
    edit: (condition, entity) => {
        return Debtors.update(condition, entity);
    }
}