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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhd2VyLmpzIiwic291cmNlcyI6WyIuLi9zcmMvdHMvZml4LWJhY2tmYWNlLnRzIiwiLi4vbm9kZV9tb2R1bGVzL3dpY2ctaW5lcnQvZGlzdC9pbmVydC5qcyIsIi4uL3NyYy90cy9kcmF3ZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3Qgc3R5bGVGb3JGaXhlZDoge1xuICBba2V5OiBzdHJpbmddOiBzdHJpbmdcbn0gPSB7XG4gIGhlaWdodDogJzEwMHZoJyxcbiAgbGVmdDogJzAnLFxuICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gIHBvc2l0aW9uOiAnZml4ZWQnLFxuICB3aWR0aDogJzEwMHZ3Jyxcbn1cblxuY29uc3Qgc2Nyb2xsaW5nRWxlbWVudDogRWxlbWVudCA9ICgoKSA9PiB7XG4gIGNvbnN0IHVhID0gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKVxuICBpZiAoJ3Njcm9sbGluZ0VsZW1lbnQnIGluIGRvY3VtZW50KSByZXR1cm4gZG9jdW1lbnQuc2Nyb2xsaW5nRWxlbWVudCFcbiAgaWYgKHVhLmluZGV4T2YoJ3dlYmtpdCcpID4gMCkgcmV0dXJuIGRvY3VtZW50LmJvZHkhXG4gIHJldHVybiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQhXG59KSgpIVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBmaXhCYWNrZmFjZShmaXhlZDogYm9vbGVhbikge1xuICBjb25zdCBzY3JvbGxZOm51bWJlciA9IGZpeGVkID8gc2Nyb2xsaW5nRWxlbWVudC5zY3JvbGxUb3AgOiBwYXJzZUludChkb2N1bWVudC5ib2R5LnN0eWxlLnRvcCkgPz8gMFxuICBjb25zdCBzY3JvbGxiYXJXaWR0aDpudW1iZXIgPSB3aW5kb3cuaW5uZXJXaWR0aCAtIGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGhcbiAgZG9jdW1lbnQuYm9keS5zdHlsZS50b3AgPSBmaXhlZCA/IGAtJHtzY3JvbGxpbmdFbGVtZW50LnNjcm9sbFRvcH1weGAgOiAnJ1xuICBkb2N1bWVudC5ib2R5LnN0eWxlLnBhZGRpbmdSaWdodCA9IGZpeGVkID8gYCR7c2Nyb2xsYmFyV2lkdGh9cHhgIDogJydcbiAgT2JqZWN0LmtleXMoc3R5bGVGb3JGaXhlZCkuZm9yRWFjaChrZXkgPT4ge1xuICAgIGlmIChmaXhlZCkge1xuICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5zZXRQcm9wZXJ0eShrZXksIHN0eWxlRm9yRml4ZWRba2V5XSlcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShrZXkpXG4gICAgfVxuICB9KVxuICBpZiAoIWZpeGVkKSBzY3JvbGxpbmdFbGVtZW50LnNjcm9sbFRvcCA9IHNjcm9sbFkgKiAtMVxufVxuIiwiKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gZmFjdG9yeSgpIDpcbiAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKCdpbmVydCcsIGZhY3RvcnkpIDpcbiAgKGZhY3RvcnkoKSk7XG59KHRoaXMsIChmdW5jdGlvbiAoKSB7ICd1c2Ugc3RyaWN0JztcblxuICB2YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG4gIGZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbiAgLyoqXG4gICAqIFRoaXMgd29yayBpcyBsaWNlbnNlZCB1bmRlciB0aGUgVzNDIFNvZnR3YXJlIGFuZCBEb2N1bWVudCBMaWNlbnNlXG4gICAqIChodHRwOi8vd3d3LnczLm9yZy9Db25zb3J0aXVtL0xlZ2FsLzIwMTUvY29weXJpZ2h0LXNvZnR3YXJlLWFuZC1kb2N1bWVudCkuXG4gICAqL1xuXG4gIChmdW5jdGlvbiAoKSB7XG4gICAgLy8gUmV0dXJuIGVhcmx5IGlmIHdlJ3JlIG5vdCBydW5uaW5nIGluc2lkZSBvZiB0aGUgYnJvd3Nlci5cbiAgICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBDb252ZW5pZW5jZSBmdW5jdGlvbiBmb3IgY29udmVydGluZyBOb2RlTGlzdHMuXG4gICAgLyoqIEB0eXBlIHt0eXBlb2YgQXJyYXkucHJvdG90eXBlLnNsaWNlfSAqL1xuICAgIHZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblxuICAgIC8qKlxuICAgICAqIElFIGhhcyBhIG5vbi1zdGFuZGFyZCBuYW1lIGZvciBcIm1hdGNoZXNcIi5cbiAgICAgKiBAdHlwZSB7dHlwZW9mIEVsZW1lbnQucHJvdG90eXBlLm1hdGNoZXN9XG4gICAgICovXG4gICAgdmFyIG1hdGNoZXMgPSBFbGVtZW50LnByb3RvdHlwZS5tYXRjaGVzIHx8IEVsZW1lbnQucHJvdG90eXBlLm1zTWF0Y2hlc1NlbGVjdG9yO1xuXG4gICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgdmFyIF9mb2N1c2FibGVFbGVtZW50c1N0cmluZyA9IFsnYVtocmVmXScsICdhcmVhW2hyZWZdJywgJ2lucHV0Om5vdChbZGlzYWJsZWRdKScsICdzZWxlY3Q6bm90KFtkaXNhYmxlZF0pJywgJ3RleHRhcmVhOm5vdChbZGlzYWJsZWRdKScsICdidXR0b246bm90KFtkaXNhYmxlZF0pJywgJ2RldGFpbHMnLCAnc3VtbWFyeScsICdpZnJhbWUnLCAnb2JqZWN0JywgJ2VtYmVkJywgJ1tjb250ZW50ZWRpdGFibGVdJ10uam9pbignLCcpO1xuXG4gICAgLyoqXG4gICAgICogYEluZXJ0Um9vdGAgbWFuYWdlcyBhIHNpbmdsZSBpbmVydCBzdWJ0cmVlLCBpLmUuIGEgRE9NIHN1YnRyZWUgd2hvc2Ugcm9vdCBlbGVtZW50IGhhcyBhbiBgaW5lcnRgXG4gICAgICogYXR0cmlidXRlLlxuICAgICAqXG4gICAgICogSXRzIG1haW4gZnVuY3Rpb25zIGFyZTpcbiAgICAgKlxuICAgICAqIC0gdG8gY3JlYXRlIGFuZCBtYWludGFpbiBhIHNldCBvZiBtYW5hZ2VkIGBJbmVydE5vZGVgcywgaW5jbHVkaW5nIHdoZW4gbXV0YXRpb25zIG9jY3VyIGluIHRoZVxuICAgICAqICAgc3VidHJlZS4gVGhlIGBtYWtlU3VidHJlZVVuZm9jdXNhYmxlKClgIG1ldGhvZCBoYW5kbGVzIGNvbGxlY3RpbmcgYEluZXJ0Tm9kZWBzIHZpYSByZWdpc3RlcmluZ1xuICAgICAqICAgZWFjaCBmb2N1c2FibGUgbm9kZSBpbiB0aGUgc3VidHJlZSB3aXRoIHRoZSBzaW5nbGV0b24gYEluZXJ0TWFuYWdlcmAgd2hpY2ggbWFuYWdlcyBhbGwga25vd25cbiAgICAgKiAgIGZvY3VzYWJsZSBub2RlcyB3aXRoaW4gaW5lcnQgc3VidHJlZXMuIGBJbmVydE1hbmFnZXJgIGVuc3VyZXMgdGhhdCBhIHNpbmdsZSBgSW5lcnROb2RlYFxuICAgICAqICAgaW5zdGFuY2UgZXhpc3RzIGZvciBlYWNoIGZvY3VzYWJsZSBub2RlIHdoaWNoIGhhcyBhdCBsZWFzdCBvbmUgaW5lcnQgcm9vdCBhcyBhbiBhbmNlc3Rvci5cbiAgICAgKlxuICAgICAqIC0gdG8gbm90aWZ5IGFsbCBtYW5hZ2VkIGBJbmVydE5vZGVgcyB3aGVuIHRoaXMgc3VidHJlZSBzdG9wcyBiZWluZyBpbmVydCAoaS5lLiB3aGVuIHRoZSBgaW5lcnRgXG4gICAgICogICBhdHRyaWJ1dGUgaXMgcmVtb3ZlZCBmcm9tIHRoZSByb290IG5vZGUpLiBUaGlzIGlzIGhhbmRsZWQgaW4gdGhlIGRlc3RydWN0b3IsIHdoaWNoIGNhbGxzIHRoZVxuICAgICAqICAgYGRlcmVnaXN0ZXJgIG1ldGhvZCBvbiBgSW5lcnRNYW5hZ2VyYCBmb3IgZWFjaCBtYW5hZ2VkIGluZXJ0IG5vZGUuXG4gICAgICovXG5cbiAgICB2YXIgSW5lcnRSb290ID0gZnVuY3Rpb24gKCkge1xuICAgICAgLyoqXG4gICAgICAgKiBAcGFyYW0geyFFbGVtZW50fSByb290RWxlbWVudCBUaGUgRWxlbWVudCBhdCB0aGUgcm9vdCBvZiB0aGUgaW5lcnQgc3VidHJlZS5cbiAgICAgICAqIEBwYXJhbSB7IUluZXJ0TWFuYWdlcn0gaW5lcnRNYW5hZ2VyIFRoZSBnbG9iYWwgc2luZ2xldG9uIEluZXJ0TWFuYWdlciBvYmplY3QuXG4gICAgICAgKi9cbiAgICAgIGZ1bmN0aW9uIEluZXJ0Um9vdChyb290RWxlbWVudCwgaW5lcnRNYW5hZ2VyKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBJbmVydFJvb3QpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7IUluZXJ0TWFuYWdlcn0gKi9cbiAgICAgICAgdGhpcy5faW5lcnRNYW5hZ2VyID0gaW5lcnRNYW5hZ2VyO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovXG4gICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50ID0gcm9vdEVsZW1lbnQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHshU2V0PCFJbmVydE5vZGU+fVxuICAgICAgICAgKiBBbGwgbWFuYWdlZCBmb2N1c2FibGUgbm9kZXMgaW4gdGhpcyBJbmVydFJvb3QncyBzdWJ0cmVlLlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fbWFuYWdlZE5vZGVzID0gbmV3IFNldCgpO1xuXG4gICAgICAgIC8vIE1ha2UgdGhlIHN1YnRyZWUgaGlkZGVuIGZyb20gYXNzaXN0aXZlIHRlY2hub2xvZ3lcbiAgICAgICAgaWYgKHRoaXMuX3Jvb3RFbGVtZW50Lmhhc0F0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nKSkge1xuICAgICAgICAgIC8qKiBAdHlwZSB7P3N0cmluZ30gKi9cbiAgICAgICAgICB0aGlzLl9zYXZlZEFyaWFIaWRkZW4gPSB0aGlzLl9yb290RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fc2F2ZWRBcmlhSGlkZGVuID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yb290RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcblxuICAgICAgICAvLyBNYWtlIGFsbCBmb2N1c2FibGUgZWxlbWVudHMgaW4gdGhlIHN1YnRyZWUgdW5mb2N1c2FibGUgYW5kIGFkZCB0aGVtIHRvIF9tYW5hZ2VkTm9kZXNcbiAgICAgICAgdGhpcy5fbWFrZVN1YnRyZWVVbmZvY3VzYWJsZSh0aGlzLl9yb290RWxlbWVudCk7XG5cbiAgICAgICAgLy8gV2F0Y2ggZm9yOlxuICAgICAgICAvLyAtIGFueSBhZGRpdGlvbnMgaW4gdGhlIHN1YnRyZWU6IG1ha2UgdGhlbSB1bmZvY3VzYWJsZSB0b29cbiAgICAgICAgLy8gLSBhbnkgcmVtb3ZhbHMgZnJvbSB0aGUgc3VidHJlZTogcmVtb3ZlIHRoZW0gZnJvbSB0aGlzIGluZXJ0IHJvb3QncyBtYW5hZ2VkIG5vZGVzXG4gICAgICAgIC8vIC0gYXR0cmlidXRlIGNoYW5nZXM6IGlmIGB0YWJpbmRleGAgaXMgYWRkZWQsIG9yIHJlbW92ZWQgZnJvbSBhbiBpbnRyaW5zaWNhbGx5IGZvY3VzYWJsZVxuICAgICAgICAvLyAgIGVsZW1lbnQsIG1ha2UgdGhhdCBub2RlIGEgbWFuYWdlZCBub2RlLlxuICAgICAgICB0aGlzLl9vYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKHRoaXMuX29uTXV0YXRpb24uYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuX29ic2VydmVyLm9ic2VydmUodGhpcy5fcm9vdEVsZW1lbnQsIHsgYXR0cmlidXRlczogdHJ1ZSwgY2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlIH0pO1xuICAgICAgfVxuXG4gICAgICAvKipcbiAgICAgICAqIENhbGwgdGhpcyB3aGVuZXZlciB0aGlzIG9iamVjdCBpcyBhYm91dCB0byBiZWNvbWUgb2Jzb2xldGUuICBUaGlzIHVud2luZHMgYWxsIG9mIHRoZSBzdGF0ZVxuICAgICAgICogc3RvcmVkIGluIHRoaXMgb2JqZWN0IGFuZCB1cGRhdGVzIHRoZSBzdGF0ZSBvZiBhbGwgb2YgdGhlIG1hbmFnZWQgbm9kZXMuXG4gICAgICAgKi9cblxuXG4gICAgICBfY3JlYXRlQ2xhc3MoSW5lcnRSb290LCBbe1xuICAgICAgICBrZXk6ICdkZXN0cnVjdG9yJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGRlc3RydWN0b3IoKSB7XG4gICAgICAgICAgdGhpcy5fb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuXG4gICAgICAgICAgaWYgKHRoaXMuX3Jvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fc2F2ZWRBcmlhSGlkZGVuICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCB0aGlzLl9zYXZlZEFyaWFIaWRkZW4pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5fcm9vdEVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdhcmlhLWhpZGRlbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuX21hbmFnZWROb2Rlcy5mb3JFYWNoKGZ1bmN0aW9uIChpbmVydE5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX3VubWFuYWdlTm9kZShpbmVydE5vZGUubm9kZSk7XG4gICAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgICAvLyBOb3RlIHdlIGNhc3QgdGhlIG51bGxzIHRvIHRoZSBBTlkgdHlwZSBoZXJlIGJlY2F1c2U6XG4gICAgICAgICAgLy8gMSkgV2Ugd2FudCB0aGUgY2xhc3MgcHJvcGVydGllcyB0byBiZSBkZWNsYXJlZCBhcyBub24tbnVsbCwgb3IgZWxzZSB3ZVxuICAgICAgICAgIC8vICAgIG5lZWQgZXZlbiBtb3JlIGNhc3RzIHRocm91Z2hvdXQgdGhpcyBjb2RlLiBBbGwgYmV0cyBhcmUgb2ZmIGlmIGFuXG4gICAgICAgICAgLy8gICAgaW5zdGFuY2UgaGFzIGJlZW4gZGVzdHJveWVkIGFuZCBhIG1ldGhvZCBpcyBjYWxsZWQuXG4gICAgICAgICAgLy8gMikgV2UgZG9uJ3Qgd2FudCB0byBjYXN0IFwidGhpc1wiLCBiZWNhdXNlIHdlIHdhbnQgdHlwZS1hd2FyZSBvcHRpbWl6YXRpb25zXG4gICAgICAgICAgLy8gICAgdG8ga25vdyB3aGljaCBwcm9wZXJ0aWVzIHdlJ3JlIHNldHRpbmcuXG4gICAgICAgICAgdGhpcy5fb2JzZXJ2ZXIgPSAvKiogQHR5cGUgez99ICovbnVsbDtcbiAgICAgICAgICB0aGlzLl9yb290RWxlbWVudCA9IC8qKiBAdHlwZSB7P30gKi9udWxsO1xuICAgICAgICAgIHRoaXMuX21hbmFnZWROb2RlcyA9IC8qKiBAdHlwZSB7P30gKi9udWxsO1xuICAgICAgICAgIHRoaXMuX2luZXJ0TWFuYWdlciA9IC8qKiBAdHlwZSB7P30gKi9udWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEByZXR1cm4geyFTZXQ8IUluZXJ0Tm9kZT59IEEgY29weSBvZiB0aGlzIEluZXJ0Um9vdCdzIG1hbmFnZWQgbm9kZXMgc2V0LlxuICAgICAgICAgKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdfbWFrZVN1YnRyZWVVbmZvY3VzYWJsZScsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogQHBhcmFtIHshTm9kZX0gc3RhcnROb2RlXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX21ha2VTdWJ0cmVlVW5mb2N1c2FibGUoc3RhcnROb2RlKSB7XG4gICAgICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICAgICAgICBjb21wb3NlZFRyZWVXYWxrKHN0YXJ0Tm9kZSwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBfdGhpczIuX3Zpc2l0Tm9kZShub2RlKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHZhciBhY3RpdmVFbGVtZW50ID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcblxuICAgICAgICAgIGlmICghZG9jdW1lbnQuYm9keS5jb250YWlucyhzdGFydE5vZGUpKSB7XG4gICAgICAgICAgICAvLyBzdGFydE5vZGUgbWF5IGJlIGluIHNoYWRvdyBET00sIHNvIGZpbmQgaXRzIG5lYXJlc3Qgc2hhZG93Um9vdCB0byBnZXQgdGhlIGFjdGl2ZUVsZW1lbnQuXG4gICAgICAgICAgICB2YXIgbm9kZSA9IHN0YXJ0Tm9kZTtcbiAgICAgICAgICAgIC8qKiBAdHlwZSB7IVNoYWRvd1Jvb3R8dW5kZWZpbmVkfSAqL1xuICAgICAgICAgICAgdmFyIHJvb3QgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5ET0NVTUVOVF9GUkFHTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICAgICAgcm9vdCA9IC8qKiBAdHlwZSB7IVNoYWRvd1Jvb3R9ICovbm9kZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJvb3QpIHtcbiAgICAgICAgICAgICAgYWN0aXZlRWxlbWVudCA9IHJvb3QuYWN0aXZlRWxlbWVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHN0YXJ0Tm9kZS5jb250YWlucyhhY3RpdmVFbGVtZW50KSkge1xuICAgICAgICAgICAgYWN0aXZlRWxlbWVudC5ibHVyKCk7XG4gICAgICAgICAgICAvLyBJbiBJRTExLCBpZiBhbiBlbGVtZW50IGlzIGFscmVhZHkgZm9jdXNlZCwgYW5kIHRoZW4gc2V0IHRvIHRhYmluZGV4PS0xXG4gICAgICAgICAgICAvLyBjYWxsaW5nIGJsdXIoKSB3aWxsIG5vdCBhY3R1YWxseSBtb3ZlIHRoZSBmb2N1cy5cbiAgICAgICAgICAgIC8vIFRvIHdvcmsgYXJvdW5kIHRoaXMgd2UgY2FsbCBmb2N1cygpIG9uIHRoZSBib2R5IGluc3RlYWQuXG4gICAgICAgICAgICBpZiAoYWN0aXZlRWxlbWVudCA9PT0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkge1xuICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmZvY3VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnX3Zpc2l0Tm9kZScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfdmlzaXROb2RlKG5vZGUpIHtcbiAgICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSAhPT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGVsZW1lbnQgPSAvKiogQHR5cGUgeyFFbGVtZW50fSAqL25vZGU7XG5cbiAgICAgICAgICAvLyBJZiBhIGRlc2NlbmRhbnQgaW5lcnQgcm9vdCBiZWNvbWVzIHVuLWluZXJ0LCBpdHMgZGVzY2VuZGFudHMgd2lsbCBzdGlsbCBiZSBpbmVydCBiZWNhdXNlIG9mXG4gICAgICAgICAgLy8gdGhpcyBpbmVydCByb290LCBzbyBhbGwgb2YgaXRzIG1hbmFnZWQgbm9kZXMgbmVlZCB0byBiZSBhZG9wdGVkIGJ5IHRoaXMgSW5lcnRSb290LlxuICAgICAgICAgIGlmIChlbGVtZW50ICE9PSB0aGlzLl9yb290RWxlbWVudCAmJiBlbGVtZW50Lmhhc0F0dHJpYnV0ZSgnaW5lcnQnKSkge1xuICAgICAgICAgICAgdGhpcy5fYWRvcHRJbmVydFJvb3QoZWxlbWVudCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKG1hdGNoZXMuY2FsbChlbGVtZW50LCBfZm9jdXNhYmxlRWxlbWVudHNTdHJpbmcpIHx8IGVsZW1lbnQuaGFzQXR0cmlidXRlKCd0YWJpbmRleCcpKSB7XG4gICAgICAgICAgICB0aGlzLl9tYW5hZ2VOb2RlKGVsZW1lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZWdpc3RlciB0aGUgZ2l2ZW4gbm9kZSB3aXRoIHRoaXMgSW5lcnRSb290IGFuZCB3aXRoIEluZXJ0TWFuYWdlci5cbiAgICAgICAgICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICAgICAgICAgKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdfbWFuYWdlTm9kZScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfbWFuYWdlTm9kZShub2RlKSB7XG4gICAgICAgICAgdmFyIGluZXJ0Tm9kZSA9IHRoaXMuX2luZXJ0TWFuYWdlci5yZWdpc3Rlcihub2RlLCB0aGlzKTtcbiAgICAgICAgICB0aGlzLl9tYW5hZ2VkTm9kZXMuYWRkKGluZXJ0Tm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogVW5yZWdpc3RlciB0aGUgZ2l2ZW4gbm9kZSB3aXRoIHRoaXMgSW5lcnRSb290IGFuZCB3aXRoIEluZXJ0TWFuYWdlci5cbiAgICAgICAgICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICAgICAgICAgKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdfdW5tYW5hZ2VOb2RlJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF91bm1hbmFnZU5vZGUobm9kZSkge1xuICAgICAgICAgIHZhciBpbmVydE5vZGUgPSB0aGlzLl9pbmVydE1hbmFnZXIuZGVyZWdpc3Rlcihub2RlLCB0aGlzKTtcbiAgICAgICAgICBpZiAoaW5lcnROb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9tYW5hZ2VkTm9kZXNbJ2RlbGV0ZSddKGluZXJ0Tm9kZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVucmVnaXN0ZXIgdGhlIGVudGlyZSBzdWJ0cmVlIHN0YXJ0aW5nIGF0IGBzdGFydE5vZGVgLlxuICAgICAgICAgKiBAcGFyYW0geyFOb2RlfSBzdGFydE5vZGVcbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnX3VubWFuYWdlU3VidHJlZScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfdW5tYW5hZ2VTdWJ0cmVlKHN0YXJ0Tm9kZSkge1xuICAgICAgICAgIHZhciBfdGhpczMgPSB0aGlzO1xuXG4gICAgICAgICAgY29tcG9zZWRUcmVlV2FsayhzdGFydE5vZGUsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMzLl91bm1hbmFnZU5vZGUobm9kZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgYSBkZXNjZW5kYW50IG5vZGUgaXMgZm91bmQgd2l0aCBhbiBgaW5lcnRgIGF0dHJpYnV0ZSwgYWRvcHQgaXRzIG1hbmFnZWQgbm9kZXMuXG4gICAgICAgICAqIEBwYXJhbSB7IUVsZW1lbnR9IG5vZGVcbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnX2Fkb3B0SW5lcnRSb290JyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9hZG9wdEluZXJ0Um9vdChub2RlKSB7XG4gICAgICAgICAgdmFyIGluZXJ0U3Vicm9vdCA9IHRoaXMuX2luZXJ0TWFuYWdlci5nZXRJbmVydFJvb3Qobm9kZSk7XG5cbiAgICAgICAgICAvLyBEdXJpbmcgaW5pdGlhbGlzYXRpb24gdGhpcyBpbmVydCByb290IG1heSBub3QgaGF2ZSBiZWVuIHJlZ2lzdGVyZWQgeWV0LFxuICAgICAgICAgIC8vIHNvIHJlZ2lzdGVyIGl0IG5vdyBpZiBuZWVkIGJlLlxuICAgICAgICAgIGlmICghaW5lcnRTdWJyb290KSB7XG4gICAgICAgICAgICB0aGlzLl9pbmVydE1hbmFnZXIuc2V0SW5lcnQobm9kZSwgdHJ1ZSk7XG4gICAgICAgICAgICBpbmVydFN1YnJvb3QgPSB0aGlzLl9pbmVydE1hbmFnZXIuZ2V0SW5lcnRSb290KG5vZGUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGluZXJ0U3Vicm9vdC5tYW5hZ2VkTm9kZXMuZm9yRWFjaChmdW5jdGlvbiAoc2F2ZWRJbmVydE5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX21hbmFnZU5vZGUoc2F2ZWRJbmVydE5vZGUubm9kZSk7XG4gICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbGJhY2sgdXNlZCB3aGVuIG11dGF0aW9uIG9ic2VydmVyIGRldGVjdHMgc3VidHJlZSBhZGRpdGlvbnMsIHJlbW92YWxzLCBvciBhdHRyaWJ1dGUgY2hhbmdlcy5cbiAgICAgICAgICogQHBhcmFtIHshQXJyYXk8IU11dGF0aW9uUmVjb3JkPn0gcmVjb3Jkc1xuICAgICAgICAgKiBAcGFyYW0geyFNdXRhdGlvbk9ic2VydmVyfSBzZWxmXG4gICAgICAgICAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ19vbk11dGF0aW9uJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9vbk11dGF0aW9uKHJlY29yZHMsIHNlbGYpIHtcbiAgICAgICAgICByZWNvcmRzLmZvckVhY2goZnVuY3Rpb24gKHJlY29yZCkge1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9IC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovcmVjb3JkLnRhcmdldDtcbiAgICAgICAgICAgIGlmIChyZWNvcmQudHlwZSA9PT0gJ2NoaWxkTGlzdCcpIHtcbiAgICAgICAgICAgICAgLy8gTWFuYWdlIGFkZGVkIG5vZGVzXG4gICAgICAgICAgICAgIHNsaWNlLmNhbGwocmVjb3JkLmFkZGVkTm9kZXMpLmZvckVhY2goZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYWtlU3VidHJlZVVuZm9jdXNhYmxlKG5vZGUpO1xuICAgICAgICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICAgICAgICAvLyBVbi1tYW5hZ2UgcmVtb3ZlZCBub2Rlc1xuICAgICAgICAgICAgICBzbGljZS5jYWxsKHJlY29yZC5yZW1vdmVkTm9kZXMpLmZvckVhY2goZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl91bm1hbmFnZVN1YnRyZWUobm9kZSk7XG4gICAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZWNvcmQudHlwZSA9PT0gJ2F0dHJpYnV0ZXMnKSB7XG4gICAgICAgICAgICAgIGlmIChyZWNvcmQuYXR0cmlidXRlTmFtZSA9PT0gJ3RhYmluZGV4Jykge1xuICAgICAgICAgICAgICAgIC8vIFJlLWluaXRpYWxpc2UgaW5lcnQgbm9kZSBpZiB0YWJpbmRleCBjaGFuZ2VzXG4gICAgICAgICAgICAgICAgdGhpcy5fbWFuYWdlTm9kZSh0YXJnZXQpO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRhcmdldCAhPT0gdGhpcy5fcm9vdEVsZW1lbnQgJiYgcmVjb3JkLmF0dHJpYnV0ZU5hbWUgPT09ICdpbmVydCcgJiYgdGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnaW5lcnQnKSkge1xuICAgICAgICAgICAgICAgIC8vIElmIGEgbmV3IGluZXJ0IHJvb3QgaXMgYWRkZWQsIGFkb3B0IGl0cyBtYW5hZ2VkIG5vZGVzIGFuZCBtYWtlIHN1cmUgaXQga25vd3MgYWJvdXQgdGhlXG4gICAgICAgICAgICAgICAgLy8gYWxyZWFkeSBtYW5hZ2VkIG5vZGVzIGZyb20gdGhpcyBpbmVydCBzdWJyb290LlxuICAgICAgICAgICAgICAgIHRoaXMuX2Fkb3B0SW5lcnRSb290KHRhcmdldCk7XG4gICAgICAgICAgICAgICAgdmFyIGluZXJ0U3Vicm9vdCA9IHRoaXMuX2luZXJ0TWFuYWdlci5nZXRJbmVydFJvb3QodGFyZ2V0KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYW5hZ2VkTm9kZXMuZm9yRWFjaChmdW5jdGlvbiAobWFuYWdlZE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQuY29udGFpbnMobWFuYWdlZE5vZGUubm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5lcnRTdWJyb290Ll9tYW5hZ2VOb2RlKG1hbmFnZWROb2RlLm5vZGUpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnbWFuYWdlZE5vZGVzJyxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBTZXQodGhpcy5fbWFuYWdlZE5vZGVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBAcmV0dXJuIHtib29sZWFufSAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ2hhc1NhdmVkQXJpYUhpZGRlbicsXG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLl9zYXZlZEFyaWFIaWRkZW4gIT09IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvKiogQHBhcmFtIHs/c3RyaW5nfSBhcmlhSGlkZGVuICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnc2F2ZWRBcmlhSGlkZGVuJyxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiBzZXQoYXJpYUhpZGRlbikge1xuICAgICAgICAgIHRoaXMuX3NhdmVkQXJpYUhpZGRlbiA9IGFyaWFIaWRkZW47XG4gICAgICAgIH1cblxuICAgICAgICAvKiogQHJldHVybiB7P3N0cmluZ30gKi9cbiAgICAgICAgLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fc2F2ZWRBcmlhSGlkZGVuO1xuICAgICAgICB9XG4gICAgICB9XSk7XG5cbiAgICAgIHJldHVybiBJbmVydFJvb3Q7XG4gICAgfSgpO1xuXG4gICAgLyoqXG4gICAgICogYEluZXJ0Tm9kZWAgaW5pdGlhbGlzZXMgYW5kIG1hbmFnZXMgYSBzaW5nbGUgaW5lcnQgbm9kZS5cbiAgICAgKiBBIG5vZGUgaXMgaW5lcnQgaWYgaXQgaXMgYSBkZXNjZW5kYW50IG9mIG9uZSBvciBtb3JlIGluZXJ0IHJvb3QgZWxlbWVudHMuXG4gICAgICpcbiAgICAgKiBPbiBjb25zdHJ1Y3Rpb24sIGBJbmVydE5vZGVgIHNhdmVzIHRoZSBleGlzdGluZyBgdGFiaW5kZXhgIHZhbHVlIGZvciB0aGUgbm9kZSwgaWYgYW55LCBhbmRcbiAgICAgKiBlaXRoZXIgcmVtb3ZlcyB0aGUgYHRhYmluZGV4YCBhdHRyaWJ1dGUgb3Igc2V0cyBpdCB0byBgLTFgLCBkZXBlbmRpbmcgb24gd2hldGhlciB0aGUgZWxlbWVudFxuICAgICAqIGlzIGludHJpbnNpY2FsbHkgZm9jdXNhYmxlIG9yIG5vdC5cbiAgICAgKlxuICAgICAqIGBJbmVydE5vZGVgIG1haW50YWlucyBhIHNldCBvZiBgSW5lcnRSb290YHMgd2hpY2ggYXJlIGRlc2NlbmRhbnRzIG9mIHRoaXMgYEluZXJ0Tm9kZWAuIFdoZW4gYW5cbiAgICAgKiBgSW5lcnRSb290YCBpcyBkZXN0cm95ZWQsIGFuZCBjYWxscyBgSW5lcnRNYW5hZ2VyLmRlcmVnaXN0ZXIoKWAsIHRoZSBgSW5lcnRNYW5hZ2VyYCBub3RpZmllcyB0aGVcbiAgICAgKiBgSW5lcnROb2RlYCB2aWEgYHJlbW92ZUluZXJ0Um9vdCgpYCwgd2hpY2ggaW4gdHVybiBkZXN0cm95cyB0aGUgYEluZXJ0Tm9kZWAgaWYgbm8gYEluZXJ0Um9vdGBzXG4gICAgICogcmVtYWluIGluIHRoZSBzZXQuIE9uIGRlc3RydWN0aW9uLCBgSW5lcnROb2RlYCByZWluc3RhdGVzIHRoZSBzdG9yZWQgYHRhYmluZGV4YCBpZiBvbmUgZXhpc3RzLFxuICAgICAqIG9yIHJlbW92ZXMgdGhlIGB0YWJpbmRleGAgYXR0cmlidXRlIGlmIHRoZSBlbGVtZW50IGlzIGludHJpbnNpY2FsbHkgZm9jdXNhYmxlLlxuICAgICAqL1xuXG5cbiAgICB2YXIgSW5lcnROb2RlID0gZnVuY3Rpb24gKCkge1xuICAgICAgLyoqXG4gICAgICAgKiBAcGFyYW0geyFOb2RlfSBub2RlIEEgZm9jdXNhYmxlIGVsZW1lbnQgdG8gYmUgbWFkZSBpbmVydC5cbiAgICAgICAqIEBwYXJhbSB7IUluZXJ0Um9vdH0gaW5lcnRSb290IFRoZSBpbmVydCByb290IGVsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaW5lcnQgbm9kZS5cbiAgICAgICAqL1xuICAgICAgZnVuY3Rpb24gSW5lcnROb2RlKG5vZGUsIGluZXJ0Um9vdCkge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgSW5lcnROb2RlKTtcblxuICAgICAgICAvKiogQHR5cGUgeyFOb2RlfSAqL1xuICAgICAgICB0aGlzLl9ub2RlID0gbm9kZTtcblxuICAgICAgICAvKiogQHR5cGUge2Jvb2xlYW59ICovXG4gICAgICAgIHRoaXMuX292ZXJyb2RlRm9jdXNNZXRob2QgPSBmYWxzZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUgeyFTZXQ8IUluZXJ0Um9vdD59IFRoZSBzZXQgb2YgZGVzY2VuZGFudCBpbmVydCByb290cy5cbiAgICAgICAgICogICAgSWYgYW5kIG9ubHkgaWYgdGhpcyBzZXQgYmVjb21lcyBlbXB0eSwgdGhpcyBub2RlIGlzIG5vIGxvbmdlciBpbmVydC5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2luZXJ0Um9vdHMgPSBuZXcgU2V0KFtpbmVydFJvb3RdKTtcblxuICAgICAgICAvKiogQHR5cGUgez9udW1iZXJ9ICovXG4gICAgICAgIHRoaXMuX3NhdmVkVGFiSW5kZXggPSBudWxsO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cbiAgICAgICAgdGhpcy5fZGVzdHJveWVkID0gZmFsc2U7XG5cbiAgICAgICAgLy8gU2F2ZSBhbnkgcHJpb3IgdGFiaW5kZXggaW5mbyBhbmQgbWFrZSB0aGlzIG5vZGUgdW50YWJiYWJsZVxuICAgICAgICB0aGlzLmVuc3VyZVVudGFiYmFibGUoKTtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBDYWxsIHRoaXMgd2hlbmV2ZXIgdGhpcyBvYmplY3QgaXMgYWJvdXQgdG8gYmVjb21lIG9ic29sZXRlLlxuICAgICAgICogVGhpcyBtYWtlcyB0aGUgbWFuYWdlZCBub2RlIGZvY3VzYWJsZSBhZ2FpbiBhbmQgZGVsZXRlcyBhbGwgb2YgdGhlIHByZXZpb3VzbHkgc3RvcmVkIHN0YXRlLlxuICAgICAgICovXG5cblxuICAgICAgX2NyZWF0ZUNsYXNzKEluZXJ0Tm9kZSwgW3tcbiAgICAgICAga2V5OiAnZGVzdHJ1Y3RvcicsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBkZXN0cnVjdG9yKCkge1xuICAgICAgICAgIHRoaXMuX3Rocm93SWZEZXN0cm95ZWQoKTtcblxuICAgICAgICAgIGlmICh0aGlzLl9ub2RlICYmIHRoaXMuX25vZGUubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovdGhpcy5fbm9kZTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zYXZlZFRhYkluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsIHRoaXMuX3NhdmVkVGFiSW5kZXgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFVzZSBgZGVsZXRlYCB0byByZXN0b3JlIG5hdGl2ZSBmb2N1cyBtZXRob2QuXG4gICAgICAgICAgICBpZiAodGhpcy5fb3ZlcnJvZGVGb2N1c01ldGhvZCkge1xuICAgICAgICAgICAgICBkZWxldGUgZWxlbWVudC5mb2N1cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBTZWUgbm90ZSBpbiBJbmVydFJvb3QuZGVzdHJ1Y3RvciBmb3Igd2h5IHdlIGNhc3QgdGhlc2UgbnVsbHMgdG8gQU5ZLlxuICAgICAgICAgIHRoaXMuX25vZGUgPSAvKiogQHR5cGUgez99ICovbnVsbDtcbiAgICAgICAgICB0aGlzLl9pbmVydFJvb3RzID0gLyoqIEB0eXBlIHs/fSAqL251bGw7XG4gICAgICAgICAgdGhpcy5fZGVzdHJveWVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn0gV2hldGhlciB0aGlzIG9iamVjdCBpcyBvYnNvbGV0ZSBiZWNhdXNlIHRoZSBtYW5hZ2VkIG5vZGUgaXMgbm8gbG9uZ2VyIGluZXJ0LlxuICAgICAgICAgKiBJZiB0aGUgb2JqZWN0IGhhcyBiZWVuIGRlc3Ryb3llZCwgYW55IGF0dGVtcHQgdG8gYWNjZXNzIGl0IHdpbGwgY2F1c2UgYW4gZXhjZXB0aW9uLlxuICAgICAgICAgKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdfdGhyb3dJZkRlc3Ryb3llZCcsXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhyb3cgaWYgdXNlciB0cmllcyB0byBhY2Nlc3MgZGVzdHJveWVkIEluZXJ0Tm9kZS5cbiAgICAgICAgICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfdGhyb3dJZkRlc3Ryb3llZCgpIHtcbiAgICAgICAgICBpZiAodGhpcy5kZXN0cm95ZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVHJ5aW5nIHRvIGFjY2VzcyBkZXN0cm95ZWQgSW5lcnROb2RlJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLyoqIEByZXR1cm4ge2Jvb2xlYW59ICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnZW5zdXJlVW50YWJiYWJsZScsXG5cblxuICAgICAgICAvKiogU2F2ZSB0aGUgZXhpc3RpbmcgdGFiaW5kZXggdmFsdWUgYW5kIG1ha2UgdGhlIG5vZGUgdW50YWJiYWJsZSBhbmQgdW5mb2N1c2FibGUgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGVuc3VyZVVudGFiYmFibGUoKSB7XG4gICAgICAgICAgaWYgKHRoaXMubm9kZS5ub2RlVHlwZSAhPT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGVsZW1lbnQgPSAvKiogQHR5cGUgeyFFbGVtZW50fSAqL3RoaXMubm9kZTtcbiAgICAgICAgICBpZiAobWF0Y2hlcy5jYWxsKGVsZW1lbnQsIF9mb2N1c2FibGVFbGVtZW50c1N0cmluZykpIHtcbiAgICAgICAgICAgIGlmICggLyoqIEB0eXBlIHshSFRNTEVsZW1lbnR9ICovZWxlbWVudC50YWJJbmRleCA9PT0gLTEgJiYgdGhpcy5oYXNTYXZlZFRhYkluZGV4KSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKCd0YWJpbmRleCcpKSB7XG4gICAgICAgICAgICAgIHRoaXMuX3NhdmVkVGFiSW5kZXggPSAvKiogQHR5cGUgeyFIVE1MRWxlbWVudH0gKi9lbGVtZW50LnRhYkluZGV4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgJy0xJyk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5mb2N1cyA9IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICAgICAgICB0aGlzLl9vdmVycm9kZUZvY3VzTWV0aG9kID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlKCd0YWJpbmRleCcpKSB7XG4gICAgICAgICAgICB0aGlzLl9zYXZlZFRhYkluZGV4ID0gLyoqIEB0eXBlIHshSFRNTEVsZW1lbnR9ICovZWxlbWVudC50YWJJbmRleDtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCd0YWJpbmRleCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGQgYW5vdGhlciBpbmVydCByb290IHRvIHRoaXMgaW5lcnQgbm9kZSdzIHNldCBvZiBtYW5hZ2luZyBpbmVydCByb290cy5cbiAgICAgICAgICogQHBhcmFtIHshSW5lcnRSb290fSBpbmVydFJvb3RcbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnYWRkSW5lcnRSb290JyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGFkZEluZXJ0Um9vdChpbmVydFJvb3QpIHtcbiAgICAgICAgICB0aGlzLl90aHJvd0lmRGVzdHJveWVkKCk7XG4gICAgICAgICAgdGhpcy5faW5lcnRSb290cy5hZGQoaW5lcnRSb290KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmUgdGhlIGdpdmVuIGluZXJ0IHJvb3QgZnJvbSB0aGlzIGluZXJ0IG5vZGUncyBzZXQgb2YgbWFuYWdpbmcgaW5lcnQgcm9vdHMuXG4gICAgICAgICAqIElmIHRoZSBzZXQgb2YgbWFuYWdpbmcgaW5lcnQgcm9vdHMgYmVjb21lcyBlbXB0eSwgdGhpcyBub2RlIGlzIG5vIGxvbmdlciBpbmVydCxcbiAgICAgICAgICogc28gdGhlIG9iamVjdCBzaG91bGQgYmUgZGVzdHJveWVkLlxuICAgICAgICAgKiBAcGFyYW0geyFJbmVydFJvb3R9IGluZXJ0Um9vdFxuICAgICAgICAgKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdyZW1vdmVJbmVydFJvb3QnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcmVtb3ZlSW5lcnRSb290KGluZXJ0Um9vdCkge1xuICAgICAgICAgIHRoaXMuX3Rocm93SWZEZXN0cm95ZWQoKTtcbiAgICAgICAgICB0aGlzLl9pbmVydFJvb3RzWydkZWxldGUnXShpbmVydFJvb3QpO1xuICAgICAgICAgIGlmICh0aGlzLl9pbmVydFJvb3RzLnNpemUgPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuZGVzdHJ1Y3RvcigpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdkZXN0cm95ZWQnLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICByZXR1cm4gKC8qKiBAdHlwZSB7IUluZXJ0Tm9kZX0gKi90aGlzLl9kZXN0cm95ZWRcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ2hhc1NhdmVkVGFiSW5kZXgnLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fc2F2ZWRUYWJJbmRleCAhPT0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBAcmV0dXJuIHshTm9kZX0gKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdub2RlJyxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgdGhpcy5fdGhyb3dJZkRlc3Ryb3llZCgpO1xuICAgICAgICAgIHJldHVybiB0aGlzLl9ub2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIEBwYXJhbSB7P251bWJlcn0gdGFiSW5kZXggKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdzYXZlZFRhYkluZGV4JyxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiBzZXQodGFiSW5kZXgpIHtcbiAgICAgICAgICB0aGlzLl90aHJvd0lmRGVzdHJveWVkKCk7XG4gICAgICAgICAgdGhpcy5fc2F2ZWRUYWJJbmRleCA9IHRhYkluZGV4O1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIEByZXR1cm4gez9udW1iZXJ9ICovXG4gICAgICAgICxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgdGhpcy5fdGhyb3dJZkRlc3Ryb3llZCgpO1xuICAgICAgICAgIHJldHVybiB0aGlzLl9zYXZlZFRhYkluZGV4O1xuICAgICAgICB9XG4gICAgICB9XSk7XG5cbiAgICAgIHJldHVybiBJbmVydE5vZGU7XG4gICAgfSgpO1xuXG4gICAgLyoqXG4gICAgICogSW5lcnRNYW5hZ2VyIGlzIGEgcGVyLWRvY3VtZW50IHNpbmdsZXRvbiBvYmplY3Qgd2hpY2ggbWFuYWdlcyBhbGwgaW5lcnQgcm9vdHMgYW5kIG5vZGVzLlxuICAgICAqXG4gICAgICogV2hlbiBhbiBlbGVtZW50IGJlY29tZXMgYW4gaW5lcnQgcm9vdCBieSBoYXZpbmcgYW4gYGluZXJ0YCBhdHRyaWJ1dGUgc2V0IGFuZC9vciBpdHMgYGluZXJ0YFxuICAgICAqIHByb3BlcnR5IHNldCB0byBgdHJ1ZWAsIHRoZSBgc2V0SW5lcnRgIG1ldGhvZCBjcmVhdGVzIGFuIGBJbmVydFJvb3RgIG9iamVjdCBmb3IgdGhlIGVsZW1lbnQuXG4gICAgICogVGhlIGBJbmVydFJvb3RgIGluIHR1cm4gcmVnaXN0ZXJzIGl0c2VsZiBhcyBtYW5hZ2luZyBhbGwgb2YgdGhlIGVsZW1lbnQncyBmb2N1c2FibGUgZGVzY2VuZGFudFxuICAgICAqIG5vZGVzIHZpYSB0aGUgYHJlZ2lzdGVyKClgIG1ldGhvZC4gVGhlIGBJbmVydE1hbmFnZXJgIGVuc3VyZXMgdGhhdCBhIHNpbmdsZSBgSW5lcnROb2RlYCBpbnN0YW5jZVxuICAgICAqIGlzIGNyZWF0ZWQgZm9yIGVhY2ggc3VjaCBub2RlLCB2aWEgdGhlIGBfbWFuYWdlZE5vZGVzYCBtYXAuXG4gICAgICovXG5cblxuICAgIHZhciBJbmVydE1hbmFnZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAvKipcbiAgICAgICAqIEBwYXJhbSB7IURvY3VtZW50fSBkb2N1bWVudFxuICAgICAgICovXG4gICAgICBmdW5jdGlvbiBJbmVydE1hbmFnZXIoZG9jdW1lbnQpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEluZXJ0TWFuYWdlcik7XG5cbiAgICAgICAgaWYgKCFkb2N1bWVudCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTWlzc2luZyByZXF1aXJlZCBhcmd1bWVudDsgSW5lcnRNYW5hZ2VyIG5lZWRzIHRvIHdyYXAgYSBkb2N1bWVudC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBAdHlwZSB7IURvY3VtZW50fSAqL1xuICAgICAgICB0aGlzLl9kb2N1bWVudCA9IGRvY3VtZW50O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBbGwgbWFuYWdlZCBub2RlcyBrbm93biB0byB0aGlzIEluZXJ0TWFuYWdlci4gSW4gYSBtYXAgdG8gYWxsb3cgbG9va2luZyB1cCBieSBOb2RlLlxuICAgICAgICAgKiBAdHlwZSB7IU1hcDwhTm9kZSwgIUluZXJ0Tm9kZT59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9tYW5hZ2VkTm9kZXMgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFsbCBpbmVydCByb290cyBrbm93biB0byB0aGlzIEluZXJ0TWFuYWdlci4gSW4gYSBtYXAgdG8gYWxsb3cgbG9va2luZyB1cCBieSBOb2RlLlxuICAgICAgICAgKiBAdHlwZSB7IU1hcDwhTm9kZSwgIUluZXJ0Um9vdD59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9pbmVydFJvb3RzID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPYnNlcnZlciBmb3IgbXV0YXRpb25zIG9uIGBkb2N1bWVudC5ib2R5YC5cbiAgICAgICAgICogQHR5cGUgeyFNdXRhdGlvbk9ic2VydmVyfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcih0aGlzLl93YXRjaEZvckluZXJ0LmJpbmQodGhpcykpO1xuXG4gICAgICAgIC8vIEFkZCBpbmVydCBzdHlsZS5cbiAgICAgICAgYWRkSW5lcnRTdHlsZShkb2N1bWVudC5oZWFkIHx8IGRvY3VtZW50LmJvZHkgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KTtcblxuICAgICAgICAvLyBXYWl0IGZvciBkb2N1bWVudCB0byBiZSBsb2FkZWQuXG4gICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnbG9hZGluZycpIHtcbiAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgdGhpcy5fb25Eb2N1bWVudExvYWRlZC5iaW5kKHRoaXMpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9vbkRvY3VtZW50TG9hZGVkKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBTZXQgd2hldGhlciB0aGUgZ2l2ZW4gZWxlbWVudCBzaG91bGQgYmUgYW4gaW5lcnQgcm9vdCBvciBub3QuXG4gICAgICAgKiBAcGFyYW0geyFFbGVtZW50fSByb290XG4gICAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGluZXJ0XG4gICAgICAgKi9cblxuXG4gICAgICBfY3JlYXRlQ2xhc3MoSW5lcnRNYW5hZ2VyLCBbe1xuICAgICAgICBrZXk6ICdzZXRJbmVydCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRJbmVydChyb290LCBpbmVydCkge1xuICAgICAgICAgIGlmIChpbmVydCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2luZXJ0Um9vdHMuaGFzKHJvb3QpKSB7XG4gICAgICAgICAgICAgIC8vIGVsZW1lbnQgaXMgYWxyZWFkeSBpbmVydFxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBpbmVydFJvb3QgPSBuZXcgSW5lcnRSb290KHJvb3QsIHRoaXMpO1xuICAgICAgICAgICAgcm9vdC5zZXRBdHRyaWJ1dGUoJ2luZXJ0JywgJycpO1xuICAgICAgICAgICAgdGhpcy5faW5lcnRSb290cy5zZXQocm9vdCwgaW5lcnRSb290KTtcbiAgICAgICAgICAgIC8vIElmIG5vdCBjb250YWluZWQgaW4gdGhlIGRvY3VtZW50LCBpdCBtdXN0IGJlIGluIGEgc2hhZG93Um9vdC5cbiAgICAgICAgICAgIC8vIEVuc3VyZSBpbmVydCBzdHlsZXMgYXJlIGFkZGVkIHRoZXJlLlxuICAgICAgICAgICAgaWYgKCF0aGlzLl9kb2N1bWVudC5ib2R5LmNvbnRhaW5zKHJvb3QpKSB7XG4gICAgICAgICAgICAgIHZhciBwYXJlbnQgPSByb290LnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgIHdoaWxlIChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50Lm5vZGVUeXBlID09PSAxMSkge1xuICAgICAgICAgICAgICAgICAgYWRkSW5lcnRTdHlsZShwYXJlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2luZXJ0Um9vdHMuaGFzKHJvb3QpKSB7XG4gICAgICAgICAgICAgIC8vIGVsZW1lbnQgaXMgYWxyZWFkeSBub24taW5lcnRcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgX2luZXJ0Um9vdCA9IHRoaXMuX2luZXJ0Um9vdHMuZ2V0KHJvb3QpO1xuICAgICAgICAgICAgX2luZXJ0Um9vdC5kZXN0cnVjdG9yKCk7XG4gICAgICAgICAgICB0aGlzLl9pbmVydFJvb3RzWydkZWxldGUnXShyb290KTtcbiAgICAgICAgICAgIHJvb3QucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdGhlIEluZXJ0Um9vdCBvYmplY3QgY29ycmVzcG9uZGluZyB0byB0aGUgZ2l2ZW4gaW5lcnQgcm9vdCBlbGVtZW50LCBpZiBhbnkuXG4gICAgICAgICAqIEBwYXJhbSB7IU5vZGV9IGVsZW1lbnRcbiAgICAgICAgICogQHJldHVybiB7IUluZXJ0Um9vdHx1bmRlZmluZWR9XG4gICAgICAgICAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ2dldEluZXJ0Um9vdCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRJbmVydFJvb3QoZWxlbWVudCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLl9pbmVydFJvb3RzLmdldChlbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZWdpc3RlciB0aGUgZ2l2ZW4gSW5lcnRSb290IGFzIG1hbmFnaW5nIHRoZSBnaXZlbiBub2RlLlxuICAgICAgICAgKiBJbiB0aGUgY2FzZSB3aGVyZSB0aGUgbm9kZSBoYXMgYSBwcmV2aW91c2x5IGV4aXN0aW5nIGluZXJ0IHJvb3QsIHRoaXMgaW5lcnQgcm9vdCB3aWxsXG4gICAgICAgICAqIGJlIGFkZGVkIHRvIGl0cyBzZXQgb2YgaW5lcnQgcm9vdHMuXG4gICAgICAgICAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAgICAgICAgICogQHBhcmFtIHshSW5lcnRSb290fSBpbmVydFJvb3RcbiAgICAgICAgICogQHJldHVybiB7IUluZXJ0Tm9kZX0gaW5lcnROb2RlXG4gICAgICAgICAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ3JlZ2lzdGVyJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlZ2lzdGVyKG5vZGUsIGluZXJ0Um9vdCkge1xuICAgICAgICAgIHZhciBpbmVydE5vZGUgPSB0aGlzLl9tYW5hZ2VkTm9kZXMuZ2V0KG5vZGUpO1xuICAgICAgICAgIGlmIChpbmVydE5vZGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gbm9kZSB3YXMgYWxyZWFkeSBpbiBhbiBpbmVydCBzdWJ0cmVlXG4gICAgICAgICAgICBpbmVydE5vZGUuYWRkSW5lcnRSb290KGluZXJ0Um9vdCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGluZXJ0Tm9kZSA9IG5ldyBJbmVydE5vZGUobm9kZSwgaW5lcnRSb290KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLl9tYW5hZ2VkTm9kZXMuc2V0KG5vZGUsIGluZXJ0Tm9kZSk7XG5cbiAgICAgICAgICByZXR1cm4gaW5lcnROb2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlLXJlZ2lzdGVyIHRoZSBnaXZlbiBJbmVydFJvb3QgYXMgbWFuYWdpbmcgdGhlIGdpdmVuIGluZXJ0IG5vZGUuXG4gICAgICAgICAqIFJlbW92ZXMgdGhlIGluZXJ0IHJvb3QgZnJvbSB0aGUgSW5lcnROb2RlJ3Mgc2V0IG9mIG1hbmFnaW5nIGluZXJ0IHJvb3RzLCBhbmQgcmVtb3ZlIHRoZSBpbmVydFxuICAgICAgICAgKiBub2RlIGZyb20gdGhlIEluZXJ0TWFuYWdlcidzIHNldCBvZiBtYW5hZ2VkIG5vZGVzIGlmIGl0IGlzIGRlc3Ryb3llZC5cbiAgICAgICAgICogSWYgdGhlIG5vZGUgaXMgbm90IGN1cnJlbnRseSBtYW5hZ2VkLCB0aGlzIGlzIGVzc2VudGlhbGx5IGEgbm8tb3AuXG4gICAgICAgICAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAgICAgICAgICogQHBhcmFtIHshSW5lcnRSb290fSBpbmVydFJvb3RcbiAgICAgICAgICogQHJldHVybiB7P0luZXJ0Tm9kZX0gVGhlIHBvdGVudGlhbGx5IGRlc3Ryb3llZCBJbmVydE5vZGUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgbm9kZSwgaWYgYW55LlxuICAgICAgICAgKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdkZXJlZ2lzdGVyJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGRlcmVnaXN0ZXIobm9kZSwgaW5lcnRSb290KSB7XG4gICAgICAgICAgdmFyIGluZXJ0Tm9kZSA9IHRoaXMuX21hbmFnZWROb2Rlcy5nZXQobm9kZSk7XG4gICAgICAgICAgaWYgKCFpbmVydE5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGluZXJ0Tm9kZS5yZW1vdmVJbmVydFJvb3QoaW5lcnRSb290KTtcbiAgICAgICAgICBpZiAoaW5lcnROb2RlLmRlc3Ryb3llZCkge1xuICAgICAgICAgICAgdGhpcy5fbWFuYWdlZE5vZGVzWydkZWxldGUnXShub2RlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gaW5lcnROb2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGxiYWNrIHVzZWQgd2hlbiBkb2N1bWVudCBoYXMgZmluaXNoZWQgbG9hZGluZy5cbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnX29uRG9jdW1lbnRMb2FkZWQnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX29uRG9jdW1lbnRMb2FkZWQoKSB7XG4gICAgICAgICAgLy8gRmluZCBhbGwgaW5lcnQgcm9vdHMgaW4gZG9jdW1lbnQgYW5kIG1ha2UgdGhlbSBhY3R1YWxseSBpbmVydC5cbiAgICAgICAgICB2YXIgaW5lcnRFbGVtZW50cyA9IHNsaWNlLmNhbGwodGhpcy5fZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2luZXJ0XScpKTtcbiAgICAgICAgICBpbmVydEVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKGluZXJ0RWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5zZXRJbmVydChpbmVydEVsZW1lbnQsIHRydWUpO1xuICAgICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgICAgLy8gQ29tbWVudCB0aGlzIG91dCB0byB1c2UgcHJvZ3JhbW1hdGljIEFQSSBvbmx5LlxuICAgICAgICAgIHRoaXMuX29ic2VydmVyLm9ic2VydmUodGhpcy5fZG9jdW1lbnQuYm9keSB8fCB0aGlzLl9kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsIHsgYXR0cmlidXRlczogdHJ1ZSwgc3VidHJlZTogdHJ1ZSwgY2hpbGRMaXN0OiB0cnVlIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGxiYWNrIHVzZWQgd2hlbiBtdXRhdGlvbiBvYnNlcnZlciBkZXRlY3RzIGF0dHJpYnV0ZSBjaGFuZ2VzLlxuICAgICAgICAgKiBAcGFyYW0geyFBcnJheTwhTXV0YXRpb25SZWNvcmQ+fSByZWNvcmRzXG4gICAgICAgICAqIEBwYXJhbSB7IU11dGF0aW9uT2JzZXJ2ZXJ9IHNlbGZcbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnX3dhdGNoRm9ySW5lcnQnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX3dhdGNoRm9ySW5lcnQocmVjb3Jkcywgc2VsZikge1xuICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgcmVjb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uIChyZWNvcmQpIHtcbiAgICAgICAgICAgIHN3aXRjaCAocmVjb3JkLnR5cGUpIHtcbiAgICAgICAgICAgICAgY2FzZSAnY2hpbGRMaXN0JzpcbiAgICAgICAgICAgICAgICBzbGljZS5jYWxsKHJlY29yZC5hZGRlZE5vZGVzKS5mb3JFYWNoKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSAhPT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgdmFyIGluZXJ0RWxlbWVudHMgPSBzbGljZS5jYWxsKG5vZGUucXVlcnlTZWxlY3RvckFsbCgnW2luZXJ0XScpKTtcbiAgICAgICAgICAgICAgICAgIGlmIChtYXRjaGVzLmNhbGwobm9kZSwgJ1tpbmVydF0nKSkge1xuICAgICAgICAgICAgICAgICAgICBpbmVydEVsZW1lbnRzLnVuc2hpZnQobm9kZSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpbmVydEVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKGluZXJ0RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEluZXJ0KGluZXJ0RWxlbWVudCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICB9LCBfdGhpcyk7XG4gICAgICAgICAgICAgICAgfSwgX3RoaXMpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlICdhdHRyaWJ1dGVzJzpcbiAgICAgICAgICAgICAgICBpZiAocmVjb3JkLmF0dHJpYnV0ZU5hbWUgIT09ICdpbmVydCcpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldCA9IC8qKiBAdHlwZSB7IUVsZW1lbnR9ICovcmVjb3JkLnRhcmdldDtcbiAgICAgICAgICAgICAgICB2YXIgaW5lcnQgPSB0YXJnZXQuaGFzQXR0cmlidXRlKCdpbmVydCcpO1xuICAgICAgICAgICAgICAgIF90aGlzLnNldEluZXJ0KHRhcmdldCwgaW5lcnQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9XSk7XG5cbiAgICAgIHJldHVybiBJbmVydE1hbmFnZXI7XG4gICAgfSgpO1xuXG4gICAgLyoqXG4gICAgICogUmVjdXJzaXZlbHkgd2FsayB0aGUgY29tcG9zZWQgdHJlZSBmcm9tIHxub2RlfC5cbiAgICAgKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gICAgICogQHBhcmFtIHsoZnVuY3Rpb24gKCFFbGVtZW50KSk9fSBjYWxsYmFjayBDYWxsYmFjayB0byBiZSBjYWxsZWQgZm9yIGVhY2ggZWxlbWVudCB0cmF2ZXJzZWQsXG4gICAgICogICAgIGJlZm9yZSBkZXNjZW5kaW5nIGludG8gY2hpbGQgbm9kZXMuXG4gICAgICogQHBhcmFtIHs/U2hhZG93Um9vdD19IHNoYWRvd1Jvb3RBbmNlc3RvciBUaGUgbmVhcmVzdCBTaGFkb3dSb290IGFuY2VzdG9yLCBpZiBhbnkuXG4gICAgICovXG5cblxuICAgIGZ1bmN0aW9uIGNvbXBvc2VkVHJlZVdhbGsobm9kZSwgY2FsbGJhY2ssIHNoYWRvd1Jvb3RBbmNlc3Rvcikge1xuICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSAvKiogQHR5cGUgeyFFbGVtZW50fSAqL25vZGU7XG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgIGNhbGxiYWNrKGVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGVzY2VuZCBpbnRvIG5vZGU6XG4gICAgICAgIC8vIElmIGl0IGhhcyBhIFNoYWRvd1Jvb3QsIGlnbm9yZSBhbGwgY2hpbGQgZWxlbWVudHMgLSB0aGVzZSB3aWxsIGJlIHBpY2tlZFxuICAgICAgICAvLyB1cCBieSB0aGUgPGNvbnRlbnQ+IG9yIDxzaGFkb3c+IGVsZW1lbnRzLiBEZXNjZW5kIHN0cmFpZ2h0IGludG8gdGhlXG4gICAgICAgIC8vIFNoYWRvd1Jvb3QuXG4gICAgICAgIHZhciBzaGFkb3dSb290ID0gLyoqIEB0eXBlIHshSFRNTEVsZW1lbnR9ICovZWxlbWVudC5zaGFkb3dSb290O1xuICAgICAgICBpZiAoc2hhZG93Um9vdCkge1xuICAgICAgICAgIGNvbXBvc2VkVHJlZVdhbGsoc2hhZG93Um9vdCwgY2FsbGJhY2ssIHNoYWRvd1Jvb3QpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGl0IGlzIGEgPGNvbnRlbnQ+IGVsZW1lbnQsIGRlc2NlbmQgaW50byBkaXN0cmlidXRlZCBlbGVtZW50cyAtIHRoZXNlXG4gICAgICAgIC8vIGFyZSBlbGVtZW50cyBmcm9tIG91dHNpZGUgdGhlIHNoYWRvdyByb290IHdoaWNoIGFyZSByZW5kZXJlZCBpbnNpZGUgdGhlXG4gICAgICAgIC8vIHNoYWRvdyBET00uXG4gICAgICAgIGlmIChlbGVtZW50LmxvY2FsTmFtZSA9PSAnY29udGVudCcpIHtcbiAgICAgICAgICB2YXIgY29udGVudCA9IC8qKiBAdHlwZSB7IUhUTUxDb250ZW50RWxlbWVudH0gKi9lbGVtZW50O1xuICAgICAgICAgIC8vIFZlcmlmaWVzIGlmIFNoYWRvd0RvbSB2MCBpcyBzdXBwb3J0ZWQuXG4gICAgICAgICAgdmFyIGRpc3RyaWJ1dGVkTm9kZXMgPSBjb250ZW50LmdldERpc3RyaWJ1dGVkTm9kZXMgPyBjb250ZW50LmdldERpc3RyaWJ1dGVkTm9kZXMoKSA6IFtdO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGlzdHJpYnV0ZWROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29tcG9zZWRUcmVlV2FsayhkaXN0cmlidXRlZE5vZGVzW2ldLCBjYWxsYmFjaywgc2hhZG93Um9vdEFuY2VzdG9yKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgaXQgaXMgYSA8c2xvdD4gZWxlbWVudCwgZGVzY2VuZCBpbnRvIGFzc2lnbmVkIG5vZGVzIC0gdGhlc2VcbiAgICAgICAgLy8gYXJlIGVsZW1lbnRzIGZyb20gb3V0c2lkZSB0aGUgc2hhZG93IHJvb3Qgd2hpY2ggYXJlIHJlbmRlcmVkIGluc2lkZSB0aGVcbiAgICAgICAgLy8gc2hhZG93IERPTS5cbiAgICAgICAgaWYgKGVsZW1lbnQubG9jYWxOYW1lID09ICdzbG90Jykge1xuICAgICAgICAgIHZhciBzbG90ID0gLyoqIEB0eXBlIHshSFRNTFNsb3RFbGVtZW50fSAqL2VsZW1lbnQ7XG4gICAgICAgICAgLy8gVmVyaWZ5IGlmIFNoYWRvd0RvbSB2MSBpcyBzdXBwb3J0ZWQuXG4gICAgICAgICAgdmFyIF9kaXN0cmlidXRlZE5vZGVzID0gc2xvdC5hc3NpZ25lZE5vZGVzID8gc2xvdC5hc3NpZ25lZE5vZGVzKHsgZmxhdHRlbjogdHJ1ZSB9KSA6IFtdO1xuICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBfZGlzdHJpYnV0ZWROb2Rlcy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIGNvbXBvc2VkVHJlZVdhbGsoX2Rpc3RyaWJ1dGVkTm9kZXNbX2ldLCBjYWxsYmFjaywgc2hhZG93Um9vdEFuY2VzdG9yKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGl0IGlzIG5laXRoZXIgdGhlIHBhcmVudCBvZiBhIFNoYWRvd1Jvb3QsIGEgPGNvbnRlbnQ+IGVsZW1lbnQsIGEgPHNsb3Q+XG4gICAgICAvLyBlbGVtZW50LCBub3IgYSA8c2hhZG93PiBlbGVtZW50IHJlY3Vyc2Ugbm9ybWFsbHkuXG4gICAgICB2YXIgY2hpbGQgPSBub2RlLmZpcnN0Q2hpbGQ7XG4gICAgICB3aGlsZSAoY2hpbGQgIT0gbnVsbCkge1xuICAgICAgICBjb21wb3NlZFRyZWVXYWxrKGNoaWxkLCBjYWxsYmFjaywgc2hhZG93Um9vdEFuY2VzdG9yKTtcbiAgICAgICAgY2hpbGQgPSBjaGlsZC5uZXh0U2libGluZztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgc3R5bGUgZWxlbWVudCB0byB0aGUgbm9kZSBjb250YWluaW5nIHRoZSBpbmVydCBzcGVjaWZpYyBzdHlsZXNcbiAgICAgKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gICAgICovXG4gICAgZnVuY3Rpb24gYWRkSW5lcnRTdHlsZShub2RlKSB7XG4gICAgICBpZiAobm9kZS5xdWVyeVNlbGVjdG9yKCdzdHlsZSNpbmVydC1zdHlsZSwgbGluayNpbmVydC1zdHlsZScpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICBzdHlsZS5zZXRBdHRyaWJ1dGUoJ2lkJywgJ2luZXJ0LXN0eWxlJyk7XG4gICAgICBzdHlsZS50ZXh0Q29udGVudCA9ICdcXG4nICsgJ1tpbmVydF0ge1xcbicgKyAnICBwb2ludGVyLWV2ZW50czogbm9uZTtcXG4nICsgJyAgY3Vyc29yOiBkZWZhdWx0O1xcbicgKyAnfVxcbicgKyAnXFxuJyArICdbaW5lcnRdLCBbaW5lcnRdICoge1xcbicgKyAnICAtd2Via2l0LXVzZXItc2VsZWN0OiBub25lO1xcbicgKyAnICAtbW96LXVzZXItc2VsZWN0OiBub25lO1xcbicgKyAnICAtbXMtdXNlci1zZWxlY3Q6IG5vbmU7XFxuJyArICcgIHVzZXItc2VsZWN0OiBub25lO1xcbicgKyAnfVxcbic7XG4gICAgICBub2RlLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgICB9XG5cbiAgICBpZiAoIUVsZW1lbnQucHJvdG90eXBlLmhhc093blByb3BlcnR5KCdpbmVydCcpKSB7XG4gICAgICAvKiogQHR5cGUgeyFJbmVydE1hbmFnZXJ9ICovXG4gICAgICB2YXIgaW5lcnRNYW5hZ2VyID0gbmV3IEluZXJ0TWFuYWdlcihkb2N1bWVudCk7XG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFbGVtZW50LnByb3RvdHlwZSwgJ2luZXJ0Jywge1xuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAvKiogQHRoaXMgeyFFbGVtZW50fSAqL1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5oYXNBdHRyaWJ1dGUoJ2luZXJ0Jyk7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKiBAdGhpcyB7IUVsZW1lbnR9ICovXG4gICAgICAgIHNldDogZnVuY3Rpb24gc2V0KGluZXJ0KSB7XG4gICAgICAgICAgaW5lcnRNYW5hZ2VyLnNldEluZXJ0KHRoaXMsIGluZXJ0KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9KSgpO1xuXG59KSkpO1xuIiwiaW1wb3J0IGZpeEJhY2tmYWNlIGZyb20gJy4vZml4LWJhY2tmYWNlLmpzJ1xuaW1wb3J0IFwid2ljZy1pbmVydFwiO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRHJhd2VyIHtcbiAgcHVibGljIGRyYXdlckVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbFxuICBwdWJsaWMgc3dpdGNoRWxlbWVudHM/OiBOb2RlTGlzdE9mPEhUTUxFbGVtZW50PiB8IG51bGxcbiAgcHVibGljIGluZXJ0RWxlbWVudHM/OiBOb2RlTGlzdE9mPEhUTUxFbGVtZW50PiB8IG51bGxcbiAgcHVibGljIGlzRXhwYW5kZWQ6IGJvb2xlYW4gPSBmYWxzZVxuICBwdWJsaWMgZW5hYmxlRml4QmFja2ZhY2U6Ym9vbGVhbiA9IHRydWVcbiAgcHVibGljIGVuYWJsZUhpc3Rvcnk6IGJvb2xlYW4gPSBmYWxzZVxuICBwdWJsaWMgaWQ6IHN0cmluZyA9ICdEcmF3ZXItJyArIG5ldyBEYXRlKCkuZ2V0VGltZSgpXG5cbiAgY29uc3RydWN0b3IoYXJnczoge1xuICAgIGRyYXdlcjogc3RyaW5nXG4gICAgc3dpdGNoPzogc3RyaW5nXG4gICAgaW5lcnQ/OiBzdHJpbmdcbiAgICBlbmFibGVGaXhCYWNrZmFjZT86IGJvb2xlYW5cbiAgICBlbmFibGVIaXN0b3J5PzogYm9vbGVhblxuICB9KSB7XG4gICAgLy8gRHJhd2VyIGJvZHlcbiAgICBpZiAodHlwZW9mIGFyZ3MgIT09ICdvYmplY3QnIHx8IGFyZ3MuZHJhd2VyID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OiBUaGUgXCJkcmF3ZXJcIiBwYXJhbWV0ZXIgaXMgcmVxdWlyZWQuID0+IGV4OiBuZXcgRHJhd2VyKHsgZHJhd2VyOiAnI2RyYXdlcicgfSlgKVxuICAgIGlmICh0eXBlb2YgYXJncy5kcmF3ZXIgIT09ICdzdHJpbmcnIHx8ICcnICkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06IFRoZSBcImRyYXdlclwiIHBhcmFtZXRlciBtdXN0IGJlIFwic3RyaW5nXCIgdHlwZSBhbmQgXCJDU1Mgc2VsZWN0b3JcIi5gKVxuICAgIGlmIChhcmdzLmRyYXdlciA9PT0gJycgKSB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTogVGhlIFwiZHJhd2VyXCIgcGFyYW1ldGVyIGlzIGVtcHR5LmApXG4gICAgdGhpcy5kcmF3ZXJFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihhcmdzLmRyYXdlcilcbiAgICBpZiAoIXRoaXMuZHJhd2VyRWxlbWVudCkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06IFRoZSBFbGVtZW50IGZvciBcImRyYXdlclwiIGlzIG5vdCBmb3VuZC5gKVxuICAgIHRoaXMuZHJhd2VyRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtZHJhd2VyLWlzLWluaXRpYWxpemVkJywgJ3RydWUnKVxuICAgIGlmICh0aGlzLmRyYXdlckVsZW1lbnQuaWQpIHtcbiAgICAgIHRoaXMuaWQgPSB0aGlzLmRyYXdlckVsZW1lbnQuaWRcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50LmlkID0gdGhpcy5pZFxuICAgIH1cbiAgICBpZiAodGhpcy5pc0V4cGFuZGVkKSB7XG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpXG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdoaWRkZW4nKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQuc2V0QXR0cmlidXRlKCdpbmVydCcsICcnKVxuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50LnNldEF0dHJpYnV0ZSgnaGlkZGVuJywgJycpXG4gICAgfVxuXG4gICAgLy8gU3dpdGNoZXMgZm9yIHRvZ2dsZVxuICAgIHRoaXMuc3dpdGNoRWxlbWVudHMgPSB0eXBlb2YgYXJncy5zd2l0Y2ggPT09ICdzdHJpbmcnID9cbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYXJncy5zd2l0Y2gpIDogbnVsbFxuICAgIGlmICh0aGlzLnN3aXRjaEVsZW1lbnRzKSB7XG4gICAgICB0aGlzLnN3aXRjaEVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpKVxuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS1kcmF3ZXItaXMnLCAnaW5pdGlhbGl6ZWQnKVxuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1jb250cm9scycsIHRoaXMuaWQpXG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIEVsZW1lbnRzIHRoYXQgYXJlIHNldCBcImluZXJ0XCIgYXR0cmlidXRlIHdoZW4gdGhlIGRyYXdlciBpcyBleHBhbmRlZFxuICAgIHRoaXMuaW5lcnRFbGVtZW50cyA9IHR5cGVvZiBhcmdzLmluZXJ0ID09PSAnc3RyaW5nJyA/XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGFyZ3MuaW5lcnQpIDogbnVsbFxuICAgIGlmICh0aGlzLmluZXJ0RWxlbWVudHMpIHtcbiAgICAgIHRoaXMuaW5lcnRFbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS1kcmF3ZXItaXMnLCAnaW5pdGlhbGl6ZWQnKVxuICAgICAgICBpZiAodGhpcy5pc0V4cGFuZGVkKSB7XG4gICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2luZXJ0JywgJycpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2luZXJ0JylcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyBQcmV2ZW50aW5nIHNjcm9sbCB3aGVuIHRoZSBkcmF3ZXIgaXMgZXhwYW5kZWRcbiAgICB0aGlzLmVuYWJsZUZpeEJhY2tmYWNlID0gYXJncy5lbmFibGVGaXhCYWNrZmFjZSA/PyB0cnVlXG5cbiAgICAvLyBBZGRpbmcgdGhlIHN0YXRlIG9mIHRoZSBkcmF3ZXIgdG8gdGhlIGhpc3Rvcnkgb2YgeW91ciBicm93c2VyXG4gICAgaWYgKGFyZ3MuZW5hYmxlSGlzdG9yeSkge1xuICAgICAgdGhpcy5lbmFibGVIaXN0b3J5ID0gdHJ1ZVxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3BvcHN0YXRlJywgdGhpcy5fcG9wc3RhdGVIYW5kbGVyLmJpbmQodGhpcykpXG4gICAgfVxuXG4gIH1cbiAgdG9nZ2xlKGV2ZW50OiBFdmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICBpZiAodGhpcy5pc0V4cGFuZGVkKSB7XG4gICAgICB0aGlzLmNsb3NlKClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5vcGVuKClcbiAgICB9XG4gIH1cbiAgb3BlbigpIHtcbiAgICB0aGlzLl9jaGFuZ2VTdGF0ZSh0cnVlKVxuICAgIGlmICh0aGlzLmVuYWJsZUhpc3RvcnkpIHRoaXMuX3B1c2hTdGF0ZSh0cnVlKVxuICB9XG4gIGNsb3NlKCkge1xuICAgIHRoaXMuX2NoYW5nZVN0YXRlKGZhbHNlKVxuICAgIGlmICh0aGlzLmVuYWJsZUhpc3RvcnkpIHRoaXMuX3B1c2hTdGF0ZShmYWxzZSlcbiAgfVxuICBwcml2YXRlIF9jaGFuZ2VTdGF0ZShpc0V4cGFuZGVkOiBib29sZWFuKSB7XG4gICAgaWYgKGlzRXhwYW5kZWQpIHtcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudD8ucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpXG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQ/LnJlbW92ZUF0dHJpYnV0ZSgnaGlkZGVuJylcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5fa2V5dXBIYW5kbGVyLmJpbmQodGhpcykpXG5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gV2hlbiB0aGUgZHJhd2VyIGlzIGhpZGRlblxuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50Py5zZXRBdHRyaWJ1dGUoJ2luZXJ0JywgJycpXG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQ/LnNldEF0dHJpYnV0ZSgnaGlkZGVuJywgJycpXG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX2tleXVwSGFuZGxlci5iaW5kKHRoaXMpKVxuICAgIH1cblxuICAgIGlmICggdHlwZW9mIGZpeEJhY2tmYWNlID09PSAnZnVuY3Rpb24nICYmIHRoaXMuZW5hYmxlRml4QmFja2ZhY2UgKSBmaXhCYWNrZmFjZShpc0V4cGFuZGVkKVxuXG4gICAgaWYgKHRoaXMuc3dpdGNoRWxlbWVudHMpIHtcbiAgICAgIHRoaXMuc3dpdGNoRWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCBTdHJpbmcoaXNFeHBhbmRlZCkpXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmICh0aGlzLmluZXJ0RWxlbWVudHMpIHtcbiAgICAgIHRoaXMuaW5lcnRFbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBpZiAoaXNFeHBhbmRlZCkge1xuICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdpbmVydCcsICcnKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgdGhpcy5pc0V4cGFuZGVkID0gaXNFeHBhbmRlZFxuICB9XG4gIHByaXZhdGUgX2tleXVwSGFuZGxlcihldmVudDogS2V5Ym9hcmRFdmVudCkge1xuICAgIGlmIChldmVudC5rZXkgPT09ICdFc2NhcGUnIHx8IGV2ZW50LmtleSA9PT0gJ0VzYycpIHRoaXMuY2xvc2UoKVxuICB9XG4gIHByaXZhdGUgX3BvcHN0YXRlSGFuZGxlcihldmVudDogUG9wU3RhdGVFdmVudCkge1xuICAgIHRoaXMuX2NoYW5nZVN0YXRlKCF0aGlzLmlzRXhwYW5kZWQpO1xuICB9XG4gIHByaXZhdGUgX3B1c2hTdGF0ZShpc0V4cGFuZGVkOiBib29sZWFuKSB7XG4gICAgaGlzdG9yeS5wdXNoU3RhdGUoe1xuICAgICAgaXNFeHBhbmRlZDogaXNFeHBhbmRlZFxuICAgIH0sICdkcmF3ZXJTdGF0ZScpXG4gIH1cbn0iXSwibmFtZXMiOlsic3R5bGVGb3JGaXhlZCIsImhlaWdodCIsImxlZnQiLCJvdmVyZmxvdyIsInBvc2l0aW9uIiwid2lkdGgiLCJzY3JvbGxpbmdFbGVtZW50IiwidWEiLCJ3aW5kb3ciLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJ0b0xvd2VyQ2FzZSIsImRvY3VtZW50IiwiaW5kZXhPZiIsImJvZHkiLCJkb2N1bWVudEVsZW1lbnQiLCJmaXhCYWNrZmFjZSIsImZpeGVkIiwic2Nyb2xsWSIsInNjcm9sbFRvcCIsInBhcnNlSW50Iiwic3R5bGUiLCJ0b3AiLCJzY3JvbGxiYXJXaWR0aCIsImlubmVyV2lkdGgiLCJjbGllbnRXaWR0aCIsInBhZGRpbmdSaWdodCIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwia2V5Iiwic2V0UHJvcGVydHkiLCJyZW1vdmVQcm9wZXJ0eSIsImdsb2JhbCIsImZhY3RvcnkiLCJleHBvcnRzIiwibW9kdWxlIiwiZGVmaW5lIiwiYW1kIiwidGhpcyIsIl9jcmVhdGVDbGFzcyIsImRlZmluZVByb3BlcnRpZXMiLCJ0YXJnZXQiLCJwcm9wcyIsImkiLCJsZW5ndGgiLCJkZXNjcmlwdG9yIiwiZW51bWVyYWJsZSIsImNvbmZpZ3VyYWJsZSIsIndyaXRhYmxlIiwiZGVmaW5lUHJvcGVydHkiLCJDb25zdHJ1Y3RvciIsInByb3RvUHJvcHMiLCJzdGF0aWNQcm9wcyIsInByb3RvdHlwZSIsIl9jbGFzc0NhbGxDaGVjayIsImluc3RhbmNlIiwiVHlwZUVycm9yIiwic2xpY2UiLCJBcnJheSIsIm1hdGNoZXMiLCJFbGVtZW50IiwibXNNYXRjaGVzU2VsZWN0b3IiLCJfZm9jdXNhYmxlRWxlbWVudHNTdHJpbmciLCJqb2luIiwiSW5lcnRSb290Iiwicm9vdEVsZW1lbnQiLCJpbmVydE1hbmFnZXIiLCJfaW5lcnRNYW5hZ2VyIiwiX3Jvb3RFbGVtZW50IiwiX21hbmFnZWROb2RlcyIsIlNldCIsImhhc0F0dHJpYnV0ZSIsIl9zYXZlZEFyaWFIaWRkZW4iLCJnZXRBdHRyaWJ1dGUiLCJzZXRBdHRyaWJ1dGUiLCJfbWFrZVN1YnRyZWVVbmZvY3VzYWJsZSIsIl9vYnNlcnZlciIsIk11dGF0aW9uT2JzZXJ2ZXIiLCJfb25NdXRhdGlvbiIsImJpbmQiLCJvYnNlcnZlIiwiYXR0cmlidXRlcyIsImNoaWxkTGlzdCIsInN1YnRyZWUiLCJ2YWx1ZSIsImRlc3RydWN0b3IiLCJkaXNjb25uZWN0IiwicmVtb3ZlQXR0cmlidXRlIiwiaW5lcnROb2RlIiwiX3VubWFuYWdlTm9kZSIsIm5vZGUiLCJzdGFydE5vZGUiLCJfdGhpczIiLCJjb21wb3NlZFRyZWVXYWxrIiwiX3Zpc2l0Tm9kZSIsImFjdGl2ZUVsZW1lbnQiLCJjb250YWlucyIsInJvb3QiLCJ1bmRlZmluZWQiLCJub2RlVHlwZSIsIk5vZGUiLCJET0NVTUVOVF9GUkFHTUVOVF9OT0RFIiwicGFyZW50Tm9kZSIsImJsdXIiLCJmb2N1cyIsIkVMRU1FTlRfTk9ERSIsImVsZW1lbnQiLCJfYWRvcHRJbmVydFJvb3QiLCJjYWxsIiwiX21hbmFnZU5vZGUiLCJyZWdpc3RlciIsImFkZCIsImRlcmVnaXN0ZXIiLCJfdW5tYW5hZ2VTdWJ0cmVlIiwiX3RoaXMzIiwiaW5lcnRTdWJyb290IiwiZ2V0SW5lcnRSb290Iiwic2V0SW5lcnQiLCJtYW5hZ2VkTm9kZXMiLCJzYXZlZEluZXJ0Tm9kZSIsInJlY29yZHMiLCJzZWxmIiwicmVjb3JkIiwidHlwZSIsImFkZGVkTm9kZXMiLCJyZW1vdmVkTm9kZXMiLCJhdHRyaWJ1dGVOYW1lIiwibWFuYWdlZE5vZGUiLCJnZXQiLCJzZXQiLCJhcmlhSGlkZGVuIiwiSW5lcnROb2RlIiwiaW5lcnRSb290IiwiX25vZGUiLCJfb3ZlcnJvZGVGb2N1c01ldGhvZCIsIl9pbmVydFJvb3RzIiwiX3NhdmVkVGFiSW5kZXgiLCJfZGVzdHJveWVkIiwiZW5zdXJlVW50YWJiYWJsZSIsIl90aHJvd0lmRGVzdHJveWVkIiwiZGVzdHJveWVkIiwiRXJyb3IiLCJ0YWJJbmRleCIsImhhc1NhdmVkVGFiSW5kZXgiLCJhZGRJbmVydFJvb3QiLCJyZW1vdmVJbmVydFJvb3QiLCJzaXplIiwiSW5lcnRNYW5hZ2VyIiwiX2RvY3VtZW50IiwiTWFwIiwiX3dhdGNoRm9ySW5lcnQiLCJhZGRJbmVydFN0eWxlIiwiaGVhZCIsInJlYWR5U3RhdGUiLCJhZGRFdmVudExpc3RlbmVyIiwiX29uRG9jdW1lbnRMb2FkZWQiLCJpbmVydCIsImhhcyIsInBhcmVudCIsIl9pbmVydFJvb3QiLCJpbmVydEVsZW1lbnRzIiwicXVlcnlTZWxlY3RvckFsbCIsImluZXJ0RWxlbWVudCIsIl90aGlzIiwidW5zaGlmdCIsImNhbGxiYWNrIiwic2hhZG93Um9vdEFuY2VzdG9yIiwic2hhZG93Um9vdCIsImxvY2FsTmFtZSIsImNvbnRlbnQiLCJkaXN0cmlidXRlZE5vZGVzIiwiZ2V0RGlzdHJpYnV0ZWROb2RlcyIsInNsb3QiLCJfZGlzdHJpYnV0ZWROb2RlcyIsImFzc2lnbmVkTm9kZXMiLCJmbGF0dGVuIiwiX2kiLCJjaGlsZCIsImZpcnN0Q2hpbGQiLCJuZXh0U2libGluZyIsInF1ZXJ5U2VsZWN0b3IiLCJjcmVhdGVFbGVtZW50IiwidGV4dENvbnRlbnQiLCJhcHBlbmRDaGlsZCIsImhhc093blByb3BlcnR5IiwiRHJhd2VyIiwiY29uc3RydWN0b3IiLCJhcmdzIiwiRGF0ZSIsImdldFRpbWUiLCJkcmF3ZXIiLCJuYW1lIiwiZHJhd2VyRWxlbWVudCIsImlkIiwiaXNFeHBhbmRlZCIsInN3aXRjaEVsZW1lbnRzIiwic3dpdGNoIiwidG9nZ2xlIiwiZW5hYmxlRml4QmFja2ZhY2UiLCJlbmFibGVIaXN0b3J5IiwiX3BvcHN0YXRlSGFuZGxlciIsImV2ZW50IiwicHJldmVudERlZmF1bHQiLCJjbG9zZSIsIm9wZW4iLCJfY2hhbmdlU3RhdGUiLCJfcHVzaFN0YXRlIiwiX2tleXVwSGFuZGxlciIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJTdHJpbmciLCJoaXN0b3J5IiwicHVzaFN0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
