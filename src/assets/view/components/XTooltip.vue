<template>
  <v-tooltip
    v-bind="$attrs"
    :content-class="contentClass"
    :disabled="this.disabled || !this.hasTooltip"
    transition="fade-transition"
    :value="value"
    @input="(v) => $emit('input', v)"
  >
    <slot v-if="$slots.title" name="title"></slot>
    <template v-else>{{ tooltip }}</template>
    <template #activator="{ on, attrs }">
      <span v-if="wrap" v-on="on" v-bind="attrs">
        <slot :on="on" :attrs="attrs"></slot>
      </span>
      <template v-else-if="(events || (events = on), true)">
        <slot :on="on" :attrs="attrs"></slot>
      </template>
    </template>
  </v-tooltip>
</template>
<script>
export default {
  props: {
    title: String,
    contentClass: {
      type: String,
      default: "text-pre-wrap",
    },
    disabled: Boolean,
    wrap: Boolean,
    value: Boolean,
  },
  model: {
    prop: "value",
    event: "input",
  },
  data() {
    return {
      events: null,
      elm: null,
    };
  },
  mounted() {
    if (!this.wrap) this.addEvents();
  },
  beforeDestroy() {
    this.removeEvents();
  },
  computed: {
    tooltip() {
      const title = this.title;
      if (!title) return "";
      return title.trim();
    },
    hasTooltip() {
      if (this.$slots.title || this.tooltip) return true;
    },
    activatorVNode() {
      // XXX
      return this.$slots.default && this.$slots.default[0];
    },
  },
  watch: {
    /*
    events: {
      deep: true,
      handler(newValue, oldValue) {
        console.log('watch',newValue,oldValue);
        this.removeEvents(null, oldValue);
        this.addEvents(null, newValue);
      },
    },
    */
  },
  methods: {
    addEvents(elm, events) {
      if (!events) events = this.events;
      if (!elm) {
        if (!this.elm && this.activatorVNode && this.activatorVNode.elm) {
          this.elm = this.activatorVNode.elm;
        }
        elm = this.elm;
      }
      // console.log("add", elm, events);
      if (!elm || !events) return;
      Object.entries(events).forEach((kv) => {
        elm.addEventListener(kv[0], kv[1]);
      });
    },
    removeEvents(elm, events) {
      if (!events) events = this.events;
      if (!elm) elm = this.elm;
      // console.log("remove", elm, events);
      if (!elm || !events) return;
      Object.entries(events).forEach((kv) => {
        elm.removeEventListener(kv[0], kv[1]);
      });
    },
  },
};
</script>
