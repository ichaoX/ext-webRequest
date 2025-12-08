const { loadModule } = window['vue2-sfc-loader'];

let loadSfc = async (path) => {
    const options = {
        moduleCache: {
            vue: Vue,
        },
        compiledCache: {
            storageKey: 'vue-sfc-cache',
            cache: null,
            get version() {
                return browser.runtime.getManifest().version
            },
            async loadCache() {
                if (!this.cache) {
                    try {
                        let value = (await util.getSettings([this.storageKey]))[this.storageKey];
                        this.cache = (!value || value.version != this.version || !value.data) ? {} : value.data;
                    } catch (e) {
                        this.get = () => null;
                        this.set = () => null;
                        throw e;
                    }
                }
                return this.cache;
            },
            timeoutId: null,
            async set(key, str) {
                try {
                    await this.loadCache();
                    this.cache[key] = str;
                    if (this.timeoutId) return;
                    this.timeoutId = setTimeout(() => {
                        this.timeoutId = null;
                        console.debug('vue-sfc-cache', Object.keys(this.cache));
                        util.setSettings({
                            [this.storageKey]: {
                                version: this.version,
                                data: this.cache,
                            },
                        });
                    }, 2000);
                } catch (e) {
                    console.warn(e);
                    this.set = () => null;
                }
            },
            async get(key) {
                try {
                    await this.loadCache();
                    return this.cache[key];
                } catch (e) {
                    console.warn(e);
                    this.get = () => null;
                }
            },
        },
        async getFile(url) {
            const res = await fetch(url);
            if (!res.ok)
                throw Object.assign(new Error(url + ' ' + res.statusText), { res });
            return await res.text();
        },
        addStyle(textContent) {
            const style = Object.assign(document.createElement('style'), { textContent });
            const ref = document.head.getElementsByTagName('style')[0] || null;
            document.head.insertBefore(style, ref);
        },
    };

    return await loadModule(path, options);
};

const routes = [
    {
        name: 'index',
        path: '/',
        redirect: 'options',
    },
    {
        name: 'options',
        path: '/options',
        component: () => loadSfc('./view/options.vue'),
        props: route => route.query,
    },
    {
        name: 'popup',
        path: '/popup',
        component: () => loadSfc('./view/popup.vue'),
        props: route => route.query,
    },
];

const vuetify = new Vuetify({
    // Initialize with pre-calculated theme to prevent flash of wrong theme
    theme: {
        dark: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
    },
});

const app = new Vue({
    router: new VueRouter({
        routes,
    }),
    vuetify,
}).$mount('#app')

util.theme.onThemeChange = theme => {
    vuetify.framework.theme.dark = theme === 'dark';
};

((context0) => {
    util.getSettings(['theme_mode'], results => {
        util.theme.init(results.theme_mode || 'auto');
    }, true);
    util.context(context0);
})(util.context('page'));
