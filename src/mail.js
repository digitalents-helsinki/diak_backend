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
/*
transporter.set('oauth2_provision_cb', (user, renew, callback)=> {
  let accessToken = userTokens[user]
  if(!accessToken){
    return callback(new Error('Unknown user'))
  } else {
    return callback(null, accessToken)
  }
})
*/
module.exports = function(to, subject, html) {
  transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: to,
    subject: subject,
    html: html,
  }, function (err, info) {
    if(err) {
      console.log(err)
    } else {
      console.log(info)
    }
  })
}
