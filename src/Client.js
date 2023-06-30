import { uuid } from "js_utils";

class Subscription {
  constructor(subscription) {
    this.subscription = subscription;
    this.clients = [];
  }

  subscribe(options) {}

  publish({ mode = "response" }) {
    const client = new Client(options);
  }

  deliver(message) {
    const clients = this.clients.get(this.subscription);
    const newClients = [];
    const recipient = this.findRecipientIndex(message.id);
    let clientRemoved = false;

    for (let i = 0; i < clients.length; ++i) {
      if (recipient === i) {
        clients[recipient].cb(message);
        clientRemoved = true;
        continue;
      } else if (clients[i].id == null) {
        clients[i].cb(message);
      }
      if (clientRemoved) {
        newClients[i - 1] = clients[i];
      } else {
        newClients[i] = clients[i];
      }
    }

    this.clients.set(this.subscription, newClients);
  }

  registerCLient(options) {
    const client = new Client(options);
  }
}

class Client {
  constructor(options = {}) {
    // arguments
    this.clients = clients;
    this.cb = cb;

    // time registered
    this.treg = Date.now();
  }

  unsubscribe() {
    const clients = this.clients.get(this.subscription);
    const newClients = [];
    let clientRemoved = false;

    for (let i = 0; i < clients.length; i++) {
      if (clientRemoved) {
        newClients[i - 1] = clients[i];
      } else if (clients[i].id === this.id) {
        clientRemoved = true;
      } else {
        newClients[i] = clients[i];
      }
    }

    this.clients.set(this.subscription, newClients);
  }
}

export { Client, Subscription };
