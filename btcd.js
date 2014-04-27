// Generated by CoffeeScript 1.7.1
(function() {
  var Client, EventEmitter, WebSocket, debug, methods, readFileSync,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  WebSocket = require('ws');

  readFileSync = require('fs').readFileSync;

  EventEmitter = require('events').EventEmitter;

  debug = require('debug')('btcd');

  methods = require('./methods');

  Client = (function(_super) {
    var VER, counter;

    __extends(Client, _super);

    VER = '1.0';

    counter = 0;

    function Client(uri, cert) {
      this.uri = uri;
      this.handle_message = __bind(this.handle_message, this);
      if (typeof cert === 'string') {
        cert = readFileSync(cert);
      }
      this.opt = cert != null ? {
        cert: cert,
        ca: [cert]
      } : {};
      this.connect();
    }

    Client.prototype.connect = function() {
      this.ws = new WebSocket(this.uri, this.opt);
      this.ws.on('message', this.handle_message);
      this.ws.on('open', (function(_this) {
        return function() {
          return _this.emit('ws:open');
        };
      })(this));
      this.ws.on('error', (function(_this) {
        return function(err) {
          return _this.emit('ws:error', err);
        };
      })(this));
      return this.ws.on('close', (function(_this) {
        return function(code, msg) {
          return _this.emit('ws:close', code, msg);
        };
      })(this));
    };

    Client.prototype.call = function() {
      var cb, id, method, msg, params, _i, _ref;
      method = arguments[0], params = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
      if (this.ws.readyState === WebSocket.CONNECTING) {
        return this.once('open', (_ref = this.call).bind.apply(_ref, [this].concat(__slice.call(arguments))));
      }
      id = ++counter;
      msg = JSON.stringify({
        jsonrpc: VER,
        id: id,
        method: method,
        params: params
      });
      debug('-> %s', msg);
      return this.ws.send(msg, (function(_this) {
        return function(err) {
          if (err != null) {
            return cb(err);
          } else {
            return _this.once('res:' + id, cb);
          }
        };
      })(this));
    };

    Client.prototype.close = function() {
      return this.ws.close();
    };

    Client.prototype.handle_message = function(msg) {
      var error, id, method, params, result, _ref;
      _ref = JSON.parse(msg), id = _ref.id, error = _ref.error, result = _ref.result, method = _ref.method, params = _ref.params;
      debug("<- %s", msg);
      if (id != null) {
        if (error != null) {
          return this.emit('res:' + id, error);
        } else {
          return this.emit('res:' + id, null, result);
        }
      } else if (error != null) {
        return this.emit('error', error);
      } else if (method != null) {
        return this.emit.apply(this, [method].concat(__slice.call(params)));
      } else {
        return this.emit('error', new Error('Invalid message: ' + msg));
      }
    };

    methods.forEach(function(method) {
      return Client.prototype[method] = function() {
        var a;
        a = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return this.call.apply(this, [method].concat(__slice.call(a)));
      };
    });

    return Client;

  })(EventEmitter);

  module.exports = function(uri, cert) {
    return new Client(uri, cert);
  };

}).call(this);
