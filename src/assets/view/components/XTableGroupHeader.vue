<template>
  <div class="table-group-header d-flex justify-space-between align-center">
    <v-btn icon small class="ma-0" @click="props.toggle">
      <v-icon>
        {{ props.isOpen ? "mdi-minus" : "mdi-plus" }}
      </v-icon>
    </v-btn>
    <template v-if="rename !== false">
      <v-text-field
        label="group"
        v-model="rename"
        dense
        clearable
        hide-details
      ></v-text-field>
      <v-spacer></v-spacer>
      <div class="flex-grow-0 flex-shrink-0">
        <x-tooltip bottom title="OK">
          <v-icon class="mr-2" @click="change"> mdi-check </v-icon>
        </x-tooltip>
        <x-tooltip bottom title="Cancel">
          <v-icon @click="rename = false"> mdi-close </v-icon>
        </x-tooltip>
      </div>
    </template>
    <template v-else>
      {{ props.group || "Ungrouped" }}
      <v-spacer></v-spacer>
      <div class="flex-grow-0 flex-shrink-0">
        <x-tooltip bottom title="Rename">
          <v-icon class="mr-2" @click="rename = props.group || ''">
            mdi-rename
          </v-icon>
        </x-tooltip>
        <x-tooltip bottom title="Export">
          <v-icon class="mr-2" @click="$emit('export')">
            mdi-file-export
          </v-icon>
        </x-tooltip>
        <x-tooltip bottom title="Delete">
          <v-icon @click="$emit('delete')"> mdi-delete </v-icon>
        </x-tooltip>
      </div>
    </template>
    <!-- <v-btn
      icon
      small
      class="ma-0 group-close"
      @click="props.remove"
    >
      <v-icon> mdi-close </v-icon>
    </v-btn> -->
  </div>
</template>
<script>
import XTooltip from "./XTooltip.vue";
export default {
  components: {
    XTooltip,
  },
  props: {
    props: {},
  },
  data: function () {
    return {
      rename: false,
    };
  },
  computed: {},
  methods: {
    change() {
      this.$emit("rename", this.rename);
      this.rename = false;
    },
  },
};
</script>
<style scoped>
.table-group-header {
  width: 100%;
}
</style>