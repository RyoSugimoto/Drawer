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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhd2VyLmpzIiwic291cmNlcyI6WyIuLi9zcmMvdHMvZml4LWJhY2tmYWNlLnRzIiwiLi4vc3JjL3RzL2RyYXdlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBzdHlsZUZvckZpeGVkOiB7XG4gIFtrZXk6IHN0cmluZ106IHN0cmluZ1xufSA9IHtcbiAgaGVpZ2h0OiAnMTAwdmgnLFxuICBsZWZ0OiAnMCcsXG4gIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgcG9zaXRpb246ICdmaXhlZCcsXG4gIHdpZHRoOiAnMTAwdncnLFxufVxuXG5jb25zdCBzY3JvbGxpbmdFbGVtZW50OiBFbGVtZW50ID0gKCgpID0+IHtcbiAgY29uc3QgdWEgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpXG4gIGlmICgnc2Nyb2xsaW5nRWxlbWVudCcgaW4gZG9jdW1lbnQpIHJldHVybiBkb2N1bWVudC5zY3JvbGxpbmdFbGVtZW50IVxuICBpZiAodWEuaW5kZXhPZignd2Via2l0JykgPiAwKSByZXR1cm4gZG9jdW1lbnQuYm9keSFcbiAgcmV0dXJuIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCFcbn0pKCkhXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGZpeEJhY2tmYWNlKGZpeGVkOiBib29sZWFuKSB7XG4gIGNvbnN0IHNjcm9sbFk6bnVtYmVyID0gZml4ZWQgPyBzY3JvbGxpbmdFbGVtZW50LnNjcm9sbFRvcCA6IHBhcnNlSW50KGRvY3VtZW50LmJvZHkuc3R5bGUudG9wKSA/PyAwXG4gIGNvbnN0IHNjcm9sbGJhcldpZHRoOm51bWJlciA9IHdpbmRvdy5pbm5lcldpZHRoIC0gZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aFxuICBkb2N1bWVudC5ib2R5LnN0eWxlLnRvcCA9IGZpeGVkID8gYC0ke3Njcm9sbGluZ0VsZW1lbnQuc2Nyb2xsVG9wfXB4YCA6ICcnXG4gIGRvY3VtZW50LmJvZHkuc3R5bGUucGFkZGluZ1JpZ2h0ID0gZml4ZWQgPyBgJHtzY3JvbGxiYXJXaWR0aH1weGAgOiAnJ1xuICBPYmplY3Qua2V5cyhzdHlsZUZvckZpeGVkKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgaWYgKGZpeGVkKSB7XG4gICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnNldFByb3BlcnR5KGtleSwgc3R5bGVGb3JGaXhlZFtrZXldKVxuICAgIH0gZWxzZSB7XG4gICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnJlbW92ZVByb3BlcnR5KGtleSlcbiAgICB9XG4gIH0pXG4gIGlmICghZml4ZWQpIHNjcm9sbGluZ0VsZW1lbnQuc2Nyb2xsVG9wID0gc2Nyb2xsWSAqIC0xXG59XG4iLCJpbXBvcnQgZml4QmFja2ZhY2UgZnJvbSAnLi9maXgtYmFja2ZhY2UuanMnXG5pbXBvcnQgJ3dpY2ctaW5lcnQnO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRHJhd2VyIHtcbiAgcHVibGljIGRyYXdlckVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbFxuICBwdWJsaWMgc3dpdGNoRWxlbWVudHM/OiBOb2RlTGlzdE9mPEhUTUxFbGVtZW50PiB8IG51bGxcbiAgcHVibGljIGluZXJ0RWxlbWVudHM/OiBOb2RlTGlzdE9mPEhUTUxFbGVtZW50PiB8IG51bGxcbiAgcHVibGljIGlzRXhwYW5kZWQ6IGJvb2xlYW4gPSBmYWxzZVxuICBwdWJsaWMgZW5hYmxlRml4QmFja2ZhY2U6Ym9vbGVhbiA9IHRydWVcbiAgcHVibGljIGVuYWJsZUhpc3Rvcnk6IGJvb2xlYW4gPSBmYWxzZVxuICBwdWJsaWMgaWQ6IHN0cmluZyA9ICdEcmF3ZXItJyArIG5ldyBEYXRlKCkuZ2V0VGltZSgpXG5cbiAgY29uc3RydWN0b3IoYXJnczoge1xuICAgIGRyYXdlcjogc3RyaW5nXG4gICAgc3dpdGNoPzogc3RyaW5nXG4gICAgaW5lcnQ/OiBzdHJpbmdcbiAgICBlbmFibGVGaXhCYWNrZmFjZT86IGJvb2xlYW5cbiAgICBlbmFibGVIaXN0b3J5PzogYm9vbGVhblxuICB9KSB7XG4gICAgLy8gRHJhd2VyIGJvZHlcbiAgICBpZiAodHlwZW9mIGFyZ3MgIT09ICdvYmplY3QnIHx8IGFyZ3MuZHJhd2VyID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OiBUaGUgXCJkcmF3ZXJcIiBwYXJhbWV0ZXIgaXMgcmVxdWlyZWQuID0+IGV4OiBuZXcgRHJhd2VyKHsgZHJhd2VyOiAnI2RyYXdlcicgfSlgKVxuICAgIGlmICh0eXBlb2YgYXJncy5kcmF3ZXIgIT09ICdzdHJpbmcnIHx8ICcnICkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06IFRoZSBcImRyYXdlclwiIHBhcmFtZXRlciBtdXN0IGJlIFwic3RyaW5nXCIgdHlwZSBhbmQgXCJDU1Mgc2VsZWN0b3JcIi5gKVxuICAgIGlmIChhcmdzLmRyYXdlciA9PT0gJycgKSB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTogVGhlIFwiZHJhd2VyXCIgcGFyYW1ldGVyIGlzIGVtcHR5LmApXG4gICAgdGhpcy5kcmF3ZXJFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihhcmdzLmRyYXdlcilcbiAgICBpZiAoIXRoaXMuZHJhd2VyRWxlbWVudCkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06IFRoZSBFbGVtZW50IGZvciBcImRyYXdlclwiIGlzIG5vdCBmb3VuZC5gKVxuICAgIHRoaXMuZHJhd2VyRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtZHJhd2VyLWlzLWluaXRpYWxpemVkJywgJ3RydWUnKVxuICAgIGlmICh0aGlzLmRyYXdlckVsZW1lbnQuaWQpIHtcbiAgICAgIHRoaXMuaWQgPSB0aGlzLmRyYXdlckVsZW1lbnQuaWRcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50LmlkID0gdGhpcy5pZFxuICAgIH1cbiAgICBpZiAodGhpcy5pc0V4cGFuZGVkKSB7XG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpXG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdoaWRkZW4nKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQuc2V0QXR0cmlidXRlKCdpbmVydCcsICcnKVxuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50LnNldEF0dHJpYnV0ZSgnaGlkZGVuJywgJycpXG4gICAgfVxuXG4gICAgLy8gU3dpdGNoZXMgZm9yIHRvZ2dsZVxuICAgIHRoaXMuc3dpdGNoRWxlbWVudHMgPSB0eXBlb2YgYXJncy5zd2l0Y2ggPT09ICdzdHJpbmcnID9cbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYXJncy5zd2l0Y2gpIDogbnVsbFxuICAgIGlmICh0aGlzLnN3aXRjaEVsZW1lbnRzKSB7XG4gICAgICB0aGlzLnN3aXRjaEVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpKVxuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS1kcmF3ZXItaXMtaW5pdGlhbGl6ZWQnLCAndHJ1ZScpXG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWNvbnRyb2xzJywgdGhpcy5pZClcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gRWxlbWVudHMgdGhhdCBhcmUgc2V0IFwiaW5lcnRcIiBhdHRyaWJ1dGUgd2hlbiB0aGUgZHJhd2VyIGlzIGV4cGFuZGVkXG4gICAgdGhpcy5pbmVydEVsZW1lbnRzID0gdHlwZW9mIGFyZ3MuaW5lcnQgPT09ICdzdHJpbmcnID9cbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYXJncy5pbmVydCkgOiBudWxsXG4gICAgaWYgKHRoaXMuaW5lcnRFbGVtZW50cykge1xuICAgICAgdGhpcy5pbmVydEVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdkYXRhLWRyYXdlci1pcycsICdpbml0aWFsaXplZCcpXG4gICAgICAgIGlmICh0aGlzLmlzRXhwYW5kZWQpIHtcbiAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnaW5lcnQnLCAnJylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnaW5lcnQnKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIFByZXZlbnRpbmcgc2Nyb2xsIHdoZW4gdGhlIGRyYXdlciBpcyBleHBhbmRlZFxuICAgIHRoaXMuZW5hYmxlRml4QmFja2ZhY2UgPSBhcmdzLmVuYWJsZUZpeEJhY2tmYWNlID8/IHRydWVcblxuICAgIC8vIEFkZGluZyB0aGUgc3RhdGUgb2YgdGhlIGRyYXdlciB0byB0aGUgaGlzdG9yeSBvZiB5b3VyIGJyb3dzZXJcbiAgICBpZiAoYXJncy5lbmFibGVIaXN0b3J5KSB7XG4gICAgICB0aGlzLmVuYWJsZUhpc3RvcnkgPSB0cnVlXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncG9wc3RhdGUnLCB0aGlzLl9wb3BzdGF0ZUhhbmRsZXIuYmluZCh0aGlzKSlcbiAgICB9XG5cbiAgfVxuICB0b2dnbGUoZXZlbnQ6IEV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIGlmICh0aGlzLmlzRXhwYW5kZWQpIHtcbiAgICAgIHRoaXMuY2xvc2UoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm9wZW4oKVxuICAgIH1cbiAgfVxuICBvcGVuKCkge1xuICAgIHRoaXMuX2NoYW5nZVN0YXRlKHRydWUpXG4gICAgaWYgKHRoaXMuZW5hYmxlSGlzdG9yeSkgdGhpcy5fcHVzaFN0YXRlKHRydWUpXG4gIH1cbiAgY2xvc2UoKSB7XG4gICAgdGhpcy5fY2hhbmdlU3RhdGUoZmFsc2UpXG4gICAgaWYgKHRoaXMuZW5hYmxlSGlzdG9yeSkgdGhpcy5fcHVzaFN0YXRlKGZhbHNlKVxuICB9XG4gIHByaXZhdGUgX2NoYW5nZVN0YXRlKGlzRXhwYW5kZWQ6IGJvb2xlYW4pIHtcbiAgICBpZiAoaXNFeHBhbmRlZCkge1xuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50Py5yZW1vdmVBdHRyaWJ1dGUoJ2luZXJ0JylcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudD8ucmVtb3ZlQXR0cmlidXRlKCdoaWRkZW4nKVxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9rZXl1cEhhbmRsZXIuYmluZCh0aGlzKSlcblxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBXaGVuIHRoZSBkcmF3ZXIgaXMgaGlkZGVuXG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQ/LnNldEF0dHJpYnV0ZSgnaW5lcnQnLCAnJylcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudD8uc2V0QXR0cmlidXRlKCdoaWRkZW4nLCAnJylcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5fa2V5dXBIYW5kbGVyLmJpbmQodGhpcykpXG4gICAgfVxuXG4gICAgaWYgKCB0eXBlb2YgZml4QmFja2ZhY2UgPT09ICdmdW5jdGlvbicgJiYgdGhpcy5lbmFibGVGaXhCYWNrZmFjZSApIGZpeEJhY2tmYWNlKGlzRXhwYW5kZWQpXG5cbiAgICBpZiAodGhpcy5zd2l0Y2hFbGVtZW50cykge1xuICAgICAgdGhpcy5zd2l0Y2hFbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsIFN0cmluZyhpc0V4cGFuZGVkKSlcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5lcnRFbGVtZW50cykge1xuICAgICAgdGhpcy5pbmVydEVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGlmIChpc0V4cGFuZGVkKSB7XG4gICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2luZXJ0JywgJycpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2luZXJ0JylcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICB0aGlzLmlzRXhwYW5kZWQgPSBpc0V4cGFuZGVkXG4gIH1cbiAgcHJpdmF0ZSBfa2V5dXBIYW5kbGVyKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XG4gICAgaWYgKGV2ZW50LmtleSA9PT0gJ0VzY2FwZScgfHwgZXZlbnQua2V5ID09PSAnRXNjJykgdGhpcy5jbG9zZSgpXG4gIH1cbiAgcHJpdmF0ZSBfcG9wc3RhdGVIYW5kbGVyKGV2ZW50OiBQb3BTdGF0ZUV2ZW50KSB7XG4gICAgdGhpcy5fY2hhbmdlU3RhdGUoIXRoaXMuaXNFeHBhbmRlZCk7XG4gIH1cbiAgcHJpdmF0ZSBfcHVzaFN0YXRlKGlzRXhwYW5kZWQ6IGJvb2xlYW4pIHtcbiAgICBoaXN0b3J5LnB1c2hTdGF0ZSh7XG4gICAgICBpc0V4cGFuZGVkOiBpc0V4cGFuZGVkXG4gICAgfSwgJ2RyYXdlclN0YXRlJylcbiAgfVxufSJdLCJuYW1lcyI6WyJzdHlsZUZvckZpeGVkIiwiaGVpZ2h0IiwibGVmdCIsIm92ZXJmbG93IiwicG9zaXRpb24iLCJ3aWR0aCIsInNjcm9sbGluZ0VsZW1lbnQiLCJ1YSIsIndpbmRvdyIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsInRvTG93ZXJDYXNlIiwiZG9jdW1lbnQiLCJpbmRleE9mIiwiYm9keSIsImRvY3VtZW50RWxlbWVudCIsImZpeEJhY2tmYWNlIiwiZml4ZWQiLCJzY3JvbGxZIiwic2Nyb2xsVG9wIiwicGFyc2VJbnQiLCJzdHlsZSIsInRvcCIsInNjcm9sbGJhcldpZHRoIiwiaW5uZXJXaWR0aCIsImNsaWVudFdpZHRoIiwicGFkZGluZ1JpZ2h0IiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJrZXkiLCJzZXRQcm9wZXJ0eSIsInJlbW92ZVByb3BlcnR5IiwiRHJhd2VyIiwiY29uc3RydWN0b3IiLCJhcmdzIiwiRGF0ZSIsImdldFRpbWUiLCJkcmF3ZXIiLCJ1bmRlZmluZWQiLCJFcnJvciIsIm5hbWUiLCJkcmF3ZXJFbGVtZW50IiwicXVlcnlTZWxlY3RvciIsInNldEF0dHJpYnV0ZSIsImlkIiwiaXNFeHBhbmRlZCIsInJlbW92ZUF0dHJpYnV0ZSIsInN3aXRjaEVsZW1lbnRzIiwic3dpdGNoIiwicXVlcnlTZWxlY3RvckFsbCIsImVsZW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwidG9nZ2xlIiwiYmluZCIsImluZXJ0RWxlbWVudHMiLCJpbmVydCIsImVuYWJsZUZpeEJhY2tmYWNlIiwiZW5hYmxlSGlzdG9yeSIsIl9wb3BzdGF0ZUhhbmRsZXIiLCJldmVudCIsInByZXZlbnREZWZhdWx0IiwiY2xvc2UiLCJvcGVuIiwiX2NoYW5nZVN0YXRlIiwiX3B1c2hTdGF0ZSIsIl9rZXl1cEhhbmRsZXIiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiU3RyaW5nIiwiaGlzdG9yeSIsInB1c2hTdGF0ZSJdLCJtYXBwaW5ncyI6Ijs7O0lBQUEsTUFBTUEsYUFBYSxHQUVmO0lBQ0ZDLEVBQUFBLE1BQU0sRUFBRSxPQUROO0lBRUZDLEVBQUFBLElBQUksRUFBRSxHQUZKO0lBR0ZDLEVBQUFBLFFBQVEsRUFBRSxRQUhSO0lBSUZDLEVBQUFBLFFBQVEsRUFBRSxPQUpSO0lBS0ZDLEVBQUFBLEtBQUssRUFBRTtJQUxMLENBRko7O0lBVUEsTUFBTUMsZ0JBQWdCLEdBQVksQ0FBQztJQUNqQyxRQUFNQyxFQUFFLEdBQUdDLE1BQU0sQ0FBQ0MsU0FBUCxDQUFpQkMsU0FBakIsQ0FBMkJDLFdBQTNCLEVBQVg7SUFDQSxNQUFJLHNCQUFzQkMsUUFBMUIsRUFBb0MsT0FBT0EsUUFBUSxDQUFDTixnQkFBaEI7SUFDcEMsTUFBSUMsRUFBRSxDQUFDTSxPQUFILENBQVcsUUFBWCxJQUF1QixDQUEzQixFQUE4QixPQUFPRCxRQUFRLENBQUNFLElBQWhCO0lBQzlCLFNBQU9GLFFBQVEs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
