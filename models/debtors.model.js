const Debtors = require('../schemas/debtors.schema');

module.exports = {
    all_my_created_by_id_customer: _id_customer => {
        return Debtors.find({id_customer: _id_customer});
    },
    all_others_sent_by_card_number: _card_number  => {
        return Debtors.find({card_number: _card_number});
    },
    detail: id => {
        return Debtors.findById(id);
    },
    add: entity => {
        return Debtors.create(entity);
    },
    del: id => {
        return Debtors.findByIdAndRemove(id);
    }
}