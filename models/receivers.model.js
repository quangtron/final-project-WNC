const Receivers = require('../schemas/receivers.schema');

module.exports = {
    all: _id_customer => { // Lay tat cac danh sach nguoi nhan cua username dang dang nhap
        return Receivers.find({id_customer: _id_customer});
    },
    detail: id => {
        return Receivers.findById(id);
    },
    add: entity => {
        return Receivers.create(entity);
    },
    del: id => {
        return Receivers.findByIdAndRemove(id);
    },
    edit: (condition, entity) => {
        return Receivers.update(condition, entity);
    },
    find_id_by_card_number: _card_number => {
        return Receivers.findOne({card_number: _card_number}).select('_id');
    },
    find_by_id_customer: _id_customer => {
        return Receivers.find({id_customer: _id_customer});
    },
}