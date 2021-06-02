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

export default Drawer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhd2VyLW1vZHVsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL3RzL2ZpeC1iYWNrZmFjZS50cyIsIi4uL25vZGVfbW9kdWxlcy93aWNnLWluZXJ0L2Rpc3QvaW5lcnQuanMiLCIuLi9zcmMvdHMvZHJhd2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHN0eWxlRm9yRml4ZWQ6IHtcbiAgW2tleTogc3RyaW5nXTogc3RyaW5nXG59ID0ge1xuICBoZWlnaHQ6ICcxMDB2aCcsXG4gIGxlZnQ6ICcwJyxcbiAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICBwb3NpdGlvbjogJ2ZpeGVkJyxcbiAgd2lkdGg6ICcxMDB2dycsXG59XG5cbmNvbnN0IHNjcm9sbGluZ0VsZW1lbnQ6IEVsZW1lbnQgPSAoKCkgPT4ge1xuICBjb25zdCB1YSA9IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKClcbiAgaWYgKCdzY3JvbGxpbmdFbGVtZW50JyBpbiBkb2N1bWVudCkgcmV0dXJuIGRvY3VtZW50LnNjcm9sbGluZ0VsZW1lbnQhXG4gIGlmICh1YS5pbmRleE9mKCd3ZWJraXQnKSA+IDApIHJldHVybiBkb2N1bWVudC5ib2R5IVxuICByZXR1cm4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IVxufSkoKSFcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZml4QmFja2ZhY2UoZml4ZWQ6IGJvb2xlYW4pIHtcbiAgY29uc3Qgc2Nyb2xsWTpudW1iZXIgPSBmaXhlZCA/IHNjcm9sbGluZ0VsZW1lbnQuc2Nyb2xsVG9wIDogcGFyc2VJbnQoZG9jdW1lbnQuYm9keS5zdHlsZS50b3ApID8/IDBcbiAgY29uc3Qgc2Nyb2xsYmFyV2lkdGg6bnVtYmVyID0gd2luZG93LmlubmVyV2lkdGggLSBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoXG4gIGRvY3VtZW50LmJvZHkuc3R5bGUudG9wID0gZml4ZWQgPyBgLSR7c2Nyb2xsaW5nRWxlbWVudC5zY3JvbGxUb3B9cHhgIDogJydcbiAgZG9jdW1lbnQuYm9keS5zdHlsZS5wYWRkaW5nUmlnaHQgPSBmaXhlZCA/IGAke3Njcm9sbGJhcldpZHRofXB4YCA6ICcnXG4gIE9iamVjdC5rZXlzKHN0eWxlRm9yRml4ZWQpLmZvckVhY2goa2V5ID0+IHtcbiAgICBpZiAoZml4ZWQpIHtcbiAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuc2V0UHJvcGVydHkoa2V5LCBzdHlsZUZvckZpeGVkW2tleV0pXG4gICAgfSBlbHNlIHtcbiAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUucmVtb3ZlUHJvcGVydHkoa2V5KVxuICAgIH1cbiAgfSlcbiAgaWYgKCFmaXhlZCkgc2Nyb2xsaW5nRWxlbWVudC5zY3JvbGxUb3AgPSBzY3JvbGxZICogLTFcbn1cbiIsIihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IGZhY3RvcnkoKSA6XG4gIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZSgnaW5lcnQnLCBmYWN0b3J5KSA6XG4gIChmYWN0b3J5KCkpO1xufSh0aGlzLCAoZnVuY3Rpb24gKCkgeyAndXNlIHN0cmljdCc7XG5cbiAgdmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxuICBmdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG4gIC8qKlxuICAgKiBUaGlzIHdvcmsgaXMgbGljZW5zZWQgdW5kZXIgdGhlIFczQyBTb2Z0d2FyZSBhbmQgRG9jdW1lbnQgTGljZW5zZVxuICAgKiAoaHR0cDovL3d3dy53My5vcmcvQ29uc29ydGl1bS9MZWdhbC8yMDE1L2NvcHlyaWdodC1zb2Z0d2FyZS1hbmQtZG9jdW1lbnQpLlxuICAgKi9cblxuICAoZnVuY3Rpb24gKCkge1xuICAgIC8vIFJldHVybiBlYXJseSBpZiB3ZSdyZSBub3QgcnVubmluZyBpbnNpZGUgb2YgdGhlIGJyb3dzZXIuXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQ29udmVuaWVuY2UgZnVuY3Rpb24gZm9yIGNvbnZlcnRpbmcgTm9kZUxpc3RzLlxuICAgIC8qKiBAdHlwZSB7dHlwZW9mIEFycmF5LnByb3RvdHlwZS5zbGljZX0gKi9cbiAgICB2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG5cbiAgICAvKipcbiAgICAgKiBJRSBoYXMgYSBub24tc3RhbmRhcmQgbmFtZSBmb3IgXCJtYXRjaGVzXCIuXG4gICAgICogQHR5cGUge3R5cGVvZiBFbGVtZW50LnByb3RvdHlwZS5tYXRjaGVzfVxuICAgICAqL1xuICAgIHZhciBtYXRjaGVzID0gRWxlbWVudC5wcm90b3R5cGUubWF0Y2hlcyB8fCBFbGVtZW50LnByb3RvdHlwZS5tc01hdGNoZXNTZWxlY3RvcjtcblxuICAgIC8qKiBAdHlwZSB7c3RyaW5nfSAqL1xuICAgIHZhciBfZm9jdXNhYmxlRWxlbWVudHNTdHJpbmcgPSBbJ2FbaHJlZl0nLCAnYXJlYVtocmVmXScsICdpbnB1dDpub3QoW2Rpc2FibGVkXSknLCAnc2VsZWN0Om5vdChbZGlzYWJsZWRdKScsICd0ZXh0YXJlYTpub3QoW2Rpc2FibGVkXSknLCAnYnV0dG9uOm5vdChbZGlzYWJsZWRdKScsICdkZXRhaWxzJywgJ3N1bW1hcnknLCAnaWZyYW1lJywgJ29iamVjdCcsICdlbWJlZCcsICdbY29udGVudGVkaXRhYmxlXSddLmpvaW4oJywnKTtcblxuICAgIC8qKlxuICAgICAqIGBJbmVydFJvb3RgIG1hbmFnZXMgYSBzaW5nbGUgaW5lcnQgc3VidHJlZSwgaS5lLiBhIERPTSBzdWJ0cmVlIHdob3NlIHJvb3QgZWxlbWVudCBoYXMgYW4gYGluZXJ0YFxuICAgICAqIGF0dHJpYnV0ZS5cbiAgICAgKlxuICAgICAqIEl0cyBtYWluIGZ1bmN0aW9ucyBhcmU6XG4gICAgICpcbiAgICAgKiAtIHRvIGNyZWF0ZSBhbmQgbWFpbnRhaW4gYSBzZXQgb2YgbWFuYWdlZCBgSW5lcnROb2RlYHMsIGluY2x1ZGluZyB3aGVuIG11dGF0aW9ucyBvY2N1ciBpbiB0aGVcbiAgICAgKiAgIHN1YnRyZWUuIFRoZSBgbWFrZVN1YnRyZWVVbmZvY3VzYWJsZSgpYCBtZXRob2QgaGFuZGxlcyBjb2xsZWN0aW5nIGBJbmVydE5vZGVgcyB2aWEgcmVnaXN0ZXJpbmdcbiAgICAgKiAgIGVhY2ggZm9jdXNhYmxlIG5vZGUgaW4gdGhlIHN1YnRyZWUgd2l0aCB0aGUgc2luZ2xldG9uIGBJbmVydE1hbmFnZXJgIHdoaWNoIG1hbmFnZXMgYWxsIGtub3duXG4gICAgICogICBmb2N1c2FibGUgbm9kZXMgd2l0aGluIGluZXJ0IHN1YnRyZWVzLiBgSW5lcnRNYW5hZ2VyYCBlbnN1cmVzIHRoYXQgYSBzaW5nbGUgYEluZXJ0Tm9kZWBcbiAgICAgKiAgIGluc3RhbmNlIGV4aXN0cyBmb3IgZWFjaCBmb2N1c2FibGUgbm9kZSB3aGljaCBoYXMgYXQgbGVhc3Qgb25lIGluZXJ0IHJvb3QgYXMgYW4gYW5jZXN0b3IuXG4gICAgICpcbiAgICAgKiAtIHRvIG5vdGlmeSBhbGwgbWFuYWdlZCBgSW5lcnROb2RlYHMgd2hlbiB0aGlzIHN1YnRyZWUgc3RvcHMgYmVpbmcgaW5lcnQgKGkuZS4gd2hlbiB0aGUgYGluZXJ0YFxuICAgICAqICAgYXR0cmlidXRlIGlzIHJlbW92ZWQgZnJvbSB0aGUgcm9vdCBub2RlKS4gVGhpcyBpcyBoYW5kbGVkIGluIHRoZSBkZXN0cnVjdG9yLCB3aGljaCBjYWxscyB0aGVcbiAgICAgKiAgIGBkZXJlZ2lzdGVyYCBtZXRob2Qgb24gYEluZXJ0TWFuYWdlcmAgZm9yIGVhY2ggbWFuYWdlZCBpbmVydCBub2RlLlxuICAgICAqL1xuXG4gICAgdmFyIEluZXJ0Um9vdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8qKlxuICAgICAgICogQHBhcmFtIHshRWxlbWVudH0gcm9vdEVsZW1lbnQgVGhlIEVsZW1lbnQgYXQgdGhlIHJvb3Qgb2YgdGhlIGluZXJ0IHN1YnRyZWUuXG4gICAgICAgKiBAcGFyYW0geyFJbmVydE1hbmFnZXJ9IGluZXJ0TWFuYWdlciBUaGUgZ2xvYmFsIHNpbmdsZXRvbiBJbmVydE1hbmFnZXIgb2JqZWN0LlxuICAgICAgICovXG4gICAgICBmdW5jdGlvbiBJbmVydFJvb3Qocm9vdEVsZW1lbnQsIGluZXJ0TWFuYWdlcikge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgSW5lcnRSb290KTtcblxuICAgICAgICAvKiogQHR5cGUgeyFJbmVydE1hbmFnZXJ9ICovXG4gICAgICAgIHRoaXMuX2luZXJ0TWFuYWdlciA9IGluZXJ0TWFuYWdlcjtcblxuICAgICAgICAvKiogQHR5cGUgeyFFbGVtZW50fSAqL1xuICAgICAgICB0aGlzLl9yb290RWxlbWVudCA9IHJvb3RFbGVtZW50O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7IVNldDwhSW5lcnROb2RlPn1cbiAgICAgICAgICogQWxsIG1hbmFnZWQgZm9jdXNhYmxlIG5vZGVzIGluIHRoaXMgSW5lcnRSb290J3Mgc3VidHJlZS5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX21hbmFnZWROb2RlcyA9IG5ldyBTZXQoKTtcblxuICAgICAgICAvLyBNYWtlIHRoZSBzdWJ0cmVlIGhpZGRlbiBmcm9tIGFzc2lzdGl2ZSB0ZWNobm9sb2d5XG4gICAgICAgIGlmICh0aGlzLl9yb290RWxlbWVudC5oYXNBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJykpIHtcbiAgICAgICAgICAvKiogQHR5cGUgez9zdHJpbmd9ICovXG4gICAgICAgICAgdGhpcy5fc2F2ZWRBcmlhSGlkZGVuID0gdGhpcy5fcm9vdEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX3NhdmVkQXJpYUhpZGRlbiA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcm9vdEVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG5cbiAgICAgICAgLy8gTWFrZSBhbGwgZm9jdXNhYmxlIGVsZW1lbnRzIGluIHRoZSBzdWJ0cmVlIHVuZm9jdXNhYmxlIGFuZCBhZGQgdGhlbSB0byBfbWFuYWdlZE5vZGVzXG4gICAgICAgIHRoaXMuX21ha2VTdWJ0cmVlVW5mb2N1c2FibGUodGhpcy5fcm9vdEVsZW1lbnQpO1xuXG4gICAgICAgIC8vIFdhdGNoIGZvcjpcbiAgICAgICAgLy8gLSBhbnkgYWRkaXRpb25zIGluIHRoZSBzdWJ0cmVlOiBtYWtlIHRoZW0gdW5mb2N1c2FibGUgdG9vXG4gICAgICAgIC8vIC0gYW55IHJlbW92YWxzIGZyb20gdGhlIHN1YnRyZWU6IHJlbW92ZSB0aGVtIGZyb20gdGhpcyBpbmVydCByb290J3MgbWFuYWdlZCBub2Rlc1xuICAgICAgICAvLyAtIGF0dHJpYnV0ZSBjaGFuZ2VzOiBpZiBgdGFiaW5kZXhgIGlzIGFkZGVkLCBvciByZW1vdmVkIGZyb20gYW4gaW50cmluc2ljYWxseSBmb2N1c2FibGVcbiAgICAgICAgLy8gICBlbGVtZW50LCBtYWtlIHRoYXQgbm9kZSBhIG1hbmFnZWQgbm9kZS5cbiAgICAgICAgdGhpcy5fb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcih0aGlzLl9vbk11dGF0aW9uLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLl9vYnNlcnZlci5vYnNlcnZlKHRoaXMuX3Jvb3RFbGVtZW50LCB7IGF0dHJpYnV0ZXM6IHRydWUsIGNoaWxkTGlzdDogdHJ1ZSwgc3VidHJlZTogdHJ1ZSB9KTtcbiAgICAgIH1cblxuICAgICAgLyoqXG4gICAgICAgKiBDYWxsIHRoaXMgd2hlbmV2ZXIgdGhpcyBvYmplY3QgaXMgYWJvdXQgdG8gYmVjb21lIG9ic29sZXRlLiAgVGhpcyB1bndpbmRzIGFsbCBvZiB0aGUgc3RhdGVcbiAgICAgICAqIHN0b3JlZCBpbiB0aGlzIG9iamVjdCBhbmQgdXBkYXRlcyB0aGUgc3RhdGUgb2YgYWxsIG9mIHRoZSBtYW5hZ2VkIG5vZGVzLlxuICAgICAgICovXG5cblxuICAgICAgX2NyZWF0ZUNsYXNzKEluZXJ0Um9vdCwgW3tcbiAgICAgICAga2V5OiAnZGVzdHJ1Y3RvcicsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBkZXN0cnVjdG9yKCkge1xuICAgICAgICAgIHRoaXMuX29ic2VydmVyLmRpc2Nvbm5lY3QoKTtcblxuICAgICAgICAgIGlmICh0aGlzLl9yb290RWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3NhdmVkQXJpYUhpZGRlbiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICB0aGlzLl9yb290RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgdGhpcy5fc2F2ZWRBcmlhSGlkZGVuKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLl9tYW5hZ2VkTm9kZXMuZm9yRWFjaChmdW5jdGlvbiAoaW5lcnROb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl91bm1hbmFnZU5vZGUoaW5lcnROb2RlLm5vZGUpO1xuICAgICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgICAgLy8gTm90ZSB3ZSBjYXN0IHRoZSBudWxscyB0byB0aGUgQU5ZIHR5cGUgaGVyZSBiZWNhdXNlOlxuICAgICAgICAgIC8vIDEpIFdlIHdhbnQgdGhlIGNsYXNzIHByb3BlcnRpZXMgdG8gYmUgZGVjbGFyZWQgYXMgbm9uLW51bGwsIG9yIGVsc2Ugd2VcbiAgICAgICAgICAvLyAgICBuZWVkIGV2ZW4gbW9yZSBjYXN0cyB0aHJvdWdob3V0IHRoaXMgY29kZS4gQWxsIGJldHMgYXJlIG9mZiBpZiBhblxuICAgICAgICAgIC8vICAgIGluc3RhbmNlIGhhcyBiZWVuIGRlc3Ryb3llZCBhbmQgYSBtZXRob2QgaXMgY2FsbGVkLlxuICAgICAgICAgIC8vIDIpIFdlIGRvbid0IHdhbnQgdG8gY2FzdCBcInRoaXNcIiwgYmVjYXVzZSB3ZSB3YW50IHR5cGUtYXdhcmUgb3B0aW1pemF0aW9uc1xuICAgICAgICAgIC8vICAgIHRvIGtub3cgd2hpY2ggcHJvcGVydGllcyB3ZSdyZSBzZXR0aW5nLlxuICAgICAgICAgIHRoaXMuX29ic2VydmVyID0gLyoqIEB0eXBlIHs/fSAqL251bGw7XG4gICAgICAgICAgdGhpcy5fcm9vdEVsZW1lbnQgPSAvKiogQHR5cGUgez99ICovbnVsbDtcbiAgICAgICAgICB0aGlzLl9tYW5hZ2VkTm9kZXMgPSAvKiogQHR5cGUgez99ICovbnVsbDtcbiAgICAgICAgICB0aGlzLl9pbmVydE1hbmFnZXIgPSAvKiogQHR5cGUgez99ICovbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcmV0dXJuIHshU2V0PCFJbmVydE5vZGU+fSBBIGNvcHkgb2YgdGhpcyBJbmVydFJvb3QncyBtYW5hZ2VkIG5vZGVzIHNldC5cbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnX21ha2VTdWJ0cmVlVW5mb2N1c2FibGUnLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwYXJhbSB7IU5vZGV9IHN0YXJ0Tm9kZVxuICAgICAgICAgKi9cbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9tYWtlU3VidHJlZVVuZm9jdXNhYmxlKHN0YXJ0Tm9kZSkge1xuICAgICAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG4gICAgICAgICAgY29tcG9zZWRUcmVlV2FsayhzdGFydE5vZGUsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMyLl92aXNpdE5vZGUobm9kZSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICB2YXIgYWN0aXZlRWxlbWVudCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG5cbiAgICAgICAgICBpZiAoIWRvY3VtZW50LmJvZHkuY29udGFpbnMoc3RhcnROb2RlKSkge1xuICAgICAgICAgICAgLy8gc3RhcnROb2RlIG1heSBiZSBpbiBzaGFkb3cgRE9NLCBzbyBmaW5kIGl0cyBuZWFyZXN0IHNoYWRvd1Jvb3QgdG8gZ2V0IHRoZSBhY3RpdmVFbGVtZW50LlxuICAgICAgICAgICAgdmFyIG5vZGUgPSBzdGFydE5vZGU7XG4gICAgICAgICAgICAvKiogQHR5cGUgeyFTaGFkb3dSb290fHVuZGVmaW5lZH0gKi9cbiAgICAgICAgICAgIHZhciByb290ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IE5vZGUuRE9DVU1FTlRfRlJBR01FTlRfTk9ERSkge1xuICAgICAgICAgICAgICAgIHJvb3QgPSAvKiogQHR5cGUgeyFTaGFkb3dSb290fSAqL25vZGU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyb290KSB7XG4gICAgICAgICAgICAgIGFjdGl2ZUVsZW1lbnQgPSByb290LmFjdGl2ZUVsZW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzdGFydE5vZGUuY29udGFpbnMoYWN0aXZlRWxlbWVudCkpIHtcbiAgICAgICAgICAgIGFjdGl2ZUVsZW1lbnQuYmx1cigpO1xuICAgICAgICAgICAgLy8gSW4gSUUxMSwgaWYgYW4gZWxlbWVudCBpcyBhbHJlYWR5IGZvY3VzZWQsIGFuZCB0aGVuIHNldCB0byB0YWJpbmRleD0tMVxuICAgICAgICAgICAgLy8gY2FsbGluZyBibHVyKCkgd2lsbCBub3QgYWN0dWFsbHkgbW92ZSB0aGUgZm9jdXMuXG4gICAgICAgICAgICAvLyBUbyB3b3JrIGFyb3VuZCB0aGlzIHdlIGNhbGwgZm9jdXMoKSBvbiB0aGUgYm9keSBpbnN0ZWFkLlxuICAgICAgICAgICAgaWYgKGFjdGl2ZUVsZW1lbnQgPT09IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5mb2N1cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gICAgICAgICAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ192aXNpdE5vZGUnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX3Zpc2l0Tm9kZShub2RlKSB7XG4gICAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgIT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBlbGVtZW50ID0gLyoqIEB0eXBlIHshRWxlbWVudH0gKi9ub2RlO1xuXG4gICAgICAgICAgLy8gSWYgYSBkZXNjZW5kYW50IGluZXJ0IHJvb3QgYmVjb21lcyB1bi1pbmVydCwgaXRzIGRlc2NlbmRhbnRzIHdpbGwgc3RpbGwgYmUgaW5lcnQgYmVjYXVzZSBvZlxuICAgICAgICAgIC8vIHRoaXMgaW5lcnQgcm9vdCwgc28gYWxsIG9mIGl0cyBtYW5hZ2VkIG5vZGVzIG5lZWQgdG8gYmUgYWRvcHRlZCBieSB0aGlzIEluZXJ0Um9vdC5cbiAgICAgICAgICBpZiAoZWxlbWVudCAhPT0gdGhpcy5fcm9vdEVsZW1lbnQgJiYgZWxlbWVudC5oYXNBdHRyaWJ1dGUoJ2luZXJ0JykpIHtcbiAgICAgICAgICAgIHRoaXMuX2Fkb3B0SW5lcnRSb290KGVsZW1lbnQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChtYXRjaGVzLmNhbGwoZWxlbWVudCwgX2ZvY3VzYWJsZUVsZW1lbnRzU3RyaW5nKSB8fCBlbGVtZW50Lmhhc0F0dHJpYnV0ZSgndGFiaW5kZXgnKSkge1xuICAgICAgICAgICAgdGhpcy5fbWFuYWdlTm9kZShlbGVtZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVnaXN0ZXIgdGhlIGdpdmVuIG5vZGUgd2l0aCB0aGlzIEluZXJ0Um9vdCBhbmQgd2l0aCBJbmVydE1hbmFnZXIuXG4gICAgICAgICAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnX21hbmFnZU5vZGUnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX21hbmFnZU5vZGUobm9kZSkge1xuICAgICAgICAgIHZhciBpbmVydE5vZGUgPSB0aGlzLl9pbmVydE1hbmFnZXIucmVnaXN0ZXIobm9kZSwgdGhpcyk7XG4gICAgICAgICAgdGhpcy5fbWFuYWdlZE5vZGVzLmFkZChpbmVydE5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFVucmVnaXN0ZXIgdGhlIGdpdmVuIG5vZGUgd2l0aCB0aGlzIEluZXJ0Um9vdCBhbmQgd2l0aCBJbmVydE1hbmFnZXIuXG4gICAgICAgICAqIEBwYXJhbSB7IU5vZGV9IG5vZGVcbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnX3VubWFuYWdlTm9kZScsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfdW5tYW5hZ2VOb2RlKG5vZGUpIHtcbiAgICAgICAgICB2YXIgaW5lcnROb2RlID0gdGhpcy5faW5lcnRNYW5hZ2VyLmRlcmVnaXN0ZXIobm9kZSwgdGhpcyk7XG4gICAgICAgICAgaWYgKGluZXJ0Tm9kZSkge1xuICAgICAgICAgICAgdGhpcy5fbWFuYWdlZE5vZGVzWydkZWxldGUnXShpbmVydE5vZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBVbnJlZ2lzdGVyIHRoZSBlbnRpcmUgc3VidHJlZSBzdGFydGluZyBhdCBgc3RhcnROb2RlYC5cbiAgICAgICAgICogQHBhcmFtIHshTm9kZX0gc3RhcnROb2RlXG4gICAgICAgICAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ191bm1hbmFnZVN1YnRyZWUnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX3VubWFuYWdlU3VidHJlZShzdGFydE5vZGUpIHtcbiAgICAgICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuICAgICAgICAgIGNvbXBvc2VkVHJlZVdhbGsoc3RhcnROb2RlLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzMy5fdW5tYW5hZ2VOb2RlKG5vZGUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIGEgZGVzY2VuZGFudCBub2RlIGlzIGZvdW5kIHdpdGggYW4gYGluZXJ0YCBhdHRyaWJ1dGUsIGFkb3B0IGl0cyBtYW5hZ2VkIG5vZGVzLlxuICAgICAgICAgKiBAcGFyYW0geyFFbGVtZW50fSBub2RlXG4gICAgICAgICAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ19hZG9wdEluZXJ0Um9vdCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfYWRvcHRJbmVydFJvb3Qobm9kZSkge1xuICAgICAgICAgIHZhciBpbmVydFN1YnJvb3QgPSB0aGlzLl9pbmVydE1hbmFnZXIuZ2V0SW5lcnRSb290KG5vZGUpO1xuXG4gICAgICAgICAgLy8gRHVyaW5nIGluaXRpYWxpc2F0aW9uIHRoaXMgaW5lcnQgcm9vdCBtYXkgbm90IGhhdmUgYmVlbiByZWdpc3RlcmVkIHlldCxcbiAgICAgICAgICAvLyBzbyByZWdpc3RlciBpdCBub3cgaWYgbmVlZCBiZS5cbiAgICAgICAgICBpZiAoIWluZXJ0U3Vicm9vdCkge1xuICAgICAgICAgICAgdGhpcy5faW5lcnRNYW5hZ2VyLnNldEluZXJ0KG5vZGUsIHRydWUpO1xuICAgICAgICAgICAgaW5lcnRTdWJyb290ID0gdGhpcy5faW5lcnRNYW5hZ2VyLmdldEluZXJ0Um9vdChub2RlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpbmVydFN1YnJvb3QubWFuYWdlZE5vZGVzLmZvckVhY2goZnVuY3Rpb24gKHNhdmVkSW5lcnROb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9tYW5hZ2VOb2RlKHNhdmVkSW5lcnROb2RlLm5vZGUpO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGxiYWNrIHVzZWQgd2hlbiBtdXRhdGlvbiBvYnNlcnZlciBkZXRlY3RzIHN1YnRyZWUgYWRkaXRpb25zLCByZW1vdmFscywgb3IgYXR0cmlidXRlIGNoYW5nZXMuXG4gICAgICAgICAqIEBwYXJhbSB7IUFycmF5PCFNdXRhdGlvblJlY29yZD59IHJlY29yZHNcbiAgICAgICAgICogQHBhcmFtIHshTXV0YXRpb25PYnNlcnZlcn0gc2VsZlxuICAgICAgICAgKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdfb25NdXRhdGlvbicsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfb25NdXRhdGlvbihyZWNvcmRzLCBzZWxmKSB7XG4gICAgICAgICAgcmVjb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uIChyZWNvcmQpIHtcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSAvKiogQHR5cGUgeyFFbGVtZW50fSAqL3JlY29yZC50YXJnZXQ7XG4gICAgICAgICAgICBpZiAocmVjb3JkLnR5cGUgPT09ICdjaGlsZExpc3QnKSB7XG4gICAgICAgICAgICAgIC8vIE1hbmFnZSBhZGRlZCBub2Rlc1xuICAgICAgICAgICAgICBzbGljZS5jYWxsKHJlY29yZC5hZGRlZE5vZGVzKS5mb3JFYWNoKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFrZVN1YnRyZWVVbmZvY3VzYWJsZShub2RlKTtcbiAgICAgICAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgICAgICAgLy8gVW4tbWFuYWdlIHJlbW92ZWQgbm9kZXNcbiAgICAgICAgICAgICAgc2xpY2UuY2FsbChyZWNvcmQucmVtb3ZlZE5vZGVzKS5mb3JFYWNoKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdW5tYW5hZ2VTdWJ0cmVlKG5vZGUpO1xuICAgICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVjb3JkLnR5cGUgPT09ICdhdHRyaWJ1dGVzJykge1xuICAgICAgICAgICAgICBpZiAocmVjb3JkLmF0dHJpYnV0ZU5hbWUgPT09ICd0YWJpbmRleCcpIHtcbiAgICAgICAgICAgICAgICAvLyBSZS1pbml0aWFsaXNlIGluZXJ0IG5vZGUgaWYgdGFiaW5kZXggY2hhbmdlc1xuICAgICAgICAgICAgICAgIHRoaXMuX21hbmFnZU5vZGUodGFyZ2V0KTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YXJnZXQgIT09IHRoaXMuX3Jvb3RFbGVtZW50ICYmIHJlY29yZC5hdHRyaWJ1dGVOYW1lID09PSAnaW5lcnQnICYmIHRhcmdldC5oYXNBdHRyaWJ1dGUoJ2luZXJ0JykpIHtcbiAgICAgICAgICAgICAgICAvLyBJZiBhIG5ldyBpbmVydCByb290IGlzIGFkZGVkLCBhZG9wdCBpdHMgbWFuYWdlZCBub2RlcyBhbmQgbWFrZSBzdXJlIGl0IGtub3dzIGFib3V0IHRoZVxuICAgICAgICAgICAgICAgIC8vIGFscmVhZHkgbWFuYWdlZCBub2RlcyBmcm9tIHRoaXMgaW5lcnQgc3Vicm9vdC5cbiAgICAgICAgICAgICAgICB0aGlzLl9hZG9wdEluZXJ0Um9vdCh0YXJnZXQpO1xuICAgICAgICAgICAgICAgIHZhciBpbmVydFN1YnJvb3QgPSB0aGlzLl9pbmVydE1hbmFnZXIuZ2V0SW5lcnRSb290KHRhcmdldCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWFuYWdlZE5vZGVzLmZvckVhY2goZnVuY3Rpb24gKG1hbmFnZWROb2RlKSB7XG4gICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmNvbnRhaW5zKG1hbmFnZWROb2RlLm5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZXJ0U3Vicm9vdC5fbWFuYWdlTm9kZShtYW5hZ2VkTm9kZS5ub2RlKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ21hbmFnZWROb2RlcycsXG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgIHJldHVybiBuZXcgU2V0KHRoaXMuX21hbmFnZWROb2Rlcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvKiogQHJldHVybiB7Ym9vbGVhbn0gKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdoYXNTYXZlZEFyaWFIaWRkZW4nLFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fc2F2ZWRBcmlhSGlkZGVuICE9PSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIEBwYXJhbSB7P3N0cmluZ30gYXJpYUhpZGRlbiAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ3NhdmVkQXJpYUhpZGRlbicsXG4gICAgICAgIHNldDogZnVuY3Rpb24gc2V0KGFyaWFIaWRkZW4pIHtcbiAgICAgICAgICB0aGlzLl9zYXZlZEFyaWFIaWRkZW4gPSBhcmlhSGlkZGVuO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIEByZXR1cm4gez9zdHJpbmd9ICovXG4gICAgICAgICxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX3NhdmVkQXJpYUhpZGRlbjtcbiAgICAgICAgfVxuICAgICAgfV0pO1xuXG4gICAgICByZXR1cm4gSW5lcnRSb290O1xuICAgIH0oKTtcblxuICAgIC8qKlxuICAgICAqIGBJbmVydE5vZGVgIGluaXRpYWxpc2VzIGFuZCBtYW5hZ2VzIGEgc2luZ2xlIGluZXJ0IG5vZGUuXG4gICAgICogQSBub2RlIGlzIGluZXJ0IGlmIGl0IGlzIGEgZGVzY2VuZGFudCBvZiBvbmUgb3IgbW9yZSBpbmVydCByb290IGVsZW1lbnRzLlxuICAgICAqXG4gICAgICogT24gY29uc3RydWN0aW9uLCBgSW5lcnROb2RlYCBzYXZlcyB0aGUgZXhpc3RpbmcgYHRhYmluZGV4YCB2YWx1ZSBmb3IgdGhlIG5vZGUsIGlmIGFueSwgYW5kXG4gICAgICogZWl0aGVyIHJlbW92ZXMgdGhlIGB0YWJpbmRleGAgYXR0cmlidXRlIG9yIHNldHMgaXQgdG8gYC0xYCwgZGVwZW5kaW5nIG9uIHdoZXRoZXIgdGhlIGVsZW1lbnRcbiAgICAgKiBpcyBpbnRyaW5zaWNhbGx5IGZvY3VzYWJsZSBvciBub3QuXG4gICAgICpcbiAgICAgKiBgSW5lcnROb2RlYCBtYWludGFpbnMgYSBzZXQgb2YgYEluZXJ0Um9vdGBzIHdoaWNoIGFyZSBkZXNjZW5kYW50cyBvZiB0aGlzIGBJbmVydE5vZGVgLiBXaGVuIGFuXG4gICAgICogYEluZXJ0Um9vdGAgaXMgZGVzdHJveWVkLCBhbmQgY2FsbHMgYEluZXJ0TWFuYWdlci5kZXJlZ2lzdGVyKClgLCB0aGUgYEluZXJ0TWFuYWdlcmAgbm90aWZpZXMgdGhlXG4gICAgICogYEluZXJ0Tm9kZWAgdmlhIGByZW1vdmVJbmVydFJvb3QoKWAsIHdoaWNoIGluIHR1cm4gZGVzdHJveXMgdGhlIGBJbmVydE5vZGVgIGlmIG5vIGBJbmVydFJvb3Rgc1xuICAgICAqIHJlbWFpbiBpbiB0aGUgc2V0LiBPbiBkZXN0cnVjdGlvbiwgYEluZXJ0Tm9kZWAgcmVpbnN0YXRlcyB0aGUgc3RvcmVkIGB0YWJpbmRleGAgaWYgb25lIGV4aXN0cyxcbiAgICAgKiBvciByZW1vdmVzIHRoZSBgdGFiaW5kZXhgIGF0dHJpYnV0ZSBpZiB0aGUgZWxlbWVudCBpcyBpbnRyaW5zaWNhbGx5IGZvY3VzYWJsZS5cbiAgICAgKi9cblxuXG4gICAgdmFyIEluZXJ0Tm9kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8qKlxuICAgICAgICogQHBhcmFtIHshTm9kZX0gbm9kZSBBIGZvY3VzYWJsZSBlbGVtZW50IHRvIGJlIG1hZGUgaW5lcnQuXG4gICAgICAgKiBAcGFyYW0geyFJbmVydFJvb3R9IGluZXJ0Um9vdCBUaGUgaW5lcnQgcm9vdCBlbGVtZW50IGFzc29jaWF0ZWQgd2l0aCB0aGlzIGluZXJ0IG5vZGUuXG4gICAgICAgKi9cbiAgICAgIGZ1bmN0aW9uIEluZXJ0Tm9kZShub2RlLCBpbmVydFJvb3QpIHtcbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIEluZXJ0Tm9kZSk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHshTm9kZX0gKi9cbiAgICAgICAgdGhpcy5fbm9kZSA9IG5vZGU7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtib29sZWFufSAqL1xuICAgICAgICB0aGlzLl9vdmVycm9kZUZvY3VzTWV0aG9kID0gZmFsc2U7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHshU2V0PCFJbmVydFJvb3Q+fSBUaGUgc2V0IG9mIGRlc2NlbmRhbnQgaW5lcnQgcm9vdHMuXG4gICAgICAgICAqICAgIElmIGFuZCBvbmx5IGlmIHRoaXMgc2V0IGJlY29tZXMgZW1wdHksIHRoaXMgbm9kZSBpcyBubyBsb25nZXIgaW5lcnQuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9pbmVydFJvb3RzID0gbmV3IFNldChbaW5lcnRSb290XSk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHs/bnVtYmVyfSAqL1xuICAgICAgICB0aGlzLl9zYXZlZFRhYkluZGV4ID0gbnVsbDtcblxuICAgICAgICAvKiogQHR5cGUge2Jvb2xlYW59ICovXG4gICAgICAgIHRoaXMuX2Rlc3Ryb3llZCA9IGZhbHNlO1xuXG4gICAgICAgIC8vIFNhdmUgYW55IHByaW9yIHRhYmluZGV4IGluZm8gYW5kIG1ha2UgdGhpcyBub2RlIHVudGFiYmFibGVcbiAgICAgICAgdGhpcy5lbnN1cmVVbnRhYmJhYmxlKCk7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogQ2FsbCB0aGlzIHdoZW5ldmVyIHRoaXMgb2JqZWN0IGlzIGFib3V0IHRvIGJlY29tZSBvYnNvbGV0ZS5cbiAgICAgICAqIFRoaXMgbWFrZXMgdGhlIG1hbmFnZWQgbm9kZSBmb2N1c2FibGUgYWdhaW4gYW5kIGRlbGV0ZXMgYWxsIG9mIHRoZSBwcmV2aW91c2x5IHN0b3JlZCBzdGF0ZS5cbiAgICAgICAqL1xuXG5cbiAgICAgIF9jcmVhdGVDbGFzcyhJbmVydE5vZGUsIFt7XG4gICAgICAgIGtleTogJ2Rlc3RydWN0b3InLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZGVzdHJ1Y3RvcigpIHtcbiAgICAgICAgICB0aGlzLl90aHJvd0lmRGVzdHJveWVkKCk7XG5cbiAgICAgICAgICBpZiAodGhpcy5fbm9kZSAmJiB0aGlzLl9ub2RlLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSAvKiogQHR5cGUgeyFFbGVtZW50fSAqL3RoaXMuX25vZGU7XG4gICAgICAgICAgICBpZiAodGhpcy5fc2F2ZWRUYWJJbmRleCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCB0aGlzLl9zYXZlZFRhYkluZGV4KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCd0YWJpbmRleCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBVc2UgYGRlbGV0ZWAgdG8gcmVzdG9yZSBuYXRpdmUgZm9jdXMgbWV0aG9kLlxuICAgICAgICAgICAgaWYgKHRoaXMuX292ZXJyb2RlRm9jdXNNZXRob2QpIHtcbiAgICAgICAgICAgICAgZGVsZXRlIGVsZW1lbnQuZm9jdXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gU2VlIG5vdGUgaW4gSW5lcnRSb290LmRlc3RydWN0b3IgZm9yIHdoeSB3ZSBjYXN0IHRoZXNlIG51bGxzIHRvIEFOWS5cbiAgICAgICAgICB0aGlzLl9ub2RlID0gLyoqIEB0eXBlIHs/fSAqL251bGw7XG4gICAgICAgICAgdGhpcy5faW5lcnRSb290cyA9IC8qKiBAdHlwZSB7P30gKi9udWxsO1xuICAgICAgICAgIHRoaXMuX2Rlc3Ryb3llZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59IFdoZXRoZXIgdGhpcyBvYmplY3QgaXMgb2Jzb2xldGUgYmVjYXVzZSB0aGUgbWFuYWdlZCBub2RlIGlzIG5vIGxvbmdlciBpbmVydC5cbiAgICAgICAgICogSWYgdGhlIG9iamVjdCBoYXMgYmVlbiBkZXN0cm95ZWQsIGFueSBhdHRlbXB0IHRvIGFjY2VzcyBpdCB3aWxsIGNhdXNlIGFuIGV4Y2VwdGlvbi5cbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnX3Rocm93SWZEZXN0cm95ZWQnLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRocm93IGlmIHVzZXIgdHJpZXMgdG8gYWNjZXNzIGRlc3Ryb3llZCBJbmVydE5vZGUuXG4gICAgICAgICAqL1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX3Rocm93SWZEZXN0cm95ZWQoKSB7XG4gICAgICAgICAgaWYgKHRoaXMuZGVzdHJveWVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RyeWluZyB0byBhY2Nlc3MgZGVzdHJveWVkIEluZXJ0Tm9kZScpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBAcmV0dXJuIHtib29sZWFufSAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ2Vuc3VyZVVudGFiYmFibGUnLFxuXG5cbiAgICAgICAgLyoqIFNhdmUgdGhlIGV4aXN0aW5nIHRhYmluZGV4IHZhbHVlIGFuZCBtYWtlIHRoZSBub2RlIHVudGFiYmFibGUgYW5kIHVuZm9jdXNhYmxlICovXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBlbnN1cmVVbnRhYmJhYmxlKCkge1xuICAgICAgICAgIGlmICh0aGlzLm5vZGUubm9kZVR5cGUgIT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBlbGVtZW50ID0gLyoqIEB0eXBlIHshRWxlbWVudH0gKi90aGlzLm5vZGU7XG4gICAgICAgICAgaWYgKG1hdGNoZXMuY2FsbChlbGVtZW50LCBfZm9jdXNhYmxlRWxlbWVudHNTdHJpbmcpKSB7XG4gICAgICAgICAgICBpZiAoIC8qKiBAdHlwZSB7IUhUTUxFbGVtZW50fSAqL2VsZW1lbnQudGFiSW5kZXggPT09IC0xICYmIHRoaXMuaGFzU2F2ZWRUYWJJbmRleCkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZSgndGFiaW5kZXgnKSkge1xuICAgICAgICAgICAgICB0aGlzLl9zYXZlZFRhYkluZGV4ID0gLyoqIEB0eXBlIHshSFRNTEVsZW1lbnR9ICovZWxlbWVudC50YWJJbmRleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICctMScpO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICAgIGVsZW1lbnQuZm9jdXMgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgICAgICAgdGhpcy5fb3ZlcnJvZGVGb2N1c01ldGhvZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZSgndGFiaW5kZXgnKSkge1xuICAgICAgICAgICAgdGhpcy5fc2F2ZWRUYWJJbmRleCA9IC8qKiBAdHlwZSB7IUhUTUxFbGVtZW50fSAqL2VsZW1lbnQudGFiSW5kZXg7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgndGFiaW5kZXgnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQWRkIGFub3RoZXIgaW5lcnQgcm9vdCB0byB0aGlzIGluZXJ0IG5vZGUncyBzZXQgb2YgbWFuYWdpbmcgaW5lcnQgcm9vdHMuXG4gICAgICAgICAqIEBwYXJhbSB7IUluZXJ0Um9vdH0gaW5lcnRSb290XG4gICAgICAgICAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ2FkZEluZXJ0Um9vdCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBhZGRJbmVydFJvb3QoaW5lcnRSb290KSB7XG4gICAgICAgICAgdGhpcy5fdGhyb3dJZkRlc3Ryb3llZCgpO1xuICAgICAgICAgIHRoaXMuX2luZXJ0Um9vdHMuYWRkKGluZXJ0Um9vdCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlIHRoZSBnaXZlbiBpbmVydCByb290IGZyb20gdGhpcyBpbmVydCBub2RlJ3Mgc2V0IG9mIG1hbmFnaW5nIGluZXJ0IHJvb3RzLlxuICAgICAgICAgKiBJZiB0aGUgc2V0IG9mIG1hbmFnaW5nIGluZXJ0IHJvb3RzIGJlY29tZXMgZW1wdHksIHRoaXMgbm9kZSBpcyBubyBsb25nZXIgaW5lcnQsXG4gICAgICAgICAqIHNvIHRoZSBvYmplY3Qgc2hvdWxkIGJlIGRlc3Ryb3llZC5cbiAgICAgICAgICogQHBhcmFtIHshSW5lcnRSb290fSBpbmVydFJvb3RcbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAncmVtb3ZlSW5lcnRSb290JyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlbW92ZUluZXJ0Um9vdChpbmVydFJvb3QpIHtcbiAgICAgICAgICB0aGlzLl90aHJvd0lmRGVzdHJveWVkKCk7XG4gICAgICAgICAgdGhpcy5faW5lcnRSb290c1snZGVsZXRlJ10oaW5lcnRSb290KTtcbiAgICAgICAgICBpZiAodGhpcy5faW5lcnRSb290cy5zaXplID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLmRlc3RydWN0b3IoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnZGVzdHJveWVkJyxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgcmV0dXJuICgvKiogQHR5cGUgeyFJbmVydE5vZGV9ICovdGhpcy5fZGVzdHJveWVkXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdoYXNTYXZlZFRhYkluZGV4JyxcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX3NhdmVkVGFiSW5kZXggIT09IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvKiogQHJldHVybiB7IU5vZGV9ICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnbm9kZScsXG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgIHRoaXMuX3Rocm93SWZEZXN0cm95ZWQoKTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fbm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBAcGFyYW0gez9udW1iZXJ9IHRhYkluZGV4ICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnc2F2ZWRUYWJJbmRleCcsXG4gICAgICAgIHNldDogZnVuY3Rpb24gc2V0KHRhYkluZGV4KSB7XG4gICAgICAgICAgdGhpcy5fdGhyb3dJZkRlc3Ryb3llZCgpO1xuICAgICAgICAgIHRoaXMuX3NhdmVkVGFiSW5kZXggPSB0YWJJbmRleDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBAcmV0dXJuIHs/bnVtYmVyfSAqL1xuICAgICAgICAsXG4gICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgIHRoaXMuX3Rocm93SWZEZXN0cm95ZWQoKTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fc2F2ZWRUYWJJbmRleDtcbiAgICAgICAgfVxuICAgICAgfV0pO1xuXG4gICAgICByZXR1cm4gSW5lcnROb2RlO1xuICAgIH0oKTtcblxuICAgIC8qKlxuICAgICAqIEluZXJ0TWFuYWdlciBpcyBhIHBlci1kb2N1bWVudCBzaW5nbGV0b24gb2JqZWN0IHdoaWNoIG1hbmFnZXMgYWxsIGluZXJ0IHJvb3RzIGFuZCBub2Rlcy5cbiAgICAgKlxuICAgICAqIFdoZW4gYW4gZWxlbWVudCBiZWNvbWVzIGFuIGluZXJ0IHJvb3QgYnkgaGF2aW5nIGFuIGBpbmVydGAgYXR0cmlidXRlIHNldCBhbmQvb3IgaXRzIGBpbmVydGBcbiAgICAgKiBwcm9wZXJ0eSBzZXQgdG8gYHRydWVgLCB0aGUgYHNldEluZXJ0YCBtZXRob2QgY3JlYXRlcyBhbiBgSW5lcnRSb290YCBvYmplY3QgZm9yIHRoZSBlbGVtZW50LlxuICAgICAqIFRoZSBgSW5lcnRSb290YCBpbiB0dXJuIHJlZ2lzdGVycyBpdHNlbGYgYXMgbWFuYWdpbmcgYWxsIG9mIHRoZSBlbGVtZW50J3MgZm9jdXNhYmxlIGRlc2NlbmRhbnRcbiAgICAgKiBub2RlcyB2aWEgdGhlIGByZWdpc3RlcigpYCBtZXRob2QuIFRoZSBgSW5lcnRNYW5hZ2VyYCBlbnN1cmVzIHRoYXQgYSBzaW5nbGUgYEluZXJ0Tm9kZWAgaW5zdGFuY2VcbiAgICAgKiBpcyBjcmVhdGVkIGZvciBlYWNoIHN1Y2ggbm9kZSwgdmlhIHRoZSBgX21hbmFnZWROb2Rlc2AgbWFwLlxuICAgICAqL1xuXG5cbiAgICB2YXIgSW5lcnRNYW5hZ2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgLyoqXG4gICAgICAgKiBAcGFyYW0geyFEb2N1bWVudH0gZG9jdW1lbnRcbiAgICAgICAqL1xuICAgICAgZnVuY3Rpb24gSW5lcnRNYW5hZ2VyKGRvY3VtZW50KSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBJbmVydE1hbmFnZXIpO1xuXG4gICAgICAgIGlmICghZG9jdW1lbnQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgcmVxdWlyZWQgYXJndW1lbnQ7IEluZXJ0TWFuYWdlciBuZWVkcyB0byB3cmFwIGEgZG9jdW1lbnQuJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvKiogQHR5cGUgeyFEb2N1bWVudH0gKi9cbiAgICAgICAgdGhpcy5fZG9jdW1lbnQgPSBkb2N1bWVudDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQWxsIG1hbmFnZWQgbm9kZXMga25vd24gdG8gdGhpcyBJbmVydE1hbmFnZXIuIEluIGEgbWFwIHRvIGFsbG93IGxvb2tpbmcgdXAgYnkgTm9kZS5cbiAgICAgICAgICogQHR5cGUgeyFNYXA8IU5vZGUsICFJbmVydE5vZGU+fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fbWFuYWdlZE5vZGVzID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBbGwgaW5lcnQgcm9vdHMga25vd24gdG8gdGhpcyBJbmVydE1hbmFnZXIuIEluIGEgbWFwIHRvIGFsbG93IGxvb2tpbmcgdXAgYnkgTm9kZS5cbiAgICAgICAgICogQHR5cGUgeyFNYXA8IU5vZGUsICFJbmVydFJvb3Q+fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5faW5lcnRSb290cyA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogT2JzZXJ2ZXIgZm9yIG11dGF0aW9ucyBvbiBgZG9jdW1lbnQuYm9keWAuXG4gICAgICAgICAqIEB0eXBlIHshTXV0YXRpb25PYnNlcnZlcn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX29ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIodGhpcy5fd2F0Y2hGb3JJbmVydC5iaW5kKHRoaXMpKTtcblxuICAgICAgICAvLyBBZGQgaW5lcnQgc3R5bGUuXG4gICAgICAgIGFkZEluZXJ0U3R5bGUoZG9jdW1lbnQuaGVhZCB8fCBkb2N1bWVudC5ib2R5IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCk7XG5cbiAgICAgICAgLy8gV2FpdCBmb3IgZG9jdW1lbnQgdG8gYmUgbG9hZGVkLlxuICAgICAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2xvYWRpbmcnKSB7XG4gICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIHRoaXMuX29uRG9jdW1lbnRMb2FkZWQuYmluZCh0aGlzKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fb25Eb2N1bWVudExvYWRlZCgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogU2V0IHdoZXRoZXIgdGhlIGdpdmVuIGVsZW1lbnQgc2hvdWxkIGJlIGFuIGluZXJ0IHJvb3Qgb3Igbm90LlxuICAgICAgICogQHBhcmFtIHshRWxlbWVudH0gcm9vdFxuICAgICAgICogQHBhcmFtIHtib29sZWFufSBpbmVydFxuICAgICAgICovXG5cblxuICAgICAgX2NyZWF0ZUNsYXNzKEluZXJ0TWFuYWdlciwgW3tcbiAgICAgICAga2V5OiAnc2V0SW5lcnQnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc2V0SW5lcnQocm9vdCwgaW5lcnQpIHtcbiAgICAgICAgICBpZiAoaW5lcnQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9pbmVydFJvb3RzLmhhcyhyb290KSkge1xuICAgICAgICAgICAgICAvLyBlbGVtZW50IGlzIGFscmVhZHkgaW5lcnRcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgaW5lcnRSb290ID0gbmV3IEluZXJ0Um9vdChyb290LCB0aGlzKTtcbiAgICAgICAgICAgIHJvb3Quc2V0QXR0cmlidXRlKCdpbmVydCcsICcnKTtcbiAgICAgICAgICAgIHRoaXMuX2luZXJ0Um9vdHMuc2V0KHJvb3QsIGluZXJ0Um9vdCk7XG4gICAgICAgICAgICAvLyBJZiBub3QgY29udGFpbmVkIGluIHRoZSBkb2N1bWVudCwgaXQgbXVzdCBiZSBpbiBhIHNoYWRvd1Jvb3QuXG4gICAgICAgICAgICAvLyBFbnN1cmUgaW5lcnQgc3R5bGVzIGFyZSBhZGRlZCB0aGVyZS5cbiAgICAgICAgICAgIGlmICghdGhpcy5fZG9jdW1lbnQuYm9keS5jb250YWlucyhyb290KSkge1xuICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gcm9vdC5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICB3aGlsZSAocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhcmVudC5ub2RlVHlwZSA9PT0gMTEpIHtcbiAgICAgICAgICAgICAgICAgIGFkZEluZXJ0U3R5bGUocGFyZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9pbmVydFJvb3RzLmhhcyhyb290KSkge1xuICAgICAgICAgICAgICAvLyBlbGVtZW50IGlzIGFscmVhZHkgbm9uLWluZXJ0XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIF9pbmVydFJvb3QgPSB0aGlzLl9pbmVydFJvb3RzLmdldChyb290KTtcbiAgICAgICAgICAgIF9pbmVydFJvb3QuZGVzdHJ1Y3RvcigpO1xuICAgICAgICAgICAgdGhpcy5faW5lcnRSb290c1snZGVsZXRlJ10ocm9vdCk7XG4gICAgICAgICAgICByb290LnJlbW92ZUF0dHJpYnV0ZSgnaW5lcnQnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHRoZSBJbmVydFJvb3Qgb2JqZWN0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGdpdmVuIGluZXJ0IHJvb3QgZWxlbWVudCwgaWYgYW55LlxuICAgICAgICAgKiBAcGFyYW0geyFOb2RlfSBlbGVtZW50XG4gICAgICAgICAqIEByZXR1cm4geyFJbmVydFJvb3R8dW5kZWZpbmVkfVxuICAgICAgICAgKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdnZXRJbmVydFJvb3QnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0SW5lcnRSb290KGVsZW1lbnQpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5faW5lcnRSb290cy5nZXQoZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVnaXN0ZXIgdGhlIGdpdmVuIEluZXJ0Um9vdCBhcyBtYW5hZ2luZyB0aGUgZ2l2ZW4gbm9kZS5cbiAgICAgICAgICogSW4gdGhlIGNhc2Ugd2hlcmUgdGhlIG5vZGUgaGFzIGEgcHJldmlvdXNseSBleGlzdGluZyBpbmVydCByb290LCB0aGlzIGluZXJ0IHJvb3Qgd2lsbFxuICAgICAgICAgKiBiZSBhZGRlZCB0byBpdHMgc2V0IG9mIGluZXJ0IHJvb3RzLlxuICAgICAgICAgKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gICAgICAgICAqIEBwYXJhbSB7IUluZXJ0Um9vdH0gaW5lcnRSb290XG4gICAgICAgICAqIEByZXR1cm4geyFJbmVydE5vZGV9IGluZXJ0Tm9kZVxuICAgICAgICAgKi9cblxuICAgICAgfSwge1xuICAgICAgICBrZXk6ICdyZWdpc3RlcicsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZWdpc3Rlcihub2RlLCBpbmVydFJvb3QpIHtcbiAgICAgICAgICB2YXIgaW5lcnROb2RlID0gdGhpcy5fbWFuYWdlZE5vZGVzLmdldChub2RlKTtcbiAgICAgICAgICBpZiAoaW5lcnROb2RlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vIG5vZGUgd2FzIGFscmVhZHkgaW4gYW4gaW5lcnQgc3VidHJlZVxuICAgICAgICAgICAgaW5lcnROb2RlLmFkZEluZXJ0Um9vdChpbmVydFJvb3QpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbmVydE5vZGUgPSBuZXcgSW5lcnROb2RlKG5vZGUsIGluZXJ0Um9vdCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5fbWFuYWdlZE5vZGVzLnNldChub2RlLCBpbmVydE5vZGUpO1xuXG4gICAgICAgICAgcmV0dXJuIGluZXJ0Tm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZS1yZWdpc3RlciB0aGUgZ2l2ZW4gSW5lcnRSb290IGFzIG1hbmFnaW5nIHRoZSBnaXZlbiBpbmVydCBub2RlLlxuICAgICAgICAgKiBSZW1vdmVzIHRoZSBpbmVydCByb290IGZyb20gdGhlIEluZXJ0Tm9kZSdzIHNldCBvZiBtYW5hZ2luZyBpbmVydCByb290cywgYW5kIHJlbW92ZSB0aGUgaW5lcnRcbiAgICAgICAgICogbm9kZSBmcm9tIHRoZSBJbmVydE1hbmFnZXIncyBzZXQgb2YgbWFuYWdlZCBub2RlcyBpZiBpdCBpcyBkZXN0cm95ZWQuXG4gICAgICAgICAqIElmIHRoZSBub2RlIGlzIG5vdCBjdXJyZW50bHkgbWFuYWdlZCwgdGhpcyBpcyBlc3NlbnRpYWxseSBhIG5vLW9wLlxuICAgICAgICAgKiBAcGFyYW0geyFOb2RlfSBub2RlXG4gICAgICAgICAqIEBwYXJhbSB7IUluZXJ0Um9vdH0gaW5lcnRSb290XG4gICAgICAgICAqIEByZXR1cm4gez9JbmVydE5vZGV9IFRoZSBwb3RlbnRpYWxseSBkZXN0cm95ZWQgSW5lcnROb2RlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIG5vZGUsIGlmIGFueS5cbiAgICAgICAgICovXG5cbiAgICAgIH0sIHtcbiAgICAgICAga2V5OiAnZGVyZWdpc3RlcicsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBkZXJlZ2lzdGVyKG5vZGUsIGluZXJ0Um9vdCkge1xuICAgICAgICAgIHZhciBpbmVydE5vZGUgPSB0aGlzLl9tYW5hZ2VkTm9kZXMuZ2V0KG5vZGUpO1xuICAgICAgICAgIGlmICghaW5lcnROb2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpbmVydE5vZGUucmVtb3ZlSW5lcnRSb290KGluZXJ0Um9vdCk7XG4gICAgICAgICAgaWYgKGluZXJ0Tm9kZS5kZXN0cm95ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX21hbmFnZWROb2Rlc1snZGVsZXRlJ10obm9kZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGluZXJ0Tm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsYmFjayB1c2VkIHdoZW4gZG9jdW1lbnQgaGFzIGZpbmlzaGVkIGxvYWRpbmcuXG4gICAgICAgICAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ19vbkRvY3VtZW50TG9hZGVkJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9vbkRvY3VtZW50TG9hZGVkKCkge1xuICAgICAgICAgIC8vIEZpbmQgYWxsIGluZXJ0IHJvb3RzIGluIGRvY3VtZW50IGFuZCBtYWtlIHRoZW0gYWN0dWFsbHkgaW5lcnQuXG4gICAgICAgICAgdmFyIGluZXJ0RWxlbWVudHMgPSBzbGljZS5jYWxsKHRoaXMuX2RvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tpbmVydF0nKSk7XG4gICAgICAgICAgaW5lcnRFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChpbmVydEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0SW5lcnQoaW5lcnRFbGVtZW50LCB0cnVlKTtcbiAgICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICAgIC8vIENvbW1lbnQgdGhpcyBvdXQgdG8gdXNlIHByb2dyYW1tYXRpYyBBUEkgb25seS5cbiAgICAgICAgICB0aGlzLl9vYnNlcnZlci5vYnNlcnZlKHRoaXMuX2RvY3VtZW50LmJvZHkgfHwgdGhpcy5fZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCB7IGF0dHJpYnV0ZXM6IHRydWUsIHN1YnRyZWU6IHRydWUsIGNoaWxkTGlzdDogdHJ1ZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsYmFjayB1c2VkIHdoZW4gbXV0YXRpb24gb2JzZXJ2ZXIgZGV0ZWN0cyBhdHRyaWJ1dGUgY2hhbmdlcy5cbiAgICAgICAgICogQHBhcmFtIHshQXJyYXk8IU11dGF0aW9uUmVjb3JkPn0gcmVjb3Jkc1xuICAgICAgICAgKiBAcGFyYW0geyFNdXRhdGlvbk9ic2VydmVyfSBzZWxmXG4gICAgICAgICAqL1xuXG4gICAgICB9LCB7XG4gICAgICAgIGtleTogJ193YXRjaEZvckluZXJ0JyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF93YXRjaEZvckluZXJ0KHJlY29yZHMsIHNlbGYpIHtcbiAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgIHJlY29yZHMuZm9yRWFjaChmdW5jdGlvbiAocmVjb3JkKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHJlY29yZC50eXBlKSB7XG4gICAgICAgICAgICAgIGNhc2UgJ2NoaWxkTGlzdCc6XG4gICAgICAgICAgICAgICAgc2xpY2UuY2FsbChyZWNvcmQuYWRkZWROb2RlcykuZm9yRWFjaChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgIT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIHZhciBpbmVydEVsZW1lbnRzID0gc2xpY2UuY2FsbChub2RlLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tpbmVydF0nKSk7XG4gICAgICAgICAgICAgICAgICBpZiAobWF0Y2hlcy5jYWxsKG5vZGUsICdbaW5lcnRdJykpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5lcnRFbGVtZW50cy51bnNoaWZ0KG5vZGUpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaW5lcnRFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChpbmVydEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRJbmVydChpbmVydEVsZW1lbnQsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgfSwgX3RoaXMpO1xuICAgICAgICAgICAgICAgIH0sIF90aGlzKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSAnYXR0cmlidXRlcyc6XG4gICAgICAgICAgICAgICAgaWYgKHJlY29yZC5hdHRyaWJ1dGVOYW1lICE9PSAnaW5lcnQnKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciB0YXJnZXQgPSAvKiogQHR5cGUgeyFFbGVtZW50fSAqL3JlY29yZC50YXJnZXQ7XG4gICAgICAgICAgICAgICAgdmFyIGluZXJ0ID0gdGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnaW5lcnQnKTtcbiAgICAgICAgICAgICAgICBfdGhpcy5zZXRJbmVydCh0YXJnZXQsIGluZXJ0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfV0pO1xuXG4gICAgICByZXR1cm4gSW5lcnRNYW5hZ2VyO1xuICAgIH0oKTtcblxuICAgIC8qKlxuICAgICAqIFJlY3Vyc2l2ZWx5IHdhbGsgdGhlIGNvbXBvc2VkIHRyZWUgZnJvbSB8bm9kZXwuXG4gICAgICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICAgICAqIEBwYXJhbSB7KGZ1bmN0aW9uICghRWxlbWVudCkpPX0gY2FsbGJhY2sgQ2FsbGJhY2sgdG8gYmUgY2FsbGVkIGZvciBlYWNoIGVsZW1lbnQgdHJhdmVyc2VkLFxuICAgICAqICAgICBiZWZvcmUgZGVzY2VuZGluZyBpbnRvIGNoaWxkIG5vZGVzLlxuICAgICAqIEBwYXJhbSB7P1NoYWRvd1Jvb3Q9fSBzaGFkb3dSb290QW5jZXN0b3IgVGhlIG5lYXJlc3QgU2hhZG93Um9vdCBhbmNlc3RvciwgaWYgYW55LlxuICAgICAqL1xuXG5cbiAgICBmdW5jdGlvbiBjb21wb3NlZFRyZWVXYWxrKG5vZGUsIGNhbGxiYWNrLCBzaGFkb3dSb290QW5jZXN0b3IpIHtcbiAgICAgIGlmIChub2RlLm5vZGVUeXBlID09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0gLyoqIEB0eXBlIHshRWxlbWVudH0gKi9ub2RlO1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICBjYWxsYmFjayhlbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERlc2NlbmQgaW50byBub2RlOlxuICAgICAgICAvLyBJZiBpdCBoYXMgYSBTaGFkb3dSb290LCBpZ25vcmUgYWxsIGNoaWxkIGVsZW1lbnRzIC0gdGhlc2Ugd2lsbCBiZSBwaWNrZWRcbiAgICAgICAgLy8gdXAgYnkgdGhlIDxjb250ZW50PiBvciA8c2hhZG93PiBlbGVtZW50cy4gRGVzY2VuZCBzdHJhaWdodCBpbnRvIHRoZVxuICAgICAgICAvLyBTaGFkb3dSb290LlxuICAgICAgICB2YXIgc2hhZG93Um9vdCA9IC8qKiBAdHlwZSB7IUhUTUxFbGVtZW50fSAqL2VsZW1lbnQuc2hhZG93Um9vdDtcbiAgICAgICAgaWYgKHNoYWRvd1Jvb3QpIHtcbiAgICAgICAgICBjb21wb3NlZFRyZWVXYWxrKHNoYWRvd1Jvb3QsIGNhbGxiYWNrLCBzaGFkb3dSb290KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBpdCBpcyBhIDxjb250ZW50PiBlbGVtZW50LCBkZXNjZW5kIGludG8gZGlzdHJpYnV0ZWQgZWxlbWVudHMgLSB0aGVzZVxuICAgICAgICAvLyBhcmUgZWxlbWVudHMgZnJvbSBvdXRzaWRlIHRoZSBzaGFkb3cgcm9vdCB3aGljaCBhcmUgcmVuZGVyZWQgaW5zaWRlIHRoZVxuICAgICAgICAvLyBzaGFkb3cgRE9NLlxuICAgICAgICBpZiAoZWxlbWVudC5sb2NhbE5hbWUgPT0gJ2NvbnRlbnQnKSB7XG4gICAgICAgICAgdmFyIGNvbnRlbnQgPSAvKiogQHR5cGUgeyFIVE1MQ29udGVudEVsZW1lbnR9ICovZWxlbWVudDtcbiAgICAgICAgICAvLyBWZXJpZmllcyBpZiBTaGFkb3dEb20gdjAgaXMgc3VwcG9ydGVkLlxuICAgICAgICAgIHZhciBkaXN0cmlidXRlZE5vZGVzID0gY29udGVudC5nZXREaXN0cmlidXRlZE5vZGVzID8gY29udGVudC5nZXREaXN0cmlidXRlZE5vZGVzKCkgOiBbXTtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRpc3RyaWJ1dGVkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbXBvc2VkVHJlZVdhbGsoZGlzdHJpYnV0ZWROb2Rlc1tpXSwgY2FsbGJhY2ssIHNoYWRvd1Jvb3RBbmNlc3Rvcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGl0IGlzIGEgPHNsb3Q+IGVsZW1lbnQsIGRlc2NlbmQgaW50byBhc3NpZ25lZCBub2RlcyAtIHRoZXNlXG4gICAgICAgIC8vIGFyZSBlbGVtZW50cyBmcm9tIG91dHNpZGUgdGhlIHNoYWRvdyByb290IHdoaWNoIGFyZSByZW5kZXJlZCBpbnNpZGUgdGhlXG4gICAgICAgIC8vIHNoYWRvdyBET00uXG4gICAgICAgIGlmIChlbGVtZW50LmxvY2FsTmFtZSA9PSAnc2xvdCcpIHtcbiAgICAgICAgICB2YXIgc2xvdCA9IC8qKiBAdHlwZSB7IUhUTUxTbG90RWxlbWVudH0gKi9lbGVtZW50O1xuICAgICAgICAgIC8vIFZlcmlmeSBpZiBTaGFkb3dEb20gdjEgaXMgc3VwcG9ydGVkLlxuICAgICAgICAgIHZhciBfZGlzdHJpYnV0ZWROb2RlcyA9IHNsb3QuYXNzaWduZWROb2RlcyA/IHNsb3QuYXNzaWduZWROb2Rlcyh7IGZsYXR0ZW46IHRydWUgfSkgOiBbXTtcbiAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgX2Rpc3RyaWJ1dGVkTm9kZXMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBjb21wb3NlZFRyZWVXYWxrKF9kaXN0cmlidXRlZE5vZGVzW19pXSwgY2FsbGJhY2ssIHNoYWRvd1Jvb3RBbmNlc3Rvcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBpdCBpcyBuZWl0aGVyIHRoZSBwYXJlbnQgb2YgYSBTaGFkb3dSb290LCBhIDxjb250ZW50PiBlbGVtZW50LCBhIDxzbG90PlxuICAgICAgLy8gZWxlbWVudCwgbm9yIGEgPHNoYWRvdz4gZWxlbWVudCByZWN1cnNlIG5vcm1hbGx5LlxuICAgICAgdmFyIGNoaWxkID0gbm9kZS5maXJzdENoaWxkO1xuICAgICAgd2hpbGUgKGNoaWxkICE9IG51bGwpIHtcbiAgICAgICAgY29tcG9zZWRUcmVlV2FsayhjaGlsZCwgY2FsbGJhY2ssIHNoYWRvd1Jvb3RBbmNlc3Rvcik7XG4gICAgICAgIGNoaWxkID0gY2hpbGQubmV4dFNpYmxpbmc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIHN0eWxlIGVsZW1lbnQgdG8gdGhlIG5vZGUgY29udGFpbmluZyB0aGUgaW5lcnQgc3BlY2lmaWMgc3R5bGVzXG4gICAgICogQHBhcmFtIHshTm9kZX0gbm9kZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGFkZEluZXJ0U3R5bGUobm9kZSkge1xuICAgICAgaWYgKG5vZGUucXVlcnlTZWxlY3Rvcignc3R5bGUjaW5lcnQtc3R5bGUsIGxpbmsjaW5lcnQtc3R5bGUnKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgICAgc3R5bGUuc2V0QXR0cmlidXRlKCdpZCcsICdpbmVydC1zdHlsZScpO1xuICAgICAgc3R5bGUudGV4dENvbnRlbnQgPSAnXFxuJyArICdbaW5lcnRdIHtcXG4nICsgJyAgcG9pbnRlci1ldmVudHM6IG5vbmU7XFxuJyArICcgIGN1cnNvcjogZGVmYXVsdDtcXG4nICsgJ31cXG4nICsgJ1xcbicgKyAnW2luZXJ0XSwgW2luZXJ0XSAqIHtcXG4nICsgJyAgLXdlYmtpdC11c2VyLXNlbGVjdDogbm9uZTtcXG4nICsgJyAgLW1vei11c2VyLXNlbGVjdDogbm9uZTtcXG4nICsgJyAgLW1zLXVzZXItc2VsZWN0OiBub25lO1xcbicgKyAnICB1c2VyLXNlbGVjdDogbm9uZTtcXG4nICsgJ31cXG4nO1xuICAgICAgbm9kZS5hcHBlbmRDaGlsZChzdHlsZSk7XG4gICAgfVxuXG4gICAgaWYgKCFFbGVtZW50LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSgnaW5lcnQnKSkge1xuICAgICAgLyoqIEB0eXBlIHshSW5lcnRNYW5hZ2VyfSAqL1xuICAgICAgdmFyIGluZXJ0TWFuYWdlciA9IG5ldyBJbmVydE1hbmFnZXIoZG9jdW1lbnQpO1xuXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRWxlbWVudC5wcm90b3R5cGUsICdpbmVydCcsIHtcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgLyoqIEB0aGlzIHshRWxlbWVudH0gKi9cbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaGFzQXR0cmlidXRlKCdpbmVydCcpO1xuICAgICAgICB9LFxuICAgICAgICAvKiogQHRoaXMgeyFFbGVtZW50fSAqL1xuICAgICAgICBzZXQ6IGZ1bmN0aW9uIHNldChpbmVydCkge1xuICAgICAgICAgIGluZXJ0TWFuYWdlci5zZXRJbmVydCh0aGlzLCBpbmVydCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSkoKTtcblxufSkpKTtcbiIsImltcG9ydCBmaXhCYWNrZmFjZSBmcm9tICcuL2ZpeC1iYWNrZmFjZS5qcydcbmltcG9ydCBcIndpY2ctaW5lcnRcIjtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERyYXdlciB7XG4gIHB1YmxpYyBkcmF3ZXJFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGxcbiAgcHVibGljIHN3aXRjaEVsZW1lbnRzPzogTm9kZUxpc3RPZjxIVE1MRWxlbWVudD4gfCBudWxsXG4gIHB1YmxpYyBpbmVydEVsZW1lbnRzPzogTm9kZUxpc3RPZjxIVE1MRWxlbWVudD4gfCBudWxsXG4gIHB1YmxpYyBpc0V4cGFuZGVkOiBib29sZWFuID0gZmFsc2VcbiAgcHVibGljIGVuYWJsZUZpeEJhY2tmYWNlOmJvb2xlYW4gPSB0cnVlXG4gIHB1YmxpYyBlbmFibGVIaXN0b3J5OiBib29sZWFuID0gZmFsc2VcbiAgcHVibGljIGlkOiBzdHJpbmcgPSAnRHJhd2VyLScgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKVxuXG4gIGNvbnN0cnVjdG9yKGFyZ3M6IHtcbiAgICBkcmF3ZXI6IHN0cmluZ1xuICAgIHN3aXRjaD86IHN0cmluZ1xuICAgIGluZXJ0Pzogc3RyaW5nXG4gICAgZW5hYmxlRml4QmFja2ZhY2U/OiBib29sZWFuXG4gICAgZW5hYmxlSGlzdG9yeT86IGJvb2xlYW5cbiAgfSkge1xuICAgIC8vIERyYXdlciBib2R5XG4gICAgaWYgKHR5cGVvZiBhcmdzICE9PSAnb2JqZWN0JyB8fCBhcmdzLmRyYXdlciA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTogVGhlIFwiZHJhd2VyXCIgcGFyYW1ldGVyIGlzIHJlcXVpcmVkLiA9PiBleDogbmV3IERyYXdlcih7IGRyYXdlcjogJyNkcmF3ZXInIH0pYClcbiAgICBpZiAodHlwZW9mIGFyZ3MuZHJhd2VyICE9PSAnc3RyaW5nJyB8fCAnJyApIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OiBUaGUgXCJkcmF3ZXJcIiBwYXJhbWV0ZXIgbXVzdCBiZSBcInN0cmluZ1wiIHR5cGUgYW5kIFwiQ1NTIHNlbGVjdG9yXCIuYClcbiAgICBpZiAoYXJncy5kcmF3ZXIgPT09ICcnICkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06IFRoZSBcImRyYXdlclwiIHBhcmFtZXRlciBpcyBlbXB0eS5gKVxuICAgIHRoaXMuZHJhd2VyRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYXJncy5kcmF3ZXIpXG4gICAgaWYgKCF0aGlzLmRyYXdlckVsZW1lbnQpIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OiBUaGUgRWxlbWVudCBmb3IgXCJkcmF3ZXJcIiBpcyBub3QgZm91bmQuYClcbiAgICB0aGlzLmRyYXdlckVsZW1lbnQuc2V0QXR0cmlidXRlKCdkYXRhLWRyYXdlci1pcy1pbml0aWFsaXplZCcsICd0cnVlJylcbiAgICBpZiAodGhpcy5kcmF3ZXJFbGVtZW50LmlkKSB7XG4gICAgICB0aGlzLmlkID0gdGhpcy5kcmF3ZXJFbGVtZW50LmlkXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudC5pZCA9IHRoaXMuaWRcbiAgICB9XG4gICAgaWYgKHRoaXMuaXNFeHBhbmRlZCkge1xuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnaW5lcnQnKVxuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnaGlkZGVuJylcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50LnNldEF0dHJpYnV0ZSgnaW5lcnQnLCAnJylcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2hpZGRlbicsICcnKVxuICAgIH1cblxuICAgIC8vIFN3aXRjaGVzIGZvciB0b2dnbGVcbiAgICB0aGlzLnN3aXRjaEVsZW1lbnRzID0gdHlwZW9mIGFyZ3Muc3dpdGNoID09PSAnc3RyaW5nJyA/XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGFyZ3Muc3dpdGNoKSA6IG51bGxcbiAgICBpZiAodGhpcy5zd2l0Y2hFbGVtZW50cykge1xuICAgICAgdGhpcy5zd2l0Y2hFbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy50b2dnbGUuYmluZCh0aGlzKSlcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtZHJhd2VyLWlzJywgJ2luaXRpYWxpemVkJylcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnLCB0aGlzLmlkKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyBFbGVtZW50cyB0aGF0IGFyZSBzZXQgXCJpbmVydFwiIGF0dHJpYnV0ZSB3aGVuIHRoZSBkcmF3ZXIgaXMgZXhwYW5kZWRcbiAgICB0aGlzLmluZXJ0RWxlbWVudHMgPSB0eXBlb2YgYXJncy5pbmVydCA9PT0gJ3N0cmluZycgP1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChhcmdzLmluZXJ0KSA6IG51bGxcbiAgICBpZiAodGhpcy5pbmVydEVsZW1lbnRzKSB7XG4gICAgICB0aGlzLmluZXJ0RWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtZHJhd2VyLWlzJywgJ2luaXRpYWxpemVkJylcbiAgICAgICAgaWYgKHRoaXMuaXNFeHBhbmRlZCkge1xuICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdpbmVydCcsICcnKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gUHJldmVudGluZyBzY3JvbGwgd2hlbiB0aGUgZHJhd2VyIGlzIGV4cGFuZGVkXG4gICAgdGhpcy5lbmFibGVGaXhCYWNrZmFjZSA9IGFyZ3MuZW5hYmxlRml4QmFja2ZhY2UgPz8gdHJ1ZVxuXG4gICAgLy8gQWRkaW5nIHRoZSBzdGF0ZSBvZiB0aGUgZHJhd2VyIHRvIHRoZSBoaXN0b3J5IG9mIHlvdXIgYnJvd3NlclxuICAgIGlmIChhcmdzLmVuYWJsZUhpc3RvcnkpIHtcbiAgICAgIHRoaXMuZW5hYmxlSGlzdG9yeSA9IHRydWVcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIHRoaXMuX3BvcHN0YXRlSGFuZGxlci5iaW5kKHRoaXMpKVxuICAgIH1cblxuICB9XG4gIHRvZ2dsZShldmVudDogRXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgaWYgKHRoaXMuaXNFeHBhbmRlZCkge1xuICAgICAgdGhpcy5jbG9zZSgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMub3BlbigpXG4gICAgfVxuICB9XG4gIG9wZW4oKSB7XG4gICAgdGhpcy5fY2hhbmdlU3RhdGUodHJ1ZSlcbiAgICBpZiAodGhpcy5lbmFibGVIaXN0b3J5KSB0aGlzLl9wdXNoU3RhdGUodHJ1ZSlcbiAgfVxuICBjbG9zZSgpIHtcbiAgICB0aGlzLl9jaGFuZ2VTdGF0ZShmYWxzZSlcbiAgICBpZiAodGhpcy5lbmFibGVIaXN0b3J5KSB0aGlzLl9wdXNoU3RhdGUoZmFsc2UpXG4gIH1cbiAgcHJpdmF0ZSBfY2hhbmdlU3RhdGUoaXNFeHBhbmRlZDogYm9vbGVhbikge1xuICAgIGlmIChpc0V4cGFuZGVkKSB7XG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQ/LnJlbW92ZUF0dHJpYnV0ZSgnaW5lcnQnKVxuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50Py5yZW1vdmVBdHRyaWJ1dGUoJ2hpZGRlbicpXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX2tleXVwSGFuZGxlci5iaW5kKHRoaXMpKVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFdoZW4gdGhlIGRyYXdlciBpcyBoaWRkZW5cbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudD8uc2V0QXR0cmlidXRlKCdpbmVydCcsICcnKVxuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50Py5zZXRBdHRyaWJ1dGUoJ2hpZGRlbicsICcnKVxuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9rZXl1cEhhbmRsZXIuYmluZCh0aGlzKSlcbiAgICB9XG5cbiAgICBpZiAoIHR5cGVvZiBmaXhCYWNrZmFjZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0aGlzLmVuYWJsZUZpeEJhY2tmYWNlICkgZml4QmFja2ZhY2UoaXNFeHBhbmRlZClcblxuICAgIGlmICh0aGlzLnN3aXRjaEVsZW1lbnRzKSB7XG4gICAgICB0aGlzLnN3aXRjaEVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgU3RyaW5nKGlzRXhwYW5kZWQpKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbmVydEVsZW1lbnRzKSB7XG4gICAgICB0aGlzLmluZXJ0RWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgaWYgKGlzRXhwYW5kZWQpIHtcbiAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnaW5lcnQnLCAnJylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnaW5lcnQnKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIHRoaXMuaXNFeHBhbmRlZCA9IGlzRXhwYW5kZWRcbiAgfVxuICBwcml2YXRlIF9rZXl1cEhhbmRsZXIoZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBpZiAoZXZlbnQua2V5ID09PSAnRXNjYXBlJyB8fCBldmVudC5rZXkgPT09ICdFc2MnKSB0aGlzLmNsb3NlKClcbiAgfVxuICBwcml2YXRlIF9wb3BzdGF0ZUhhbmRsZXIoZXZlbnQ6IFBvcFN0YXRlRXZlbnQpIHtcbiAgICB0aGlzLl9jaGFuZ2VTdGF0ZSghdGhpcy5pc0V4cGFuZGVkKTtcbiAgfVxuICBwcml2YXRlIF9wdXNoU3RhdGUoaXNFeHBhbmRlZDogYm9vbGVhbikge1xuICAgIGhpc3RvcnkucHVzaFN0YXRlKHtcbiAgICAgIGlzRXhwYW5kZWQ6IGlzRXhwYW5kZWRcbiAgICB9LCAnZHJhd2VyU3RhdGUnKVxuICB9XG59Il0sIm5hbWVzIjpbInN0eWxlRm9yRml4ZWQiLCJoZWlnaHQiLCJsZWZ0Iiwib3ZlcmZsb3ciLCJwb3NpdGlvbiIsIndpZHRoIiwic2Nyb2xsaW5nRWxlbWVudCIsInVhIiwid2luZG93IiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwidG9Mb3dlckNhc2UiLCJkb2N1bWVudCIsImluZGV4T2YiLCJib2R5IiwiZG9jdW1lbnRFbGVtZW50IiwiZml4QmFja2ZhY2UiLCJmaXhlZCIsInNjcm9sbFkiLCJzY3JvbGxUb3AiLCJwYXJzZUludCIsInN0eWxlIiwidG9wIiwic2Nyb2xsYmFyV2lkdGgiLCJpbm5lcldpZHRoIiwiY2xpZW50V2lkdGgiLCJwYWRkaW5nUmlnaHQiLCJPYmplY3QiLCJrZXlzIiwiZm9yRWFjaCIsImtleSIsInNldFByb3BlcnR5IiwicmVtb3ZlUHJvcGVydHkiLCJnbG9iYWwiLCJmYWN0b3J5IiwiZXhwb3J0cyIsIm1vZHVsZSIsImRlZmluZSIsImFtZCIsInRoaXMiLCJfY3JlYXRlQ2xhc3MiLCJkZWZpbmVQcm9wZXJ0aWVzIiwidGFyZ2V0IiwicHJvcHMiLCJpIiwibGVuZ3RoIiwiZGVzY3JpcHRvciIsImVudW1lcmFibGUiLCJjb25maWd1cmFibGUiLCJ3cml0YWJsZSIsImRlZmluZVByb3BlcnR5IiwiQ29uc3RydWN0b3IiLCJwcm90b1Byb3BzIiwic3RhdGljUHJvcHMiLCJwcm90b3R5cGUiLCJfY2xhc3NDYWxsQ2hlY2siLCJpbnN0YW5jZSIsIlR5cGVFcnJvciIsInNsaWNlIiwiQXJyYXkiLCJtYXRjaGVzIiwiRWxlbWVudCIsIm1zTWF0Y2hlc1NlbGVjdG9yIiwiX2ZvY3VzYWJsZUVsZW1lbnRzU3RyaW5nIiwiam9pbiIsIkluZXJ0Um9vdCIsInJvb3RFbGVtZW50IiwiaW5lcnRNYW5hZ2VyIiwiX2luZXJ0TWFuYWdlciIsIl9yb290RWxlbWVudCIsIl9tYW5hZ2VkTm9kZXMiLCJTZXQiLCJoYXNBdHRyaWJ1dGUiLCJfc2F2ZWRBcmlhSGlkZGVuIiwiZ2V0QXR0cmlidXRlIiwic2V0QXR0cmlidXRlIiwiX21ha2VTdWJ0cmVlVW5mb2N1c2FibGUiLCJfb2JzZXJ2ZXIiLCJNdXRhdGlvbk9ic2VydmVyIiwiX29uTXV0YXRpb24iLCJiaW5kIiwib2JzZXJ2ZSIsImF0dHJpYnV0ZXMiLCJjaGlsZExpc3QiLCJzdWJ0cmVlIiwidmFsdWUiLCJkZXN0cnVjdG9yIiwiZGlzY29ubmVjdCIsInJlbW92ZUF0dHJpYnV0ZSIsImluZXJ0Tm9kZSIsIl91bm1hbmFnZU5vZGUiLCJub2RlIiwic3RhcnROb2RlIiwiX3RoaXMyIiwiY29tcG9zZWRUcmVlV2FsayIsIl92aXNpdE5vZGUiLCJhY3RpdmVFbGVtZW50IiwiY29udGFpbnMiLCJyb290IiwidW5kZWZpbmVkIiwibm9kZVR5cGUiLCJOb2RlIiwiRE9DVU1FTlRfRlJBR01FTlRfTk9ERSIsInBhcmVudE5vZGUiLCJibHVyIiwiZm9jdXMiLCJFTEVNRU5UX05PREUiLCJlbGVtZW50IiwiX2Fkb3B0SW5lcnRSb290IiwiY2FsbCIsIl9tYW5hZ2VOb2RlIiwicmVnaXN0ZXIiLCJhZGQiLCJkZXJlZ2lzdGVyIiwiX3VubWFuYWdlU3VidHJlZSIsIl90aGlzMyIsImluZXJ0U3Vicm9vdCIsImdldEluZXJ0Um9vdCIsInNldEluZXJ0IiwibWFuYWdlZE5vZGVzIiwic2F2ZWRJbmVydE5vZGUiLCJyZWNvcmRzIiwic2VsZiIsInJlY29yZCIsInR5cGUiLCJhZGRlZE5vZGVzIiwicmVtb3ZlZE5vZGVzIiwiYXR0cmlidXRlTmFtZSIsIm1hbmFnZWROb2RlIiwiZ2V0Iiwic2V0IiwiYXJpYUhpZGRlbiIsIkluZXJ0Tm9kZSIsImluZXJ0Um9vdCIsIl9ub2RlIiwiX292ZXJyb2RlRm9jdXNNZXRob2QiLCJfaW5lcnRSb290cyIsIl9zYXZlZFRhYkluZGV4IiwiX2Rlc3Ryb3llZCIsImVuc3VyZVVudGFiYmFibGUiLCJfdGhyb3dJZkRlc3Ryb3llZCIsImRlc3Ryb3llZCIsIkVycm9yIiwidGFiSW5kZXgiLCJoYXNTYXZlZFRhYkluZGV4IiwiYWRkSW5lcnRSb290IiwicmVtb3ZlSW5lcnRSb290Iiwic2l6ZSIsIkluZXJ0TWFuYWdlciIsIl9kb2N1bWVudCIsIk1hcCIsIl93YXRjaEZvckluZXJ0IiwiYWRkSW5lcnRTdHlsZSIsImhlYWQiLCJyZWFkeVN0YXRlIiwiYWRkRXZlbnRMaXN0ZW5lciIsIl9vbkRvY3VtZW50TG9hZGVkIiwiaW5lcnQiLCJoYXMiLCJwYXJlbnQiLCJfaW5lcnRSb290IiwiaW5lcnRFbGVtZW50cyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJpbmVydEVsZW1lbnQiLCJfdGhpcyIsInVuc2hpZnQiLCJjYWxsYmFjayIsInNoYWRvd1Jvb3RBbmNlc3RvciIsInNoYWRvd1Jvb3QiLCJsb2NhbE5hbWUiLCJjb250ZW50IiwiZGlzdHJpYnV0ZWROb2RlcyIsImdldERpc3RyaWJ1dGVkTm9kZXMiLCJzbG90IiwiX2Rpc3RyaWJ1dGVkTm9kZXMiLCJhc3NpZ25lZE5vZGVzIiwiZmxhdHRlbiIsIl9pIiwiY2hpbGQiLCJmaXJzdENoaWxkIiwibmV4dFNpYmxpbmciLCJxdWVyeVNlbGVjdG9yIiwiY3JlYXRlRWxlbWVudCIsInRleHRDb250ZW50IiwiYXBwZW5kQ2hpbGQiLCJoYXNPd25Qcm9wZXJ0eSIsIkRyYXdlciIsImNvbnN0cnVjdG9yIiwiYXJncyIsIkRhdGUiLCJnZXRUaW1lIiwiZHJhd2VyIiwibmFtZSIsImRyYXdlckVsZW1lbnQiLCJpZCIsImlzRXhwYW5kZWQiLCJzd2l0Y2hFbGVtZW50cyIsInN3aXRjaCIsInRvZ2dsZSIsImVuYWJsZUZpeEJhY2tmYWNlIiwiZW5hYmxlSGlzdG9yeSIsIl9wb3BzdGF0ZUhhbmRsZXIiLCJldmVudCIsInByZXZlbnREZWZhdWx0IiwiY2xvc2UiLCJvcGVuIiwiX2NoYW5nZVN0YXRlIiwiX3B1c2hTdGF0ZSIsIl9rZXl1cEhhbmRsZXIiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiU3RyaW5nIiwiaGlzdG9yeSIs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
