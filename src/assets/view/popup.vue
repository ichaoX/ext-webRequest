<template>
  <v-app>
    <v-app-bar app dense>
      <!-- <v-toolbar-title v-if="tabInfo">Tab: {{ tabInfo.id }}</v-toolbar-title> -->
      <template
        v-if="
          options.status !== undefined && settings.global_status !== undefined
        "
      >
        <x-tooltip
          bottom
          content-class="text-no-wrap"
          :title="
            settings.global_status
              ? `${options.status ? 'Enabled' : 'Disabled'} on this tab`
              : `Disabled globally`
          "
        >
          <v-switch
            :label="`tab${tabInfo.id}`"
            v-model="options.status"
            @change="setStatus({ tabId: tabInfo.id, status: options.status })"
            :color="mainColor"
            :loading="optionsLoading"
            inset
            hide-details
          ></v-switch>
        </x-tooltip>
        <v-chip
          v-if="options.matchNum"
          color="primary"
          small
          label
          outlined
          :disabled="
            !(settings.global_status !== false && options.status !== false)
          "
          class="mx-2 px-2"
        >
          {{ options.matchNum }}
        </v-chip>
      </template>
      <v-spacer></v-spacer>
      <!-- <x-tooltip
        v-if="settings.global_status !== undefined"
        bottom
        content-class="text-no-wrap"
        :title="`${settings.global_status ? 'Enabled' : 'Disabled'} globally`"
      >
        <v-switch
          v-model="settings.global_status"
          @change="saveSettings('global_status')"
          inset
          hide-details
        ></v-switch>
      </x-tooltip> -->
      <v-btn
        icon
        :target="useCurrentCtx ? `_self` : `options`"
        :href="
          $router.resolve({
            name: 'options',
          }).href
        "
        @click="onClickHref"
      >
        <v-icon> mdi-cog </v-icon>
      </v-btn>
    </v-app-bar>
    <v-main>
      <v-container class="pa-0">
        <div v-if="!ruleStat.length" class="pa-5 text-center text--secondary">
          No matching rules
        </div>
        <v-list v-else class="rule-list" dense two-line subheader>
          <template v-for="(rule, k) in ruleStat">
            <v-divider v-if="k > 0" :key="'divider_' + k"></v-divider>
            <v-list-item :key="k">
              <v-list-item-content>
                <v-list-item-title>
                  {{ rule.name || "Unnamed" }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ rule.group || "" }}
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-list-item-action-text>
                  <v-chip outlined small> {{ rule.matchNum }} </v-chip>
                  <template v-if="rule.origin">
                    <v-switch
                      class="d-inline-block"
                      style="vertical-align: middle"
                      v-model="rule.origin.enable"
                      @change="saveSettings('rules')"
                      dense
                      hide-details
                    ></v-switch>
                    <v-btn
                      icon
                      :target="useCurrentCtx ? `_self` : `edit_${rule.id}`"
                      :href="
                        $router.resolve({
                          name: 'options',
                          query: { ruleId: rule.id },
                        }).href
                      "
                      @click="onClickHref"
                    >
                      <v-icon> mdi-pencil </v-icon>
                    </v-btn>
                  </template>
                </v-list-item-action-text>
              </v-list-item-action>
            </v-list-item>
          </template>
        </v-list>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import XTooltip from "./components/XTooltip.vue";
export default {
  components: {
    XTooltip,
  },
  mounted() {
    util.getSettings(
      ["rules", "global_status", "tab_info_throtte", "popup_auto_close"],
      (results) => {
        for (let key in results) {
          this.$set(this.settings, key, results[key]);
          switch (key) {
            case "popup_auto_close":
              if (results[key] && this.useCurrentCtx)
                this.useCurrentCtx = false;
              break;
          }
        }
      },
      true
    );
    this.loadOptions();
    this.useCurrentCtx = self.innerWidth >= 350;
    window.name = "popup";
  },
  beforeDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    util.destroy();
  },
  props: {
    tabId: String,
  },
  data() {
    return {
      settings: {},
      tabInfo: {},
      options: {},
      optionsLoading: true,
      useCurrentCtx: false,
      timeoutId: null,
    };
  },
  computed: {
    rules() {
      return this.settings.rules || [];
    },
    ruleStat() {
      let stat = JSON.parse(JSON.stringify(this.options.ruleStat || []));
      for (let rule of stat) {
        if (!rule.id) continue;
        let index = this.rules.findIndex((r) => r.id == rule.id);
        if (index == -1) continue;
        rule.origin = this.rules[index];
      }
      return stat;
    },
    mainColor() {
      return this.settings.global_status ? "primary" : "grey";
    },
  },
  methods: {
    saveSettings(key) {
      util.setSettings({ [key]: this.settings[key] }, () => {
        console.info("saved");
      });
      return true;
    },
    async setStatus(options) {
      try {
        this.optionsLoading = true;
        let ret = await util.sendMessage("setStatus", options);
        console.debug(ret);
      } catch (e) {
        console.error(e);
      }
    },
    async loadOptions() {
      if (!this.tabInfo || this.tabInfo.id === undefined) {
        this.tabInfo = this.tabId
          ? await browser.tabs.get(parseInt(this.tabId))
          : (
              await browser.tabs.query({ active: true, currentWindow: true })
            )[0];
      }
      this.options = await util.sendMessage("getTabOption", this.tabInfo.id);
      this.optionsLoading = false;
      if (this.timeoutId) return;
      this.timeoutId = setTimeout(() => {
        this.timeoutId = null;
        this.loadOptions();
      }, this.settings.tab_info_throtte || 500);
    },
    onClickHref(event) {
      if (this.settings.popup_auto_close) {
        if (event) {
          let target = event.target && event.target.closest("a[href]");
          if (target.href) {
            let url = target.href;
            browser.tabs
              .query({
                url: url.replace(/#.*/, ""),
              })
              .then((tabs) => {
                tabs = (tabs || []).filter((tab) => tab.url == url);
                if (!tabs.length) {
                  browser.tabs.create({ url });
                } else {
                  browser.tabs.update(tabs[0].id, { active: true });
                }
              });
            event.preventDefault();
          }
        }
        setTimeout(() => self.close(), 500);
      }
    },
  },
};
</script>
<style>
body {
  min-width: 300px;
  min-height: 150px;
}
</style>
