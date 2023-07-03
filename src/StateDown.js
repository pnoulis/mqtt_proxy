import { State } from "./State.js";

class Down extends State {
  constructor(subscription) {
    super(subscription);
  }

  publish() {
    this.subscription.connect((err) => {
      if (err) {
      } else {
        this.subscription.setState(this.subscription.getUpState);
      }
    });
  }
  subscribe() {
    this.subscription.connect((err) => {
      if (err) {
      } else {
        this.subscription.setState(this.subscription.getUpState);
      }
    });
  }
}

export { Down };
