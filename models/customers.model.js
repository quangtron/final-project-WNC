const Customers = require('../schemas/customers.schema');

module.exports = {
    all: _ => {
        return Customers.find()
    },
    detail: id => {
        return Customers.findById(id);
    },
    add: entity => {
        // entity = {
        //     "full_name" : "Tran Nguyen Ngoc Truong",
        //     "address" : "328A LHP",
        //     "email" : "1612759@student.hcmus.edu.vn",
        //     "phone_number" : "0989120419",
        //     "username" : "truong",
        //     "password" : "123456",
        //     "day_of_birth" : "Nov 11 1998",
        //     "permission" : 1
        // }

        return Customers.create(entity);
    },
    edit: (condition, entity) => {
        return Customers.update(condition, entity);
    },
    del: id => {
        return Customers.findByIdAndRemove(id);
    }
}