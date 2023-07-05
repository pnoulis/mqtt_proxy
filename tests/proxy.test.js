import { describe, expect, it, beforeAll, beforeEach } from "vitest";
import mqtt from "mqtt";

/*
  TESTING COMPONENTS
*/

import { Proxy } from "../src/Proxy2.js";

/*
  DEPENDENCIES
 */
import { mockBackendServer } from "agent_factory.shared/mocks/mockBackendServer.js";
import { toClient as BACKEND_TOPICS } from "agent_factory.shared/backend_topics.js";
import { getEnvar, delay } from "js_utils";

let proxy = undefined;
let publish = undefined;
const MOCK_URL = getEnvar("BACKEND_URL", true);

beforeAll(async () => {
  const mqttClient = mqtt.connect(MOCK_URL);
  proxy = new Proxy({
    server: mqttClient,
    registry: {
      routes: BACKEND_TOPICS,
      strict: true,
    },
  });
  publish = proxy.publish.bind(proxy, "/player/login", "msg");
});

describe("Proxy", () => {
  it("Should publish a message", async () => {
    await expect(publish()).resolves.toMatchObject({ result: "OK" });
  });
  it("Should publish multiple messages successfully", async () => {
    await expect(publish()).resolves.toMatchObject({ result: "OK" });
    await expect(publish()).resolves.toMatchObject({ result: "OK" });
    await expect(publish()).resolves.toMatchObject({ result: "OK" });
    await expect(publish()).resolves.toMatchObject({ result: "OK" });
    await expect(publish()).resolves.toMatchObject({ result: "OK" });
    await expect(publish()).resolves.toMatchObject({ result: "OK" });
    await expect(publish()).resolves.toMatchObject({ result: "OK" });
    await expect(publish()).resolves.toMatchObject({ result: "OK" });
    await expect(publish()).resolves.toMatchObject({ result: "OK" });
    await expect(publish()).resolves.toMatchObject({ result: "OK" });
  });
  it.only("Should make sure that publishes are dealt with in order", async () => {
    mockBackendServer.auto = false;
    const p1 = publish();
    const p2 = publish();
    await delay(2000);
    expect(mockBackendServer.publishersQueue).toHaveLength(1);
    mockBackendServer.publish();
    await expect(p1).resolves.toMatchObject({result: 'OK'});
    await delay(1000);
    expect(mockBackendServer.publishersQueue).toHaveLength(1);
    mockBackendServer.publish();
    await expect(p2).resolves.toMatchObject({result: "OK"});
  });
});
