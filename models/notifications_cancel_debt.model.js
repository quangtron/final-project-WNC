const Notifications_Cancel_Debt = require('../schemas/notifications_cancel_debt.schema');

module.exports = {
    all: _id_customer => {
        return Notifications_Cancel_Debt.find({id_customer: _id_customer});
    },
    detail: id => {
        return Notifications_Cancel_Debt.findById(id);
    },
    add: entity => {
        return Notifications_Cancel_Debt.create(entity);
    }
}