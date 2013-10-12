var Pusher = require('pusher');

var pusher = new Pusher({
  appId: '56569',
  key: 'c7f08532bae6835b8099',
  secret: '0cd6f7e16fc64ac2ca67'
});

pusher.trigger('test_channel', 'my_event', {
  "message": "hello world"
});