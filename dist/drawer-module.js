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

export default Drawer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhd2VyLW1vZHVsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL3RzL2ZpeC1iYWNrZmFjZS50cyIsIi4uL3NyYy90cy9kcmF3ZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3Qgc3R5bGVGb3JGaXhlZDoge1xuICBba2V5OiBzdHJpbmddOiBzdHJpbmdcbn0gPSB7XG4gIGhlaWdodDogJzEwMHZoJyxcbiAgbGVmdDogJzAnLFxuICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gIHBvc2l0aW9uOiAnZml4ZWQnLFxuICB3aWR0aDogJzEwMHZ3Jyxcbn1cblxuY29uc3Qgc2Nyb2xsaW5nRWxlbWVudDogRWxlbWVudCA9ICgoKSA9PiB7XG4gIGNvbnN0IHVhID0gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKVxuICBpZiAoJ3Njcm9sbGluZ0VsZW1lbnQnIGluIGRvY3VtZW50KSByZXR1cm4gZG9jdW1lbnQuc2Nyb2xsaW5nRWxlbWVudCFcbiAgaWYgKHVhLmluZGV4T2YoJ3dlYmtpdCcpID4gMCkgcmV0dXJuIGRvY3VtZW50LmJvZHkhXG4gIHJldHVybiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQhXG59KSgpIVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBmaXhCYWNrZmFjZShmaXhlZDogYm9vbGVhbikge1xuICBjb25zdCBzY3JvbGxZOm51bWJlciA9IGZpeGVkID8gc2Nyb2xsaW5nRWxlbWVudC5zY3JvbGxUb3AgOiBwYXJzZUludChkb2N1bWVudC5ib2R5LnN0eWxlLnRvcCkgPz8gMFxuICBjb25zdCBzY3JvbGxiYXJXaWR0aDpudW1iZXIgPSB3aW5kb3cuaW5uZXJXaWR0aCAtIGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGhcbiAgZG9jdW1lbnQuYm9keS5zdHlsZS50b3AgPSBmaXhlZCA/IGAtJHtzY3JvbGxpbmdFbGVtZW50LnNjcm9sbFRvcH1weGAgOiAnJ1xuICBkb2N1bWVudC5ib2R5LnN0eWxlLnBhZGRpbmdSaWdodCA9IGZpeGVkID8gYCR7c2Nyb2xsYmFyV2lkdGh9cHhgIDogJydcbiAgT2JqZWN0LmtleXMoc3R5bGVGb3JGaXhlZCkuZm9yRWFjaChrZXkgPT4ge1xuICAgIGlmIChmaXhlZCkge1xuICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5zZXRQcm9wZXJ0eShrZXksIHN0eWxlRm9yRml4ZWRba2V5XSlcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShrZXkpXG4gICAgfVxuICB9KVxuICBpZiAoIWZpeGVkKSBzY3JvbGxpbmdFbGVtZW50LnNjcm9sbFRvcCA9IHNjcm9sbFkgKiAtMVxufVxuIiwiaW1wb3J0IGZpeEJhY2tmYWNlIGZyb20gJy4vZml4LWJhY2tmYWNlLmpzJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEcmF3ZXIge1xuICBwdWJsaWMgZHJhd2VyRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsXG4gIHB1YmxpYyBzd2l0Y2hFbGVtZW50cz86IE5vZGVMaXN0T2Y8SFRNTEVsZW1lbnQ+IHwgbnVsbFxuICBwdWJsaWMgaW5lcnRFbGVtZW50cz86IE5vZGVMaXN0T2Y8SFRNTEVsZW1lbnQ+IHwgbnVsbFxuICBwdWJsaWMgaXNFeHBhbmRlZDogYm9vbGVhbiA9IGZhbHNlXG4gIHB1YmxpYyBlbmFibGVGaXhCYWNrZmFjZTpib29sZWFuID0gdHJ1ZVxuICBwdWJsaWMgZW5hYmxlSGlzdG9yeTogYm9vbGVhbiA9IGZhbHNlXG4gIGNvbnN0cnVjdG9yKGFyZ3M6IHtcbiAgICBkcmF3ZXI6IHN0cmluZ1xuICAgIHN3aXRjaD86IHN0cmluZ1xuICAgIGluZXJ0Pzogc3RyaW5nXG4gICAgZW5hYmxlRml4QmFja2ZhY2U/OiBib29sZWFuXG4gICAgZW5hYmxlSGlzdG9yeT86IGJvb2xlYW5cbiAgfSkge1xuICAgIC8vIERyYXdlciBib2R5XG4gICAgaWYgKHR5cGVvZiBhcmdzICE9PSAnb2JqZWN0JyB8fCBhcmdzLmRyYXdlciA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTogVGhlIFwiZHJhd2VyXCIgcGFyYW1ldGVyIGlzIHJlcXVpcmVkLiA9PiBleDogbmV3IERyYXdlcih7IGRyYXdlcjogJyNkcmF3ZXInIH0pYClcbiAgICBpZiAodHlwZW9mIGFyZ3MuZHJhd2VyICE9PSAnc3RyaW5nJyB8fCAnJyApIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OiBUaGUgXCJkcmF3ZXJcIiBwYXJhbWV0ZXIgbXVzdCBiZSBcInN0cmluZ1wiIHR5cGUgYW5kIFwiQ1NTIHNlbGVjdG9yXCIuYClcbiAgICBpZiAoYXJncy5kcmF3ZXIgPT09ICcnICkgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06IFRoZSBcImRyYXdlclwiIHBhcmFtZXRlciBpcyBlbXB0eS5gKVxuICAgIHRoaXMuZHJhd2VyRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYXJncy5kcmF3ZXIpXG4gICAgaWYgKCF0aGlzLmRyYXdlckVsZW1lbnQpIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OiBUaGUgRWxlbWVudCBmb3IgXCJkcmF3ZXJcIiBpcyBub3QgZm91bmQuYClcbiAgICB0aGlzLmRyYXdlckVsZW1lbnQuc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgU3RyaW5nKHRoaXMuaXNFeHBhbmRlZCkpXG4gICAgdGhpcy5pc0V4cGFuZGVkID8gdGhpcy5kcmF3ZXJFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnaW5lcnQnKSA6IHRoaXMuZHJhd2VyRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2luZXJ0JywgJycpXG5cbiAgICAvLyBTd2l0Y2hlcyBmb3IgdG9nZ2xlXG4gICAgdGhpcy5zd2l0Y2hFbGVtZW50cyA9IHR5cGVvZiBhcmdzLnN3aXRjaCA9PT0gJ3N0cmluZycgP1xuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChhcmdzLnN3aXRjaCkgOiBudWxsXG4gICAgaWYgKHRoaXMuc3dpdGNoRWxlbWVudHMpIHtcbiAgICAgIHRoaXMuc3dpdGNoRWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlLmJpbmQodGhpcykpXG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIEVsZW1lbnRzIHRoYXQgYXJlIHNldCBcImluZXJ0XCIgYXR0cmlidXRlIHdoZW4gdGhlIGRyYXdlciBpcyBleHBhbmRlZFxuICAgIHRoaXMuaW5lcnRFbGVtZW50cyA9IHR5cGVvZiBhcmdzLmluZXJ0ID09PSAnc3RyaW5nJyA/XG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGFyZ3MuaW5lcnQpIDogbnVsbFxuICAgIGlmICh0aGlzLmluZXJ0RWxlbWVudHMpIHtcbiAgICAgIHRoaXMuaW5lcnRFbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBpZiAodGhpcy5pc0V4cGFuZGVkKSB7XG4gICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2luZXJ0JywgJycpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2luZXJ0JylcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyBQcmV2ZW50aW5nIHNjcm9sbCB3aGVuIHRoZSBkcmF3ZXIgaXMgZXhwYW5kZWRcbiAgICB0aGlzLmVuYWJsZUZpeEJhY2tmYWNlID0gYXJncy5lbmFibGVGaXhCYWNrZmFjZSA/PyB0cnVlXG5cbiAgICAvLyBBZGRpbmcgdGhlIHN0YXRlIG9mIHRoZSBkcmF3ZXIgdG8gdGhlIGhpc3Rvcnkgb2YgeW91ciBicm93c2VyXG4gICAgaWYgKGFyZ3MuZW5hYmxlSGlzdG9yeSkge1xuICAgICAgdGhpcy5lbmFibGVIaXN0b3J5ID0gdHJ1ZVxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3BvcHN0YXRlJywgdGhpcy5fcG9wc3RhdGVIYW5kbGVyLmJpbmQodGhpcykpXG4gICAgfVxuICB9XG4gIHRvZ2dsZShldmVudDogRXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgaWYgKHRoaXMuaXNFeHBhbmRlZCkge1xuICAgICAgdGhpcy5jbG9zZSgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMub3BlbigpXG4gICAgfVxuICB9XG4gIG9wZW4oKSB7XG4gICAgdGhpcy5fY2hhbmdlU3RhdGUodHJ1ZSlcbiAgICBpZiAodGhpcy5lbmFibGVIaXN0b3J5KSB0aGlzLl9wdXNoU3RhdGUodHJ1ZSlcbiAgfVxuICBjbG9zZSgpIHtcbiAgICB0aGlzLl9jaGFuZ2VTdGF0ZShmYWxzZSlcbiAgICBpZiAodGhpcy5lbmFibGVIaXN0b3J5KSB0aGlzLl9wdXNoU3RhdGUoZmFsc2UpXG4gIH1cbiAgcHJpdmF0ZSBfY2hhbmdlU3RhdGUoaXNFeHBhbmRlZDogYm9vbGVhbikge1xuICAgIGlmIChpc0V4cGFuZGVkKSB7XG4gICAgICB0aGlzLmRyYXdlckVsZW1lbnQ/LnJlbW92ZUF0dHJpYnV0ZSgnaW5lcnQnKVxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLl9rZXl1cEhhbmRsZXIuYmluZCh0aGlzKSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kcmF3ZXJFbGVtZW50Py5zZXRBdHRyaWJ1dGUoJ2luZXJ0JywgJycpXG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX2tleXVwSGFuZGxlci5iaW5kKHRoaXMpKVxuICAgIH1cbiAgICBpZiAodGhpcy5pbmVydEVsZW1lbnRzKSB7XG4gICAgICB0aGlzLmluZXJ0RWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgaWYgKGlzRXhwYW5kZWQpIHtcbiAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnaW5lcnQnLCAnJylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnaW5lcnQnKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgICBpZiAoIHR5cGVvZiBmaXhCYWNrZmFjZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0aGlzLmVuYWJsZUZpeEJhY2tmYWNlICkgZml4QmFja2ZhY2UoaXNFeHBhbmRlZClcbiAgICB0aGlzLmRyYXdlckVsZW1lbnQ/LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsIFN0cmluZyhpc0V4cGFuZGVkKSlcbiAgICB0aGlzLmlzRXhwYW5kZWQgPSBpc0V4cGFuZGVkXG4gIH1cbiAgcHJpdmF0ZSBfa2V5dXBIYW5kbGVyKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XG4gICAgaWYgKGV2ZW50LmtleSA9PT0gJ0VzY2FwZScgfHwgZXZlbnQua2V5ID09PSAnRXNjJykgdGhpcy5jbG9zZSgpXG4gIH1cbiAgcHJpdmF0ZSBfcG9wc3RhdGVIYW5kbGVyKGV2ZW50OiBQb3BTdGF0ZUV2ZW50KSB7XG4gICAgdGhpcy5fY2hhbmdlU3RhdGUoIXRoaXMuaXNFeHBhbmRlZCk7XG4gIH1cbiAgcHJpdmF0ZSBfcHVzaFN0YXRlKGlzRXhwYW5kZWQ6IGJvb2xlYW4pIHtcbiAgICBoaXN0b3J5LnB1c2hTdGF0ZSh7XG4gICAgICBpc0V4cGFuZGVkOiBpc0V4cGFuZGVkXG4gICAgfSwgJ2RyYXdlclN0YXRlJylcbiAgfVxufSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLGFBQWEsR0FFZjtJQUNGLE1BQU0sRUFBRSxPQUFPO0lBQ2YsSUFBSSxFQUFFLEdBQUc7SUFDVCxRQUFRLEVBQUUsUUFBUTtJQUNsQixRQUFRLEVBQUUsT0FBTztJQUNqQixLQUFLLEVBQUUsT0FBTztDQUNmLENBQUE7QUFFRCxNQUFNLGdCQUFnQixHQUFZLENBQUM7SUFDakMsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUE7SUFDbkQsSUFBSSxrQkFBa0IsSUFBSSxRQUFRO1FBQUUsT0FBTyxRQUFRLENBQUMsZ0JBQWlCLENBQUE7SUFDckUsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7UUFBRSxPQUFPLFFBQVEsQ0FBQyxJQUFLLENBQUE7SUFDbkQsT0FBTyxRQUFRLENBQUMsZUFBZ0IsQ0FBQTtBQUNsQyxDQUFDLEdBQUksQ0FBQTtTQUVtQixXQUFXLENBQUMsS0FBYztJQUNoRCxNQUFNLE9BQU8sR0FBVSxLQUFLLEdBQUcsZ0JBQWdCLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDbEcsTUFBTSxjQUFjLEdBQVUsTUFBTSxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQTtJQUMzRSxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsS0FBSyxHQUFHLElBQUksZ0JBQWdCLENBQUMsU0FBUyxJQUFJLEdBQUcsRUFBRSxDQUFBO0lBQ3pFLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksR0FBRyxLQUFLLEdBQUcsR0FBRyxjQUFjLElBQUksR0FBRyxFQUFFLENBQUE7SUFDckUsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRztRQUNwQyxJQUFJLEtBQUssRUFBRTtZQUNULFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7U0FDekQ7YUFBTTtZQUNMLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtTQUN4QztLQUNGLENBQUMsQ0FBQTtJQUNGLElBQUksQ0FBQyxLQUFLO1FBQUUsZ0JBQWdCLENBQUMsU0FBUyxHQUFHLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQTtBQUN2RDs7TUM1QnFCLE1BQU07SUFPekIsWUFBWSxJQU1YO1FBVE0sZUFBVSxHQUFZLEtBQUssQ0FBQTtRQUMzQixzQkFBaUIsR0FBVyxJQUFJLENBQUE7UUFDaEMsa0JBQWEsR0FBWSxLQUFLLENBQUE7O1FBU25DLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssU0FBUztZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksZ0ZBQWdGLENBQUMsQ0FBQTtRQUNwTCxJQUFJLE9BQU8sSUFBSSxDQUFDLE1BQU0sS0FBSyxRQUFRLElBQUksRUFBRTtZQUFHLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksb0VBQW9FLENBQUMsQ0FBQTtRQUN6SixJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssRUFBRTtZQUFHLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksb0NBQW9DLENBQUMsQ0FBQTtRQUN0RyxJQUFJLENBQUMsYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3hELElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYTtZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksMENBQTBDLENBQUMsQ0FBQTtRQUM1RyxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO1FBQ3pFLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFBOztRQUc1RyxJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sSUFBSSxDQUFDLE1BQU0sS0FBSyxRQUFRO1lBQ25ELFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFBO1FBQy9DLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRTtZQUN2QixJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxPQUFPO2dCQUNqQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7YUFDMUQsQ0FBQyxDQUFBO1NBQ0g7O1FBR0QsSUFBSSxDQUFDLGFBQWEsR0FBRyxPQUFPLElBQUksQ0FBQyxLQUFLLEtBQUssUUFBUTtZQUNqRCxRQUFRLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQTtRQUM5QyxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDdEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsT0FBTztnQkFDaEMsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO29CQUNuQixPQUFPLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQTtpQkFDbEM7cUJBQU07b0JBQ0wsT0FBTyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtpQkFDakM7YUFDRixDQUFDLENBQUE7U0FDSDs7UUFHRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixJQUFJLElBQUksQ0FBQTs7UUFHdkQsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQ3RCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFBO1lBQ3pCLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBO1NBQ3RFO0tBQ0Y7SUFDRCxNQUFNLENBQUMsS0FBWTtRQUNqQixLQUFLLENBQUMsY0FBYyxFQUFFLENBQUE7UUFDdEIsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ25CLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQTtTQUNiO2FBQU07WUFDTCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUE7U0FDWjtLQUNGO0lBQ0QsSUFBSTtRQUNGLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDdkIsSUFBSSxJQUFJLENBQUMsYUFBYTtZQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7S0FDOUM7SUFDRCxLQUFLO1FBQ0gsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUN4QixJQUFJLElBQUksQ0FBQyxhQUFhO1lBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQTtLQUMvQztJQUNPLFlBQVksQ0FBQyxVQUFtQjtRQUN0QyxJQUFJLFVBQVUsRUFBRTtZQUNkLElBQUksQ0FBQyxhQUFhLEVBQUUsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQzVDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtTQUNsRTthQUFNO1lBQ0wsSUFBSSxDQUFDLGFBQWEsRUFBRSxZQUFZLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQzdDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtTQUNyRTtRQUNELElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUN0QixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxPQUFPO2dCQUNoQyxJQUFJLFVBQVUsRUFBRTtvQkFDZCxPQUFPLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQTtpQkFDbEM7cUJBQU07b0JBQ0wsT0FBTyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtpQkFDakM7YUFDRixDQUFDLENBQUE7U0FDSDtRQUNELElBQUssT0FBTyxXQUFXLEtBQUssVUFBVSxJQUFJLElBQUksQ0FBQyxpQkFBaUI7WUFBRyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUE7UUFDMUYsSUFBSSxDQUFDLGFBQWEsRUFBRSxZQUFZLENBQUMsZUFBZSxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO1FBQ3JFLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFBO0tBQzdCO0lBQ08sYUFBYSxDQUFDLEtBQW9CO1FBQ3hDLElBQUksS0FBSyxDQUFDLEdBQUcsS0FBSyxRQUFRLElBQUksS0FBSyxDQUFDLEdBQUcsS0FBSyxLQUFLO1lBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFBO0tBQ2hFO0lBQ08sZ0JBQWdCLENBQUMsS0FBb0I7UUFDM0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUNyQztJQUNPLFVBQVUsQ0FBQyxVQUFtQjtRQUNwQyxPQUFPLENBQUMsU0FBUyxDQUFDO1lBQ2hCLFVBQVUsRUFBRSxVQUFVO1NBQ3ZCLEVBQUUsYUFBYSxDQUFDLENBQUE7S0FDbEI7Ozs7OyJ9
