const Notifications_Cancel_Debt = require('../schemas/notifications_cancel_debt.schema');

module.exports = {
    all: _id_customer => {
        return Notifications_Cancel_Debt.find({id_customer: _id_customer});
    },
    all_non_notifications: _id_customer => {
        return Notifications_Cancel_Debt.find({id_customer: _id_customer, is_notified: 1});
    },
    all_notified: _id_customer => {
        return Notifications_Cancel_Debt.find({id_customer: _id_customer, is_notified: 2});
    },
    detail: id => {
        return Notifications_Cancel_Debt.findById(id);
    },
    add: entity => {
        return Notifications_Cancel_Debt.create(entity);
    }
}