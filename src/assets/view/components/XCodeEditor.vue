<template>
  <v-input
    class="v-text-field"
    v-bind="$props"
    :label="undefined"
    v-on="$events"
    :error-messages="
      (rules || []).map((f) => f(value)).filter((e) => e !== true)
    "
  >
    <div class="v-label theme--light v-label--active" v-if="label">
      {{ label }}
    </div>
    <v-card
      flat
      width="100%"
      v-intersect="{
        handler: onIntersect,
        options: {
          threshold: 0.1,
        },
      }"
      ref="input"
      @blur="onBlur"
    >
    </v-card>
    <slot name="append"></slot>
  </v-input>
</template>
<script>
export default {
  props: {
    value: String,
    label: String,
    rules: Array,
    error: Boolean,
    params: Object,
    timeout: [Number, Boolean],
  },
  model: {
    prop: "value",
    event: "change",
  },
  data: function () {
    return {
      editor: null,
      currentValue: null,
      isActive: false,
      desposeTimerId: null,
    };
  },
  methods: {
    onIntersect(entries, observer, isIntersecting) {
      this.isActive = isIntersecting;
    },
    onDisconnect(editor) {
      if (this.isActive) {
        this.$emit("disconnect");
      } else {
        if (
          editor === this.editor &&
          editor.$container &&
          editor.$container.isConnected
        ) {
          this.editor.dispose();
          this.editor = null;
        }
      }
    },
    createEditor() {
      let that = this;
      let $el = this.$refs.input.$el;
      let params = this.params || {};
      let init = [
        {
          async func(params) {
            let editorUtil = this.util;
            let asyncList = [
              editorUtil.languages.javascript.setCompilerOptions({
                strictNullChecks: true,
              }),
              editorUtil.languages.javascript.setDiagnosticsOptions({
                diagnosticCodesToIgnore: [
                  // A 'return' statement can only be used within a function body.
                  1108,
                  // This constructor function may be converted to a class declaration.
                  80002,
                ],
              }),
            ];
            let libs = ["webext"];
            if (params.type === "code_editor_init") libs.push("editor");
            editorUtil.languages.javascript.addExtraLibs(libs);
            if (params.dts) {
              editorUtil.languages.javascript.addExtraLib(
                params.dts,
                "local.d.ts",
                true
              );
            }
            if (params.initjs) {
              editorUtil.languages.javascript.addExtraLib(
                params.initjs,
                "init.js",
                true
              );
            }
            let completionItems = [];
            if (params.jsdoc) {
              completionItems.push({
                label: "jsdoc",
                documentation: "Add JSDoc",
                insertText: params.jsdoc + "\n",
                kind: "Text",
              });
              if (params.params) {
                completionItems.push({
                  label: "top level function",
                  documentation: "Add Top Level Function",
                  insertText: `${params.jsdoc}\nfunction f(${params.params.join(
                    ", "
                  )}) {\n\n$1\n\n}`,
                  insertTextRules: "InsertAsSnippet",
                });
              }
              if (params.tpl && params.tpl.length > 0) {
                for (let item of params.tpl) {
                  let insertText = item.exp
                    .trim()
                    .replace(/^\/\/# REMOVABLE\n/, "");
                  let [space] = insertText.match(/^\s+/) || [""];
                  if (space) {
                    insertText = insertText.replace(
                      new RegExp("(^|\n)" + space, "g"),
                      "$1"
                    );
                  }
                  /*
                  // TODO
                  insertText = insertText
                    .replace(/\\/g, "\\\\")
                    .replace(/\$/g, "\\$");
                  */
                  completionItems.push({
                    label: `Template: ${item.name}`,
                    insertText,
                    kind: "Snippet",
                  });
                }
              }
            }
            if (params.headers) {
              // XXX
              for (let header of params.headers) {
                let item = {
                  kind: "Text",
                  label: `${header}`,
                  documentation: "HTTP Header",
                };
                completionItems.push(
                  Object.assign(
                    {
                      insertText: header,
                      pattern: /['"`]$/,
                    },
                    item
                  ),
                  Object.assign(
                    {
                      insertText: `"${header}"`,
                      documentation: "HTTP Header",
                      excludePattern: /(['"`]|([~@#$%^\*\-\_\\\.]\s*))$/,
                    },
                    item
                  )
                );
              }
            }
            if (completionItems.length > 0) {
              editorUtil.languages.registerCompletionItems(
                "javascript",
                completionItems
              );
            }
            return await Promise.all(asyncList);
          },
          args: [Object.assign({ headers: _constant.headers }, params)],
          world: "MAIN",
          injectImmediately: true,
        },
      ];
      if (params.init) {
        init.push({
          func: _constant.code_editor_init_func,
          args: [params],
        });
      }
      let editor = codeEditor.create($el, {
        options: {
          // theme: "vs-dark",
          language: "javascript",
          value: this.value,
        },
        events: {
          async input() {
            that.currentValue = await this.getValue();
            that.$emit("input", that.currentValue);
          },
          async blur() {
            that.currentValue = await this.getValue();
            that.$emit("change", that.currentValue);
          },
          keydown(event) {
            event = Object.entries(event.browserEvent || event)
              .filter(([k, v]) =>
                [
                  "code",
                  "keyCode",
                  "ctrlKey",
                  "metaKey",
                  "shiftKey",
                  "altKey",
                ].includes(k)
              )
              .reduce(
                (o, [k, v]) => ((o[k] = v), o),
                new Event("keydown", { bubbles: true, cancelable: true })
              );
            $el.dispatchEvent(event);
          },
          disconnect() {
            that.onDisconnect(editor);
          },
        },
        keybindingRules: [
          {
            keybinding: "CtrlCmd+KeyS",
            command() {},
          },
          {
            keybinding: "F11",
            command() {},
          },
        ],
        init,
      });
      return editor;
    },
    onBlur() {
      if (this.currentValue === null) return;
      // console.log(this.currentValue);
      this.$emit("change", this.currentValue);
    },
  },
  watch: {
    value(v) {
      if (!this.editor) return;
      (async () => {
        let value = this.currentValue;
        if (value === null) value = await this.editor.getValue();
        if (v.trim() === value.trim()) return;
        // console.log(v);
        await this.editor.updateOptions({
          value: v,
        });
      })();
    },
    isActive(v) {
      if (v) {
        if (this.desposeTimerId) {
          clearTimeout(this.desposeTimerId);
          this.desposeTimerId = null;
        }
        if (!this.editor) {
          this.editor = this.createEditor();
        }
      } else {
        if (
          !this.desposeTimerId &&
          typeof this.timeout == "number" &&
          this.timeout > 0
        ) {
          this.desposeTimerId = setTimeout(() => {
            if (
              this.editor &&
              this.editor.$container &&
              this.editor.$container.isConnected
            ) {
              this.editor.dispose();
              this.editor = null;
            }
          }, this.timeout * 1000);
        }
      }
    },
  },
};
</script>
<style scoped>
.v-text-field .v-label--active {
  position: absolute;
}
</style>
<style>
.ext-code-editor--loading iframe {
  display: block !important;
}
</style>