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
        this.drawerElement.setAttribute('aria-expanded', String(this.isExpanded));
        this.drawerElement.setAttribute('data-drawer-is', 'initialized'); // console.log( this.id )

        if (this.drawerElement.id) {
          this.id = this.drawerElement.id;
        } else {
          this.drawerElement.id = this.id;
        }

        this.isExpanded ? this.drawerElement.removeAttribute('inert') : this.drawerElement.setAttribute('inert', ''); // Switches for toggle

        this.switchElements = typeof args.switch === 'string' ? document.querySelectorAll(args.switch) : null;

        if (this.switchElements) {
          this.switchElements.forEach(element => {
            element.addEventListener('click', this.toggle.bind(this));
            element.setAttribute('data-drawer-is', 'initialized');
            element.setAttribute('aria-hidden', String(!this.isExpanded));
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
        var _this$drawerElement3;

        if (isExpanded) {
          var _this$drawerElement;

          (_this$drawerElement = this.drawerElement) === null || _this$drawerElement === void 0 ? void 0 : _this$drawerElement.removeAttribute('inert');
          document.addEventListener('keyup', this._keyupHandler.bind(this));
        } else {
          var _this$drawerElement2;

          (_this$drawerElement2 = this.drawerElement) === null || _this$drawerElement2 === void 0 ? void 0 : _this$drawerElement2.setAttribute('inert', '');
          document.removeEventListener('keyup', this._keyupHandler.bind(this));
        }

        if (typeof fixBackface === 'function' && this.enableFixBackface) fixBackface(isExpanded);
        (_this$drawerElement3 = this.drawerElement) === null || _this$drawerElement3 === void 0 ? void 0 : _this$drawerElement3.setAttribute('aria-hidden', String(!isExpanded));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhd2VyLmpzIiwic291cmNlcyI6WyIuLi9zcmMvdHMvZml4LWJhY2tmYWNlLnRzIiwiLi4vc3JjL3RzL2RyYXdlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBzdHlsZUZvckZpeGVkOiB7XG4gIFtrZXk6IHN0cmluZ106IHN0cmluZ1xufSA9IHtcbiAgaGVpZ2h0OiAnMTAwdmgnLFxuICBsZWZ0OiAnMCcsXG4gIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgcG9zaXRpb246ICdmaXhlZCcsXG4gIHdpZHRoOiAnMTAwdncnLFxufVxuXG5jb25zdCBzY3JvbGxpbmdFbGVtZW50OiBFbGVtZW50ID0gKCgpID0+IHtcbiAgY29uc3QgdWEgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpXG4gIGlmICgnc2Nyb2xsaW5nRWxlbWVudCcgaW4gZG9jdW1lbnQpIHJldHVybiBkb2N1bWVudC5zY3JvbGxpbmdFbGVtZW50IVxuICBpZiAodWEuaW5kZXhPZignd2Via2l0JykgPiAwKSByZXR1cm4gZG9jdW1lbnQuYm9keSFcbiAgcmV0dXJuIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCFcbn0pKCkhXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGZpeEJhY2tmYWNlKGZpeGVkOiBib29sZWFuKSB7XG4gIGNvbnN0IHNjcm9sbFk6bnVtYmVyID0gZml4ZWQgPyBzY3JvbGxpbmdFbGVtZW50LnNjcm9sbFRvcCA6IHBhcnNlSW50KGRvY3VtZW50LmJvZHkuc3R5bGUudG9wKSA/PyAwXG4gIGNvbnN0IHNjcm9sbGJhcldpZHRoOm51bWJlciA9IHdpbmRvdy5pbm5lcldpZHRoIC0gZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aFxuICBkb2N1bWVudC5ib2R5LnN0eWxlLnRvcCA9IGZpeGVkID8gYC0ke3Njcm9sbGluZ0VsZW1lbnQuc2Nyb2xsVG9wfXB4YCA6ICcnXG4gIGRvY3VtZW50LmJvZHkuc3R5bGUucGFkZGluZ1JpZ2h0ID0gZml4ZWQgPyBgJHtzY3JvbGxiYXJXaWR0aH1weGAgOiAnJ1xuICBPYmplY3Qua2V5cyhzdHlsZUZvckZpeGVkKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgaWYgKGZpeGVkKSB7XG4gICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnNldFByb3BlcnR5KGtleSwgc3R5bGVGb3JGaXhlZFtrZXldKVxuICAgIH0gZWxzZSB7XG4gICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnJlbW92ZVByb3BlcnR5KGtleSlcbiAgICB9XG4gIH0pXG4gIGlmICghZml4ZWQpIHNjcm9sbGluZ0VsZW1lbnQuc2Nyb2xsVG9wID0gc2Nyb2xsWSAqIC0xXG59XG4iLCJpbXBvcnQgZml4QmFja2ZhY2UgZnJvbSAnLi9maXgtYmFja2ZhY2UuanMnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERyYXdlciB7XG4gIHB1YmxpYyBkcmF3ZXJFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGxcbiAgcHVibGljIHN3aXRjaEVsZW1lbnRzPzogTm9kZUxpc3RPZjxIVE1MRWxlbWVudD4gfCBudWxsXG4gIHB1YmxpYyBpbmVydEVsZW1lbnRzPzogTm9kZUxpc3RPZjxIVE1MRWxlbWVudD4gfCBudWxsXG4gIHB1YmxpYyBpc0V4cGFuZGVkOiBib29sZWFuID0gZmFsc2VcbiAgcHVibGljIGVuYWJsZUZpeEJhY2tmYWNlOmJvb2xlYW4gPSB0cnVlXG4gIHB1YmxpYyBlbmFibGVIaXN0b3J5OiBib29sZWFuID0gZmFsc2VcbiAgcHVibGljIGlkOiBzdHJpbmcgPSAnRHJhd2VyLScgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKVxuXG4gIGNvbnN0cnVjdG9yKGFyZ3M6IHtcbiAgICBkcmF3ZXI6IHN0cmluZ1xuICAgIHN3aXRjaD86IHN0cmluZ1xuICAgIGluZXJ0Pzogc3RyaW5nXG4gICAgZW5hYmxlRml4QmFja2ZhY2U/OiBib29sZWFuXG4gICAgZW5hYmxlSGlzdG9yeT86IGJvb2xlYW5cbiAgfSkge1xuICAgIC8vIERyYXdlciBib2R5XG4gICAgaWYgKHR5cGVvZiBhcmdzICE9PSAnb2JqZWN0JyB8fCBhcmdzLmRyYXdlciA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTogVGhlIFwiZHJhd2VyXCIgcGFyYW1ldGVyIGlzIHJlcXVpcmVkLiA9PiBleDogbmV3IERyYXdlcih7IGRyYXdlcjogJyNkcmF3ZXInIH0pYClcbiAgICBpZiAodHlwZW9mIGFyZ3MuZHJhd2VyICE9PSAnc3RyaW5nJyB8fCAnJyApIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OiBUaGUgXCJkcmF3ZXJcIiBwYXJhbWV0ZXIgbXVzdCBiZSBcInN0cmluZ1wiIHR5cGUgYW5kIFwiQ1NTIHNlbGVjdG9yXCIuYClcbiAgICBpZiAoYXJncy5kcmF3ZXIgPT09ICcnICkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06IFRoZSBcImRyYXdlclwiIHBhcmFtZXRlciBpcyBlbXB0eS5gKVxuICAgIHRoaXMuZHJhd2VyRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYXJncy5kcmF3ZXIpXG4gICAgaWYgKCF0aGlzLmRyYXdlckVsZW1lbnQpIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OiBUaGUgRWxlbWVudCBmb3IgXCJkcmF3ZXJcIiBpcyBub3QgZm91bmQuYClcbiAgICB0aGlzLmRyYXdlckVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgU3RyaW5nKHRoaXMuaXNFeHBhbmRlZCkpXG4gICAgdGhpcy5kcmF3ZXJFbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS1kcmF3ZXItaXMnLCAnaW5pdGlhbGl6ZWQnKVxuICAgIC8vIGNvbnNvbGUubG9nKCB0aGlzLmlkIClcbiAgICBpZiAodGhpcy5kcmF3ZXJFbGVtZW50LmlkKSB7XG4gICAgICB0aGlzLmlkID0gdGhpcy5kcmF3ZXJFbGVtZW50LmlkXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudC5pZCA9IHRoaXMuaWRcbiAgICB9XG4gICAgdGhpcy5pc0V4cGFuZGVkID8gdGhpcy5kcmF3ZXJFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnaW5lcnQnKSA6IHRoaXMuZHJhd2VyRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2luZXJ0JywgJycpXG5cbiAgICAvLyBTd2l0Y2hlcyBmb3IgdG9nZ2xlXG4gICAgdGhpcy5zd2l0Y2hFbGVtZW50cyA9IHR5cGVvZiBhcmdzLnN3aXRjaCA9PT0gJ3N0cmluZycgP1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChhcmdzLnN3aXRjaCkgOiBudWxsXG4gICAgaWYgKHRoaXMuc3dpdGNoRWxlbWVudHMpIHtcbiAgICAgIHRoaXMuc3dpdGNoRWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlLmJpbmQodGhpcykpXG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdkYXRhLWRyYXdlci1pcycsICdpbml0aWFsaXplZCcpXG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsIFN0cmluZyghdGhpcy5pc0V4cGFuZGVkKSlcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnLCB0aGlzLmlkKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyBFbGVtZW50cyB0aGF0IGFyZSBzZXQgXCJpbmVydFwiIGF0dHJpYnV0ZSB3aGVuIHRoZSBkcmF3ZXIgaXMgZXhwYW5kZWRcbiAgICB0aGlzLmluZXJ0RWxlbWVudHMgPSB0eXBlb2YgYXJncy5pbmVydCA9PT0gJ3N0cmluZycgP1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChhcmdzLmluZXJ0KSA6IG51bGxcbiAgICBpZiAodGhpcy5pbmVydEVsZW1lbnRzKSB7XG4gICAgICB0aGlzLmluZXJ0RWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtZHJhd2VyLWlzJywgJ2luaXRpYWxpemVkJylcbiAgICAgICAgaWYgKHRoaXMuaXNFeHBhbmRlZCkge1xuICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdpbmVydCcsICcnKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gUHJldmVudGluZyBzY3JvbGwgd2hlbiB0aGUgZHJhd2VyIGlzIGV4cGFuZGVkXG4gICAgdGhpcy5lbmFibGVGaXhCYWNrZmFjZSA9IGFyZ3MuZW5hYmxlRml4QmFja2ZhY2UgPz8gdHJ1ZVxuXG4gICAgLy8gQWRkaW5nIHRoZSBzdGF0ZSBvZiB0aGUgZHJhd2VyIHRvIHRoZSBoaXN0b3J5IG9mIHlvdXIgYnJvd3NlclxuICAgIGlmIChhcmdzLmVuYWJsZUhpc3RvcnkpIHtcbiAgICAgIHRoaXMuZW5hYmxlSGlzdG9yeSA9IHRydWVcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIHRoaXMuX3BvcHN0YXRlSGFuZGxlci5iaW5kKHRoaXMpKVxuICAgIH1cblxuXG4gIH1cbiAgdG9nZ2xlKGV2ZW50OiBFdmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICBpZiAodGhpcy5pc0V4cGFuZGVkKSB7XG4gICAgICB0aGlzLmNsb3NlKClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5vcGVuKClcbiAgICB9XG4gIH1cbiAgb3BlbigpIHtcbiAgICB0aGlzLl9jaGFuZ2VTdGF0ZSh0cnVlKVxuICAgIGlmICh0aGlzLmVuYWJsZUhpc3RvcnkpIHRoaXMuX3B1c2hTdGF0ZSh0cnVlKVxuICB9XG4gIGNsb3NlKCkge1xuICAgIHRoaXMuX2NoYW5nZVN0YXRlKGZhbHNlKVxuICAgIGlmICh0aGlzLmVuYWJsZUhpc3RvcnkpIHRoaXMuX3B1c2hTdGF0ZShmYWxzZSlcbiAgfVxuICBwcml2YXRlIF9jaGFuZ2VTdGF0ZShpc0V4cGFuZGVkOiBib29sZWFuKSB7XG4gICAgaWYgKGlzRXhwYW5kZWQpIHtcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudD8ucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX2tleXVwSGFuZGxlci5iaW5kKHRoaXMpKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQ/LnNldEF0dHJpYnV0ZSgnaW5lcnQnLCAnJylcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5fa2V5dXBIYW5kbGVyLmJpbmQodGhpcykpXG4gICAgfVxuXG4gICAgaWYgKCB0eXBlb2YgZml4QmFja2ZhY2UgPT09ICdmdW5jdGlvbicgJiYgdGhpcy5lbmFibGVGaXhCYWNrZmFjZSApIGZpeEJhY2tmYWNlKGlzRXhwYW5kZWQpXG5cbiAgICB0aGlzLmRyYXdlckVsZW1lbnQ/LnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCBTdHJpbmcoIWlzRXhwYW5kZWQpKVxuXG4gICAgaWYgKHRoaXMuc3dpdGNoRWxlbWVudHMpIHtcbiAgICAgIHRoaXMuc3dpdGNoRWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCBTdHJpbmcoaXNFeHBhbmRlZCkpXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmICh0aGlzLmluZXJ0RWxlbWVudHMpIHtcbiAgICAgIHRoaXMuaW5lcnRFbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBpZiAoaXNFeHBhbmRlZCkge1xuICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdpbmVydCcsICcnKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgdGhpcy5pc0V4cGFuZGVkID0gaXNFeHBhbmRlZFxuICB9XG4gIHByaXZhdGUgX2tleXVwSGFuZGxlcihldmVudDogS2V5Ym9hcmRFdmVudCkge1xuICAgIGlmIChldmVudC5rZXkgPT09ICdFc2NhcGUnIHx8IGV2ZW50LmtleSA9PT0gJ0VzYycpIHRoaXMuY2xvc2UoKVxuICB9XG4gIHByaXZhdGUgX3BvcHN0YXRlSGFuZGxlcihldmVudDogUG9wU3RhdGVFdmVudCkge1xuICAgIHRoaXMuX2NoYW5nZVN0YXRlKCF0aGlzLmlzRXhwYW5kZWQpO1xuICB9XG4gIHByaXZhdGUgX3B1c2hTdGF0ZShpc0V4cGFuZGVkOiBib29sZWFuKSB7XG4gICAgaGlzdG9yeS5wdXNoU3RhdGUoe1xuICAgICAgaXNFeHBhbmRlZDogaXNFeHBhbmRlZFxuICAgIH0sICdkcmF3ZXJTdGF0ZScpXG4gIH1cbn0iXSwibmFtZXMiOlsic3R5bGVGb3JGaXhlZCIsImhlaWdodCIsImxlZnQiLCJvdmVyZmxvdyIsInBvc2l0aW9uIiwid2lkdGgiLCJzY3JvbGxpbmdFbGVtZW50IiwidWEiLCJ3aW5kb3ciLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJ0b0xvd2VyQ2FzZSIsImRvY3VtZW50IiwiaW5kZXhPZiIsImJvZHkiLCJkb2N1bWVudEVsZW1lbnQiLCJmaXhCYWNrZmFjZSIsImZpeGVkIiwic2Nyb2xsWSIsInNjcm9sbFRvcCIsInBhcnNlSW50Iiwic3R5bGUiLCJ0b3AiLCJzY3JvbGxiYXJXaWR0aCIsImlubmVyV2lkdGgiLCJjbGllbnRXaWR0aCIsInBhZGRpbmdSaWdodCIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwia2V5Iiwic2V0UHJvcGVydHkiLCJyZW1vdmVQcm9wZXJ0eSIsIkRyYXdlciIsImNvbnN0cnVjdG9yIiwiYXJncyIsIkRhdGUiLCJnZXRUaW1lIiwiZHJhd2VyIiwidW5kZWZpbmVkIiwiRXJyb3IiLCJuYW1lIiwiZHJhd2VyRWxlbWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJzZXRBdHRyaWJ1dGUiLCJTdHJpbmciLCJpc0V4cGFuZGVkIiwiaWQiLCJyZW1vdmVBdHRyaWJ1dGUiLCJzd2l0Y2hFbGVtZW50cyIsInN3aXRjaCIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJlbGVtZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsInRvZ2dsZSIsImJpbmQiLCJpbmVydEVsZW1lbnRzIiwiaW5lcnQiLCJlbmFibGVGaXhCYWNrZmFjZSIsImVuYWJsZUhpc3RvcnkiLCJfcG9wc3RhdGVIYW5kbGVyIiwiZXZlbnQiLCJwcmV2ZW50RGVmYXVsdCIsImNsb3NlIiwib3BlbiIsIl9jaGFuZ2VTdGF0ZSIsIl9wdXNoU3RhdGUiLCJfa2V5dXBIYW5kbGVyIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImhpc3RvcnkiLCJwdXNoU3RhdGUiXSwibWFwcGluZ3MiOiI7OztJQUFBLE1BQU1BLGFBQWEsR0FFZjtJQUNGQyxFQUFBQSxNQUFNLEVBQUUsT0FETjtJQUVGQyxFQUFBQSxJQUFJLEVBQUUsR0FGSjtJQUdGQyxFQUFBQSxRQUFRLEVBQUUsUUFIUjtJQUlGQyxFQUFBQSxRQUFRLEVBQUUsT0FKUjtJQUtGQyxFQUFBQSxLQUFLLEVBQUU7SUFMTCxDQUZKOztJQVVBLE1BQU1DLGdCQUFnQixHQUFZLENBQUM7SUFDakMsUUFBTUMsRUFBRSxHQUFHQyxNQUFNLENBQUNDLFNBQVAsQ0FBaUJDLFNBQWpCLENBQTJCQyxXQUEzQixFQUFYO0lBQ0EsTUFBSSxzQkFBc0JDLFFBQTFCLEVBQW9DLE9BQU9BLFFBQVEsQ0FBQ04sZ0JBQWhCO0lBQ3BDLE1BQUlDLEVBQUUsQ0FBQ00sT0FBSCxDQUFXLFFBQVgsSUFBdUIsQ0FBM0IsRUFBOEIsT0FBT0QsUUFBUSxDQUFDRSxJQUFoQjtJQUM5QixTQUFPRixRQUFRLENBQUNHLGVBQWhCO0lBQ0QsQ0FMaUMsR0FBbEM7O2FBT3dCQyxZQUFZQztJQUNsQyxRQUFNQyxPQUFP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
