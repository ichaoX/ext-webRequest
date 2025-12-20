const util = {
    JSON2Rules(json, verify = false) {
        if (Array.isArray(json)) return json.map(r => this.JSON2Rules(r, verify));
        return JSON.parse(JSON.stringify(json), (k, v) => {
            if (v && "object" == typeof v) {
                let exp = v.exp || v.function;
                if (!!exp) {
                    let sourceURL = null;
                    exp = this.normalFuncExp(exp, k);
                    if (verify) {
                        let r = this.validExp(exp, "function");
                        if (r !== true) throw r;
                    } else {
                        sourceURL = `${location.origin}/.webrequest-rules/${encodeURIComponent(json.group || '-')}/${encodeURIComponent(json.name || json.id || '0')}/${k}.js?v=${this.hash(exp)}`;
                    }
                    return this.exec(exp, sourceURL);
                } else if ('exp' in v) return undefined;
            }
            return v;
        })
    },
    rules2JSON(rules) {
        return JSON.parse(JSON.stringify(rules, function (k, v) {
            // console.log(v);
            if ("function" == typeof v) {
                return {
                    exp: "" + v
                };
            }
            if ("" === v || null === v) {
                return undefined;
            }
            return v;
        }))
    },
    getHint(type, r) {
        let config;
        if ('undefined' === typeof configs || !(config = configs[type]) || (!config.hint && !config.inherit)) return null;
        if (config.hint) {
            switch (r) {
                case 'param': {
                    // return config.hint.match(/(?<=^@param[ \t]+)([^\s]+)/mg);
                    let regex = /^@param[ \t]+([^\s]+)/mg;
                    let match, params = [];
                    while ((match = regex.exec(config.hint)) !== null) {
                        params.push(match[1]);
                    }
                    return params;
                }
                case 'hint': {
                    return config.hint.replace(
                        /^(@(?:param|return).*?)\{([\w\|]+)\}|^(@this[ \t]+)(\w+)/mg,
                        (match, prefix, types, tprefix, ttype) => {
                            types = (types || ttype)
                                .split("|")
                                .map((type) => {
                                    if (_constant.types[type]) {
                                        let info = _constant.types[type];
                                        type = info.hint || info.type;
                                    }
                                    return type;
                                })
                                .join("|");
                            return `${prefix || tprefix}${types}`;
                        }
                    );
                }
                case 'dts': {
                    let regex = /^@param[ \t]+([^\s]+)[ \t]+\{([\w\|]+)\}|^@this[ \t]+([^\s]+)/mg;
                    let match, text = "";
                    while ((match = regex.exec(config.hint)) !== null) {
                        if (match[3]) {
                            let name = match[3];
                            let info = _constant.types[name];
                            if (info) {
                                text += (info.dts || `declare let ${name}: ${info.type};`).trim();
                                text += "\n";
                            }
                            continue;
                        }
                        let name = match[1];
                        let types = match[2].split("|")
                            .map((type) => {
                                if (_constant.types[type]) {
                                    let info = _constant.types[type];
                                    if (info.dts) {
                                        text += `${info.dts.trim()}\n`;
                                    }
                                    type = info.type;
                                }
                                return type;
                            })
                            .join("|");
                        text += `declare let ${name}: ${types};\n`
                    }
                    return text;
                }
                case 'jsdoc': {
                    let regex = /^(@param|@return)[ \t]+(?:([^\{\s]+)[ \t]+)?\{([\w\|]+)\}(.*$)|^(@this[ \t].*$)/mg;
                    let match, text = "";
                    while ((match = regex.exec(config.hint)) !== null) {
                        if (match[5]) {
                            text += ` * ${match[5]}\n`;
                            continue;
                        }
                        let tag = match[1];
                        let name = match[2];
                        let types = match[3].split("|")
                            .map((type) => {
                                if (_constant.types[type]) {
                                    let info = _constant.types[type];
                                    type = info.type;
                                }
                                return type;
                            })
                            .join("|");
                        text += ` * ${tag} {${types}}${name ? ` ${name}` : ''}${match[4]}\n`
                    }
                    if (text) text = `/**\n${text} */`;
                    return text;
                }
            }
            return config.hint;
        }
        return this.getHint(config.inherit, r);
    },
    getParams(type) {
        return this.getHint(type, 'param') || []
    },
    isFuncExp(exp, trimDoc = true) {
        // XXX
        let rmDoc = (js) => {
            let code = js.replace(/^\s*(\/\*[\s\S]*?\*\/|\/\/.*)/, ' ');
            if (code != js) return rmDoc(code);
            return js;
        }
        if (exp && trimDoc) exp = rmDoc(exp);
        return /^(\(\s*)*(new\s+Function\s*\(|async\b|function\b|([\w$_]+|\([^)]*?\))\s*=>)/.test((exp || '').trim());
    },
    normalFuncExp(exp, type, wrapMode = false) {
        if (!exp) return exp;
        exp = exp.trim().replace(/^\/\/# REMOVABLE\n/, '');
        if (!exp) return exp;
        let jsdoc = (wrapMode && this.getHint(type, 'jsdoc')) || '';
        if (this.isFuncExp(exp)) {
            let match;
            if (wrapMode && jsdoc && (match = exp.match(/^(?:\(\s*)*(?:async\b[^()]*|function\b[^()]*)?\(([^()]*)\)/))) {
                let args = [];
                if (match[1].trim()) args = match[1].split(",").map(e => e.replace(/=.*$/g, '').trim());
                let params = this.getParams(type);
                args = args.slice(0, params.length);
                if (args.every((e, i) => e === params[i])) return `${jsdoc}\n${exp}`;
            }
            return exp;
        }
        let args = this.getParams(type);
        if (wrapMode) {
            if (jsdoc) jsdoc += "\n"
            return `${jsdoc}function f(${args.join(', ')}) {\n\n${exp}\n\n}`;
        }
        return `(function (${args.join(', ')}) { ${exp}\n})`;
    },
    regExpQuote(str) {
        let chars = '.\\+*?[^]$(){}=!<>|:-#';
        return str.replace(new RegExp(`([${chars.replace(/(.)/g, '\\$1')}])`, 'g'), '\\$1');
    },
    getInitExp() {
        let exp = this._init_code && this._init_code.exp;
        exp = this.normalFuncExp(exp, 'init', true);
        if (!exp) return;
        // FIXME
        let rmDoc = (js) => {
            let code = js.replace(/(\/\*[\s\S]*?\*\/|\/\/.*)/, ' ');
            if (code != js) return rmDoc(code);
            return js;
        }
        let vars = [];
        try {
            let rawCode = rmDoc(exp);
            vars = [...new Set([...rawCode.matchAll(/\b((?:self|window|globalThis)\s*\.\s*([A-Za-z_$][\w$]*))\s*=[^=]/g)].map(e => e[2]))];
        } catch (e) {
            console.warn(e);
        }
        if (vars.length === 0) return;
        let uname = (n) => `_self_${n}`;
        exp = exp.replace(new RegExp(`\\b(?:self|window|globalThis)\\s*\\.\\s*(${vars.map(this.regExpQuote).join('|')})\\b`, 'g'), (m, n) => uname(n));
        return `
var [${vars.join(', ')}] = (() => {
    let ${vars.map(uname).join(', ')};
    (
${exp}
    )();
    return [${vars.map(uname).join(', ')}];
})();
`.trim();
    },
    _storageArea: 'local',
    _prefix: '',
    _defaultConfig: {
        global_status: true,
        global_test: {
            exp: ''
        },
        tab_info_throttle: 500,
        popup_auto_close: true,
        exp_verify_syntax: true,
        search_parse_js_object: false,
        request_verbose: 0,
        theme_mode: 'auto',
        init: {
            exp: ''
        },
        template: {},
        rules: [],
        code_editor: false,
        code_editor_init: '',
        code_editor_idle_timeout: 10,
        options_group_rules: false,
    },
    async setSettings(settings, callback) {
        if (!settings || 'object' !== typeof settings) return;
        settings = JSON.parse(JSON.stringify(settings));
        let o = Object.keys(settings).reduce((a, b) => (a[this._prefix + b] = settings[b], a), {});
        await browser.storage[this._storageArea].set(o);
        if (callback) callback(settings);
    },
    getSettings(keys, callback, onChanged) {
        if (!callback) return this.promisify((resolve) => this.getSettings(keys, resolve, onChanged));
        if (!self.browser) return callback(this._defaultConfig);
        if (!keys) keys = Object.keys(this._defaultConfig);
        let storageArea = this._storageArea;
        let prefixLength = this._prefix.length;
        let o = keys.reduce((a, b) => (a[this._prefix + b] = this._defaultConfig[b], a), {});
        browser.storage[storageArea].get(o).then((results) => {
            if (callback) {
                if (prefixLength > 0) results = Object.keys(results).reduce((a, b) => (a[b.slice(prefixLength)] = results[b], a), {});
                callback(results);
            }
        }, (error) => {
            console.error(error)
        });
        if (onChanged === true) onChanged = callback;
        if (!onChanged) return;
        let listener = (changes, area) => {
            if (area && area !== storageArea) return;
            let results;
            for (let key in changes) {
                if (!key.startsWith(this._prefix)) continue;
                let nkey = key.slice(prefixLength);
                if (!keys.includes(nkey)) continue;
                if (!results) results = {};
                results[nkey] = changes[key].newValue;
                if (results[nkey] === undefined) results[nkey] = this._defaultConfig[nkey];
            }
            if (results) onChanged(results);
        };
        return this.addListener(browser.storage[storageArea].onChanged || browser.storage.onChanged, listener);
    },
    promisify(func) {
        return new Promise(async (resolve, reject) => {
            try {
                await func(resolve, reject);
            } catch (e) {
                reject(e);
            }
        });
    },
    async sendMessage(action, data = null) {
        return await browser.runtime.sendMessage({ action: this._prefix + action, value: data });
    },
    addListener(event, listener, ...extra) {
        if (!event) {
            console.trace('Event does not exist!');
            return;
        }
        event.addListener(listener, ...extra);
        let destroy = () => {
            if (event.hasListener(listener)) {
                event.removeListener(listener);
            }
        };
        this.destroy(destroy);
        return {
            destroy,
        };
    },
    _context: 'global',
    _contexts: {},
    context(context) {
        if (context !== undefined) {
            let _context = this._context;
            this._context = context;
            return _context;
        } else {
            if (!this._contexts[this._context]) this._contexts[this._context] = {};
            return this._contexts[this._context];
        }
    },
    destroy(callback = null) {
        let context = this.context();
        if (!context.destroyList) context.destroyList = [];
        if (callback) {
            context.destroyList.push(callback);
        } else {
            while (callback = context.destroyList.pop()) {
                try {
                    callback();
                } catch (e) {
                    console.warn(e);
                }
            }
        }
        return this;
    },
    exec(exp, sourceURL = null) {
        let functionBody = `return (\n${exp}\n);`;
        if (sourceURL) functionBody = `//# sourceURL=${sourceURL}\n${functionBody}`;
        return (new Function(functionBody))();
    },
    validExp(exp, type) {
        if (!exp) return true;
        try {
            let result = this.exec(exp);
            if (type && type !== typeof result) throw `expression should be a ${type}`;
            return true;
        } catch (e) {
            // console.error(e);
            // TODO
            return e instanceof Error ? (e.lineNumber === undefined ? e.message : `${e.lineNumber - 3}: ${e.message}`) : '' + e;
        }
    },
    insertText(event, text) {
        event.preventDefault();
        if ('undefined' === typeof event.target.value) return;
        if (!document.queryCommandSupported('insertText') ||
            !document.execCommand('insertText', false, text)
        ) {
            let val = event.target.value,
                originalSelectionStart = event.target.selectionStart,
                textStart = val.slice(0, originalSelectionStart),
                textEnd = val.slice(originalSelectionStart);
            event.target.value = `${textStart}${text}${textEnd}`
            event.target.selectionEnd = event.target.selectionStart = originalSelectionStart + text.length
        }
    },
    hash(data) {
        // XXX
        return `${data || ''}`.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0).toString(36);
    },
    _initialized: false,
    _init_code: null,
    async init(once = true) {
        if (once && this._initialized) return false;
        this._initialized = true;
        if (!this._init_code) return;
        try {
            let key = 'init';
            let init = this.JSON2Rules({
                [key]: this._init_code
            })[key];
            if (!init) return;
            return await init(
                util,
                "undefined" !== typeof shareData ? shareData : undefined,
                "undefined" !== typeof settings ? settings : undefined,
            );
        } catch (e) {
            console.error(e);
        }
    },
    theme: {
        onThemeChange: null,
        _state: {
            mode: 'auto',
            resolved: 'light',
            mediaQuery: null,
            listener: null,
        },
        _resolve(mode) {
            if (mode === 'light' || mode === 'dark') {
                return mode;
            }
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            return prefersDark ? 'dark' : 'light';
        },
        _apply(theme) {
            const resolvedTheme = theme === 'dark' ? 'dark' : 'light';
            this._state.resolved = resolvedTheme;
            return resolvedTheme;
        },
        _setupAutoListener() {
            const mediaQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
            if (!mediaQuery) return;

            if (this._state.mediaQuery && this._state.listener) {
                this._state.mediaQuery.removeEventListener('change', this._state.listener);
            }

            const listener = event => {
                if (this._state.mode !== 'auto') return;
                const newTheme = this._apply(event.matches ? 'dark' : 'light');
                if (typeof this.onThemeChange === 'function') {
                    this.onThemeChange(newTheme);
                }
            };

            mediaQuery.addEventListener('change', listener);
            this._state.mediaQuery = mediaQuery;
            this._state.listener = listener;
        },
        init(mode = 'auto') {
            this._state.mode = mode;
            const resolvedTheme = this._resolve(mode);
            this._apply(resolvedTheme);

            this._setupAutoListener();

            if (typeof this.onThemeChange === 'function') {
                this.onThemeChange(resolvedTheme);
            }
        },
    },
};