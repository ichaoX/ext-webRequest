<template>
  <div>
    <template v-for="(props, name) in permissions">
      <v-checkbox
        v-if="!props.isOrigin"
        :key="name"
        :label="name"
        v-model="props.enabled"
        @change="onChange(name, $event)"
        :indeterminate="props.pending > 0"
        :disabled="!props.optional || props.pending > 0"
        dense
        hide-details
      ></v-checkbox>
    </template>
    <template v-if="Object.keys(origins).length > 0">
      <v-divider class="my-3"></v-divider>
      <v-list-item-subtitle class="text-wrap"> Origin </v-list-item-subtitle>
      <template v-for="(props, name) in origins">
        <v-checkbox
          :key="name"
          :label="name"
          v-model="props.enabled"
          @change="onChange(name, $event)"
          :indeterminate="props.pending > 0"
          :disabled="!props.optional || props.pending > 0"
          dense
          hide-details
        ></v-checkbox>
      </template>
      <v-text-field
        v-if="isNewOriginEnabled"
        label="Other"
        v-model.trim="newOrigin"
        clearable
      >
        <template #prepend>
          <v-icon :disabled="!newOrigin" @click="onChange(newOrigin, true)">
            mdi-plus
          </v-icon>
        </template>
      </v-text-field>
    </template>
  </div>
</template>
<script>
export default {
  data() {
    return {
      permissions: {},
      context: "x-permissions",
      newOrigin: "",
      isNewOriginEnabled: false,
    };
  },
  mounted() {
    this.loadPermissions();
    let context = util.context(this.context);
    util.addListener(browser.permissions.onAdded, (permissions) => {
      console.debug("added", permissions);
      this.loadPermissions();
    });
    util.addListener(browser.permissions.onRemoved, (permissions) => {
      console.debug("removed", permissions);
      this.loadPermissions();
    });
    util.context(context);
  },
  beforeDestroy() {
    let context = util.context(this.context);
    util.destroy().context(context);
  },
  computed: {
    origins() {
      let r = {};
      let names = [];
      for (let name in this.permissions) {
        if (this.permissions[name].isOrigin) names.push(name);
      }
      names.sort().forEach((e) => {
        r[e] = this.permissions[e];
      });
      return r;
    },
  },
  methods: {
    isOrigin(name) {
      return [
        "<all_urls>",
        /^(https?|wss?|file|ftp|\*):\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$/,
        /^file:\/\/\/.*$/,
        /^resource:\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^about:/,
      ].some((e) => (typeof e == "string" ? e == name : e.test(name)));
    },
    isMatchOrigin(name, origins = []) {
      if (origins.includes(name)) return true;
      if (origins.includes("<all_urls>")) return true;
      // FIXME
      let match;
      if ((match = name.match(/^([^:\/]+):\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$/))) {
        if (origins.includes("*://*/*")) return true;
        if (match[1] != "*" && origins.includes(match[1] + "://*/*"))
          return true;
        if (match[2] != "*") {
          if (
            origins.includes("*://" + match[2] + "/*") ||
            origins.includes(match[1] + "://" + match[2] + "/*")
          )
            return true;
        }
      }
      if (name.endsWith("/") && origins.includes(name + "*")) return true;
      if (
        origins
          .map((e) => e.replace(/\/\*$/, "/"))
          .filter((e) => e.endsWith("/"))
          .some((e) => name.startsWith(e))
      )
        return true;
      return false;
    },
    async loadPermissions() {
      let manifest = browser.runtime.getManifest();
      let optional_permissions = manifest.optional_permissions || [];
      let all = await browser.permissions.getAll();
      let permissions = all.permissions;
      let origins = all.origins;
      let origins0 = (manifest.permissions || []).filter((e) =>
        this.isOrigin(e)
      );
      let optional_origins = optional_permissions.filter((e) =>
        this.isOrigin(e)
      );
      optional_permissions = optional_permissions.filter(
        (e) => !this.isOrigin(e)
      );
      let all_permissions = [
        ...new Set([].concat(optional_permissions, permissions)),
      ].sort();
      let all_origins = [
        ...new Set(
          [].concat(
            optional_origins.filter((e) => !this.isMatchOrigin(e, origins)),
            origins0.filter((e) => !this.isMatchOrigin(e, origins)),
            origins
          )
        ),
      ].sort();
      for (let name of all_permissions) {
        if (!this.permissions[name])
          this.$set(this.permissions, name, {
            enabled: false,
            optional: false,
            pending: 0,
          });
        this.permissions[name].enabled =
          this.permissions[name].pending > 0 || permissions.includes(name);
        this.permissions[name].optional = optional_permissions.includes(name);
        this.permissions[name].isOrigin = false;
      }
      for (let name in this.permissions) {
        if (this.permissions[name].isOrigin && !all_origins.includes(name))
          this.$delete(this.permissions, name);
      }
      let isNewOriginEnabled = false;
      for (let name of all_origins) {
        if (!this.permissions[name])
          this.$set(this.permissions, name, {
            enabled: false,
            optional: false,
            pending: 0,
          });
        this.permissions[name].enabled =
          this.permissions[name].pending > 0 ||
          this.isMatchOrigin(name, origins);
        this.permissions[name].optional =
          this.isMatchOrigin(name, optional_origins) ||
          !this.isMatchOrigin(name, origins);
        this.permissions[name].isOrigin = true;
        if (
          !isNewOriginEnabled &&
          !this.permissions[name].enabled &&
          ("<all_urls>" == name || name.replace(/\/\*$/, "/").includes("*"))
        ) {
          isNewOriginEnabled = true;
        }
      }
      this.isNewOriginEnabled = isNewOriginEnabled;
    },
    async onChange(name, value) {
      try {
        let props = this.permissions[name];
        if (!props) {
          props = {
            enabled: false,
            optional: true,
            pending: 0,
            isOrigin: true,
          };
          this.$set(this.permissions, name, props);
          props = this.permissions[name];
        }
        props.pending = (props.pending || 0) + 1;
        let result = await browser.permissions[value ? "request" : "remove"]({
          [props.isOrigin ? "origins" : "permissions"]: [name],
        });
        console.debug(name, result);
        if (result) {
          if (name == this.newOrigin) this.newOrigin = "";
        }
      } catch (e) {
        console.error(e);
        this.$emit("alert", {
          message: "" + e,
          timeout: Infinity,
        });
      } finally {
        this.permissions[name].pending = Math.max(
          0,
          (this.permissions[name].pending || 0) - 1
        );
        this.loadPermissions();
      }
    },
  },
};
</script>
