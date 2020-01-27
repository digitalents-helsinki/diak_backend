const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendMail = (mail) => sgMail.send(mail)

const email = {
  from: process.env.EMAIL_FROM
}

exports.sendCustomEmail = (to, subject, html) => sendMail({ ...email, to, subject, html})

exports.generateAnonSurveyEmail = (to, surveyId, message, entryHash) => {
  const subject = 'Uusi 3X10D -kysely'

  const html =
  `Täytä anonyymi kysely osoitteessa ${process.env.FRONTEND_URL}/anon/questionnaire/${surveyId}/${entryHash}
  <br><br>
  ${message || ''}`

  return {
    ...email,
    to,
    subject,
    html
  }
}

exports.generateAuthSurveyEmail = (to, surveyId, message) => {
  const subject = 'Uusi 3X10D -kysely'

  const html =
  `Täytä kysely osoitteessa ${process.env.FRONTEND_URL}/auth/questionnaire/${surveyId}
  <br><br>
  ${message || ''}`

  return {
    ...email,
    to,
    subject,
    html
  }
}

exports.MassEmail = class MassEmail {
  constructor() {
    this.data = []
  }

  add(email) {
    this.data.push(email)
  }

  getAmount() {
    return this.data.length
  }

  send() {
    if (this.data.length) return sendMail(this.data)
  }
}
