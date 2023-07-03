import { stateful } from "js_utils";
import { Down } from "./StateDown.js";
import { Connecting } from "./StateConnecting.js";
import { Up } from "./StateUp.js";
import { Delivering } from "./StateDelivering.js";
import { SubscriptionClient, PublishingClient } from "./Client.js";

/*
  A subscription at any point in time may be:
  1. Establishing a connection. (Asynchronous)
  2. Publishing a message. (Asynchronous)
  3. Waiting for a response. (Synchronous)
  4. Delivering a message.
  4. Admitting new clients. (Asynchronous)

  States: Down Up Devivering
 */

class Subscription {
  constructor(server, pub, sub) {
    stateful.construct.call(this);
    this.server = server;
    this.pub = pub;
    this.sub = sub;
    this.clients = [];
  }

  connect(cb) {
    if (this.connecting) {
      return;
    }
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
    this.connecting = true;
    subscribe();
  }

  getCurrentPublishingClient() {
    for (let i = 0; i < this.clients.length; i++) {
      if (this.clients[i] instanceof PublishingClient) {
        return this.clients[i];
      }
    }
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
    if (this.publisher) {
      this.publisher.deliver(err, msg);
    }
    for (let i = 0; i < this.clients.length; i++) {
      if (this.clients[i] instanceof SubscriptionClient) {
        this.clients[i].deliver(err, msg);
      }
    }
    this.publishNextClient();
  }

  // interface
  publish(client) {
    this.clients.push(client);
    this.state.publish();
  }
}
stateful(Subscription, [Down, Connecting, Up, Delivering]);

export { Subscription };
