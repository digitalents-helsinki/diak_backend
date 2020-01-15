const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

class Email {
  constructor(from = process.env.EMAIL_FROM) {
    this.from = from
  }

  send() {
    if (this.data) sendMail(this.data)
    else throw new Error('Nothing to send!')
  }
}

exports.MassEmail = class MassEmail {
  constructor() {
    this.data = []
  }

  add(email) {
    if (email instanceof Email) this.data.push(email.data)
    else throw new Error(`${email} is not acceptable as an email`)
  }

  send() {
    if (this.data.length) sendMail(this.data)
  }
}

exports.CustomEmail = class CustomEmail extends Email {
  constructor(to, subject, html) {
    super()

    this.data = {
      to,
      subject,
      html,
      from: this.from
    }
  }
}

exports.AnonSurveyEmail = class AnonSurveyEmail extends Email {
  constructor(to, surveyId, message, entryHash) {
    super()

    const subject = 'Uusi 3X10D -kysely'

    const html =
    `Täytä anonyymi kysely osoitteessa ${process.env.FRONTEND_URL}/anon/questionnaire/${surveyId}/${entryHash}
    <br><br>
    ${message || ''}`

    this.data = {
      from: this.from,
      to,
      subject,
      html
    }
  }
}

exports.AuthSurveyEmail = class AuthSurveyEmail extends Email {
  constructor(to, surveyId, message) {
    super()
    
    const subject = 'Uusi 3X10D -kysely'

    const html =
    `Täytä kysely osoitteessa ${process.env.FRONTEND_URL}/auth/questionnaire/${surveyId}
    <br><br>
    ${message || ''}`

    this.data = {
      from: this.from,
      to,
      subject,
      html
    }
  }
}

const sendMail = (mail) => sgMail.send(mail.data || mail).catch(err => console.error(err.toString()))
