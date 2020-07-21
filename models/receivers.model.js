const Receivers = require('../schemas/receivers.schema');

module.exports = {
    all: _id_customer => { // Lay tat cac danh sach nguoi nhan cua username dang dang nhap
        return Receivers.find({id_customer: _id_customer, is_delete: 0});
    },
    detail: id => {
        return Receivers.findById(id);
    },
    add: entity => {
        return Receivers.create(entity);
    },
    del: id => {
        // return Receivers.findByIdAndRemove(id);
        return Receivers.update({_id: id}, {is_delete: 1})
    },
    edit: (condition, entity) => {
        return Receivers.update(condition, entity);
    },
    find_id_by_card_number: _card_number => {
        return Receivers.findOne({card_number: _card_number, is_delete: 0}).select('_id');
    },
    find_by_id_customer: _id_customer => {
        return Receivers.find({id_customer: _id_customer, is_delete: 0});
    },
}