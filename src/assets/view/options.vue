<template>
  <v-app>
    <v-app-bar app>
      <v-row class="d-flex flex-nowrap">
        <x-tooltip bottom title="Add Rule" content-class="d-flex d-sm-none">
          <v-btn
            class="px-0 px-sm-4 ml-2 mr-0 mr-sm-2"
            style="min-width: 36px"
            color="primary"
            @click="editRule(-1)"
            depressed
          >
            <v-icon> mdi-plus </v-icon>
            <span class="d-none d-xs-none d-sm-flex">Add</span>
          </v-btn>
        </x-tooltip>
        <x-tooltip bottom title="Group" content-class="d-flex d-lg-none">
          <v-btn-toggle class="transparent" multiple dense v-model="groupBy">
            <v-btn
              class="px-0 px-lg-4 mr-0 mr-sm-2"
              style="min-width: 36px; border: none"
              value="group"
            >
              <v-icon> mdi-file-tree </v-icon>
              <span class="d-none d-sm-none d-lg-flex">Group</span>
            </v-btn>
          </v-btn-toggle>
        </x-tooltip>
        <v-spacer></v-spacer>
        <v-text-field
          style="min-width: 100px; max-width: 500px"
          placeholder="Search URL, name, or details"
          v-model.trim="search"
          dense
          solo
          flat
          clearable
          hide-details
        ></v-text-field>
        <v-spacer></v-spacer>
        <v-autocomplete
          class="ml-1 align-center"
          style="min-width: 50px; max-width: 150px"
          v-model="group"
          placeholder="Group"
          item-text="label"
          item-value="value"
          :items="groupItems"
          clearable
          hide-details
        ></v-autocomplete>
        <x-tooltip bottom title="Settings" content-class="d-flex d-lg-none">
          <v-btn-toggle class="transparent" dense v-model="showSettings">
            <v-btn
              class="px-0 px-lg-4 mr-2 ml-0 ml-sm-2"
              style="min-width: 36px; border: none"
              :value="true"
            >
              <v-icon> mdi-tune </v-icon>
              <span class="d-none d-sm-none d-lg-flex">Settings</span>
            </v-btn>
          </v-btn-toggle>
        </x-tooltip>
      </v-row>
    </v-app-bar>
    <v-main>
      <v-container class="pa-0 pa-sm-4">
        <v-data-table
          ref="table"
          :hide-default-footer="true"
          :group-by.sync="groupBy"
          item-key="key"
          :disable-pagination="true"
          :item-class="
            (rule) => [
              'item',
              {
                mismatch: !match(rule),
                edit: rule.id === $data.rule.id,
              },
            ]
          "
          @click.native="
            !showEditor && $data.rule.id && $set($data, 'rule', {})
          "
          :items="tableItems"
          :headers="tableHeaders"
          class="elevation-1"
        >
          <template #body="props">
            <draggable
              v-if="$refs.table"
              class="draggable"
              :list="draggable ? rules : props.items"
              tag="tbody"
              draggable=".item"
              handle=".handle"
              @end="saveRules()"
            >
              <x-v-nodes :vnodes="$refs.table.genItems(props.items, props)" />
            </draggable>
          </template>
          <template #[`group.header`]="props">
            <td
              :class="{ 'd-flex': props.isMobile }"
              :colspan="
                !props.isMobile && $refs.table
                  ? $refs.table.computedHeaders.length
                  : undefined
              "
            >
              <x-table-group-header
                :key="props.group"
                :props="props"
                @rename="(to) => renameGroup(props.group, to)"
                @export="
                  exportConfig(
                    rules.filter((rule) => (rule.group || '') === props.group),
                    props.group
                  )
                "
                @delete="deleteGroup(props.group)"
              ></x-table-group-header>
            </td>
          </template>
          <template #[`item.index`]="{ isMobile, item }">
            <span :class="{ handle: draggable }">
              <v-icon
                v-if="draggable"
                :class="{ 'mobile-drag-icon': isMobile }"
              >
                mdi-drag
              </v-icon>
              {{ item.index }}
            </span>
          </template>
          <template #[`item.enable`]="{ item }">
            <v-switch
              style="height: 24px"
              class="my-0 py-0"
              dense
              v-model="rules[item.index].enable"
              @change="saveRules()"
              :color="mainColor"
            >
            </v-switch>
          </template>
          <template #[`item.action`]="{ item }">
            <x-tooltip bottom title="Edit">
              <v-icon class="mr-2" @click="editRule(item.index)">
                mdi-pencil
              </v-icon>
            </x-tooltip>
            <x-tooltip bottom title="Copy">
              <v-icon class="mr-2" @click="copyRule(item.index)">
                mdi-content-copy
              </v-icon>
            </x-tooltip>
            <x-tooltip bottom title="Delete">
              <v-icon @click="deleteRule(item.index)"> mdi-delete </v-icon>
            </x-tooltip>
          </template>
        </v-data-table>
        <v-card flat class="transparent" style="height: 50vh"></v-card>
      </v-container>
    </v-main>

    <v-snackbar
      v-model="snackbar.show"
      :timeout="snackbar.timeout === Infinity ? -1 : snackbar.timeout"
      :key="'snackbar-' + snackbar.timestamp"
    >
      <div v-if="snackbar.html !== null" v-html="snackbar.html"></div>
      <div v-else>{{ snackbar.msg }}</div>
      <template v-slot:action="{ attrs }">
        <v-icon v-bind="attrs" @click="snackbar.show = false">
          mdi-close
        </v-icon>
      </template>
    </v-snackbar>

    <v-dialog v-model="showUnsaveConfirm" persistent max-width="450">
      <v-card>
        <v-card-title> Changes you made may not be saved. </v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showUnsaveConfirm = false"> Cancel </v-btn>
          <v-btn
            color="red darken-1"
            text
            @click="showEditor = showSettings = showUnsaveConfirm = false"
          >
            Close without saving
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDeleteConfirm" persistent max-width="450">
      <v-card v-if="rules[deleteIndex]">
        <v-card-title> Delete [{{ rules[deleteIndex].name }}]? </v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showDeleteConfirm = false"> Cancel </v-btn>
          <v-btn
            color="red darken-1"
            text
            @click="deleteRule(deleteIndex, true)"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
      <v-card v-else-if="deleteGroupName !== false">
        <v-card-title>
          Delete Group [{{ deleteGroupName || "Ungrouped" }}]?
        </v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showDeleteConfirm = false"> Cancel </v-btn>
          <v-btn
            color="red darken-1"
            text
            @click="deleteGroup(deleteGroupName, true)"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="showEditor"
      fullscreen
      persistent
      hide-overlay
      transition="dialog-bottom-transition"
    >
      <v-card @keydown.ctrl.83.prevent="saveRule()">
        <v-toolbar
          class="fixed-top-bar"
          dark
          :color="rule.enable ? mainColor : 'grey'"
        >
          <v-btn
            icon
            @click="changed ? (showUnsaveConfirm = true) : (showEditor = false)"
          >
            <v-icon> mdi-close </v-icon>
          </v-btn>
          <v-toolbar-title>
            Edit {{ rule.name ? `[${rule.name}]` : "Rule" }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-toolbar-items v-if="showEditor">
            <x-tooltip bottom title="Apply" content-class="d-flex d-sm-none">
              <v-btn
                dark
                text
                @click="saveRule()"
                :disabled="!changed || !verifyRule()"
              >
                <v-icon> mdi-content-save-edit </v-icon>
                <span class="d-none d-xs-none d-sm-flex">Apply</span>
              </v-btn>
            </x-tooltip>
            <x-tooltip
              bottom
              title="Save & Close"
              content-class="d-flex d-sm-none"
            >
              <v-btn
                dark
                text
                @click="saveRule().then((r) => r && (showEditor = false))"
                :disabled="!changed || !verifyRule()"
              >
                <v-icon> mdi-check </v-icon>
                <span class="d-none d-xs-none d-sm-flex">OK</span>
              </v-btn>
            </x-tooltip>
          </v-toolbar-items>
        </v-toolbar>
        <v-container class="pa-0 pa-sm-4" v-if="showEditor">
          <v-expansion-panels v-model="expansionPanels" multiple focusable>
            <v-expansion-panel>
              <v-expansion-panel-header>Info</v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      label="Rule Name"
                      v-model.trim="rule.name"
                      clearable
                      hide-details
                    >
                    </v-text-field>
                  </v-col>
                  <v-col cols="12" sm="3">
                    <v-combobox
                      label="Group"
                      v-model.trim="rule.group"
                      @input.native="rule.group = $event.target.value.trim()"
                      :items="groups"
                      clearable
                      hide-details
                    ></v-combobox>
                  </v-col>
                  <v-col cols="12" sm="3">
                    <v-switch
                      inset
                      :label="rule.enable ? 'Enable' : 'Disable'"
                      v-model="rule.enable"
                      :color="mainColor"
                      hide-details
                    ></v-switch>
                  </v-col>
                </v-row>
              </v-expansion-panel-content>
            </v-expansion-panel>
            <template v-for="(config, key) in configs">
              <v-expansion-panel v-if="!config.special" :key="key">
                <v-expansion-panel-header>
                  <v-row class="d-flex flex-nowrap align-center">
                    <v-col
                      v-if="config.link"
                      class="flex-grow-0 flex-shrink-0 pa-0"
                      style="opacity: 0.5"
                    >
                      <x-tooltip bottom title="References">
                        <v-btn
                          icon
                          :href="config.link"
                          target="help"
                          @click.stop="1"
                        >
                          <v-icon dark>
                            mdi-book-open-page-variant-outline
                          </v-icon>
                        </v-btn>
                      </x-tooltip>
                    </v-col>
                    <v-col
                      :style="{
                        textTransform: 'capitalize',
                        ...itemStyle(key),
                      }"
                    >
                      {{ config.name || key }}
                    </v-col>
                    <v-spacer></v-spacer>
                  </v-row>
                </v-expansion-panel-header>
                <v-expansion-panel-content
                  v-if="rule[key] || $set(rule, key, { exp: '' })"
                >
                  <x-exp-editor
                    :type="key"
                    :settings="settings"
                    v-model.trim="rule[key].exp"
                    @change:template="(value) => saveTemplate(key, value)"
                  ></x-exp-editor>
                  <v-text-field
                    v-if="'test' === key && rule[key].exp"
                    v-model.trim="test"
                    label="Test URL / details"
                    clearable
                    persistent-hint
                    :hint="
                      test && rule[key].exp
                        ? JSON.stringify(
                            getAsyncResult(
                              'rule_test',
                              (...args) => matchAsync(...args),
                              [test, rule[key].exp, true],
                              null
                            )
                          )
                        : undefined
                    "
                  ></v-text-field>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </template>
          </v-expansion-panels>
          <v-card flat class="transparent" style="height: 50vh"></v-card>
        </v-container>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="showSettings"
      fullscreen
      persistent
      transition="dialog-bottom-transition"
    >
      <v-card>
        <v-toolbar class="fixed-top-bar" dark :color="mainColor">
          <v-toolbar-title> Settings </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn
            icon
            @click="
              changed ? (showUnsaveConfirm = true) : (showSettings = false)
            "
          >
            <v-icon> mdi-close </v-icon>
          </v-btn>
        </v-toolbar>
        <v-container class="pa-0 pa-sm-3" v-if="showSettings">
          <v-expansion-panels v-model="settingsPanels" multiple focusable>
            <v-expansion-panel>
              <v-expansion-panel-header> Rules </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-list>
                  <x-list-item label="Recovery & Backup">
                    <v-btn class="ma-1" @click="importConfig()">
                      <v-icon> mdi-file-import </v-icon>
                      Import
                    </v-btn>
                    <v-btn class="ma-1" @click="exportConfig()">
                      <v-icon> mdi-file-export </v-icon>
                      Export
                    </v-btn>
                  </x-list-item>
                  <v-divider></v-divider>
                  <x-list-item label="Grouping">
                    <v-switch
                      class="ma-1"
                      :label="
                        settings.options_group_rules ? 'Enabled' : 'Disabled'
                      "
                      inset
                      hide-details
                      v-model="settings.options_group_rules"
                      @change="saveSettings({ options_group_rules: $event })"
                    ></v-switch>
                  </x-list-item>
                  <v-divider></v-divider>
                  <x-list-item label="Global Status">
                    <v-switch
                      class="ma-1"
                      :label="settings.global_status ? 'Enabled' : 'Disabled'"
                      inset
                      hide-details
                      v-model="settings.global_status"
                      @change="saveSettings({ global_status: $event })"
                    ></v-switch>
                  </x-list-item>
                  <v-divider></v-divider>
                  <x-list-item
                    :style="{ opacity: settings.global_status ? 1 : 0.7 }"
                    :label="configs.global_test.name"
                    @keydown.native.ctrl.83.prevent="
                      saveLazySettings('global_test')
                    "
                  >
                    <x-exp-editor
                      type="global_test"
                      tpl-inherit-type="test"
                      v-model.trim="lazySettingsData.global_test.exp"
                      :settings="settings"
                      @change:template="(value) => saveTemplate('test', value)"
                    >
                      <template #default="{ value, error }">
                        <v-text-field
                          v-if="lazySettingsData.global_test.exp"
                          v-model.trim="test"
                          label="Test URL / details"
                          clearable
                          persistent-hint
                          :hint="
                            test && value
                              ? JSON.stringify(
                                  getAsyncResult(
                                    'global_test',
                                    (...args) => matchAsync(...args),
                                    [test, value],
                                    null
                                  )
                                )
                              : undefined
                          "
                        ></v-text-field>
                        <v-btn
                          class="ma-1"
                          color="primary"
                          :disabled="error !== undefined"
                          @click="saveLazySettings('global_test')"
                        >
                          <v-icon> mdi-content-save-edit </v-icon>
                          Save
                        </v-btn>
                        <v-btn
                          class="ma-1"
                          @click="resetLazySettings('global_test')"
                          :disabled="!isLazySettingsChanged('global_test')"
                        >
                          <v-icon> mdi-restore </v-icon>
                          Reset
                        </v-btn>
                      </template>
                    </x-exp-editor>
                  </x-list-item>
                </v-list>
              </v-expansion-panel-content>
            </v-expansion-panel>
            <v-expansion-panel>
              <v-expansion-panel-header> Code Editor </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-list>
                  <x-list-item label="Status">
                    <v-switch
                      class="ma-1"
                      :label="settings.code_editor ? 'Enabled' : 'Disabled'"
                      inset
                      hide-details
                      v-model="lazySettingsData.code_editor"
                      :loading="isLazySettingsChanged('code_editor')"
                      @change="onToggleCodeEditor"
                    ></v-switch>
                  </x-list-item>
                  <v-divider></v-divider>
                  <x-list-item
                    :style="{ opacity: settings.code_editor ? 1 : 0.7 }"
                    label="Autoclose when invisible"
                  >
                    <v-chip-group
                      active-class="primary--text"
                      v-model="settings.code_editor_idle_timeout"
                      @change="
                        saveSettings({ code_editor_idle_timeout: $event })
                      "
                    >
                      <v-chip label :value="5">5s</v-chip>
                      <v-chip label :value="10">10s</v-chip>
                      <v-chip label :value="15">15s</v-chip>
                      <v-chip label :value="30">30s</v-chip>
                      <v-chip label :value="false">Never</v-chip>
                    </v-chip-group>
                  </x-list-item>
                  <v-divider></v-divider>
                  <x-list-item
                    :style="{ opacity: settings.code_editor ? 1 : 0.7 }"
                    :label="configs.code_editor_init.name"
                    @keydown.native.ctrl.83.prevent="
                      saveLazySettings('code_editor_init')
                    "
                  >
                    <x-exp-editor
                      type="code_editor_init"
                      v-model.trim="lazySettingsData.code_editor_init"
                      :settings="settings"
                      @change:template="
                        (value) => saveTemplate('code_editor_init', value)
                      "
                    >
                      <template #default="{ error }">
                        <v-btn
                          class="ma-1"
                          color="primary"
                          :disabled="error !== undefined"
                          @click="saveLazySettings('code_editor_init')"
                        >
                          <v-icon> mdi-content-save-edit </v-icon>
                          Save
                        </v-btn>
                        <v-btn
                          class="ma-1"
                          @click="resetLazySettings('code_editor_init')"
                          :disabled="!isLazySettingsChanged('code_editor_init')"
                        >
                          <v-icon> mdi-restore </v-icon>
                          Reset
                        </v-btn>
                      </template>
                    </x-exp-editor>
                  </x-list-item>
                </v-list>
              </v-expansion-panel-content>
            </v-expansion-panel>
            <v-expansion-panel>
              <v-expansion-panel-header> Security </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-list>
                  <x-list-item label="Unsafe eval">
                    <v-checkbox
                      label="Enable check code syntax"
                      v-model="settings.exp_verify_syntax"
                      @change="saveSettings({ exp_verify_syntax: $event })"
                      dense
                      hide-details
                    ></v-checkbox>
                    <v-checkbox
                      label="Allow object literal as search condition"
                      v-model="settings.search_parse_js_object"
                      @change="saveSettings({ search_parse_js_object: $event })"
                      dense
                      hide-details
                    ></v-checkbox>
                  </x-list-item>
                  <v-divider></v-divider>
                  <x-list-item label="Permissions">
                    <x-permissions
                      @alert="(o) => alert(o.message, o.timeout)"
                    ></x-permissions>
                  </x-list-item>
                </v-list>
              </v-expansion-panel-content>
            </v-expansion-panel>
            <v-expansion-panel>
              <v-expansion-panel-header>
                Miscellaneous
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-list>
                  <x-list-item label="Tab stats refresh delay">
                    <v-slider
                      v-model="settings.tab_info_throttle"
                      @change="saveSettings({ tab_info_throttle: $event })"
                      :min="100"
                      :max="5000"
                      :step="100"
                      class="align-center"
                      hide-details
                    >
                      <template v-slot:append>
                        <span
                          class="subheading font-weight-light ml-1"
                          style="width: 60px"
                        >
                          {{ settings.tab_info_throttle }}ms
                        </span>
                      </template>
                    </v-slider>
                  </x-list-item>
                  <v-divider></v-divider>
                  <x-list-item label="Popup">
                    <v-checkbox
                      label="Auto close popup when go to new page"
                      v-model="settings.popup_auto_close"
                      @change="saveSettings({ popup_auto_close: $event })"
                      dense
                      hide-details
                    ></v-checkbox>
                  </x-list-item>
                  <v-divider></v-divider>
                  <x-list-item
                    label="Debugging matched requests"
                    help="https://extensionworkshop.com/documentation/develop/debugging/#debugging-background-scripts"
                  >
                    <v-radio-group
                      class="my-0"
                      dense
                      hide-details
                      v-model="settings.request_verbose"
                      @change="saveSettings({ request_verbose: $event })"
                    >
                      <v-radio :value="0" label="Off" dense></v-radio>
                      <v-radio
                        :value="1"
                        label="Log `tabId` and `URL` to console"
                      ></v-radio>
                      <v-radio
                        :value="2"
                        label="Log `details` object to console"
                      ></v-radio>
                    </v-radio-group>
                  </x-list-item>
                  <v-divider></v-divider>
                  <x-list-item
                    label="Before loading rules"
                    @keydown.native.ctrl.83.prevent="saveLazySettings('init')"
                  >
                    <x-exp-editor
                      type="init"
                      v-model.trim="lazySettingsData.init.exp"
                      :settings="settings"
                      @change:template="(value) => saveTemplate('init', value)"
                    >
                      <template #append-btn="{ value }">
                        <x-tooltip left title="Execute Now">
                          <v-btn
                            icon
                            @click="execInit()"
                            :disabled="
                              !settings.init.exp ||
                              isLazySettingsChanged('init') ||
                              value != settings.init.exp
                            "
                          >
                            <v-icon> mdi-play </v-icon>
                          </v-btn>
                        </x-tooltip>
                      </template>
                      <template #default="{ error }">
                        <v-btn
                          class="ma-1"
                          color="primary"
                          :disabled="error !== undefined"
                          @click="saveLazySettings('init')"
                        >
                          <v-icon> mdi-content-save-edit </v-icon>
                          Save
                        </v-btn>
                        <v-btn
                          class="ma-1"
                          @click="resetLazySettings('init')"
                          :disabled="!isLazySettingsChanged('init')"
                        >
                          <v-icon> mdi-restore </v-icon>
                          Reset
                        </v-btn>
                      </template>
                    </x-exp-editor>
                  </x-list-item>
                </v-list>
                <v-divider></v-divider>
                <x-list-item label="Restart">
                  <v-btn class="ma-1" @click="reload()">
                    <v-icon> mdi-reload </v-icon>
                    Reload this extension
                  </v-btn>
                </x-list-item>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
          <v-card flat class="transparent" style="height: 50vh"></v-card>
        </v-container>
      </v-card>
    </v-dialog>
  </v-app>
</template>
<script>
import XExpEditor from "./components/XExpEditor.vue";
import XListItem from "./components/XListItem.vue";
import XPermissions from "./components/XPermissions.vue";
import XTableGroupHeader from "./components/XTableGroupHeader.vue";
import XTooltip from "./components/XTooltip.vue";

export default {
  vuetify: new Vuetify(),
  components: {
    XVNodes: {
      functional: true,
      render: (h, ctx) => ctx.props.vnodes,
    },
    XExpEditor,
    XListItem,
    XPermissions,
    XTableGroupHeader,
    XTooltip,
  },
  mounted() {
    let loadSettings = (results) => {
      if (!results) return;
      for (let key in results) {
        switch (key) {
          case "rules":
            this.$set(this, key, results[key] || []);
            if (this.ruleId && !this.showEditor) {
              let index = this.rules.findIndex((r) => r.id == this.ruleId);
              this.editRule(index);
            }
            break;
          default: {
            let value = results[key];
            switch (key) {
              case "init":
                util._init_code = value;
                util.init();
                break;
              case "options_group_rules":
                if (this.grouping === null) {
                  this.grouping = value;
                }
                break;
            }
            this.$set(this.settings, key, results[key]);
            break;
          }
        }
      }
      if (this.showSettings && this.changed && !this.isLazySettingsChanged()) {
        this.changed = false;
      }
    };
    util.getSettings(null, loadSettings, true);
    let beforeunload = (event) => {
      if (this.changed && (this.showEditor || this.showSettings)) {
        event.preventDefault();
        return (event.returnValue = "");
      }
    };
    self.addEventListener("beforeunload", beforeunload);
    util.destroy(() => {
      self.removeEventListener("beforeunload", beforeunload);
    });
  },
  beforeDestroy() {
    util.destroy();
  },
  props: {
    ruleId: String,
  },
  data() {
    return {
      search: "",
      group: null,
      grouping: null,
      groupBy: [],
      rules: [],
      settings: {
        global_test: { exp: "" },
      },
      lazySettingsData: null,
      showEditor: false,
      showSettings: false,
      editIndex: -1,
      rule: {},
      changed: false,
      showUnsaveConfirm: false,
      showDeleteConfirm: false,
      snackbar: {
        show: false,
        msg: "",
        html: null,
        timeout: -1,
        timestamp: 0,
      },
      deleteIndex: -1,
      deleteGroupName: false,
      asyncResult: {},
      expansionPanels: [0, 1],
      settingsPanels: [0],
      test: "",
    };
  },
  computed: {
    groups() {
      return [
        ...new Set(
          this.rules.map((r) => r.group || "").filter((n) => n !== "")
        ),
      ].sort();
    },
    groupItems() {
      return [
        {
          label: "Ungrouped",
          value: "",
        },
        ...this.groups.map((v) => ({ label: v, value: v })),
      ];
    },
    tableHeaders() {
      return [
        {
          text: "Index",
          value: "index",
          groupable: false,
        },
        {
          text: "Name",
          value: "name",
          groupable: false,
        },
        ...(null === this.group
          ? [
              {
                text: "Group",
                value: "group",
                groupable: true,
              },
            ]
          : []),
        {
          text: "Status",
          value: "enable",
          groupable: false,
        },
        {
          text: "Actions",
          value: "action",
          groupable: false,
          sortable: false,
          align: "end",
        },
      ];
    },
    tableItems() {
      return this.rules
        .map((rule, i) => ({
          index: i,
          key: rule.id || `index_${i}`,
          ...rule,
        }))
        .filter(
          (rule) => null === this.group || (rule.group || "") === this.group
        );
    },
    configs() {
      return configs || {};
    },
    draggable() {
      if (this.group !== null) return false;
      // XXX
      let table = this.$refs.table;
      if (!table || !table.$children[0]) return false;
      let options = table.$children[0].$data.internalOptions;
      if (options.groupBy.length) return false;
      if (options.sortBy.length) return false;
      return true;
    },
    mainColor() {
      return this.settings.global_status ? "primary" : "grey";
    },
  },
  methods: {
    itemStyle(type) {
      let exp = "";
      if (this.rule[type] && this.rule[type].exp) exp = this.rule[type].exp;
      let valid = exp
        ? !this.settings.exp_verify_syntax ||
          true === util.validExp(util.normalFuncExp(exp, type), "function")
        : !this.configs[type].required;
      return {
        color: valid ? undefined : "red",
        opacity: valid && !exp ? 0.5 : undefined,
      };
    },
    editRule(index, rule = null) {
      let i = -1;
      if (this.rules[index]) {
        i = index;
        rule = JSON.parse(JSON.stringify(this.rules[i]));
      }
      let changed = index == -1 && rule;
      if (!rule) rule = { enable: true };
      if (!rule["id"]) rule["id"] = new Date().valueOf();
      this.$set(this.$data, "editIndex", i);
      this.$set(this.$data, "rule", rule);
      this.$set(this.$data, "showEditor", true);
      setTimeout(() => (this.changed = changed), 1);
    },
    copyRule(index) {
      let rule = {};
      if (this.rules[index]) {
        rule = JSON.parse(JSON.stringify(this.rules[index]));
      }
      rule["id"] = new Date().valueOf();
      // XXX
      rule["name"] = (rule.name || "Unnamed").replace(
        /(?: copy(?: (\d+))?)?$/,
        (match, i) => {
          i = parseInt(i ? i : match ? 1 : 0) + 1;
          return ` copy${i == 1 ? "" : " " + i}`;
        }
      );
      this.editRule(-1, rule);
    },
    verifyRule() {
      let rule = JSON.parse(JSON.stringify(this.rule));
      // XXX
      if (!rule.test || !rule.test.exp) return false;
      if (!this.settings.exp_verify_syntax) return true;
      try {
        util.rules2JSON(util.JSON2Rules(rule, true));
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    },
    alert(msg, timeout) {
      if (this.snackbar.show && this.snackbar.timestamp > Date.now() - 1500) {
        setTimeout(() => {
          this.snackbar.show = false;
          this.alert(msg, timeout);
        }, Math.max(1, this.snackbar.timestamp + 1500 - Date.now()));
        return;
      }
      let html = null;
      if (msg instanceof HTMLElement) {
        html = msg.outerHTML;
        msg = msg.textContent;
      }
      this.$set(this.$data, "snackbar", {
        msg: msg,
        html: html,
        show: true,
        timeout: undefined === timeout ? 2000 : timeout,
        timestamp: Date.now(),
      });
    },
    beforeSave() {
      let lastActiveElement = document.activeElement;
      if (lastActiveElement) {
        try {
          lastActiveElement.dispatchEvent(
            new Event("blur", { bubbles: true, cancelable: true })
          );
          document.body.click();
          setTimeout(() => {
            try {
              lastActiveElement.dispatchEvent(
                new Event("focus", { bubbles: true, cancelable: true })
              );
              lastActiveElement.click();
            } catch (e) {
              console.warn(e);
            }
          }, 0);
        } catch (e) {
          console.warn(e);
        }
      }
    },
    saveRule() {
      this.beforeSave();
      return new Promise((resolve) => {
        setTimeout(() => {
          if (!this.verifyRule()) return resolve(false);
          this.rule.updateTime = new Date().valueOf();
          let rule = JSON.parse(JSON.stringify(this.rule));
          console.log(this.editIndex, rule);
          if (this.editIndex == -1) {
            this.editIndex = this.rules.push(rule) - 1;
          } else {
            this.$set(this.rules, this.editIndex, rule);
          }
          this.saveRules(() => {
            this.changed = false;
            resolve(true);
          });
          return;
        }, 200);
      });
    },
    saveRules(callback) {
      this.saveSettings({ rules: this.rules }, "Rule Saved", callback);
      return true;
    },
    deleteRule(index, force) {
      if (force) {
        this.rules.splice(index, 1);
        this.saveRules();
        this.showDeleteConfirm = false;
        this.deleteIndex = -1;
      } else {
        this.deleteIndex = index;
        this.showDeleteConfirm = true;
      }
      return true;
    },
    renameGroup(from, to) {
      from = from || "";
      for (let rule of this.rules) {
        if ((rule.group || "") === from) {
          rule.group = to;
        }
      }
      if (this.group !== null && (this.group || "") === from) {
        this.group = to;
      }
      this.saveRules();
    },
    deleteGroup(name, force) {
      if (force) {
        this.rules = this.rules.filter((rule) => (rule.group || "") !== name);
        this.saveRules();
        this.showDeleteConfirm = false;
        this.deleteGroupName = false;
      } else {
        this.deleteGroupName = name;
        this.showDeleteConfirm = true;
      }
      return true;
    },
    saveTemplate(type, value) {
      if (!this.settings.template) this.$set(this.settings, "template", {});
      this.$set(this.settings.template, type, value);
      this.saveSettings({ template: this.settings.template }, "Template Saved");
    },
    saveSettings(settings, msg, callback) {
      util.setSettings(settings, () => {
        if (callback) callback();
        this.alert(msg || "Settings Saved");
      });
      return true;
    },
    resetLazySettings(key = null) {
      if (key === null) {
        this.lazySettingsData = JSON.parse(JSON.stringify(this.settings));
        setTimeout(() => (this.changed = false), 1);
      } else {
        this.$set(
          this.lazySettingsData,
          key,
          JSON.parse(JSON.stringify(this.settings[key]))
        );
      }
    },
    saveLazySettings(key) {
      this.beforeSave();
      return new Promise((resolve) => {
        setTimeout(() => {
          if (this.lazySettingsData[key] && this.lazySettingsData[key].exp) {
            if (this.verifyExp(this.lazySettingsData[key].exp, key) !== true) {
              return resolve(false);
            }
          }
          this.saveSettings({ [key]: this.lazySettingsData[key] }, null, () => {
            resolve(true);
          });
        }, 200);
      });
    },
    isLazySettingsChanged(key = null) {
      // XXX
      if (key === null) {
        for (let key in this.lazySettingsData) {
          if (this.isLazySettingsChanged(key)) return true;
        }
        return false;
      }
      return (
        JSON.stringify(this.settings[key]) !==
        JSON.stringify(this.lazySettingsData[key])
      );
    },
    async onToggleCodeEditor(value) {
      if (value) {
        try {
          let r = await codeEditor.getEnv();
          console.debug(r);
        } catch (e) {
          console.warn(e);
          await new Promise((r) => setTimeout(r, 500));
          this.resetLazySettings("code_editor");
          let message = e;
          if (!e) message = "Unknown";
          else if (e.data) message = e.data;
          else if (e.message) message = e.message;
          let $n = document.createElement("div");
          $n.innerHTML =
            'This feature requires the <a href="https://addons.mozilla.org/en-US/firefox/addon/code-editor/" target="blank">Code Editor</a> extension to be installed.<br>Error: ';
          $n.insertAdjacentText("beforeend", message);
          this.alert($n, Infinity);
          return;
        }
      }
      this.saveSettings({ code_editor: value });
    },
    verifyExp(exp, type) {
      if (!this.settings.exp_verify_syntax) return true;
      return util.validExp(util.normalFuncExp(exp, type), "function");
    },
    execInit() {
      util.sendMessage("init");
      util.init(false);
    },
    reload() {
      browser.runtime.reload();
    },
    importConfig() {
      let that = this;
      let element = document.createElement("input");
      element.setAttribute("type", "file");
      element.setAttribute("accept", ".json, application/json");
      element.style.display = "none";
      element.onchange = function (event) {
        console.log(event);
        let file = this.files[0];
        if (!file) return;
        let reader = new FileReader();
        reader.onerror = (event) => {
          that.alert("Failed to read file: " + reader.error, Infinity);
          reader.abort();
        };
        reader.onload = (event) => {
          let text = event.target.result;
          try {
            let config = JSON.parse(text);
            let rules = [];
            if (!config) throw "configuration not found";
            if (Array.isArray(config)) {
              rules = config;
              config = null;
            } else {
              rules = config.rules;
            }
            if (!Array.isArray(rules)) throw "rules should be an array";
            let ruleIds = that.rules.map((rule) => rule.id);
            let resetId = new Date().valueOf();
            console.debug(rules);
            rules.forEach((rule) => {
              if (rule["id"] && ruleIds.indexOf(rule["id"]) > -1) {
                let rule0 = JSON.parse(
                  JSON.stringify(that.rules.find((r) => r.id === rule.id))
                );
                if (rule0.updateTime === rule.updateTime) {
                  console.log("same rule:", rule["id"], rule0, rule);
                  return;
                }
              }
              if (!rule["id"] || ruleIds.indexOf(rule["id"]) > -1)
                rule["id"] = resetId++;
              that.rules.push(rule);
            });
            if (config) {
              config.rules = that.rules;
              that.saveSettings(config);
            } else {
              that.saveRules();
            }
          } catch (e) {
            that.alert(e, Infinity);
          }
        };
        reader.readAsText(file);
      };
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    },
    exportConfig(data, subname = null) {
      if (!data) {
        data = JSON.parse(JSON.stringify(this.settings || {}));
        data.rules = this.rules || [];
      }
      let json = JSON.stringify(data, null, "\t");
      let filename = `webRequest_${new Date().toJSON().replace(/:/g, "")}${
        subname !== null ? "_" + subname : ""
      }.json`;
      // console.log(json);
      let blob = new Blob([json], { type: "application/json;charset=utf-8" });
      let element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.setAttribute("download", filename);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      URL.revokeObjectURL(element.href);
      document.body.removeChild(element);
    },
    match(rule) {
      if (!this.search) return true;
      let search = this.search;
      search = search.replace(/^(['"])(.+)\1$/, "$2");
      if (rule.name && rule.name.toLowerCase().includes(search.toLowerCase()))
        return true;
      if (search != this.search) return false;
      return this.getAsyncResult(
        `index_${rule.index}`,
        (...args) => this.matchAsync(...args),
        [this.search, rule.test.exp, true],
        false
      );
    },
    getAsyncResult(key, func, args = [], def = null, debounce = 500) {
      const test = JSON.stringify(args);
      if (this.asyncResult[key]) {
        if (test === this.asyncResult[key].test) {
          return this.asyncResult[key].result;
        }
        if (this.asyncResult[key].timeoutId) {
          clearTimeout(this.asyncResult[key].timeoutId);
        }
      }
      let handler = () => {
        func(...args).then((r) => {
          if (test !== this.asyncResult[key].test) return;
          this.asyncResult[key].result = r;
          this.asyncResult[key].timeoutId = null;
        });
      };
      this.$set(this.asyncResult, key, {
        test,
        result: def,
        timeoutId: setTimeout(handler, debounce),
      });
    },
    async matchAsync(search, exp, execGlobalTest = false) {
      let details = {};
      if (search.startsWith("{") && search.endsWith("}")) {
        try {
          if (this.settings.search_parse_js_object) {
            details = await util.exec(search);
          } else {
            details = JSON.parse(search);
          }
        } catch (e) {
          console.debug(e);
          return false;
        }
      } else {
        details.url = search;
      }
      if (details.url && !/^[a-z][a-z\d\+\.\-]*:/i.test(details.url)) {
        details.url = "http://" + details.url;
        try {
          new URL(details.url);
        } catch (e) {
          return false;
        }
      }
      try {
        let test = await util.exec(util.normalFuncExp(exp, "test"));
        if ("function" !== typeof test) return false;
        const share = {};
        try {
          if (
            execGlobalTest &&
            this.settings.global_test &&
            this.settings.global_test.exp
          ) {
            let global_test = await util.exec(
              util.normalFuncExp(this.settings.global_test.exp, "test")
            );
            if ("function" === typeof global_test) {
              await global_test.call({}, details, share);
            }
          }
        } catch (e) {
          console.warn(e);
        }
        return test.call({ setMatchStatus(v) {} }, details, share);
      } catch (e) {
        console.warn(e);
      }
    },
  },
  watch: {
    rule: {
      deep: true,
      handler(val) {
        this.changed = true;
      },
    },
    lazySettingsData: {
      deep: true,
      handler(val) {
        if (val) this.changed = true;
      },
    },
    showEditor(val) {
      window.name = val ? `edit_${this.rule.id}` : "options";
      this.$router.replace({
        query: { ruleId: val ? "" + this.rule.id : undefined },
      });
    },
    showSettings(val) {
      if (val) {
        this.resetLazySettings();
      } else {
        this.lazySettingsData = null;
      }
    },
    grouping(val) {
      this.groupBy = val ? ["group"] : [];
    },
  },
};
</script>

<style scoped>
@media (min-width: 1200px) {
  .container {
    max-width: 1200px !important;
  }
}
::v-deep .item.mismatch {
  display: none;
  color: gray;
  background-color: #ddd;
}
::v-deep .item.edit {
  background-color: rgba(25, 118, 210, 0.12);
}
.item .handle {
  cursor: grab;
}
::v-deep .item .v-data-table__mobile-row {
  min-height: 32px;
}
.mobile-drag-icon {
  float: right;
  margin-right: -0.25em;
}
.fixed-top-bar {
  position: sticky;
  position: -webkit-sticky;
  top: 0;
  z-index: 2;
}
</style>
