import { Registry } from "./Registry.js";
import { ConsoleLogger } from "js_utils";

function Proxy(userConf = {}) {
  const conf = this.parseConf(userConf);
  this.id = conf.id;
  this.logger = conf.logger;
  this.server = conf.server;
  this.transactionMode = conf.transactionMode;
  this.registry = new Registry(conf.registry);
  this.subscriptions = new Map();
  this.server.on("message", this.notifyClients.bind(this));
}

Proxy.prototype.parseConf = function parseConf(userConf) {
  const conf = {};
  conf.logger = userConf.logger || new ConsoleLogger();
  conf.id =
    userConf.id || `mqtt_proxy:${Math.random().toString(16).slice(2, 8)}`;
  conf.registry = userConf.registry || {};
  conf.registry.logger = userConf.logger || new ConsoleLogger();
  /*
    Available modes:
    ff -> fire and forget
        Used for publising one way messages. Does not subscribe the client
        to the response topics
    response -> Used to emulate a req-res cycle.
        Used mostly for publishing, but also useful at times for subscriptions.
        It unregisters the client after one req-res cycle.
    persistent -> receive all messages until instructed otherwise.
   */
  conf.transactionMode = {
    publish: "response",
    subscribe: "persistent",
    ...userConf.transactionMode,
  };
  conf.server = userConf.server ? userConf.server : { on(...args) {} };
  return conf;
};

/**
 * @param {Buffer} msg - message as received from the server
 * @returns {Object}
 * @throws {Error} - Failed to decode message
 **/
Proxy.prototype.decode = function decode(msg = "") {
  try {
    const decoded = JSON.parse(msg.toString()) || {};
    return decoded;
  } catch (err) {
    throw new Error("Failed to decode message", { cause: err });
  }
};

/**
 * @param {Object | string} msg
 * @returns {string} - stringified JSON
 * @throws {Error}
 **/
Proxy.prototype.encode = function encode(msg = "") {
  try {
    const encoded = JSON.stringify(msg);
    return encoded;
  } catch (err) {
    throw new Error("Failed to encode message", { cause: err });
  }
};

/**
 * Subscribe a callback function to the requested topic
 *
 * @param {string} route
 * @param {Object} options
 * @param {string} options.mode - a value of [ 'ff' || 'response' || 'persistent' ]
 * @param {function(err, msg)} listener - A client that is to be provided
 * with the message when and if one is available
 * @returns {promise}
 */

Proxy.prototype.subscribe = function subscribe(route, options, listener) {
  if (typeof options === "function") {
    listener = options;
    options = {};
  }
  options.mode ||= this.transactionMode.subscribe;

  return new Promise((resolve, reject) => {
    try {
      var { sub } = this.registry.resolve(route);
      this._subscribe(sub, (err, subscription) => {
        if (err) {
          reject(err);
        } else {
          const client = this.registerClient(
            sub,
            subscription,
            listener,
            options
          );
          resolve(() => this.unregisterClient(sub, client.id));
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};

Proxy.prototype._subscribe = function _subscribe(sub, cb) {
  if (this.subscriptions.has(sub)) {
    return setTimeout(() => cb(null, this.subscriptions.get(sub)), 1);
  }

  // TODO task runner should handle this.
  (function trySub(tries = 0) {
    setTimeout(() => {
      this.server.subscribe(sub, (err) => {
        if (!err) {
          this.subscriptions.set(sub, []);
          cb(null, this.subscriptions.get(sub));
        } else if (tries < 10) {
          trySub(tries + 1);
        } else {
          cb(new Error(`Failed to subscribe to topic:${sub}`, { cause: err }));
        }
      });
    }, 10);
  }).bind(this)();
};

/**
 * @param {string} route - A registered route alias
 * @param {Object} payload - Data to send
 * @param {Object} options
 * @param {string} options.mode - a value of [ 'ff' || 'response' ]
 * @returns {Promise}
 **/
Proxy.prototype.publish = function publish(
  route = "",
  payload = {},
  options = {}
) {
  options.mode ||= this.transactionMode.publish;
  return new Promise((resolve, reject) => {
    try {
      var { pub, sub } = this.registry.resolve(route);
      var encoded = this.encode(payload);
      switch (options.mode) {
        case "ff":
          this._publish(pub, encoded, (err) => (err ? reject(err) : resolve()));
          break;
        case "response":
          this.subscribe(route, { mode: "response" }, (err, msg) =>
            err ? reject(err) : resolve(msg)
          )
            .then((unsubscribe) => {
              this._publish(pub, encoded, (err) => {
                if (err) {
                  unsubscribe();
                  reject(err);
                }
              });
            })
            .catch((err) => reject(err));
          break;
        default:
          reject(`Unsupported transaction mode:${options.mode} by publish`);
      }
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * @param {string} pub - The topic to publish to
 * @param {string} payload - The encoded data to send
 * @param {Object} client - The client to deliver the response to, if any
 **/
Proxy.prototype._publish = function _publish(pub, payload, cb) {
  this.server.publish(pub, payload, (err) => {
    if (err) {
      this.logger.error(`Failed to publish to topic: ${pub}`, err);
      cb(new Error(`Failed to publish to topic:${pub}`, { cause: err }));
    } else {
      console.log(`Successfully published to topic: ${pub}`);
      cb();
    }
  });
};

/**
 * @param {string} sub - route subscription topic
 * @param {array} subscription - subscription clients array
 * @param {callback(err, msg)} listener - function to call on message delivery
 * @param {object} options
 * @param {string} options.mode
 * from the server
 * @returns {object} client
 * @returns {string} client.id - client ID
 * @returns {string} client.sub - route subscription topic
 * @returns {string} client.mode - "persistent" | "response" | "ff"
 * @returns {string} client.listener - function to call on message delivery
 * from the server
 **/
Proxy.prototype.registerClient = function registerClient(
  sub,
  subscription,
  listener,
  options = {}
) {
  const client = {
    id: `${new Date().getTime()}_${subscription.length}`,
    sub,
    mode: options.mode,
    listener,
  };
  subscription.push(client);
  return client;
};

/**
 * @param {string} sub - route subscription topic
 * @param {string} clientId - subscription client ID
 **/
Proxy.prototype.unregisterClient = function unregisterClient(sub, clientId) {
  const clients = this.subscriptions.get(sub);
  if (!clients.length) {
    this.logger.warn(
      "Trying to unregister client from empty subscription list"
    );
  }
  const client = clients.findIndex((client) => client.id === clientId);
  if (clientId === -1) {
    this.logger.warn(`Client: ${clientId} missing from subscription list`);
  } else {
    clients.splice(client, 1);
    this.logger.debug(`Successfully unregistered client: ${clientId}`, clients);
  }
};

Proxy.prototype.notifyClients = function notifyClients(sub, msg) {
  const clients = this.subscriptions.get(sub);
  if (!clients || clients.length === 0) {
    return;
  }
  let error = null;
  let decoded = null;
  if (msg instanceof Error) {
    error = msg;
  } else {
    try {
      decoded = this.decode(msg);
    } catch (err) {
      error = err;
    }
  }
  this.subscriptions.set(
    sub,
    clients.filter((client) => {
      client.listener(error, decoded);
      return client.mode === "persistent";
    })
  );
};

export { Proxy };
