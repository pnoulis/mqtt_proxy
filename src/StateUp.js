import { State } from "./State.js";

class Up extends State {
  constructor(subscription) {
    super(subscription);
  }
  publish() {
    this.subscription.setState(this.subscription.getDeliveringState);
  }
}

export { Up };
