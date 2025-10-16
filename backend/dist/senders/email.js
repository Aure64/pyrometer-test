"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
const loglevel_1 = require("loglevel");
const nodemailer_1 = require("nodemailer");
const events_1 = require("../events");
const format_1 = require("../format");
const create = (config) => {
    //From https://nodemailer.com/smtp/#tls-options:
    // * secure – if true the connection will use TLS when connecting to
    //   server. If false (the default) then TLS is used if server
    //   supports the STARTTLS extension. In most cases set this value
    //   to true if you are connecting to port 465. For port 587 or 25
    //   keep it false
    // * requireTLS – if this is true and secure is false then Nodemailer
    //   tries to use STARTTLS even if the server does not advertise
    //   support for it. If the connection can not be encrypted then
    //   message is not sent
    const secure = config.protocol === "SSL" ? true : false;
    const requireTLS = config.protocol === "STARTTLS" ? true : false;
    const transporter = (0, nodemailer_1.createTransport)({
        host: config.host,
        port: config.port,
        secure,
        requireTLS,
        auth: {
            user: config.username,
            pass: config.password,
        },
    });
    const log = (0, loglevel_1.getLogger)("email-sender");
    return (0, events_1.FilteredSender)(async (events) => {
        log.debug(`About to send email for ${events.length} events`, events);
        const [subject, text] = (0, format_1.email)(events, config.emoji, config.short_address, config.alias);
        const fromAddr = config.from || (Array.isArray(config.to) ? config.to[0] : config.to);
        const result = await transporter.sendMail({
            from: fromAddr,
            to: config.to,
            subject,
            text,
        });
        log.debug("Sent email", result);
        return Promise.resolve();
    }, config);
};
exports.create = create;
