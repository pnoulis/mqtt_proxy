import { describe, expect, it, beforeAll, beforeEach } from "vitest";

/*
  TESTING COMPONENTS
 */

import { Subscription } from "../src/Subscription.js";

/*
  DEPENDENCIES
 */

describe("Subscription", () => {
  it("Should be stateful", () => {
    const s = new Subscription();
    expect(s.states).toBeInstanceOf(Array);
  });
  it("Should initialize a new Subscription instance at the down state", () => {
    const s = new Subscription();
    expect(s).toBeInstanceOf(Subscription);
    expect(s.inState("down"));
  });
});
