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
      if ('scrollingElement' in document) return document.scrollingElement;
      if (ua.indexOf('webkit') > 0) return document.body;
      return document.documentElement;
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
            element.setAttribute('data-drawer-is', 'initialized');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhd2VyLmJ1bmRsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL3RzL2ZpeC1iYWNrZmFjZS50cyIsIi4uL25vZGVfbW9kdWxlcy93aWNnLWluZXJ0L2Rpc3QvaW5lcnQuanMiLCIuLi9zcmMvdHMvZHJhd2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHN0eWxlRm9yRml4ZWQ6IHtcbiAgW2tleTogc3RyaW5nXTogc3RyaW5nXG59ID0ge1xuICBoZWlnaHQ6ICcxMDB2aCcsXG4gIGxlZnQ6ICcwJyxcbiAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICBwb3NpdGlvbjogJ2ZpeGVkJyxcbiAgd2lkdGg6ICcxMDB2dycsXG59XG5cbmNvbnN0IHNjcm9sbGluZ0VsZW1lbnQ6IEVsZW1lbnQgPSAoKCkgPT4ge1xuICBjb25zdCB1YSA9IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKClcbiAgaWYgKCdzY3JvbGxpbmdFbGVtZW50JyBpbiBkb2N1bWVudCkgcmV0dXJuIGRvY3VtZW50LnNjcm9sbGluZ0VsZW1lbnQhXG4gIGlmICh1YS5pbmRleE9mKCd3ZWJraXQnKSA+IDApIHJldHVybiBkb2N1bWVudC5ib2R5IVxuICByZXR1cm4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IVxufSkoKSFcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZml4QmFja2ZhY2UoZml4ZWQ6IGJvb2xlYW4pIHtcbiAgY29uc3Qgc2Nyb2xsWTpudW1iZXIgPSBmaXhlZCA/IHNjcm9sbGluZ0VsZW1lbnQuc2Nyb2xsVG9wIDogcGFyc2VJbnQoZG9jdW1lbnQuYm9keS5zdHlsZS50b3ApID8/IDBcbiAgY29uc3Qgc2Nyb2xsYmFyV2lkdGg6bnVtYmVyID0gd2luZG93LmlubmVyV2lkdGggLSBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoXG4gIGRvY3VtZW50LmJvZHkuc3R5bGUudG9wID0gZml4ZWQgPyBgLSR7c2Nyb2xsaW5nRWxlbWVudC5zY3JvbGxUb3B9cHhgIDogJydcbiAgZG9jdW1lbnQuYm9keS5zdHlsZS5wYWRkaW5nUmlnaHQgPSBmaXhlZCA/IGAke3Njcm9sbGJhcldpZHRofXB4YCA6ICcnXG4gIE9iamVjdC5rZXlzKHN0eWxlRm9yRml4ZWQpLmZvckVhY2goa2V5ID0+IHtcbiAgICBpZiAoZml4ZWQpIHtcbiAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuc2V0UHJvcGVydHkoa2V5LCBzdHlsZUZvckZpeGVkW2tleV0pXG4gICAgfSBlbHNlIHtcbiAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUucmVtb3ZlUHJvcGVydHkoa2V5KVxuICAgIH1cbiAgfSlcbiAgaWYgKCFmaXhlZCkgc2Nyb2xsaW5nRWxlbWVudC5zY3JvbGxUb3AgPSBzY3JvbGxZICogLTFcbn1cbiIsIihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IGZhY3RvcnkoKSA6XG4gIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZSgnaW5lcnQnLCBmYWN0b3J5KSA6XG4gIChmYWN0b3J5KCkpO1xufSh0aGlzLCAoZnVuY3Rpb24gKCkgeyAndXNlIHN0cmljdCc7XG5cbiAgdmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxuICBmdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG4gIC8qKlxuICAgKiBUaGlzIHdvcmsgaXMgbGljZW5zZWQgdW5kZXIgdGhlIFczQyBTb2Z0d2FyZSBhbmQgRG9jdW1lbnQgTGljZW5zZVxuICAgKiAoaHR0cDovL3d3dy53My5vcmcvQ29uc29ydGl1bS9MZWdhbC8yMDE1L2NvcHlyaWdodC1zb2Z0d2FyZS1hbmQtZG9jdW1lbnQpLlxuICAgKi9cblxuICAoZnVuY3Rpb24gKCkge1xuICAgIC8vIFJldHVybiBlYXJseSBpZiB3ZSdyZSBub3QgcnVubmluZyBpbnNpZGUgb2YgdGhlIGJyb3dzZXIuXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQ29udmVuaWVuY2UgZnVuY3Rpb24gZm9yIGNvbnZlcnRpbmcgTm9kZUxpc3RzLlxuICAgIC8qKiBAdHlwZSB7dHlwZW9mIEFycmF5LnByb3RvdHlwZS5zbGljZX0gKi9cbiAgICB2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG5cbiAgICAvKipcbiAgICAgKiBJRSBoYXMgYSBub24tc3RhbmRhcmQgbmFtZSBmb3IgXCJtYXRjaGVzXCIuXG4gICAgICogQHR5cGUge3R5cGVvZiBFbGVtZW50LnByb3RvdHlwZS5tYXRjaGVzfVxuICAgICAqL1xuICAgIHZhciBtYXRjaGVzID0gRWxlbWVudC5wcm90b3R5cGUubWF0Y2hlcyB8fCBFbGVtZW50LnByb3RvdHlwZS5tc01hdGNoZXNTZWxlY3RvcjtcblxuICAgIC8qKiBAdHlwZSB7c3RyaW5nfSAqL1xuICAgIHZhciBfZm9jdXNhYmxlRWxlbWVudHNTdHJpbmcgPSBbJ2FbaHJlZl0nLCAnYXJlYVtocmVmXScsICdpbnB1dDpub3QoW2Rpc2FibGVkXSknLCAnc2VsZWN0Om5vdChbZGlzYWJsZWRdKScsICd0ZXh0YXJlYTpub3QoW2Rpc2FibGVkXSknLCAnYnV0dG9uOm5vdChbZGlzYWJsZWRdKScsICdkZXRhaWxzJywgJ3N1bW1hcnknLCAnaWZyYW1lJywgJ29iamVjdCcsICdlbWJlZCcsICdbY29udGVudGVkaXRhYmxlXSddLmpvaW4oJywnKTtcblxuICAgIC8qKlxuICAgICAqIGBJbmVydFJvb3RgIG1hbmFnZXMgYSBzaW5nbGUgaW5lcnQgc3VidHJlZSwgaS5lLiBhIERPTSBzdWJ0cmVlIHdob3NlIHJvb3QgZWxlbWVudCBoYXMgYW4gYGluZXJ0YFxuICAgICAqIGF0dHJpYnV0ZS5cbiAgICAgKlxuICAgICAqIEl0cyBtYWluIGZ1bmN0aW9ucyBhcmU6XG4gICAgICpcbiAgICAgKiAtIHRvIGNyZWF0ZSBhbmQgbWFpbnRhaW4gYSBzZXQgb2YgbWFuYWdlZCBgSW5lcnROb2RlYHMsIGluY2x1ZGluZyB3aGVuIG11dGF0aW9ucyBvY2N1ciBpbiB0aGVcbiAgICAgKiAgIHN1YnRyZWUuIFRoZSBgbWFrZVN1YnRyZWVVbmZvY3VzYWJsZSgpYCBtZXRob2QgaGFuZGxlcyBjb2xsZWN0aW5nIGBJbmVydE5vZGVgcyB2aWEgcmVnaXN0ZXJpbmdcbiAgICAgKiAgIGVhY2ggZm9jdXNhYmxlIG5vZGUgaW4gdGhlIHN1YnRyZWUgd2l0aCB0aGUgc2luZ2xldG9uIGBJbmVydE1hbmFnZXJgIHdoaWNoIG1hbmFnZXMgYWxsIGtub3duXG4gICAgICogICBmb2N1c2FibGUgbm9kZXMgd2l0aGluIGluZXJ0IHN1YnRyZWVzLiBgSW5lcnRNYW5hZ2VyYCBlbnN1cmVzIHRoYXQgYSBzaW5nbGUgYEluZXJ0Tm9kZWBcbiAgICAgKiAgIGluc3RhbmNlIGV4aXN0cyBmb3IgZWFjaCBmb2N1c2FibGUgbm9kZSB3aGljaCBoYXMgYXQgbGVhc3Qgb25lIGluZXJ0IHJvb3QgYXMgYW4gYW5jZXN0b3IuXG4gICAgICpcbiAgICAgKiAtIHRvIG5vdGlmeSBhbGwgbWFuYWdlZCBgSW5lcnROb2RlYHMgd2hlbiB0aGlzIHN1YnRyZWUgc3RvcHMgYmVpbmcgaW5lcnQgKGkuZS4gd2hlbiB0aGUgYGluZXJ0YFxuICAgICAqICAgYXR0cmlidXRlIGlzIHJlbW92ZWQgZnJvbSB0aGUgcm9vdCBub2RlKS4gVGhpcyBpcyBoYW5kbGVkIGluIHRoZSBkZXN0cnVjdG9yLCB3aGljaCBjYWxscyB0aGVcbiAgICAgKiAgIGBkZXJlZ2lzdGVyYCBtZXRob2Qgb24gYEluZXJ0TWFuYWdlcmAgZm9yIGVhY2ggbWFuYWdlZCBpbmVydCBub2RlLlxuICAgICAqL1xuXG4gICAgdmFyIEluZXJ0Um9vdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8qKlxuICAgICAgICogQHBhcmFtIHshRWxlbWVudH0gcm9vdEVsZW1lbnQgVGhlIEVsZW1lbnQgYXQgdGhlIHJvb3Qgb2YgdGhlIGluZXJ0IHN1YnRyZWUuXG4gICAgICAgKiBAcGFyYW0geyFJbmVydE1hbmFnZXJ9IGluZXJ0TWFuYWdlciBUaGUgZ2xvYmFsIHNpbmdsZXRvbiBJbmVydE1hbmFnZXIgb2JqZWN0LlxuICAgICAgICovXG4gICAgICBmdW5jdGlvbiBJbmVydFJvb3Qocm9vdEVsZW1lbnQsIGluZXJ0TWFuYWdlcikge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgSW5lcnRSb290KTtcblxuICAgICAgICAvKiogQHR5cGUgeyFJbmVydE1hbmFnZXJ9ICovXG4gICAgICAgIHRoaXMuX2luZXJ0TWFuYWdlciA9IGluZXJ0TWFuYWdlcjtcblxuICAgICAgICAvKiogQHR5cGUgeyFFbGVtZW50fSAqL1xuICAgICAgICB0aGlzLl9yb290RWxlbWVudCA9IHJvb3RFbGVtZW50O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7IVNldDwhSW5lcnROb2RlPn1cbiAgICAgICAgICogQWxsIG1hbmFnZWQgZm9jdXNhYmxlIG5vZGVzIGluIHRoaXMgSW5lcnRSb290J3Mgc3VidHJlZS5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX21hbmFnZWROb2RlcyA9IG5ldyBTZXQoKTtcblxuICAgICAgICAvLyBNYWtlIHRoZSBzdWJ0cmVlIGhpZGRlbiBmcm9tIGFzc2lzdGl2ZSB0ZWNobm9sb2d5XG4gICAgICAgIGlmICh0aGlzLl9yb290RWxlbWVudC5oYXNBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJykpIHtcbiAgICAgICAgICAvKiogQHR5cGUgez9zdHJpbmd9ICovXG4gICAgICAgICAgdGhpcy5fc2F2ZWRBcmlhSGlkZGVuID0gdGhpcy5fcm9vdEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX3NhdmVkQXJpYUhpZGRlbiA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcm9vdEVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG5cbiAgICAgICAgLy8gTWFrZSBhbGwgZm9jdXNhYmxlIGVsZW1lbnRzIGluIHRoZSBzdWJ0cmVlIHVuZm9jdXNhYmxlIGFuZCBhZGQgdGhlbSB0byBfbWFuYWdlZE5vZGVzXG4gICAgICAgIHRoaXMuX21ha2VTdWJ0cmVlVW5mb2N1c2FibGUodGhpcy5fcm9vdEVsZW1lbnQpO1xuXG4gICAgICAgIC8vIFdhdGNoIGZvcjpcbiAgICAgICAgLy8gLSBhbnkgYWRkaXRpb25zIGluIHRoZSBzdWJ0cmVlOiBtYWtlIHRoZW0gdW5mb2N1c2FibGUgdG9vXG4gICAgICAgIC8vIC0gYW55IHJlbW92YWxzIGZyb20gdGhlIHN1YnRyZWU6IHJlbW92ZSB0aGVtIGZyb20gdGhpcyBpbmVydCByb290J3MgbWFuYWdlZCBub2Rlc1xuICAgICAgICAvLyAtIGF0dHJpYnV0ZSBjaGFuZ2VzOiBpZiBgdGFiaW5kZXhgIGlzIGFkZGVkLCBvciByZW1vdmVkIGZyb20gYW4gaW50cmluc2ljYWxseSBmb2N1c2FibGVcbiAgICAgICAgLy8gICBlbGVtZW50LCBtYWtlIHRoYXQgbm9kZSBhIG1hbmFnZWQgbm9kZS5cbiAgICAgICAgdGhpcy5fb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcih0aGlzLl9vbk11dGF0aW9uLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLl9vYnNlcnZlci5vYnNlcnZlKHRoaXMuX3Jvb3RFbGVtZW50LCB7IGF0dHJpYnV0ZXM6IHRydWUsIGNoaWxkTGlzdDogdHJ1ZSwgc3VidHJlZTogdHJ1ZSB9KTtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBDYWxsIHRoaXMgd2hlbmV2ZXIgdGhpcyBvYmplY3QgaXMgYWJvdXQgdG8gYmVjb21lIG9ic29sZXRlLiAgVGhpcyB1bndpbmRzIGFsbCBvZiB0aGUgc3RhdGVcbiAgICAgICAqIHN0b3JlZCBpbiB0aGlzIG9iamVjdCBhbmQgdXBkYXRlcyB0aGUgc3RhdGUgb2YgYWxsIG9mIHRoZSBtYW5hZ2VkIG5vZGVzLlxuICAgICAgICovXG5cblxuICAgICAgX2NyZWF0ZUNsYXNzKEluZXJ0Um9vdCwgW3tcbiAgICAgICAga2V5OiAnZGVzdHJ1Y3RvcicsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBkZXN0cnVjdG9yKCkge1xuICAgICAgICAgIHRoaXMuX29ic2VydmVyLmRpc2Nvbm5lY3QoKTtcblxuICAgICAgICAgIGlmICh0aGlzLl9yb290RWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3NhdmVkQXJpYUhpZGRlbiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICB0aGlzLl9yb290RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgdGhpcy5fc2F2ZWRBcmlhSGlkZGVuKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLl9tYW5hZ2VkTm9kZXMuZm9yRWFjaChmdW5jdGlvbiAoaW5lcnROb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl91bm1hbmFnZU5vZGUoaW5lcnROb2RlLm5vZGUpO1xuICAgICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgICAgLy8gTm90ZSB3ZSBjYXN0IHRoZSBudWxscyB0byB0aGUgQU5ZIHR5cGUgaGVyZSBiZWNhdXNlOlxuICAgICAgICAgIC8vIDEpIFdlIHdhbnQgdGhlIGNsYXNzIHByb3BlcnRpZXMgdG8gYmUgZGVjbGFyZWQgYXMgbm9uLW51bGwsIG9yIGVsc2Ugd2VcbiAgICAgICAgICAvLyAgICBuZWVkIGV2ZW4gbW9yZSBjYXN0cyB0aHJvdWdob3V0IHRoaXMgY29kZS4gQWxsIGJldHMgYXJlIG9mZiBpZiBhblxuICAgICAgICAgIC8vICAgIGluc3RhbmNlIGhhcyBiZWVuIGRlc3Ryb3llZCBhbmQgYSBtZXRob2QgaXMgY2FsbGVkLlxuICAgICAgICAgIC8vIDIpIFdlIGRvbid0IHdhbnQgdG8gY2FzdCBcInRoaXNcIiwgYmVjYXVzZSB3ZSB3YW50IHR5cGUtYXdhcmUgb3B0aW1pemF0aW9uc1xuICAgICAgICAgIC8vICAgIHRvIGtub3cgd2hpY2ggcHJvcGVydGllcyB3ZSdyZSBzZXR0aW5nLlxuICAgICAgICAgIHRoaXMuX29ic2VydmVyID0gLyoqIEB0eXBlIHs/fSAqL251bGw7XG4gICAgICAgICAgdGhpcy5fcm9vdEVsZW1lbnQgPSAvKiogQHR5cGUgez99ICovbnVsbDtcbiAgICAgICAgICB0aGlzLl9tYW5hZ2VkTm9kZXMgPSAvKiogQHR5cGUgez99ICovbnVsbDtcbiAgICAgICAgICB0aGlzLl9pbmVydE1hbmFnZXIgPSAvKiogQHR5cGUgez99ICovbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcmV0dXJuIHshU2V0PCFJbmVydE5vZGU+fSBBIGNvcHkgb2YgdGhpcyBJbmVydFJvb3QncyBtYW5hZ2VkIG5vZGVzIHNldC5cbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnX21ha2VTdWJ0cmVlVW5mb2N1c2FibGUnLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwYXJhbSB7IU5vZGV9IHN0YXJ0Tm9kZVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9tYWtlU3VidHJlZVVuZm9jdXNhYmxlKHN0YXJ0Tm9kZSkge1xuICAgICAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG4gICAgICAgICAgY29tcG9zZWRUcmVlV2FsayhzdGFydE5vZGUsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMyLl92aXNpdE5vZGUobm9kZSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICB2YXIgYWN0aXZlRWxlbWVudCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG5cbiAgICAgICAgICBpZiAoIWRvY3VtZW50LmJvZHkuY29udGFpbnMoc3RhcnROb2RlKSkge1xuICAgICAgICAgICAgLy8gc3RhcnROb2RlIG1heSBiZSBpbiBzaGFkb3cgRE9NLCBzbyBmaW5kIGl0cyBuZWFyZXN0IHNoYWRvd1Jvb3QgdG8gZ2V0IHRoZSBhY3RpdmVFbGVtZW50LlxuICAgICAgICAgICAgdmFyIG5vZGUgPSBzdGFydE5vZGU7XG4gICAgICAgICAgICAvKiogQHR5cGUgeyFTaGFkb3dSb290fHVuZGVmaW5lZH0gKi9cbiAgICAgICAgICAgIHZhciByb290ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IE5vZGUuRE9DVU1FTlRfRlJBR01FTlRfTk9ERSkge1xuICAgICAgICAgICAgICAgIHJvb3QgPSAvKiogQHR5cGUgeyFTaGFkb3dSb290fSAqL25vZGU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyb290KSB7XG4gICAgICAgICAgICAgIGFjdGl2ZUVsZW1lbnQgPSByb290LmFjdGl2ZUVsZW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzdGFydE5vZGUuY29udGFpbnMoYWN0aXZlRWxlbWVudCkpIHtcbiAgICAgICAgICAgIGFjdGl2ZUVsZW1lbnQuYmx1cigpO1xuICAgICAgICAgICAgLy8gSW4gSUUxMSwgaWYgYW4gZWxlbWVudCBpcyBhbHJlYWR5IGZvY3VzZWQsIGFuZCB0aGVuIHNldCB0byB0YWJpbmRleD0tMVxuICAgICAgICAgICAgLy8gY2FsbGluZyBibHVyKCkgd2lsbCBub3QgYWN0dWFsbHkgbW92ZSB0aGUgZm9jdXMuXG4gICAgICAgICAgICAvLyBUbyB3b3JrIGFyb3VuZCB0aGlzIHdlIGNhbGwgZm9jdXMoKSBvbiB0aGUgYm9keSBpbnN0ZWFkLlxuICAgICAgICAgICAgaWYgKGFjdGl2ZUVsZW1lbnQgPT09IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5mb2N1cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gICAgICAgICAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ192aXNpdE5vZGUnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX3Zpc2l0Tm9kZShub2RlKSB7XG4gICAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgIT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBlbGVtZW50ID0gLyoqIEB0eXBlIHshRWxlbWVudH0gKi9ub2RlO1xuXG4gICAgICAgICAgLy8gSWYgYSBkZXNjZW5kYW50IGluZXJ0IHJvb3QgYmVjb21lcyB1bi1pbmVydCwgaXRzIGRlc2NlbmRhbnRzIHdpbGwgc3RpbGwgYmUgaW5lcnQgYmVjYXVzZSBvZlxuICAgICAgICAgIC8vIHRoaXMgaW5lcnQgcm9vdCwgc28gYWxsIG9mIGl0cyBtYW5hZ2VkIG5vZGVzIG5lZWQgdG8gYmUgYWRvcHRlZCBieSB0aGlzIEluZXJ0Um9vdC5cbiAgICAgICAgICBpZiAoZWxlbWVudCAhPT0gdGhpcy5fcm9vdEVsZW1lbnQgJiYgZWxlbWVudC5oYXNBdHRyaWJ1dGUoJ2luZXJ0JykpIHtcbiAgICAgICAgICAgIHRoaXMuX2Fkb3B0SW5lcnRSb290KGVsZW1lbnQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChtYXRjaGVzLmNhbGwoZWxlbWVudCwgX2ZvY3VzYWJsZUVsZW1lbnRzU3RyaW5nKSB8fCBlbGVtZW50Lmhhc0F0dHJpYnV0ZSgndGFiaW5kZXgnKSkge1xuICAgICAgICAgICAgdGhpcy5fbWFuYWdlTm9kZShlbGVtZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVnaXN0ZXIgdGhlIGdpdmVuIG5vZGUgd2l0aCB0aGlzIEluZXJ0Um9vdCBhbmQgd2l0aCBJbmVydE1hbmFnZXIuXG4gICAgICAgICAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnX21hbmFnZU5vZGUnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX21hbmFnZU5vZGUobm9kZSkge1xuICAgICAgICAgIHZhciBpbmVydE5vZGUgPSB0aGlzLl9pbmVydE1hbmFnZXIucmVnaXN0ZXIobm9kZSwgdGhpcyk7XG4gICAgICAgICAgdGhpcy5fbWFuYWdlZE5vZGVzLmFkZChpbmVydE5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVucmVnaXN0ZXIgdGhlIGdpdmVuIG5vZGUgd2l0aCB0aGlzIEluZXJ0Um9vdCBhbmQgd2l0aCBJbmVydE1hbmFnZXIuXG4gICAgICAgICAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnX3VubWFuYWdlTm9kZScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfdW5tYW5hZ2VOb2RlKG5vZGUpIHtcbiAgICAgICAgICB2YXIgaW5lcnROb2RlID0gdGhpcy5faW5lcnRNYW5hZ2VyLmRlcmVnaXN0ZXIobm9kZSwgdGhpcyk7XG4gICAgICAgICAgaWYgKGluZXJ0Tm9kZSkge1xuICAgICAgICAgICAgdGhpcy5fbWFuYWdlZE5vZGVzWydkZWxldGUnXShpbmVydE5vZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBVbnJlZ2lzdGVyIHRoZSBlbnRpcmUgc3VidHJlZSBzdGFydGluZyBhdCBgc3RhcnROb2RlYC5cbiAgICAgICAgICogQHBhcmFtIHshTm9kZX0gc3RhcnROb2RlXG4gICAgICAgICAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ191bm1hbmFnZVN1YnRyZWUnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX3VubWFuYWdlU3VidHJlZShzdGFydE5vZGUpIHtcbiAgICAgICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuICAgICAgICAgIGNvbXBvc2VkVHJlZVdhbGsoc3RhcnROb2RlLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzMy5fdW5tYW5hZ2VOb2RlKG5vZGUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIGEgZGVzY2VuZGFudCBub2RlIGlzIGZvdW5kIHdpdGggYW4gYGluZXJ0YCBhdHRyaWJ1dGUsIGFkb3B0IGl0cyBtYW5hZ2VkIG5vZGVzLlxuICAgICAgICAgKiBAcGFyYW0geyFFbGVtZW50fSBub2RlXG4gICAgICAgICAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ19hZG9wdEluZXJ0Um9vdCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfYWRvcHRJbmVydFJvb3Qobm9kZSkge1xuICAgICAgICAgIHZhciBpbmVydFN1YnJvb3QgPSB0aGlzLl9pbmVydE1hbmFnZXIuZ2V0SW5lcnRSb290KG5vZGUpO1xuXG4gICAgICAgICAgLy8gRHVyaW5nIGluaXRpYWxpc2F0aW9uIHRoaXMgaW5lcnQgcm9vdCBtYXkgbm90IGhhdmUgYmVlbiByZWdpc3RlcmVkIHlldCxcbiAgICAgICAgICAvLyBzbyByZWdpc3RlciBpdCBub3cgaWYgbmVlZCBiZS5cbiAgICAgICAgICBpZiAoIWluZXJ0U3Vicm9vdCkge1xuICAgICAgICAgICAgdGhpcy5faW5lcnRNYW5hZ2VyLnNldEluZXJ0KG5vZGUsIHRydWUpO1xuICAgICAgICAgICAgaW5lcnRTdWJyb290ID0gdGhpcy5faW5lcnRNYW5hZ2VyLmdldEluZXJ0Um9vdChub2RlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpbmVydFN1YnJvb3QubWFuYWdlZE5vZGVzLmZvckVhY2goZnVuY3Rpb24gKHNhdmVkSW5lcnROb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9tYW5hZ2VOb2RlKHNhdmVkSW5lcnROb2RlLm5vZGUpO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGxiYWNrIHVzZWQgd2hlbiBtdXRhdGlvbiBvYnNlcnZlciBkZXRlY3RzIHN1YnRyZWUgYWRkaXRpb25zLCByZW1vdmFscywgb3IgYXR0cmlidXRlIGNoYW5nZXMuXG4gICAgICAgICAqIEBwYXJhbSB7IUFycmF5PCFNdXRhdGlvblJlY29yZD59IHJlY29yZHNcbiAgICAgICAgICogQHBhcmFtIHshTXV0YXRpb25PYnNlcnZlcn0gc2VsZlxuICAgICAgICAgKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdfb25NdXRhdGlvbicsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfb25NdXRhdGlvbihyZWNvcmRzLCBzZWxmKSB7XG4gICAgICAgICAgcmVjb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uIChyZWNvcmQpIHtcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSAvKiogQHR5cGUgeyFFbGVtZW50fSAqL3JlY29yZC50YXJnZXQ7XG4gICAgICAgICAgICBpZiAocmVjb3JkLnR5cGUgPT09ICdjaGlsZExpc3QnKSB7XG4gICAgICAgICAgICAgIC8vIE1hbmFnZSBhZGRlZCBub2Rlc1xuICAgICAgICAgICAgICBzbGljZS5jYWxsKHJlY29yZC5hZGRlZE5vZGVzKS5mb3JFYWNoKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFrZVN1YnRyZWVVbmZvY3VzYWJsZShub2RlKTtcbiAgICAgICAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgICAgICAgLy8gVW4tbWFuYWdlIHJlbW92ZWQgbm9kZXNcbiAgICAgICAgICAgICAgc2xpY2UuY2FsbChyZWNvcmQucmVtb3ZlZE5vZGVzKS5mb3JFYWNoKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdW5tYW5hZ2VTdWJ0cmVlKG5vZGUpO1xuICAgICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVjb3JkLnR5cGUgPT09ICdhdHRyaWJ1dGVzJykge1xuICAgICAgICAgICAgICBpZiAocmVjb3JkLmF0dHJpYnV0ZU5hbWUgPT09ICd0YWJpbmRleCcpIHtcbiAgICAgICAgICAgICAgICAvLyBSZS1pbml0aWFsaXNlIGluZXJ0IG5vZGUgaWYgdGFiaW5kZXggY2hhbmdlc1xuICAgICAgICAgICAgICAgIHRoaXMuX21hbmFnZU5vZGUodGFyZ2V0KTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YXJnZXQgIT09IHRoaXMuX3Jvb3RFbGVtZW50ICYmIHJlY29yZC5hdHRyaWJ1dGVOYW1lID09PSAnaW5lcnQnICYmIHRhcmdldC5oYXNBdHRyaWJ1dGUoJ2luZXJ0JykpIHtcbiAgICAgICAgICAgICAgICAvLyBJZiBhIG5ldyBpbmVydCByb290IGlzIGFkZGVkLCBhZG9wdCBpdHMgbWFuYWdlZCBub2RlcyBhbmQgbWFrZSBzdXJlIGl0IGtub3dzIGFib3V0IHRoZVxuICAgICAgICAgICAgICAgIC8vIGFscmVhZHkgbWFuYWdlZCBub2RlcyBmcm9tIHRoaXMgaW5lcnQgc3Vicm9vdC5cbiAgICAgICAgICAgICAgICB0aGlzLl9hZG9wdEluZXJ0Um9vdCh0YXJnZXQpO1xuICAgICAgICAgICAgICAgIHZhciBpbmVydFN1YnJvb3QgPSB0aGlzLl9pbmVydE1hbmFnZXIuZ2V0SW5lcnRSb290KHRhcmdldCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFuYWdlZE5vZGVzLmZvckVhY2goZnVuY3Rpb24gKG1hbmFnZWROb2RlKSB7XG4gICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmNvbnRhaW5zKG1hbmFnZWROb2RlLm5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZXJ0U3Vicm9vdC5fbWFuYWdlTm9kZShtYW5hZ2VkTm9kZS5ub2RlKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ21hbmFnZWROb2RlcycsXG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgIHJldHVybiBuZXcgU2V0KHRoaXMuX21hbmFnZWROb2Rlcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvKiogQHJldHVybiB7Ym9vbGVhbn0gKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdoYXNTYXZlZEFyaWFIaWRkZW4nLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fc2F2ZWRBcmlhSGlkZGVuICE9PSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIEBwYXJhbSB7P3N0cmluZ30gYXJpYUhpZGRlbiAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ3NhdmVkQXJpYUhpZGRlbicsXG4gICAgICAgIHNldDogZnVuY3Rpb24gc2V0KGFyaWFIaWRkZW4pIHtcbiAgICAgICAgICB0aGlzLl9zYXZlZEFyaWFIaWRkZW4gPSBhcmlhSGlkZGVuO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIEByZXR1cm4gez9zdHJpbmd9ICovXG4gICAgICAgICxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX3NhdmVkQXJpYUhpZGRlbjtcbiAgICAgICAgfVxuICAgICAgfV0pO1xuXG4gICAgICByZXR1cm4gSW5lcnRSb290O1xuICAgIH0oKTtcblxuICAgIC8qKlxuICAgICAqIGBJbmVydE5vZGVgIGluaXRpYWxpc2VzIGFuZCBtYW5hZ2VzIGEgc2luZ2xlIGluZXJ0IG5vZGUuXG4gICAgICogQSBub2RlIGlzIGluZXJ0IGlmIGl0IGlzIGEgZGVzY2VuZGFudCBvZiBvbmUgb3IgbW9yZSBpbmVydCByb290IGVsZW1lbnRzLlxuICAgICAqXG4gICAgICogT24gY29uc3RydWN0aW9uLCBgSW5lcnROb2RlYCBzYXZlcyB0aGUgZXhpc3RpbmcgYHRhYmluZGV4YCB2YWx1ZSBmb3IgdGhlIG5vZGUsIGlmIGFueSwgYW5kXG4gICAgICogZWl0aGVyIHJlbW92ZXMgdGhlIGB0YWJpbmRleGAgYXR0cmlidXRlIG9yIHNldHMgaXQgdG8gYC0xYCwgZGVwZW5kaW5nIG9uIHdoZXRoZXIgdGhlIGVsZW1lbnRcbiAgICAgKiBpcyBpbnRyaW5zaWNhbGx5IGZvY3VzYWJsZSBvciBub3QuXG4gICAgICpcbiAgICAgKiBgSW5lcnROb2RlYCBtYWludGFpbnMgYSBzZXQgb2YgYEluZXJ0Um9vdGBzIHdoaWNoIGFyZSBkZXNjZW5kYW50cyBvZiB0aGlzIGBJbmVydE5vZGVgLiBXaGVuIGFuXG4gICAgICogYEluZXJ0Um9vdGAgaXMgZGVzdHJveWVkLCBhbmQgY2FsbHMgYEluZXJ0TWFuYWdlci5kZXJlZ2lzdGVyKClgLCB0aGUgYEluZXJ0TWFuYWdlcmAgbm90aWZpZXMgdGhlXG4gICAgICogYEluZXJ0Tm9kZWAgdmlhIGByZW1vdmVJbmVydFJvb3QoKWAsIHdoaWNoIGluIHR1cm4gZGVzdHJveXMgdGhlIGBJbmVydE5vZGVgIGlmIG5vIGBJbmVydFJvb3Rgc1xuICAgICAqIHJlbWFpbiBpbiB0aGUgc2V0LiBPbiBkZXN0cnVjdGlvbiwgYEluZXJ0Tm9kZWAgcmVpbnN0YXRlcyB0aGUgc3RvcmVkIGB0YWJpbmRleGAgaWYgb25lIGV4aXN0cyxcbiAgICAgKiBvciByZW1vdmVzIHRoZSBgdGFiaW5kZXhgIGF0dHJpYnV0ZSBpZiB0aGUgZWxlbWVudCBpcyBpbnRyaW5zaWNhbGx5IGZvY3VzYWJsZS5cbiAgICAgKi9cblxuXG4gICAgdmFyIEluZXJ0Tm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8qKlxuICAgICAgICogQHBhcmFtIHshTm9kZX0gbm9kZSBBIGZvY3VzYWJsZSBlbGVtZW50IHRvIGJlIG1hZGUgaW5lcnQuXG4gICAgICAgKiBAcGFyYW0geyFJbmVydFJvb3R9IGluZXJ0Um9vdCBUaGUgaW5lcnQgcm9vdCBlbGVtZW50IGFzc29jaWF0ZWQgd2l0aCB0aGlzIGluZXJ0IG5vZGUuXG4gICAgICAgKi9cbiAgICAgIGZ1bmN0aW9uIEluZXJ0Tm9kZShub2RlLCBpbmVydFJvb3QpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEluZXJ0Tm9kZSk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHshTm9kZX0gKi9cbiAgICAgICAgdGhpcy5fbm9kZSA9IG5vZGU7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtib29sZWFufSAqL1xuICAgICAgICB0aGlzLl9vdmVycm9kZUZvY3VzTWV0aG9kID0gZmFsc2U7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHshU2V0PCFJbmVydFJvb3Q+fSBUaGUgc2V0IG9mIGRlc2NlbmRhbnQgaW5lcnQgcm9vdHMuXG4gICAgICAgICAqICAgIElmIGFuZCBvbmx5IGlmIHRoaXMgc2V0IGJlY29tZXMgZW1wdHksIHRoaXMgbm9kZSBpcyBubyBsb25nZXIgaW5lcnQuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9pbmVydFJvb3RzID0gbmV3IFNldChbaW5lcnRSb290XSk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHs/bnVtYmVyfSAqL1xuICAgICAgICB0aGlzLl9zYXZlZFRhYkluZGV4ID0gbnVsbDtcblxuICAgICAgICAvKiogQHR5cGUge2Jvb2xlYW59ICovXG4gICAgICAgIHRoaXMuX2Rlc3Ryb3llZCA9IGZhbHNlO1xuXG4gICAgICAgIC8vIFNhdmUgYW55IHByaW9yIHRhYmluZGV4IGluZm8gYW5kIG1ha2UgdGhpcyBub2RlIHVudGFiYmFibGVcbiAgICAgICAgdGhpcy5lbnN1cmVVbnRhYmJhYmxlKCk7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogQ2FsbCB0aGlzIHdoZW5ldmVyIHRoaXMgb2JqZWN0IGlzIGFib3V0IHRvIGJlY29tZSBvYnNvbGV0ZS5cbiAgICAgICAqIFRoaXMgbWFrZXMgdGhlIG1hbmFnZWQgbm9kZSBmb2N1c2FibGUgYWdhaW4gYW5kIGRlbGV0ZXMgYWxsIG9mIHRoZSBwcmV2aW91c2x5IHN0b3JlZCBzdGF0ZS5cbiAgICAgICAqL1xuXG5cbiAgICAgIF9jcmVhdGVDbGFzcyhJbmVydE5vZGUsIFt7XG4gICAgICAgIGtleTogJ2Rlc3RydWN0b3InLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZGVzdHJ1Y3RvcigpIHtcbiAgICAgICAgICB0aGlzLl90aHJvd0lmRGVzdHJveWVkKCk7XG5cbiAgICAgICAgICBpZiAodGhpcy5fbm9kZSAmJiB0aGlzLl9ub2RlLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSAvKiogQHR5cGUgeyFFbGVtZW50fSAqL3RoaXMuX25vZGU7XG4gICAgICAgICAgICBpZiAodGhpcy5fc2F2ZWRUYWJJbmRleCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCB0aGlzLl9zYXZlZFRhYkluZGV4KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCd0YWJpbmRleCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBVc2UgYGRlbGV0ZWAgdG8gcmVzdG9yZSBuYXRpdmUgZm9jdXMgbWV0aG9kLlxuICAgICAgICAgICAgaWYgKHRoaXMuX292ZXJyb2RlRm9jdXNNZXRob2QpIHtcbiAgICAgICAgICAgICAgZGVsZXRlIGVsZW1lbnQuZm9jdXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gU2VlIG5vdGUgaW4gSW5lcnRSb290LmRlc3RydWN0b3IgZm9yIHdoeSB3ZSBjYXN0IHRoZXNlIG51bGxzIHRvIEFOWS5cbiAgICAgICAgICB0aGlzLl9ub2RlID0gLyoqIEB0eXBlIHs/fSAqL251bGw7XG4gICAgICAgICAgdGhpcy5faW5lcnRSb290cyA9IC8qKiBAdHlwZSB7P30gKi9udWxsO1xuICAgICAgICAgIHRoaXMuX2Rlc3Ryb3llZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59IFdoZXRoZXIgdGhpcyBvYmplY3QgaXMgb2Jzb2xldGUgYmVjYXVzZSB0aGUgbWFuYWdlZCBub2RlIGlzIG5vIGxvbmdlciBpbmVydC5cbiAgICAgICAgICogSWYgdGhlIG9iamVjdCBoYXMgYmVlbiBkZXN0cm95ZWQsIGFueSBhdHRlbXB0IHRvIGFjY2VzcyBpdCB3aWxsIGNhdXNlIGFuIGV4Y2VwdGlvbi5cbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnX3Rocm93SWZEZXN0cm95ZWQnLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRocm93IGlmIHVzZXIgdHJpZXMgdG8gYWNjZXNzIGRlc3Ryb3llZCBJbmVydE5vZGUuXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX3Rocm93SWZEZXN0cm95ZWQoKSB7XG4gICAgICAgICAgaWYgKHRoaXMuZGVzdHJveWVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RyeWluZyB0byBhY2Nlc3MgZGVzdHJveWVkIEluZXJ0Tm9kZScpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBAcmV0dXJuIHtib29sZWFufSAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ2Vuc3VyZVVudGFiYmFibGUnLFxuXG5cbiAgICAgICAgLyoqIFNhdmUgdGhlIGV4aXN0aW5nIHRhYmluZGV4IHZhbHVlIGFuZCBtYWtlIHRoZSBub2RlIHVudGFiYmFibGUgYW5kIHVuZm9jdXNhYmxlICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBlbnN1cmVVbnRhYmJhYmxlKCkge1xuICAgICAgICAgIGlmICh0aGlzLm5vZGUubm9kZVR5cGUgIT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBlbGVtZW50ID0gLyoqIEB0eXBlIHshRWxlbWVudH0gKi90aGlzLm5vZGU7XG4gICAgICAgICAgaWYgKG1hdGNoZXMuY2FsbChlbGVtZW50LCBfZm9jdXNhYmxlRWxlbWVudHNTdHJpbmcpKSB7XG4gICAgICAgICAgICBpZiAoIC8qKiBAdHlwZSB7IUhUTUxFbGVtZW50fSAqL2VsZW1lbnQudGFiSW5kZXggPT09IC0xICYmIHRoaXMuaGFzU2F2ZWRUYWJJbmRleCkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZSgndGFiaW5kZXgnKSkge1xuICAgICAgICAgICAgICB0aGlzLl9zYXZlZFRhYkluZGV4ID0gLyoqIEB0eXBlIHshSFRNTEVsZW1lbnR9ICovZWxlbWVudC50YWJJbmRleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQuZm9jdXMgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgICAgICAgdGhpcy5fb3ZlcnJvZGVGb2N1c01ldGhvZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZSgndGFiaW5kZXgnKSkge1xuICAgICAgICAgICAgdGhpcy5fc2F2ZWRUYWJJbmRleCA9IC8qKiBAdHlwZSB7IUhUTUxFbGVtZW50fSAqL2VsZW1lbnQudGFiSW5kZXg7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgndGFiaW5kZXgnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQWRkIGFub3RoZXIgaW5lcnQgcm9vdCB0byB0aGlzIGluZXJ0IG5vZGUncyBzZXQgb2YgbWFuYWdpbmcgaW5lcnQgcm9vdHMuXG4gICAgICAgICAqIEBwYXJhbSB7IUluZXJ0Um9vdH0gaW5lcnRSb290XG4gICAgICAgICAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ2FkZEluZXJ0Um9vdCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBhZGRJbmVydFJvb3QoaW5lcnRSb290KSB7XG4gICAgICAgICAgdGhpcy5fdGhyb3dJZkRlc3Ryb3llZCgpO1xuICAgICAgICAgIHRoaXMuX2luZXJ0Um9vdHMuYWRkKGluZXJ0Um9vdCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlIHRoZSBnaXZlbiBpbmVydCByb290IGZyb20gdGhpcyBpbmVydCBub2RlJ3Mgc2V0IG9mIG1hbmFnaW5nIGluZXJ0IHJvb3RzLlxuICAgICAgICAgKiBJZiB0aGUgc2V0IG9mIG1hbmFnaW5nIGluZXJ0IHJvb3RzIGJlY29tZXMgZW1wdHksIHRoaXMgbm9kZSBpcyBubyBsb25nZXIgaW5lcnQsXG4gICAgICAgICAqIHNvIHRoZSBvYmplY3Qgc2hvdWxkIGJlIGRlc3Ryb3llZC5cbiAgICAgICAgICogQHBhcmFtIHshSW5lcnRSb290fSBpbmVydFJvb3RcbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAncmVtb3ZlSW5lcnRSb290JyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlbW92ZUluZXJ0Um9vdChpbmVydFJvb3QpIHtcbiAgICAgICAgICB0aGlzLl90aHJvd0lmRGVzdHJveWVkKCk7XG4gICAgICAgICAgdGhpcy5faW5lcnRSb290c1snZGVsZXRlJ10oaW5lcnRSb290KTtcbiAgICAgICAgICBpZiAodGhpcy5faW5lcnRSb290cy5zaXplID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLmRlc3RydWN0b3IoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnZGVzdHJveWVkJyxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgcmV0dXJuICgvKiogQHR5cGUgeyFJbmVydE5vZGV9ICovdGhpcy5fZGVzdHJveWVkXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdoYXNTYXZlZFRhYkluZGV4JyxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX3NhdmVkVGFiSW5kZXggIT09IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvKiogQHJldHVybiB7IU5vZGV9ICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnbm9kZScsXG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgIHRoaXMuX3Rocm93SWZEZXN0cm95ZWQoKTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fbm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBAcGFyYW0gez9udW1iZXJ9IHRhYkluZGV4ICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnc2F2ZWRUYWJJbmRleCcsXG4gICAgICAgIHNldDogZnVuY3Rpb24gc2V0KHRhYkluZGV4KSB7XG4gICAgICAgICAgdGhpcy5fdGhyb3dJZkRlc3Ryb3llZCgpO1xuICAgICAgICAgIHRoaXMuX3NhdmVkVGFiSW5kZXggPSB0YWJJbmRleDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBAcmV0dXJuIHs/bnVtYmVyfSAqL1xuICAgICAgICAsXG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgIHRoaXMuX3Rocm93SWZEZXN0cm95ZWQoKTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fc2F2ZWRUYWJJbmRleDtcbiAgICAgICAgfVxuICAgICAgfV0pO1xuXG4gICAgICByZXR1cm4gSW5lcnROb2RlO1xuICAgIH0oKTtcblxuICAgIC8qKlxuICAgICAqIEluZXJ0TWFuYWdlciBpcyBhIHBlci1kb2N1bWVudCBzaW5nbGV0b24gb2JqZWN0IHdoaWNoIG1hbmFnZXMgYWxsIGluZXJ0IHJvb3RzIGFuZCBub2Rlcy5cbiAgICAgKlxuICAgICAqIFdoZW4gYW4gZWxlbWVudCBiZWNvbWVzIGFuIGluZXJ0IHJvb3QgYnkgaGF2aW5nIGFuIGBpbmVydGAgYXR0cmlidXRlIHNldCBhbmQvb3IgaXRzIGBpbmVydGBcbiAgICAgKiBwcm9wZXJ0eSBzZXQgdG8gYHRydWVgLCB0aGUgYHNldEluZXJ0YCBtZXRob2QgY3JlYXRlcyBhbiBgSW5lcnRSb290YCBvYmplY3QgZm9yIHRoZSBlbGVtZW50LlxuICAgICAqIFRoZSBgSW5lcnRSb290YCBpbiB0dXJuIHJlZ2lzdGVycyBpdHNlbGYgYXMgbWFuYWdpbmcgYWxsIG9mIHRoZSBlbGVtZW50J3MgZm9jdXNhYmxlIGRlc2NlbmRhbnRcbiAgICAgKiBub2RlcyB2aWEgdGhlIGByZWdpc3RlcigpYCBtZXRob2QuIFRoZSBgSW5lcnRNYW5hZ2VyYCBlbnN1cmVzIHRoYXQgYSBzaW5nbGUgYEluZXJ0Tm9kZWAgaW5zdGFuY2VcbiAgICAgKiBpcyBjcmVhdGVkIGZvciBlYWNoIHN1Y2ggbm9kZSwgdmlhIHRoZSBgX21hbmFnZWROb2Rlc2AgbWFwLlxuICAgICAqL1xuXG5cbiAgICB2YXIgSW5lcnRNYW5hZ2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgLyoqXG4gICAgICAgKiBAcGFyYW0geyFEb2N1bWVudH0gZG9jdW1lbnRcbiAgICAgICAqL1xuICAgICAgZnVuY3Rpb24gSW5lcnRNYW5hZ2VyKGRvY3VtZW50KSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBJbmVydE1hbmFnZXIpO1xuXG4gICAgICAgIGlmICghZG9jdW1lbnQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgcmVxdWlyZWQgYXJndW1lbnQ7IEluZXJ0TWFuYWdlciBuZWVkcyB0byB3cmFwIGEgZG9jdW1lbnQuJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvKiogQHR5cGUgeyFEb2N1bWVudH0gKi9cbiAgICAgICAgdGhpcy5fZG9jdW1lbnQgPSBkb2N1bWVudDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQWxsIG1hbmFnZWQgbm9kZXMga25vd24gdG8gdGhpcyBJbmVydE1hbmFnZXIuIEluIGEgbWFwIHRvIGFsbG93IGxvb2tpbmcgdXAgYnkgTm9kZS5cbiAgICAgICAgICogQHR5cGUgeyFNYXA8IU5vZGUsICFJbmVydE5vZGU+fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fbWFuYWdlZE5vZGVzID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBbGwgaW5lcnQgcm9vdHMga25vd24gdG8gdGhpcyBJbmVydE1hbmFnZXIuIEluIGEgbWFwIHRvIGFsbG93IGxvb2tpbmcgdXAgYnkgTm9kZS5cbiAgICAgICAgICogQHR5cGUgeyFNYXA8IU5vZGUsICFJbmVydFJvb3Q+fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5faW5lcnRSb290cyA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogT2JzZXJ2ZXIgZm9yIG11dGF0aW9ucyBvbiBgZG9jdW1lbnQuYm9keWAuXG4gICAgICAgICAqIEB0eXBlIHshTXV0YXRpb25PYnNlcnZlcn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX29ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIodGhpcy5fd2F0Y2hGb3JJbmVydC5iaW5kKHRoaXMpKTtcblxuICAgICAgICAvLyBBZGQgaW5lcnQgc3R5bGUuXG4gICAgICAgIGFkZEluZXJ0U3R5bGUoZG9jdW1lbnQuaGVhZCB8fCBkb2N1bWVudC5ib2R5IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCk7XG5cbiAgICAgICAgLy8gV2FpdCBmb3IgZG9jdW1lbnQgdG8gYmUgbG9hZGVkLlxuICAgICAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2xvYWRpbmcnKSB7XG4gICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIHRoaXMuX29uRG9jdW1lbnRMb2FkZWQuYmluZCh0aGlzKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fb25Eb2N1bWVudExvYWRlZCgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogU2V0IHdoZXRoZXIgdGhlIGdpdmVuIGVsZW1lbnQgc2hvdWxkIGJlIGFuIGluZXJ0IHJvb3Qgb3Igbm90LlxuICAgICAgICogQHBhcmFtIHshRWxlbWVudH0gcm9vdFxuICAgICAgICogQHBhcmFtIHtib29sZWFufSBpbmVydFxuICAgICAgICovXG5cblxuICAgICAgX2NyZWF0ZUNsYXNzKEluZXJ0TWFuYWdlciwgW3tcbiAgICAgICAga2V5OiAnc2V0SW5lcnQnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc2V0SW5lcnQocm9vdCwgaW5lcnQpIHtcbiAgICAgICAgICBpZiAoaW5lcnQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9pbmVydFJvb3RzLmhhcyhyb290KSkge1xuICAgICAgICAgICAgICAvLyBlbGVtZW50IGlzIGFscmVhZHkgaW5lcnRcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgaW5lcnRSb290ID0gbmV3IEluZXJ0Um9vdChyb290LCB0aGlzKTtcbiAgICAgICAgICAgIHJvb3Quc2V0QXR0cmlidXRlKCdpbmVydCcsICcnKTtcbiAgICAgICAgICAgIHRoaXMuX2luZXJ0Um9vdHMuc2V0KHJvb3QsIGluZXJ0Um9vdCk7XG4gICAgICAgICAgICAvLyBJZiBub3QgY29udGFpbmVkIGluIHRoZSBkb2N1bWVudCwgaXQgbXVzdCBiZSBpbiBhIHNoYWRvd1Jvb3QuXG4gICAgICAgICAgICAvLyBFbnN1cmUgaW5lcnQgc3R5bGVzIGFyZSBhZGRlZCB0aGVyZS5cbiAgICAgICAgICAgIGlmICghdGhpcy5fZG9jdW1lbnQuYm9keS5jb250YWlucyhyb290KSkge1xuICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gcm9vdC5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICB3aGlsZSAocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudC5ub2RlVHlwZSA9PT0gMTEpIHtcbiAgICAgICAgICAgICAgICAgIGFkZEluZXJ0U3R5bGUocGFyZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9pbmVydFJvb3RzLmhhcyhyb290KSkge1xuICAgICAgICAgICAgICAvLyBlbGVtZW50IGlzIGFscmVhZHkgbm9uLWluZXJ0XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIF9pbmVydFJvb3QgPSB0aGlzLl9pbmVydFJvb3RzLmdldChyb290KTtcbiAgICAgICAgICAgIF9pbmVydFJvb3QuZGVzdHJ1Y3RvcigpO1xuICAgICAgICAgICAgdGhpcy5faW5lcnRSb290c1snZGVsZXRlJ10ocm9vdCk7XG4gICAgICAgICAgICByb290LnJlbW92ZUF0dHJpYnV0ZSgnaW5lcnQnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHRoZSBJbmVydFJvb3Qgb2JqZWN0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGdpdmVuIGluZXJ0IHJvb3QgZWxlbWVudCwgaWYgYW55LlxuICAgICAgICAgKiBAcGFyYW0geyFOb2RlfSBlbGVtZW50XG4gICAgICAgICAqIEByZXR1cm4geyFJbmVydFJvb3R8dW5kZWZpbmVkfVxuICAgICAgICAgKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdnZXRJbmVydFJvb3QnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0SW5lcnRSb290KGVsZW1lbnQpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5faW5lcnRSb290cy5nZXQoZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVnaXN0ZXIgdGhlIGdpdmVuIEluZXJ0Um9vdCBhcyBtYW5hZ2luZyB0aGUgZ2l2ZW4gbm9kZS5cbiAgICAgICAgICogSW4gdGhlIGNhc2Ugd2hlcmUgdGhlIG5vZGUgaGFzIGEgcHJldmlvdXNseSBleGlzdGluZyBpbmVydCByb290LCB0aGlzIGluZXJ0IHJvb3Qgd2lsbFxuICAgICAgICAgKiBiZSBhZGRlZCB0byBpdHMgc2V0IG9mIGluZXJ0IHJvb3RzLlxuICAgICAgICAgKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gICAgICAgICAqIEBwYXJhbSB7IUluZXJ0Um9vdH0gaW5lcnRSb290XG4gICAgICAgICAqIEByZXR1cm4geyFJbmVydE5vZGV9IGluZXJ0Tm9kZVxuICAgICAgICAgKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdyZWdpc3RlcicsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZWdpc3Rlcihub2RlLCBpbmVydFJvb3QpIHtcbiAgICAgICAgICB2YXIgaW5lcnROb2RlID0gdGhpcy5fbWFuYWdlZE5vZGVzLmdldChub2RlKTtcbiAgICAgICAgICBpZiAoaW5lcnROb2RlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vIG5vZGUgd2FzIGFscmVhZHkgaW4gYW4gaW5lcnQgc3VidHJlZVxuICAgICAgICAgICAgaW5lcnROb2RlLmFkZEluZXJ0Um9vdChpbmVydFJvb3QpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbmVydE5vZGUgPSBuZXcgSW5lcnROb2RlKG5vZGUsIGluZXJ0Um9vdCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5fbWFuYWdlZE5vZGVzLnNldChub2RlLCBpbmVydE5vZGUpO1xuXG4gICAgICAgICAgcmV0dXJuIGluZXJ0Tm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZS1yZWdpc3RlciB0aGUgZ2l2ZW4gSW5lcnRSb290IGFzIG1hbmFnaW5nIHRoZSBnaXZlbiBpbmVydCBub2RlLlxuICAgICAgICAgKiBSZW1vdmVzIHRoZSBpbmVydCByb290IGZyb20gdGhlIEluZXJ0Tm9kZSdzIHNldCBvZiBtYW5hZ2luZyBpbmVydCByb290cywgYW5kIHJlbW92ZSB0aGUgaW5lcnRcbiAgICAgICAgICogbm9kZSBmcm9tIHRoZSBJbmVydE1hbmFnZXIncyBzZXQgb2YgbWFuYWdlZCBub2RlcyBpZiBpdCBpcyBkZXN0cm95ZWQuXG4gICAgICAgICAqIElmIHRoZSBub2RlIGlzIG5vdCBjdXJyZW50bHkgbWFuYWdlZCwgdGhpcyBpcyBlc3NlbnRpYWxseSBhIG5vLW9wLlxuICAgICAgICAgKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gICAgICAgICAqIEBwYXJhbSB7IUluZXJ0Um9vdH0gaW5lcnRSb290XG4gICAgICAgICAqIEByZXR1cm4gez9JbmVydE5vZGV9IFRoZSBwb3RlbnRpYWxseSBkZXN0cm95ZWQgSW5lcnROb2RlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIG5vZGUsIGlmIGFueS5cbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnZGVyZWdpc3RlcicsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBkZXJlZ2lzdGVyKG5vZGUsIGluZXJ0Um9vdCkge1xuICAgICAgICAgIHZhciBpbmVydE5vZGUgPSB0aGlzLl9tYW5hZ2VkTm9kZXMuZ2V0KG5vZGUpO1xuICAgICAgICAgIGlmICghaW5lcnROb2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpbmVydE5vZGUucmVtb3ZlSW5lcnRSb290KGluZXJ0Um9vdCk7XG4gICAgICAgICAgaWYgKGluZXJ0Tm9kZS5kZXN0cm95ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX21hbmFnZWROb2Rlc1snZGVsZXRlJ10obm9kZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGluZXJ0Tm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsYmFjayB1c2VkIHdoZW4gZG9jdW1lbnQgaGFzIGZpbmlzaGVkIGxvYWRpbmcuXG4gICAgICAgICAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ19vbkRvY3VtZW50TG9hZGVkJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9vbkRvY3VtZW50TG9hZGVkKCkge1xuICAgICAgICAgIC8vIEZpbmQgYWxsIGluZXJ0IHJvb3RzIGluIGRvY3VtZW50IGFuZCBtYWtlIHRoZW0gYWN0dWFsbHkgaW5lcnQuXG4gICAgICAgICAgdmFyIGluZXJ0RWxlbWVudHMgPSBzbGljZS5jYWxsKHRoaXMuX2RvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tpbmVydF0nKSk7XG4gICAgICAgICAgaW5lcnRFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChpbmVydEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0SW5lcnQoaW5lcnRFbGVtZW50LCB0cnVlKTtcbiAgICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICAgIC8vIENvbW1lbnQgdGhpcyBvdXQgdG8gdXNlIHByb2dyYW1tYXRpYyBBUEkgb25seS5cbiAgICAgICAgICB0aGlzLl9vYnNlcnZlci5vYnNlcnZlKHRoaXMuX2RvY3VtZW50LmJvZHkgfHwgdGhpcy5fZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCB7IGF0dHJpYnV0ZXM6IHRydWUsIHN1YnRyZWU6IHRydWUsIGNoaWxkTGlzdDogdHJ1ZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsYmFjayB1c2VkIHdoZW4gbXV0YXRpb24gb2JzZXJ2ZXIgZGV0ZWN0cyBhdHRyaWJ1dGUgY2hhbmdlcy5cbiAgICAgICAgICogQHBhcmFtIHshQXJyYXk8IU11dGF0aW9uUmVjb3JkPn0gcmVjb3Jkc1xuICAgICAgICAgKiBAcGFyYW0geyFNdXRhdGlvbk9ic2VydmVyfSBzZWxmXG4gICAgICAgICAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ193YXRjaEZvckluZXJ0JyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF93YXRjaEZvckluZXJ0KHJlY29yZHMsIHNlbGYpIHtcbiAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgIHJlY29yZHMuZm9yRWFjaChmdW5jdGlvbiAocmVjb3JkKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHJlY29yZC50eXBlKSB7XG4gICAgICAgICAgICAgIGNhc2UgJ2NoaWxkTGlzdCc6XG4gICAgICAgICAgICAgICAgc2xpY2UuY2FsbChyZWNvcmQuYWRkZWROb2RlcykuZm9yRWFjaChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgIT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIHZhciBpbmVydEVsZW1lbnRzID0gc2xpY2UuY2FsbChub2RlLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tpbmVydF0nKSk7XG4gICAgICAgICAgICAgICAgICBpZiAobWF0Y2hlcy5jYWxsKG5vZGUsICdbaW5lcnRdJykpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5lcnRFbGVtZW50cy51bnNoaWZ0KG5vZGUpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaW5lcnRFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChpbmVydEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRJbmVydChpbmVydEVsZW1lbnQsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgfSwgX3RoaXMpO1xuICAgICAgICAgICAgICAgIH0sIF90aGlzKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSAnYXR0cmlidXRlcyc6XG4gICAgICAgICAgICAgICAgaWYgKHJlY29yZC5hdHRyaWJ1dGVOYW1lICE9PSAnaW5lcnQnKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSAvKiogQHR5cGUgeyFFbGVtZW50fSAqL3JlY29yZC50YXJnZXQ7XG4gICAgICAgICAgICAgICAgdmFyIGluZXJ0ID0gdGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnaW5lcnQnKTtcbiAgICAgICAgICAgICAgICBfdGhpcy5zZXRJbmVydCh0YXJnZXQsIGluZXJ0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfV0pO1xuXG4gICAgICByZXR1cm4gSW5lcnRNYW5hZ2VyO1xuICAgIH0oKTtcblxuICAgIC8qKlxuICAgICAqIFJlY3Vyc2l2ZWx5IHdhbGsgdGhlIGNvbXBvc2VkIHRyZWUgZnJvbSB8bm9kZXwuXG4gICAgICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICAgICAqIEBwYXJhbSB7KGZ1bmN0aW9uICghRWxlbWVudCkpPX0gY2FsbGJhY2sgQ2FsbGJhY2sgdG8gYmUgY2FsbGVkIGZvciBlYWNoIGVsZW1lbnQgdHJhdmVyc2VkLFxuICAgICAqICAgICBiZWZvcmUgZGVzY2VuZGluZyBpbnRvIGNoaWxkIG5vZGVzLlxuICAgICAqIEBwYXJhbSB7P1NoYWRvd1Jvb3Q9fSBzaGFkb3dSb290QW5jZXN0b3IgVGhlIG5lYXJlc3QgU2hhZG93Um9vdCBhbmNlc3RvciwgaWYgYW55LlxuICAgICAqL1xuXG5cbiAgICBmdW5jdGlvbiBjb21wb3NlZFRyZWVXYWxrKG5vZGUsIGNhbGxiYWNrLCBzaGFkb3dSb290QW5jZXN0b3IpIHtcbiAgICAgIGlmIChub2RlLm5vZGVUeXBlID09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0gLyoqIEB0eXBlIHshRWxlbWVudH0gKi9ub2RlO1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICBjYWxsYmFjayhlbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERlc2NlbmQgaW50byBub2RlOlxuICAgICAgICAvLyBJZiBpdCBoYXMgYSBTaGFkb3dSb290LCBpZ25vcmUgYWxsIGNoaWxkIGVsZW1lbnRzIC0gdGhlc2Ugd2lsbCBiZSBwaWNrZWRcbiAgICAgICAgLy8gdXAgYnkgdGhlIDxjb250ZW50PiBvciA8c2hhZG93PiBlbGVtZW50cy4gRGVzY2VuZCBzdHJhaWdodCBpbnRvIHRoZVxuICAgICAgICAvLyBTaGFkb3dSb290LlxuICAgICAgICB2YXIgc2hhZG93Um9vdCA9IC8qKiBAdHlwZSB7IUhUTUxFbGVtZW50fSAqL2VsZW1lbnQuc2hhZG93Um9vdDtcbiAgICAgICAgaWYgKHNoYWRvd1Jvb3QpIHtcbiAgICAgICAgICBjb21wb3NlZFRyZWVXYWxrKHNoYWRvd1Jvb3QsIGNhbGxiYWNrLCBzaGFkb3dSb290KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBpdCBpcyBhIDxjb250ZW50PiBlbGVtZW50LCBkZXNjZW5kIGludG8gZGlzdHJpYnV0ZWQgZWxlbWVudHMgLSB0aGVzZVxuICAgICAgICAvLyBhcmUgZWxlbWVudHMgZnJvbSBvdXRzaWRlIHRoZSBzaGFkb3cgcm9vdCB3aGljaCBhcmUgcmVuZGVyZWQgaW5zaWRlIHRoZVxuICAgICAgICAvLyBzaGFkb3cgRE9NLlxuICAgICAgICBpZiAoZWxlbWVudC5sb2NhbE5hbWUgPT0gJ2NvbnRlbnQnKSB7XG4gICAgICAgICAgdmFyIGNvbnRlbnQgPSAvKiogQHR5cGUgeyFIVE1MQ29udGVudEVsZW1lbnR9ICovZWxlbWVudDtcbiAgICAgICAgICAvLyBWZXJpZmllcyBpZiBTaGFkb3dEb20gdjAgaXMgc3VwcG9ydGVkLlxuICAgICAgICAgIHZhciBkaXN0cmlidXRlZE5vZGVzID0gY29udGVudC5nZXREaXN0cmlidXRlZE5vZGVzID8gY29udGVudC5nZXREaXN0cmlidXRlZE5vZGVzKCkgOiBbXTtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRpc3RyaWJ1dGVkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbXBvc2VkVHJlZVdhbGsoZGlzdHJpYnV0ZWROb2Rlc1tpXSwgY2FsbGJhY2ssIHNoYWRvd1Jvb3RBbmNlc3Rvcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGl0IGlzIGEgPHNsb3Q+IGVsZW1lbnQsIGRlc2NlbmQgaW50byBhc3NpZ25lZCBub2RlcyAtIHRoZXNlXG4gICAgICAgIC8vIGFyZSBlbGVtZW50cyBmcm9tIG91dHNpZGUgdGhlIHNoYWRvdyByb290IHdoaWNoIGFyZSByZW5kZXJlZCBpbnNpZGUgdGhlXG4gICAgICAgIC8vIHNoYWRvdyBET00uXG4gICAgICAgIGlmIChlbGVtZW50LmxvY2FsTmFtZSA9PSAnc2xvdCcpIHtcbiAgICAgICAgICB2YXIgc2xvdCA9IC8qKiBAdHlwZSB7IUhUTUxTbG90RWxlbWVudH0gKi9lbGVtZW50O1xuICAgICAgICAgIC8vIFZlcmlmeSBpZiBTaGFkb3dEb20gdjEgaXMgc3VwcG9ydGVkLlxuICAgICAgICAgIHZhciBfZGlzdHJpYnV0ZWROb2RlcyA9IHNsb3QuYXNzaWduZWROb2RlcyA/IHNsb3QuYXNzaWduZWROb2Rlcyh7IGZsYXR0ZW46IHRydWUgfSkgOiBbXTtcbiAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgX2Rpc3RyaWJ1dGVkTm9kZXMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBjb21wb3NlZFRyZWVXYWxrKF9kaXN0cmlidXRlZE5vZGVzW19pXSwgY2FsbGJhY2ssIHNoYWRvd1Jvb3RBbmNlc3Rvcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBpdCBpcyBuZWl0aGVyIHRoZSBwYXJlbnQgb2YgYSBTaGFkb3dSb290LCBhIDxjb250ZW50PiBlbGVtZW50LCBhIDxzbG90PlxuICAgICAgLy8gZWxlbWVudCwgbm9yIGEgPHNoYWRvdz4gZWxlbWVudCByZWN1cnNlIG5vcm1hbGx5LlxuICAgICAgdmFyIGNoaWxkID0gbm9kZS5maXJzdENoaWxkO1xuICAgICAgd2hpbGUgKGNoaWxkICE9IG51bGwpIHtcbiAgICAgICAgY29tcG9zZWRUcmVlV2FsayhjaGlsZCwgY2FsbGJhY2ssIHNoYWRvd1Jvb3RBbmNlc3Rvcik7XG4gICAgICAgIGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIHN0eWxlIGVsZW1lbnQgdG8gdGhlIG5vZGUgY29udGFpbmluZyB0aGUgaW5lcnQgc3BlY2lmaWMgc3R5bGVzXG4gICAgICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGFkZEluZXJ0U3R5bGUobm9kZSkge1xuICAgICAgaWYgKG5vZGUucXVlcnlTZWxlY3Rvcignc3R5bGUjaW5lcnQtc3R5bGUsIGxpbmsjaW5lcnQtc3R5bGUnKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgICAgc3R5bGUuc2V0QXR0cmlidXRlKCdpZCcsICdpbmVydC1zdHlsZScpO1xuICAgICAgc3R5bGUudGV4dENvbnRlbnQgPSAnXFxuJyArICdbaW5lcnRdIHtcXG4nICsgJyAgcG9pbnRlci1ldmVudHM6IG5vbmU7XFxuJyArICcgIGN1cnNvcjogZGVmYXVsdDtcXG4nICsgJ31cXG4nICsgJ1xcbicgKyAnW2luZXJ0XSwgW2luZXJ0XSAqIHtcXG4nICsgJyAgLXdlYmtpdC11c2VyLXNlbGVjdDogbm9uZTtcXG4nICsgJyAgLW1vei11c2VyLXNlbGVjdDogbm9uZTtcXG4nICsgJyAgLW1zLXVzZXItc2VsZWN0OiBub25lO1xcbicgKyAnICB1c2VyLXNlbGVjdDogbm9uZTtcXG4nICsgJ31cXG4nO1xuICAgICAgbm9kZS5hcHBlbmRDaGlsZChzdHlsZSk7XG4gICAgfVxuXG4gICAgaWYgKCFFbGVtZW50LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSgnaW5lcnQnKSkge1xuICAgICAgLyoqIEB0eXBlIHshSW5lcnRNYW5hZ2VyfSAqL1xuICAgICAgdmFyIGluZXJ0TWFuYWdlciA9IG5ldyBJbmVydE1hbmFnZXIoZG9jdW1lbnQpO1xuXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRWxlbWVudC5wcm90b3R5cGUsICdpbmVydCcsIHtcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgLyoqIEB0aGlzIHshRWxlbWVudH0gKi9cbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaGFzQXR0cmlidXRlKCdpbmVydCcpO1xuICAgICAgICB9LFxuICAgICAgICAvKiogQHRoaXMgeyFFbGVtZW50fSAqL1xuICAgICAgICBzZXQ6IGZ1bmN0aW9uIHNldChpbmVydCkge1xuICAgICAgICAgIGluZXJ0TWFuYWdlci5zZXRJbmVydCh0aGlzLCBpbmVydCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSkoKTtcblxufSkpKTtcbiIsImltcG9ydCBmaXhCYWNrZmFjZSBmcm9tICcuL2ZpeC1iYWNrZmFjZS5qcydcbmltcG9ydCAnd2ljZy1pbmVydCc7XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEcmF3ZXIge1xuICBwdWJsaWMgZHJhd2VyRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsXG4gIHB1YmxpYyBzd2l0Y2hFbGVtZW50cz86IE5vZGVMaXN0T2Y8SFRNTEVsZW1lbnQ+IHwgbnVsbFxuICBwdWJsaWMgaW5lcnRFbGVtZW50cz86IE5vZGVMaXN0T2Y8SFRNTEVsZW1lbnQ+IHwgbnVsbFxuICBwdWJsaWMgaXNFeHBhbmRlZDogYm9vbGVhbiA9IGZhbHNlXG4gIHB1YmxpYyBlbmFibGVGaXhCYWNrZmFjZTpib29sZWFuID0gdHJ1ZVxuICBwdWJsaWMgZW5hYmxlSGlzdG9yeTogYm9vbGVhbiA9IGZhbHNlXG4gIHB1YmxpYyBpZDogc3RyaW5nID0gJ0RyYXdlci0nICsgbmV3IERhdGUoKS5nZXRUaW1lKClcblxuICBjb25zdHJ1Y3RvcihhcmdzOiB7XG4gICAgZHJhd2VyOiBzdHJpbmdcbiAgICBzd2l0Y2g/OiBzdHJpbmdcbiAgICBpbmVydD86IHN0cmluZ1xuICAgIGVuYWJsZUZpeEJhY2tmYWNlPzogYm9vbGVhblxuICAgIGVuYWJsZUhpc3Rvcnk/OiBib29sZWFuXG4gIH0pIHtcbiAgICAvLyBEcmF3ZXIgYm9keVxuICAgIGlmICh0eXBlb2YgYXJncyAhPT0gJ29iamVjdCcgfHwgYXJncy5kcmF3ZXIgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06IFRoZSBcImRyYXdlclwiIHBhcmFtZXRlciBpcyByZXF1aXJlZC4gPT4gZXg6IG5ldyBEcmF3ZXIoeyBkcmF3ZXI6ICcjZHJhd2VyJyB9KWApXG4gICAgaWYgKHR5cGVvZiBhcmdzLmRyYXdlciAhPT0gJ3N0cmluZycgfHwgJycgKSB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTogVGhlIFwiZHJhd2VyXCIgcGFyYW1ldGVyIG11c3QgYmUgXCJzdHJpbmdcIiB0eXBlIGFuZCBcIkNTUyBzZWxlY3RvclwiLmApXG4gICAgaWYgKGFyZ3MuZHJhd2VyID09PSAnJyApIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OiBUaGUgXCJkcmF3ZXJcIiBwYXJhbWV0ZXIgaXMgZW1wdHkuYClcbiAgICB0aGlzLmRyYXdlckVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGFyZ3MuZHJhd2VyKVxuICAgIGlmICghdGhpcy5kcmF3ZXJFbGVtZW50KSB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTogVGhlIEVsZW1lbnQgZm9yIFwiZHJhd2VyXCIgaXMgbm90IGZvdW5kLmApXG4gICAgdGhpcy5kcmF3ZXJFbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS1kcmF3ZXItaXMtaW5pdGlhbGl6ZWQnLCAndHJ1ZScpXG4gICAgaWYgKHRoaXMuZHJhd2VyRWxlbWVudC5pZCkge1xuICAgICAgdGhpcy5pZCA9IHRoaXMuZHJhd2VyRWxlbWVudC5pZFxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQuaWQgPSB0aGlzLmlkXG4gICAgfVxuICAgIGlmICh0aGlzLmlzRXhwYW5kZWQpIHtcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2luZXJ0JylcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2hpZGRlbicpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2luZXJ0JywgJycpXG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQuc2V0QXR0cmlidXRlKCdoaWRkZW4nLCAnJylcbiAgICB9XG5cbiAgICAvLyBTd2l0Y2hlcyBmb3IgdG9nZ2xlXG4gICAgdGhpcy5zd2l0Y2hFbGVtZW50cyA9IHR5cGVvZiBhcmdzLnN3aXRjaCA9PT0gJ3N0cmluZycgP1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChhcmdzLnN3aXRjaCkgOiBudWxsXG4gICAgaWYgKHRoaXMuc3dpdGNoRWxlbWVudHMpIHtcbiAgICAgIHRoaXMuc3dpdGNoRWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlLmJpbmQodGhpcykpXG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdkYXRhLWRyYXdlci1pcycsICdpbml0aWFsaXplZCcpXG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWNvbnRyb2xzJywgdGhpcy5pZClcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gRWxlbWVudHMgdGhhdCBhcmUgc2V0IFwiaW5lcnRcIiBhdHRyaWJ1dGUgd2hlbiB0aGUgZHJhd2VyIGlzIGV4cGFuZGVkXG4gICAgdGhpcy5pbmVydEVsZW1lbnRzID0gdHlwZW9mIGFyZ3MuaW5lcnQgPT09ICdzdHJpbmcnID9cbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYXJncy5pbmVydCkgOiBudWxsXG4gICAgaWYgKHRoaXMuaW5lcnRFbGVtZW50cykge1xuICAgICAgdGhpcy5pbmVydEVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdkYXRhLWRyYXdlci1pcycsICdpbml0aWFsaXplZCcpXG4gICAgICAgIGlmICh0aGlzLmlzRXhwYW5kZWQpIHtcbiAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnaW5lcnQnLCAnJylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnaW5lcnQnKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIFByZXZlbnRpbmcgc2Nyb2xsIHdoZW4gdGhlIGRyYXdlciBpcyBleHBhbmRlZFxuICAgIHRoaXMuZW5hYmxlRml4QmFja2ZhY2UgPSBhcmdzLmVuYWJsZUZpeEJhY2tmYWNlID8/IHRydWVcblxuICAgIC8vIEFkZGluZyB0aGUgc3RhdGUgb2YgdGhlIGRyYXdlciB0byB0aGUgaGlzdG9yeSBvZiB5b3VyIGJyb3dzZXJcbiAgICBpZiAoYXJncy5lbmFibGVIaXN0b3J5KSB7XG4gICAgICB0aGlzLmVuYWJsZUhpc3RvcnkgPSB0cnVlXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncG9wc3RhdGUnLCB0aGlzLl9wb3BzdGF0ZUhhbmRsZXIuYmluZCh0aGlzKSlcbiAgICB9XG5cbiAgfVxuICB0b2dnbGUoZXZlbnQ6IEV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIGlmICh0aGlzLmlzRXhwYW5kZWQpIHtcbiAgICAgIHRoaXMuY2xvc2UoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm9wZW4oKVxuICAgIH1cbiAgfVxuICBvcGVuKCkge1xuICAgIHRoaXMuX2NoYW5nZVN0YXRlKHRydWUpXG4gICAgaWYgKHRoaXMuZW5hYmxlSGlzdG9yeSkgdGhpcy5fcHVzaFN0YXRlKHRydWUpXG4gIH1cbiAgY2xvc2UoKSB7XG4gICAgdGhpcy5fY2hhbmdlU3RhdGUoZmFsc2UpXG4gICAgaWYgKHRoaXMuZW5hYmxlSGlzdG9yeSkgdGhpcy5fcHVzaFN0YXRlKGZhbHNlKVxuICB9XG4gIHByaXZhdGUgX2NoYW5nZVN0YXRlKGlzRXhwYW5kZWQ6IGJvb2xlYW4pIHtcbiAgICBpZiAoaXNFeHBhbmRlZCkge1xuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50Py5yZW1vdmVBdHRyaWJ1dGUoJ2luZXJ0JylcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudD8ucmVtb3ZlQXR0cmlidXRlKCdoaWRkZW4nKVxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9rZXl1cEhhbmRsZXIuYmluZCh0aGlzKSlcblxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBXaGVuIHRoZSBkcmF3ZXIgaXMgaGlkZGVuXG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQ/LnNldEF0dHJpYnV0ZSgnaW5lcnQnLCAnJylcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudD8uc2V0QXR0cmlidXRlKCdoaWRkZW4nLCAnJylcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5fa2V5dXBIYW5kbGVyLmJpbmQodGhpcykpXG4gICAgfVxuXG4gICAgaWYgKCB0eXBlb2YgZml4QmFja2ZhY2UgPT09ICdmdW5jdGlvbicgJiYgdGhpcy5lbmFibGVGaXhCYWNrZmFjZSApIGZpeEJhY2tmYWNlKGlzRXhwYW5kZWQpXG5cbiAgICBpZiAodGhpcy5zd2l0Y2hFbGVtZW50cykge1xuICAgICAgdGhpcy5zd2l0Y2hFbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsIFN0cmluZyhpc0V4cGFuZGVkKSlcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5lcnRFbGVtZW50cykge1xuICAgICAgdGhpcy5pbmVydEVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGlmIChpc0V4cGFuZGVkKSB7XG4gICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2luZXJ0JywgJycpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2luZXJ0JylcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICB0aGlzLmlzRXhwYW5kZWQgPSBpc0V4cGFuZGVkXG4gIH1cbiAgcHJpdmF0ZSBfa2V5dXBIYW5kbGVyKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XG4gICAgaWYgKGV2ZW50LmtleSA9PT0gJ0VzY2FwZScgfHwgZXZlbnQua2V5ID09PSAnRXNjJykgdGhpcy5jbG9zZSgpXG4gIH1cbiAgcHJpdmF0ZSBfcG9wc3RhdGVIYW5kbGVyKGV2ZW50OiBQb3BTdGF0ZUV2ZW50KSB7XG4gICAgdGhpcy5fY2hhbmdlU3RhdGUoIXRoaXMuaXNFeHBhbmRlZCk7XG4gIH1cbiAgcHJpdmF0ZSBfcHVzaFN0YXRlKGlzRXhwYW5kZWQ6IGJvb2xlYW4pIHtcbiAgICBoaXN0b3J5LnB1c2hTdGF0ZSh7XG4gICAgICBpc0V4cGFuZGVkOiBpc0V4cGFuZGVkXG4gICAgfSwgJ2RyYXdlclN0YXRlJylcbiAgfVxufSJdLCJuYW1lcyI6WyJzdHlsZUZvckZpeGVkIiwiaGVpZ2h0IiwibGVmdCIsIm92ZXJmbG93IiwicG9zaXRpb24iLCJ3aWR0aCIsInNjcm9sbGluZ0VsZW1lbnQiLCJ1YSIsIndpbmRvdyIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsInRvTG93ZXJDYXNlIiwiZG9jdW1lbnQiLCJpbmRleE9mIiwiYm9keSIsImRvY3VtZW50RWxlbWVudCIsImZpeEJhY2tmYWNlIiwiZml4ZWQiLCJzY3JvbGxZIiwic2Nyb2xsVG9wIiwicGFyc2VJbnQiLCJzdHlsZSIsInRvcCIsInNjcm9sbGJhcldpZHRoIiwiaW5uZXJXaWR0aCIsImNsaWVudFdpZHRoIiwicGFkZGluZ1JpZ2h0IiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJrZXkiLCJzZXRQcm9wZXJ0eSIsInJlbW92ZVByb3BlcnR5IiwiZ2xvYmFsIiwiZmFjdG9yeSIsImV4cG9ydHMiLCJtb2R1bGUiLCJkZWZpbmUiLCJhbWQiLCJ0aGlzIiwiX2NyZWF0ZUNsYXNzIiwiZGVmaW5lUHJvcGVydGllcyIsInRhcmdldCIsInByb3BzIiwiaSIsImxlbmd0aCIsImRlc2NyaXB0b3IiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJkZWZpbmVQcm9wZXJ0eSIsIkNvbnN0cnVjdG9yIiwicHJvdG9Qcm9wcyIsInN0YXRpY1Byb3BzIiwicHJvdG90eXBlIiwiX2NsYXNzQ2FsbENoZWNrIiwiaW5zdGFuY2UiLCJUeXBlRXJyb3IiLCJzbGljZSIsIkFycmF5IiwibWF0Y2hlcyIsIkVsZW1lbnQiLCJtc01hdGNoZXNTZWxlY3RvciIsIl9mb2N1c2FibGVFbGVtZW50c1N0cmluZyIsImpvaW4iLCJJbmVydFJvb3QiLCJyb290RWxlbWVudCIsImluZXJ0TWFuYWdlciIsIl9pbmVydE1hbmFnZXIiLCJfcm9vdEVsZW1lbnQiLCJfbWFuYWdlZE5vZGVzIiwiU2V0IiwiaGFzQXR0cmlidXRlIiwiX3NhdmVkQXJpYUhpZGRlbiIsImdldEF0dHJpYnV0ZSIsInNldEF0dHJpYnV0ZSIsIl9tYWtlU3VidHJlZVVuZm9jdXNhYmxlIiwiX29ic2VydmVyIiwiTXV0YXRpb25PYnNlcnZlciIsIl9vbk11dGF0aW9uIiwiYmluZCIsIm9ic2VydmUiLCJhdHRyaWJ1dGVzIiwiY2hpbGRMaXN0Iiwic3VidHJlZSIsInZhbHVlIiwiZGVzdHJ1Y3RvciIsImRpc2Nvbm5lY3QiLCJyZW1vdmVBdHRyaWJ1dGUiLCJpbmVydE5vZGUiLCJfdW5tYW5hZ2VOb2RlIiwibm9kZSIsInN0YXJ0Tm9kZSIsIl90aGlzMiIsImNvbXBvc2VkVHJlZVdhbGsiLCJfdmlzaXROb2RlIiwiYWN0aXZlRWxlbWVudCIsImNvbnRhaW5zIiwicm9vdCIsInVuZGVmaW5lZCIsIm5vZGVUeXBlIiwiTm9kZSIsIkRPQ1VNRU5UX0ZSQUdNRU5UX05PREUiLCJwYXJlbnROb2RlIiwiYmx1ciIsImZvY3VzIiwiRUxFTUVOVF9OT0RFIiwiZWxlbWVudCIsIl9hZG9wdEluZXJ0Um9vdCIsImNhbGwiLCJfbWFuYWdlTm9kZSIsInJlZ2lzdGVyIiwiYWRkIiwiZGVyZWdpc3RlciIsIl91bm1hbmFnZVN1YnRyZWUiLCJfdGhpczMiLCJpbmVydFN1YnJvb3QiLCJnZXRJbmVydFJvb3QiLCJzZXRJbmVydCIsIm1hbmFnZWROb2RlcyIsInNhdmVkSW5lcnROb2RlIiwicmVjb3JkcyIsInNlbGYiLCJyZWNvcmQiLCJ0eXBlIiwiYWRkZWROb2RlcyIsInJlbW92ZWROb2RlcyIsImF0dHJpYnV0ZU5hbWUiLCJtYW5hZ2VkTm9kZSIsImdldCIsInNldCIsImFyaWFIaWRkZW4iLCJJbmVydE5vZGUiLCJpbmVydFJvb3QiLCJfbm9kZSIsIl9vdmVycm9kZUZvY3VzTWV0aG9kIiwiX2luZXJ0Um9vdHMiLCJfc2F2ZWRUYWJJbmRleCIsIl9kZXN0cm95ZWQiLCJlbnN1cmVVbnRhYmJhYmxlIiwiX3Rocm93SWZEZXN0cm95ZWQiLCJkZXN0cm95ZWQiLCJFcnJvciIsInRhYkluZGV4IiwiaGFzU2F2ZWRUYWJJbmRleCIsImFkZEluZXJ0Um9vdCIsInJlbW92ZUluZXJ0Um9vdCIsInNpemUiLCJJbmVydE1hbmFnZXIiLCJfZG9jdW1lbnQiLCJNYXAiLCJfd2F0Y2hGb3JJbmVydCIsImFkZEluZXJ0U3R5bGUiLCJoZWFkIiwicmVhZHlTdGF0ZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJfb25Eb2N1bWVudExvYWRlZCIsImluZXJ0IiwiaGFzIiwicGFyZW50IiwiX2luZXJ0Um9vdCIsImluZXJ0RWxlbWVudHMiLCJxdWVyeVNlbGVjdG9yQWxsIiwiaW5lcnRFbGVtZW50IiwiX3RoaXMiLCJ1bnNoaWZ0IiwiY2FsbGJhY2siLCJzaGFkb3dSb290QW5jZXN0b3IiLCJzaGFkb3dSb290IiwibG9jYWxOYW1lIiwiY29udGVudCIsImRpc3RyaWJ1dGVkTm9kZXMiLCJnZXREaXN0cmlidXRlZE5vZGVzIiwic2xvdCIsIl9kaXN0cmlidXRlZE5vZGVzIiwiYXNzaWduZWROb2RlcyIsImZsYXR0ZW4iLCJfaSIsImNoaWxkIiwiZmlyc3RDaGlsZCIsIm5leHRTaWJsaW5nIiwicXVlcnlTZWxlY3RvciIsImNyZWF0ZUVsZW1lbnQiLCJ0ZXh0Q29udGVudCIsImFwcGVuZENoaWxkIiwiaGFzT3duUHJvcGVydHkiLCJEcmF3ZXIiLCJjb25zdHJ1Y3RvciIsImFyZ3MiLCJEYXRlIiwiZ2V0VGltZSIsImRyYXdlciIsIm5hbWUiLCJkcmF3ZXJFbGVtZW50IiwiaWQiLCJpc0V4cGFuZGVkIiwic3dpdGNoRWxlbWVudHMiLCJzd2l0Y2giLCJ0b2dnbGUiLCJlbmFibGVGaXhCYWNrZmFjZSIsImVuYWJsZUhpc3RvcnkiLCJfcG9wc3RhdGVIYW5kbGVyIiwiZXZlbnQiLCJwcmV2ZW50RGVmYXVsdCIsImNsb3NlIiwib3BlbiIsIl9jaGFuZ2VTdGF0ZSIsIl9wdXNoU3RhdGUiLCJfa2V5dXBIYW5kbGVyIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsIlN0cmluZyIsImhpc3RvcnkiLCJw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
