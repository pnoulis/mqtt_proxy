import { Subscription, Client } from "./Client.js";

class Proxy {
  constructor() {
    this.subscriptions = new Map();
  }
}

Proxy.prototype._subscribe = function _subscribe(sub) {
  return new Promise((resolve, reject) => {
    let subscription = this.subscriptions.get(sub);
    if (subscription) {
      resolve(subscription);
    }

    const subscribe = (tries = 0) => {
      this.server.subscribe(sub, (err) => {
        if (!err) {
          this.subscriptions.set(sub, new Subscription(sub));
          resolve(this.subscriptions.get(sub));
        } else if (tries < 10) {
          subscribe(tries + 1);
        } else {
          reject();
        }
      });
    };

    subscribe();
  });
};

Proxy.prototype.subscribe = function subscribe(route, options, cb) {};

Proxy.prototype._publish = function _publish(pub, message, cb) {
  this.server.publish(pub, message, cb);
};

Proxy.protoype.publish = function publish(address, message, options) {
  return new Promise((resolve, reject) => {
    try {
      const { pub, sub } = this.registry.resolve(address);
      const encoded = this.encode(message);
      let subscription = this.subscription.get(sub);
      if (!subscription) {
        subscription = new Subscription(this.server, sub);
      }
      const client = new Client(resolve, reject, encoded, options);
      return subscription.publish(client);
    } catch (err) {
      // 1. Address could not be resolved.
      // 2. Message could not be encoded.
      reject(err);
    }
  });
};

Proxy.prototype.subscribe = function subscribe(address, listener, options) {};

Proxy.prototype.collectListeningClients = function collectListeningClients() {};
