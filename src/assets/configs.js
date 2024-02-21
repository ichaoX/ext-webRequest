if (self.Vue && self.Vue.config) {
    Vue.config.devtools = !!self.__VUE_DEVTOOLS_GLOBAL_HOOK__;
    Vue.config.productionTip = false;
}

const _constant = {
    headers: [
        'accept',
        'accept-ch',
        'accept-charset',
        'accept-encoding',
        'accept-language',
        'accept-patch',
        'accept-post',
        'accept-ranges',
        'access-control-allow-credentials',
        'access-control-allow-headers',
        'access-control-allow-methods',
        'access-control-allow-origin',
        'access-control-expose-headers',
        'access-control-max-age',
        'access-control-request-headers',
        'access-control-request-method',
        'age',
        'allow',
        'alt-svc',
        'authorization',
        'cache-control',
        'clear-site-data',
        'connection',
        'content-disposition',
        'content-encoding',
        'content-language',
        'content-length',
        'content-location',
        'content-range',
        'content-security-policy',
        'content-security-policy-report-only',
        'content-type',
        'cookie',
        'critical-ch',
        'experimental',
        'cross-origin-embedder-policy',
        'cross-origin-opener-policy',
        'cross-origin-resource-policy',
        'date',
        'device-memory',
        'experimental',
        'downlink',
        'experimental',
        'early-data',
        'experimental',
        'ect',
        'experimental',
        'etag',
        'expect',
        'expect-ct',
        'expires',
        'forwarded',
        'from',
        'host',
        'if-match',
        'if-modified-since',
        'if-none-match',
        'if-range',
        'if-unmodified-since',
        'keep-alive',
        'last-modified',
        'link',
        'location',
        'max-forwards',
        'nel',
        'experimental',
        'origin',
        'permissions-policy',
        'proxy-authenticate',
        'proxy-authorization',
        'range',
        'referer',
        'referrer-policy',
        'retry-after',
        'rtt',
        'experimental',
        'save-data',
        'experimental',
        'sec-ch-prefers-reduced-motion',
        'experimental',
        'sec-ch-ua',
        'experimental',
        'sec-ch-ua-arch',
        'experimental',
        'sec-ch-ua-bitness',
        'experimental',
        'sec-ch-ua-full-version-list',
        'experimental',
        'sec-ch-ua-mobile',
        'experimental',
        'sec-ch-ua-model',
        'experimental',
        'sec-ch-ua-platform',
        'experimental',
        'sec-ch-ua-platform-version',
        'experimental',
        'sec-fetch-dest',
        'sec-fetch-mode',
        'sec-fetch-site',
        'sec-fetch-user',
        'sec-gpc',
        'experimental',
        'sec-purpose',
        'sec-websocket-accept',
        'server',
        'server-timing',
        'service-worker-navigation-preload',
        'set-cookie',
        'sourcemap',
        'strict-transport-security',
        'te',
        'timing-allow-origin',
        'trailer',
        'transfer-encoding',
        'upgrade',
        'upgrade-insecure-requests',
        'user-agent',
        'vary',
        'via',
        'www-authenticate',
        'x-content-type-options',
        'x-dns-prefetch-control',
        'x-forwarded-for',
        'x-forwarded-host',
        'x-forwarded-proto',
        'x-frame-options',
        'x-xss-protection',
    ],
    code_editor_init_func: async (params) => {
        if (params.init) {
            await (async (r) => {
                if (typeof r === 'function') {
                    return await r();
                } else {
                    return r;
                }
            })(eval(params.init));
        }
    },
    types: {
        _context: {
            hint: "{index:number,rule:Record<string,any>,matchStatus?:null|boolean,setMatchStatus(v?:null|boolean)}",
            type: "_context",
            dts: `type _context = {index?:number,rule?:Record<string,any>,matchStatus?:null|boolean,setMatchStatus(v?:null|boolean):boolean};`,
        },
        _share: {
            hint: "{before?:Record<string,any>,contexts?:any[],filter?:StreamFilter,countable:boolean}&Record<string, any>",
            type: "_share",
            dts: "type _share = {before?:_share,contexts?:any[],filter?:browser.webRequest.StreamFilter,countable:boolean}&Record<string, any>;",
        },
        util: {
            type: "Record<string, any>",
        },
        shareData: {
            type: "Map<string,Record<string,any>>",
        },
        settings: {
            type: "Record<string, any>",
        },
        onBeforeRequestDetails: {
            hint: "{documentUrl:string, incognito:boolean, method:string, originUrl:string, proxyInfo?:object, requestBody:{error?:string, formData?:{} ,raw?:{bytes?:any, file?:string}[]}, type:string, timeStamp:number, url:string, ...}",
            type: "browser.webRequest._OnBeforeRequestDetails",
        },
        onBeforeRequestBlockingResponse: {
            hint: "{cancel?:boolean, redirectUrl?:string, upgradeToSecure?:boolean}",
            type: "browser.webRequest.BlockingResponse | Promise<browser.webRequest.BlockingResponse>",
        },
        onBeforeSendHeadersDetails: {
            hint: "{documentUrl:string, incognito:boolean, method:string, originUrl:string, proxyInfo?:object, requestHeaders:{name:string, value?:string, binaryValue?:integer[]}[], type:string, timeStamp:number, url:string, ...}",
            type: "browser.webRequest._OnBeforeSendHeadersDetails",
        },
        onBeforeSendHeadersBlockingResponse: {
            hint: "{cancel?:boolean, requestHeaders?: {name:string, value?:string, binaryValue?:integer[]}[]}",
            type: "browser.webRequest.BlockingResponse | Promise<browser.webRequest.BlockingResponse>",
        },
        onSendHeadersDetails: {
            hint: "{documentUrl:string, incognito:boolean, method:string, originUrl:string, proxyInfo?:object, requestHeaders:{name:string, value?:string, binaryValue?:integer[]}[], type:string, timeStamp:number, url:string, ...}",
            type: "browser.webRequest._OnSendHeadersDetails",
        },
        onHeadersReceivedDetails: {
            hint: "{documentUrl:string, fromCache:boolean, incognito:boolean, ip:string, method:string, originUrl:string, proxyInfo?:object, responseHeaders:{name:string, value?:string, binaryValue?:integer[]}[], statusCode:integer, statusLine:string, type:string, timeStamp:number, url:string, ...}",
            type: "browser.webRequest._OnHeadersReceivedDetails",
        },
        onHeadersReceivedBlockingResponse: {
            hint: "{cancel?:boolean, redirectUrl?:string, responseHeaders?:{name:string, value?:string, binaryValue?:integer[]}[]}",
            type: "browser.webRequest.BlockingResponse | Promise<browser.webRequest.BlockingResponse>",
        },
        onAuthRequiredDetails: {
            hint: "{challenger:object, incognito:boolean, isProxy:boolean, method:string, proxyInfo?:object, realm:string, responseHeaders:{name:string, value?:string, binaryValue?:integer[]}[], scheme:string, statusCode:integer, statusLine:string, type:string, timeStamp:number, url:string, ...}",
            type: "browser.webRequest._OnAuthRequiredDetails",
        },
        onAuthRequiredBlockingResponse: {
            hint: "{cancel?:boolean, authCredentials?:{username:string, password:string}}",
            type: "browser.webRequest.BlockingResponse | Promise<browser.webRequest.BlockingResponse>",
        },
        onBeforeRedirectDetails: {
            hint: "{documentUrl:string, fromCache:boolean, incognito:boolean, ip:string, method:string, originUrl:string, proxyInfo?:object, redirectUrl:string, responseHeaders:{name:string, value?:string, binaryValue?:integer[]}[], statusCode:integer, statusLine:string, type:string, timeStamp:number, url:string, ...}",
            type: "browser.webRequest._OnBeforeRedirectDetails",
        },
        onResponseStartedDetails: {
            hint: "{documentUrl:string, fromCache:boolean, incognito:boolean, ip:string, method:string, originUrl:string, proxyInfo?:object, responseHeaders:{name:string, value?:string, binaryValue?:integer[]}[], statusCode:integer, statusLine:string, type:string, timeStamp:number, url:string, ...}",
            type: "browser.webRequest._OnResponseStartedDetails",
        },
        onCompletedDetails: {
            hint: "{documentUrl:string, fromCache:boolean, incognito:boolean, ip:string, method:string, originUrl:string, proxyInfo?:object, responseHeaders:{name:string, value?:string, binaryValue?:integer[]}[], statusCode:integer, statusLine:string, type:string, timeStamp:number, url:string, ...}",
            type: "browser.webRequest._OnCompletedDetails",
        },
        onErrorOccurredDetails: {
            hint: "{documentUrl:string, error:string, fromCache:boolean, incognito:boolean, ip:string, method:string, originUrl:string, proxyInfo?:object, type:string, timeStamp:number, url:string, ...}",
            type: "browser.webRequest._OnErrorOccurredDetails",
        },
        filterResponseEvent: {
            hint: '{type:"start"|"data"|"stop"|"error", data?:Uint8Array, ...}',
            type: "browser.webRequest._StreamFilterOndataEvent|Event",
        },
        streamFilter: {
            hint: "StreamFilter{close(), disconnect(), resume(), suspend(), write(data:Uint8Array|ArrayBuffer), status:string, ...}",
            type: "browser.webRequest.StreamFilter",
        },
    },
};

const configs = {
    init: {
        link: 'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API',
        special: true,
        hint: `
@param util {util}
@param shareData {shareData|undefined}
@param settings {settings|undefined}
`,
        tpl: [{
            name: 'Global Tools',
            exp: `
self.WR = {
	/**
	 * @param {URL|string} url
	 * @param {string|RegExp|(string|RegExp)[]} domain
	 * @return {boolean}
	 */
	isDomain: (url, domain) => {
		let hostname = url instanceof URL ? url.hostname : (url.includes('/') ? (new URL(url)).hostname : url.toLowerCase());
		if (!Array.isArray(domain)) domain = [domain];
		for (let pattern of domain) {
			if (pattern instanceof RegExp ? pattern.test(hostname) : (
				pattern[0] === "." ? hostname.endsWith(pattern) : (hostname === pattern || hostname.endsWith('.' + pattern))
			)) return true;
		}
		return false;
	},
	/**
	 * @param {string} url
	 * @param {browser.cookies._GetAllDetails} options
	 * @return {Promise<string>}
	 */
	getCookie: async (url, options = {}) => {
		options[/^[^/]+:\\/\\//i.test(url) ? 'url' : 'domain'] = url;
		return (await browser.cookies.getAll(options)).
			filter(n => n.session || n.expirationDate * 1000 > Date.now()).
			reduce((a, b) => a + b.name + '=' + b.value + ';', '');
	},
};
`,
    }, {
            name: 'Legacy Text Encoding',
            exp: `
if (self._legacyTextEncoder && !self._nativeTextEncoder) {
	const nativeTextEncoder = self.TextEncoder;
	self._nativeTextEncoder = nativeTextEncoder;
	const TextEncoder = function (...args) {
		if (!(this instanceof TextEncoder))
			throw TypeError("TextEncoder constructor: 'new' is required");
		if (args.length === 1 && 'string' === typeof args[0] && !/^utf-?8$/i.test(args[0])) {
			// https://github.com/inexorabletash/text-encoding
			return new self._legacyTextEncoder(args[0], { NONSTANDARD_allowLegacyEncoding: true });
		} else {
			return new nativeTextEncoder(...args);
		}
	};
	try {
		if (nativeTextEncoder.prototype !== Object.prototype) {
			TextEncoder.prototype = nativeTextEncoder.prototype;
			if (Object.getPrototypeOf(self._legacyTextEncoder.prototype) === Object.prototype) {
				Object.setPrototypeOf(self._legacyTextEncoder.prototype, nativeTextEncoder.prototype);
			}
		}
	} catch (e) {
		console.warn(e);
	}
	self.TextEncoder = TextEncoder;
}
`,
        }],
    },
    code_editor_init: {
        link: 'https://microsoft.github.io/monaco-editor/docs.html',
        name: 'After Code Editor ready',
        hint: `
Running in editor context
This feature requires ACCESS_LEVEL >= 20 (partial).

@name editorUtil
@type {EditorUtil}

@name monaco
@namespace
`,
        special: true,
        tpl: [{
                name: 'Update Editor Options',
                exp: `
editorUtil.updateOptions({
	fontSize: '15px',
	quickSuggestions: true,
	wordWrap: "off",
	scrollBeyondLastLine: false,
	minimap: {
		enabled: self.innerWidth > 500,
	},
});

if ('function' === typeof editorUtil.setEditorType) {
	editorUtil.addActions({
		"user.toggleDiffEditor": {
			label: "Toggle Diff Editor",
			contextMenuGroupId: "view",
			contextMenuOrder: 5.5,
			run() {
				let type = editorUtil.getEditorType() === 'CodeEditor' ? 'DiffEditor' : 'CodeEditor';
				editorUtil.setEditorType(type);
			},
		},
	});
}
`,
            },
        ],
    },
    global_test: {
        name: 'Global Request Matching',
        special: true,
        required: false,
        inherit: 'test',
        hint: `
@param details {onBeforeRequestDetails}
@param share {_share}
@return {boolean}
`,
        get tpl() {
            return configs.test.tpl.filter(i => i.inheritable !== false);
        },
    },
    test: {
        name: 'Match Request',
        required: true,
        link: 'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeRequest',
        hint: `
@this _context
@param details {onBeforeRequestDetails}
@param share {_share}
@return {boolean}
`,
        tpl: [{
                name: 'Domain',
                exp: `
let hostname = "example.com";
return hostname === (new URL(details.url)).hostname;
`,
            },
            {
                name: 'URL',
                exp: `
let url = 'http://example.com/';
return url === details.url;
`,
            },
            {
                name: 'Prefix',
                exp: `
let prefix = 'http://example.com/';
return details.url.startsWith(prefix);
`,
            },
            {
                name: 'RegExp',
                exp: `
let regex = /^https?:\\/\\/([^\\/]+\\.)?example\\.com\\//i;
return regex.test(details.url);
`,
            },
            {
                name: 'Main Frame',
                exp: `
let types = ['main_frame'];
return types.includes(details.type);
`,
            },
            {
                name: 'All',
                exp: `
return true;
`,
            },
            {
                name: 'Exclude this extension',
                exp: `
return details.type === 'main_frame' || !(details.originUrl || '').startsWith(browser.runtime.getURL(''));
`,
            },
            {
                inheritable: false,
                name: 'Delayed Set Match Status',
                exp: `
this.setMatchStatus(null);
return true;
`,
            },
            {
                name: 'Other',
                exp: `
async function f(details, share) {

return false;

}
`,
            },
        ],
    },
    beforeRequest: {
        link: 'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeRequest',
        hint: `
@this _context
@param details {onBeforeRequestDetails}
@param share {_share}
@return {onBeforeRequestBlockingResponse|void}
`,
        tpl: [{
                name: 'Cancel',
                exp: `
return { cancel: true };
`,
            },
            {
                name: 'Redirect',
                exp: `
return { redirectUrl: 'https://www.example.com' };
`,
            },
            {
                name: 'Upgrade To Secure',
                exp: `
return { upgradeToSecure: true };
`,
            },
            {
                name: 'Save Request Body',
                exp: `
share.url = details.url;
share.method = details.method;
share.requestBody = details.requestBody;
`,
            },
            {
                name: 'Other',
                exp: `
async function f(details, share) {

}
`,
            },
        ],
    },
    beforeSendHeaders: {
        link: 'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeSendHeaders',
        hint: `
@this _context
@param details {onBeforeSendHeadersDetails}
@param share {_share}
@return {onBeforeSendHeadersBlockingResponse|void}
`,
        tpl: [{
                name: 'Modify Request Header',
                exp: `
let headersInit = {
	"x-forwarded-for": "127.0.0.1",
	"user-agent": "Mozilla/5.0",
};
let headers = Object.entries(headersInit).map(o => ({ name: o[0], value: o[1] }));
for (let header of details.requestHeaders) {
	let name = header.name.toLowerCase();
	if (name in headersInit) continue;
	headers.push(header);
}
return { requestHeaders: headers };
`,
            },
            {
                name: 'Cancel',
                exp: `
return { cancel: true };
`,
            },
            {
                name: 'Save Request Header',
                exp: `
share.url = details.url;
share.method = details.method;
share.requestHeaders = details.requestHeaders;
`,
            },
            {
                name: 'Set Match Status',
                exp: `
let desiredHeaders = {
	"referer": "example.com",
	"range": "",
};
for (let header of details.requestHeaders) {
	let name = header.name.toLowerCase();
	if (name in desiredHeaders && header.value.toLowerCase().includes(desiredHeaders[name])) {
		this.setMatchStatus(true);
		return;
	}
}
this.setMatchStatus(false);
`,
            },
            {
                name: 'Other',
                exp: `
async function f(details, share) {

}
`,
            },
        ],
    },
    sendHeaders: {
        link: 'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onSendHeaders',
        hint: `
@this _context
@param details {onSendHeadersDetails}
@param share {_share}
@return {void}
`,
        tpl: [{
                name: 'Save Request Header',
                exp: `
share.url = details.url;
share.method = details.method;
share.requestHeaders = details.requestHeaders;
`,
            },
            {
                name: 'Other',
                exp: `
function f(details, share) {

}
`,
            },
        ],
    },
    headersReceived: {
        link: 'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onHeadersReceived',
        hint: `
@this _context
@param details {onHeadersReceivedDetails}
@param share {_share}
@return {onHeadersReceivedBlockingResponse|void}
`,
        tpl: [{
                name: 'Modify Response Header',
                exp: `
let headersInit = {
	"access-control-allow-origin": "*",
	"access-control-allow-headers": "Content-Type, Range, X-Requested-With",
};
let headers = Object.entries(headersInit).map(o => ({ name: o[0], value: o[1] }));
for (let header of details.responseHeaders) {
	let name = header.name.toLowerCase();
	if (name in headersInit) continue;
	if (/^content-security-policy/.test(name)) header.name = 'x-' + header.name;
	headers.push(header);
}
return { responseHeaders: headers };
`,
            },
            {
                name: 'Cancel',
                exp: `
return { cancel: true };
`,
            },
            {
                name: 'Redirect',
                exp: `
return { redirectUrl: 'https://www.example.com' };
`,
            },
            {
                name: 'Save Response Header',
                exp: `
share.statusCode = details.statusCode;
share.statusLine = details.statusLine;
share.responseHeaders = details.responseHeaders;
`,
            },
            {
                name: 'Set Match Status',
                exp: `
let isMatched = details.statusCode == 304;
this.setMatchStatus(isMatched);
`,
            },
            {
                name: 'Other',
                exp: `
async function f(details, share) {

}
`,
            },
        ],
    },
    authRequired: {
        link: 'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onAuthRequired',
        hint: `
@this _context
@param details {onAuthRequiredDetails}
@param share {_share}
@return {onAuthRequiredBlockingResponse|void}
`,
        tpl: [{
                name: 'Cancel',
                exp: `
return { cancel: true };
`,
            },
            {
                name: 'Add Credentials',
                exp: `
let authInfo = {
	username: '',
	password: '',
};
return { authCredentials: authInfo };
`,
            },
            {
                name: 'Save Response Header',
                exp: `
share.statusCode = details.statusCode;
share.statusLine = details.statusLine;
share.responseHeaders = details.responseHeaders;
`,
            },
            {
                name: 'Other',
                exp: `
async function f(details, share) {

}
`,
            },
        ],
    },
    beforeRedirect: {
        link: 'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeRedirect',
        hint: `
@this _context
@param details {onBeforeRedirectDetails}
@param share {_share}
@return {void}
`,
        tpl: [{
                name: 'Save Response Header',
                exp: `
share.statusCode = details.statusCode;
share.statusLine = details.statusLine;
share.redirectUrl = details.redirectUrl;
share.responseHeaders = details.responseHeaders;
`,
            },
            {
                name: 'Other',
                exp: `
function f(details, share) {

}
`,
            },
        ]
    },
    responseStarted: {
        link: 'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onResponseStarted',
        hint: `
@this _context
@param details {onResponseStartedDetails}
@param share {_share}
@return {void}
`,
        tpl: [{
                name: 'Save Response Header',
                exp: `
share.statusCode = details.statusCode;
share.statusLine = details.statusLine;
share.responseHeaders = details.responseHeaders;
`,
            },
            {
                name: 'Other',
                exp: `
function f(details, share) {

}
`,
            },
        ],
    },
    completed: {
        link: 'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onCompleted',
        hint: `
@this _context
@param details {onCompletedDetails}
@param share {_share}
@return {void}
`,
    },
    error: {
        link: 'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onErrorOccurred',
        hint: `
@this _context
@param details {onErrorOccurredDetails}
@param share {_share}
@return {void}
`,
    },
    filterResponse: {
        link: 'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/StreamFilter',
        hint: `
@this _context
@param event {filterResponseEvent}
@param share {_share}
@param filter {streamFilter}
@param details {onBeforeRequestDetails}
@return {Uint8Array|ArrayBuffer|false|null}
`,
        tpl: [{
                name: 'Specify Response Body',
                exp: `
if ('error' === event.type) return console.warn('filter_error', filter.error, details.url);
if ('start' !== event.type) return false;
let text = 'example';
let encoder = new TextEncoder();
filter.write(encoder.encode(text));
filter.close();
`,
            },
            {
                name: 'Modify Response Body',
                exp: `
if ('error' === event.type) return console.warn('filter_error', filter.error, details.url);
if (!share.data) share.data = [];
if ('data' === event.type) {
	share.data.push(event.data);
	return false;
}
if ('stop' !== event.type) return;
if (!this.decoder) this.decoder = new TextDecoder('utf-8');
if (!this.encoder) this.encoder = new TextEncoder();
let decoder = this.decoder;
let encoder = this.encoder;
let text = share.data.reduce((s, buffer) => s + decoder.decode(buffer, { stream: true }), '') + decoder.decode();
console.log(text);
text = text.replace(/Example/g, 'WebRequest $&');
return encoder.encode(text);
`,
            },
            {
                name: 'Nothing',
                exp: `
filter.disconnect();
`,
            },
            {
                name: 'Other',
                exp: `
async function f(event, share, filter, details) {

if ('error' === event.type) return console.warn('filter_error', filter.error, details.url);
if (!share.data) share.data = [];
if ('data' === event.type) {
	let data = event.data;
	share.data.push(data);
	return data;
}
if ('stop' === event.type) {
	console.log(share.data);
}

}
`,
            },
        ],
    },
};
