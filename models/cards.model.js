const Cards = require("../schemas/cards.shema");

module.exports = {
  all: (_) => {
    return Cards.find({ is_delete: 0 });
  },
  detail: (id) => {
    return Cards.findById(id);
  },
  add: (entity) => {
    return Cards.create(entity);
  },
  del: (id) => {
    // return Cards.findByIdAndRemove(id);
    return Cards.update({ _id: id }, { is_delete: 1 });
  },
  edit: (condition, entity) => {
    return Cards.update(condition, entity);
  },
  find_id_by_card_number: (_card_number) => {
    return Cards.findOne({ card_number: _card_number, is_delete: 0 }).select(
      "_id"
    );
  },
  find_detail_by_card_number: (_card_number) => {
    return Cards.findOne({ card_number: _card_number, is_delete: 0 });
  },
  find_by_id_customer: (_id_customer) => {
    return Cards.find({ id_customer: _id_customer, is_delete: 0 });
  },
  find_payment_card_by_id_customer: (_id_customer) => {
    return Cards.findOne({
      id_customer: _id_customer,
      id_type_card: 1,
      is_delete: 0,
    });
  },
  del_all_by_id_customer: async (_id_customer) => {
    // return Cards.deleteMany({id_customer: _id_customer});
    return Cards.updateMany({ id_customer: _id_customer }, { is_delete: 1 });
  },
  is_exist: async (_card_number) => {
    var res = false;
    const cards = await Cards.find({ card_number: _card_number, is_delete: 0 });

    if ((await cards.length) !== 0) res = true;

    console.log(res);

    return res;
  },
};
