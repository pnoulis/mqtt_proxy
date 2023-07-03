import { State } from "./State.js";

class Up extends State {
  constructor(subscription) {
    super(subscription);
  }

  publish() {}
  subscribe(client) {}
}

export { Up };
