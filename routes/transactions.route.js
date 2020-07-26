const express = require("express");
const moment = require("moment");
const mail = require("../middlewares/verify_email.mdw");
const otp_email_model = require("../models/otp_email.model");

const cards_model = require("../models/cards.model");
const customers_model = require("../models/customers.model");
const transactions_model = require("../models/transactions.model");
const interbanks_model = require("../models/interbanks.model");
const config = require("../config/default.json");

const router = express.Router();

//customer
router.post("/customer/sending/add", async (req, res) => {
  const { card_number, money, type_paid, message, partner_code } = req.body;
  const id_customer = req.token_payload.id;
  const card_detail_sender = await cards_model.find_payment_card_by_id_customer(
    id_customer
  );
  const sender = await customers_model.detail(id_customer);

  if (partner_code === 1) {
    if ((await cards_model.is_exist(card_number)) === false) {
      return res.status(203).json({ is_error: true, msg: "Số tài khoản không tồn tại!" });
    }

    let total_amount = money + config.account_default.card_maintenance_fee;

    if (type_paid === 1) {
      total_amount += config.account_default.transaction_fee;
    }

    if (card_detail_sender.balance < total_amount) {
      console.log("Balance is not enough!");
      return res.status(203).json({ is_error: true,  msg: "Số dư trong tài khoản không đủ!" });
    }

    card_detail_sender.balance -=
      total_amount - config.account_default.card_maintenance_fee;

    const card_detail_receiver = await cards_model.find_detail_by_card_number(
      card_number
    );
    card_detail_receiver.balance += money;

    if (type_paid === 2) {
      card_detail_receiver.balance -= config.account_default.transaction_fee;
    }

    await cards_model.edit({ _id: card_detail_sender._id }, card_detail_sender);
    await cards_model.edit(
      { _id: card_detail_receiver._id },
      card_detail_receiver
    );

    await transactions_model.add({
      ...req.body,
      card_number_sender: card_detail_sender.card_number,
      card_number_receiver: card_detail_receiver.card_number,
      id_type_transaction: 1,
      id_partner_bank: partner_code,
      message,
      date_created: moment().format("YYYY-MM-DD HH:mm:ss"),
    });

    res.status(200).json(req.body);
  } else {
    // partner_code === 2 || 3
    let total_amount = money + config.account_default.card_maintenance_fee;

    if (type_paid === 1) {
      total_amount += config.account_default.transaction_fee;
    }

    if (card_detail_sender.balance < total_amount) {
      console.log("Balance is not enough!");
      return res.status(203).json({ is_error: true,  msg: "Số dư trong tài khoản không đủ!" });
    }

    const headerTs = moment().unix();

    const transfer = await interbanks_model.transfer(
      headerTs,
      card_number,
      partner_code,
      money,
      message,
      id_customer
    );

    if (transfer === true) {
      // thanh cong
      card_detail_sender.balance -=
        total_amount - config.account_default.card_maintenance_fee;

      await cards_model.edit(
        { _id: card_detail_sender._id },
        card_detail_sender
      );

      await transactions_model.add({
        ...req.body,
        card_number_sender: card_detail_sender.card_number,
        card_number_receiver: card_number,
        id_type_transaction: 1,
        id_partner_bank: partner_code,
        message,
        date_created: moment().format("YYYY-MM-DD HH:mm:ss"),
      });

      res.status(200).json(req.body);
    } else {
      return res.status(203).json({ is_error: true,  msg: "Hệ thống gặp lỗi khi thực hiện giao dịch!" });
    }
  }
});

router.get("/customer/receiving", async (req, res) => {
  const id_customer = req.token_payload.id;
  const card = await cards_model.find_payment_card_by_id_customer(id_customer);
  const card_number = card.card_number;

  const transactions = await transactions_model.all_receiving_by_card_number_receiver(
    card_number
  );
  const ret = [];

  const promises = transactions.map(async (item) => {
    let bank_name;

    if (item.id_partner_bank === 1) {
      bank_name = "Noi Bo";
    } else {
      const partner_bank = config.interbank.partner_bank.filter(
        (bank) =>
          bank.partner_code.toString() === item.id_partner_bank.toString()
      );

      bank_name = partner_bank[0].name;
    }

    const entity_ret_item = {
      _id: item._id,
      card_number: item.card_number_sender,
      bank_name,
      money: item.money,
      message: item.message,
      date_created: item.date_created,
    };

    ret.push(entity_ret_item);
  });

  await Promise.all(promises);

  return res.status(200).json(ret);
});

router.get("/customer/sending", async (req, res) => {
  const id_customer = req.token_payload.id;
  const card = await cards_model.find_payment_card_by_id_customer(id_customer);
  const card_number = card.card_number;

  const transactions = await transactions_model.all_sending_by_card_number_sender(
    card_number
  );
  const ret = [];

  const promises = transactions.map(async (item) => {
    let bank_name;

    if (item.id_partner_bank === 1) {
      bank_name = "Noi Bo";
    } else {
      const partner_bank = config.interbank.partner_bank.filter(
        (bank) =>
          bank.partner_code.toString() === item.id_partner_bank.toString()
      );

      bank_name = partner_bank[0].name;
    }

    const entity_ret_item = {
      _id: item._id,
      card_number: item.card_number_receiver,
      bank_name,
      money: item.money,
      message: item.message,
      date_created: item.date_created,
    };

    ret.push(entity_ret_item);
  });

  await Promise.all(promises);

  return res.status(200).json(ret);
});

router.get("/customer/reminding-debt", async (req, res) => {
  const id_customer = req.token_payload.id;
  const card = await cards_model.find_payment_card_by_id_customer(id_customer);
  const card_number = card.card_number;

  const transactions = await transactions_model.all_reminding_debt_by_card_number_sender(
    card_number
  );
  const ret = [];

  const promises = transactions.map(async (item) => {
    const entity_ret_item = {
      _id: item._id,
      card_number: item.card_number_receiver,
      bank_name: "Noi Bo",
      money: item.money,
      message: item.message,
      date_created: item.date_created,
    };

    ret.push(entity_ret_item);
  });

  await Promise.all(promises);

  return res.status(200).json(ret);
});

//Teller
router.post("/teller/sending/add", async (req, res) => {
  const { card_number, money } = req.body;
  // const id_customer = req.token_payload.id;

  if ((await cards_model.is_exist(card_number)) === false) {
    return res.status(203).json({ is_error: true,  msg: "Số tài khoản không tồn tại!" });
  }

  const card_receiver = await cards_model.find_detail_by_card_number(
    card_number
  );
  card_receiver.balance += money;

  await cards_model.edit({ _id: card_receiver._id }, card_receiver);

  await transactions_model.add({
    card_number_sender: config.account_default.card_system,
    id_type_transaction: 1,
    id_partner_bank: 1,
    card_number_receiver: card_number,
    message: 'Khách hàng nạp tiền',
    money,
    type_paid: 1,
    date_created: moment().format("YYYY-MM-DD HH:mm:ss"),
  });

  return res.status(200).json({message: 'Success'});
});

router.post("/teller/receiving", async (req, res) => {
  const { card_number } = req.body;

  const transactions = await transactions_model.all_receiving_by_card_number_receiver(
    card_number
  );
  const ret = [];

  const promises = transactions.map(async (item) => {
    let bank_name;

    if (item.id_partner_bank === 1) {
      bank_name = "Noi Bo";
    } else {
      const partner_bank = config.interbank.partner_bank.filter(
        (bank) =>
          bank.partner_code.toString() === item.id_partner_bank.toString()
      );

      bank_name = partner_bank[0].name;
    }

    const entity_ret_item = {
      _id: item._id,
      card_number: item.card_number_sender,
      bank_name,
      money: item.money,
      message: item.message,
      date_created: item.date_created,
    };

    ret.push(entity_ret_item);
  });

  await Promise.all(promises);

  return res.status(200).json(ret);
});

router.post("/teller/sending", async (req, res) => {
  const { card_number } = req.body;
  // const card_customer = await cards_model.find_detail_by_card_number(card_number);

  const transactions = await transactions_model.all_sending_by_card_number_sender(
    card_number
  );
  const ret = [];

  const promises = transactions.map(async (item) => {
    let bank_name;

    if (item.id_partner_bank === 1) {
      bank_name = "Noi Bo";
    } else {
      const partner_bank = config.interbank.partner_bank.filter(
        (bank) =>
          bank.partner_code.toString() === item.id_partner_bank.toString()
      );

      bank_name = partner_bank[0].name;
    }

    const entity_ret_item = {
      _id: item._id,
      card_number: item.card_number_receiver,
      bank_name,
      money: item.money,
      message: item.message,
      date_created: item.date_created,
    };

    ret.push(entity_ret_item);
  });

  await Promise.all(promises);

  return res.status(200).json(ret);
});

router.post("/teller/reminding-debt", async (req, res) => {
  const { card_number } = req.body;
  // const card_customer = await cards_model.find_detail_by_card_number(card_number);

  const transactions = await transactions_model.all_reminding_debt_by_card_number_sender(
    card_number
  );
  const ret = [];

  const promises = transactions.map(async (item) => {
    const entity_ret_item = {
      _id: item._id,
      card_number: item.card_number_receiver,
      bank_name: "Noi Bo",
      money: item.money,
      message: item.message,
      date_created: item.date_created,
    };

    ret.push(entity_ret_item);
  });

  await Promise.all(promises);

  return res.status(200).json(ret);
});

//Admin
router.get("/admin", async (req, res) => {
  const transactions = await transactions_model.all_transactions_interbank();
  const ret = [];

  const promises = transactions.map(async (transaction) => {
    const partner_bank = config.interbank.partner_bank.filter(
      (bank) =>
        bank.partner_code.toString() === transaction.id_partner_bank.toString()
    );
    const bank_name = partner_bank[0].name;

    if (
      (await cards_model.is_exist(transaction.card_number_sender)) === false
    ) {
      const entity_ret_item = {
        _id: transaction._id,
        bank_name: bank_name,
        card_number_sender: transaction.card_number_sender,
        card_number_receiver: transaction.card_number_receiver,
        type_transaction: "Nhan Tien",
        money: transaction.money,
        message: transaction.message,
        date_created: transaction.date_created,
      };

      ret.push(entity_ret_item);
    } else {
      const entity_ret_item = {
        _id: transaction._id,
        bank_name: bank_name,
        card_number_sender: transaction.card_number_sender,
        card_number_receiver: transaction.card_number_receiver,
        type_transaction: "Chuyen Tien",
        money: transaction.money,
        message: transaction.message,
        date_created: transaction.date_created,
      };

      ret.push(entity_ret_item);
    }
  });

  await Promise.all(promises);

  res.status(200).json(ret);
});

router.post("/admin/partner-bank", async (req, res) => {
  const { partner_code } = req.body;
  const transactions = await transactions_model.all_transactions_interbank_by_partner_code(
    partner_code
  );

  const ret = [];

  const promises = transactions.map(async (transaction) => {
    const partner_bank = config.interbank.partner_bank.filter(
      (bank) =>
        bank.partner_code.toString() === transaction.id_partner_bank.toString()
    );
    const bank_name = partner_bank[0].name;

    if (
      (await cards_model.is_exist(transaction.card_number_sender)) === false
    ) {
      const entity_ret_item = {
        _id: transaction._id,
        bank_name: bank_name,
        card_number_sender: transaction.card_number_sender,
        card_number_receiver: transaction.card_number_receiver,
        type_transaction: "Nhan Tien",
        money: transaction.money,
        message: transaction.message,
        date_created: transaction.date_created,
      };

      ret.push(entity_ret_item);
    } else {
      const entity_ret_item = {
        _id: transaction._id,
        bank_name: bank_name,
        card_number_sender: transaction.card_number_sender,
        card_number_receiver: transaction.card_number_receiver,
        type_transaction: "Chuyen Tien",
        money: transaction.money,
        message: transaction.message,
        date_created: transaction.date_created,
      };

      ret.push(entity_ret_item);
    }
  });

  await Promise.all(promises);

  res.status(200).json(ret);
});

router.get("/detail/:id", async (req, res) => {
  const transaction = await transactions_model.detail(req.params.id);
  let ret;
  let sender, receiver, bank_name, full_name_sender, full_name_receiver;

  if (transaction.id_type_transaction === 1) {
    // CHUYEN KHOAN
    if (transaction.id_partner_bank === 1) {
      // NOI BO
      if(transaction.card_number_sender === config.account_default.card_system){
        full_name_sender = 'Hệ Thống';
      }
      else{
        const card_sender = await cards_model.find_detail_by_card_number(
          transaction.card_number_sender
        );
        const sender = await customers_model.detail(card_sender.id_customer);
        full_name_sender = sender.full_name;
      }

      const card_receiver = await cards_model.find_detail_by_card_number(
        transaction.card_number_receiver
      );
      const receiver = await customers_model.detail(card_receiver.id_customer);

      bank_name = "Noi Bo";
      full_name_receiver = receiver.full_name;

      ret = {
        _id: req.params.id,
        bank_name,
        full_name_sender,
        card_number_sender: transaction.card_number_sender,
        full_name_receiver,
        card_number_receiver: transaction.card_number_receiver,
        type_transaction: "Chuyen Khoan",
        money: transaction.money,
        message: transaction.message,
        date_created: transaction.date_created,
      };
    } else {
      //LIEN NGAN HANG
      if (
        (await cards_model.is_exist(transaction.card_number_sender)) === false
      ) {
        sender = await interbanks_model.get_info_customer(
          transaction.card_number_sender,
          transaction.id_partner_bank
        );
        if (sender === false) {
          console.log("Khong truy van duoc thong tin tu api cua doi tac!");
          return res.status(203).json({ is_error: true,  msg: "Hệ thống gặp lỗi khi thực hiện truy vấn api từ đối tác!" });
        }

        const card_receiver = await cards_model.find_detail_by_card_number(
          transaction.card_number_receiver
        );
        receiver = await customers_model.detail(card_receiver.id_customer);
        // console.log('sender', sender);
        bank_name = sender.bank_name;
        full_name_sender = sender.info.clientName;
        full_name_receiver = receiver.full_name;
      } else {
        receiver = await interbanks_model.get_info_customer(
          transaction.card_number_receiver,
          transaction.id_partner_bank
        );

        if (receiver === false) {
          console.log("Khong truy van duoc thong tin tu api cua doi tac!");
          return res.status(203).json({ is_error: true,  msg: "Hệ thống gặp lỗi khi thực hiện truy vấn từ api đối tác!" });
        }

        const card_sender = await cards_model.find_detail_by_card_number(
          transaction.card_number_sender
        );
        sender = await customers_model.detail(card_sender.id_customer);
        // console.log(receiver);
        bank_name = receiver.bank_name;
        full_name_sender = sender.full_name;
        full_name_receiver = receiver.info.clientName;
      }

      ret = {
        _id: req.params.id,
        bank_name,
        full_name_sender,
        card_number_sender: transaction.card_number_sender,
        full_name_receiver,
        card_number_receiver: transaction.card_number_receiver,
        type_transaction: "Chuyen Khoan",
        money: transaction.money,
        message: transaction.message,
        date_created: transaction.date_created,
      };
    }
  } else {
    // NHAC NO
    const card_sender = await cards_model.find_detail_by_card_number(
      transaction.card_number_sender
    );
    const sender = await customers_model.detail(card_sender.id_customer);

    const card_receiver = await cards_model.find_detail_by_card_number(
      transaction.card_number_receiver
    );
    const receiver = await customers_model.detail(card_receiver.id_customer);

    bank_name = "Noi Bo";
    full_name_sender = sender.full_name;
    full_name_receiver = receiver.full_name;

    ret = {
      _id: req.params.id,
      bank_name,
      full_name_sender,
      card_number_sender: transaction.card_number_sender,
      full_name_receiver,
      card_number_receiver: transaction.card_number_receiver,
      type_transaction: "Thanh Toan Nhac No",
      money: transaction.money,
      message: transaction.message,
      date_created: transaction.date_created,
    };
  }

  res.status(200).json(ret);
});

router.post("/verify-email", async (req, res) => {
  const token = Math.floor(Math.random() * 99999 + 10000);

  await otp_email_model.update_otp_token(token, req.body.email);

  let mailOptions = {
    from: "webnangcao17@gmail.com",
    to: req.body.email,
    subject: "Xác nhận giao dịch",
    html: `Chào ${req.body.full_name},<br>
          Bạn đã chọn email ${req.body.email} để xác minh giao dịch của bạn.<br>
          Đây là mã xác nhận:
          <h2>${token}</h2>
          Mã xác nhận này sẽ hết hạn sau 5 phút từ lúc email này được gửi.<br>
          <b>Tại sao bạn nhận được email này?.</b><br>
          Internet banking yêu cầu xác minh địa chỉ email cho giao dịch của bạn.<br>
          Nếu bạn không thực hiện yêu cầu này, bạn có thể bỏ qua email này.<br>
          Cảm ơn!`,
  };

  const ret = await mail.send_email(mailOptions);

  if (ret) {
    return res.status(200).json(ret);
  } else {
    return res.status(203).json({ is_error: true,  msg: "Hệ thống gặp lỗi khi gửi email xác nhận!" });
  }
});

router.post("/verify-otp", async (req, res) => {
  const otp_detail = await otp_email_model.find_by_token(req.body.token);

  if (!otp_detail) {
    return res.status(203).json({ is_error: true, msg: "OTP không đúng!" });
  }

  if (Date.now() > otp_detail.otp_email_exprires) {
    return res.status(203).json({ is_error: true, msg: "OTP hết hạn!" });
  }

  return res.status(200).json({ msg: "Thành công!" });
});

module.exports = router;
