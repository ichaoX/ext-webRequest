WEBEXT_DIR := $(shell realpath ./src)
EXTERNAL_DIR := $(WEBEXT_DIR)/external

.PHONY: all
all: clean_external external

.PHONY: clean
clean: clean_cache clean_external

.PHONY: clean_cache
clean_cache:
	rm -f cache/*.*

.PHONY: clean_external
clean_external:
	rm -f "$(EXTERNAL_DIR)"/*.js
	rm -rf "$(EXTERNAL_DIR)"/*/

.PHONY: external
external: vuetify SortableJS text-encoding

.PHONY: vuetify
vuetify: fonts \
			cache/vue.js \
			cache/vue-router.js \
			cache/vue2-sfc-loader.js \
			cache/vuetify.zip
	TARGET_DIR="$(EXTERNAL_DIR)" && \
		mkdir -p "$$TARGET_DIR" && \
		cp cache/vue.js "$$TARGET_DIR"
	TARGET_DIR="$(EXTERNAL_DIR)/vue-router/3.x/" && \
		mkdir -p "$$TARGET_DIR" && \
		cp cache/vue-router.js "$$TARGET_DIR"
	TARGET_DIR="$(EXTERNAL_DIR)/vue3-sfc-loader/0.8.4/" && \
		mkdir -p "$$TARGET_DIR" && \
		cp cache/vue2-sfc-loader.js "$$TARGET_DIR"
	TARGET_DIR="$(EXTERNAL_DIR)/vuetify/2.x/" && \
		mkdir -p "$$TARGET_DIR" && \
		unzip cache/vuetify.zip vuetify-v*.min.js vuetify-v*.min.css -d "$$TARGET_DIR" && \
		cd "$$TARGET_DIR" && \
		mv vuetify-v*.js vuetify.js && \
		mv vuetify-v*.css vuetify.css

.PHONY: SortableJS
SortableJS: cache/Sortable.min.js \
			cache/vuedraggable.umd.min.js
	cp cache/Sortable.min.js "$(EXTERNAL_DIR)"
	cp cache/vuedraggable.umd.min.js "$(EXTERNAL_DIR)"

.PHONY: text-encoding
text-encoding: cache/text-encoding.tgz
	TARGET_DIR="$(EXTERNAL_DIR)/text-encoding" && \
		mkdir -p "$$TARGET_DIR" && \
		tar -zxvf cache/text-encoding.tgz -C "$$TARGET_DIR" \
		--strip-components=2 \
		package/lib/

.PHONY: fonts
fonts: cache/mdi.tgz cache/roboto.tgz
	TARGET_DIR="$(EXTERNAL_DIR)/fonts/mdi" && \
		mkdir -p "$$TARGET_DIR" && \
		tar -zxvf cache/mdi.tgz -C "$$TARGET_DIR" \
		--strip-components=1 \
		package/css/materialdesignicons.min.css \
		package/fonts/materialdesignicons-webfont.woff2
	TARGET_DIR="$(EXTERNAL_DIR)/fonts/roboto" && \
		mkdir -p "$$TARGET_DIR" && \
		tar -zxvf cache/roboto.tgz -C "$$TARGET_DIR" \
		--strip-components=1 --wildcards\
		package/latin.css \
		package/files/roboto-latin-[1-9]00-normal.woff2


cache/vue.js:
	wget -O $@ \
	https://unpkg.com/vue@2.6.12/dist/vue.js

cache/vue-router.js:
	wget -O $@ \
	https://unpkg.com/vue-router@3.0.0/dist/vue-router.js

cache/vue2-sfc-loader.js:
	wget -O $@ \
	https://unpkg.com/vue3-sfc-loader@0.8.4/dist/vue2-sfc-loader.js

cache/Sortable.min.js:
	wget -O $@ \
	https://github.com/SortableJS/Sortable/raw/1.8.4/Sortable.min.js

cache/vuedraggable.umd.min.js:
	wget -O $@ \
	https://github.com/SortableJS/Vue.Draggable/raw/v2.20.0/dist/vuedraggable.umd.min.js

cache/vuetify.zip:
	wget -O $@ \
	https://github.com/vuetifyjs/vuetify/releases/download/v2.6.12/vuetify-v2.6.12.zip

cache/text-encoding.tgz:
	wget -O $@ \
	https://registry.npmjs.org/text-encoding/-/text-encoding-0.7.0.tgz

cache/mdi.tgz:
	wget -O $@ \
	https://registry.npmjs.org/@mdi/font/-/font-7.1.96.tgz

cache/roboto.tgz:
	wget -O $@ \
	https://registry.npmjs.org/@fontsource/roboto/-/roboto-5.0.8.tgz
