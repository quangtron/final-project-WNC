const Type_Cards = require('../schemas/type-cards.chema');
const { ConnectionBase } = require('mongoose');

module.exports = {
    all: _ => {
        return Type_Cards.find();
    },
    detail: id => {
        return Type_Cards.findById(id);
    },
    add: entity => {
        // entity = {
        //     "name_type": "Tai khoan thanh toan" || "Tai khoan tiet kiem"
        // }

        return Type_Cards.create(entity);
    },
    edit: (condition, entity) => {
        return Type_Cards.update(condition, entity);
    },
    del: id => {
        return Type_Cards.findByIdAndRemove(id);
    },
    find_id_by_name_type: name => {
        return Type_Cards.findOne({name_type: name}).select('_id');
    }
}