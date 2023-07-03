import { State } from "./State.js";

class Delivering extends State {
  constructor(subscription) {
    super(subscription);
  }

  publish(client) {}
  subscribe(client) {}
}

export { Delivering };
