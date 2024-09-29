# WebRequest Event

Event Firing Order:

![webrequest flow](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/webrequest-flow.png)

For more details, visit: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest

# Rules

* Click the "+ / Add" button in the upper left corner of the extension's main interface to enter the rule editing interface.

* The `Match Request` field is required; it will execute during the `onBeforeRequest` stage. If this function returns `true`, it indicates a match for this rule, triggering the subsequent listener functions of this rule.

* Each stage of the rule can have its own listener function. You can access references for events and types of the `details` parameter by clicking the "? / Reference" button on the right side of the textarea.

## Function Writing

* In general, you can select a similar template and modify the variable values within it. For complex situations, additional logic may need to be written in [JavaScript](https://developer.mozilla.org/en-US/docs/Glossary/JavaScript).

* You can usually view the function parameters and return types in the hint button on the right side of the textarea, e.g., `@param details` indicates the `details` parameter, and `@return boolean` indicates that the return value is of type `boolean`.

* Generally, just fill in the [function body](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/Function#functionbody), unless it is an asynchronous function or uses different parameter names.

* You can add the current code as a template by clicking the “☆ / Add Template" button on the right side of the textarea.

### Data Transfer Between Functions

* Isolated by request and rule: `this.k=v;`
* Isolated by request: `share.k=v;`
* Global: `self.k=v;` or `window.k=v;`, etc.

## Rule Priority

* The `Index` field in the rule list determines the matching order, with smaller numbers being tested first.

* In the rule list, with Group view off and sorting canceled, you can adjust the rule order by dragging and dropping.

# Examples

[Examples](./Examples.md)

# Notes

1. There may be conflicts with other web extensions, as they might modify the same request.

2. The data displayed in the Web Developer Tools may be before modification.

3. Avoid using `async function` or handling complex calculations during the `Match Request` stage, as this may slow down all requests.

4. Conflicts should be avoided when sharing data using `share`, `self`, or `window`.

5. Use `FilterResponse` only when necessary; avoid modifying the request body of a single request by multiple rules at the same time.
