var _a;

/*
(_a = browser.browserAction) && _a.onClicked.addListener(() => {
  browser.runtime.openOptionsPage();
});
*/

const tabInfos = new Map();

const bargeInfos = new Map();

let globalSuspend = false;

util.addListener(browser.runtime.onMessage, (message, sender, sendResponse) => {
  let m = message;
  try {
    if (m && 'string' === typeof m.action && m.action.startsWith(util._prefix)) {
      let action = m.action.slice(util._prefix.length);
      switch (action) {
        case 'init':
          util.init(false);
          break;
        case 'getTabOption':
          let info = tabInfos.get(m.value) || {};
          sendResponse({
            status: !info.disabled,
            ruleStat: info.ruleStat ? Array.from(info.ruleStat, kv => kv[1]) : [],
            matchNum: info.matchNum,
          });
          break;
        case 'setStatus':
          let disabled = !m.value.status;
          if (m.value.tabId) {
            let tabId = m.value.tabId;
            let info = getTabInfo(tabId);
            info.disabled = disabled;
            updateAction(tabId, 0);
          } else {
            /*
            globalSuspend = disabled;
            if ((_a = browser.browserAction)) {
              _a.setBadgeText({ text: disabled ? '-' : null });
              _a.setBadgeBackgroundColor({ color: disabled ? 'gray' : null });
              (_a = _a.setBadgeTextColor) && _a({ color: disabled ? 'white' : null });
            }
            */
          }
          sendResponse(m.value);
          break;
      }
    }
  } catch (e) {
    console.warn(e);
  }
});

let isTabSuspend = (details) => {
  if (details.tabId > 0) {
    let info = tabInfos.get(details.tabId);
    if (info && info.disabled) return true;
  }
  return false;
};

((onTabsUpdated) => {
  try {
    util.addListener(browser.tabs.onUpdated, onTabsUpdated, {
      properties: [
        'status',
      ],
    });
  } catch (e) {
    util.addListener(browser.tabs.onUpdated, onTabsUpdated);
  }
})((tabId, changeInfo, tab) => {
  // console.log(changeInfo);
  if (!tabInfos.has(tabId)) return;
  let info = tabInfos.get(tabId);
  // XXX
  if (changeInfo.status === "loading" && info.status === "complete") {
    info.matchNum = 0;
    info.ruleStat = new Map();
    info.status = undefined;
  }
  if (changeInfo.status === "complete") {
    info.status = changeInfo.status;
    updateAction(tabId, 0);
  }
});

util.addListener(browser.tabs.onRemoved, (tabId) => {
  if (!(tabId > 0)) return;
  setTimeout(() => {
    tabInfos.delete(tabId);
    if (bargeInfos.has(tabId)) {
      clearTimeout(bargeInfos.get(tabId));
      bargeInfos.delete(tabId)
    }
  }, 5 * 60 * 1000);
});

let getTabInfo = (tabId) => {
  let info = tabInfos.get(tabId);
  if (undefined === info) {
    info = {
      matchNum: 0,
      ruleStat: new Map(),
      disabled: false,
    };
    tabInfos.set(tabId, info)
  }
  return info;
};

let increaseCount = (tabId, rules, uncountable = false) => {
  let info = getTabInfo(tabId);
  rules.forEach(r => {
    let key = r.id || r.name;
    if (!info.ruleStat.has(key)) {
      let rule = JSON.parse(JSON.stringify(r));
      rule.matchNum = 0;
      info.ruleStat.set(key, rule);
    }
    let rule = info.ruleStat.get(key);
    rule.matchNum++;
  })
  if (uncountable || rules.length == 0) return false;
  info.matchNum++;
  updateAction(tabId);
  return true;
};

let setBrowserAction = (() => {
  let _resetAction = null;
  return (async (options) => {
    let _a = browser.browserAction;
    if (!_a) return;
    try {
      let { tabId, text, disabled } = options;
      if (_resetAction === null) {
        try {
          await _a.setBadgeBackgroundColor({ tabId, color: null });
          _resetAction = true;
        } catch (e) {
          console.warn(e);
          _resetAction = false;
        }
      }
      if (!text || text === '0') text = '';
      if (_resetAction === false) {
        await _a.setBadgeText({ tabId, text });
        return;
      }
      return await Promise.all([
        _a.setBadgeText({ tabId, text: text || (disabled ? '-' : null) }),
        _a.setBadgeBackgroundColor({ tabId, color: disabled ? 'gray' : null }),
        _a.setBadgeTextColor && _a.setBadgeTextColor({ tabId, color: disabled ? 'white' : null }),
      ]);
    } catch (e) {
      console.warn(e);
    }
  });
})();

let updateAction = (tabId, delay = null) => {
  if (!tabId) {
    const disabled = !settings.global_status;
    setBrowserAction({
      disabled,
    });
    return;
  }
  if (delay === null) delay = settings.tab_info_throttle || 500;
  if (delay === 0) bargeInfos.delete(tabId);
  else if (bargeInfos.has(tabId)) return;
  bargeInfos.set(tabId, setTimeout(async () => {
    bargeInfos.delete(tabId);
    const info = tabInfos.get(tabId);
    if (info === undefined) return;
    const v = info.matchNum;
    const disabled = info.disabled;
    await setBrowserAction({
      tabId,
      text: `${v >= 1e5 ? Number(v).toExponential(0).replace(/\+/g, '') : (v >= 1e4 ? Math.floor(v / 1000) + 'k' : (v >= 1e3 ? `${Math.floor(v / 100)}`.replace(/(?:0|(\d))$/, 'k$1') : v))}`.toUpperCase(),
      disabled,
    });
  }, delay));
};


util.addListener(browser.commands.onCommand, async (command) => {
  try {
    switch (command) {
      case 'toggle-tab-status':
        await toggleTabStatus();
        break;
      case 'toggle-global-status':
        await util.setSettings({ global_status: !settings.global_status });
        break;
      case 'open-options':
        await browser.runtime.openOptionsPage();
        break;
    }
  } catch (e) {
    console.error('Command error:', command, e);
  }
});

async function toggleTabStatus() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tabs[0]) return;

  const tabId = tabs[0].id;
  const info = getTabInfo(tabId);
  info.disabled = !info.disabled;
  updateAction(tabId, 0);
}
