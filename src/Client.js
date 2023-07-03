import { uuid } from "js_utils";

class Client {
  constructor(options) {
    this.id = uuid();
    this.mode = options.mode;
  }

  unsubscribe() {
    let clientIndex = -1;
    for (let i = 0; i < this.subscription.clients.length; i++) {
      if (this.subscription.clients[i].id === this.id) {
        clientIndex = i;
      }
    }
    if (clientIndex > -1) {
      this.subscription.clients = this.subscription.clients
        .slice(0, clientIndex)
        .concat(this.subscription.clients.slice(clientIndex + 1));
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
  constructor(deliver, options) {
    super(options);
    this.deliver = deliver;
  }
}

class PublishingClient extends Client {
  constructor(publish, deliver, options) {
    super(options);
    this.publish = publish;
    this.deliver = deliver;
  }
}

export { SubscriptionClient, PublishingClient };
