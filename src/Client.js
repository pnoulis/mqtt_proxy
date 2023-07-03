import { uuid } from "js_utils";

class Client {
  constructor(options = {}) {
    // time registered
    this.id = uuid();
    this.treg = Date.now();
  }

  unsubscribe(subscription) {
    let clientIndex = -1;
    for (let i = 0; i < subscription.clients.length; i++) {
      if (subscription.clients[i].id === this.id) {
        clientIndex = i;
      }
    }
    if (clientIndex > -1) {
      subscription.clients = subscription.clients
        .slice(0, clientIndex)
        .concat(subscription.clients.slice(clientIndex + 1));
    } else {
      throw new Error(
        `Failed to unsubscribe missing client with id:${this.id}`
      );
    }
  }
  publish() {}
  deliver() {}
}

class SubscriptionClient extends Client {
  constructor(deliver) {
    super();
    this.deliver = deliver;
  }
}

class PublishingClient extends Client {
  constructor(publish, deliver) {
    super();
    this.publish = publish;
    this.deliver = deliver;
  }
}

export { SubscriptionClient, PublishingClient };
