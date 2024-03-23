# WebRequest Rules Extension

Full control of the [WebRequest API](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/webRequest) by coding it yourself.

## Main Features

* Cancel requests
* Redirect requests
* Upgrading to a secure request
* Supply authentication credentials
* Modify request headers (`user-agent`, `x-forwarded-for`, `referer`, `cookie`...)
* Modify response headers (`access-control-allow-*`, `content-security-policy`, `x-frame-options`...)
* Modify response body
* Read request body
* Adjustable rule priority
* Rules grouping
* Complex conditions available
* Customizable templates
* Support for asyncBlocking
* Import/Export settings

## Notes

* Optional permissions need to be enabled manually only if you want to write functionality that relies on these APIs.
* The optional Code Editor feature is provided by the [Code Editor](https://addons.mozilla.org/firefox/addon/code-editor/) extension.
