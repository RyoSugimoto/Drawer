import 'wicg-inert';

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

export default Drawer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhd2VyLW1vZHVsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL3RzL2ZpeC1iYWNrZmFjZS50cyIsIi4uL3NyYy90cy9kcmF3ZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3Qgc3R5bGVGb3JGaXhlZDoge1xuICBba2V5OiBzdHJpbmddOiBzdHJpbmdcbn0gPSB7XG4gIGhlaWdodDogJzEwMHZoJyxcbiAgbGVmdDogJzAnLFxuICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gIHBvc2l0aW9uOiAnZml4ZWQnLFxuICB3aWR0aDogJzEwMHZ3Jyxcbn1cblxuY29uc3Qgc2Nyb2xsaW5nRWxlbWVudDogRWxlbWVudCA9ICgoKSA9PiB7XG4gIGNvbnN0IHVhID0gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKVxuICBjb25zdCBkOkRvY3VtZW50ID0gZG9jdW1lbnRcbiAgaWYgKCdzY3JvbGxpbmdFbGVtZW50JyBpbiBkb2N1bWVudCkgcmV0dXJuIGRvY3VtZW50LnNjcm9sbGluZ0VsZW1lbnQhXG4gIGlmICh1YS5pbmRleE9mKCd3ZWJraXQnKSA+IDApIHJldHVybiBkLmJvZHkhXG4gIHJldHVybiBkLmRvY3VtZW50RWxlbWVudCFcbn0pKCkhXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGZpeEJhY2tmYWNlKGZpeGVkOiBib29sZWFuKSB7XG4gIGNvbnN0IHNjcm9sbFk6bnVtYmVyID0gZml4ZWQgPyBzY3JvbGxpbmdFbGVtZW50LnNjcm9sbFRvcCA6IHBhcnNlSW50KGRvY3VtZW50LmJvZHkuc3R5bGUudG9wKSA/PyAwXG4gIGNvbnN0IHNjcm9sbGJhcldpZHRoOm51bWJlciA9IHdpbmRvdy5pbm5lcldpZHRoIC0gZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aFxuICBkb2N1bWVudC5ib2R5LnN0eWxlLnRvcCA9IGZpeGVkID8gYC0ke3Njcm9sbGluZ0VsZW1lbnQuc2Nyb2xsVG9wfXB4YCA6ICcnXG4gIGRvY3VtZW50LmJvZHkuc3R5bGUucGFkZGluZ1JpZ2h0ID0gZml4ZWQgPyBgJHtzY3JvbGxiYXJXaWR0aH1weGAgOiAnJ1xuICBPYmplY3Qua2V5cyhzdHlsZUZvckZpeGVkKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgaWYgKGZpeGVkKSB7XG4gICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnNldFByb3BlcnR5KGtleSwgc3R5bGVGb3JGaXhlZFtrZXldKVxuICAgIH0gZWxzZSB7XG4gICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnJlbW92ZVByb3BlcnR5KGtleSlcbiAgICB9XG4gIH0pXG4gIGlmICghZml4ZWQpIHNjcm9sbGluZ0VsZW1lbnQuc2Nyb2xsVG9wID0gc2Nyb2xsWSAqIC0xXG59XG4iLCJpbXBvcnQgZml4QmFja2ZhY2UgZnJvbSAnLi9maXgtYmFja2ZhY2UuanMnXG5pbXBvcnQgJ3dpY2ctaW5lcnQnO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRHJhd2VyIHtcbiAgcHVibGljIGRyYXdlckVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbFxuICBwdWJsaWMgc3dpdGNoRWxlbWVudHM/OiBOb2RlTGlzdE9mPEhUTUxFbGVtZW50PiB8IG51bGxcbiAgcHVibGljIGluZXJ0RWxlbWVudHM/OiBOb2RlTGlzdE9mPEhUTUxFbGVtZW50PiB8IG51bGxcbiAgcHVibGljIGlzRXhwYW5kZWQ6IGJvb2xlYW4gPSBmYWxzZVxuICBwdWJsaWMgZW5hYmxlRml4QmFja2ZhY2U6Ym9vbGVhbiA9IHRydWVcbiAgcHVibGljIGVuYWJsZUhpc3Rvcnk6IGJvb2xlYW4gPSBmYWxzZVxuICBwdWJsaWMgaWQ6IHN0cmluZyA9ICdEcmF3ZXItJyArIG5ldyBEYXRlKCkuZ2V0VGltZSgpXG5cbiAgY29uc3RydWN0b3IoYXJnczoge1xuICAgIGRyYXdlcjogc3RyaW5nXG4gICAgc3dpdGNoPzogc3RyaW5nXG4gICAgaW5lcnQ/OiBzdHJpbmdcbiAgICBlbmFibGVGaXhCYWNrZmFjZT86IGJvb2xlYW5cbiAgICBlbmFibGVIaXN0b3J5PzogYm9vbGVhblxuICB9KSB7XG4gICAgLy8gRHJhd2VyIGJvZHlcbiAgICBpZiAodHlwZW9mIGFyZ3MgIT09ICdvYmplY3QnIHx8IGFyZ3MuZHJhd2VyID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OiBUaGUgXCJkcmF3ZXJcIiBwYXJhbWV0ZXIgaXMgcmVxdWlyZWQuID0+IGV4OiBuZXcgRHJhd2VyKHsgZHJhd2VyOiAnI2RyYXdlcicgfSlgKVxuICAgIGlmICh0eXBlb2YgYXJncy5kcmF3ZXIgIT09ICdzdHJpbmcnIHx8ICcnICkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06IFRoZSBcImRyYXdlclwiIHBhcmFtZXRlciBtdXN0IGJlIFwic3RyaW5nXCIgdHlwZSBhbmQgXCJDU1Mgc2VsZWN0b3JcIi5gKVxuICAgIGlmIChhcmdzLmRyYXdlciA9PT0gJycgKSB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTogVGhlIFwiZHJhd2VyXCIgcGFyYW1ldGVyIGlzIGVtcHR5LmApXG4gICAgdGhpcy5kcmF3ZXJFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihhcmdzLmRyYXdlcilcbiAgICBpZiAoIXRoaXMuZHJhd2VyRWxlbWVudCkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06IFRoZSBFbGVtZW50IGZvciBcImRyYXdlclwiIGlzIG5vdCBmb3VuZC5gKVxuICAgIHRoaXMuZHJhd2VyRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtZHJhd2VyLWlzLWluaXRpYWxpemVkJywgJ3RydWUnKVxuICAgIGlmICh0aGlzLmRyYXdlckVsZW1lbnQuaWQpIHtcbiAgICAgIHRoaXMuaWQgPSB0aGlzLmRyYXdlckVsZW1lbnQuaWRcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50LmlkID0gdGhpcy5pZFxuICAgIH1cbiAgICBpZiAodGhpcy5pc0V4cGFuZGVkKSB7XG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpXG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdoaWRkZW4nKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQuc2V0QXR0cmlidXRlKCdpbmVydCcsICcnKVxuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50LnNldEF0dHJpYnV0ZSgnaGlkZGVuJywgJycpXG4gICAgfVxuXG4gICAgLy8gU3dpdGNoZXMgZm9yIHRvZ2dsZVxuICAgIHRoaXMuc3dpdGNoRWxlbWVudHMgPSB0eXBlb2YgYXJncy5zd2l0Y2ggPT09ICdzdHJpbmcnID9cbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYXJncy5zd2l0Y2gpIDogbnVsbFxuICAgIGlmICh0aGlzLnN3aXRjaEVsZW1lbnRzKSB7XG4gICAgICB0aGlzLnN3aXRjaEVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpKVxuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS1kcmF3ZXItaXMtaW5pdGlhbGl6ZWQnLCAndHJ1ZScpXG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWNvbnRyb2xzJywgdGhpcy5pZClcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gRWxlbWVudHMgdGhhdCBhcmUgc2V0IFwiaW5lcnRcIiBhdHRyaWJ1dGUgd2hlbiB0aGUgZHJhd2VyIGlzIGV4cGFuZGVkXG4gICAgdGhpcy5pbmVydEVsZW1lbnRzID0gdHlwZW9mIGFyZ3MuaW5lcnQgPT09ICdzdHJpbmcnID9cbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYXJncy5pbmVydCkgOiBudWxsXG4gICAgaWYgKHRoaXMuaW5lcnRFbGVtZW50cykge1xuICAgICAgdGhpcy5pbmVydEVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdkYXRhLWRyYXdlci1pcycsICdpbml0aWFsaXplZCcpXG4gICAgICAgIGlmICh0aGlzLmlzRXhwYW5kZWQpIHtcbiAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnaW5lcnQnLCAnJylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnaW5lcnQnKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIFByZXZlbnRpbmcgc2Nyb2xsIHdoZW4gdGhlIGRyYXdlciBpcyBleHBhbmRlZFxuICAgIHRoaXMuZW5hYmxlRml4QmFja2ZhY2UgPSBhcmdzLmVuYWJsZUZpeEJhY2tmYWNlID8/IHRydWVcblxuICAgIC8vIEFkZGluZyB0aGUgc3RhdGUgb2YgdGhlIGRyYXdlciB0byB0aGUgaGlzdG9yeSBvZiB5b3VyIGJyb3dzZXJcbiAgICBpZiAoYXJncy5lbmFibGVIaXN0b3J5KSB7XG4gICAgICB0aGlzLmVuYWJsZUhpc3RvcnkgPSB0cnVlXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncG9wc3RhdGUnLCB0aGlzLl9wb3BzdGF0ZUhhbmRsZXIuYmluZCh0aGlzKSlcbiAgICB9XG5cbiAgfVxuICB0b2dnbGUoZXZlbnQ6IEV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIGlmICh0aGlzLmlzRXhwYW5kZWQpIHtcbiAgICAgIHRoaXMuY2xvc2UoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm9wZW4oKVxuICAgIH1cbiAgfVxuICBvcGVuKCkge1xuICAgIHRoaXMuX2NoYW5nZVN0YXRlKHRydWUpXG4gICAgaWYgKHRoaXMuZW5hYmxlSGlzdG9yeSkgdGhpcy5fcHVzaFN0YXRlKHRydWUpXG4gIH1cbiAgY2xvc2UoKSB7XG4gICAgdGhpcy5fY2hhbmdlU3RhdGUoZmFsc2UpXG4gICAgaWYgKHRoaXMuZW5hYmxlSGlzdG9yeSkgdGhpcy5fcHVzaFN0YXRlKGZhbHNlKVxuICB9XG4gIHByaXZhdGUgX2NoYW5nZVN0YXRlKGlzRXhwYW5kZWQ6IGJvb2xlYW4pIHtcbiAgICBpZiAoaXNFeHBhbmRlZCkge1xuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50Py5yZW1vdmVBdHRyaWJ1dGUoJ2luZXJ0JylcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudD8ucmVtb3ZlQXR0cmlidXRlKCdoaWRkZW4nKVxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9rZXl1cEhhbmRsZXIuYmluZCh0aGlzKSlcblxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBXaGVuIHRoZSBkcmF3ZXIgaXMgaGlkZGVuXG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQ/LnNldEF0dHJpYnV0ZSgnaW5lcnQnLCAnJylcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudD8uc2V0QXR0cmlidXRlKCdoaWRkZW4nLCAnJylcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5fa2V5dXBIYW5kbGVyLmJpbmQodGhpcykpXG4gICAgfVxuXG4gICAgaWYgKCB0eXBlb2YgZml4QmFja2ZhY2UgPT09ICdmdW5jdGlvbicgJiYgdGhpcy5lbmFibGVGaXhCYWNrZmFjZSApIGZpeEJhY2tmYWNlKGlzRXhwYW5kZWQpXG5cbiAgICBpZiAodGhpcy5zd2l0Y2hFbGVtZW50cykge1xuICAgICAgdGhpcy5zd2l0Y2hFbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsIFN0cmluZyhpc0V4cGFuZGVkKSlcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5lcnRFbGVtZW50cykge1xuICAgICAgdGhpcy5pbmVydEVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGlmIChpc0V4cGFuZGVkKSB7XG4gICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2luZXJ0JywgJycpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2luZXJ0JylcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICB0aGlzLmlzRXhwYW5kZWQgPSBpc0V4cGFuZGVkXG4gIH1cbiAgcHJpdmF0ZSBfa2V5dXBIYW5kbGVyKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XG4gICAgaWYgKGV2ZW50LmtleSA9PT0gJ0VzY2FwZScgfHwgZXZlbnQua2V5ID09PSAnRXNjJykgdGhpcy5jbG9zZSgpXG4gIH1cbiAgcHJpdmF0ZSBfcG9wc3RhdGVIYW5kbGVyKGV2ZW50OiBQb3BTdGF0ZUV2ZW50KSB7XG4gICAgdGhpcy5fY2hhbmdlU3RhdGUoIXRoaXMuaXNFeHBhbmRlZCk7XG4gIH1cbiAgcHJpdmF0ZSBfcHVzaFN0YXRlKGlzRXhwYW5kZWQ6IGJvb2xlYW4pIHtcbiAgICBoaXN0b3J5LnB1c2hTdGF0ZSh7XG4gICAgICBpc0V4cGFuZGVkOiBpc0V4cGFuZGVkXG4gICAgfSwgJ2RyYXdlclN0YXRlJylcbiAgfVxufSJdLCJuYW1lcyI6WyJzdHlsZUZvckZpeGVkIiwiaGVpZ2h0IiwibGVmdCIsIm92ZXJmbG93IiwicG9zaXRpb24iLCJ3aWR0aCIsInNjcm9sbGluZ0VsZW1lbnQiLCJ1YSIsIndpbmRvdyIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsInRvTG93ZXJDYXNlIiwiZCIsImRvY3VtZW50IiwiaW5kZXhPZiIsImJvZHkiLCJkb2N1bWVudEVsZW1lbnQiLCJmaXhCYWNrZmFjZSIsImZpeGVkIiwic2Nyb2xsWSIsInNjcm9sbFRvcCIsInBhcnNlSW50Iiwic3R5bGUiLCJ0b3AiLCJzY3JvbGxiYXJXaWR0aCIsImlubmVyV2lkdGgiLCJjbGllbnRXaWR0aCIsInBhZGRpbmdSaWdodCIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwia2V5Iiwic2V0UHJvcGVydHkiLCJyZW1vdmVQcm9wZXJ0eSIsIkRyYXdlciIsImNvbnN0cnVjdG9yIiwiYXJncyIsIkRhdGUiLCJnZXRUaW1lIiwiZHJhd2VyIiwidW5kZWZpbmVkIiwiRXJyb3IiLCJuYW1lIiwiZHJhd2VyRWxlbWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJzZXRBdHRyaWJ1dGUiLCJpZCIsImlzRXhwYW5kZWQiLCJyZW1vdmVBdHRyaWJ1dGUiLCJzd2l0Y2hFbGVtZW50cyIsInN3aXRjaCIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJlbGVtZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsInRvZ2dsZSIsImJpbmQiLCJpbmVydEVsZW1lbnRzIiwiaW5lcnQiLCJlbmFibGVGaXhCYWNrZmFjZSIsImVuYWJsZUhpc3RvcnkiLCJfcG9wc3RhdGVIYW5kbGVyIiwiZXZlbnQiLCJwcmV2ZW50RGVmYXVsdCIsImNsb3NlIiwib3BlbiIsIl9jaGFuZ2VTdGF0ZSIsIl9wdXNoU3RhdGUiLCJfa2V5dXBIYW5kbGVyIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsIlN0cmluZyIsImhpc3RvcnkiLCJwdXNoU3RhdGUiXSwibWFwcGluZ3MiOiI7O0FBQUEsTUFBTUEsYUFBYSxHQUVmO0FBQ0ZDLEVBQUFBLE1BQU0sRUFBRSxPQUROO0FBRUZDLEVBQUFBLElBQUksRUFBRSxHQUZKO0FBR0ZDLEVBQUFBLFFBQVEsRUFBRSxRQUhSO0FBSUZDLEVBQUFBLFFBQVEsRUFBRSxPQUpSO0FBS0ZDLEVBQUFBLEtBQUssRUFBRTtBQUxMLENBRko7O0FBVUEsTUFBTUMsZ0JBQWdCLEdBQVksQ0FBQztBQUNqQyxRQUFNQyxFQUFFLEdBQUdDLE1BQU0sQ0FBQ0MsU0FBUCxDQUFpQkMsU0FBakIsQ0FBMkJDLFdBQTNCLEVBQVg7QUFDQSxRQUFNQyxDQUFDLEdBQVlDLFFBQW5CO0FBQ0EsTUFBSSxzQkFBc0JBLFFBQTFCLEVBQW9DLE9BQU9BLFFBQVEsQ0FBQ1AsZ0JBQWhCO0FBQ3BDLE1BQUlDLEVBQUUsQ0FBQ08sT0FBSCxDQUFXLFFBQVgsSUFB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
