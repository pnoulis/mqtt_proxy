import { stateful } from "js_utils";
import { Down } from "./StateDown.js";
import { Up } from "./StateUp.js";
import { Delivering } from "./StateDelivering.js";

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
  constructor(server, subscriptionTopic) {
    stateful.construct.call(this);
    this.server = server;
    this.subscription = subscriptionTopic;
    this.clients = [];
  }

  connect() {}


  // interface
  publish(client) {
    this.clients.push(client);
    this.state.publish();
  }
  subscribe(client) {
    this.clients.push(client);
    this.state.subscribe();
  }
}
stateful(Subscription, [Down, Up, Delivering]);


// class Client {}
// class PersistentClient extends Client {}
// class ResponseClient extends Client {}
// class FFClient extends Client {}

export { Subscription };
