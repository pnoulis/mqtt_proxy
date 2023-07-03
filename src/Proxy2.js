import { Registry } from "./Registry.js";
import { Subscription } from "./Subscription.js";
import { PublishingClient } from "./Client.js";

class Proxy {
  constructor(server, registry) {
    this.server = server;
    this.registry = new Registry(registry);
    this.subscriptions = new Map();
    this.server.on("message", (sub, msg) => {
      const subscription = this.subscriptions.get(sub);
      try {
        msg = this.decode(msg);
        subscription.deliver(null, msg);
      } catch (err) {
        subscription.deliver(err);
      }
    });
  }
}

Proxy.prototype.decode = function decode(msg = "") {
  try {
    const decoded = msg.toString() || {};
    return decoded;
  } catch (err) {
    throw new Error("Failed to decode message");
  }
};

Proxy.prototype.encode = function encode(msg = "") {
  try {
    const encoded = JSON.stringify(msg);
    return encoded;
  } catch (err) {
    throw new Error("Failed to encode message");
  }
};

Proxy.prototype.publish = function publish(address, message, options) {
  return new Promise((resolve, reject) => {
    try {
      const { pub, sub } = this.registry.resolve(address);
      const encoded = this.encode(message);
      let subscription = this.subscriptions.get(sub);
      if (!subscription) {
        subscription = new Subscription(this.server, pub, sub);
        this.subscriptions.set(sub, subscription);
      }
      const client = new PublishingClient(
        (cb) => this.server.publish(pub, encoded, cb),
        (err, msg) => (err ? reject(err) : resolve(msg))
      );
      subscription.publish(client);
    } catch (err) {
      // 1. Address could not be resolved.
      // 2. Message could not be encoded.
      reject(err);
    }
  });
};

export { Proxy };
