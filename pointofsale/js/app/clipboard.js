var gui = require('nw.gui');

var contextMenu = Backbone.Model.extend({
  editable: false,

  initialize: function(attr, options) {
    this.menu = new gui.Menu();

    if(options.editable) {
      this.menu.append(this.cut);
      this.menu.append(this.copy);
      this.menu.append(this.paste);
    } else {
      this.menu.append(this.copy);
    }
  },

  popup: function(x, y) {
    this.menu.popup(x, y);
  },

  cut: new gui.MenuItem({
            label: "Cut",
            click: function() {
              document.execCommand("cut");
            }
  }),

  copy: new gui.MenuItem({
            label: "Copy",
            click: function() {
              document.execCommand("copy");
            }
  }),

  paste: new gui.MenuItem({
            label: "Paste",
            click: function() {
              document.execCommand("paste");
            }
  })

});

var EditableMenu = new contextMenu({editable: true}, {editable: true});
var DOMMenu = new contextMenu({editable: false}, {editable: false});

$(document).on("contextmenu", function(e) {
  e.preventDefault();
  if($(e.toElement).is('input, textarea') || e.toElement.isContentEditable) {
    EditableMenu.popup(e.clientX, e.clientY);
  } else {
    DOMMenu.popup(e.clientX, e.clientY);
  }
});