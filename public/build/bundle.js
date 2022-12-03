
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Banner.svelte generated by Svelte v3.48.0 */

    const file$b = "src/components/Banner.svelte";

    function create_fragment$b(ctx) {
    	let main;

    	const block = {
    		c: function create() {
    			main = element("main");
    			main.textContent = "Hello HELLO";
    			attr_dev(main, "class", "svelte-1w9s6xb");
    			add_location(main, file$b, 3, 0, 20);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Banner', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Banner> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Banner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Banner",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/components/Search.svelte generated by Svelte v3.48.0 */

    const file$a = "src/components/Search.svelte";

    function create_fragment$a(ctx) {
    	let main;
    	let div1;
    	let img;
    	let img_src_value;
    	let t;
    	let div0;
    	let form;
    	let input;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div1 = element("div");
    			img = element("img");
    			t = space();
    			div0 = element("div");
    			form = element("form");
    			input = element("input");
    			if (!src_url_equal(img.src, img_src_value = "search.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "search-icon");
    			attr_dev(img, "class", "svelte-1dr1217");
    			add_location(img, file$a, 7, 4, 111);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "search");
    			attr_dev(input, "name", "search");
    			attr_dev(input, "placeholder", "/Search");
    			attr_dev(input, "class", "svelte-1dr1217");
    			add_location(input, file$a, 10, 8, 206);
    			add_location(form, file$a, 9, 6, 191);
    			attr_dev(div0, "class", "search-field");
    			add_location(div0, file$a, 8, 4, 158);
    			attr_dev(div1, "class", "search-bar svelte-1dr1217");
    			add_location(div1, file$a, 6, 2, 82);
    			attr_dev(main, "class", "svelte-1dr1217");
    			add_location(main, file$a, 5, 0, 73);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			append_dev(div1, img);
    			append_dev(div1, t);
    			append_dev(div1, div0);
    			append_dev(div0, form);
    			append_dev(form, input);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Search', slots, []);
    	let src = "search.png";
    	let alt = "search icon";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Search> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ src, alt });

    	$$self.$inject_state = $$props => {
    		if ('src' in $$props) src = $$props.src;
    		if ('alt' in $$props) alt = $$props.alt;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class Search extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Search",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/components/NavItem.svelte generated by Svelte v3.48.0 */

    const file$9 = "src/components/NavItem.svelte";

    function create_fragment$9(ctx) {
    	let main;
    	let a;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			main = element("main");
    			a = element("a");
    			t0 = text("/");
    			t1 = text(/*label*/ ctx[0]);
    			attr_dev(a, "href", /*href*/ ctx[1]);
    			add_location(a, file$9, 6, 2, 81);
    			attr_dev(main, "class", "svelte-j8wye2");
    			add_location(main, file$9, 5, 0, 72);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, a);
    			append_dev(a, t0);
    			append_dev(a, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*label*/ 1) set_data_dev(t1, /*label*/ ctx[0]);

    			if (dirty & /*href*/ 2) {
    				attr_dev(a, "href", /*href*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NavItem', slots, []);
    	let { label = "One" } = $$props;
    	let { href = "" } = $$props;
    	const writable_props = ['label', 'href'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NavItem> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(0, label = $$props.label);
    		if ('href' in $$props) $$invalidate(1, href = $$props.href);
    	};

    	$$self.$capture_state = () => ({ label, href });

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(0, label = $$props.label);
    		if ('href' in $$props) $$invalidate(1, href = $$props.href);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [label, href];
    }

    class NavItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { label: 0, href: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavItem",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get label() {
    		throw new Error("<NavItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<NavItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<NavItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<NavItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Nav.svelte generated by Svelte v3.48.0 */
    const file$8 = "src/components/Nav.svelte";

    function create_fragment$8(ctx) {
    	let main;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div2;
    	let nav;
    	let navitem0;
    	let t1;
    	let navitem1;
    	let t2;
    	let navitem2;
    	let t3;
    	let navitem3;
    	let t4;
    	let navitem4;
    	let t5;
    	let navitem5;
    	let t6;
    	let div1;
    	let search;
    	let current;

    	navitem0 = new NavItem({
    			props: { href: "#about-section", label: "About" },
    			$$inline: true
    		});

    	navitem1 = new NavItem({
    			props: { href: "#web-section", label: "Web" },
    			$$inline: true
    		});

    	navitem2 = new NavItem({
    			props: { href: "#ios-section", label: "iOS" },
    			$$inline: true
    		});

    	navitem3 = new NavItem({
    			props: {
    				href: "#backend-section",
    				label: "Backend"
    			},
    			$$inline: true
    		});

    	navitem4 = new NavItem({
    			props: { href: "#resume-section", label: "Resume" },
    			$$inline: true
    		});

    	navitem5 = new NavItem({
    			props: {
    				href: "#contact-section",
    				label: "Contact"
    			},
    			$$inline: true
    		});

    	search = new Search({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div2 = element("div");
    			nav = element("nav");
    			create_component(navitem0.$$.fragment);
    			t1 = space();
    			create_component(navitem1.$$.fragment);
    			t2 = space();
    			create_component(navitem2.$$.fragment);
    			t3 = space();
    			create_component(navitem3.$$.fragment);
    			t4 = space();
    			create_component(navitem4.$$.fragment);
    			t5 = space();
    			create_component(navitem5.$$.fragment);
    			t6 = space();
    			div1 = element("div");
    			create_component(search.$$.fragment);
    			if (!src_url_equal(img.src, img_src_value = /*src*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*alt*/ ctx[1]);
    			attr_dev(img, "class", "svelte-1mksf1n");
    			add_location(img, file$8, 9, 4, 184);
    			attr_dev(div0, "class", "logo svelte-1mksf1n");
    			add_location(div0, file$8, 8, 2, 161);
    			attr_dev(nav, "class", "svelte-1mksf1n");
    			add_location(nav, file$8, 12, 4, 244);
    			attr_dev(div1, "class", "search svelte-1mksf1n");
    			add_location(div1, file$8, 20, 4, 591);
    			attr_dev(div2, "class", "nav-search svelte-1mksf1n");
    			add_location(div2, file$8, 11, 2, 215);
    			attr_dev(main, "class", "svelte-1mksf1n");
    			add_location(main, file$8, 7, 0, 152);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, img);
    			append_dev(main, t0);
    			append_dev(main, div2);
    			append_dev(div2, nav);
    			mount_component(navitem0, nav, null);
    			append_dev(nav, t1);
    			mount_component(navitem1, nav, null);
    			append_dev(nav, t2);
    			mount_component(navitem2, nav, null);
    			append_dev(nav, t3);
    			mount_component(navitem3, nav, null);
    			append_dev(nav, t4);
    			mount_component(navitem4, nav, null);
    			append_dev(nav, t5);
    			mount_component(navitem5, nav, null);
    			append_dev(div2, t6);
    			append_dev(div2, div1);
    			mount_component(search, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navitem0.$$.fragment, local);
    			transition_in(navitem1.$$.fragment, local);
    			transition_in(navitem2.$$.fragment, local);
    			transition_in(navitem3.$$.fragment, local);
    			transition_in(navitem4.$$.fragment, local);
    			transition_in(navitem5.$$.fragment, local);
    			transition_in(search.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navitem0.$$.fragment, local);
    			transition_out(navitem1.$$.fragment, local);
    			transition_out(navitem2.$$.fragment, local);
    			transition_out(navitem3.$$.fragment, local);
    			transition_out(navitem4.$$.fragment, local);
    			transition_out(navitem5.$$.fragment, local);
    			transition_out(search.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navitem0);
    			destroy_component(navitem1);
    			destroy_component(navitem2);
    			destroy_component(navitem3);
    			destroy_component(navitem4);
    			destroy_component(navitem5);
    			destroy_component(search);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Nav', slots, []);
    	let src = "logo-small.png";
    	let alt = "logo";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Nav> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Search, NavItem, src, alt });

    	$$self.$inject_state = $$props => {
    		if ('src' in $$props) $$invalidate(0, src = $$props.src);
    		if ('alt' in $$props) $$invalidate(1, alt = $$props.alt);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src, alt];
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nav",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/components/Footer.svelte generated by Svelte v3.48.0 */

    const file$7 = "src/components/Footer.svelte";

    function create_fragment$7(ctx) {
    	let main;
    	let footer;
    	let t0;
    	let br;
    	let t1;
    	let div;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t2;
    	let a1;
    	let img1;
    	let img1_src_value;

    	const block = {
    		c: function create() {
    			main = element("main");
    			footer = element("footer");
    			t0 = text("Alexis Edwards\n    ");
    			br = element("br");
    			t1 = space();
    			div = element("div");
    			a0 = element("a");
    			img0 = element("img");
    			t2 = space();
    			a1 = element("a");
    			img1 = element("img");
    			add_location(br, file$7, 6, 4, 61);
    			if (!src_url_equal(img0.src, img0_src_value = "github.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "github icon");
    			attr_dev(img0, "class", "svelte-1e8cvzo");
    			add_location(img0, file$7, 9, 9, 153);
    			attr_dev(a0, "href", "https://github.com/aedwards4");
    			add_location(a0, file$7, 8, 6, 105);
    			if (!src_url_equal(img1.src, img1_src_value = "linkedin.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "linkedin icon");
    			attr_dev(img1, "class", "svelte-1e8cvzo");
    			add_location(img1, file$7, 12, 9, 286);
    			attr_dev(a1, "href", "https://www.linkedin.com/in/alexis-edwards-93b2981b1/");
    			add_location(a1, file$7, 11, 6, 213);
    			attr_dev(div, "class", "social-media svelte-1e8cvzo");
    			add_location(div, file$7, 7, 4, 72);
    			attr_dev(footer, "class", "svelte-1e8cvzo");
    			add_location(footer, file$7, 4, 2, 29);
    			attr_dev(main, "class", "svelte-1e8cvzo");
    			add_location(main, file$7, 3, 0, 20);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, footer);
    			append_dev(footer, t0);
    			append_dev(footer, br);
    			append_dev(footer, t1);
    			append_dev(footer, div);
    			append_dev(div, a0);
    			append_dev(a0, img0);
    			append_dev(div, t2);
    			append_dev(div, a1);
    			append_dev(a1, img1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/About.svelte generated by Svelte v3.48.0 */

    const file$6 = "src/components/About.svelte";

    function create_fragment$6(ctx) {
    	let main;
    	let link;
    	let t0;
    	let div0;
    	let h1;
    	let t2;
    	let p0;
    	let t4;
    	let p1;
    	let t6;
    	let p2;
    	let t8;
    	let p3;
    	let t10;
    	let div1;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			main = element("main");
    			link = element("link");
    			t0 = space();
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Alexis Vega";
    			t2 = space();
    			p0 = element("p");
    			p0.textContent = "Can you believe my passion for coding began with one of my favorite shows\n      - Silicon Valley? 10/10 recommend! I was so fascinated that I thought I\n      would dust off my Myspace HTML skills and give it a go! And, welp, here I\n      am now!";
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "My journey into coding wasn’t like most. I started school as a Biology\n      major with aspirations of becoming an anesthesiologist. I soon realized\n      this wasn’t the path for me. Fast forward a couple years away from school\n      and I found myself 1: in love with the idea of coding and 2: in love with\n      the city of Chicago! In a short one month’s span I applied to IIT, got\n      accepted, and moved across the country just in time for the 2019 Fall\n      Semester.";
    			t6 = space();
    			p2 = element("p");
    			p2.textContent = "I had several opportunities while in school to expand my knowledge of\n      software engineering. I discovered my interest in topics such as Data\n      Mining, Web Development, and iOS. I had the opportunity to work with\n      technologies such as NLP and GPT2 in order to experiment with classifying\n      hate speech on the internet. I spent a full semester embracing iOS\n      development using Xcode and Swift, only to be granted the opportunity to\n      then tutor students on those same topics I learned, greatly improving my\n      own knowledge in the process. I also spent time self-teaching web\n      development, which proved to be endlessly useful during my summer\n      internship at Grainger. Fun Fact: I built this website using the same\n      technology I learned there! I am proud to say I ended my school career\n      (for now!) with my BS and MCS with a specialization in Software\n      Engineering.";
    			t8 = space();
    			p3 = element("p");
    			p3.textContent = "But I have a life, I swear! When I’m not at my computer, I really enjoy\n      trying new things such as cooking new recipes, discovering local\n      restaurants and bars, and attending neighborhood festivals. What can I\n      say, I’m a foodie!";
    			t10 = space();
    			div1 = element("div");
    			img = element("img");
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://use.typekit.net/gup6qnl.css");
    			add_location(link, file$6, 4, 2, 29);
    			add_location(h1, file$6, 6, 4, 124);
    			add_location(p0, file$6, 7, 4, 149);
    			add_location(p1, file$6, 14, 4, 419);
    			add_location(p2, file$6, 24, 4, 921);
    			add_location(p3, file$6, 40, 4, 1863);
    			attr_dev(div0, "class", "intro svelte-s7vnkl");
    			add_location(div0, file$6, 5, 2, 100);
    			if (!src_url_equal(img.src, img_src_value = "img-home.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "selfie");
    			attr_dev(img, "class", "svelte-s7vnkl");
    			add_location(img, file$6, 47, 25, 2161);
    			attr_dev(div1, "class", "about-img svelte-s7vnkl");
    			add_location(div1, file$6, 47, 2, 2138);
    			attr_dev(main, "class", "svelte-s7vnkl");
    			add_location(main, file$6, 3, 0, 20);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, link);
    			append_dev(main, t0);
    			append_dev(main, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t2);
    			append_dev(div0, p0);
    			append_dev(div0, t4);
    			append_dev(div0, p1);
    			append_dev(div0, t6);
    			append_dev(div0, p2);
    			append_dev(div0, t8);
    			append_dev(div0, p3);
    			append_dev(main, t10);
    			append_dev(main, div1);
    			append_dev(div1, img);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('About', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/Web.svelte generated by Svelte v3.48.0 */

    const file$5 = "src/components/Web.svelte";

    function create_fragment$5(ctx) {
    	let main;
    	let h1;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Web Apps";
    			add_location(h1, file$5, 3, 2, 28);
    			add_location(main, file$5, 2, 0, 19);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Web', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Web> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Web extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Web",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/ios.svelte generated by Svelte v3.48.0 */

    const file$4 = "src/components/ios.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let h1;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "iOS Apps";
    			add_location(h1, file$4, 3, 2, 28);
    			add_location(main, file$4, 2, 0, 19);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Ios', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Ios> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Ios extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ios",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/Backend.svelte generated by Svelte v3.48.0 */

    const file$3 = "src/components/Backend.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let h1;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Backend Apps";
    			add_location(h1, file$3, 3, 2, 28);
    			add_location(main, file$3, 2, 0, 19);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Backend', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Backend> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Backend extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Backend",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/Resume.svelte generated by Svelte v3.48.0 */

    const file$2 = "src/components/Resume.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let section;
    	let div0;
    	let t2;
    	let div1;
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Resume";
    			t1 = space();
    			section = element("section");
    			div0 = element("div");
    			t2 = space();
    			div1 = element("div");
    			iframe = element("iframe");
    			add_location(h1, file$2, 3, 2, 28);
    			attr_dev(div0, "class", "background svelte-1nqh15f");
    			add_location(div0, file$2, 5, 4, 75);
    			attr_dev(iframe, "title", "resume");
    			if (!src_url_equal(iframe.src, iframe_src_value = "resume.pdf")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "class", "svelte-1nqh15f");
    			add_location(iframe, file$2, 7, 6, 130);
    			attr_dev(div1, "class", "doc svelte-1nqh15f");
    			add_location(div1, file$2, 6, 4, 106);
    			attr_dev(section, "class", "resume svelte-1nqh15f");
    			add_location(section, file$2, 4, 2, 46);
    			add_location(main, file$2, 2, 0, 19);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, section);
    			append_dev(section, div0);
    			append_dev(section, t2);
    			append_dev(section, div1);
    			append_dev(div1, iframe);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Resume', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Resume> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Resume extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Resume",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Contact.svelte generated by Svelte v3.48.0 */

    const file$1 = "src/components/Contact.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let section0;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t2;
    	let div1;
    	let form;
    	let label0;
    	let t4;
    	let input0;
    	let t5;
    	let label1;
    	let t7;
    	let input1;
    	let t8;
    	let label2;
    	let t10;
    	let textarea;
    	let t11;
    	let br;
    	let t12;
    	let input2;
    	let t13;
    	let section1;
    	let img1;
    	let img1_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Get in Touch!";
    			t1 = space();
    			section0 = element("section");
    			div0 = element("div");
    			img0 = element("img");
    			t2 = space();
    			div1 = element("div");
    			form = element("form");
    			label0 = element("label");
    			label0.textContent = "Name";
    			t4 = space();
    			input0 = element("input");
    			t5 = space();
    			label1 = element("label");
    			label1.textContent = "E-Mail";
    			t7 = space();
    			input1 = element("input");
    			t8 = space();
    			label2 = element("label");
    			label2.textContent = "Message";
    			t10 = space();
    			textarea = element("textarea");
    			t11 = space();
    			br = element("br");
    			t12 = space();
    			input2 = element("input");
    			t13 = space();
    			section1 = element("section");
    			img1 = element("img");
    			add_location(h1, file$1, 11, 2, 159);
    			if (!src_url_equal(img0.src, img0_src_value = "cats.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "cats");
    			attr_dev(img0, "class", "svelte-ke4q2q");
    			add_location(img0, file$1, 14, 6, 250);
    			attr_dev(div0, "class", "cats svelte-ke4q2q");
    			attr_dev(div0, "id", "prompt");
    			add_location(div0, file$1, 13, 4, 213);
    			attr_dev(label0, "for", "name");
    			add_location(label0, file$1, 23, 8, 483);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "name");
    			add_location(input0, file$1, 24, 8, 522);
    			attr_dev(label1, "for", "email");
    			add_location(label1, file$1, 26, 8, 565);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "name", "email");
    			add_location(input1, file$1, 27, 8, 607);
    			attr_dev(label2, "for", "comment");
    			add_location(label2, file$1, 29, 8, 651);
    			attr_dev(textarea, "name", "comment");
    			attr_dev(textarea, "cols", "40");
    			attr_dev(textarea, "rows", "5");
    			add_location(textarea, file$1, 30, 8, 696);
    			add_location(br, file$1, 31, 8, 751);
    			attr_dev(input2, "type", "submit");
    			input2.value = "Send";
    			attr_dev(input2, "id", "send-btn");
    			add_location(input2, file$1, 32, 8, 766);
    			attr_dev(form, "action", "mailto:504alexise@gmail.com");
    			attr_dev(form, "method", "post");
    			attr_dev(form, "enctype", "text/plain");
    			add_location(form, file$1, 17, 6, 332);
    			attr_dev(div1, "class", "contact-form svelte-ke4q2q");
    			add_location(div1, file$1, 16, 4, 299);
    			attr_dev(section0, "style", /*prompt*/ ctx[1]);
    			add_location(section0, file$1, 12, 2, 184);
    			if (!src_url_equal(img1.src, img1_src_value = "cats-sent.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "cats");
    			attr_dev(img1, "class", "svelte-ke4q2q");
    			add_location(img1, file$1, 38, 4, 903);
    			attr_dev(section1, "class", "cats-sent svelte-ke4q2q");
    			attr_dev(section1, "style", /*sent*/ ctx[0]);
    			add_location(section1, file$1, 37, 2, 858);
    			add_location(main, file$1, 10, 0, 150);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, section0);
    			append_dev(section0, div0);
    			append_dev(div0, img0);
    			append_dev(section0, t2);
    			append_dev(section0, div1);
    			append_dev(div1, form);
    			append_dev(form, label0);
    			append_dev(form, t4);
    			append_dev(form, input0);
    			append_dev(form, t5);
    			append_dev(form, label1);
    			append_dev(form, t7);
    			append_dev(form, input1);
    			append_dev(form, t8);
    			append_dev(form, label2);
    			append_dev(form, t10);
    			append_dev(form, textarea);
    			append_dev(form, t11);
    			append_dev(form, br);
    			append_dev(form, t12);
    			append_dev(form, input2);
    			append_dev(main, t13);
    			append_dev(main, section1);
    			append_dev(section1, img1);

    			if (!mounted) {
    				dispose = listen_dev(form, "submit", /*handleSubmit*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*prompt*/ 2) {
    				attr_dev(section0, "style", /*prompt*/ ctx[1]);
    			}

    			if (dirty & /*sent*/ 1) {
    				attr_dev(section1, "style", /*sent*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let prompt;
    	let sent;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Contact', slots, []);

    	function handleSubmit(event) {
    		$$invalidate(1, prompt = "display: none");
    		$$invalidate(0, sent = "");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Contact> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ handleSubmit, sent, prompt });

    	$$self.$inject_state = $$props => {
    		if ('sent' in $$props) $$invalidate(0, sent = $$props.sent);
    		if ('prompt' in $$props) $$invalidate(1, prompt = $$props.prompt);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$invalidate(1, prompt = "");
    	$$invalidate(0, sent = "display: none");
    	return [sent, prompt, handleSubmit];
    }

    class Contact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contact",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.48.0 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let nav;
    	let t0;
    	let a0;
    	let about;
    	let t1;
    	let a1;
    	let web;
    	let t2;
    	let a2;
    	let ios;
    	let t3;
    	let a3;
    	let backend;
    	let t4;
    	let a4;
    	let resume;
    	let t5;
    	let a5;
    	let contact;
    	let t6;
    	let footer;
    	let current;
    	nav = new Nav({ $$inline: true });
    	about = new About({ $$inline: true });
    	web = new Web({ $$inline: true });
    	ios = new Ios({ $$inline: true });
    	backend = new Backend({ $$inline: true });
    	resume = new Resume({ $$inline: true });
    	contact = new Contact({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(nav.$$.fragment);
    			t0 = space();
    			a0 = element("a");
    			create_component(about.$$.fragment);
    			t1 = space();
    			a1 = element("a");
    			create_component(web.$$.fragment);
    			t2 = space();
    			a2 = element("a");
    			create_component(ios.$$.fragment);
    			t3 = space();
    			a3 = element("a");
    			create_component(backend.$$.fragment);
    			t4 = space();
    			a4 = element("a");
    			create_component(resume.$$.fragment);
    			t5 = space();
    			a5 = element("a");
    			create_component(contact.$$.fragment);
    			t6 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(a0, "id", "about-section");
    			add_location(a0, file, 14, 2, 482);
    			attr_dev(a1, "id", "web-section");
    			add_location(a1, file, 15, 2, 520);
    			attr_dev(a2, "id", "ios-section");
    			add_location(a2, file, 16, 2, 554);
    			attr_dev(a3, "id", "backend-section");
    			add_location(a3, file, 17, 2, 588);
    			attr_dev(a4, "id", "resume-section");
    			add_location(a4, file, 18, 2, 630);
    			attr_dev(a5, "id", "contact-section");
    			add_location(a5, file, 19, 2, 670);
    			attr_dev(main, "class", "svelte-177t831");
    			add_location(main, file, 12, 0, 463);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(nav, main, null);
    			append_dev(main, t0);
    			append_dev(main, a0);
    			mount_component(about, a0, null);
    			append_dev(main, t1);
    			append_dev(main, a1);
    			mount_component(web, a1, null);
    			append_dev(main, t2);
    			append_dev(main, a2);
    			mount_component(ios, a2, null);
    			append_dev(main, t3);
    			append_dev(main, a3);
    			mount_component(backend, a3, null);
    			append_dev(main, t4);
    			append_dev(main, a4);
    			mount_component(resume, a4, null);
    			append_dev(main, t5);
    			append_dev(main, a5);
    			mount_component(contact, a5, null);
    			append_dev(main, t6);
    			mount_component(footer, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);
    			transition_in(about.$$.fragment, local);
    			transition_in(web.$$.fragment, local);
    			transition_in(ios.$$.fragment, local);
    			transition_in(backend.$$.fragment, local);
    			transition_in(resume.$$.fragment, local);
    			transition_in(contact.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			transition_out(about.$$.fragment, local);
    			transition_out(web.$$.fragment, local);
    			transition_out(ios.$$.fragment, local);
    			transition_out(backend.$$.fragment, local);
    			transition_out(resume.$$.fragment, local);
    			transition_out(contact.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(nav);
    			destroy_component(about);
    			destroy_component(web);
    			destroy_component(ios);
    			destroy_component(backend);
    			destroy_component(resume);
    			destroy_component(contact);
    			destroy_component(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Banner,
    		Nav,
    		Footer,
    		About,
    		Web,
    		Ios,
    		Backend,
    		Resume,
    		Contact
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
