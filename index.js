const config     = require('./config');
const express    = require('express');
const bodyParser = require('body-parser');
const twilio     = require('twilio');
const ngrok      = require('ngrok');

const app = new express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.listen(config.port, () => {
  console.log(`Application started at http://localhost:${config.port}`);
});

// ============================================
// ====== HANDLE NEW-CONVERSATION HOOK ========
// ============================================
let client = new twilio(config.twilio.accountSid, config.twilio.authToken);
app.post('/chat', (req, res) => {
  if (req.body.EventType === 'onConversationAdded') {
    const me = req.body.identity;
    client.conversations.v1.conversations(req.body.ConversationSid)
      .participants
      .create({
          identity: me
        })
      .then(participant => console.log(`Added ${participant.identity} to ${req.body.ConversationSid}.`))
      .catch(err => console.error(`Failed to add a member to ${req.body.ConversationSid}!`, err));
  }

  console.log("(200 OK!)");
  res.sendStatus(200);
});

app.post('/outbound-status', (req, res) => {
  console.log(`Message ${req.body.SmsSid} to ${req.body.To} is ${req.body.MessageStatus}`);
  res.sendStatus(200);
})

app.use((error, req, res, next) => {
  res.status(500)
  res.send({error: error})
  console.error(error.stack)
  next(error)
})

let ngrokOptions = {
  proto: 'http',
  addr: config.portNgrok
};

if (config.ngrokSubdomain) {
  ngrokOptions.subdomain = config.ngrokSubdomain
}

ngrok.connect(ngrokOptions).then(url => {
  console.log('ngrok url is ' + url);
}).catch(console.error);
