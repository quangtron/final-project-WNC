const Otp_email = require('../schemas/otp_email.schema');

module.exports = {
    find_by_email: _email => {
        return Otp_email.findOne({email: _email})
    },
    edit: (condition, entity) => {
        return Otp_email.update(condition, entity);
    },
    find_by_token: _token => {
        return Otp_email.findOne({reset_password_token: _token});
    },
    update_otp_token: async (_token, _email) => {
        const id_otp_email = await Otp_email.findOne({email: _email}).select('_id');

        await Otp_email.findByIdAndRemove(id_otp_email);

        const entity = {
            reset_password_token: token,
            reset_password_exprires: Date.now() + 30000
        }

        return await Otp_email.create(entity);
    }
}