# Notes

* This document uses `Stage > Template Name` to indicate the default template to be selected in this stage.
* The **bold** parts in the code blocks are the sections that need to be modified.
* Due to iterative reasons, the default templates here may slightly differ from the actual templates.

# Basic

## Modify Request Headers

This rule will add `x-req-a` and `x-req-b` to `https://httpbin.org/get`, modify the `user-agent`, and remove the `accept-language` request header.

1. Match Request > URL Prefix

<pre>
<code>let prefix = <b>'https://httpbin.org/get'</b>;
return details.url.startsWith(prefix);
</code></pre>

2. BeforeSendHeaders > Modify Request Header

<pre>
<code>let headersInit = <b>{
	"x-req-a": "v1",
	"x-req-b": "v2",
	"user-agent": "curl/1.2",
	"accept-language": null,
}</b>;
let headers = Object.entries(headersInit)
	.filter(([k, v]) => v !== null)
	.map(([k, v]) => ({ name: k, value: v }));
for (let header of details.requestHeaders) {
	let name = header.name.toLowerCase();
	if (name in headersInit) continue;
	headers.push(header);
}
return { requestHeaders: headers };
</code></pre>

## Modify Response Headers

This rule will allow CORS for the `developer.mozilla.org` domain, remove CSP and `x-frame-options`, and add `x-res-a` and `x-res-b` response headers.

1. Match Request > Domain

<pre>
<code>let hostnames = <b>['developer.mozilla.org']</b>;
let urlObj = new URL(details.url);
return hostnames.includes(urlObj.hostname);
</code></pre>

2. HeadersReceived > Modify Response Header

<pre>
<code>let headersInit = <b>{
	"access-control-allow-origin": "*",
	"access-control-expose-headers":"*",
	"content-security-policy": null,
	"content-security-policy-report-only": null,
	"x-frame-options": null,
	"x-res-a":"v1",
	"x-res-b":"v2",
}</b>;
let headers = Object.entries(headersInit)
	.filter(([k, v]) => v !== null)
	.map(([k, v]) => ({ name: k, value: v }));
for (let header of details.responseHeaders) {
	let name = header.name.toLowerCase();
	if (name in headersInit) continue;
	headers.push(header);
}
return { responseHeaders: headers };
</code></pre>

## Cancel Requests

This rule will cancel requests to the `google-analytics.com` and `www.google-analytics.com` domains.

1. Match Request > Domain

<pre>
<code>let hostnames = <b>['google-analytics.com', 'www.google-analytics.com']</b>;
let urlObj = new URL(details.url);
return hostnames.includes(urlObj.hostname);
</code></pre>

2. BeforeRequest > Cancel

## Cancel Requests by Resource Type

This rule will cancel requests of types `beacon`, `ping`, and `csp_report`.

1. Match Request > Main Frame

<pre>
<code>// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/ResourceType
let types = <b>['beacon', 'ping', 'csp_report']</b>;
if (!types.includes(details.type)) return false;
return true;
</code></pre>

2. BeforeRequest > Cancel

## Redirect Domain

This rule will redirect requests from `http://www.google.com/recaptcha/api.js` and related requests to the `www.recaptcha.net` domain.

1. Match Request > RegExp

<pre>
<code>let regex = <b>/^https?:\/\/(www\.)?google\.com\/recaptcha\//i</b>;
return regex.test(details.url);
</code></pre>

2. BeforeRequest > Redirect

<pre>
<code><b>let urlObj = new URL(details.url);
urlObj.hostname = 'www.recaptcha.net';
let url = urlObj.href;</b>
return { redirectUrl: url };
</code></pre>

## Redirect Path

This rule will redirect requests under `https://example.net/` except for `/test/` and `/favicon.ico` to `https://example.net/test/`.

1. Match Request > URL Prefix

<pre>
<code>let prefix = <b>'https://example.net/'</b>;
<b>
if (details.url.startsWith(prefix + 'test/')) return false;
if (details.url == prefix + 'favicon.ico') return false;
</b>
return details.url.startsWith(prefix);
</code></pre>

2. BeforeRequest > Redirect

<pre>
<code><b>let urlObj = new URL(details.url);
urlObj.pathname = '/test' + urlObj.pathname;
let url = urlObj.href;</b>
return { redirectUrl: url };
</code></pre>

## External Link Redirection

This rule will directly redirect addresses like `https://www.google.com/url?sa=j&url=https%3A%2F%2Fexample.com` to the target.

1. Match Request > URL Prefix

<pre>
<code>let prefix = <b>'https://www.google.com/url?'</b>;
return details.url.startsWith(prefix);
</code></pre>

2. BeforeRequest > Redirect

<pre>
<code><b>let urlObj = new URL(details.url);
let url = urlObj.searchParams.get('url');
if (url) </b>return { redirectUrl: url };
</code></pre>

## Modify Response Body

This rule will replace all occurrences of `Domain` with `DOMAIN` on the page `https://www.example.net/?uppercase`.

1. Match Request > URL

<pre>
<code>let url = <b>'https://www.example.net/?uppercase'</b>;
return url === details.url;
</code></pre>

2. FilterResponse > Modify Response Body

<pre>
<code>if ('error' === event.type) return console.warn('filter_error', filter.error, details.url);
if (!this.buffer) this.buffer = [];
if ('data' === event.type) {
	this.buffer.push(event.data);
	// Prevent default output stream writing.
	return false;
}
if ('stop' !== event.type) return;
let decoder = this.decoder || (this.decoder = new TextDecoder('utf-8'));
let encoder = this.encoder || (this.encoder = new TextEncoder());
let text = this.buffer.reduce((s, buffer) => s + decoder.decode(buffer, { stream: true }), '') + decoder.decode();
console.log(text);
text = text.replace(<b>/Domain/g, 'DOMAIN'</b>);
return encoder.encode(text);
</code></pre>

## Replace Response Body

This rule will output the request headers of the `https://www.example.net/?log` to the page.

1. Match Request > URL

<pre>
<code>let url = <b>'https://www.example.net/?log'</b>;
return url === details.url;
</code></pre>

2. SendHeaders > Save Request Header

<pre>
<code>share.requestHeaders = details.requestHeaders;
</code></pre>

3. FilterResponse > Specify Response Body

<pre>
<code>if ('error' === event.type) return console.warn('filter_error', filter.error, details.url);
if ('start' !== event.type) return false;
let text = <b>'&lt;plaintext>' + JSON.stringify(share.requestHeaders, null, " ")</b>;
let encoder = new TextEncoder();
filter.write(encoder.encode(text));
filter.close();
</code></pre>


# Advanced

## Match Blacklist

This setting will ensure that requests to `www.example.net` do not match any rules.

1. In `Settings > Rules > Global Request Matching`, select the `Domain` template, then edit and save.

<pre>
<code>let hostnames = <b>['www.example.net']</b>;
let urlObj = new URL(details.url);
return <b>! </b>hostnames.includes(urlObj.hostname);
</code></pre>

## Cancel Requests by Request Body

This rule will cancel POST requests to `https://httpbin.org/post` where the request body contains `ABCD`.

1. Match Request > HTTP Method

<pre>
<code>let methods = <b>['POST']</b>;
if (!methods.includes(details.method)) return false;
<b>
let prefix = 'https://httpbin.org/post';
if (!details.url.startsWith(prefix)) return false;

// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeRequest#requestbody
if (!details.requestBody) return false;
let bodyText = '';
try {
    if (details.requestBody.raw) {
        let decoder = new TextDecoder('utf-8');
        bodyText = details.requestBody.raw.reduce((s, r) => s + decoder.decode(r.bytes, { stream: true }), '') + decoder.decode();
    } else if (details.requestBody.formData) {
        bodyText = JSON.stringify(details.requestBody.formData);
    }
} catch (e) {
    console.warn(e, details.requestBody);
}
return bodyText.includes('ABCD');</b>
</code></pre>

2. BeforeRequest > Cancel

## Match Response Status Code

This rule will match pages like `https://httpbin.org/status/418` with a response status code of 418 and prepend `statusLine` to the response body.

1. Match Request > Delayed Set Match Status

2. HeadersReceived > Set Match Status

<pre>
<code>let isMatched = details.statusCode == <b>418</b>;
this.setMatchStatus(isMatched);
<b>this.statusLine = details.statusLine;</b>
</code></pre>

3. FilterResponse > Specify Response Body

<pre>
<code>if ('start' !== event.type) <b>return;
// FIX: https://bugzilla.mozilla.org/show_bug.cgi?id=1543018
if (!this.matchStatus) return;</b>
let text = <b>this.statusLine + "\n"</b>;
let encoder = new TextEncoder();
<b>return encoder.encode(text);</b>
</code></pre>

## Automatic Retry

This rule will wait 5 seconds and retry up to 3 times if the request to `err.example.net` fails.

1. Match Request > Main Frame

<pre>
<code>// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/ResourceType
let types = ['main_frame'];
if (!types.includes(details.type)) return false;
<b>
let methods = ['GET'];
if (!methods.includes(details.method)) return false;

let hostnames = ['err.example.net'];
let urlObj = new URL(details.url);
return hostnames.includes(urlObj.hostname);</b>
</code></pre>

2. Error >

<pre>
<code><b>console.warn(details);
let urlObj = new URL(details.url);
let retry = parseInt(urlObj.searchParams.get('retry') || 0);
if (retry >= 3) return;
urlObj.searchParams.set('retry', retry + 1);
let url = urlObj.href;
setTimeout(() => {
    browser.tabs.update(details.tabId, { url: url });
}, 5 * 1000);</b>
</code></pre>

## Transmit Cookies

This rule will use cookies from the `httpbin.org` domain for requests to `example.net`, `*.example.net`, and `*.example.org`.

1. Check `cookies` in `Settings > Security > Permissions`.

2. Choose `Global Tools` template in `Settings > Miscellaneous > Before loading rules` and save.

3. Click the `Execute Now` button next to the textarea in `Before loading rules` or click the `Reload this extension` button in `Settings > Miscellaneous > Restart`.

4. Match Request > Other

<pre>
<code><b>function f(details, share) {</b>

<b>if (WR.isDomain(details.url, ['example.net', '.example.org'])) return true;</b>
return false;

}
</code></pre>

5. BeforeSendHeaders > Modify Request Header

<pre>
<code><b>async function f(details, share) {
</b>
let headersInit = <b>{
	"cookie": await WR.getCookie("httpbin.org"),
}</b>;
let headers = Object.entries(headersInit)
	.filter(([k, v]) => v !== null)
	.map(([k, v]) => ({ name: k, value: v }));
for (let header of details.requestHeaders) {
	let name = header.name.toLowerCase();
	if (name in headersInit) continue;
	headers.push(header);
}
return { requestHeaders: headers };
<b>
}</b>
</code></pre>
