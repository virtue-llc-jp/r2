import ZmqPublisher from '../zmq/ZmqPublisher';
import ZmqSubscriber from '../zmq/ZmqSubscriber';

test('simple', async () => {
  const url = 'tcp://127.0.0.1:9879';
  const topic = 'topic';
  const pub = new ZmqPublisher(url);
  const sub = new ZmqSubscriber(url);
  let received = false;
  sub.subscribe(topic, message => {
    expect(message).toBe('message');
    received = true;
  });  
  sub.subscribe('other', () => undefined);
  await new Promise(resolve => {
    const timer = setInterval(() => {     
      pub.publish('other', 'xxxxxxx');
      pub.publish(topic, 'message');
      if (received) {
        clearInterval(timer);
        resolve({});
      }
    }, 10);
  });
  sub.unsubscribe(topic);
  sub.dispose();
  pub.dispose();
});
