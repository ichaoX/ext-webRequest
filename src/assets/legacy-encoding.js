(() => {
    const nativeTextEncoder = self.TextEncoder;
    if (!nativeTextEncoder) return;
    // XXX
    self.addEventListener('load', () => {
        if (!self.TextEncoder) self.TextEncoder = nativeTextEncoder;
    });
    Object.defineProperty(self, 'TextEncoder', {
        configurable: true,
        get() {
            return null;
        },
        set(v) {
            if (v !== nativeTextEncoder) {
                self._legacyTextEncoder = v;
            }
            Object.defineProperty(self, 'TextEncoder', {
                configurable: true,
                writable: true,
                value: nativeTextEncoder,
            });
        },
    });
})();
