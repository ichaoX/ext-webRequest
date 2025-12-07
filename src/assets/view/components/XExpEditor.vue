<template>
  <div>
    <v-autocomplete
      v-if="(isShowTpl = !exp && tplItems.length > 0)"
      label="Template"
      @change="onChange($event, true)"
      :items="tplItems"
      item-text="name"
      item-value="exp"
      :rules="[validExp]"
      :error="valid !== true"
      :validate-on-blur="true"
      ref="expSelect"
      clearable
    >
      <template #item="{ item }">
        {{ item.name }}
        <v-spacer></v-spacer>
        <v-btn
          icon
          v-if="item.editable"
          @click.stop="
            $refs.expSelect.blur();
            deleteTemplate(item.name);
          "
        >
          <v-icon> mdi-star </v-icon>
        </v-btn>
      </template>
    </v-autocomplete>
    <div v-else @mouseleave="pinHint = false">
      <component
        :is="useCodeEditor ? 'x-code-editor' : 'v-textarea'"
        :class="{ fullscreen }"
        ref="input"
        :label="label || 'Code'"
        :value="useCodeEditor ? wrapFuncExp : exp"
        :rules="[validExp]"
        :error="valid !== true"
        v-bind="
          useCodeEditor
            ? {
                params: params,
                timeout: settings.code_editor_idle_timeout,
                theme: currentTheme,
              }
            : {
                'validate-on-blur': true,
                rows: 10,
                spellcheck: false,
              }
        "
        @change="onChange"
        @keydown.native="(event) => useCodeEditor && onKeydown($event)"
        @input.native="(event) => !useCodeEditor && onInput(event.target.value)"
        v-on="
          useCodeEditor
            ? {
                input: onInput,
                disconnect: () => (fallback = true),
              }
            : {
                keydown: onKeydown,
              }
        "
      >
        <template #append>
          <div class="d-flex flex-column align-self-start">
            <x-tooltip left title="Clear">
              <v-btn
                icon
                @click="
                  $refs.input.reset && $refs.input.reset();
                  onChange('');
                "
                :disabled="!rawText && !tplItems.length"
              >
                <v-icon> mdi-backspace-outline </v-icon>
              </v-btn>
            </x-tooltip>
            <x-tooltip left title="Toggle Fullscreen">
              <v-btn
                icon
                @click="toggleFullScreen"
                :color="fullscreen ? 'primary' : undefined"
              >
                <v-icon> mdi-arrow-expand-all </v-icon>
              </v-btn>
            </x-tooltip>
            <x-tooltip
              v-if="!hideLink && getConfig('link')"
              left
              title="References"
            >
              <v-btn icon :href="getConfig('link')" target="help">
                <v-icon dark> mdi-help-circle-outline </v-icon>
              </v-btn>
            </x-tooltip>
            <x-tooltip v-if="hint" bottom :title="hint" v-model="showHint">
              <v-btn
                icon
                @click="pinHint = !pinHint"
                :color="pinHint ? 'primary' : undefined"
              >
                <v-icon> mdi-tooltip-text-outline </v-icon>
              </v-btn>
            </x-tooltip>
            <template v-if="type">
              <x-tooltip
                v-if="!!findTemplateName(value)"
                left
                title="Delete Template"
              >
                <v-btn icon @click="deleteTemplate()">
                  <v-icon> mdi-star </v-icon>
                </v-btn>
              </x-tooltip>
              <x-tooltip v-else left title="Add Template">
                <v-btn icon :disabled="!value" @click="addTemplate()">
                  <v-icon> mdi-star-plus-outline </v-icon>
                </v-btn>
              </x-tooltip>
            </template>
            <slot name="append-btn" :value="value" :error="error"></slot>
          </div>
        </template>
      </component>
    </div>

    <slot :value="value" :error="error"></slot>

    <v-dialog v-model="editTemplate.show" persistent max-width="450">
      <v-card v-if="editTemplate.type == 'add'">
        <v-card-title> Edit Template </v-card-title>
        <v-card-text>
          <v-combobox
            label="name"
            v-model.trim="editTemplate.name"
            :items="customTpl.map((o) => o.name)"
            @input.native="editTemplate.name = $event.target.value.trim()"
            clearable
            hide-details
          ></v-combobox>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="editTemplate.show = false"> Cancel </v-btn>
          <v-btn
            color="primary"
            text
            :disabled="!editTemplate.name"
            @click="addTemplate(editTemplate.name)"
          >
            {{
              customTpl.find((o) => o.name === editTemplate.name)
                ? "Update"
                : "Create"
            }}
          </v-btn>
        </v-card-actions>
      </v-card>
      <v-card v-else-if="editTemplate.type == 'delete'">
        <v-card-title>
          Delete Template [{{ editTemplate.name }}]?
        </v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="editTemplate.show = false"> Cancel </v-btn>
          <v-btn
            color="red darken-1"
            text
            @click="deleteTemplate(editTemplate.name, true)"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import XCodeEditor from "./XCodeEditor.vue";
import XTooltip from "./XTooltip.vue";
export default {
  components: {
    XCodeEditor,
    XTooltip,
  },
  props: {
    raw: String,
    label: String,
    type: String,
    tplInheritType: String,
    tooltip: String,
    settings: {
      type: Object,
      default() {
        return {};
      },
    },
    required: {
      type: Boolean,
      default() {
        return undefined;
      },
    },
    hideLink: Boolean,
  },
  model: {
    prop: "raw",
    event: "change",
  },
  data: function () {
    return {
      valid: true,
      vExp: null,
      rawText: "",
      editTemplate: {
        show: false,
        name: "",
        type: "",
      },
      fallback: false,
      isShowTpl: false,
      fullscreen: false,
      wrappable: true,
      pinHint: false,
      showHint: false,
    };
  },
  mounted() {
    this.rawText = this.exp;
    this.wrapFunc();
  },
  computed: {
    currentTheme() {
      return this.$vuetify.theme.dark ? 'dark' : 'light';
    },
    exp() {
      return (this.raw || "").replace(/^\/\/# REMOVABLE\n/, "");
    },
    value() {
      return this.unwrapFunc(this.trim(this.rawText));
    },
    wrapFuncExp() {
      if (!this.wrappable) return this.exp;
      return this.wrapFunc();
    },
    error() {
      if (this.valid === true) return undefined;
      return this.valid;
    },
    hint() {
      return this.tooltip || util.getHint(this.type, "hint");
    },
    params() {
      if (!this.useCodeEditor) return {};
      return {
        type: this.type,
        init: this.settings.code_editor_init,
        dts: util.getHint(this.type, "dts"),
        jsdoc: util.getHint(this.type, "jsdoc"),
        initjs:
          !["init", "code_editor_init"].includes(this.type) &&
          util.getInitExp(),
        params: util.getParams(this.type),
        tpl: this.tplItems,
      };
    },
    customTpl() {
      if (!this.type || !this.settings.template) return [];
      return this.settings.template[this.tplInheritType || this.type] || [];
    },
    tplItems() {
      return [].concat(
        this.customTpl.map((o) => ({
          name: o.name,
          exp: o.exp.trim(),
          editable: true,
        })),
        (this.getConfig("tpl") || []).map((o) => ({
          name: o.name,
          exp: o.exp.trim(),
        }))
      );
    },
    useCodeEditor() {
      return (
        this.fallback == false && this.settings && this.settings.code_editor
      );
    },
  },
  methods: {
    toggleFullScreen() {
      this.fullscreen = !this.fullscreen;
    },
    getConfig(key, type = null) {
      let config = configs[type || this.type] || {};
      if (config[key] !== undefined) return config[key];
      if (config.inherit) return this.getConfig(key, config.inherit);
      return undefined;
    },
    onKeydown(event) {
      // console.log(event);
      switch (event.keyCode) {
        case 122:
          if (
            !(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
          ) {
            this.toggleFullScreen();
            event.preventDefault();
            event.stopPropagation();
          }
          break;
        case 27:
          event.preventDefault();
          event.stopPropagation();
          break;
        case 9:
          util.insertText(event, "\t");
          break;
      }
    },
    onInput(value) {
      this.rawText = value;
      if (this.valid !== true) {
        setTimeout(() => {
          let exp = value;
          if (exp) {
            this.onChange(exp);
          } else {
            // XXX
            this.valid = true;
          }
        }, 1);
      }
    },
    validExp(exp) {
      if (exp === this.vExp) return this.valid;
      this.vExp = exp;
      let required =
        this.required !== undefined
          ? this.required
          : this.getConfig("required");
      if (!exp && required) return (this.valid = `${this.type} is required`);
      if (!this.settings.exp_verify_syntax) return (this.valid = true);
      return (this.valid = util.validExp(
        util.normalFuncExp(exp, this.type),
        "function"
      ));
    },
    onChange(value, isTpl = false) {
      value = value || "";
      this.rawText = value;
      if (this.validExp(value) === true) {
        if (this.wrappable && !isTpl && !util.isFuncExp(value))
          this.wrappable = false;
        value = this.unwrapFunc(value, true);
      }
      this.$emit("change", this.trim(value));
    },
    trim(value) {
      value = value || "";
      if (!util.isFuncExp(value)) {
        value = value
          .replace(/^(\s*[\r\n])+/, "")
          .replace(/^(\s+)/, "//# REMOVABLE\n$1");
      }
      return value.trim();
    },
    wrapFunc() {
      let exp = (this.raw || "").trim();
      if (!exp || this.valid !== true) return this.exp;
      let newExp = util.normalFuncExp(exp, this.type, true);
      this.wrappable = newExp.trim() != exp;
      return newExp;
    },
    unwrapFunc(value, updateState = false) {
      if (value && util.isFuncExp(value)) {
        let token = "/* TOKEN */";
        let part = util.normalFuncExp(token, this.type, true).split(token);
        let unwrapped = false;
        if (
          part.length === 2 &&
          value.startsWith((part[0] = part[0].replace(/\s+$/, ""))) &&
          value.endsWith((part[1] = part[1].replace(/^\s+/, "")))
        ) {
          let body = value.slice(part[0].length, -1 * part[1].length);
          if (!!body.trim()) {
            unwrapped = true;
            body = body.replace(/^(\s*[\r\n])+/, "");
            if (util.isFuncExp(body)) {
              // XXX
              body =
                "; // Avoid starting the function body with a function declaration.\n" +
                body;
            }
            value = this.trim(body);
          }
        }
        if (!unwrapped && value.startsWith("/*")) {
          let jsdoc = util.getHint(this.type, "jsdoc");
          if (jsdoc && value.startsWith(jsdoc)) {
            let func = value.slice(jsdoc.length).trim();
            if (!/^(\/\/|\/\*)/.test(func)) {
              value = func;
              unwrapped = true;
            }
          }
        }
        if (unwrapped && updateState && !this.wrappable) this.wrappable = true;
      }
      return value;
    },
    findTemplateName(exp) {
      let item = this.customTpl.find((o) => o.exp === exp);
      if (!item) return null;
      return item.name;
    },
    addTemplate(name) {
      if (!name) {
        this.editTemplate.name = "";
        this.editTemplate.type = "add";
        this.editTemplate.show = true;
        return;
      }
      let tpl = this.customTpl;
      let item = tpl.find((o) => o.name === name);
      let exp = this.trim(this.raw);
      if (item) {
        item.exp = exp;
      } else {
        tpl.push({ name, exp });
      }
      this.$emit("change:template", tpl);
      this.editTemplate.show = false;
    },
    deleteTemplate(name, force = false) {
      if (force) {
        let index = this.customTpl.findIndex((o) => o.name == name);
        if (index >= 0) {
          let tpl = this.customTpl;
          tpl.splice(index, 1);
          this.$emit("change:template", tpl);
        }
        this.editTemplate.show = false;
      } else {
        if (!name) name = this.findTemplateName(this.value);
        this.editTemplate.name = name;
        this.editTemplate.type = "delete";
        this.editTemplate.show = true;
      }
    },
  },
  watch: {
    isShowTpl(value, oldValue) {
      if (value) {
        if (this.fullscreen) this.fullscreen = false;
        if (!this.wrappable) this.wrappable = true;
        if (this.pinHint) this.pinHint = false;
      } else {
        if (value != oldValue) this.wrapFunc();
      }
    },
    fullscreen(value, oldValue) {
      if (value != oldValue) {
        let token = "x-exp-editor__parent--ztop";
        if (value && this.$refs.input) {
          let n = this.$refs.input.$el.parentElement;
          while (n) {
            n.classList.add(token);
            n = n.parentElement;
          }
        } else {
          [...document.querySelectorAll(`.${token}`)].forEach((n) =>
            n.classList.remove(token)
          );
        }
      }
    },
    pinHint(value) {
      if (value != this.showHint) this.showHint = value;
    },
    showHint(value, oldValue) {
      if (value != oldValue) {
        if (!value && this.pinHint) {
          // XXX
          setTimeout(() => {
            if (!this.pinHint) return;
            this.showHint = true;
          }, 50);
        }
      }
    },
  },
};
</script>
<style scoped>
.fullscreen {
    position: fixed;
    inset: 0;
    height: 100% !important;
    resize: none;
    background: var(--theme-bg);
    z-index: 1;
    margin: 0;
    padding: 1rem;
}
.fullscreen ::v-deep textarea,
.fullscreen ::v-deep .ext-code-editor {
  height: calc(100vh - 50px) !important;
  resize: none;
}
</style>
<style>
.x-exp-editor__parent--ztop {
  z-index: 3;
  opacity: 1 !important;
}

.x-exp-editor__parent--ztop .ext-code-editor {
  display: none;
}

.x-exp-editor__parent--ztop .fullscreen .ext-code-editor {
  display: block;
}
</style>