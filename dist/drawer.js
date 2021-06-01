var Drawer = (function () {
    'use strict';

    const styleForFixed = {
        height: '100vh',
        left: '0',
        overflow: 'hidden',
        position: 'fixed',
        width: '100vw',
    };
    const scrollingElement = (() => {
        const ua = window.navigator.userAgent.toLowerCase();
        if ('scrollingElement' in document)
            return document.scrollingElement;
        if (ua.indexOf('webkit') > 0)
            return document.body;
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
            }
            else {
                document.body.style.removeProperty(key);
            }
        });
        if (!fixed)
            scrollingElement.scrollTop = scrollY * -1;
    }

    class Drawer {
        constructor(args) {
            this.isExpanded = false;
            this.enableFixBackface = true;
            this.enableHistory = false;
            this.id = 'Drawer-' + new Date().getTime();
            // Drawer body
            if (typeof args !== 'object' || args.drawer === undefined)
                throw new Error(`${this.constructor.name}: The "drawer" parameter is required. => ex: new Drawer({ drawer: '#drawer' })`);
            if (typeof args.drawer !== 'string' || '')
                throw new Error(`${this.constructor.name}: The "drawer" parameter must be "string" type and "CSS selector".`);
            if (args.drawer === '')
                throw new Error(`${this.constructor.name}: The "drawer" parameter is empty.`);
            this.drawerElement = document.querySelector(args.drawer);
            if (!this.drawerElement)
                throw new Error(`${this.constructor.name}: The Element for "drawer" is not found.`);
            this.drawerElement.setAttribute('aria-expanded', String(this.isExpanded));
            this.drawerElement.setAttribute('data-drawer-is', 'initialized');
            // console.log( this.id )
            if (this.drawerElement.id) {
                this.id = this.drawerElement.id;
            }
            else {
                this.drawerElement.id = this.id;
            }
            this.isExpanded ? this.drawerElement.removeAttribute('inert') : this.drawerElement.setAttribute('inert', '');
            // Switches for toggle
            this.switchElements = typeof args.switch === 'string' ?
                document.querySelectorAll(args.switch) : null;
            if (this.switchElements) {
                this.switchElements.forEach(element => {
                    element.addEventListener('click', this.toggle.bind(this));
                    element.setAttribute('data-drawer-is', 'initialized');
                    element.setAttribute('aria-hidden', String(!this.isExpanded));
                    element.setAttribute('aria-controls', this.id);
                });
            }
            // Elements that are set "inert" attribute when the drawer is expanded
            this.inertElements = typeof args.inert === 'string' ?
                document.querySelectorAll(args.inert) : null;
            if (this.inertElements) {
                this.inertElements.forEach(element => {
                    element.setAttribute('data-drawer-is', 'initialized');
                    if (this.isExpanded) {
                        element.setAttribute('inert', '');
                    }
                    else {
                        element.removeAttribute('inert');
                    }
                });
            }
            // Preventing scroll when the drawer is expanded
            this.enableFixBackface = args.enableFixBackface ?? true;
            // Adding the state of the drawer to the history of your browser
            if (args.enableHistory) {
                this.enableHistory = true;
                window.addEventListener('popstate', this._popstateHandler.bind(this));
            }
        }
        toggle(event) {
            event.preventDefault();
            if (this.isExpanded) {
                this.close();
            }
            else {
                this.open();
            }
        }
        open() {
            this._changeState(true);
            if (this.enableHistory)
                this._pushState(true);
        }
        close() {
            this._changeState(false);
            if (this.enableHistory)
                this._pushState(false);
        }
        _changeState(isExpanded) {
            if (isExpanded) {
                this.drawerElement?.removeAttribute('inert');
                document.addEventListener('keyup', this._keyupHandler.bind(this));
            }
            else {
                this.drawerElement?.setAttribute('inert', '');
                document.removeEventListener('keyup', this._keyupHandler.bind(this));
            }
            if (typeof fixBackface === 'function' && this.enableFixBackface)
                fixBackface(isExpanded);
            this.drawerElement?.setAttribute('aria-hidden', String(!isExpanded));
            if (this.switchElements) {
                this.switchElements.forEach(element => {
                    element.setAttribute('aria-expanded', String(isExpanded));
                });
            }
            if (this.inertElements) {
                this.inertElements.forEach(element => {
                    if (isExpanded) {
                        element.setAttribute('inert', '');
                    }
                    else {
                        element.removeAttribute('inert');
                    }
                });
            }
            this.isExpanded = isExpanded;
        }
        _keyupHandler(event) {
            if (event.key === 'Escape' || event.key === 'Esc')
                this.close();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhd2VyLmpzIiwic291cmNlcyI6WyIuLi9zcmMvdHMvZml4LWJhY2tmYWNlLnRzIiwiLi4vc3JjL3RzL2RyYXdlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBzdHlsZUZvckZpeGVkOiB7XG4gIFtrZXk6IHN0cmluZ106IHN0cmluZ1xufSA9IHtcbiAgaGVpZ2h0OiAnMTAwdmgnLFxuICBsZWZ0OiAnMCcsXG4gIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgcG9zaXRpb246ICdmaXhlZCcsXG4gIHdpZHRoOiAnMTAwdncnLFxufVxuXG5jb25zdCBzY3JvbGxpbmdFbGVtZW50OiBFbGVtZW50ID0gKCgpID0+IHtcbiAgY29uc3QgdWEgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpXG4gIGlmICgnc2Nyb2xsaW5nRWxlbWVudCcgaW4gZG9jdW1lbnQpIHJldHVybiBkb2N1bWVudC5zY3JvbGxpbmdFbGVtZW50IVxuICBpZiAodWEuaW5kZXhPZignd2Via2l0JykgPiAwKSByZXR1cm4gZG9jdW1lbnQuYm9keSFcbiAgcmV0dXJuIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCFcbn0pKCkhXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGZpeEJhY2tmYWNlKGZpeGVkOiBib29sZWFuKSB7XG4gIGNvbnN0IHNjcm9sbFk6bnVtYmVyID0gZml4ZWQgPyBzY3JvbGxpbmdFbGVtZW50LnNjcm9sbFRvcCA6IHBhcnNlSW50KGRvY3VtZW50LmJvZHkuc3R5bGUudG9wKSA/PyAwXG4gIGNvbnN0IHNjcm9sbGJhcldpZHRoOm51bWJlciA9IHdpbmRvdy5pbm5lcldpZHRoIC0gZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aFxuICBkb2N1bWVudC5ib2R5LnN0eWxlLnRvcCA9IGZpeGVkID8gYC0ke3Njcm9sbGluZ0VsZW1lbnQuc2Nyb2xsVG9wfXB4YCA6ICcnXG4gIGRvY3VtZW50LmJvZHkuc3R5bGUucGFkZGluZ1JpZ2h0ID0gZml4ZWQgPyBgJHtzY3JvbGxiYXJXaWR0aH1weGAgOiAnJ1xuICBPYmplY3Qua2V5cyhzdHlsZUZvckZpeGVkKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgaWYgKGZpeGVkKSB7XG4gICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnNldFByb3BlcnR5KGtleSwgc3R5bGVGb3JGaXhlZFtrZXldKVxuICAgIH0gZWxzZSB7XG4gICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnJlbW92ZVByb3BlcnR5KGtleSlcbiAgICB9XG4gIH0pXG4gIGlmICghZml4ZWQpIHNjcm9sbGluZ0VsZW1lbnQuc2Nyb2xsVG9wID0gc2Nyb2xsWSAqIC0xXG59XG4iLCJpbXBvcnQgZml4QmFja2ZhY2UgZnJvbSAnLi9maXgtYmFja2ZhY2UuanMnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERyYXdlciB7XG4gIHB1YmxpYyBkcmF3ZXJFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGxcbiAgcHVibGljIHN3aXRjaEVsZW1lbnRzPzogTm9kZUxpc3RPZjxIVE1MRWxlbWVudD4gfCBudWxsXG4gIHB1YmxpYyBpbmVydEVsZW1lbnRzPzogTm9kZUxpc3RPZjxIVE1MRWxlbWVudD4gfCBudWxsXG4gIHB1YmxpYyBpc0V4cGFuZGVkOiBib29sZWFuID0gZmFsc2VcbiAgcHVibGljIGVuYWJsZUZpeEJhY2tmYWNlOmJvb2xlYW4gPSB0cnVlXG4gIHB1YmxpYyBlbmFibGVIaXN0b3J5OiBib29sZWFuID0gZmFsc2VcbiAgcHVibGljIGlkOiBzdHJpbmcgPSAnRHJhd2VyLScgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKVxuXG4gIGNvbnN0cnVjdG9yKGFyZ3M6IHtcbiAgICBkcmF3ZXI6IHN0cmluZ1xuICAgIHN3aXRjaD86IHN0cmluZ1xuICAgIGluZXJ0Pzogc3RyaW5nXG4gICAgZW5hYmxlRml4QmFja2ZhY2U/OiBib29sZWFuXG4gICAgZW5hYmxlSGlzdG9yeT86IGJvb2xlYW5cbiAgfSkge1xuICAgIC8vIERyYXdlciBib2R5XG4gICAgaWYgKHR5cGVvZiBhcmdzICE9PSAnb2JqZWN0JyB8fCBhcmdzLmRyYXdlciA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTogVGhlIFwiZHJhd2VyXCIgcGFyYW1ldGVyIGlzIHJlcXVpcmVkLiA9PiBleDogbmV3IERyYXdlcih7IGRyYXdlcjogJyNkcmF3ZXInIH0pYClcbiAgICBpZiAodHlwZW9mIGFyZ3MuZHJhd2VyICE9PSAnc3RyaW5nJyB8fCAnJyApIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OiBUaGUgXCJkcmF3ZXJcIiBwYXJhbWV0ZXIgbXVzdCBiZSBcInN0cmluZ1wiIHR5cGUgYW5kIFwiQ1NTIHNlbGVjdG9yXCIuYClcbiAgICBpZiAoYXJncy5kcmF3ZXIgPT09ICcnICkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06IFRoZSBcImRyYXdlclwiIHBhcmFtZXRlciBpcyBlbXB0eS5gKVxuICAgIHRoaXMuZHJhd2VyRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYXJncy5kcmF3ZXIpXG4gICAgaWYgKCF0aGlzLmRyYXdlckVsZW1lbnQpIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OiBUaGUgRWxlbWVudCBmb3IgXCJkcmF3ZXJcIiBpcyBub3QgZm91bmQuYClcbiAgICB0aGlzLmRyYXdlckVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgU3RyaW5nKHRoaXMuaXNFeHBhbmRlZCkpXG4gICAgdGhpcy5kcmF3ZXJFbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS1kcmF3ZXItaXMnLCAnaW5pdGlhbGl6ZWQnKVxuICAgIC8vIGNvbnNvbGUubG9nKCB0aGlzLmlkIClcbiAgICBpZiAodGhpcy5kcmF3ZXJFbGVtZW50LmlkKSB7XG4gICAgICB0aGlzLmlkID0gdGhpcy5kcmF3ZXJFbGVtZW50LmlkXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudC5pZCA9IHRoaXMuaWRcbiAgICB9XG4gICAgdGhpcy5pc0V4cGFuZGVkID8gdGhpcy5kcmF3ZXJFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnaW5lcnQnKSA6IHRoaXMuZHJhd2VyRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2luZXJ0JywgJycpXG5cbiAgICAvLyBTd2l0Y2hlcyBmb3IgdG9nZ2xlXG4gICAgdGhpcy5zd2l0Y2hFbGVtZW50cyA9IHR5cGVvZiBhcmdzLnN3aXRjaCA9PT0gJ3N0cmluZycgP1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChhcmdzLnN3aXRjaCkgOiBudWxsXG4gICAgaWYgKHRoaXMuc3dpdGNoRWxlbWVudHMpIHtcbiAgICAgIHRoaXMuc3dpdGNoRWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlLmJpbmQodGhpcykpXG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdkYXRhLWRyYXdlci1pcycsICdpbml0aWFsaXplZCcpXG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsIFN0cmluZyghdGhpcy5pc0V4cGFuZGVkKSlcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnLCB0aGlzLmlkKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyBFbGVtZW50cyB0aGF0IGFyZSBzZXQgXCJpbmVydFwiIGF0dHJpYnV0ZSB3aGVuIHRoZSBkcmF3ZXIgaXMgZXhwYW5kZWRcbiAgICB0aGlzLmluZXJ0RWxlbWVudHMgPSB0eXBlb2YgYXJncy5pbmVydCA9PT0gJ3N0cmluZycgP1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChhcmdzLmluZXJ0KSA6IG51bGxcbiAgICBpZiAodGhpcy5pbmVydEVsZW1lbnRzKSB7XG4gICAgICB0aGlzLmluZXJ0RWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtZHJhd2VyLWlzJywgJ2luaXRpYWxpemVkJylcbiAgICAgICAgaWYgKHRoaXMuaXNFeHBhbmRlZCkge1xuICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdpbmVydCcsICcnKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gUHJldmVudGluZyBzY3JvbGwgd2hlbiB0aGUgZHJhd2VyIGlzIGV4cGFuZGVkXG4gICAgdGhpcy5lbmFibGVGaXhCYWNrZmFjZSA9IGFyZ3MuZW5hYmxlRml4QmFja2ZhY2UgPz8gdHJ1ZVxuXG4gICAgLy8gQWRkaW5nIHRoZSBzdGF0ZSBvZiB0aGUgZHJhd2VyIHRvIHRoZSBoaXN0b3J5IG9mIHlvdXIgYnJvd3NlclxuICAgIGlmIChhcmdzLmVuYWJsZUhpc3RvcnkpIHtcbiAgICAgIHRoaXMuZW5hYmxlSGlzdG9yeSA9IHRydWVcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIHRoaXMuX3BvcHN0YXRlSGFuZGxlci5iaW5kKHRoaXMpKVxuICAgIH1cblxuXG4gIH1cbiAgdG9nZ2xlKGV2ZW50OiBFdmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICBpZiAodGhpcy5pc0V4cGFuZGVkKSB7XG4gICAgICB0aGlzLmNsb3NlKClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5vcGVuKClcbiAgICB9XG4gIH1cbiAgb3BlbigpIHtcbiAgICB0aGlzLl9jaGFuZ2VTdGF0ZSh0cnVlKVxuICAgIGlmICh0aGlzLmVuYWJsZUhpc3RvcnkpIHRoaXMuX3B1c2hTdGF0ZSh0cnVlKVxuICB9XG4gIGNsb3NlKCkge1xuICAgIHRoaXMuX2NoYW5nZVN0YXRlKGZhbHNlKVxuICAgIGlmICh0aGlzLmVuYWJsZUhpc3RvcnkpIHRoaXMuX3B1c2hTdGF0ZShmYWxzZSlcbiAgfVxuICBwcml2YXRlIF9jaGFuZ2VTdGF0ZShpc0V4cGFuZGVkOiBib29sZWFuKSB7XG4gICAgaWYgKGlzRXhwYW5kZWQpIHtcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudD8ucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX2tleXVwSGFuZGxlci5iaW5kKHRoaXMpKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQ/LnNldEF0dHJpYnV0ZSgnaW5lcnQnLCAnJylcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5fa2V5dXBIYW5kbGVyLmJpbmQodGhpcykpXG4gICAgfVxuXG4gICAgaWYgKCB0eXBlb2YgZml4QmFja2ZhY2UgPT09ICdmdW5jdGlvbicgJiYgdGhpcy5lbmFibGVGaXhCYWNrZmFjZSApIGZpeEJhY2tmYWNlKGlzRXhwYW5kZWQpXG5cbiAgICB0aGlzLmRyYXdlckVsZW1lbnQ/LnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCBTdHJpbmcoIWlzRXhwYW5kZWQpKVxuXG4gICAgaWYgKHRoaXMuc3dpdGNoRWxlbWVudHMpIHtcbiAgICAgIHRoaXMuc3dpdGNoRWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCBTdHJpbmcoaXNFeHBhbmRlZCkpXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmICh0aGlzLmluZXJ0RWxlbWVudHMpIHtcbiAgICAgIHRoaXMuaW5lcnRFbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBpZiAoaXNFeHBhbmRlZCkge1xuICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdpbmVydCcsICcnKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgdGhpcy5pc0V4cGFuZGVkID0gaXNFeHBhbmRlZFxuICB9XG4gIHByaXZhdGUgX2tleXVwSGFuZGxlcihldmVudDogS2V5Ym9hcmRFdmVudCkge1xuICAgIGlmIChldmVudC5rZXkgPT09ICdFc2NhcGUnIHx8IGV2ZW50LmtleSA9PT0gJ0VzYycpIHRoaXMuY2xvc2UoKVxuICB9XG4gIHByaXZhdGUgX3BvcHN0YXRlSGFuZGxlcihldmVudDogUG9wU3RhdGVFdmVudCkge1xuICAgIHRoaXMuX2NoYW5nZVN0YXRlKCF0aGlzLmlzRXhwYW5kZWQpO1xuICB9XG4gIHByaXZhdGUgX3B1c2hTdGF0ZShpc0V4cGFuZGVkOiBib29sZWFuKSB7XG4gICAgaGlzdG9yeS5wdXNoU3RhdGUoe1xuICAgICAgaXNFeHBhbmRlZDogaXNFeHBhbmRlZFxuICAgIH0sICdkcmF3ZXJTdGF0ZScpXG4gIH1cbn0iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBQUEsTUFBTSxhQUFhLEdBRWY7UUFDRixNQUFNLEVBQUUsT0FBTztRQUNmLElBQUksRUFBRSxHQUFHO1FBQ1QsUUFBUSxFQUFFLFFBQVE7UUFDbEIsUUFBUSxFQUFFLE9BQU87UUFDakIsS0FBSyxFQUFFLE9BQU87S0FDZixDQUFBO0lBRUQsTUFBTSxnQkFBZ0IsR0FBWSxDQUFDO1FBQ2pDLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFBO1FBQ25ELElBQUksa0JBQWtCLElBQUksUUFBUTtZQUFFLE9BQU8sUUFBUSxDQUFDLGdCQUFpQixDQUFBO1FBQ3JFLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDO1lBQUUsT0FBTyxRQUFRLENBQUMsSUFBSyxDQUFBO1FBQ25ELE9BQU8sUUFBUSxDQUFDLGVBQWdCLENBQUE7SUFDbEMsQ0FBQyxH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
