const Cards = require('../schemas/cards.shema');

module.exports = {
    all: _ => {
        return Cards.find();
    },
    detail: id => {
        return Cards.findById(id);
    },
    add: entity => {
        return Cards.create(entity);
    },
    del: id => {
        return Cards.findByIdAndRemove(id);
    },
    edit: (condition, entity) => {
        return Cards.update(condition, entity);
    },
    find_id_by_card_number: _card_number => {
        return Cards.findOne({card_number: _card_number}).select('_id');
    },
    find_by_id_customer: _id_customer => {
        return Cards.find({id_customer: _id_customer});
    },
    is_exist: async _card_number => {
        var res = false;
        const cards = await Cards.find({card_number: _card_number});

        if(await cards.length !== 0)
            res = true;


        console.log(res);

        return res;
    }
}