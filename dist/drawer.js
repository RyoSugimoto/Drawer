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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhd2VyLmpzIiwic291cmNlcyI6WyIuLi9zcmMvdHMvZml4LWJhY2tmYWNlLnRzIiwiLi4vc3JjL3RzL2RyYXdlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBzdHlsZUZvckZpeGVkOiB7XG4gIFtrZXk6IHN0cmluZ106IHN0cmluZ1xufSA9IHtcbiAgaGVpZ2h0OiAnMTAwdmgnLFxuICBsZWZ0OiAnMCcsXG4gIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgcG9zaXRpb246ICdmaXhlZCcsXG4gIHdpZHRoOiAnMTAwdncnLFxufVxuXG5jb25zdCBzY3JvbGxpbmdFbGVtZW50OiBFbGVtZW50ID0gKCgpID0+IHtcbiAgY29uc3QgdWEgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpXG4gIGNvbnN0IGQ6RG9jdW1lbnQgPSBkb2N1bWVudFxuICBpZiAoJ3Njcm9sbGluZ0VsZW1lbnQnIGluIGRvY3VtZW50KSByZXR1cm4gZG9jdW1lbnQuc2Nyb2xsaW5nRWxlbWVudCFcbiAgaWYgKHVhLmluZGV4T2YoJ3dlYmtpdCcpID4gMCkgcmV0dXJuIGQuYm9keSFcbiAgcmV0dXJuIGQuZG9jdW1lbnRFbGVtZW50IVxufSkoKSFcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZml4QmFja2ZhY2UoZml4ZWQ6IGJvb2xlYW4pIHtcbiAgY29uc3Qgc2Nyb2xsWTpudW1iZXIgPSBmaXhlZCA/IHNjcm9sbGluZ0VsZW1lbnQuc2Nyb2xsVG9wIDogcGFyc2VJbnQoZG9jdW1lbnQuYm9keS5zdHlsZS50b3ApID8/IDBcbiAgY29uc3Qgc2Nyb2xsYmFyV2lkdGg6bnVtYmVyID0gd2luZG93LmlubmVyV2lkdGggLSBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoXG4gIGRvY3VtZW50LmJvZHkuc3R5bGUudG9wID0gZml4ZWQgPyBgLSR7c2Nyb2xsaW5nRWxlbWVudC5zY3JvbGxUb3B9cHhgIDogJydcbiAgZG9jdW1lbnQuYm9keS5zdHlsZS5wYWRkaW5nUmlnaHQgPSBmaXhlZCA/IGAke3Njcm9sbGJhcldpZHRofXB4YCA6ICcnXG4gIE9iamVjdC5rZXlzKHN0eWxlRm9yRml4ZWQpLmZvckVhY2goa2V5ID0+IHtcbiAgICBpZiAoZml4ZWQpIHtcbiAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuc2V0UHJvcGVydHkoa2V5LCBzdHlsZUZvckZpeGVkW2tleV0pXG4gICAgfSBlbHNlIHtcbiAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUucmVtb3ZlUHJvcGVydHkoa2V5KVxuICAgIH1cbiAgfSlcbiAgaWYgKCFmaXhlZCkgc2Nyb2xsaW5nRWxlbWVudC5zY3JvbGxUb3AgPSBzY3JvbGxZICogLTFcbn1cbiIsImltcG9ydCBmaXhCYWNrZmFjZSBmcm9tICcuL2ZpeC1iYWNrZmFjZS5qcydcbmltcG9ydCAnd2ljZy1pbmVydCc7XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEcmF3ZXIge1xuICBwdWJsaWMgZHJhd2VyRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsXG4gIHB1YmxpYyBzd2l0Y2hFbGVtZW50cz86IE5vZGVMaXN0T2Y8SFRNTEVsZW1lbnQ+IHwgbnVsbFxuICBwdWJsaWMgaW5lcnRFbGVtZW50cz86IE5vZGVMaXN0T2Y8SFRNTEVsZW1lbnQ+IHwgbnVsbFxuICBwdWJsaWMgaXNFeHBhbmRlZDogYm9vbGVhbiA9IGZhbHNlXG4gIHB1YmxpYyBlbmFibGVGaXhCYWNrZmFjZTpib29sZWFuID0gdHJ1ZVxuICBwdWJsaWMgZW5hYmxlSGlzdG9yeTogYm9vbGVhbiA9IGZhbHNlXG4gIHB1YmxpYyBpZDogc3RyaW5nID0gJ0RyYXdlci0nICsgbmV3IERhdGUoKS5nZXRUaW1lKClcblxuICBjb25zdHJ1Y3RvcihhcmdzOiB7XG4gICAgZHJhd2VyOiBzdHJpbmdcbiAgICBzd2l0Y2g/OiBzdHJpbmdcbiAgICBpbmVydD86IHN0cmluZ1xuICAgIGVuYWJsZUZpeEJhY2tmYWNlPzogYm9vbGVhblxuICAgIGVuYWJsZUhpc3Rvcnk/OiBib29sZWFuXG4gIH0pIHtcbiAgICAvLyBEcmF3ZXIgYm9keVxuICAgIGlmICh0eXBlb2YgYXJncyAhPT0gJ29iamVjdCcgfHwgYXJncy5kcmF3ZXIgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06IFRoZSBcImRyYXdlclwiIHBhcmFtZXRlciBpcyByZXF1aXJlZC4gPT4gZXg6IG5ldyBEcmF3ZXIoeyBkcmF3ZXI6ICcjZHJhd2VyJyB9KWApXG4gICAgaWYgKHR5cGVvZiBhcmdzLmRyYXdlciAhPT0gJ3N0cmluZycgfHwgJycgKSB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTogVGhlIFwiZHJhd2VyXCIgcGFyYW1ldGVyIG11c3QgYmUgXCJzdHJpbmdcIiB0eXBlIGFuZCBcIkNTUyBzZWxlY3RvclwiLmApXG4gICAgaWYgKGFyZ3MuZHJhd2VyID09PSAnJyApIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OiBUaGUgXCJkcmF3ZXJcIiBwYXJhbWV0ZXIgaXMgZW1wdHkuYClcbiAgICB0aGlzLmRyYXdlckVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGFyZ3MuZHJhd2VyKVxuICAgIGlmICghdGhpcy5kcmF3ZXJFbGVtZW50KSB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTogVGhlIEVsZW1lbnQgZm9yIFwiZHJhd2VyXCIgaXMgbm90IGZvdW5kLmApXG4gICAgdGhpcy5kcmF3ZXJFbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS1kcmF3ZXItaXMtaW5pdGlhbGl6ZWQnLCAndHJ1ZScpXG4gICAgaWYgKHRoaXMuZHJhd2VyRWxlbWVudC5pZCkge1xuICAgICAgdGhpcy5pZCA9IHRoaXMuZHJhd2VyRWxlbWVudC5pZFxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQuaWQgPSB0aGlzLmlkXG4gICAgfVxuICAgIGlmICh0aGlzLmlzRXhwYW5kZWQpIHtcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2luZXJ0JylcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2hpZGRlbicpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2luZXJ0JywgJycpXG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQuc2V0QXR0cmlidXRlKCdoaWRkZW4nLCAnJylcbiAgICB9XG5cbiAgICAvLyBTd2l0Y2hlcyBmb3IgdG9nZ2xlXG4gICAgdGhpcy5zd2l0Y2hFbGVtZW50cyA9IHR5cGVvZiBhcmdzLnN3aXRjaCA9PT0gJ3N0cmluZycgP1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChhcmdzLnN3aXRjaCkgOiBudWxsXG4gICAgaWYgKHRoaXMuc3dpdGNoRWxlbWVudHMpIHtcbiAgICAgIHRoaXMuc3dpdGNoRWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlLmJpbmQodGhpcykpXG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdkYXRhLWRyYXdlci1pcy1pbml0aWFsaXplZCcsICd0cnVlJylcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnLCB0aGlzLmlkKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyBFbGVtZW50cyB0aGF0IGFyZSBzZXQgXCJpbmVydFwiIGF0dHJpYnV0ZSB3aGVuIHRoZSBkcmF3ZXIgaXMgZXhwYW5kZWRcbiAgICB0aGlzLmluZXJ0RWxlbWVudHMgPSB0eXBlb2YgYXJncy5pbmVydCA9PT0gJ3N0cmluZycgP1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChhcmdzLmluZXJ0KSA6IG51bGxcbiAgICBpZiAodGhpcy5pbmVydEVsZW1lbnRzKSB7XG4gICAgICB0aGlzLmluZXJ0RWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtZHJhd2VyLWlzJywgJ2luaXRpYWxpemVkJylcbiAgICAgICAgaWYgKHRoaXMuaXNFeHBhbmRlZCkge1xuICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdpbmVydCcsICcnKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gUHJldmVudGluZyBzY3JvbGwgd2hlbiB0aGUgZHJhd2VyIGlzIGV4cGFuZGVkXG4gICAgdGhpcy5lbmFibGVGaXhCYWNrZmFjZSA9IGFyZ3MuZW5hYmxlRml4QmFja2ZhY2UgPz8gdHJ1ZVxuXG4gICAgLy8gQWRkaW5nIHRoZSBzdGF0ZSBvZiB0aGUgZHJhd2VyIHRvIHRoZSBoaXN0b3J5IG9mIHlvdXIgYnJvd3NlclxuICAgIGlmIChhcmdzLmVuYWJsZUhpc3RvcnkpIHtcbiAgICAgIHRoaXMuZW5hYmxlSGlzdG9yeSA9IHRydWVcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIHRoaXMuX3BvcHN0YXRlSGFuZGxlci5iaW5kKHRoaXMpKVxuICAgIH1cblxuICB9XG4gIHRvZ2dsZShldmVudDogRXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgaWYgKHRoaXMuaXNFeHBhbmRlZCkge1xuICAgICAgdGhpcy5jbG9zZSgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMub3BlbigpXG4gICAgfVxuICB9XG4gIG9wZW4oKSB7XG4gICAgdGhpcy5fY2hhbmdlU3RhdGUodHJ1ZSlcbiAgICBpZiAodGhpcy5lbmFibGVIaXN0b3J5KSB0aGlzLl9wdXNoU3RhdGUodHJ1ZSlcbiAgfVxuICBjbG9zZSgpIHtcbiAgICB0aGlzLl9jaGFuZ2VTdGF0ZShmYWxzZSlcbiAgICBpZiAodGhpcy5lbmFibGVIaXN0b3J5KSB0aGlzLl9wdXNoU3RhdGUoZmFsc2UpXG4gIH1cbiAgcHJpdmF0ZSBfY2hhbmdlU3RhdGUoaXNFeHBhbmRlZDogYm9vbGVhbikge1xuICAgIGlmIChpc0V4cGFuZGVkKSB7XG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQ/LnJlbW92ZUF0dHJpYnV0ZSgnaW5lcnQnKVxuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50Py5yZW1vdmVBdHRyaWJ1dGUoJ2hpZGRlbicpXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX2tleXVwSGFuZGxlci5iaW5kKHRoaXMpKVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFdoZW4gdGhlIGRyYXdlciBpcyBoaWRkZW5cbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudD8uc2V0QXR0cmlidXRlKCdpbmVydCcsICcnKVxuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50Py5zZXRBdHRyaWJ1dGUoJ2hpZGRlbicsICcnKVxuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9rZXl1cEhhbmRsZXIuYmluZCh0aGlzKSlcbiAgICB9XG5cbiAgICBpZiAoIHR5cGVvZiBmaXhCYWNrZmFjZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0aGlzLmVuYWJsZUZpeEJhY2tmYWNlICkgZml4QmFja2ZhY2UoaXNFeHBhbmRlZClcblxuICAgIGlmICh0aGlzLnN3aXRjaEVsZW1lbnRzKSB7XG4gICAgICB0aGlzLnN3aXRjaEVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgU3RyaW5nKGlzRXhwYW5kZWQpKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbmVydEVsZW1lbnRzKSB7XG4gICAgICB0aGlzLmluZXJ0RWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgaWYgKGlzRXhwYW5kZWQpIHtcbiAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnaW5lcnQnLCAnJylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnaW5lcnQnKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIHRoaXMuaXNFeHBhbmRlZCA9IGlzRXhwYW5kZWRcbiAgfVxuICBwcml2YXRlIF9rZXl1cEhhbmRsZXIoZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBpZiAoZXZlbnQua2V5ID09PSAnRXNjYXBlJyB8fCBldmVudC5rZXkgPT09ICdFc2MnKSB0aGlzLmNsb3NlKClcbiAgfVxuICBwcml2YXRlIF9wb3BzdGF0ZUhhbmRsZXIoZXZlbnQ6IFBvcFN0YXRlRXZlbnQpIHtcbiAgICB0aGlzLl9jaGFuZ2VTdGF0ZSghdGhpcy5pc0V4cGFuZGVkKTtcbiAgfVxuICBwcml2YXRlIF9wdXNoU3RhdGUoaXNFeHBhbmRlZDogYm9vbGVhbikge1xuICAgIGhpc3RvcnkucHVzaFN0YXRlKHtcbiAgICAgIGlzRXhwYW5kZWQ6IGlzRXhwYW5kZWRcbiAgICB9LCAnZHJhd2VyU3RhdGUnKVxuICB9XG59Il0sIm5hbWVzIjpbInN0eWxlRm9yRml4ZWQiLCJoZWlnaHQiLCJsZWZ0Iiwib3ZlcmZsb3ciLCJwb3NpdGlvbiIsIndpZHRoIiwic2Nyb2xsaW5nRWxlbWVudCIsInVhIiwid2luZG93IiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwidG9Mb3dlckNhc2UiLCJkIiwiZG9jdW1lbnQiLCJpbmRleE9mIiwiYm9keSIsImRvY3VtZW50RWxlbWVudCIsImZpeEJhY2tmYWNlIiwiZml4ZWQiLCJzY3JvbGxZIiwic2Nyb2xsVG9wIiwicGFyc2VJbnQiLCJzdHlsZSIsInRvcCIsInNjcm9sbGJhcldpZHRoIiwiaW5uZXJXaWR0aCIsImNsaWVudFdpZHRoIiwicGFkZGluZ1JpZ2h0IiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJrZXkiLCJzZXRQcm9wZXJ0eSIsInJlbW92ZVByb3BlcnR5IiwiRHJhd2VyIiwiY29uc3RydWN0b3IiLCJhcmdzIiwiRGF0ZSIsImdldFRpbWUiLCJkcmF3ZXIiLCJ1bmRlZmluZWQiLCJFcnJvciIsIm5hbWUiLCJkcmF3ZXJFbGVtZW50IiwicXVlcnlTZWxlY3RvciIsInNldEF0dHJpYnV0ZSIsImlkIiwiaXNFeHBhbmRlZCIsInJlbW92ZUF0dHJpYnV0ZSIsInN3aXRjaEVsZW1lbnRzIiwic3dpdGNoIiwicXVlcnlTZWxlY3RvckFsbCIsImVsZW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwidG9nZ2xlIiwiYmluZCIsImluZXJ0RWxlbWVudHMiLCJpbmVydCIsImVuYWJsZUZpeEJhY2tmYWNlIiwiZW5hYmxlSGlzdG9yeSIsIl9wb3BzdGF0ZUhhbmRsZXIiLCJldmVudCIsInByZXZlbnREZWZhdWx0IiwiY2xvc2UiLCJvcGVuIiwiX2NoYW5nZVN0YXRlIiwiX3B1c2hTdGF0ZSIsIl9rZXl1cEhhbmRsZXIiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiU3RyaW5nIiwiaGlzdG9yeSIsInB1c2hTdGF0ZSJdLCJtYXBwaW5ncyI6Ijs7O0lBQUEsTUFBTUEsYUFBYSxHQUVmO0lBQ0ZDLEVBQUFBLE1BQU0sRUFBRSxPQUROO0lBRUZDLEVBQUFBLElBQUksRUFBRSxHQUZKO0lBR0ZDLEVBQUFBLFFBQVEsRUFBRSxRQUhSO0lBSUZDLEVBQUFBLFFBQVEsRUFBRSxPQUpSO0lBS0ZDLEVBQUFBLEtBQUssRUFBRTtJQUxMLENBRko7O0lBVUEsTUFBTUMsZ0JBQWdCLEdBQVksQ0FBQztJQUNqQyxRQUFNQyxFQUFFLEdBQUdDLE1BQU0sQ0FBQ0MsU0FBUCxDQUFpQkMsU0FBakIsQ0FBMkJDLFdBQTNCLEVBQVg7SUFDQSxRQUFNQyxDQUFDLEdBQVlDLFFBQW5CO0lBQ0EsTUFBSSxzQkFBc0JBLFFBQTFCLEVBQW9DLE9BQU9BLFFBQVEsQ0FBQ1AsZ0JBQWhCO0lBQ3BDLE1BQUlDLEVBQUUsQ0FBQ08sT0FBSCxDQUFXLFFBQVgsSUFBdUIsQ0FB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
