const nodemailer = require("nodemailer");
const pug = require("pug");
const juice = require("juice");
const htmlToText = require("html-to-text");
const promisify = require("es6-promisify");

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

transport.sendMail({
  from: "Matt Spriggs <matt.c.spriggs@gmail.com>",
  to: "randy@example.com",
  subject: "Just trying out email function",
  html: "Hey I hope that this <strong>works</strong>!",
  text: "Hey I hope that this ***works***!!!",
});
