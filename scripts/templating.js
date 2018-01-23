(function(ns) {
    var root = ns;

    var re = /{{\s([\w\.]+)\s}}/;

    function filterState(address, state) {
      var mystate = state;
      address.forEach(function(a) {
        if (mystate.hasOwnProperty(a)) {
          mystate = mystate[a];
        } else {
          throw a + " is not a valid property of " + JSON.stringify(mystate);
        }
      });
      return mystate;
    }

    function ssplice(str, index, count, add) {
      return str.slice(0, index) + add + str.slice(index + count);
    }

    function addressOf(s) {
      if ((match = re.exec(s)) != null) {
        return match[1].split(".");
      } else {
        return null;
      }
    }

    function expandString(s, state) {
      var match;
      var found = false;
      while ((match = re.exec(s)) != null) {
        found = true;
        address = match[1].split(".");
        m = filterState(address, state);
        s = ssplice(s, match.index, match[0].length, m);
      }
      if (found) {
        return s;
      }
      return null;
    }

    function expand(e, state) {
      if (e.nodeName == "#text") {
        m = expandString(e.textContent, state);
        if (m != null) {
          e.textContent = m;
        }
      }
      if (e.attributes != undefined) {
        for (var i=0; i<e.attributes.length; i++) {
          var attr = e.attributes[i];
          if (attr.name.indexOf('data-repeat') === 0) {
            var parts = attr.name.split('-');
            if (parts.length != 3) {
              throw "Repeat format is data-repeat-[name]. Got " + attr.name;
            }
            var name = parts[2];
            var tpl = e.removeChild(e.firstElementChild);
            var address = addressOf(attr.value);
            if (address == null) {
              throw attr.value + " doesn't contain an address.";
            }
            var childState = filterState(address, state);
            if ('forEach' in childState) {
              childState.forEach(function(item, i) {
                var cl = tpl.cloneNode(true);
                var instanceState = {};
                instanceState[name] = item;
                instanceState["i"] = i;
                expand(cl, instanceState);
                e.appendChild(cl);
              });
            } else {
              Object.keys(childState).forEach(function(key) {
                var cl = tpl.cloneNode(true);
                var instanceState = {};
                instanceState[name] = childState[key];
                instanceState["key"] = key;
                expand(cl, instanceState);
                e.appendChild(cl);
              });
            }
          } else {
            m = expandString(attr.value, state);
            if (m != null) {
              e[attr.name] = m;
            }
          }
        }
      }
      for (var i=0; i<e.childNodes.length; i++) {
        expand(e.childNodes[i], state);
      }
    }

    root.Expand = expand;
})(this);
