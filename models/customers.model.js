const bcrypt = require('bcryptjs');
const moment = require('moment');

const Customers = require('../schemas/customers.schema');
const User_refresh_token = require('../schemas/user-refresh-token.shema');

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
        const hash = bcrypt.hashSync(entity.password);
        entity.password = hash;

        return Customers.create(entity);
    },
    edit: (condition, entity) => {
        return Customers.update(condition, entity);
    },
    del: id => {
        return Customers.findByIdAndRemove(id);
    },
    find_id_by_username: _username => {
        return Customers.findOne({username: _username}).select('_id');
    },
    find_by_username: _username => {
        return Customers.findOne({username: _username});
    },
    find_by_id: id => {
        return Customers.findOne({id: id});
    },
    update_refresh_token: async(id, token) => {
        const id_refresh_token = await User_refresh_token.findOne({id_customer: id}).select('_id');

        await User_refresh_token.findByIdAndRemove(id_refresh_token);

        const entity = {
            id_customer: id,
            refresh_token: token,
            rdt: moment().format('YYYY-MM-DD HH:mm:ss')
        }

        return User_refresh_token.create(entity);
    },
    verify_refresh_token: async(id, token) => {
        const results = await User_refresh_token.findOne({id_customer: id, refresh_token: token});

        if(results){
            return true;
        }

        return false;
    },
    all_customer: _ => {
        return Customers.find({permission: 2});
    },
    all_teller: _ => {
        return Customers.find({permission: 1});
    }
}