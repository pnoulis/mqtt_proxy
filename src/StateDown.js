import { State } from "./State.js";

class Down extends State {
  constructor(subscription) {
    super(subscription);
  }
  publish() {
    this.subscription.setState(this.subscription.getConnectingState);
    this.subscription.connect((err) => {
      if (err) {
        this.subscription.setState(this.subscription.getDownState);
        this.subscription.setNextPublishingClient();
        this.subscription.deliver(err);
      } else {
        this.subscription.setState(this.subscription.getDeliveringState);
      }
    });
  }
  subscribe() {
    this.subscription.setState(this.subscription.getConnectingState);
    this.subscription.connect((err) => {
      if (err) {
        this.subscription.setState(this.subscription.getDownState);
        this.subscription.deliver(err);
      } else {
        this.subscription.setState(this.subscription.getUpState);
      }
    });
  }
}

export { Down };
