const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: '587',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  secureConnection: 'false'
})

/* transporter.set('oauth2_provision_cb', (user, renew, callback)=> {
  let accessToken = userTokens[user]
  if(!accessToken){
    return callback(new Error('Unknown user'))
  } else {
    return callback(null, accessToken)
  }
}) */

module.exports = function(to, subject, html) {
  transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: to,
    subject: subject,
    html: html,
  }, function (err, info) {
    if (err) {
      console.log(err)
    } else {
      console.log(info)
    }
  })
}


/* const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

module.exports = (to, subject, html) => {
  const mailData = Array.isArray(to) && Array.isArray(subject) && Array.isArray(html)
    ? to.map((to, idx) => ({ from: process.env.EMAIL_FROM, to, subject: subject[Number(idx)], html: html[Number(idx)] })) 
    : { from: process.env.EMAIL_FROM, to, subject, html }
  sgMail.send(mailData).catch(err => console.error(err.toString()))
} */