import { TaskRunner } from "js_utils/task_runners";
import { Registry } from "./Registry.js";
import { Subscription } from "./Subscription.js";
import { SubscriptionClient, PublishingClient } from "./Client.js";

class Proxy {
  constructor({ server, registry }) {
    this.server = server;
    this.registry = new Registry(registry);
    this.subscriptions = new Map();
    this.tr = new TaskRunner({
      isConnected: function () {
        return server.connected;
      },
    });
    this.server.on("message", (sub, msg) => {
      const subscription = this.subscriptions.get(sub);
      if (!subscription) {
        return;
      }
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
    const decoded = JSON.parse(msg.toString()) || {};
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


/*
  Listener callback example:

  listener(unsubscribed, err, message);
  where unsubscribed is a boolean. The listener is called with
  unsubscribed to true if the client unsubscribed before a message
  arrived.
 */
Proxy.prototype.subscribe = function subscribe(topic, listener, options) {
  return this.tr.run(
    () =>
      new Promise((resolve, reject) => {
        try {
          const { pub, sub } = this.registry.resolve(topic);
          let subscription = this.subscriptions.get(sub);
          if (!subscription) {
            subscription = new Subscription(this.server, pub, sub);
            this.subscriptions.set(sub, subscription);
          }
          options = {
            mode: "persistent",
            ...options,
          };
          if (!/response|persistent/.test(options.mode)) {
            reject(
              new Error(
                `subscribe() does not support options.mode:${options.mode}`
              )
            );
          }
          const client = subscription.subscribe(
            new SubscriptionClient(listener, options)
          );
          resolve(client.unsubscribe.bind(client));
        } catch (err) {
          reject(err);
        }
      })
  );
};

Proxy.prototype.publish = function publish(topic, message, options) {
  return this.tr.run(
    () =>
      new Promise((resolve, reject) => {
        try {
          const { pub, sub } = this.registry.resolve(topic);
          const encoded = this.encode(message);
          let subscription = this.subscriptions.get(sub);
          if (!subscription) {
            subscription = new Subscription(this.server, pub, sub);
            this.subscriptions.set(sub, subscription);
          }
          options = {
            mode: "response",
            ...options,
          };
          if (!/response|ff/.test(options.mode)) {
            reject(
              new Error(
                `publish() does not support options.mode:${options.mode}`
              )
            );
          }
          subscription.publish(
            new PublishingClient(
              (cb) => this.server.publish(pub, encoded, cb),
              function (err, msg) {
                return err ? reject(err) : resolve(msg);
              },
              options
            )
          );
        } catch (err) {
          reject(err);
        }
      })
  );
};

export { Proxy };
