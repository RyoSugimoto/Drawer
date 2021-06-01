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

export default Drawer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhd2VyLW1vZHVsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL3RzL2ZpeC1iYWNrZmFjZS50cyIsIi4uL3NyYy90cy9kcmF3ZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3Qgc3R5bGVGb3JGaXhlZDoge1xuICBba2V5OiBzdHJpbmddOiBzdHJpbmdcbn0gPSB7XG4gIGhlaWdodDogJzEwMHZoJyxcbiAgbGVmdDogJzAnLFxuICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gIHBvc2l0aW9uOiAnZml4ZWQnLFxuICB3aWR0aDogJzEwMHZ3Jyxcbn1cblxuY29uc3Qgc2Nyb2xsaW5nRWxlbWVudDogRWxlbWVudCA9ICgoKSA9PiB7XG4gIGNvbnN0IHVhID0gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKVxuICBpZiAoJ3Njcm9sbGluZ0VsZW1lbnQnIGluIGRvY3VtZW50KSByZXR1cm4gZG9jdW1lbnQuc2Nyb2xsaW5nRWxlbWVudCFcbiAgaWYgKHVhLmluZGV4T2YoJ3dlYmtpdCcpID4gMCkgcmV0dXJuIGRvY3VtZW50LmJvZHkhXG4gIHJldHVybiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQhXG59KSgpIVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBmaXhCYWNrZmFjZShmaXhlZDogYm9vbGVhbikge1xuICBjb25zdCBzY3JvbGxZOm51bWJlciA9IGZpeGVkID8gc2Nyb2xsaW5nRWxlbWVudC5zY3JvbGxUb3AgOiBwYXJzZUludChkb2N1bWVudC5ib2R5LnN0eWxlLnRvcCkgPz8gMFxuICBjb25zdCBzY3JvbGxiYXJXaWR0aDpudW1iZXIgPSB3aW5kb3cuaW5uZXJXaWR0aCAtIGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGhcbiAgZG9jdW1lbnQuYm9keS5zdHlsZS50b3AgPSBmaXhlZCA/IGAtJHtzY3JvbGxpbmdFbGVtZW50LnNjcm9sbFRvcH1weGAgOiAnJ1xuICBkb2N1bWVudC5ib2R5LnN0eWxlLnBhZGRpbmdSaWdodCA9IGZpeGVkID8gYCR7c2Nyb2xsYmFyV2lkdGh9cHhgIDogJydcbiAgT2JqZWN0LmtleXMoc3R5bGVGb3JGaXhlZCkuZm9yRWFjaChrZXkgPT4ge1xuICAgIGlmIChmaXhlZCkge1xuICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5zZXRQcm9wZXJ0eShrZXksIHN0eWxlRm9yRml4ZWRba2V5XSlcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShrZXkpXG4gICAgfVxuICB9KVxuICBpZiAoIWZpeGVkKSBzY3JvbGxpbmdFbGVtZW50LnNjcm9sbFRvcCA9IHNjcm9sbFkgKiAtMVxufVxuIiwiaW1wb3J0IGZpeEJhY2tmYWNlIGZyb20gJy4vZml4LWJhY2tmYWNlLmpzJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEcmF3ZXIge1xuICBwdWJsaWMgZHJhd2VyRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsXG4gIHB1YmxpYyBzd2l0Y2hFbGVtZW50cz86IE5vZGVMaXN0T2Y8SFRNTEVsZW1lbnQ+IHwgbnVsbFxuICBwdWJsaWMgaW5lcnRFbGVtZW50cz86IE5vZGVMaXN0T2Y8SFRNTEVsZW1lbnQ+IHwgbnVsbFxuICBwdWJsaWMgaXNFeHBhbmRlZDogYm9vbGVhbiA9IGZhbHNlXG4gIHB1YmxpYyBlbmFibGVGaXhCYWNrZmFjZTpib29sZWFuID0gdHJ1ZVxuICBwdWJsaWMgZW5hYmxlSGlzdG9yeTogYm9vbGVhbiA9IGZhbHNlXG4gIHB1YmxpYyBpZDogc3RyaW5nID0gJ0RyYXdlci0nICsgbmV3IERhdGUoKS5nZXRUaW1lKClcblxuICBjb25zdHJ1Y3RvcihhcmdzOiB7XG4gICAgZHJhd2VyOiBzdHJpbmdcbiAgICBzd2l0Y2g/OiBzdHJpbmdcbiAgICBpbmVydD86IHN0cmluZ1xuICAgIGVuYWJsZUZpeEJhY2tmYWNlPzogYm9vbGVhblxuICAgIGVuYWJsZUhpc3Rvcnk/OiBib29sZWFuXG4gIH0pIHtcbiAgICAvLyBEcmF3ZXIgYm9keVxuICAgIGlmICh0eXBlb2YgYXJncyAhPT0gJ29iamVjdCcgfHwgYXJncy5kcmF3ZXIgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06IFRoZSBcImRyYXdlclwiIHBhcmFtZXRlciBpcyByZXF1aXJlZC4gPT4gZXg6IG5ldyBEcmF3ZXIoeyBkcmF3ZXI6ICcjZHJhd2VyJyB9KWApXG4gICAgaWYgKHR5cGVvZiBhcmdzLmRyYXdlciAhPT0gJ3N0cmluZycgfHwgJycgKSB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTogVGhlIFwiZHJhd2VyXCIgcGFyYW1ldGVyIG11c3QgYmUgXCJzdHJpbmdcIiB0eXBlIGFuZCBcIkNTUyBzZWxlY3RvclwiLmApXG4gICAgaWYgKGFyZ3MuZHJhd2VyID09PSAnJyApIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OiBUaGUgXCJkcmF3ZXJcIiBwYXJhbWV0ZXIgaXMgZW1wdHkuYClcbiAgICB0aGlzLmRyYXdlckVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGFyZ3MuZHJhd2VyKVxuICAgIGlmICghdGhpcy5kcmF3ZXJFbGVtZW50KSB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTogVGhlIEVsZW1lbnQgZm9yIFwiZHJhd2VyXCIgaXMgbm90IGZvdW5kLmApXG4gICAgdGhpcy5kcmF3ZXJFbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsIFN0cmluZyh0aGlzLmlzRXhwYW5kZWQpKVxuICAgIHRoaXMuZHJhd2VyRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtZHJhd2VyLWlzJywgJ2luaXRpYWxpemVkJylcbiAgICAvLyBjb25zb2xlLmxvZyggdGhpcy5pZCApXG4gICAgaWYgKHRoaXMuZHJhd2VyRWxlbWVudC5pZCkge1xuICAgICAgdGhpcy5pZCA9IHRoaXMuZHJhd2VyRWxlbWVudC5pZFxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQuaWQgPSB0aGlzLmlkXG4gICAgfVxuICAgIHRoaXMuaXNFeHBhbmRlZCA/IHRoaXMuZHJhd2VyRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2luZXJ0JykgOiB0aGlzLmRyYXdlckVsZW1lbnQuc2V0QXR0cmlidXRlKCdpbmVydCcsICcnKVxuXG4gICAgLy8gU3dpdGNoZXMgZm9yIHRvZ2dsZVxuICAgIHRoaXMuc3dpdGNoRWxlbWVudHMgPSB0eXBlb2YgYXJncy5zd2l0Y2ggPT09ICdzdHJpbmcnID9cbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYXJncy5zd2l0Y2gpIDogbnVsbFxuICAgIGlmICh0aGlzLnN3aXRjaEVsZW1lbnRzKSB7XG4gICAgICB0aGlzLnN3aXRjaEVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpKVxuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS1kcmF3ZXItaXMnLCAnaW5pdGlhbGl6ZWQnKVxuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCBTdHJpbmcoIXRoaXMuaXNFeHBhbmRlZCkpXG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWNvbnRyb2xzJywgdGhpcy5pZClcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gRWxlbWVudHMgdGhhdCBhcmUgc2V0IFwiaW5lcnRcIiBhdHRyaWJ1dGUgd2hlbiB0aGUgZHJhd2VyIGlzIGV4cGFuZGVkXG4gICAgdGhpcy5pbmVydEVsZW1lbnRzID0gdHlwZW9mIGFyZ3MuaW5lcnQgPT09ICdzdHJpbmcnID9cbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYXJncy5pbmVydCkgOiBudWxsXG4gICAgaWYgKHRoaXMuaW5lcnRFbGVtZW50cykge1xuICAgICAgdGhpcy5pbmVydEVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdkYXRhLWRyYXdlci1pcycsICdpbml0aWFsaXplZCcpXG4gICAgICAgIGlmICh0aGlzLmlzRXhwYW5kZWQpIHtcbiAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnaW5lcnQnLCAnJylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnaW5lcnQnKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIFByZXZlbnRpbmcgc2Nyb2xsIHdoZW4gdGhlIGRyYXdlciBpcyBleHBhbmRlZFxuICAgIHRoaXMuZW5hYmxlRml4QmFja2ZhY2UgPSBhcmdzLmVuYWJsZUZpeEJhY2tmYWNlID8/IHRydWVcblxuICAgIC8vIEFkZGluZyB0aGUgc3RhdGUgb2YgdGhlIGRyYXdlciB0byB0aGUgaGlzdG9yeSBvZiB5b3VyIGJyb3dzZXJcbiAgICBpZiAoYXJncy5lbmFibGVIaXN0b3J5KSB7XG4gICAgICB0aGlzLmVuYWJsZUhpc3RvcnkgPSB0cnVlXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncG9wc3RhdGUnLCB0aGlzLl9wb3BzdGF0ZUhhbmRsZXIuYmluZCh0aGlzKSlcbiAgICB9XG5cblxuICB9XG4gIHRvZ2dsZShldmVudDogRXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgaWYgKHRoaXMuaXNFeHBhbmRlZCkge1xuICAgICAgdGhpcy5jbG9zZSgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMub3BlbigpXG4gICAgfVxuICB9XG4gIG9wZW4oKSB7XG4gICAgdGhpcy5fY2hhbmdlU3RhdGUodHJ1ZSlcbiAgICBpZiAodGhpcy5lbmFibGVIaXN0b3J5KSB0aGlzLl9wdXNoU3RhdGUodHJ1ZSlcbiAgfVxuICBjbG9zZSgpIHtcbiAgICB0aGlzLl9jaGFuZ2VTdGF0ZShmYWxzZSlcbiAgICBpZiAodGhpcy5lbmFibGVIaXN0b3J5KSB0aGlzLl9wdXNoU3RhdGUoZmFsc2UpXG4gIH1cbiAgcHJpdmF0ZSBfY2hhbmdlU3RhdGUoaXNFeHBhbmRlZDogYm9vbGVhbikge1xuICAgIGlmIChpc0V4cGFuZGVkKSB7XG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQ/LnJlbW92ZUF0dHJpYnV0ZSgnaW5lcnQnKVxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9rZXl1cEhhbmRsZXIuYmluZCh0aGlzKSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50Py5zZXRBdHRyaWJ1dGUoJ2luZXJ0JywgJycpXG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX2tleXVwSGFuZGxlci5iaW5kKHRoaXMpKVxuICAgIH1cblxuICAgIGlmICggdHlwZW9mIGZpeEJhY2tmYWNlID09PSAnZnVuY3Rpb24nICYmIHRoaXMuZW5hYmxlRml4QmFja2ZhY2UgKSBmaXhCYWNrZmFjZShpc0V4cGFuZGVkKVxuXG4gICAgdGhpcy5kcmF3ZXJFbGVtZW50Py5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgU3RyaW5nKCFpc0V4cGFuZGVkKSlcblxuICAgIGlmICh0aGlzLnN3aXRjaEVsZW1lbnRzKSB7XG4gICAgICB0aGlzLnN3aXRjaEVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgU3RyaW5nKGlzRXhwYW5kZWQpKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbmVydEVsZW1lbnRzKSB7XG4gICAgICB0aGlzLmluZXJ0RWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgaWYgKGlzRXhwYW5kZWQpIHtcbiAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnaW5lcnQnLCAnJylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnaW5lcnQnKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIHRoaXMuaXNFeHBhbmRlZCA9IGlzRXhwYW5kZWRcbiAgfVxuICBwcml2YXRlIF9rZXl1cEhhbmRsZXIoZXZlbnQ6IEtleWJvYXJkRXZlbnQpIHtcbiAgICBpZiAoZXZlbnQua2V5ID09PSAnRXNjYXBlJyB8fCBldmVudC5rZXkgPT09ICdFc2MnKSB0aGlzLmNsb3NlKClcbiAgfVxuICBwcml2YXRlIF9wb3BzdGF0ZUhhbmRsZXIoZXZlbnQ6IFBvcFN0YXRlRXZlbnQpIHtcbiAgICB0aGlzLl9jaGFuZ2VTdGF0ZSghdGhpcy5pc0V4cGFuZGVkKTtcbiAgfVxuICBwcml2YXRlIF9wdXNoU3RhdGUoaXNFeHBhbmRlZDogYm9vbGVhbikge1xuICAgIGhpc3RvcnkucHVzaFN0YXRlKHtcbiAgICAgIGlzRXhwYW5kZWQ6IGlzRXhwYW5kZWRcbiAgICB9LCAnZHJhd2VyU3RhdGUnKVxuICB9XG59Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sYUFBYSxHQUVmO0lBQ0YsTUFBTSxFQUFFLE9BQU87SUFDZixJQUFJLEVBQUUsR0FBRztJQUNULFFBQVEsRUFBRSxRQUFRO0lBQ2xCLFFBQVEsRUFBRSxPQUFPO0lBQ2pCLEtBQUssRUFBRSxPQUFPO0NBQ2YsQ0FBQTtBQUVELE1BQU0sZ0JBQWdCLEdBQVksQ0FBQztJQUNqQyxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtJQUNuRCxJQUFJLGtCQUFrQixJQUFJLFFBQVE7UUFBRSxPQUFPLFFBQVEsQ0FBQyxnQkFBaUIsQ0FBQTtJQUNyRSxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQztRQUFFLE9BQU8sUUFBUSxDQUFDLElBQUssQ0FBQTtJQUNuRCxPQUFPLFFBQVEsQ0FBQyxlQUFnQixDQUFBO0FBQ2xDLENBQUMsR0FBSSxDQUFBO1NBRW1CLFdBQVcsQ0FBQyxLQUFjO0lBQ2hELE1BQU0sT0FBTyxHQUFVLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUNsRyxNQUFNLGNBQWMsR0FBVSxNQUFNLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFBO0lBQzNFLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxLQUFLLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxTQUFTLElBQUksR0FBRyxFQUFFLENBQUE7SUFDekUsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxHQUFHLEtBQUssR0FBRyxHQUFHLGNBQWMsSUFBSSxHQUFHLEVBQUUsQ0FBQTtJQUNyRSxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHO1FBQ3BDLElBQUksS0FBSyxFQUFFO1lBQ1QsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtTQUN6RDthQUFNO1lBQ0wsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQ3hDO0tBQ0YsQ0FBQyxDQUFBO0lBQ0YsSUFBSSxDQUFDLEtBQUs7UUFBRSxnQkFBZ0IsQ0FBQyxTQUFTLEdBQUcsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFBO0FBQ3ZEOztNQzVCcUIsTUFBTTtJQVN6QixZQUFZLElBTVg7UUFYTSxlQUFVLEdBQVksS0FBSyxDQUFBO1FBQzNCLHNCQUFpQixHQUFXLElBQUksQ0FBQTtRQUNoQyxrQkFBYSxHQUFZLEtBQUssQ0FBQTtRQUM5QixPQUFFLEdBQVcsU0FBUyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUE7O1FBVWxELElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssU0FBUztZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksZ0ZBQWdGLENBQUMsQ0FBQTtRQUNwTCxJQUFJLE9BQU8sSUFBSSxDQUFDLE1BQU0sS0FBSyxRQUFRLElBQUksRUFBRTtZQUFHLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksb0VBQW9FLENBQUMsQ0FBQTtRQUN6SixJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssRUFBRTtZQUFHLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksb0NBQW9DLENBQUMsQ0FBQTtRQUN0RyxJQUFJLENBQUMsYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3hELElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksMENBQTBDLENBQUMsQ0FBQTtRQUM1RyxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO1FBQ3pFLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLGdCQUFnQixFQUFFLGFBQWEsQ0FBQyxDQUFBOztRQUVoRSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxFQUFFO1lBQ3pCLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUE7U0FDaEM7YUFBTTtZQUNMLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUE7U0FDaEM7UUFDRCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQTs7UUFHNUcsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLElBQUksQ0FBQyxNQUFNLEtBQUssUUFBUTtZQUNuRCxRQUFRLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQTtRQUMvQyxJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUU7WUFDdkIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsT0FBTztnQkFDakMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBO2dCQUN6RCxPQUFPLENBQUMsWUFBWSxDQUFDLGdCQUFnQixFQUFFLGFBQWEsQ0FBQyxDQUFBO2dCQUNyRCxPQUFPLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQTtnQkFDN0QsT0FBTyxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO2FBQy9DLENBQUMsQ0FBQTtTQUNIOztRQUdELElBQUksQ0FBQyxhQUFhLEdBQUcsT0FBTyxJQUFJLENBQUMsS0FBSyxLQUFLLFFBQVE7WUFDakQsUUFBUSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUE7UUFDOUMsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQ3RCLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLE9BQU87Z0JBQ2hDLE9BQU8sQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLEVBQUUsYUFBYSxDQUFDLENBQUE7Z0JBQ3JELElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtvQkFDbkIsT0FBTyxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUE7aUJBQ2xDO3FCQUFNO29CQUNMLE9BQU8sQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUE7aUJBQ2pDO2FBQ0YsQ0FBQyxDQUFBO1NBQ0g7O1FBR0QsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxJQUFJLENBQUE7O1FBR3ZELElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUN0QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQTtZQUN6QixNQUFNLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtTQUN0RTtLQUdGO0lBQ0QsTUFBTSxDQUFDLEtBQVk7UUFDakIsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFBO1FBQ3RCLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUE7U0FDYjthQUFNO1lBQ0wsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFBO1NBQ1o7S0FDRjtJQUNELElBQUk7UUFDRixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3ZCLElBQUksSUFBSSxDQUFDLGFBQWE7WUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFBO0tBQzlDO0lBQ0QsS0FBSztRQUNILElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDeEIsSUFBSSxJQUFJLENBQUMsYUFBYTtZQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUE7S0FDL0M7SUFDTyxZQUFZLENBQUMsVUFBbUI7UUFDdEMsSUFBSSxVQUFVLEVBQUU7WUFDZCxJQUFJLENBQUMsYUFBYSxFQUFFLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUM1QyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7U0FDbEU7YUFBTTtZQUNMLElBQUksQ0FBQyxhQUFhLEVBQUUsWUFBWSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUM3QyxRQUFRLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7U0FDckU7UUFFRCxJQUFLLE9BQU8sV0FBVyxLQUFLLFVBQVUsSUFBSSxJQUFJLENBQUMsaUJBQWlCO1lBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFBO1FBRTFGLElBQUksQ0FBQyxhQUFhLEVBQUUsWUFBWSxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO1FBRXBFLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRTtZQUN2QixJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxPQUFPO2dCQUNqQyxPQUFPLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQTthQUMxRCxDQUFDLENBQUE7U0FDSDtRQUVELElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUN0QixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxPQUFPO2dCQUNoQyxJQUFJLFVBQVUsRUFBRTtvQkFDZCxPQUFPLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQTtpQkFDbEM7cUJBQU07b0JBQ0wsT0FBTyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtpQkFDakM7YUFDRixDQUFDLENBQUE7U0FDSDtRQUVELElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFBO0tBQzdCO0lBQ08sYUFBYSxDQUFDLEtBQW9CO1FBQ3hDLElBQUksS0FBSyxDQUFDLEdBQUcsS0FBSyxRQUFRLElBQUksS0FBSyxDQUFDLEdBQUcsS0FBSyxLQUFLO1lBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFBO0tBQ2hFO0lBQ08sZ0JBQWdCLENBQUMsS0FBb0I7UUFDM0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUNyQztJQUNPLFVBQVUsQ0FBQyxVQUFtQjtRQUNwQyxPQUFPLENBQUMsU0FBUyxDQUFDO1lBQ2hCLFVBQVUsRUFBRSxVQUFVO1NBQ3ZCLEVBQUUsYUFBYSxDQUFDLENBQUE7S0FDbEI7Ozs7OyJ9
