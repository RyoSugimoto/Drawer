var Drawer = (function () {
    'use strict';

    const styleForFixed = {
      height: '100vh',
      left: '0',
      overflow: 'hidden',
      position: 'fixed',
      width: '100vw'
    };

    const scrollingElement = (() => {
      const ua = window.navigator.userAgent.toLowerCase();
      const d = document;
      if ('scrollingElement' in document) return document.scrollingElement;
      if (ua.indexOf('webkit') > 0) return d.body;
      return d.documentElement;
    })();

    function fixBackface(fixed) {
      const scrollY = fixed ? scrollingElement.scrollTop : parseInt(document.body.style.top) ?? 0;
      const scrollbarWidth = window.innerWidth - document.body.clientWidth;
      document.body.style.top = fixed ? `-${scrollingElement.scrollTop}px` : '';
      document.body.style.paddingRight = fixed ? `${scrollbarWidth}px` : '';
      Object.keys(styleForFixed).forEach(key => {
        if (fixed) {
          document.body.style.setProperty(key, styleForFixed[key]);
        } else {
          document.body.style.removeProperty(key);
        }
      });
      if (!fixed) scrollingElement.scrollTop = scrollY * -1;
    }

    (function (global, factory) {
      typeof exports === 'object' && typeof module !== 'undefined' ? factory() : typeof define === 'function' && define.amd ? define('inert', factory) : factory();
    })(undefined, function () {

      var _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      /**
       * This work is licensed under the W3C Software and Document License
       * (http://www.w3.org/Consortium/Legal/2015/copyright-software-and-document).
       */


      (function () {
        // Return early if we're not running inside of the browser.
        if (typeof window === 'undefined') {
          return;
        } // Convenience function for converting NodeLists.

        /** @type {typeof Array.prototype.slice} */


        var slice = Array.prototype.slice;
        /**
         * IE has a non-standard name for "matches".
         * @type {typeof Element.prototype.matches}
         */

        var matches = Element.prototype.matches || Element.prototype.msMatchesSelector;
        /** @type {string} */

        var _focusableElementsString = ['a[href]', 'area[href]', 'input:not([disabled])', 'select:not([disabled])', 'textarea:not([disabled])', 'button:not([disabled])', 'details', 'summary', 'iframe', 'object', 'embed', '[contenteditable]'].join(',');
        /**
         * `InertRoot` manages a single inert subtree, i.e. a DOM subtree whose root element has an `inert`
         * attribute.
         *
         * Its main functions are:
         *
         * - to create and maintain a set of managed `InertNode`s, including when mutations occur in the
         *   subtree. The `makeSubtreeUnfocusable()` method handles collecting `InertNode`s via registering
         *   each focusable node in the subtree with the singleton `InertManager` which manages all known
         *   focusable nodes within inert subtrees. `InertManager` ensures that a single `InertNode`
         *   instance exists for each focusable node which has at least one inert root as an ancestor.
         *
         * - to notify all managed `InertNode`s when this subtree stops being inert (i.e. when the `inert`
         *   attribute is removed from the root node). This is handled in the destructor, which calls the
         *   `deregister` method on `InertManager` for each managed inert node.
         */


        var InertRoot = function () {
          /**
           * @param {!Element} rootElement The Element at the root of the inert subtree.
           * @param {!InertManager} inertManager The global singleton InertManager object.
           */
          function InertRoot(rootElement, inertManager) {
            _classCallCheck(this, InertRoot);
            /** @type {!InertManager} */


            this._inertManager = inertManager;
            /** @type {!Element} */

            this._rootElement = rootElement;
            /**
             * @type {!Set<!InertNode>}
             * All managed focusable nodes in this InertRoot's subtree.
             */

            this._managedNodes = new Set(); // Make the subtree hidden from assistive technology

            if (this._rootElement.hasAttribute('aria-hidden')) {
              /** @type {?string} */
              this._savedAriaHidden = this._rootElement.getAttribute('aria-hidden');
            } else {
              this._savedAriaHidden = null;
            }

            this._rootElement.setAttribute('aria-hidden', 'true'); // Make all focusable elements in the subtree unfocusable and add them to _managedNodes


            this._makeSubtreeUnfocusable(this._rootElement); // Watch for:
            // - any additions in the subtree: make them unfocusable too
            // - any removals from the subtree: remove them from this inert root's managed nodes
            // - attribute changes: if `tabindex` is added, or removed from an intrinsically focusable
            //   element, make that node a managed node.


            this._observer = new MutationObserver(this._onMutation.bind(this));

            this._observer.observe(this._rootElement, {
              attributes: true,
              childList: true,
              subtree: true
            });
          }
          /**
           * Call this whenever this object is about to become obsolete.  This unwinds all of the state
           * stored in this object and updates the state of all of the managed nodes.
           */


          _createClass(InertRoot, [{
            key: 'destructor',
            value: function destructor() {
              this._observer.disconnect();

              if (this._rootElement) {
                if (this._savedAriaHidden !== null) {
                  this._rootElement.setAttribute('aria-hidden', this._savedAriaHidden);
                } else {
                  this._rootElement.removeAttribute('aria-hidden');
                }
              }

              this._managedNodes.forEach(function (inertNode) {
                this._unmanageNode(inertNode.node);
              }, this); // Note we cast the nulls to the ANY type here because:
              // 1) We want the class properties to be declared as non-null, or else we
              //    need even more casts throughout this code. All bets are off if an
              //    instance has been destroyed and a method is called.
              // 2) We don't want to cast "this", because we want type-aware optimizations
              //    to know which properties we're setting.


              this._observer =
              /** @type {?} */
              null;
              this._rootElement =
              /** @type {?} */
              null;
              this._managedNodes =
              /** @type {?} */
              null;
              this._inertManager =
              /** @type {?} */
              null;
            }
            /**
             * @return {!Set<!InertNode>} A copy of this InertRoot's managed nodes set.
             */

          }, {
            key: '_makeSubtreeUnfocusable',

            /**
             * @param {!Node} startNode
             */
            value: function _makeSubtreeUnfocusable(startNode) {
              var _this2 = this;

              composedTreeWalk(startNode, function (node) {
                return _this2._visitNode(node);
              });
              var activeElement = document.activeElement;

              if (!document.body.contains(startNode)) {
                // startNode may be in shadow DOM, so find its nearest shadowRoot to get the activeElement.
                var node = startNode;
                /** @type {!ShadowRoot|undefined} */

                var root = undefined;

                while (node) {
                  if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                    root =
                    /** @type {!ShadowRoot} */
                    node;
                    break;
                  }

                  node = node.parentNode;
                }

                if (root) {
                  activeElement = root.activeElement;
                }
              }

              if (startNode.contains(activeElement)) {
                activeElement.blur(); // In IE11, if an element is already focused, and then set to tabindex=-1
                // calling blur() will not actually move the focus.
                // To work around this we call focus() on the body instead.

                if (activeElement === document.activeElement) {
                  document.body.focus();
                }
              }
            }
            /**
             * @param {!Node} node
             */

          }, {
            key: '_visitNode',
            value: function _visitNode(node) {
              if (node.nodeType !== Node.ELEMENT_NODE) {
                return;
              }

              var element =
              /** @type {!Element} */
              node; // If a descendant inert root becomes un-inert, its descendants will still be inert because of
              // this inert root, so all of its managed nodes need to be adopted by this InertRoot.

              if (element !== this._rootElement && element.hasAttribute('inert')) {
                this._adoptInertRoot(element);
              }

              if (matches.call(element, _focusableElementsString) || element.hasAttribute('tabindex')) {
                this._manageNode(element);
              }
            }
            /**
             * Register the given node with this InertRoot and with InertManager.
             * @param {!Node} node
             */

          }, {
            key: '_manageNode',
            value: function _manageNode(node) {
              var inertNode = this._inertManager.register(node, this);

              this._managedNodes.add(inertNode);
            }
            /**
             * Unregister the given node with this InertRoot and with InertManager.
             * @param {!Node} node
             */

          }, {
            key: '_unmanageNode',
            value: function _unmanageNode(node) {
              var inertNode = this._inertManager.deregister(node, this);

              if (inertNode) {
                this._managedNodes['delete'](inertNode);
              }
            }
            /**
             * Unregister the entire subtree starting at `startNode`.
             * @param {!Node} startNode
             */

          }, {
            key: '_unmanageSubtree',
            value: function _unmanageSubtree(startNode) {
              var _this3 = this;

              composedTreeWalk(startNode, function (node) {
                return _this3._unmanageNode(node);
              });
            }
            /**
             * If a descendant node is found with an `inert` attribute, adopt its managed nodes.
             * @param {!Element} node
             */

          }, {
            key: '_adoptInertRoot',
            value: function _adoptInertRoot(node) {
              var inertSubroot = this._inertManager.getInertRoot(node); // During initialisation this inert root may not have been registered yet,
              // so register it now if need be.


              if (!inertSubroot) {
                this._inertManager.setInert(node, true);

                inertSubroot = this._inertManager.getInertRoot(node);
              }

              inertSubroot.managedNodes.forEach(function (savedInertNode) {
                this._manageNode(savedInertNode.node);
              }, this);
            }
            /**
             * Callback used when mutation observer detects subtree additions, removals, or attribute changes.
             * @param {!Array<!MutationRecord>} records
             * @param {!MutationObserver} self
             */

          }, {
            key: '_onMutation',
            value: function _onMutation(records, self) {
              records.forEach(function (record) {
                var target =
                /** @type {!Element} */
                record.target;

                if (record.type === 'childList') {
                  // Manage added nodes
                  slice.call(record.addedNodes).forEach(function (node) {
                    this._makeSubtreeUnfocusable(node);
                  }, this); // Un-manage removed nodes

                  slice.call(record.removedNodes).forEach(function (node) {
                    this._unmanageSubtree(node);
                  }, this);
                } else if (record.type === 'attributes') {
                  if (record.attributeName === 'tabindex') {
                    // Re-initialise inert node if tabindex changes
                    this._manageNode(target);
                  } else if (target !== this._rootElement && record.attributeName === 'inert' && target.hasAttribute('inert')) {
                    // If a new inert root is added, adopt its managed nodes and make sure it knows about the
                    // already managed nodes from this inert subroot.
                    this._adoptInertRoot(target);

                    var inertSubroot = this._inertManager.getInertRoot(target);

                    this._managedNodes.forEach(function (managedNode) {
                      if (target.contains(managedNode.node)) {
                        inertSubroot._manageNode(managedNode.node);
                      }
                    });
                  }
                }
              }, this);
            }
          }, {
            key: 'managedNodes',
            get: function get() {
              return new Set(this._managedNodes);
            }
            /** @return {boolean} */

          }, {
            key: 'hasSavedAriaHidden',
            get: function get() {
              return this._savedAriaHidden !== null;
            }
            /** @param {?string} ariaHidden */

          }, {
            key: 'savedAriaHidden',
            set: function set(ariaHidden) {
              this._savedAriaHidden = ariaHidden;
            }
            /** @return {?string} */
            ,
            get: function get() {
              return this._savedAriaHidden;
            }
          }]);

          return InertRoot;
        }();
        /**
         * `InertNode` initialises and manages a single inert node.
         * A node is inert if it is a descendant of one or more inert root elements.
         *
         * On construction, `InertNode` saves the existing `tabindex` value for the node, if any, and
         * either removes the `tabindex` attribute or sets it to `-1`, depending on whether the element
         * is intrinsically focusable or not.
         *
         * `InertNode` maintains a set of `InertRoot`s which are descendants of this `InertNode`. When an
         * `InertRoot` is destroyed, and calls `InertManager.deregister()`, the `InertManager` notifies the
         * `InertNode` via `removeInertRoot()`, which in turn destroys the `InertNode` if no `InertRoot`s
         * remain in the set. On destruction, `InertNode` reinstates the stored `tabindex` if one exists,
         * or removes the `tabindex` attribute if the element is intrinsically focusable.
         */


        var InertNode = function () {
          /**
           * @param {!Node} node A focusable element to be made inert.
           * @param {!InertRoot} inertRoot The inert root element associated with this inert node.
           */
          function InertNode(node, inertRoot) {
            _classCallCheck(this, InertNode);
            /** @type {!Node} */


            this._node = node;
            /** @type {boolean} */

            this._overrodeFocusMethod = false;
            /**
             * @type {!Set<!InertRoot>} The set of descendant inert roots.
             *    If and only if this set becomes empty, this node is no longer inert.
             */

            this._inertRoots = new Set([inertRoot]);
            /** @type {?number} */

            this._savedTabIndex = null;
            /** @type {boolean} */

            this._destroyed = false; // Save any prior tabindex info and make this node untabbable

            this.ensureUntabbable();
          }
          /**
           * Call this whenever this object is about to become obsolete.
           * This makes the managed node focusable again and deletes all of the previously stored state.
           */


          _createClass(InertNode, [{
            key: 'destructor',
            value: function destructor() {
              this._throwIfDestroyed();

              if (this._node && this._node.nodeType === Node.ELEMENT_NODE) {
                var element =
                /** @type {!Element} */
                this._node;

                if (this._savedTabIndex !== null) {
                  element.setAttribute('tabindex', this._savedTabIndex);
                } else {
                  element.removeAttribute('tabindex');
                } // Use `delete` to restore native focus method.


                if (this._overrodeFocusMethod) {
                  delete element.focus;
                }
              } // See note in InertRoot.destructor for why we cast these nulls to ANY.


              this._node =
              /** @type {?} */
              null;
              this._inertRoots =
              /** @type {?} */
              null;
              this._destroyed = true;
            }
            /**
             * @type {boolean} Whether this object is obsolete because the managed node is no longer inert.
             * If the object has been destroyed, any attempt to access it will cause an exception.
             */

          }, {
            key: '_throwIfDestroyed',

            /**
             * Throw if user tries to access destroyed InertNode.
             */
            value: function _throwIfDestroyed() {
              if (this.destroyed) {
                throw new Error('Trying to access destroyed InertNode');
              }
            }
            /** @return {boolean} */

          }, {
            key: 'ensureUntabbable',

            /** Save the existing tabindex value and make the node untabbable and unfocusable */
            value: function ensureUntabbable() {
              if (this.node.nodeType !== Node.ELEMENT_NODE) {
                return;
              }

              var element =
              /** @type {!Element} */
              this.node;

              if (matches.call(element, _focusableElementsString)) {
                if (
                /** @type {!HTMLElement} */
                element.tabIndex === -1 && this.hasSavedTabIndex) {
                  return;
                }

                if (element.hasAttribute('tabindex')) {
                  this._savedTabIndex =
                  /** @type {!HTMLElement} */
                  element.tabIndex;
                }

                element.setAttribute('tabindex', '-1');

                if (element.nodeType === Node.ELEMENT_NODE) {
                  element.focus = function () {};

                  this._overrodeFocusMethod = true;
                }
              } else if (element.hasAttribute('tabindex')) {
                this._savedTabIndex =
                /** @type {!HTMLElement} */
                element.tabIndex;
                element.removeAttribute('tabindex');
              }
            }
            /**
             * Add another inert root to this inert node's set of managing inert roots.
             * @param {!InertRoot} inertRoot
             */

          }, {
            key: 'addInertRoot',
            value: function addInertRoot(inertRoot) {
              this._throwIfDestroyed();

              this._inertRoots.add(inertRoot);
            }
            /**
             * Remove the given inert root from this inert node's set of managing inert roots.
             * If the set of managing inert roots becomes empty, this node is no longer inert,
             * so the object should be destroyed.
             * @param {!InertRoot} inertRoot
             */

          }, {
            key: 'removeInertRoot',
            value: function removeInertRoot(inertRoot) {
              this._throwIfDestroyed();

              this._inertRoots['delete'](inertRoot);

              if (this._inertRoots.size === 0) {
                this.destructor();
              }
            }
          }, {
            key: 'destroyed',
            get: function get() {
              return (
                /** @type {!InertNode} */
                this._destroyed
              );
            }
          }, {
            key: 'hasSavedTabIndex',
            get: function get() {
              return this._savedTabIndex !== null;
            }
            /** @return {!Node} */

          }, {
            key: 'node',
            get: function get() {
              this._throwIfDestroyed();

              return this._node;
            }
            /** @param {?number} tabIndex */

          }, {
            key: 'savedTabIndex',
            set: function set(tabIndex) {
              this._throwIfDestroyed();

              this._savedTabIndex = tabIndex;
            }
            /** @return {?number} */
            ,
            get: function get() {
              this._throwIfDestroyed();

              return this._savedTabIndex;
            }
          }]);

          return InertNode;
        }();
        /**
         * InertManager is a per-document singleton object which manages all inert roots and nodes.
         *
         * When an element becomes an inert root by having an `inert` attribute set and/or its `inert`
         * property set to `true`, the `setInert` method creates an `InertRoot` object for the element.
         * The `InertRoot` in turn registers itself as managing all of the element's focusable descendant
         * nodes via the `register()` method. The `InertManager` ensures that a single `InertNode` instance
         * is created for each such node, via the `_managedNodes` map.
         */


        var InertManager = function () {
          /**
           * @param {!Document} document
           */
          function InertManager(document) {
            _classCallCheck(this, InertManager);

            if (!document) {
              throw new Error('Missing required argument; InertManager needs to wrap a document.');
            }
            /** @type {!Document} */


            this._document = document;
            /**
             * All managed nodes known to this InertManager. In a map to allow looking up by Node.
             * @type {!Map<!Node, !InertNode>}
             */

            this._managedNodes = new Map();
            /**
             * All inert roots known to this InertManager. In a map to allow looking up by Node.
             * @type {!Map<!Node, !InertRoot>}
             */

            this._inertRoots = new Map();
            /**
             * Observer for mutations on `document.body`.
             * @type {!MutationObserver}
             */

            this._observer = new MutationObserver(this._watchForInert.bind(this)); // Add inert style.

            addInertStyle(document.head || document.body || document.documentElement); // Wait for document to be loaded.

            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', this._onDocumentLoaded.bind(this));
            } else {
              this._onDocumentLoaded();
            }
          }
          /**
           * Set whether the given element should be an inert root or not.
           * @param {!Element} root
           * @param {boolean} inert
           */


          _createClass(InertManager, [{
            key: 'setInert',
            value: function setInert(root, inert) {
              if (inert) {
                if (this._inertRoots.has(root)) {
                  // element is already inert
                  return;
                }

                var inertRoot = new InertRoot(root, this);
                root.setAttribute('inert', '');

                this._inertRoots.set(root, inertRoot); // If not contained in the document, it must be in a shadowRoot.
                // Ensure inert styles are added there.


                if (!this._document.body.contains(root)) {
                  var parent = root.parentNode;

                  while (parent) {
                    if (parent.nodeType === 11) {
                      addInertStyle(parent);
                    }

                    parent = parent.parentNode;
                  }
                }
              } else {
                if (!this._inertRoots.has(root)) {
                  // element is already non-inert
                  return;
                }

                var _inertRoot = this._inertRoots.get(root);

                _inertRoot.destructor();

                this._inertRoots['delete'](root);

                root.removeAttribute('inert');
              }
            }
            /**
             * Get the InertRoot object corresponding to the given inert root element, if any.
             * @param {!Node} element
             * @return {!InertRoot|undefined}
             */

          }, {
            key: 'getInertRoot',
            value: function getInertRoot(element) {
              return this._inertRoots.get(element);
            }
            /**
             * Register the given InertRoot as managing the given node.
             * In the case where the node has a previously existing inert root, this inert root will
             * be added to its set of inert roots.
             * @param {!Node} node
             * @param {!InertRoot} inertRoot
             * @return {!InertNode} inertNode
             */

          }, {
            key: 'register',
            value: function register(node, inertRoot) {
              var inertNode = this._managedNodes.get(node);

              if (inertNode !== undefined) {
                // node was already in an inert subtree
                inertNode.addInertRoot(inertRoot);
              } else {
                inertNode = new InertNode(node, inertRoot);
              }

              this._managedNodes.set(node, inertNode);

              return inertNode;
            }
            /**
             * De-register the given InertRoot as managing the given inert node.
             * Removes the inert root from the InertNode's set of managing inert roots, and remove the inert
             * node from the InertManager's set of managed nodes if it is destroyed.
             * If the node is not currently managed, this is essentially a no-op.
             * @param {!Node} node
             * @param {!InertRoot} inertRoot
             * @return {?InertNode} The potentially destroyed InertNode associated with this node, if any.
             */

          }, {
            key: 'deregister',
            value: function deregister(node, inertRoot) {
              var inertNode = this._managedNodes.get(node);

              if (!inertNode) {
                return null;
              }

              inertNode.removeInertRoot(inertRoot);

              if (inertNode.destroyed) {
                this._managedNodes['delete'](node);
              }

              return inertNode;
            }
            /**
             * Callback used when document has finished loading.
             */

          }, {
            key: '_onDocumentLoaded',
            value: function _onDocumentLoaded() {
              // Find all inert roots in document and make them actually inert.
              var inertElements = slice.call(this._document.querySelectorAll('[inert]'));
              inertElements.forEach(function (inertElement) {
                this.setInert(inertElement, true);
              }, this); // Comment this out to use programmatic API only.

              this._observer.observe(this._document.body || this._document.documentElement, {
                attributes: true,
                subtree: true,
                childList: true
              });
            }
            /**
             * Callback used when mutation observer detects attribute changes.
             * @param {!Array<!MutationRecord>} records
             * @param {!MutationObserver} self
             */

          }, {
            key: '_watchForInert',
            value: function _watchForInert(records, self) {
              var _this = this;

              records.forEach(function (record) {
                switch (record.type) {
                  case 'childList':
                    slice.call(record.addedNodes).forEach(function (node) {
                      if (node.nodeType !== Node.ELEMENT_NODE) {
                        return;
                      }

                      var inertElements = slice.call(node.querySelectorAll('[inert]'));

                      if (matches.call(node, '[inert]')) {
                        inertElements.unshift(node);
                      }

                      inertElements.forEach(function (inertElement) {
                        this.setInert(inertElement, true);
                      }, _this);
                    }, _this);
                    break;

                  case 'attributes':
                    if (record.attributeName !== 'inert') {
                      return;
                    }

                    var target =
                    /** @type {!Element} */
                    record.target;
                    var inert = target.hasAttribute('inert');

                    _this.setInert(target, inert);

                    break;
                }
              }, this);
            }
          }]);

          return InertManager;
        }();
        /**
         * Recursively walk the composed tree from |node|.
         * @param {!Node} node
         * @param {(function (!Element))=} callback Callback to be called for each element traversed,
         *     before descending into child nodes.
         * @param {?ShadowRoot=} shadowRootAncestor The nearest ShadowRoot ancestor, if any.
         */


        function composedTreeWalk(node, callback, shadowRootAncestor) {
          if (node.nodeType == Node.ELEMENT_NODE) {
            var element =
            /** @type {!Element} */
            node;

            if (callback) {
              callback(element);
            } // Descend into node:
            // If it has a ShadowRoot, ignore all child elements - these will be picked
            // up by the <content> or <shadow> elements. Descend straight into the
            // ShadowRoot.


            var shadowRoot =
            /** @type {!HTMLElement} */
            element.shadowRoot;

            if (shadowRoot) {
              composedTreeWalk(shadowRoot, callback);
              return;
            } // If it is a <content> element, descend into distributed elements - these
            // are elements from outside the shadow root which are rendered inside the
            // shadow DOM.


            if (element.localName == 'content') {
              var content =
              /** @type {!HTMLContentElement} */
              element; // Verifies if ShadowDom v0 is supported.

              var distributedNodes = content.getDistributedNodes ? content.getDistributedNodes() : [];

              for (var i = 0; i < distributedNodes.length; i++) {
                composedTreeWalk(distributedNodes[i], callback);
              }

              return;
            } // If it is a <slot> element, descend into assigned nodes - these
            // are elements from outside the shadow root which are rendered inside the
            // shadow DOM.


            if (element.localName == 'slot') {
              var slot =
              /** @type {!HTMLSlotElement} */
              element; // Verify if ShadowDom v1 is supported.

              var _distributedNodes = slot.assignedNodes ? slot.assignedNodes({
                flatten: true
              }) : [];

              for (var _i = 0; _i < _distributedNodes.length; _i++) {
                composedTreeWalk(_distributedNodes[_i], callback);
              }

              return;
            }
          } // If it is neither the parent of a ShadowRoot, a <content> element, a <slot>
          // element, nor a <shadow> element recurse normally.


          var child = node.firstChild;

          while (child != null) {
            composedTreeWalk(child, callback);
            child = child.nextSibling;
          }
        }
        /**
         * Adds a style element to the node containing the inert specific styles
         * @param {!Node} node
         */


        function addInertStyle(node) {
          if (node.querySelector('style#inert-style, link#inert-style')) {
            return;
          }

          var style = document.createElement('style');
          style.setAttribute('id', 'inert-style');
          style.textContent = '\n' + '[inert] {\n' + '  pointer-events: none;\n' + '  cursor: default;\n' + '}\n' + '\n' + '[inert], [inert] * {\n' + '  -webkit-user-select: none;\n' + '  -moz-user-select: none;\n' + '  -ms-user-select: none;\n' + '  user-select: none;\n' + '}\n';
          node.appendChild(style);
        }

        if (!Element.prototype.hasOwnProperty('inert')) {
          /** @type {!InertManager} */
          var inertManager = new InertManager(document);
          Object.defineProperty(Element.prototype, 'inert', {
            enumerable: true,

            /** @this {!Element} */
            get: function get() {
              return this.hasAttribute('inert');
            },

            /** @this {!Element} */
            set: function set(inert) {
              inertManager.setInert(this, inert);
            }
          });
        }
      })();
    });

    class Drawer {
      constructor(args) {
        this.isExpanded = false;
        this.enableFixBackface = true;
        this.enableHistory = false;
        this.id = 'Drawer-' + new Date().getTime(); // Drawer body

        if (typeof args !== 'object' || args.drawer === undefined) throw new Error(`${this.constructor.name}: The "drawer" parameter is required. => ex: new Drawer({ drawer: '#drawer' })`);
        if (typeof args.drawer !== 'string' || '') throw new Error(`${this.constructor.name}: The "drawer" parameter must be "string" type and "CSS selector".`);
        if (args.drawer === '') throw new Error(`${this.constructor.name}: The "drawer" parameter is empty.`);
        this.drawerElement = document.querySelector(args.drawer);
        if (!this.drawerElement) throw new Error(`${this.constructor.name}: The Element for "drawer" is not found.`);
        this.drawerElement.setAttribute('data-drawer-is-initialized', 'true');

        if (this.drawerElement.id) {
          this.id = this.drawerElement.id;
        } else {
          this.drawerElement.id = this.id;
        }

        if (this.isExpanded) {
          this.drawerElement.removeAttribute('inert');
          this.drawerElement.removeAttribute('hidden');
        } else {
          this.drawerElement.setAttribute('inert', '');
          this.drawerElement.setAttribute('hidden', '');
        } // Switches for toggle


        this.switchElements = typeof args.switch === 'string' ? document.querySelectorAll(args.switch) : null;

        if (this.switchElements) {
          this.switchElements.forEach(element => {
            element.addEventListener('click', this.toggle.bind(this));
            element.setAttribute('data-drawer-is-initialized', 'true');
            element.setAttribute('aria-controls', this.id);
          });
        } // Elements that are set "inert" attribute when the drawer is expanded


        this.inertElements = typeof args.inert === 'string' ? document.querySelectorAll(args.inert) : null;

        if (this.inertElements) {
          this.inertElements.forEach(element => {
            element.setAttribute('data-drawer-is', 'initialized');

            if (this.isExpanded) {
              element.setAttribute('inert', '');
            } else {
              element.removeAttribute('inert');
            }
          });
        } // Preventing scroll when the drawer is expanded


        this.enableFixBackface = args.enableFixBackface ?? true; // Adding the state of the drawer to the history of your browser

        if (args.enableHistory) {
          this.enableHistory = true;
          window.addEventListener('popstate', this._popstateHandler.bind(this));
        }
      }

      toggle(event) {
        event.preventDefault();

        if (this.isExpanded) {
          this.close();
        } else {
          this.open();
        }
      }

      open() {
        this._changeState(true);

        if (this.enableHistory) this._pushState(true);
      }

      close() {
        this._changeState(false);

        if (this.enableHistory) this._pushState(false);
      }

      _changeState(isExpanded) {
        if (isExpanded) {
          var _this$drawerElement, _this$drawerElement2;

          (_this$drawerElement = this.drawerElement) === null || _this$drawerElement === void 0 ? void 0 : _this$drawerElement.removeAttribute('inert');
          (_this$drawerElement2 = this.drawerElement) === null || _this$drawerElement2 === void 0 ? void 0 : _this$drawerElement2.removeAttribute('hidden');
          document.addEventListener('keyup', this._keyupHandler.bind(this));
        } else {
          var _this$drawerElement3, _this$drawerElement4;

          // When the drawer is hidden
          (_this$drawerElement3 = this.drawerElement) === null || _this$drawerElement3 === void 0 ? void 0 : _this$drawerElement3.setAttribute('inert', '');
          (_this$drawerElement4 = this.drawerElement) === null || _this$drawerElement4 === void 0 ? void 0 : _this$drawerElement4.setAttribute('hidden', '');
          document.removeEventListener('keyup', this._keyupHandler.bind(this));
        }

        if (typeof fixBackface === 'function' && this.enableFixBackface) fixBackface(isExpanded);

        if (this.switchElements) {
          this.switchElements.forEach(element => {
            element.setAttribute('aria-expanded', String(isExpanded));
          });
        }

        if (this.inertElements) {
          this.inertElements.forEach(element => {
            if (isExpanded) {
              element.setAttribute('inert', '');
            } else {
              element.removeAttribute('inert');
            }
          });
        }

        this.isExpanded = isExpanded;
      }

      _keyupHandler(event) {
        if (event.key === 'Escape' || event.key === 'Esc') this.close();
      }

      _popstateHandler(event) {
        this._changeState(!this.isExpanded);
      }

      _pushState(isExpanded) {
        history.pushState({
          isExpanded: isExpanded
        }, 'drawerState');
      }

    }

    return Drawer;

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhd2VyLmJ1bmRsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL3RzL2ZpeC1iYWNrZmFjZS50cyIsIi4uL25vZGVfbW9kdWxlcy93aWNnLWluZXJ0L2Rpc3QvaW5lcnQuanMiLCIuLi9zcmMvdHMvZHJhd2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHN0eWxlRm9yRml4ZWQ6IHtcbiAgW2tleTogc3RyaW5nXTogc3RyaW5nXG59ID0ge1xuICBoZWlnaHQ6ICcxMDB2aCcsXG4gIGxlZnQ6ICcwJyxcbiAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICBwb3NpdGlvbjogJ2ZpeGVkJyxcbiAgd2lkdGg6ICcxMDB2dycsXG59XG5cbmNvbnN0IHNjcm9sbGluZ0VsZW1lbnQ6IEVsZW1lbnQgPSAoKCkgPT4ge1xuICBjb25zdCB1YSA9IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKClcbiAgY29uc3QgZDpEb2N1bWVudCA9IGRvY3VtZW50XG4gIGlmICgnc2Nyb2xsaW5nRWxlbWVudCcgaW4gZG9jdW1lbnQpIHJldHVybiBkb2N1bWVudC5zY3JvbGxpbmdFbGVtZW50IVxuICBpZiAodWEuaW5kZXhPZignd2Via2l0JykgPiAwKSByZXR1cm4gZC5ib2R5IVxuICByZXR1cm4gZC5kb2N1bWVudEVsZW1lbnQhXG59KSgpIVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBmaXhCYWNrZmFjZShmaXhlZDogYm9vbGVhbikge1xuICBjb25zdCBzY3JvbGxZOm51bWJlciA9IGZpeGVkID8gc2Nyb2xsaW5nRWxlbWVudC5zY3JvbGxUb3AgOiBwYXJzZUludChkb2N1bWVudC5ib2R5LnN0eWxlLnRvcCkgPz8gMFxuICBjb25zdCBzY3JvbGxiYXJXaWR0aDpudW1iZXIgPSB3aW5kb3cuaW5uZXJXaWR0aCAtIGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGhcbiAgZG9jdW1lbnQuYm9keS5zdHlsZS50b3AgPSBmaXhlZCA/IGAtJHtzY3JvbGxpbmdFbGVtZW50LnNjcm9sbFRvcH1weGAgOiAnJ1xuICBkb2N1bWVudC5ib2R5LnN0eWxlLnBhZGRpbmdSaWdodCA9IGZpeGVkID8gYCR7c2Nyb2xsYmFyV2lkdGh9cHhgIDogJydcbiAgT2JqZWN0LmtleXMoc3R5bGVGb3JGaXhlZCkuZm9yRWFjaChrZXkgPT4ge1xuICAgIGlmIChmaXhlZCkge1xuICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5zZXRQcm9wZXJ0eShrZXksIHN0eWxlRm9yRml4ZWRba2V5XSlcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShrZXkpXG4gICAgfVxuICB9KVxuICBpZiAoIWZpeGVkKSBzY3JvbGxpbmdFbGVtZW50LnNjcm9sbFRvcCA9IHNjcm9sbFkgKiAtMVxufVxuIiwiKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gZmFjdG9yeSgpIDpcbiAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKCdpbmVydCcsIGZhY3RvcnkpIDpcbiAgKGZhY3RvcnkoKSk7XG59KHRoaXMsIChmdW5jdGlvbiAoKSB7ICd1c2Ugc3RyaWN0JztcblxuICB2YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG4gIGZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbiAgLyoqXG4gICAqIFRoaXMgd29yayBpcyBsaWNlbnNlZCB1bmRlciB0aGUgVzNDIFNvZnR3YXJlIGFuZCBEb2N1bWVudCBMaWNlbnNlXG4gICAqIChodHRwOi8vd3d3LnczLm9yZy9Db25zb3J0aXVtL0xlZ2FsLzIwMTUvY29weXJpZ2h0LXNvZnR3YXJlLWFuZC1kb2N1bWVudCkuXG4gICAqL1xuXG4gIChmdW5jdGlvbiAoKSB7XG4gICAgLy8gUmV0dXJuIGVhcmx5IGlmIHdlJ3JlIG5vdCBydW5uaW5nIGluc2lkZSBvZiB0aGUgYnJvd3Nlci5cbiAgICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBDb252ZW5pZW5jZSBmdW5jdGlvbiBmb3IgY29udmVydGluZyBOb2RlTGlzdHMuXG4gICAgLyoqIEB0eXBlIHt0eXBlb2YgQXJyYXkucHJvdG90eXBlLnNsaWNlfSAqL1xuICAgIHZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblxuICAgIC8qKlxuICAgICAqIElFIGhhcyBhIG5vbi1zdGFuZGFyZCBuYW1lIGZvciBcIm1hdGNoZXNcIi5cbiAgICAgKiBAdHlwZSB7dHlwZW9mIEVsZW1lbnQucHJvdG90eXBlLm1hdGNoZXN9XG4gICAgICovXG4gICAgdmFyIG1hdGNoZXMgPSBFbGVtZW50LnByb3RvdHlwZS5tYXRjaGVzIHx8IEVsZW1lbnQucHJvdG90eXBlLm1zTWF0Y2hlc1NlbGVjdG9yO1xuXG4gICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgdmFyIF9mb2N1c2FibGVFbGVtZW50c1N0cmluZyA9IFsnYVtocmVmXScsICdhcmVhW2hyZWZdJywgJ2lucHV0Om5vdChbZGlzYWJsZWRdKScsICdzZWxlY3Q6bm90KFtkaXNhYmxlZF0pJywgJ3RleHRhcmVhOm5vdChbZGlzYWJsZWRdKScsICdidXR0b246bm90KFtkaXNhYmxlZF0pJywgJ2RldGFpbHMnLCAnc3VtbWFyeScsICdpZnJhbWUnLCAnb2JqZWN0JywgJ2VtYmVkJywgJ1tjb250ZW50ZWRpdGFibGVdJ10uam9pbignLCcpO1xuXG4gICAgLyoqXG4gICAgICogYEluZXJ0Um9vdGAgbWFuYWdlcyBhIHNpbmdsZSBpbmVydCBzdWJ0cmVlLCBpLmUuIGEgRE9NIHN1YnRyZWUgd2hvc2Ugcm9vdCBlbGVtZW50IGhhcyBhbiBgaW5lcnRgXG4gICAgICogYXR0cmlidXRlLlxuICAgICAqXG4gICAgICogSXRzIG1haW4gZnVuY3Rpb25zIGFyZTpcbiAgICAgKlxuICAgICAqIC0gdG8gY3JlYXRlIGFuZCBtYWludGFpbiBhIHNldCBvZiBtYW5hZ2VkIGBJbmVydE5vZGVgcywgaW5jbHVkaW5nIHdoZW4gbXV0YXRpb25zIG9jY3VyIGluIHRoZVxuICAgICAqICAgc3VidHJlZS4gVGhlIGBtYWtlU3VidHJlZVVuZm9jdXNhYmxlKClgIG1ldGhvZCBoYW5kbGVzIGNvbGxlY3RpbmcgYEluZXJ0Tm9kZWBzIHZpYSByZWdpc3RlcmluZ1xuICAgICAqICAgZWFjaCBmb2N1c2FibGUgbm9kZSBpbiB0aGUgc3VidHJlZSB3aXRoIHRoZSBzaW5nbGV0b24gYEluZXJ0TWFuYWdlcmAgd2hpY2ggbWFuYWdlcyBhbGwga25vd25cbiAgICAgKiAgIGZvY3VzYWJsZSBub2RlcyB3aXRoaW4gaW5lcnQgc3VidHJlZXMuIGBJbmVydE1hbmFnZXJgIGVuc3VyZXMgdGhhdCBhIHNpbmdsZSBgSW5lcnROb2RlYFxuICAgICAqICAgaW5zdGFuY2UgZXhpc3RzIGZvciBlYWNoIGZvY3VzYWJsZSBub2RlIHdoaWNoIGhhcyBhdCBsZWFzdCBvbmUgaW5lcnQgcm9vdCBhcyBhbiBhbmNlc3Rvci5cbiAgICAgKlxuICAgICAqIC0gdG8gbm90aWZ5IGFsbCBtYW5hZ2VkIGBJbmVydE5vZGVgcyB3aGVuIHRoaXMgc3VidHJlZSBzdG9wcyBiZWluZyBpbmVydCAoaS5lLiB3aGVuIHRoZSBgaW5lcnRgXG4gICAgICogICBhdHRyaWJ1dGUgaXMgcmVtb3ZlZCBmcm9tIHRoZSByb290IG5vZGUpLiBUaGlzIGlzIGhhbmRsZWQgaW4gdGhlIGRlc3RydWN0b3IsIHdoaWNoIGNhbGxzIHRoZVxuICAgICAqICAgYGRlcmVnaXN0ZXJgIG1ldGhvZCBvbiBgSW5lcnRNYW5hZ2VyYCBmb3IgZWFjaCBtYW5hZ2VkIGluZXJ0IG5vZGUuXG4gICAgICovXG5cbiAgICB2YXIgSW5lcnRSb290ID0gZnVuY3Rpb24gKCkge1xuICAgICAgLyoqXG4gICAgICAgKiBAcGFyYW0geyFFbGVtZW50fSByb290RWxlbWVudCBUaGUgRWxlbWVudCBhdCB0aGUgcm9vdCBvZiB0aGUgaW5lcnQgc3VidHJlZS5cbiAgICAgICAqIEBwYXJhbSB7IUluZXJ0TWFuYWdlcn0gaW5lcnRNYW5hZ2VyIFRoZSBnbG9iYWwgc2luZ2xldG9uIEluZXJ0TWFuYWdlciBvYmplY3QuXG4gICAgICAgKi9cbiAgICAgIGZ1bmN0aW9uIEluZXJ0Um9vdChyb290RWxlbWVudCwgaW5lcnRNYW5hZ2VyKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBJbmVydFJvb3QpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7IUluZXJ0TWFuYWdlcn0gKi9cbiAgICAgICAgdGhpcy5faW5lcnRNYW5hZ2VyID0gaW5lcnRNYW5hZ2VyO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovXG4gICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50ID0gcm9vdEVsZW1lbnQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHshU2V0PCFJbmVydE5vZGU+fVxuICAgICAgICAgKiBBbGwgbWFuYWdlZCBmb2N1c2FibGUgbm9kZXMgaW4gdGhpcyBJbmVydFJvb3QncyBzdWJ0cmVlLlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fbWFuYWdlZE5vZGVzID0gbmV3IFNldCgpO1xuXG4gICAgICAgIC8vIE1ha2UgdGhlIHN1YnRyZWUgaGlkZGVuIGZyb20gYXNzaXN0aXZlIHRlY2hub2xvZ3lcbiAgICAgICAgaWYgKHRoaXMuX3Jvb3RFbGVtZW50Lmhhc0F0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nKSkge1xuICAgICAgICAgIC8qKiBAdHlwZSB7P3N0cmluZ30gKi9cbiAgICAgICAgICB0aGlzLl9zYXZlZEFyaWFIaWRkZW4gPSB0aGlzLl9yb290RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fc2F2ZWRBcmlhSGlkZGVuID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yb290RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcblxuICAgICAgICAvLyBNYWtlIGFsbCBmb2N1c2FibGUgZWxlbWVudHMgaW4gdGhlIHN1YnRyZWUgdW5mb2N1c2FibGUgYW5kIGFkZCB0aGVtIHRvIF9tYW5hZ2VkTm9kZXNcbiAgICAgICAgdGhpcy5fbWFrZVN1YnRyZWVVbmZvY3VzYWJsZSh0aGlzLl9yb290RWxlbWVudCk7XG5cbiAgICAgICAgLy8gV2F0Y2ggZm9yOlxuICAgICAgICAvLyAtIGFueSBhZGRpdGlvbnMgaW4gdGhlIHN1YnRyZWU6IG1ha2UgdGhlbSB1bmZvY3VzYWJsZSB0b29cbiAgICAgICAgLy8gLSBhbnkgcmVtb3ZhbHMgZnJvbSB0aGUgc3VidHJlZTogcmVtb3ZlIHRoZW0gZnJvbSB0aGlzIGluZXJ0IHJvb3QncyBtYW5hZ2VkIG5vZGVzXG4gICAgICAgIC8vIC0gYXR0cmlidXRlIGNoYW5nZXM6IGlmIGB0YWJpbmRleGAgaXMgYWRkZWQsIG9yIHJlbW92ZWQgZnJvbSBhbiBpbnRyaW5zaWNhbGx5IGZvY3VzYWJsZVxuICAgICAgICAvLyAgIGVsZW1lbnQsIG1ha2UgdGhhdCBub2RlIGEgbWFuYWdlZCBub2RlLlxuICAgICAgICB0aGlzLl9vYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKHRoaXMuX29uTXV0YXRpb24uYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuX29ic2VydmVyLm9ic2VydmUodGhpcy5fcm9vdEVsZW1lbnQsIHsgYXR0cmlidXRlczogdHJ1ZSwgY2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlIH0pO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIENhbGwgdGhpcyB3aGVuZXZlciB0aGlzIG9iamVjdCBpcyBhYm91dCB0byBiZWNvbWUgb2Jzb2xldGUuICBUaGlzIHVud2luZHMgYWxsIG9mIHRoZSBzdGF0ZVxuICAgICAgICogc3RvcmVkIGluIHRoaXMgb2JqZWN0IGFuZCB1cGRhdGVzIHRoZSBzdGF0ZSBvZiBhbGwgb2YgdGhlIG1hbmFnZWQgbm9kZXMuXG4gICAgICAgKi9cblxuXG4gICAgICBfY3JlYXRlQ2xhc3MoSW5lcnRSb290LCBbe1xuICAgICAgICBrZXk6ICdkZXN0cnVjdG9yJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGRlc3RydWN0b3IoKSB7XG4gICAgICAgICAgdGhpcy5fb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuXG4gICAgICAgICAgaWYgKHRoaXMuX3Jvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fc2F2ZWRBcmlhSGlkZGVuICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCB0aGlzLl9zYXZlZEFyaWFIaWRkZW4pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5fcm9vdEVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdhcmlhLWhpZGRlbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuX21hbmFnZWROb2Rlcy5mb3JFYWNoKGZ1bmN0aW9uIChpbmVydE5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX3VubWFuYWdlTm9kZShpbmVydE5vZGUubm9kZSk7XG4gICAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgICAvLyBOb3RlIHdlIGNhc3QgdGhlIG51bGxzIHRvIHRoZSBBTlkgdHlwZSBoZXJlIGJlY2F1c2U6XG4gICAgICAgICAgLy8gMSkgV2Ugd2FudCB0aGUgY2xhc3MgcHJvcGVydGllcyB0byBiZSBkZWNsYXJlZCBhcyBub24tbnVsbCwgb3IgZWxzZSB3ZVxuICAgICAgICAgIC8vICAgIG5lZWQgZXZlbiBtb3JlIGNhc3RzIHRocm91Z2hvdXQgdGhpcyBjb2RlLiBBbGwgYmV0cyBhcmUgb2ZmIGlmIGFuXG4gICAgICAgICAgLy8gICAgaW5zdGFuY2UgaGFzIGJlZW4gZGVzdHJveWVkIGFuZCBhIG1ldGhvZCBpcyBjYWxsZWQuXG4gICAgICAgICAgLy8gMikgV2UgZG9uJ3Qgd2FudCB0byBjYXN0IFwidGhpc1wiLCBiZWNhdXNlIHdlIHdhbnQgdHlwZS1hd2FyZSBvcHRpbWl6YXRpb25zXG4gICAgICAgICAgLy8gICAgdG8ga25vdyB3aGljaCBwcm9wZXJ0aWVzIHdlJ3JlIHNldHRpbmcuXG4gICAgICAgICAgdGhpcy5fb2JzZXJ2ZXIgPSAvKiogQHR5cGUgez99ICovbnVsbDtcbiAgICAgICAgICB0aGlzLl9yb290RWxlbWVudCA9IC8qKiBAdHlwZSB7P30gKi9udWxsO1xuICAgICAgICAgIHRoaXMuX21hbmFnZWROb2RlcyA9IC8qKiBAdHlwZSB7P30gKi9udWxsO1xuICAgICAgICAgIHRoaXMuX2luZXJ0TWFuYWdlciA9IC8qKiBAdHlwZSB7P30gKi9udWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEByZXR1cm4geyFTZXQ8IUluZXJ0Tm9kZT59IEEgY29weSBvZiB0aGlzIEluZXJ0Um9vdCdzIG1hbmFnZWQgbm9kZXMgc2V0LlxuICAgICAgICAgKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdfbWFrZVN1YnRyZWVVbmZvY3VzYWJsZScsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogQHBhcmFtIHshTm9kZX0gc3RhcnROb2RlXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX21ha2VTdWJ0cmVlVW5mb2N1c2FibGUoc3RhcnROb2RlKSB7XG4gICAgICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgICAgICBjb21wb3NlZFRyZWVXYWxrKHN0YXJ0Tm9kZSwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpczIuX3Zpc2l0Tm9kZShub2RlKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHZhciBhY3RpdmVFbGVtZW50ID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcblxuICAgICAgICAgIGlmICghZG9jdW1lbnQuYm9keS5jb250YWlucyhzdGFydE5vZGUpKSB7XG4gICAgICAgICAgICAvLyBzdGFydE5vZGUgbWF5IGJlIGluIHNoYWRvdyBET00sIHNvIGZpbmQgaXRzIG5lYXJlc3Qgc2hhZG93Um9vdCB0byBnZXQgdGhlIGFjdGl2ZUVsZW1lbnQuXG4gICAgICAgICAgICB2YXIgbm9kZSA9IHN0YXJ0Tm9kZTtcbiAgICAgICAgICAgIC8qKiBAdHlwZSB7IVNoYWRvd1Jvb3R8dW5kZWZpbmVkfSAqL1xuICAgICAgICAgICAgdmFyIHJvb3QgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5ET0NVTUVOVF9GUkFHTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICAgICAgcm9vdCA9IC8qKiBAdHlwZSB7IVNoYWRvd1Jvb3R9ICovbm9kZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJvb3QpIHtcbiAgICAgICAgICAgICAgYWN0aXZlRWxlbWVudCA9IHJvb3QuYWN0aXZlRWxlbWVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHN0YXJ0Tm9kZS5jb250YWlucyhhY3RpdmVFbGVtZW50KSkge1xuICAgICAgICAgICAgYWN0aXZlRWxlbWVudC5ibHVyKCk7XG4gICAgICAgICAgICAvLyBJbiBJRTExLCBpZiBhbiBlbGVtZW50IGlzIGFscmVhZHkgZm9jdXNlZCwgYW5kIHRoZW4gc2V0IHRvIHRhYmluZGV4PS0xXG4gICAgICAgICAgICAvLyBjYWxsaW5nIGJsdXIoKSB3aWxsIG5vdCBhY3R1YWxseSBtb3ZlIHRoZSBmb2N1cy5cbiAgICAgICAgICAgIC8vIFRvIHdvcmsgYXJvdW5kIHRoaXMgd2UgY2FsbCBmb2N1cygpIG9uIHRoZSBib2R5IGluc3RlYWQuXG4gICAgICAgICAgICBpZiAoYWN0aXZlRWxlbWVudCA9PT0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkge1xuICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmZvY3VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnX3Zpc2l0Tm9kZScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfdmlzaXROb2RlKG5vZGUpIHtcbiAgICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSAhPT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGVsZW1lbnQgPSAvKiogQHR5cGUgeyFFbGVtZW50fSAqL25vZGU7XG5cbiAgICAgICAgICAvLyBJZiBhIGRlc2NlbmRhbnQgaW5lcnQgcm9vdCBiZWNvbWVzIHVuLWluZXJ0LCBpdHMgZGVzY2VuZGFudHMgd2lsbCBzdGlsbCBiZSBpbmVydCBiZWNhdXNlIG9mXG4gICAgICAgICAgLy8gdGhpcyBpbmVydCByb290LCBzbyBhbGwgb2YgaXRzIG1hbmFnZWQgbm9kZXMgbmVlZCB0byBiZSBhZG9wdGVkIGJ5IHRoaXMgSW5lcnRSb290LlxuICAgICAgICAgIGlmIChlbGVtZW50ICE9PSB0aGlzLl9yb290RWxlbWVudCAmJiBlbGVtZW50Lmhhc0F0dHJpYnV0ZSgnaW5lcnQnKSkge1xuICAgICAgICAgICAgdGhpcy5fYWRvcHRJbmVydFJvb3QoZWxlbWVudCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKG1hdGNoZXMuY2FsbChlbGVtZW50LCBfZm9jdXNhYmxlRWxlbWVudHNTdHJpbmcpIHx8IGVsZW1lbnQuaGFzQXR0cmlidXRlKCd0YWJpbmRleCcpKSB7XG4gICAgICAgICAgICB0aGlzLl9tYW5hZ2VOb2RlKGVsZW1lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZWdpc3RlciB0aGUgZ2l2ZW4gbm9kZSB3aXRoIHRoaXMgSW5lcnRSb290IGFuZCB3aXRoIEluZXJ0TWFuYWdlci5cbiAgICAgICAgICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICAgICAgICAgKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdfbWFuYWdlTm9kZScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfbWFuYWdlTm9kZShub2RlKSB7XG4gICAgICAgICAgdmFyIGluZXJ0Tm9kZSA9IHRoaXMuX2luZXJ0TWFuYWdlci5yZWdpc3Rlcihub2RlLCB0aGlzKTtcbiAgICAgICAgICB0aGlzLl9tYW5hZ2VkTm9kZXMuYWRkKGluZXJ0Tm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogVW5yZWdpc3RlciB0aGUgZ2l2ZW4gbm9kZSB3aXRoIHRoaXMgSW5lcnRSb290IGFuZCB3aXRoIEluZXJ0TWFuYWdlci5cbiAgICAgICAgICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICAgICAgICAgKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdfdW5tYW5hZ2VOb2RlJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF91bm1hbmFnZU5vZGUobm9kZSkge1xuICAgICAgICAgIHZhciBpbmVydE5vZGUgPSB0aGlzLl9pbmVydE1hbmFnZXIuZGVyZWdpc3Rlcihub2RlLCB0aGlzKTtcbiAgICAgICAgICBpZiAoaW5lcnROb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9tYW5hZ2VkTm9kZXNbJ2RlbGV0ZSddKGluZXJ0Tm9kZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVucmVnaXN0ZXIgdGhlIGVudGlyZSBzdWJ0cmVlIHN0YXJ0aW5nIGF0IGBzdGFydE5vZGVgLlxuICAgICAgICAgKiBAcGFyYW0geyFOb2RlfSBzdGFydE5vZGVcbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnX3VubWFuYWdlU3VidHJlZScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfdW5tYW5hZ2VTdWJ0cmVlKHN0YXJ0Tm9kZSkge1xuICAgICAgICAgIHZhciBfdGhpczMgPSB0aGlzO1xuXG4gICAgICAgICAgY29tcG9zZWRUcmVlV2FsayhzdGFydE5vZGUsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMzLl91bm1hbmFnZU5vZGUobm9kZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgYSBkZXNjZW5kYW50IG5vZGUgaXMgZm91bmQgd2l0aCBhbiBgaW5lcnRgIGF0dHJpYnV0ZSwgYWRvcHQgaXRzIG1hbmFnZWQgbm9kZXMuXG4gICAgICAgICAqIEBwYXJhbSB7IUVsZW1lbnR9IG5vZGVcbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnX2Fkb3B0SW5lcnRSb290JyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9hZG9wdEluZXJ0Um9vdChub2RlKSB7XG4gICAgICAgICAgdmFyIGluZXJ0U3Vicm9vdCA9IHRoaXMuX2luZXJ0TWFuYWdlci5nZXRJbmVydFJvb3Qobm9kZSk7XG5cbiAgICAgICAgICAvLyBEdXJpbmcgaW5pdGlhbGlzYXRpb24gdGhpcyBpbmVydCByb290IG1heSBub3QgaGF2ZSBiZWVuIHJlZ2lzdGVyZWQgeWV0LFxuICAgICAgICAgIC8vIHNvIHJlZ2lzdGVyIGl0IG5vdyBpZiBuZWVkIGJlLlxuICAgICAgICAgIGlmICghaW5lcnRTdWJyb290KSB7XG4gICAgICAgICAgICB0aGlzLl9pbmVydE1hbmFnZXIuc2V0SW5lcnQobm9kZSwgdHJ1ZSk7XG4gICAgICAgICAgICBpbmVydFN1YnJvb3QgPSB0aGlzLl9pbmVydE1hbmFnZXIuZ2V0SW5lcnRSb290KG5vZGUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGluZXJ0U3Vicm9vdC5tYW5hZ2VkTm9kZXMuZm9yRWFjaChmdW5jdGlvbiAoc2F2ZWRJbmVydE5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX21hbmFnZU5vZGUoc2F2ZWRJbmVydE5vZGUubm9kZSk7XG4gICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbGJhY2sgdXNlZCB3aGVuIG11dGF0aW9uIG9ic2VydmVyIGRldGVjdHMgc3VidHJlZSBhZGRpdGlvbnMsIHJlbW92YWxzLCBvciBhdHRyaWJ1dGUgY2hhbmdlcy5cbiAgICAgICAgICogQHBhcmFtIHshQXJyYXk8IU11dGF0aW9uUmVjb3JkPn0gcmVjb3Jkc1xuICAgICAgICAgKiBAcGFyYW0geyFNdXRhdGlvbk9ic2VydmVyfSBzZWxmXG4gICAgICAgICAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ19vbk11dGF0aW9uJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9vbk11dGF0aW9uKHJlY29yZHMsIHNlbGYpIHtcbiAgICAgICAgICByZWNvcmRzLmZvckVhY2goZnVuY3Rpb24gKHJlY29yZCkge1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9IC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovcmVjb3JkLnRhcmdldDtcbiAgICAgICAgICAgIGlmIChyZWNvcmQudHlwZSA9PT0gJ2NoaWxkTGlzdCcpIHtcbiAgICAgICAgICAgICAgLy8gTWFuYWdlIGFkZGVkIG5vZGVzXG4gICAgICAgICAgICAgIHNsaWNlLmNhbGwocmVjb3JkLmFkZGVkTm9kZXMpLmZvckVhY2goZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYWtlU3VidHJlZVVuZm9jdXNhYmxlKG5vZGUpO1xuICAgICAgICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICAgICAgICAvLyBVbi1tYW5hZ2UgcmVtb3ZlZCBub2Rlc1xuICAgICAgICAgICAgICBzbGljZS5jYWxsKHJlY29yZC5yZW1vdmVkTm9kZXMpLmZvckVhY2goZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl91bm1hbmFnZVN1YnRyZWUobm9kZSk7XG4gICAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZWNvcmQudHlwZSA9PT0gJ2F0dHJpYnV0ZXMnKSB7XG4gICAgICAgICAgICAgIGlmIChyZWNvcmQuYXR0cmlidXRlTmFtZSA9PT0gJ3RhYmluZGV4Jykge1xuICAgICAgICAgICAgICAgIC8vIFJlLWluaXRpYWxpc2UgaW5lcnQgbm9kZSBpZiB0YWJpbmRleCBjaGFuZ2VzXG4gICAgICAgICAgICAgICAgdGhpcy5fbWFuYWdlTm9kZSh0YXJnZXQpO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRhcmdldCAhPT0gdGhpcy5fcm9vdEVsZW1lbnQgJiYgcmVjb3JkLmF0dHJpYnV0ZU5hbWUgPT09ICdpbmVydCcgJiYgdGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnaW5lcnQnKSkge1xuICAgICAgICAgICAgICAgIC8vIElmIGEgbmV3IGluZXJ0IHJvb3QgaXMgYWRkZWQsIGFkb3B0IGl0cyBtYW5hZ2VkIG5vZGVzIGFuZCBtYWtlIHN1cmUgaXQga25vd3MgYWJvdXQgdGhlXG4gICAgICAgICAgICAgICAgLy8gYWxyZWFkeSBtYW5hZ2VkIG5vZGVzIGZyb20gdGhpcyBpbmVydCBzdWJyb290LlxuICAgICAgICAgICAgICAgIHRoaXMuX2Fkb3B0SW5lcnRSb290KHRhcmdldCk7XG4gICAgICAgICAgICAgICAgdmFyIGluZXJ0U3Vicm9vdCA9IHRoaXMuX2luZXJ0TWFuYWdlci5nZXRJbmVydFJvb3QodGFyZ2V0KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYW5hZ2VkTm9kZXMuZm9yRWFjaChmdW5jdGlvbiAobWFuYWdlZE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuY29udGFpbnMobWFuYWdlZE5vZGUubm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5lcnRTdWJyb290Ll9tYW5hZ2VOb2RlKG1hbmFnZWROb2RlLm5vZGUpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnbWFuYWdlZE5vZGVzJyxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBTZXQodGhpcy5fbWFuYWdlZE5vZGVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBAcmV0dXJuIHtib29sZWFufSAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ2hhc1NhdmVkQXJpYUhpZGRlbicsXG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLl9zYXZlZEFyaWFIaWRkZW4gIT09IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvKiogQHBhcmFtIHs/c3RyaW5nfSBhcmlhSGlkZGVuICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnc2F2ZWRBcmlhSGlkZGVuJyxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiBzZXQoYXJpYUhpZGRlbikge1xuICAgICAgICAgIHRoaXMuX3NhdmVkQXJpYUhpZGRlbiA9IGFyaWFIaWRkZW47XG4gICAgICAgIH1cblxuICAgICAgICAvKiogQHJldHVybiB7P3N0cmluZ30gKi9cbiAgICAgICAgLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fc2F2ZWRBcmlhSGlkZGVuO1xuICAgICAgICB9XG4gICAgICB9XSk7XG5cbiAgICAgIHJldHVybiBJbmVydFJvb3Q7XG4gICAgfSgpO1xuXG4gICAgLyoqXG4gICAgICogYEluZXJ0Tm9kZWAgaW5pdGlhbGlzZXMgYW5kIG1hbmFnZXMgYSBzaW5nbGUgaW5lcnQgbm9kZS5cbiAgICAgKiBBIG5vZGUgaXMgaW5lcnQgaWYgaXQgaXMgYSBkZXNjZW5kYW50IG9mIG9uZSBvciBtb3JlIGluZXJ0IHJvb3QgZWxlbWVudHMuXG4gICAgICpcbiAgICAgKiBPbiBjb25zdHJ1Y3Rpb24sIGBJbmVydE5vZGVgIHNhdmVzIHRoZSBleGlzdGluZyBgdGFiaW5kZXhgIHZhbHVlIGZvciB0aGUgbm9kZSwgaWYgYW55LCBhbmRcbiAgICAgKiBlaXRoZXIgcmVtb3ZlcyB0aGUgYHRhYmluZGV4YCBhdHRyaWJ1dGUgb3Igc2V0cyBpdCB0byBgLTFgLCBkZXBlbmRpbmcgb24gd2hldGhlciB0aGUgZWxlbWVudFxuICAgICAqIGlzIGludHJpbnNpY2FsbHkgZm9jdXNhYmxlIG9yIG5vdC5cbiAgICAgKlxuICAgICAqIGBJbmVydE5vZGVgIG1haW50YWlucyBhIHNldCBvZiBgSW5lcnRSb290YHMgd2hpY2ggYXJlIGRlc2NlbmRhbnRzIG9mIHRoaXMgYEluZXJ0Tm9kZWAuIFdoZW4gYW5cbiAgICAgKiBgSW5lcnRSb290YCBpcyBkZXN0cm95ZWQsIGFuZCBjYWxscyBgSW5lcnRNYW5hZ2VyLmRlcmVnaXN0ZXIoKWAsIHRoZSBgSW5lcnRNYW5hZ2VyYCBub3RpZmllcyB0aGVcbiAgICAgKiBgSW5lcnROb2RlYCB2aWEgYHJlbW92ZUluZXJ0Um9vdCgpYCwgd2hpY2ggaW4gdHVybiBkZXN0cm95cyB0aGUgYEluZXJ0Tm9kZWAgaWYgbm8gYEluZXJ0Um9vdGBzXG4gICAgICogcmVtYWluIGluIHRoZSBzZXQuIE9uIGRlc3RydWN0aW9uLCBgSW5lcnROb2RlYCByZWluc3RhdGVzIHRoZSBzdG9yZWQgYHRhYmluZGV4YCBpZiBvbmUgZXhpc3RzLFxuICAgICAqIG9yIHJlbW92ZXMgdGhlIGB0YWJpbmRleGAgYXR0cmlidXRlIGlmIHRoZSBlbGVtZW50IGlzIGludHJpbnNpY2FsbHkgZm9jdXNhYmxlLlxuICAgICAqL1xuXG5cbiAgICB2YXIgSW5lcnROb2RlID0gZnVuY3Rpb24gKCkge1xuICAgICAgLyoqXG4gICAgICAgKiBAcGFyYW0geyFOb2RlfSBub2RlIEEgZm9jdXNhYmxlIGVsZW1lbnQgdG8gYmUgbWFkZSBpbmVydC5cbiAgICAgICAqIEBwYXJhbSB7IUluZXJ0Um9vdH0gaW5lcnRSb290IFRoZSBpbmVydCByb290IGVsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaW5lcnQgbm9kZS5cbiAgICAgICAqL1xuICAgICAgZnVuY3Rpb24gSW5lcnROb2RlKG5vZGUsIGluZXJ0Um9vdCkge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgSW5lcnROb2RlKTtcblxuICAgICAgICAvKiogQHR5cGUgeyFOb2RlfSAqL1xuICAgICAgICB0aGlzLl9ub2RlID0gbm9kZTtcblxuICAgICAgICAvKiogQHR5cGUge2Jvb2xlYW59ICovXG4gICAgICAgIHRoaXMuX292ZXJyb2RlRm9jdXNNZXRob2QgPSBmYWxzZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUgeyFTZXQ8IUluZXJ0Um9vdD59IFRoZSBzZXQgb2YgZGVzY2VuZGFudCBpbmVydCByb290cy5cbiAgICAgICAgICogICAgSWYgYW5kIG9ubHkgaWYgdGhpcyBzZXQgYmVjb21lcyBlbXB0eSwgdGhpcyBub2RlIGlzIG5vIGxvbmdlciBpbmVydC5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2luZXJ0Um9vdHMgPSBuZXcgU2V0KFtpbmVydFJvb3RdKTtcblxuICAgICAgICAvKiogQHR5cGUgez9udW1iZXJ9ICovXG4gICAgICAgIHRoaXMuX3NhdmVkVGFiSW5kZXggPSBudWxsO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cbiAgICAgICAgdGhpcy5fZGVzdHJveWVkID0gZmFsc2U7XG5cbiAgICAgICAgLy8gU2F2ZSBhbnkgcHJpb3IgdGFiaW5kZXggaW5mbyBhbmQgbWFrZSB0aGlzIG5vZGUgdW50YWJiYWJsZVxuICAgICAgICB0aGlzLmVuc3VyZVVudGFiYmFibGUoKTtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBDYWxsIHRoaXMgd2hlbmV2ZXIgdGhpcyBvYmplY3QgaXMgYWJvdXQgdG8gYmVjb21lIG9ic29sZXRlLlxuICAgICAgICogVGhpcyBtYWtlcyB0aGUgbWFuYWdlZCBub2RlIGZvY3VzYWJsZSBhZ2FpbiBhbmQgZGVsZXRlcyBhbGwgb2YgdGhlIHByZXZpb3VzbHkgc3RvcmVkIHN0YXRlLlxuICAgICAgICovXG5cblxuICAgICAgX2NyZWF0ZUNsYXNzKEluZXJ0Tm9kZSwgW3tcbiAgICAgICAga2V5OiAnZGVzdHJ1Y3RvcicsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBkZXN0cnVjdG9yKCkge1xuICAgICAgICAgIHRoaXMuX3Rocm93SWZEZXN0cm95ZWQoKTtcblxuICAgICAgICAgIGlmICh0aGlzLl9ub2RlICYmIHRoaXMuX25vZGUubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovdGhpcy5fbm9kZTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zYXZlZFRhYkluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsIHRoaXMuX3NhdmVkVGFiSW5kZXgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFVzZSBgZGVsZXRlYCB0byByZXN0b3JlIG5hdGl2ZSBmb2N1cyBtZXRob2QuXG4gICAgICAgICAgICBpZiAodGhpcy5fb3ZlcnJvZGVGb2N1c01ldGhvZCkge1xuICAgICAgICAgICAgICBkZWxldGUgZWxlbWVudC5mb2N1cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBTZWUgbm90ZSBpbiBJbmVydFJvb3QuZGVzdHJ1Y3RvciBmb3Igd2h5IHdlIGNhc3QgdGhlc2UgbnVsbHMgdG8gQU5ZLlxuICAgICAgICAgIHRoaXMuX25vZGUgPSAvKiogQHR5cGUgez99ICovbnVsbDtcbiAgICAgICAgICB0aGlzLl9pbmVydFJvb3RzID0gLyoqIEB0eXBlIHs/fSAqL251bGw7XG4gICAgICAgICAgdGhpcy5fZGVzdHJveWVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn0gV2hldGhlciB0aGlzIG9iamVjdCBpcyBvYnNvbGV0ZSBiZWNhdXNlIHRoZSBtYW5hZ2VkIG5vZGUgaXMgbm8gbG9uZ2VyIGluZXJ0LlxuICAgICAgICAgKiBJZiB0aGUgb2JqZWN0IGhhcyBiZWVuIGRlc3Ryb3llZCwgYW55IGF0dGVtcHQgdG8gYWNjZXNzIGl0IHdpbGwgY2F1c2UgYW4gZXhjZXB0aW9uLlxuICAgICAgICAgKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdfdGhyb3dJZkRlc3Ryb3llZCcsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhyb3cgaWYgdXNlciB0cmllcyB0byBhY2Nlc3MgZGVzdHJveWVkIEluZXJ0Tm9kZS5cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfdGhyb3dJZkRlc3Ryb3llZCgpIHtcbiAgICAgICAgICBpZiAodGhpcy5kZXN0cm95ZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVHJ5aW5nIHRvIGFjY2VzcyBkZXN0cm95ZWQgSW5lcnROb2RlJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqIEByZXR1cm4ge2Jvb2xlYW59ICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnZW5zdXJlVW50YWJiYWJsZScsXG5cblxuICAgICAgICAvKiogU2F2ZSB0aGUgZXhpc3RpbmcgdGFiaW5kZXggdmFsdWUgYW5kIG1ha2UgdGhlIG5vZGUgdW50YWJiYWJsZSBhbmQgdW5mb2N1c2FibGUgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGVuc3VyZVVudGFiYmFibGUoKSB7XG4gICAgICAgICAgaWYgKHRoaXMubm9kZS5ub2RlVHlwZSAhPT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGVsZW1lbnQgPSAvKiogQHR5cGUgeyFFbGVtZW50fSAqL3RoaXMubm9kZTtcbiAgICAgICAgICBpZiAobWF0Y2hlcy5jYWxsKGVsZW1lbnQsIF9mb2N1c2FibGVFbGVtZW50c1N0cmluZykpIHtcbiAgICAgICAgICAgIGlmICggLyoqIEB0eXBlIHshSFRNTEVsZW1lbnR9ICovZWxlbWVudC50YWJJbmRleCA9PT0gLTEgJiYgdGhpcy5oYXNTYXZlZFRhYkluZGV4KSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKCd0YWJpbmRleCcpKSB7XG4gICAgICAgICAgICAgIHRoaXMuX3NhdmVkVGFiSW5kZXggPSAvKiogQHR5cGUgeyFIVE1MRWxlbWVudH0gKi9lbGVtZW50LnRhYkluZGV4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgJy0xJyk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5mb2N1cyA9IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICAgICAgICB0aGlzLl9vdmVycm9kZUZvY3VzTWV0aG9kID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKCd0YWJpbmRleCcpKSB7XG4gICAgICAgICAgICB0aGlzLl9zYXZlZFRhYkluZGV4ID0gLyoqIEB0eXBlIHshSFRNTEVsZW1lbnR9ICovZWxlbWVudC50YWJJbmRleDtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCd0YWJpbmRleCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGQgYW5vdGhlciBpbmVydCByb290IHRvIHRoaXMgaW5lcnQgbm9kZSdzIHNldCBvZiBtYW5hZ2luZyBpbmVydCByb290cy5cbiAgICAgICAgICogQHBhcmFtIHshSW5lcnRSb290fSBpbmVydFJvb3RcbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnYWRkSW5lcnRSb290JyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGFkZEluZXJ0Um9vdChpbmVydFJvb3QpIHtcbiAgICAgICAgICB0aGlzLl90aHJvd0lmRGVzdHJveWVkKCk7XG4gICAgICAgICAgdGhpcy5faW5lcnRSb290cy5hZGQoaW5lcnRSb290KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmUgdGhlIGdpdmVuIGluZXJ0IHJvb3QgZnJvbSB0aGlzIGluZXJ0IG5vZGUncyBzZXQgb2YgbWFuYWdpbmcgaW5lcnQgcm9vdHMuXG4gICAgICAgICAqIElmIHRoZSBzZXQgb2YgbWFuYWdpbmcgaW5lcnQgcm9vdHMgYmVjb21lcyBlbXB0eSwgdGhpcyBub2RlIGlzIG5vIGxvbmdlciBpbmVydCxcbiAgICAgICAgICogc28gdGhlIG9iamVjdCBzaG91bGQgYmUgZGVzdHJveWVkLlxuICAgICAgICAgKiBAcGFyYW0geyFJbmVydFJvb3R9IGluZXJ0Um9vdFxuICAgICAgICAgKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdyZW1vdmVJbmVydFJvb3QnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcmVtb3ZlSW5lcnRSb290KGluZXJ0Um9vdCkge1xuICAgICAgICAgIHRoaXMuX3Rocm93SWZEZXN0cm95ZWQoKTtcbiAgICAgICAgICB0aGlzLl9pbmVydFJvb3RzWydkZWxldGUnXShpbmVydFJvb3QpO1xuICAgICAgICAgIGlmICh0aGlzLl9pbmVydFJvb3RzLnNpemUgPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuZGVzdHJ1Y3RvcigpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdkZXN0cm95ZWQnLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICByZXR1cm4gKC8qKiBAdHlwZSB7IUluZXJ0Tm9kZX0gKi90aGlzLl9kZXN0cm95ZWRcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ2hhc1NhdmVkVGFiSW5kZXgnLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fc2F2ZWRUYWJJbmRleCAhPT0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBAcmV0dXJuIHshTm9kZX0gKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdub2RlJyxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgdGhpcy5fdGhyb3dJZkRlc3Ryb3llZCgpO1xuICAgICAgICAgIHJldHVybiB0aGlzLl9ub2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIEBwYXJhbSB7P251bWJlcn0gdGFiSW5kZXggKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdzYXZlZFRhYkluZGV4JyxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiBzZXQodGFiSW5kZXgpIHtcbiAgICAgICAgICB0aGlzLl90aHJvd0lmRGVzdHJveWVkKCk7XG4gICAgICAgICAgdGhpcy5fc2F2ZWRUYWJJbmRleCA9IHRhYkluZGV4O1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIEByZXR1cm4gez9udW1iZXJ9ICovXG4gICAgICAgICxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgdGhpcy5fdGhyb3dJZkRlc3Ryb3llZCgpO1xuICAgICAgICAgIHJldHVybiB0aGlzLl9zYXZlZFRhYkluZGV4O1xuICAgICAgICB9XG4gICAgICB9XSk7XG5cbiAgICAgIHJldHVybiBJbmVydE5vZGU7XG4gICAgfSgpO1xuXG4gICAgLyoqXG4gICAgICogSW5lcnRNYW5hZ2VyIGlzIGEgcGVyLWRvY3VtZW50IHNpbmdsZXRvbiBvYmplY3Qgd2hpY2ggbWFuYWdlcyBhbGwgaW5lcnQgcm9vdHMgYW5kIG5vZGVzLlxuICAgICAqXG4gICAgICogV2hlbiBhbiBlbGVtZW50IGJlY29tZXMgYW4gaW5lcnQgcm9vdCBieSBoYXZpbmcgYW4gYGluZXJ0YCBhdHRyaWJ1dGUgc2V0IGFuZC9vciBpdHMgYGluZXJ0YFxuICAgICAqIHByb3BlcnR5IHNldCB0byBgdHJ1ZWAsIHRoZSBgc2V0SW5lcnRgIG1ldGhvZCBjcmVhdGVzIGFuIGBJbmVydFJvb3RgIG9iamVjdCBmb3IgdGhlIGVsZW1lbnQuXG4gICAgICogVGhlIGBJbmVydFJvb3RgIGluIHR1cm4gcmVnaXN0ZXJzIGl0c2VsZiBhcyBtYW5hZ2luZyBhbGwgb2YgdGhlIGVsZW1lbnQncyBmb2N1c2FibGUgZGVzY2VuZGFudFxuICAgICAqIG5vZGVzIHZpYSB0aGUgYHJlZ2lzdGVyKClgIG1ldGhvZC4gVGhlIGBJbmVydE1hbmFnZXJgIGVuc3VyZXMgdGhhdCBhIHNpbmdsZSBgSW5lcnROb2RlYCBpbnN0YW5jZVxuICAgICAqIGlzIGNyZWF0ZWQgZm9yIGVhY2ggc3VjaCBub2RlLCB2aWEgdGhlIGBfbWFuYWdlZE5vZGVzYCBtYXAuXG4gICAgICovXG5cblxuICAgIHZhciBJbmVydE1hbmFnZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAvKipcbiAgICAgICAqIEBwYXJhbSB7IURvY3VtZW50fSBkb2N1bWVudFxuICAgICAgICovXG4gICAgICBmdW5jdGlvbiBJbmVydE1hbmFnZXIoZG9jdW1lbnQpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEluZXJ0TWFuYWdlcik7XG5cbiAgICAgICAgaWYgKCFkb2N1bWVudCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTWlzc2luZyByZXF1aXJlZCBhcmd1bWVudDsgSW5lcnRNYW5hZ2VyIG5lZWRzIHRvIHdyYXAgYSBkb2N1bWVudC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBAdHlwZSB7IURvY3VtZW50fSAqL1xuICAgICAgICB0aGlzLl9kb2N1bWVudCA9IGRvY3VtZW50O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBbGwgbWFuYWdlZCBub2RlcyBrbm93biB0byB0aGlzIEluZXJ0TWFuYWdlci4gSW4gYSBtYXAgdG8gYWxsb3cgbG9va2luZyB1cCBieSBOb2RlLlxuICAgICAgICAgKiBAdHlwZSB7IU1hcDwhTm9kZSwgIUluZXJ0Tm9kZT59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9tYW5hZ2VkTm9kZXMgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFsbCBpbmVydCByb290cyBrbm93biB0byB0aGlzIEluZXJ0TWFuYWdlci4gSW4gYSBtYXAgdG8gYWxsb3cgbG9va2luZyB1cCBieSBOb2RlLlxuICAgICAgICAgKiBAdHlwZSB7IU1hcDwhTm9kZSwgIUluZXJ0Um9vdD59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9pbmVydFJvb3RzID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPYnNlcnZlciBmb3IgbXV0YXRpb25zIG9uIGBkb2N1bWVudC5ib2R5YC5cbiAgICAgICAgICogQHR5cGUgeyFNdXRhdGlvbk9ic2VydmVyfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcih0aGlzLl93YXRjaEZvckluZXJ0LmJpbmQodGhpcykpO1xuXG4gICAgICAgIC8vIEFkZCBpbmVydCBzdHlsZS5cbiAgICAgICAgYWRkSW5lcnRTdHlsZShkb2N1bWVudC5oZWFkIHx8IGRvY3VtZW50LmJvZHkgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KTtcblxuICAgICAgICAvLyBXYWl0IGZvciBkb2N1bWVudCB0byBiZSBsb2FkZWQuXG4gICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnbG9hZGluZycpIHtcbiAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgdGhpcy5fb25Eb2N1bWVudExvYWRlZC5iaW5kKHRoaXMpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9vbkRvY3VtZW50TG9hZGVkKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBTZXQgd2hldGhlciB0aGUgZ2l2ZW4gZWxlbWVudCBzaG91bGQgYmUgYW4gaW5lcnQgcm9vdCBvciBub3QuXG4gICAgICAgKiBAcGFyYW0geyFFbGVtZW50fSByb290XG4gICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGluZXJ0XG4gICAgICAgKi9cblxuXG4gICAgICBfY3JlYXRlQ2xhc3MoSW5lcnRNYW5hZ2VyLCBbe1xuICAgICAgICBrZXk6ICdzZXRJbmVydCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRJbmVydChyb290LCBpbmVydCkge1xuICAgICAgICAgIGlmIChpbmVydCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2luZXJ0Um9vdHMuaGFzKHJvb3QpKSB7XG4gICAgICAgICAgICAgIC8vIGVsZW1lbnQgaXMgYWxyZWFkeSBpbmVydFxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBpbmVydFJvb3QgPSBuZXcgSW5lcnRSb290KHJvb3QsIHRoaXMpO1xuICAgICAgICAgICAgcm9vdC5zZXRBdHRyaWJ1dGUoJ2luZXJ0JywgJycpO1xuICAgICAgICAgICAgdGhpcy5faW5lcnRSb290cy5zZXQocm9vdCwgaW5lcnRSb290KTtcbiAgICAgICAgICAgIC8vIElmIG5vdCBjb250YWluZWQgaW4gdGhlIGRvY3VtZW50LCBpdCBtdXN0IGJlIGluIGEgc2hhZG93Um9vdC5cbiAgICAgICAgICAgIC8vIEVuc3VyZSBpbmVydCBzdHlsZXMgYXJlIGFkZGVkIHRoZXJlLlxuICAgICAgICAgICAgaWYgKCF0aGlzLl9kb2N1bWVudC5ib2R5LmNvbnRhaW5zKHJvb3QpKSB7XG4gICAgICAgICAgICAgIHZhciBwYXJlbnQgPSByb290LnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgIHdoaWxlIChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50Lm5vZGVUeXBlID09PSAxMSkge1xuICAgICAgICAgICAgICAgICAgYWRkSW5lcnRTdHlsZShwYXJlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2luZXJ0Um9vdHMuaGFzKHJvb3QpKSB7XG4gICAgICAgICAgICAgIC8vIGVsZW1lbnQgaXMgYWxyZWFkeSBub24taW5lcnRcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgX2luZXJ0Um9vdCA9IHRoaXMuX2luZXJ0Um9vdHMuZ2V0KHJvb3QpO1xuICAgICAgICAgICAgX2luZXJ0Um9vdC5kZXN0cnVjdG9yKCk7XG4gICAgICAgICAgICB0aGlzLl9pbmVydFJvb3RzWydkZWxldGUnXShyb290KTtcbiAgICAgICAgICAgIHJvb3QucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdGhlIEluZXJ0Um9vdCBvYmplY3QgY29ycmVzcG9uZGluZyB0byB0aGUgZ2l2ZW4gaW5lcnQgcm9vdCBlbGVtZW50LCBpZiBhbnkuXG4gICAgICAgICAqIEBwYXJhbSB7IU5vZGV9IGVsZW1lbnRcbiAgICAgICAgICogQHJldHVybiB7IUluZXJ0Um9vdHx1bmRlZmluZWR9XG4gICAgICAgICAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ2dldEluZXJ0Um9vdCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRJbmVydFJvb3QoZWxlbWVudCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLl9pbmVydFJvb3RzLmdldChlbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZWdpc3RlciB0aGUgZ2l2ZW4gSW5lcnRSb290IGFzIG1hbmFnaW5nIHRoZSBnaXZlbiBub2RlLlxuICAgICAgICAgKiBJbiB0aGUgY2FzZSB3aGVyZSB0aGUgbm9kZSBoYXMgYSBwcmV2aW91c2x5IGV4aXN0aW5nIGluZXJ0IHJvb3QsIHRoaXMgaW5lcnQgcm9vdCB3aWxsXG4gICAgICAgICAqIGJlIGFkZGVkIHRvIGl0cyBzZXQgb2YgaW5lcnQgcm9vdHMuXG4gICAgICAgICAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAgICAgICAgICogQHBhcmFtIHshSW5lcnRSb290fSBpbmVydFJvb3RcbiAgICAgICAgICogQHJldHVybiB7IUluZXJ0Tm9kZX0gaW5lcnROb2RlXG4gICAgICAgICAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ3JlZ2lzdGVyJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlZ2lzdGVyKG5vZGUsIGluZXJ0Um9vdCkge1xuICAgICAgICAgIHZhciBpbmVydE5vZGUgPSB0aGlzLl9tYW5hZ2VkTm9kZXMuZ2V0KG5vZGUpO1xuICAgICAgICAgIGlmIChpbmVydE5vZGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gbm9kZSB3YXMgYWxyZWFkeSBpbiBhbiBpbmVydCBzdWJ0cmVlXG4gICAgICAgICAgICBpbmVydE5vZGUuYWRkSW5lcnRSb290KGluZXJ0Um9vdCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGluZXJ0Tm9kZSA9IG5ldyBJbmVydE5vZGUobm9kZSwgaW5lcnRSb290KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLl9tYW5hZ2VkTm9kZXMuc2V0KG5vZGUsIGluZXJ0Tm9kZSk7XG5cbiAgICAgICAgICByZXR1cm4gaW5lcnROb2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlLXJlZ2lzdGVyIHRoZSBnaXZlbiBJbmVydFJvb3QgYXMgbWFuYWdpbmcgdGhlIGdpdmVuIGluZXJ0IG5vZGUuXG4gICAgICAgICAqIFJlbW92ZXMgdGhlIGluZXJ0IHJvb3QgZnJvbSB0aGUgSW5lcnROb2RlJ3Mgc2V0IG9mIG1hbmFnaW5nIGluZXJ0IHJvb3RzLCBhbmQgcmVtb3ZlIHRoZSBpbmVydFxuICAgICAgICAgKiBub2RlIGZyb20gdGhlIEluZXJ0TWFuYWdlcidzIHNldCBvZiBtYW5hZ2VkIG5vZGVzIGlmIGl0IGlzIGRlc3Ryb3llZC5cbiAgICAgICAgICogSWYgdGhlIG5vZGUgaXMgbm90IGN1cnJlbnRseSBtYW5hZ2VkLCB0aGlzIGlzIGVzc2VudGlhbGx5IGEgbm8tb3AuXG4gICAgICAgICAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAgICAgICAgICogQHBhcmFtIHshSW5lcnRSb290fSBpbmVydFJvb3RcbiAgICAgICAgICogQHJldHVybiB7P0luZXJ0Tm9kZX0gVGhlIHBvdGVudGlhbGx5IGRlc3Ryb3llZCBJbmVydE5vZGUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgbm9kZSwgaWYgYW55LlxuICAgICAgICAgKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdkZXJlZ2lzdGVyJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGRlcmVnaXN0ZXIobm9kZSwgaW5lcnRSb290KSB7XG4gICAgICAgICAgdmFyIGluZXJ0Tm9kZSA9IHRoaXMuX21hbmFnZWROb2Rlcy5nZXQobm9kZSk7XG4gICAgICAgICAgaWYgKCFpbmVydE5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGluZXJ0Tm9kZS5yZW1vdmVJbmVydFJvb3QoaW5lcnRSb290KTtcbiAgICAgICAgICBpZiAoaW5lcnROb2RlLmRlc3Ryb3llZCkge1xuICAgICAgICAgICAgdGhpcy5fbWFuYWdlZE5vZGVzWydkZWxldGUnXShub2RlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gaW5lcnROb2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGxiYWNrIHVzZWQgd2hlbiBkb2N1bWVudCBoYXMgZmluaXNoZWQgbG9hZGluZy5cbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnX29uRG9jdW1lbnRMb2FkZWQnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX29uRG9jdW1lbnRMb2FkZWQoKSB7XG4gICAgICAgICAgLy8gRmluZCBhbGwgaW5lcnQgcm9vdHMgaW4gZG9jdW1lbnQgYW5kIG1ha2UgdGhlbSBhY3R1YWxseSBpbmVydC5cbiAgICAgICAgICB2YXIgaW5lcnRFbGVtZW50cyA9IHNsaWNlLmNhbGwodGhpcy5fZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2luZXJ0XScpKTtcbiAgICAgICAgICBpbmVydEVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKGluZXJ0RWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5zZXRJbmVydChpbmVydEVsZW1lbnQsIHRydWUpO1xuICAgICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgICAgLy8gQ29tbWVudCB0aGlzIG91dCB0byB1c2UgcHJvZ3JhbW1hdGljIEFQSSBvbmx5LlxuICAgICAgICAgIHRoaXMuX29ic2VydmVyLm9ic2VydmUodGhpcy5fZG9jdW1lbnQuYm9keSB8fCB0aGlzLl9kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsIHsgYXR0cmlidXRlczogdHJ1ZSwgc3VidHJlZTogdHJ1ZSwgY2hpbGRMaXN0OiB0cnVlIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGxiYWNrIHVzZWQgd2hlbiBtdXRhdGlvbiBvYnNlcnZlciBkZXRlY3RzIGF0dHJpYnV0ZSBjaGFuZ2VzLlxuICAgICAgICAgKiBAcGFyYW0geyFBcnJheTwhTXV0YXRpb25SZWNvcmQ+fSByZWNvcmRzXG4gICAgICAgICAqIEBwYXJhbSB7IU11dGF0aW9uT2JzZXJ2ZXJ9IHNlbGZcbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnX3dhdGNoRm9ySW5lcnQnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX3dhdGNoRm9ySW5lcnQocmVjb3Jkcywgc2VsZikge1xuICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgcmVjb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uIChyZWNvcmQpIHtcbiAgICAgICAgICAgIHN3aXRjaCAocmVjb3JkLnR5cGUpIHtcbiAgICAgICAgICAgICAgY2FzZSAnY2hpbGRMaXN0JzpcbiAgICAgICAgICAgICAgICBzbGljZS5jYWxsKHJlY29yZC5hZGRlZE5vZGVzKS5mb3JFYWNoKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSAhPT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgdmFyIGluZXJ0RWxlbWVudHMgPSBzbGljZS5jYWxsKG5vZGUucXVlcnlTZWxlY3RvckFsbCgnW2luZXJ0XScpKTtcbiAgICAgICAgICAgICAgICAgIGlmIChtYXRjaGVzLmNhbGwobm9kZSwgJ1tpbmVydF0nKSkge1xuICAgICAgICAgICAgICAgICAgICBpbmVydEVsZW1lbnRzLnVuc2hpZnQobm9kZSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpbmVydEVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKGluZXJ0RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEluZXJ0KGluZXJ0RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICB9LCBfdGhpcyk7XG4gICAgICAgICAgICAgICAgfSwgX3RoaXMpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlICdhdHRyaWJ1dGVzJzpcbiAgICAgICAgICAgICAgICBpZiAocmVjb3JkLmF0dHJpYnV0ZU5hbWUgIT09ICdpbmVydCcpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldCA9IC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovcmVjb3JkLnRhcmdldDtcbiAgICAgICAgICAgICAgICB2YXIgaW5lcnQgPSB0YXJnZXQuaGFzQXR0cmlidXRlKCdpbmVydCcpO1xuICAgICAgICAgICAgICAgIF90aGlzLnNldEluZXJ0KHRhcmdldCwgaW5lcnQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9XSk7XG5cbiAgICAgIHJldHVybiBJbmVydE1hbmFnZXI7XG4gICAgfSgpO1xuXG4gICAgLyoqXG4gICAgICogUmVjdXJzaXZlbHkgd2FsayB0aGUgY29tcG9zZWQgdHJlZSBmcm9tIHxub2RlfC5cbiAgICAgKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gICAgICogQHBhcmFtIHsoZnVuY3Rpb24gKCFFbGVtZW50KSk9fSBjYWxsYmFjayBDYWxsYmFjayB0byBiZSBjYWxsZWQgZm9yIGVhY2ggZWxlbWVudCB0cmF2ZXJzZWQsXG4gICAgICogICAgIGJlZm9yZSBkZXNjZW5kaW5nIGludG8gY2hpbGQgbm9kZXMuXG4gICAgICogQHBhcmFtIHs/U2hhZG93Um9vdD19IHNoYWRvd1Jvb3RBbmNlc3RvciBUaGUgbmVhcmVzdCBTaGFkb3dSb290IGFuY2VzdG9yLCBpZiBhbnkuXG4gICAgICovXG5cblxuICAgIGZ1bmN0aW9uIGNvbXBvc2VkVHJlZVdhbGsobm9kZSwgY2FsbGJhY2ssIHNoYWRvd1Jvb3RBbmNlc3Rvcikge1xuICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSAvKiogQHR5cGUgeyFFbGVtZW50fSAqL25vZGU7XG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgIGNhbGxiYWNrKGVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGVzY2VuZCBpbnRvIG5vZGU6XG4gICAgICAgIC8vIElmIGl0IGhhcyBhIFNoYWRvd1Jvb3QsIGlnbm9yZSBhbGwgY2hpbGQgZWxlbWVudHMgLSB0aGVzZSB3aWxsIGJlIHBpY2tlZFxuICAgICAgICAvLyB1cCBieSB0aGUgPGNvbnRlbnQ+IG9yIDxzaGFkb3c+IGVsZW1lbnRzLiBEZXNjZW5kIHN0cmFpZ2h0IGludG8gdGhlXG4gICAgICAgIC8vIFNoYWRvd1Jvb3QuXG4gICAgICAgIHZhciBzaGFkb3dSb290ID0gLyoqIEB0eXBlIHshSFRNTEVsZW1lbnR9ICovZWxlbWVudC5zaGFkb3dSb290O1xuICAgICAgICBpZiAoc2hhZG93Um9vdCkge1xuICAgICAgICAgIGNvbXBvc2VkVHJlZVdhbGsoc2hhZG93Um9vdCwgY2FsbGJhY2ssIHNoYWRvd1Jvb3QpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGl0IGlzIGEgPGNvbnRlbnQ+IGVsZW1lbnQsIGRlc2NlbmQgaW50byBkaXN0cmlidXRlZCBlbGVtZW50cyAtIHRoZXNlXG4gICAgICAgIC8vIGFyZSBlbGVtZW50cyBmcm9tIG91dHNpZGUgdGhlIHNoYWRvdyByb290IHdoaWNoIGFyZSByZW5kZXJlZCBpbnNpZGUgdGhlXG4gICAgICAgIC8vIHNoYWRvdyBET00uXG4gICAgICAgIGlmIChlbGVtZW50LmxvY2FsTmFtZSA9PSAnY29udGVudCcpIHtcbiAgICAgICAgICB2YXIgY29udGVudCA9IC8qKiBAdHlwZSB7IUhUTUxDb250ZW50RWxlbWVudH0gKi9lbGVtZW50O1xuICAgICAgICAgIC8vIFZlcmlmaWVzIGlmIFNoYWRvd0RvbSB2MCBpcyBzdXBwb3J0ZWQuXG4gICAgICAgICAgdmFyIGRpc3RyaWJ1dGVkTm9kZXMgPSBjb250ZW50LmdldERpc3RyaWJ1dGVkTm9kZXMgPyBjb250ZW50LmdldERpc3RyaWJ1dGVkTm9kZXMoKSA6IFtdO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGlzdHJpYnV0ZWROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29tcG9zZWRUcmVlV2FsayhkaXN0cmlidXRlZE5vZGVzW2ldLCBjYWxsYmFjaywgc2hhZG93Um9vdEFuY2VzdG9yKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgaXQgaXMgYSA8c2xvdD4gZWxlbWVudCwgZGVzY2VuZCBpbnRvIGFzc2lnbmVkIG5vZGVzIC0gdGhlc2VcbiAgICAgICAgLy8gYXJlIGVsZW1lbnRzIGZyb20gb3V0c2lkZSB0aGUgc2hhZG93IHJvb3Qgd2hpY2ggYXJlIHJlbmRlcmVkIGluc2lkZSB0aGVcbiAgICAgICAgLy8gc2hhZG93IERPTS5cbiAgICAgICAgaWYgKGVsZW1lbnQubG9jYWxOYW1lID09ICdzbG90Jykge1xuICAgICAgICAgIHZhciBzbG90ID0gLyoqIEB0eXBlIHshSFRNTFNsb3RFbGVtZW50fSAqL2VsZW1lbnQ7XG4gICAgICAgICAgLy8gVmVyaWZ5IGlmIFNoYWRvd0RvbSB2MSBpcyBzdXBwb3J0ZWQuXG4gICAgICAgICAgdmFyIF9kaXN0cmlidXRlZE5vZGVzID0gc2xvdC5hc3NpZ25lZE5vZGVzID8gc2xvdC5hc3NpZ25lZE5vZGVzKHsgZmxhdHRlbjogdHJ1ZSB9KSA6IFtdO1xuICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBfZGlzdHJpYnV0ZWROb2Rlcy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIGNvbXBvc2VkVHJlZVdhbGsoX2Rpc3RyaWJ1dGVkTm9kZXNbX2ldLCBjYWxsYmFjaywgc2hhZG93Um9vdEFuY2VzdG9yKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGl0IGlzIG5laXRoZXIgdGhlIHBhcmVudCBvZiBhIFNoYWRvd1Jvb3QsIGEgPGNvbnRlbnQ+IGVsZW1lbnQsIGEgPHNsb3Q+XG4gICAgICAvLyBlbGVtZW50LCBub3IgYSA8c2hhZG93PiBlbGVtZW50IHJlY3Vyc2Ugbm9ybWFsbHkuXG4gICAgICB2YXIgY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7XG4gICAgICB3aGlsZSAoY2hpbGQgIT0gbnVsbCkge1xuICAgICAgICBjb21wb3NlZFRyZWVXYWxrKGNoaWxkLCBjYWxsYmFjaywgc2hhZG93Um9vdEFuY2VzdG9yKTtcbiAgICAgICAgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgc3R5bGUgZWxlbWVudCB0byB0aGUgbm9kZSBjb250YWluaW5nIHRoZSBpbmVydCBzcGVjaWZpYyBzdHlsZXNcbiAgICAgKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gICAgICovXG4gICAgZnVuY3Rpb24gYWRkSW5lcnRTdHlsZShub2RlKSB7XG4gICAgICBpZiAobm9kZS5xdWVyeVNlbGVjdG9yKCdzdHlsZSNpbmVydC1zdHlsZSwgbGluayNpbmVydC1zdHlsZScpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICBzdHlsZS5zZXRBdHRyaWJ1dGUoJ2lkJywgJ2luZXJ0LXN0eWxlJyk7XG4gICAgICBzdHlsZS50ZXh0Q29udGVudCA9ICdcXG4nICsgJ1tpbmVydF0ge1xcbicgKyAnICBwb2ludGVyLWV2ZW50czogbm9uZTtcXG4nICsgJyAgY3Vyc29yOiBkZWZhdWx0O1xcbicgKyAnfVxcbicgKyAnXFxuJyArICdbaW5lcnRdLCBbaW5lcnRdICoge1xcbicgKyAnICAtd2Via2l0LXVzZXItc2VsZWN0OiBub25lO1xcbicgKyAnICAtbW96LXVzZXItc2VsZWN0OiBub25lO1xcbicgKyAnICAtbXMtdXNlci1zZWxlY3Q6IG5vbmU7XFxuJyArICcgIHVzZXItc2VsZWN0OiBub25lO1xcbicgKyAnfVxcbic7XG4gICAgICBub2RlLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgICB9XG5cbiAgICBpZiAoIUVsZW1lbnQucHJvdG90eXBlLmhhc093blByb3BlcnR5KCdpbmVydCcpKSB7XG4gICAgICAvKiogQHR5cGUgeyFJbmVydE1hbmFnZXJ9ICovXG4gICAgICB2YXIgaW5lcnRNYW5hZ2VyID0gbmV3IEluZXJ0TWFuYWdlcihkb2N1bWVudCk7XG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFbGVtZW50LnByb3RvdHlwZSwgJ2luZXJ0Jywge1xuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAvKiogQHRoaXMgeyFFbGVtZW50fSAqL1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5oYXNBdHRyaWJ1dGUoJ2luZXJ0Jyk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKiBAdGhpcyB7IUVsZW1lbnR9ICovXG4gICAgICAgIHNldDogZnVuY3Rpb24gc2V0KGluZXJ0KSB7XG4gICAgICAgICAgaW5lcnRNYW5hZ2VyLnNldEluZXJ0KHRoaXMsIGluZXJ0KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9KSgpO1xuXG59KSkpO1xuIiwiaW1wb3J0IGZpeEJhY2tmYWNlIGZyb20gJy4vZml4LWJhY2tmYWNlLmpzJ1xuaW1wb3J0ICd3aWNnLWluZXJ0JztcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERyYXdlciB7XG4gIHB1YmxpYyBkcmF3ZXJFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGxcbiAgcHVibGljIHN3aXRjaEVsZW1lbnRzPzogTm9kZUxpc3RPZjxIVE1MRWxlbWVudD4gfCBudWxsXG4gIHB1YmxpYyBpbmVydEVsZW1lbnRzPzogTm9kZUxpc3RPZjxIVE1MRWxlbWVudD4gfCBudWxsXG4gIHB1YmxpYyBpc0V4cGFuZGVkOiBib29sZWFuID0gZmFsc2VcbiAgcHVibGljIGVuYWJsZUZpeEJhY2tmYWNlOmJvb2xlYW4gPSB0cnVlXG4gIHB1YmxpYyBlbmFibGVIaXN0b3J5OiBib29sZWFuID0gZmFsc2VcbiAgcHVibGljIGlkOiBzdHJpbmcgPSAnRHJhd2VyLScgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKVxuXG4gIGNvbnN0cnVjdG9yKGFyZ3M6IHtcbiAgICBkcmF3ZXI6IHN0cmluZ1xuICAgIHN3aXRjaD86IHN0cmluZ1xuICAgIGluZXJ0Pzogc3RyaW5nXG4gICAgZW5hYmxlRml4QmFja2ZhY2U/OiBib29sZWFuXG4gICAgZW5hYmxlSGlzdG9yeT86IGJvb2xlYW5cbiAgfSkge1xuICAgIC8vIERyYXdlciBib2R5XG4gICAgaWYgKHR5cGVvZiBhcmdzICE9PSAnb2JqZWN0JyB8fCBhcmdzLmRyYXdlciA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTogVGhlIFwiZHJhd2VyXCIgcGFyYW1ldGVyIGlzIHJlcXVpcmVkLiA9PiBleDogbmV3IERyYXdlcih7IGRyYXdlcjogJyNkcmF3ZXInIH0pYClcbiAgICBpZiAodHlwZW9mIGFyZ3MuZHJhd2VyICE9PSAnc3RyaW5nJyB8fCAnJyApIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OiBUaGUgXCJkcmF3ZXJcIiBwYXJhbWV0ZXIgbXVzdCBiZSBcInN0cmluZ1wiIHR5cGUgYW5kIFwiQ1NTIHNlbGVjdG9yXCIuYClcbiAgICBpZiAoYXJncy5kcmF3ZXIgPT09ICcnICkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06IFRoZSBcImRyYXdlclwiIHBhcmFtZXRlciBpcyBlbXB0eS5gKVxuICAgIHRoaXMuZHJhd2VyRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYXJncy5kcmF3ZXIpXG4gICAgaWYgKCF0aGlzLmRyYXdlckVsZW1lbnQpIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OiBUaGUgRWxlbWVudCBmb3IgXCJkcmF3ZXJcIiBpcyBub3QgZm91bmQuYClcbiAgICB0aGlzLmRyYXdlckVsZW1lbnQuc2V0QXR0cmlidXRlKCdkYXRhLWRyYXdlci1pcy1pbml0aWFsaXplZCcsICd0cnVlJylcbiAgICBpZiAodGhpcy5kcmF3ZXJFbGVtZW50LmlkKSB7XG4gICAgICB0aGlzLmlkID0gdGhpcy5kcmF3ZXJFbGVtZW50LmlkXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudC5pZCA9IHRoaXMuaWRcbiAgICB9XG4gICAgaWYgKHRoaXMuaXNFeHBhbmRlZCkge1xuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnaW5lcnQnKVxuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnaGlkZGVuJylcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50LnNldEF0dHJpYnV0ZSgnaW5lcnQnLCAnJylcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2hpZGRlbicsICcnKVxuICAgIH1cblxuICAgIC8vIFN3aXRjaGVzIGZvciB0b2dnbGVcbiAgICB0aGlzLnN3aXRjaEVsZW1lbnRzID0gdHlwZW9mIGFyZ3Muc3dpdGNoID09PSAnc3RyaW5nJyA/XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGFyZ3Muc3dpdGNoKSA6IG51bGxcbiAgICBpZiAodGhpcy5zd2l0Y2hFbGVtZW50cykge1xuICAgICAgdGhpcy5zd2l0Y2hFbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy50b2dnbGUuYmluZCh0aGlzKSlcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtZHJhd2VyLWlzLWluaXRpYWxpemVkJywgJ3RydWUnKVxuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1jb250cm9scycsIHRoaXMuaWQpXG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIEVsZW1lbnRzIHRoYXQgYXJlIHNldCBcImluZXJ0XCIgYXR0cmlidXRlIHdoZW4gdGhlIGRyYXdlciBpcyBleHBhbmRlZFxuICAgIHRoaXMuaW5lcnRFbGVtZW50cyA9IHR5cGVvZiBhcmdzLmluZXJ0ID09PSAnc3RyaW5nJyA/XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGFyZ3MuaW5lcnQpIDogbnVsbFxuICAgIGlmICh0aGlzLmluZXJ0RWxlbWVudHMpIHtcbiAgICAgIHRoaXMuaW5lcnRFbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS1kcmF3ZXItaXMnLCAnaW5pdGlhbGl6ZWQnKVxuICAgICAgICBpZiAodGhpcy5pc0V4cGFuZGVkKSB7XG4gICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2luZXJ0JywgJycpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2luZXJ0JylcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyBQcmV2ZW50aW5nIHNjcm9sbCB3aGVuIHRoZSBkcmF3ZXIgaXMgZXhwYW5kZWRcbiAgICB0aGlzLmVuYWJsZUZpeEJhY2tmYWNlID0gYXJncy5lbmFibGVGaXhCYWNrZmFjZSA/PyB0cnVlXG5cbiAgICAvLyBBZGRpbmcgdGhlIHN0YXRlIG9mIHRoZSBkcmF3ZXIgdG8gdGhlIGhpc3Rvcnkgb2YgeW91ciBicm93c2VyXG4gICAgaWYgKGFyZ3MuZW5hYmxlSGlzdG9yeSkge1xuICAgICAgdGhpcy5lbmFibGVIaXN0b3J5ID0gdHJ1ZVxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3BvcHN0YXRlJywgdGhpcy5fcG9wc3RhdGVIYW5kbGVyLmJpbmQodGhpcykpXG4gICAgfVxuXG4gIH1cbiAgdG9nZ2xlKGV2ZW50OiBFdmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICBpZiAodGhpcy5pc0V4cGFuZGVkKSB7XG4gICAgICB0aGlzLmNsb3NlKClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5vcGVuKClcbiAgICB9XG4gIH1cbiAgb3BlbigpIHtcbiAgICB0aGlzLl9jaGFuZ2VTdGF0ZSh0cnVlKVxuICAgIGlmICh0aGlzLmVuYWJsZUhpc3RvcnkpIHRoaXMuX3B1c2hTdGF0ZSh0cnVlKVxuICB9XG4gIGNsb3NlKCkge1xuICAgIHRoaXMuX2NoYW5nZVN0YXRlKGZhbHNlKVxuICAgIGlmICh0aGlzLmVuYWJsZUhpc3RvcnkpIHRoaXMuX3B1c2hTdGF0ZShmYWxzZSlcbiAgfVxuICBwcml2YXRlIF9jaGFuZ2VTdGF0ZShpc0V4cGFuZGVkOiBib29sZWFuKSB7XG4gICAgaWYgKGlzRXhwYW5kZWQpIHtcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudD8ucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpXG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQ/LnJlbW92ZUF0dHJpYnV0ZSgnaGlkZGVuJylcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5fa2V5dXBIYW5kbGVyLmJpbmQodGhpcykpXG5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gV2hlbiB0aGUgZHJhd2VyIGlzIGhpZGRlblxuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50Py5zZXRBdHRyaWJ1dGUoJ2luZXJ0JywgJycpXG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQ/LnNldEF0dHJpYnV0ZSgnaGlkZGVuJywgJycpXG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX2tleXVwSGFuZGxlci5iaW5kKHRoaXMpKVxuICAgIH1cblxuICAgIGlmICggdHlwZW9mIGZpeEJhY2tmYWNlID09PSAnZnVuY3Rpb24nICYmIHRoaXMuZW5hYmxlRml4QmFja2ZhY2UgKSBmaXhCYWNrZmFjZShpc0V4cGFuZGVkKVxuXG4gICAgaWYgKHRoaXMuc3dpdGNoRWxlbWVudHMpIHtcbiAgICAgIHRoaXMuc3dpdGNoRWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCBTdHJpbmcoaXNFeHBhbmRlZCkpXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmICh0aGlzLmluZXJ0RWxlbWVudHMpIHtcbiAgICAgIHRoaXMuaW5lcnRFbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBpZiAoaXNFeHBhbmRlZCkge1xuICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdpbmVydCcsICcnKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgdGhpcy5pc0V4cGFuZGVkID0gaXNFeHBhbmRlZFxuICB9XG4gIHByaXZhdGUgX2tleXVwSGFuZGxlcihldmVudDogS2V5Ym9hcmRFdmVudCkge1xuICAgIGlmIChldmVudC5rZXkgPT09ICdFc2NhcGUnIHx8IGV2ZW50LmtleSA9PT0gJ0VzYycpIHRoaXMuY2xvc2UoKVxuICB9XG4gIHByaXZhdGUgX3BvcHN0YXRlSGFuZGxlcihldmVudDogUG9wU3RhdGVFdmVudCkge1xuICAgIHRoaXMuX2NoYW5nZVN0YXRlKCF0aGlzLmlzRXhwYW5kZWQpO1xuICB9XG4gIHByaXZhdGUgX3B1c2hTdGF0ZShpc0V4cGFuZGVkOiBib29sZWFuKSB7XG4gICAgaGlzdG9yeS5wdXNoU3RhdGUoe1xuICAgICAgaXNFeHBhbmRlZDogaXNFeHBhbmRlZFxuICAgIH0sICdkcmF3ZXJTdGF0ZScpXG4gIH1cbn0iXSwibmFtZXMiOlsic3R5bGVGb3JGaXhlZCIsImhlaWdodCIsImxlZnQiLCJvdmVyZmxvdyIsInBvc2l0aW9uIiwid2lkdGgiLCJzY3JvbGxpbmdFbGVtZW50IiwidWEiLCJ3aW5kb3ciLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJ0b0xvd2VyQ2FzZSIsImQiLCJkb2N1bWVudCIsImluZGV4T2YiLCJib2R5IiwiZG9jdW1lbnRFbGVtZW50IiwiZml4QmFja2ZhY2UiLCJmaXhlZCIsInNjcm9sbFkiLCJzY3JvbGxUb3AiLCJwYXJzZUludCIsInN0eWxlIiwidG9wIiwic2Nyb2xsYmFyV2lkdGgiLCJpbm5lcldpZHRoIiwiY2xpZW50V2lkdGgiLCJwYWRkaW5nUmlnaHQiLCJPYmplY3QiLCJrZXlzIiwiZm9yRWFjaCIsImtleSIsInNldFByb3BlcnR5IiwicmVtb3ZlUHJvcGVydHkiLCJnbG9iYWwiLCJmYWN0b3J5IiwiZXhwb3J0cyIsIm1vZHVsZSIsImRlZmluZSIsImFtZCIsInRoaXMiLCJfY3JlYXRlQ2xhc3MiLCJkZWZpbmVQcm9wZXJ0aWVzIiwidGFyZ2V0IiwicHJvcHMiLCJpIiwibGVuZ3RoIiwiZGVzY3JpcHRvciIsImVudW1lcmFibGUiLCJjb25maWd1cmFibGUiLCJ3cml0YWJsZSIsImRlZmluZVByb3BlcnR5IiwiQ29uc3RydWN0b3IiLCJwcm90b1Byb3BzIiwic3RhdGljUHJvcHMiLCJwcm90b3R5cGUiLCJfY2xhc3NDYWxsQ2hlY2siLCJpbnN0YW5jZSIsIlR5cGVFcnJvciIsInNsaWNlIiwiQXJyYXkiLCJtYXRjaGVzIiwiRWxlbWVudCIsIm1zTWF0Y2hlc1NlbGVjdG9yIiwiX2ZvY3VzYWJsZUVsZW1lbnRzU3RyaW5nIiwiam9pbiIsIkluZXJ0Um9vdCIsInJvb3RFbGVtZW50IiwiaW5lcnRNYW5hZ2VyIiwiX2luZXJ0TWFuYWdlciIsIl9yb290RWxlbWVudCIsIl9tYW5hZ2VkTm9kZXMiLCJTZXQiLCJoYXNBdHRyaWJ1dGUiLCJfc2F2ZWRBcmlhSGlkZGVuIiwiZ2V0QXR0cmlidXRlIiwic2V0QXR0cmlidXRlIiwiX21ha2VTdWJ0cmVlVW5mb2N1c2FibGUiLCJfb2JzZXJ2ZXIiLCJNdXRhdGlvbk9ic2VydmVyIiwiX29uTXV0YXRpb24iLCJiaW5kIiwib2JzZXJ2ZSIsImF0dHJpYnV0ZXMiLCJjaGlsZExpc3QiLCJzdWJ0cmVlIiwidmFsdWUiLCJkZXN0cnVjdG9yIiwiZGlzY29ubmVjdCIsInJlbW92ZUF0dHJpYnV0ZSIsImluZXJ0Tm9kZSIsIl91bm1hbmFnZU5vZGUiLCJub2RlIiwic3RhcnROb2RlIiwiX3RoaXMyIiwiY29tcG9zZWRUcmVlV2FsayIsIl92aXNpdE5vZGUiLCJhY3RpdmVFbGVtZW50IiwiY29udGFpbnMiLCJyb290IiwidW5kZWZpbmVkIiwibm9kZVR5cGUiLCJOb2RlIiwiRE9DVU1FTlRfRlJBR01FTlRfTk9ERSIsInBhcmVudE5vZGUiLCJibHVyIiwiZm9jdXMiLCJFTEVNRU5UX05PREUiLCJlbGVtZW50IiwiX2Fkb3B0SW5lcnRSb290IiwiY2FsbCIsIl9tYW5hZ2VOb2RlIiwicmVnaXN0ZXIiLCJhZGQiLCJkZXJlZ2lzdGVyIiwiX3VubWFuYWdlU3VidHJlZSIsIl90aGlzMyIsImluZXJ0U3Vicm9vdCIsImdldEluZXJ0Um9vdCIsInNldEluZXJ0IiwibWFuYWdlZE5vZGVzIiwic2F2ZWRJbmVydE5vZGUiLCJyZWNvcmRzIiwic2VsZiIsInJlY29yZCIsInR5cGUiLCJhZGRlZE5vZGVzIiwicmVtb3ZlZE5vZGVzIiwiYXR0cmlidXRlTmFtZSIsIm1hbmFnZWROb2RlIiwiZ2V0Iiwic2V0IiwiYXJpYUhpZGRlbiIsIkluZXJ0Tm9kZSIsImluZXJ0Um9vdCIsIl9ub2RlIiwiX292ZXJyb2RlRm9jdXNNZXRob2QiLCJfaW5lcnRSb290cyIsIl9zYXZlZFRhYkluZGV4IiwiX2Rlc3Ryb3llZCIsImVuc3VyZVVudGFiYmFibGUiLCJfdGhyb3dJZkRlc3Ryb3llZCIsImRlc3Ryb3llZCIsIkVycm9yIiwidGFiSW5kZXgiLCJoYXNTYXZlZFRhYkluZGV4IiwiYWRkSW5lcnRSb290IiwicmVtb3ZlSW5lcnRSb290Iiwic2l6ZSIsIkluZXJ0TWFuYWdlciIsIl9kb2N1bWVudCIsIk1hcCIsIl93YXRjaEZvckluZXJ0IiwiYWRkSW5lcnRTdHlsZSIsImhlYWQiLCJyZWFkeVN0YXRlIiwiYWRkRXZlbnRMaXN0ZW5lciIsIl9vbkRvY3VtZW50TG9hZGVkIiwiaW5lcnQiLCJoYXMiLCJwYXJlbnQiLCJfaW5lcnRSb290IiwiaW5lcnRFbGVtZW50cyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJpbmVydEVsZW1lbnQiLCJfdGhpcyIsInVuc2hpZnQiLCJjYWxsYmFjayIsInNoYWRvd1Jvb3RBbmNlc3RvciIsInNoYWRvd1Jvb3QiLCJsb2NhbE5hbWUiLCJjb250ZW50IiwiZGlzdHJpYnV0ZWROb2RlcyIsImdldERpc3RyaWJ1dGVkTm9kZXMiLCJzbG90IiwiX2Rpc3RyaWJ1dGVkTm9kZXMiLCJhc3NpZ25lZE5vZGVzIiwiZmxhdHRlbiIsIl9pIiwiY2hpbGQiLCJmaXJzdENoaWxkIiwibmV4dFNpYmxpbmciLCJxdWVyeVNlbGVjdG9yIiwiY3JlYXRlRWxlbWVudCIsInRleHRDb250ZW50IiwiYXBwZW5kQ2hpbGQiLCJoYXNPd25Qcm9wZXJ0eSIsIkRyYXdlciIsImNvbnN0cnVjdG9yIiwiYXJncyIsIkRhdGUiLCJnZXRUaW1lIiwiZHJhd2VyIiwibmFtZSIsImRyYXdlckVsZW1lbnQiLCJpZCIsImlzRXhwYW5kZWQiLCJzd2l0Y2hFbGVtZW50cyIsInN3aXRjaCIsInRvZ2dsZSIsImVuYWJsZUZpeEJhY2tmYWNlIiwiZW5hYmxlSGlzdG9yeSIsIl9wb3BzdGF0ZUhhbmRsZXIiLCJldmVudCIsInByZXZlbnREZWZhdWx0IiwiY2xvc2UiLCJvcGVuIiwiX2NoYW5nZVN0YXRlIiwiX3B1c2hTdGF0ZSIsIl9rZXl1cEhhbmRsZXIiLCJyZW1vdmVFdmVudExpc3Rl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
