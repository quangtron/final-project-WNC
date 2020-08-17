const express = require("express");
const low = require("lowdb");
const fileSync = require("lowdb/adapters/FileSync");
const axios = require("axios");
const moment = require("moment");
const cryptoJS = require("crypto-js");
const config = require("../config/default.json");

const cards_model = require("../models/cards.model");
const customers_model = require("../models/customers.model");
const interbanks_model = require("../models/interbanks.model");
const adapter = new fileSync("./config/default.json");
const db = low(adapter);

const router = express.Router();

router.get("/", async (req, res) => {
  const ret = await cards_model.all();

  return res.status(200).json(ret);
});

router.get("/customer", async (req, res) => {
  const id = req.token_payload.id;

  const ret = await cards_model.find_by_id_customer(id);

  return res.status(200).json(ret);
});

router.post("/customer/detail", async (req, res) => {
  if (req.body.partner_code === 1) {
    if ((await cards_model.is_exist(req.body.card_number)) === false) {
      // return res.status(400).json({is_error: true});
      res
        .status(203)
        .json({ is_error: true, msg: "Số tài khoản không tồn tại!" });
    } else {
      const card = await cards_model.find_detail_by_card_number(
        req.body.card_number
      );
      const customer = await customers_model.detail(card.id_customer);

      const ret = {
        card_number: card.card_number,
        full_name: customer.full_name,
        phone_number: customer.phone_number,
        bank_name: "Noi Bo",
        email: customer.email,
      };

      return res.status(200).json(ret);
    }
  } else {
    const customer = await interbanks_model.get_info_customer(
      req.body.card_number,
      req.body.partner_code
    );

    if (customer !== false) {
      const ret = {
        full_name: customer.info.clientName,
        phone_number: customer.info.phone,
        email: customer.info.clientEmail,
        card_number: customer.info.card_number,
        bank_name: customer.bank_name,
      };

      res.status(200).json(ret);
    } else {
      res
        .status(203)
        .json({ is_error: true, msg: "Hệ thống gặp lỗi khi truy vấn thông tin từ api đối tác!" });
    }
  }
});

router.post("/customer/saving/add", async (req, res) => {
  if (isNaN(req.body.money) || req.body.money < 0) {
    return res
      .status(203)
      .json({ is_error: true, msg: "Số tiền không hợp lệ!" });
  }

  await db.update("account_default.saving_card_number", (n) => n + 1).write();
  const card_number_temp = await db
    .get("account_default.saving_card_number")
    .value();

  const entity_card = {
    id_customer: req.token_payload.id,
    id_type_card: 2,
    card_number: card_number_temp,
    balance: req.body.money,
    is_delete: 0,
  };

  const ret = await cards_model.add(entity_card);

  return res.status(200).json(ret);
});

router.post("/customer/edit/:id", async (req, res) => {
  if ((await cards_model.is_exist(req.body.card_number)) === true) {
    return res
      .status(203)
      .json({ is_error: true, msg: "Số tài khoản đã tồn tại!" });
  }

  const condition = { _id: req.params.id };
  const entity = req.body;

  const ret = await cards_model.edit(condition, entity);

  return res.status(200).json(ret);
});

router.post("/customer/delete/:id", async (req, res) => {
  const id = req.params.id;

  const ret = await cards_model.del(id);

  return res.status(200).json(ret);
});

router.get("/id/:card_number", async (req, res) => {
  const card_number = req.params.card_number;

  const ret = await cards_model.find_id_by_card_number(card_number);

  return res.status(200).json(ret);
});

module.exports = router;
