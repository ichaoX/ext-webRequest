<template>
  <v-list-item class="px-0">
    <v-list-item-content class="overflow-visible">
      <v-row class="align-center">
        <v-col cols="12" sm="3" md="2">
          <v-list-item-subtitle v-if="label" class="text-wrap">
            {{ label }}
            <v-btn
              v-if="help"
              icon
              x-small
              :href="help"
              target="help"
              title="Help"
            >
              <v-icon dark> mdi-help-circle-outline </v-icon>
            </v-btn>
          </v-list-item-subtitle>
          <slot name="label"></slot>
        </v-col>
        <v-col cols="12" sm="9" md="10">
          <slot></slot>
        </v-col>
      </v-row>
    </v-list-item-content>
  </v-list-item>
</template>
<script>
export default {
  props: {
    label: String,
    help: String,
  },
};
</script>
