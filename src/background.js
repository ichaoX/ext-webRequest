let settings = {};

/**
 * @typedef {Record<string,any>} Rule
 * @typedef {Record<string,any> & {rule:Rule, index:number}} Context
 * @typedef {Record<string,any> & shareProto & {contexts: Context[]}} Share
 */
const shareProto = {
  /**
   * @returns {Rule[]}
   */
  get rules() {
    return (this.contexts || []).map(c => c.rule);
  },
  /**
   * @param {string} type
   * @returns {Function[]|undefined}
   */
  getFuncs(type) {
    if (this.contexts) {
      let funcs = [];
      for (let context of this.contexts) {
        if (context.matchStatus !== false && context.rule && 'function' === typeof context.rule[type]) {
          funcs.push(context.rule[type].bind(context))
        }
      }
      if (funcs.length > 0) return funcs;
    }
  },
};
/**
 * @type {Map<string,Share>}
 */
const shareData = new Map();

function execute(func, args = [], stopCheck = null) {
  if (Array.isArray(func)) {
    if (func.length == 1) return execute(func[0], args, stopCheck);
    func = func.slice(0);
    let f;
    let options = { args: args, val: undefined, ret: undefined };
    while ((f = func.shift()) !== undefined) {
      try {
        options.val = f(...options.args);
        if (options.val instanceof Promise) {
          func.unshift(() => options.val);
          return (async () => {
            for (let i in func) {
              try {
                options.val = await func[i](...options.args);
                if (stopCheck && stopCheck(options)) return options[options.ret === undefined ? 'val' : 'ret'];
              } catch (e) {
                console.error(e);
              }
            }
            return options[options.ret === undefined ? 'val' : 'ret'];
          })();
        }
        if (stopCheck && stopCheck(options)) return options[options.ret === undefined ? 'val' : 'ret'];
      } catch (e) {
        console.error(e);
      }
    }
    return options[options.ret === undefined ? 'val' : 'ret'];
  } else {
    return func(...args);
  }
}

function generalListener(name, details, defVal) {
  let share = shareData.get(details.requestId);
  let funcs = share && share.getFuncs(name);
  if (!funcs) {
    return defVal;
  }
  return execute(funcs, [details, share], (options) => {
    if (!options.val) return false;
    if (!options.ret) options.ret = options.val;
    let val = options.val;
    if (val.cancel && options.ret.cancel === false) val.cancel = options.ret.cancel;
    if (val.upgradeToSecure && options.ret.upgradeToSecure === false) val.upgradeToSecure = options.ret.upgradeToSecure;
    if (val.cancel || val.redirectUrl || val.upgradeToSecure) {
      options.ret = val;
      return true;
    }
    if (val.cancel !== undefined) options.ret.cancel = val.cancel;
    if (val.upgradeToSecure != undefined) options.ret.upgradeToSecure = val.upgradeToSecure;
    if (val.authCredentials && !options.ret.authCredentials) options.ret.authCredentials = val.authCredentials;
    let details = options.args && options.args[0];
    if (val.requestHeaders) {
      options.ret.requestHeaders = val.requestHeaders;
      if (details && details.requestHeaders) details.requestHeaders = JSON.parse(JSON.stringify(val.requestHeaders));
    }
    if (val.responseHeaders) {
      options.ret.responseHeaders = val.responseHeaders;
      if (details && details.responseHeaders) details.responseHeaders = JSON.parse(JSON.stringify(val.responseHeaders));
    }
    return false;
  });
}

function end(details, timeout = 0) {
  const requestId = details.requestId;
  if (shareData.has(requestId)) {
    if (timeout > 0) {
      let timeoutId = setTimeout(() => end(details), timeout);
      let share = shareData.get(requestId)
      if (share) share._endTimeoutId = timeoutId;
      return;
    }
    // console.log(details)
    shareData.delete(requestId)
  }
}

let isSuspend = async (details, share) => {
  if (!settings.global_status) return true;
  if ("function" === typeof isTabSuspend && isTabSuspend(details)) return true;
  try {
    if (settings.global_test && !await settings.global_test.call({}, details, share)) return true;
  } catch (e) {
    console.error(e);
  }
  return false;
};

/**
 * @param {Share} share
 * @param {number} tabId
 * @param {number} [index]
 */
let updateStat = (share, tabId, rule = null) => {
  if (tabId > 0 && "function" === typeof increaseCount) {
    let rules = rule === null ? share.contexts.filter(c => c.matchStatus).map(c => c.rule) : [rule];
    if (!rules.length) return;
    if (increaseCount(tabId, rules, !share.countable)) share.countable = false;
  }
};

// Listener

util.addListener(browser.webRequest.onBeforeRequest,
  async function (details) {
    /**
     * @type {Share}
     */
    const share = Object.assign(Object.create(shareProto), {
      contexts: [],
      countable: true,
    });
    // redirected ?
    const before = shareData.get(details.requestId);
    if (before) {
      if (before._endTimeoutId) {
        clearTimeout(before._endTimeoutId);
        delete before._endTimeoutId;
      }
      share.before = before;
      shareData.delete(details.requestId);
    }
    if (await isSuspend(details, share)) return;
    let url = details.url
    const rules = settings.rules || [];
    let index = 0;
    for (let i in rules) {
      try {
        let rule = rules[i];
        if (!rule.enable || !rule.test) continue;
        let _matchStatus = undefined;
        let context = {
          index,
          rule,
          setMatchStatus(v = null) {
            this.matchStatus = v;
            return v === this.matchStatus;
          },
          set matchStatus(v) {
            if ('boolean' === typeof _matchStatus || !(v === null || 'boolean' === typeof v)) return;
            if (_matchStatus === null && v === true) {
              if (this === share.contexts[this.index] && this.rule) {
                updateStat(share, details.tabId, this.rule);
              } else {
                console.debug('cancel');
                return;
              }
            }
            _matchStatus = v;
          },
          get matchStatus() {
            return _matchStatus;
          },
        };
        if (await rule.test.call(context, details, share) && context.matchStatus !== false) {
          if (_matchStatus !== null) _matchStatus = true;
          share.contexts.push(context);
          index++;
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (share.contexts.length < 1) return;
    updateStat(share, details.tabId);
    if (settings.request_verbose >= 1) {
      let request_data = [`[${details.tabId}] ${details.method} ${url}`];
      if (settings.request_verbose >= 2) request_data.push(details);
      console.info(...request_data);
    }
    shareData.set(details.requestId, share);
    let filterResponseFunc = share.getFuncs('filterResponse');
    if (filterResponseFunc && browser.webRequest.filterResponseData) {
      let filter = browser.webRequest.filterResponseData(details.requestId);
      share.filter = filter;
      filter.onerror = event => {
        // console.warn('filter_error', url, filter.error, event)
        // filter.disconnect();
        return execute(filterResponseFunc, [event, share, filter, details]);
      };
      filter.onstart = event => {
        if (!!share.contexts.find(c => c.matchStatus === false && c.rule.filterResponse)) {
          filterResponseFunc = share.getFuncs('filterResponse');
          if (!filterResponseFunc) {
            filter.disconnect();
            return;
          }
        }
        return execute(filterResponseFunc, [event, share, filter, details]);
      };
      filter.ondata = async event => {
        let chunk = await execute(filterResponseFunc, [event, share, filter, details], options => false !== options.val);
        // console.log(chunk);
        if (false !== chunk) filter.write(chunk || event.data);
      };
      filter.onstop = async event => {
        let data;
        try {
          data = await execute(filterResponseFunc, [event, share, filter, details], options => false !== options.val);
          if (data) filter.write(data);
        } finally {
          if (false !== data) filter.close();
        }
      };
    }
    return await generalListener('beforeRequest', details);
    // {cancel:boolean,redirectUrl:string}
  },
  {
    urls: ["<all_urls>"]
  },
  [
    "blocking",
    "requestBody",
  ]
);

util.addListener(browser.webRequest.onBeforeSendHeaders,
  function (details) {
    return generalListener('beforeSendHeaders', details);
    // {requestHeaders:details.requestHeaders}
  },
  {
    urls: ["<all_urls>"]
  },
  [
    "blocking",
    "requestHeaders",
  ]
);

util.addListener(browser.webRequest.onSendHeaders,
  function (details) {
    return generalListener('sendHeaders', details);
  },
  {
    urls: ["<all_urls>"]
  },
  [
    "requestHeaders",
  ]
);

util.addListener(browser.webRequest.onHeadersReceived,
  function (details) {
    return generalListener('headersReceived', details);
    // {responseHeaders:details.responseHeaders}
  },
  {
    urls: ["<all_urls>"]
  },
  [
    "blocking",
    "responseHeaders",
  ]
);

util.addListener(browser.webRequest.onAuthRequired,
  function (details) {
    return generalListener('authRequired', details)
    // {cancel:boolean,authCredentials:{username:string,password:string}}
  },
  {
    urls: ["<all_urls>"]
  },
  [
    "blocking",
    "responseHeaders",
  ]
);

util.addListener(browser.webRequest.onResponseStarted,
  function (details) {
    return generalListener('responseStarted', details)
  },
  {
    urls: ["<all_urls>"]
  },
  [
    "responseHeaders",
  ]
);

util.addListener(browser.webRequest.onBeforeRedirect,
  function (details) {
    try {
      return generalListener('beforeRedirect', details)
    } finally {
      end(details, 5 * 60 * 1000);
    }
  },
  {
    urls: ["<all_urls>"]
  },
  [
    "responseHeaders",
  ]
);

util.addListener(browser.webRequest.onCompleted,
  async function (details) {
    try {
      return await generalListener('completed', details)
    } finally {
      end(details);
    }
  },
  {
    urls: ["<all_urls>"]
  },
  [
    "responseHeaders",
  ]
);

util.addListener(browser.webRequest.onErrorOccurred,
  async function (details) {
    try {
      return await generalListener('error', details)
    } finally {
      end(details);
    }
  },
  {
    urls: ["<all_urls>"]
  }
);

util.getSettings([
  'init',
  'rules',
  'global_status',
  'global_test',
  'request_verbose',
  'tab_info_throtte',
], async (results) => {
  if (results.init) {
    util._init_code = results.init;
    delete results.init;
    await util.init();
  }
  for (let key in results) {
    switch (key) {
      case 'rules':
        settings[key] = util.JSON2Rules(results[key] || []);
        break;
      case 'global_test':
        settings[key] = results[key] ? util.JSON2Rules({ [key]: results[key] })[key] : null;
        break;
      default:
        settings[key] = results[key];
        if (key === 'global_status' && 'function' === typeof updateAction) updateAction(0);
        break;
    }
  }
}, true);

self.onerror = (e) => console.error(e);
