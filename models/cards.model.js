const Cards = require('../schemas/cards.shema');
const { find } = require('../schemas/cards.shema');

module.exports = {
    all: _ => {
        return Cards.find();
    },
    detail: _card_number => {
        return Cards.find({card_number: _card_number});
    },
    add: entity => {
        return Cards.create(entity);
    },
    del: async _card_number => {
        const id = await Cards.findOne({card_number: _card_number}).select('_id');
        return Cards.findByIdAndRemove(id);
    },
    edit: (condition, entity) => {
        return Cards.update(condition, entity);
    },
    find_id_by_card_number: _card_number => {
        return Cards.findOne({card_number: _card_number}).select('_id');
    }
}