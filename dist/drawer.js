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
            this.isExpanded ? this.drawerElement.removeAttribute('inert') : this.drawerElement.setAttribute('inert', '');
            // Switches for toggle
            this.switchElements = typeof args.switch === 'string' ?
                document.querySelectorAll(args.switch) : null;
            if (this.switchElements) {
                this.switchElements.forEach(element => {
                    element.addEventListener('click', this.toggle.bind(this));
                });
            }
            // Elements that are set "inert" attribute when the drawer is expanded
            this.inertElements = typeof args.inert === 'string' ?
                document.querySelectorAll(args.inert) : null;
            if (this.inertElements) {
                this.inertElements.forEach(element => {
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
            if (typeof fixBackface === 'function' && this.enableFixBackface)
                fixBackface(isExpanded);
            this.drawerElement?.setAttribute('aria-expanded', String(isExpanded));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhd2VyLmpzIiwic291cmNlcyI6WyIuLi9zcmMvdHMvZml4LWJhY2tmYWNlLnRzIiwiLi4vc3JjL3RzL2RyYXdlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBzdHlsZUZvckZpeGVkOiB7XG4gIFtrZXk6IHN0cmluZ106IHN0cmluZ1xufSA9IHtcbiAgaGVpZ2h0OiAnMTAwdmgnLFxuICBsZWZ0OiAnMCcsXG4gIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgcG9zaXRpb246ICdmaXhlZCcsXG4gIHdpZHRoOiAnMTAwdncnLFxufVxuXG5jb25zdCBzY3JvbGxpbmdFbGVtZW50OiBFbGVtZW50ID0gKCgpID0+IHtcbiAgY29uc3QgdWEgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpXG4gIGlmICgnc2Nyb2xsaW5nRWxlbWVudCcgaW4gZG9jdW1lbnQpIHJldHVybiBkb2N1bWVudC5zY3JvbGxpbmdFbGVtZW50IVxuICBpZiAodWEuaW5kZXhPZignd2Via2l0JykgPiAwKSByZXR1cm4gZG9jdW1lbnQuYm9keSFcbiAgcmV0dXJuIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCFcbn0pKCkhXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGZpeEJhY2tmYWNlKGZpeGVkOiBib29sZWFuKSB7XG4gIGNvbnN0IHNjcm9sbFk6bnVtYmVyID0gZml4ZWQgPyBzY3JvbGxpbmdFbGVtZW50LnNjcm9sbFRvcCA6IHBhcnNlSW50KGRvY3VtZW50LmJvZHkuc3R5bGUudG9wKSA/PyAwXG4gIGNvbnN0IHNjcm9sbGJhcldpZHRoOm51bWJlciA9IHdpbmRvdy5pbm5lcldpZHRoIC0gZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aFxuICBkb2N1bWVudC5ib2R5LnN0eWxlLnRvcCA9IGZpeGVkID8gYC0ke3Njcm9sbGluZ0VsZW1lbnQuc2Nyb2xsVG9wfXB4YCA6ICcnXG4gIGRvY3VtZW50LmJvZHkuc3R5bGUucGFkZGluZ1JpZ2h0ID0gZml4ZWQgPyBgJHtzY3JvbGxiYXJXaWR0aH1weGAgOiAnJ1xuICBPYmplY3Qua2V5cyhzdHlsZUZvckZpeGVkKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgaWYgKGZpeGVkKSB7XG4gICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnNldFByb3BlcnR5KGtleSwgc3R5bGVGb3JGaXhlZFtrZXldKVxuICAgIH0gZWxzZSB7XG4gICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnJlbW92ZVByb3BlcnR5KGtleSlcbiAgICB9XG4gIH0pXG4gIGlmICghZml4ZWQpIHNjcm9sbGluZ0VsZW1lbnQuc2Nyb2xsVG9wID0gc2Nyb2xsWSAqIC0xXG59XG4iLCJpbXBvcnQgZml4QmFja2ZhY2UgZnJvbSAnLi9maXgtYmFja2ZhY2UuanMnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERyYXdlciB7XG4gIHB1YmxpYyBkcmF3ZXJFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGxcbiAgcHVibGljIHN3aXRjaEVsZW1lbnRzPzogTm9kZUxpc3RPZjxIVE1MRWxlbWVudD4gfCBudWxsXG4gIHB1YmxpYyBpbmVydEVsZW1lbnRzPzogTm9kZUxpc3RPZjxIVE1MRWxlbWVudD4gfCBudWxsXG4gIHB1YmxpYyBpc0V4cGFuZGVkOiBib29sZWFuID0gZmFsc2VcbiAgcHVibGljIGVuYWJsZUZpeEJhY2tmYWNlOmJvb2xlYW4gPSB0cnVlXG4gIHB1YmxpYyBlbmFibGVIaXN0b3J5OiBib29sZWFuID0gZmFsc2VcbiAgY29uc3RydWN0b3IoYXJnczoge1xuICAgIGRyYXdlcjogc3RyaW5nXG4gICAgc3dpdGNoPzogc3RyaW5nXG4gICAgaW5lcnQ/OiBzdHJpbmdcbiAgICBlbmFibGVGaXhCYWNrZmFjZT86IGJvb2xlYW5cbiAgICBlbmFibGVIaXN0b3J5PzogYm9vbGVhblxuICB9KSB7XG4gICAgLy8gRHJhd2VyIGJvZHlcbiAgICBpZiAodHlwZW9mIGFyZ3MgIT09ICdvYmplY3QnIHx8IGFyZ3MuZHJhd2VyID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OiBUaGUgXCJkcmF3ZXJcIiBwYXJhbWV0ZXIgaXMgcmVxdWlyZWQuID0+IGV4OiBuZXcgRHJhd2VyKHsgZHJhd2VyOiAnI2RyYXdlcicgfSlgKVxuICAgIGlmICh0eXBlb2YgYXJncy5kcmF3ZXIgIT09ICdzdHJpbmcnIHx8ICcnICkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06IFRoZSBcImRyYXdlclwiIHBhcmFtZXRlciBtdXN0IGJlIFwic3RyaW5nXCIgdHlwZSBhbmQgXCJDU1Mgc2VsZWN0b3JcIi5gKVxuICAgIGlmIChhcmdzLmRyYXdlciA9PT0gJycgKSB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTogVGhlIFwiZHJhd2VyXCIgcGFyYW1ldGVyIGlzIGVtcHR5LmApXG4gICAgdGhpcy5kcmF3ZXJFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihhcmdzLmRyYXdlcilcbiAgICBpZiAoIXRoaXMuZHJhd2VyRWxlbWVudCkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06IFRoZSBFbGVtZW50IGZvciBcImRyYXdlclwiIGlzIG5vdCBmb3VuZC5gKVxuICAgIHRoaXMuZHJhd2VyRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCBTdHJpbmcodGhpcy5pc0V4cGFuZGVkKSlcbiAgICB0aGlzLmlzRXhwYW5kZWQgPyB0aGlzLmRyYXdlckVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpIDogdGhpcy5kcmF3ZXJFbGVtZW50LnNldEF0dHJpYnV0ZSgnaW5lcnQnLCAnJylcblxuICAgIC8vIFN3aXRjaGVzIGZvciB0b2dnbGVcbiAgICB0aGlzLnN3aXRjaEVsZW1lbnRzID0gdHlwZW9mIGFyZ3Muc3dpdGNoID09PSAnc3RyaW5nJyA/XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGFyZ3Muc3dpdGNoKSA6IG51bGxcbiAgICBpZiAodGhpcy5zd2l0Y2hFbGVtZW50cykge1xuICAgICAgdGhpcy5zd2l0Y2hFbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy50b2dnbGUuYmluZCh0aGlzKSlcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gRWxlbWVudHMgdGhhdCBhcmUgc2V0IFwiaW5lcnRcIiBhdHRyaWJ1dGUgd2hlbiB0aGUgZHJhd2VyIGlzIGV4cGFuZGVkXG4gICAgdGhpcy5pbmVydEVsZW1lbnRzID0gdHlwZW9mIGFyZ3MuaW5lcnQgPT09ICdzdHJpbmcnID9cbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYXJncy5pbmVydCkgOiBudWxsXG4gICAgaWYgKHRoaXMuaW5lcnRFbGVtZW50cykge1xuICAgICAgdGhpcy5pbmVydEVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGlmICh0aGlzLmlzRXhwYW5kZWQpIHtcbiAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnaW5lcnQnLCAnJylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnaW5lcnQnKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIFByZXZlbnRpbmcgc2Nyb2xsIHdoZW4gdGhlIGRyYXdlciBpcyBleHBhbmRlZFxuICAgIHRoaXMuZW5hYmxlRml4QmFja2ZhY2UgPSBhcmdzLmVuYWJsZUZpeEJhY2tmYWNlID8/IHRydWVcblxuICAgIC8vIEFkZGluZyB0aGUgc3RhdGUgb2YgdGhlIGRyYXdlciB0byB0aGUgaGlzdG9yeSBvZiB5b3VyIGJyb3dzZXJcbiAgICBpZiAoYXJncy5lbmFibGVIaXN0b3J5KSB7XG4gICAgICB0aGlzLmVuYWJsZUhpc3RvcnkgPSB0cnVlXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncG9wc3RhdGUnLCB0aGlzLl9wb3BzdGF0ZUhhbmRsZXIuYmluZCh0aGlzKSlcbiAgICB9XG4gIH1cbiAgdG9nZ2xlKGV2ZW50OiBFdmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICBpZiAodGhpcy5pc0V4cGFuZGVkKSB7XG4gICAgICB0aGlzLmNsb3NlKClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5vcGVuKClcbiAgICB9XG4gIH1cbiAgb3BlbigpIHtcbiAgICB0aGlzLl9jaGFuZ2VTdGF0ZSh0cnVlKVxuICAgIGlmICh0aGlzLmVuYWJsZUhpc3RvcnkpIHRoaXMuX3B1c2hTdGF0ZSh0cnVlKVxuICB9XG4gIGNsb3NlKCkge1xuICAgIHRoaXMuX2NoYW5nZVN0YXRlKGZhbHNlKVxuICAgIGlmICh0aGlzLmVuYWJsZUhpc3RvcnkpIHRoaXMuX3B1c2hTdGF0ZShmYWxzZSlcbiAgfVxuICBwcml2YXRlIF9jaGFuZ2VTdGF0ZShpc0V4cGFuZGVkOiBib29sZWFuKSB7XG4gICAgaWYgKGlzRXhwYW5kZWQpIHtcbiAgICAgIHRoaXMuZHJhd2VyRWxlbWVudD8ucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX2tleXVwSGFuZGxlci5iaW5kKHRoaXMpKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQ/LnNldEF0dHJpYnV0ZSgnaW5lcnQnLCAnJylcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5fa2V5dXBIYW5kbGVyLmJpbmQodGhpcykpXG4gICAgfVxuICAgIGlmICh0aGlzLmluZXJ0RWxlbWVudHMpIHtcbiAgICAgIHRoaXMuaW5lcnRFbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBpZiAoaXNFeHBhbmRlZCkge1xuICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdpbmVydCcsICcnKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdpbmVydCcpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICAgIGlmICggdHlwZW9mIGZpeEJhY2tmYWNlID09PSAnZnVuY3Rpb24nICYmIHRoaXMuZW5hYmxlRml4QmFja2ZhY2UgKSBmaXhCYWNrZmFjZShpc0V4cGFuZGVkKVxuICAgIHRoaXMuZHJhd2VyRWxlbWVudD8uc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgU3RyaW5nKGlzRXhwYW5kZWQpKVxuICAgIHRoaXMuaXNFeHBhbmRlZCA9IGlzRXhwYW5kZWRcbiAgfVxuICBwcml2YXRlIF9rZXl1cEhhbmRsZXIoZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBpZiAoZXZlbnQua2V5ID09PSAnRXNjYXBlJyB8fCBldmVudC5rZXkgPT09ICdFc2MnKSB0aGlzLmNsb3NlKClcbiAgfVxuICBwcml2YXRlIF9wb3BzdGF0ZUhhbmRsZXIoZXZlbnQ6IFBvcFN0YXRlRXZlbnQpIHtcbiAgICB0aGlzLl9jaGFuZ2VTdGF0ZSghdGhpcy5pc0V4cGFuZGVkKTtcbiAgfVxuICBwcml2YXRlIF9wdXNoU3RhdGUoaXNFeHBhbmRlZDogYm9vbGVhbikge1xuICAgIGhpc3RvcnkucHVzaFN0YXRlKHtcbiAgICAgIGlzRXhwYW5kZWQ6IGlzRXhwYW5kZWRcbiAgICB9LCAnZHJhd2VyU3RhdGUnKVxuICB9XG59Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQUFBLE1BQU0sYUFBYSxHQUVmO1FBQ0YsTUFBTSxFQUFFLE9BQU87UUFDZixJQUFJLEVBQUUsR0FBRztRQUNULFFBQVEsRUFBRSxRQUFRO1FBQ2xCLFFBQVEsRUFBRSxPQUFPO1FBQ2pCLEtBQUssRUFBRSxPQUFPO0tBQ2YsQ0FBQTtJQUVELE1BQU0sZ0JBQWdCLEdBQVksQ0FBQztRQUNqQyxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtRQUNuRCxJ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
