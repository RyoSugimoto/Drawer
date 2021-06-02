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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhd2VyLmpzIiwic291cmNlcyI6WyIuLi9zcmMvdHMvZml4LWJhY2tmYWNlLnRzIiwiLi4vc3JjL3RzL2RyYXdlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBzdHlsZUZvckZpeGVkOiB7XG4gIFtrZXk6IHN0cmluZ106IHN0cmluZ1xufSA9IHtcbiAgaGVpZ2h0OiAnMTAwdmgnLFxuICBsZWZ0OiAnMCcsXG4gIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgcG9zaXRpb246ICdmaXhlZCcsXG4gIHdpZHRoOiAnMTAwdncnLFxufVxuXG5jb25zdCBzY3JvbGxpbmdFbGVtZW50OiBFbGVtZW50ID0gKCgpID0+IHtcbiAgY29uc3QgdWEgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpXG4gIGlmICgnc2Nyb2xsaW5nRWxlbWVudCcgaW4gZG9jdW1lbnQpIHJldHVybiBkb2N1bWVudC5zY3JvbGxpbmdFbGVtZW50IVxuICBpZiAodWEuaW5kZXhPZignd2Via2l0JykgPiAwKSByZXR1cm4gZG9jdW1lbnQuYm9keSFcbiAgcmV0dXJuIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCFcbn0pKCkhXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGZpeEJhY2tmYWNlKGZpeGVkOiBib29sZWFuKSB7XG4gIGNvbnN0IHNjcm9sbFk6bnVtYmVyID0gZml4ZWQgPyBzY3JvbGxpbmdFbGVtZW50LnNjcm9sbFRvcCA6IHBhcnNlSW50KGRvY3VtZW50LmJvZHkuc3R5bGUudG9wKSA/PyAwXG4gIGNvbnN0IHNjcm9sbGJhcldpZHRoOm51bWJlciA9IHdpbmRvdy5pbm5lcldpZHRoIC0gZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aFxuICBkb2N1bWVudC5ib2R5LnN0eWxlLnRvcCA9IGZpeGVkID8gYC0ke3Njcm9sbGluZ0VsZW1lbnQuc2Nyb2xsVG9wfXB4YCA6ICcnXG4gIGRvY3VtZW50LmJvZHkuc3R5bGUucGFkZGluZ1JpZ2h0ID0gZml4ZWQgPyBgJHtzY3JvbGxiYXJXaWR0aH1weGAgOiAnJ1xuICBPYmplY3Qua2V5cyhzdHlsZUZvckZpeGVkKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgaWYgKGZpeGVkKSB7XG4gICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnNldFByb3BlcnR5KGtleSwgc3R5bGVGb3JGaXhlZFtrZXldKVxuICAgIH0gZWxzZSB7XG4gICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnJlbW92ZVByb3BlcnR5KGtleSlcbiAgICB9XG4gIH0pXG4gIGlmICghZml4ZWQpIHNjcm9sbGluZ0VsZW1lbnQuc2Nyb2xsVG9wID0gc2Nyb2xsWSAqIC0xXG59XG4iLCJpbXBvcnQgZml4QmFja2ZhY2UgZnJvbSAnLi9maXgtYmFja2ZhY2UuanMnXG5pbXBvcnQgJ3dpY2ctaW5lcnQnO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRHJhd2VyIHtcbiAgcHVibGljIGRyYXdlckVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbFxuICBwdWJsaWMgc3dpdGNoRWxlbWVudHM/OiBOb2RlTGlzdE9mPEhUTUxFbGVtZW50PiB8IG51bGxcbiAgcHVibGljIGluZXJ0RWxlbWVudHM/OiBOb2RlTGlzdE9mPEhUTUxFbGVtZW50PiB8IG51bGxcbiAgcHVibGljIGlzRXhwYW5kZWQ6IGJvb2xlYW4gPSBmYWxzZVxuICBwdWJsaWMgZW5hYmxlRml4QmFja2ZhY2U6Ym9vbGVhbiA9IHRydWVcbiAgcHVibGljIGVuYWJsZUhpc3Rvcnk6IGJvb2xlYW4gPSBmYWxzZVxuICBwdWJsaWMgaWQ6IHN0cmluZyA9ICdEcmF3ZXItJyArIG5ldyBEYXRlKCkuZ2V0VGltZSgpXG5cbiAgY29uc3RydWN0b3IoYXJnczoge1xuICAgIGRyYXdlcjogc3RyaW5nXG4gICAgc3dpdGNoPzogc3RyaW5nXG4gICAgaW5lcnQ/OiBzdHJpbmdcbiAgICBlbmFibGVGaXhCYWNrZmFjZT86IGJvb2xlYW5cbiAgICBlbmFibGVIaXN0b3J5PzogYm9vbGVhblxuICB9KSB7XG4gICAgLy8gRHJhd2VyIGJvZHlcbiAgICBpZiAodHlwZW9mIGFyZ3MgIT09ICdvYmplY3QnIHx8IGFyZ3MuZHJhd2VyID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OiBUaGUgXCJkcmF3ZXJcIiBwYXJhbWV0ZXIgaXMgcmVxdWlyZWQuID0+IGV4OiBuZXcgRHJhd2VyKHsgZHJhd2VyOiAnI2RyYXdlcicgfSlgKVxuICAgIGlmICh0eXBlb2YgYXJncy5kcmF3ZXIgIT09ICdzdHJpbmcnIHx8ICcnICkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06IFRoZSBcImRyYXdlclwiIHBhcmFtZXRlciBtdXN0IGJlIFwic3RyaW5nXCIgdHlwZSBhbmQgXCJDU1Mgc2VsZWN0b3JcIi5gKVxuICAgIGlmIChhcmdzLmRyYXdlciA9PT0gJycgKSB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTogVGhlIFwiZHJhd2VyXCIgcGFyYW1ldGVyIGlzIGVtcHR5LmApXG4gICAgdGhpcy5kcmF3ZXJFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihhcmdzLmRyYXdlcilcbiAgICBpZiAoIXRoaXMuZHJhd2VyRWxlbWVudCkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06IFRoZSBFbGVtZW50IGZvciBcImRyYXdlclwiIGlzIG5vdCBmb3VuZC5gKVxuICAgIHRoaXMuZHJhd2VyRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtZHJhd2VyLWlzLWluaXRpYWxpemVkJywgJ3RydWUnKVxuICAgIGlmICh0aGlzLmRyYXdlckVsZW1lbnQuaWQpIHtcbiAgICAgIHRoaXMuaWQgPSB0aGlzLmRyYXdlckVsZW1lbnQuaWRcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50LmlkID0gdGhpcy5pZFxuICAgIH1cbiAgICBpZiAodGhpcy5pc0V4cGFuZGVkKSB7XG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpXG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdoaWRkZW4nKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQuc2V0QXR0cmlidXRlKCdpbmVydCcsICcnKVxuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50LnNldEF0dHJpYnV0ZSgnaGlkZGVuJywgJycpXG4gICAgfVxuXG4gICAgLy8gU3dpdGNoZXMgZm9yIHRvZ2dsZVxuICAgIHRoaXMuc3dpdGNoRWxlbWVudHMgPSB0eXBlb2YgYXJncy5zd2l0Y2ggPT09ICdzdHJpbmcnID9cbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYXJncy5zd2l0Y2gpIDogbnVsbFxuICAgIGlmICh0aGlzLnN3aXRjaEVsZW1lbnRzKSB7XG4gICAgICB0aGlzLnN3aXRjaEVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpKVxuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS1kcmF3ZXItaXMnLCAnaW5pdGlhbGl6ZWQnKVxuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1jb250cm9scycsIHRoaXMuaWQpXG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIEVsZW1lbnRzIHRoYXQgYXJlIHNldCBcImluZXJ0XCIgYXR0cmlidXRlIHdoZW4gdGhlIGRyYXdlciBpcyBleHBhbmRlZFxuICAgIHRoaXMuaW5lcnRFbGVtZW50cyA9IHR5cGVvZiBhcmdzLmluZXJ0ID09PSAnc3RyaW5nJyA/XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGFyZ3MuaW5lcnQpIDogbnVsbFxuICAgIGlmICh0aGlzLmluZXJ0RWxlbWVudHMpIHtcbiAgICAgIHRoaXMuaW5lcnRFbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS1kcmF3ZXItaXMnLCAnaW5pdGlhbGl6ZWQnKVxuICAgICAgICBpZiAodGhpcy5pc0V4cGFuZGVkKSB7XG4gICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2luZXJ0JywgJycpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2luZXJ0JylcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyBQcmV2ZW50aW5nIHNjcm9sbCB3aGVuIHRoZSBkcmF3ZXIgaXMgZXhwYW5kZWRcbiAgICB0aGlzLmVuYWJsZUZpeEJhY2tmYWNlID0gYXJncy5lbmFibGVGaXhCYWNrZmFjZSA/PyB0cnVlXG5cbiAgICAvLyBBZGRpbmcgdGhlIHN0YXRlIG9mIHRoZSBkcmF3ZXIgdG8gdGhlIGhpc3Rvcnkgb2YgeW91ciBicm93c2VyXG4gICAgaWYgKGFyZ3MuZW5hYmxlSGlzdG9yeSkge1xuICAgICAgdGhpcy5lbmFibGVIaXN0b3J5ID0gdHJ1ZVxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3BvcHN0YXRlJywgdGhpcy5fcG9wc3RhdGVIYW5kbGVyLmJpbmQodGhpcykpXG4gICAgfVxuXG4gIH1cbiAgdG9nZ2xlKGV2ZW50OiBFdmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICBpZiAodGhpcy5pc0V4cGFuZGVkKSB7XG4gICAgICB0aGlzLmNsb3NlKClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5vcGVuKClcbiAgICB9XG4gIH1cbiAgb3BlbigpIHtcbiAgICB0aGlzLl9jaGFuZ2VTdGF0ZSh0cnVlKVxuICAgIGlmICh0aGlzLmVuYWJsZUhpc3RvcnkpIHRoaXMuX3B1c2hTdGF0ZSh0cnVlKVxuICB9XG4gIGNsb3NlKCkge1xuICAgIHRoaXMuX2NoYW5nZVN0YXRlKGZhbHNlKVxuICAgIGlmICh0aGlzLmVuYWJsZUhpc3RvcnkpIHRoaXMuX3B1c2hTdGF0ZShmYWxzZSlcbiAgfVxuICBwcml2YXRlIF9jaGFuZ2VTdGF0ZShpc0V4cGFuZGVkOiBib29sZWFuKSB7XG4gICAgaWYgKGlzRXhwYW5kZWQpIHtcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudD8ucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpXG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQ/LnJlbW92ZUF0dHJpYnV0ZSgnaGlkZGVuJylcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5fa2V5dXBIYW5kbGVyLmJpbmQodGhpcykpXG5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gV2hlbiB0aGUgZHJhd2VyIGlzIGhpZGRlblxuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50Py5zZXRBdHRyaWJ1dGUoJ2luZXJ0JywgJycpXG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQ/LnNldEF0dHJpYnV0ZSgnaGlkZGVuJywgJycpXG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX2tleXVwSGFuZGxlci5iaW5kKHRoaXMpKVxuICAgIH1cblxuICAgIGlmICggdHlwZW9mIGZpeEJhY2tmYWNlID09PSAnZnVuY3Rpb24nICYmIHRoaXMuZW5hYmxlRml4QmFja2ZhY2UgKSBmaXhCYWNrZmFjZShpc0V4cGFuZGVkKVxuXG4gICAgaWYgKHRoaXMuc3dpdGNoRWxlbWVudHMpIHtcbiAgICAgIHRoaXMuc3dpdGNoRWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCBTdHJpbmcoaXNFeHBhbmRlZCkpXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmICh0aGlzLmluZXJ0RWxlbWVudHMpIHtcbiAgICAgIHRoaXMuaW5lcnRFbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBpZiAoaXNFeHBhbmRlZCkge1xuICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdpbmVydCcsICcnKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgdGhpcy5pc0V4cGFuZGVkID0gaXNFeHBhbmRlZFxuICB9XG4gIHByaXZhdGUgX2tleXVwSGFuZGxlcihldmVudDogS2V5Ym9hcmRFdmVudCkge1xuICAgIGlmIChldmVudC5rZXkgPT09ICdFc2NhcGUnIHx8IGV2ZW50LmtleSA9PT0gJ0VzYycpIHRoaXMuY2xvc2UoKVxuICB9XG4gIHByaXZhdGUgX3BvcHN0YXRlSGFuZGxlcihldmVudDogUG9wU3RhdGVFdmVudCkge1xuICAgIHRoaXMuX2NoYW5nZVN0YXRlKCF0aGlzLmlzRXhwYW5kZWQpO1xuICB9XG4gIHByaXZhdGUgX3B1c2hTdGF0ZShpc0V4cGFuZGVkOiBib29sZWFuKSB7XG4gICAgaGlzdG9yeS5wdXNoU3RhdGUoe1xuICAgICAgaXNFeHBhbmRlZDogaXNFeHBhbmRlZFxuICAgIH0sICdkcmF3ZXJTdGF0ZScpXG4gIH1cbn0iXSwibmFtZXMiOlsic3R5bGVGb3JGaXhlZCIsImhlaWdodCIsImxlZnQiLCJvdmVyZmxvdyIsInBvc2l0aW9uIiwid2lkdGgiLCJzY3JvbGxpbmdFbGVtZW50IiwidWEiLCJ3aW5kb3ciLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJ0b0xvd2VyQ2FzZSIsImRvY3VtZW50IiwiaW5kZXhPZiIsImJvZHkiLCJkb2N1bWVudEVsZW1lbnQiLCJmaXhCYWNrZmFjZSIsImZpeGVkIiwic2Nyb2xsWSIsInNjcm9sbFRvcCIsInBhcnNlSW50Iiwic3R5bGUiLCJ0b3AiLCJzY3JvbGxiYXJXaWR0aCIsImlubmVyV2lkdGgiLCJjbGllbnRXaWR0aCIsInBhZGRpbmdSaWdodCIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwia2V5Iiwic2V0UHJvcGVydHkiLCJyZW1vdmVQcm9wZXJ0eSIsIkRyYXdlciIsImNvbnN0cnVjdG9yIiwiYXJncyIsIkRhdGUiLCJnZXRUaW1lIiwiZHJhd2VyIiwidW5kZWZpbmVkIiwiRXJyb3IiLCJuYW1lIiwiZHJhd2VyRWxlbWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJzZXRBdHRyaWJ1dGUiLCJpZCIsImlzRXhwYW5kZWQiLCJyZW1vdmVBdHRyaWJ1dGUiLCJzd2l0Y2hFbGVtZW50cyIsInN3aXRjaCIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJlbGVtZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsInRvZ2dsZSIsImJpbmQiLCJpbmVydEVsZW1lbnRzIiwiaW5lcnQiLCJlbmFibGVGaXhCYWNrZmFjZSIsImVuYWJsZUhpc3RvcnkiLCJfcG9wc3RhdGVIYW5kbGVyIiwiZXZlbnQiLCJwcmV2ZW50RGVmYXVsdCIsImNsb3NlIiwib3BlbiIsIl9jaGFuZ2VTdGF0ZSIsIl9wdXNoU3RhdGUiLCJfa2V5dXBIYW5kbGVyIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsIlN0cmluZyIsImhpc3RvcnkiLCJwdXNoU3RhdGUiXSwibWFwcGluZ3MiOiI7OztJQUFBLE1BQU1BLGFBQWEsR0FFZjtJQUNGQyxFQUFBQSxNQUFNLEVBQUUsT0FETjtJQUVGQyxFQUFBQSxJQUFJLEVBQUUsR0FGSjtJQUdGQyxFQUFBQSxRQUFRLEVBQUUsUUFIUjtJQUlGQyxFQUFBQSxRQUFRLEVBQUUsT0FKUjtJQUtGQyxFQUFBQSxLQUFLLEVBQUU7SUFMTCxDQUZKOztJQVVBLE1BQU1DLGdCQUFnQixHQUFZLENBQUM7SUFDakMsUUFBTUMsRUFBRSxHQUFHQyxNQUFNLENBQUNDLFNBQVAsQ0FBaUJDLFNBQWpCLENBQTJCQyxXQUEzQixFQUFYO0lBQ0EsTUFBSSxzQkFBc0JDLFFBQTFCLEVBQW9DLE9BQU9BLFFBQVEsQ0FBQ04sZ0JBQWhCO0lBQ3BDLE1BQUlDLEVBQUUsQ0FBQ00sT0FBSCxDQUFXLFFBQVgsSUFBdUIsQ0FBM0IsRUFBOEIsT0FBT0QsUUFBUSxDQUFDRSxJQUFoQjtJQUM5QixTQUFPRixRQUFRLENBQUNH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
