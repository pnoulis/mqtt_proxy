import { State } from "./State.js";

class Delivering extends State {
  constructor(subscription) {
    super(subscription);
  }

  init() {
    this.subscription.publishNextClient();
  }
}

export { Delivering };
