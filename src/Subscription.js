import { stateful } from "js_utils";
import { Down } from "./StateDown.js";
import { Connecting } from "./StateConnecting.js";
import { Up } from "./StateUp.js";
import { Delivering } from "./StateDelivering.js";
import { SubscriptionClient, PublishingClient } from "./Client.js";

class Subscription {
  constructor(server, pub, sub) {
    stateful.construct.call(this);
    this.server = server;
    this.pub = pub;
    this.sub = sub;
    this.clients = [];
  }

  connect(cb) {
    const subscribe = (tries = 0) => {
      this.server.subscribe(this.sub, (err) => {
        if (!err) {
          cb(null);
        } else if (tries < 10) {
          subscribe(tries + 1);
        } else {
          cb(err);
        }
      });
    };
    subscribe();
  }

  getCurrentPublishingClient() {
    for (let i = 0; i < this.clients.length; i++) {
      if (this.clients[i] instanceof PublishingClient) {
        return this.clients[i];
      }
    }
  }

  getRecipients() {
    let publisher = null;
    if (this.publisher && this.publisher.mode !== "ff") {
      publisher = this.publisher;
    }
    const subs = [];
    const newClients = [];
    for (let i = 0; i < this.clients.length; i++) {
      if (this.clients[i] instanceof SubscriptionClient) {
        subs.push(this.clients[i]);
        if (this.clients[i].mode !== "response") {
          newClients.push(this.clients[i]);
        }
      } else {
        newClients.push(this.clients[i]);
      }
    }
    this.clients = newClients;
    return {
      publisher,
      subs,
    };
  }

  setNextPublishingClient() {
    let publisherIndex = -1;
    for (let i = 0; i < this.clients.length; i++) {
      if (this.clients[i] instanceof PublishingClient) {
        publisherIndex = i;
        break;
      }
    }

    if (publisherIndex > -1) {
      this.publisher = this.clients[publisherIndex];
      this.clients = this.clients
        .slice(0, publisherIndex)
        .concat(this.clients.slice(publisherIndex + 1));
    } else {
      this.publisher = null;
    }
    return this.publisher;
  }

  publishNextClient() {
    this.setNextPublishingClient();
    if (this.publisher) {
      this.publisher.publish((err) => err && this.deliver(err));
    } else {
      this.setState(this.getUpState);
    }
  }

  deliver(err, msg) {
    const { publisher, subs } = this.getRecipients();
    if (publisher) {
      publisher.deliver(err, msg);
    }
    for (let i = 0; i < subs.length; i++) {
      subs[i].deliver(err, msg);
    }
    this.publishNextClient();
  }

  // interface
  publish(client) {
    client.subscription = this;
    this.clients.push(client);
    this.state.publish();
    return client;
  }

  // interface
  subscribe(client) {
    client.subscription = this;
    this.clients.push(client);
    this.state.subscribe();
    return client;
  }
}
stateful(Subscription, [
  Down,
  "down",
  Connecting,
  "connecting",
  Up,
  "up",
  Delivering,
  "delivering",
]);

export { Subscription };
