var gui = require('nw.gui');

var contextMenu = Backbone.Model.extend({
  initialize: function(attr, options) {
    this.menu = new gui.Menu();

    if(options.editable) {
      this.menu.append(this.cut);
      this.menu.append(this.copyStatic); //Linux nodewebkit causes error possibly when two native context menus point to same method in javascript.
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

  copyStatic: new gui.MenuItem({
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

var EditableMenu = new contextMenu({}, {editable: true});
var DOMMenu = new contextMenu({}, {editable: false});

$(document).on("contextmenu", function(e) {
  e.preventDefault();
  if($(e.toElement).is('input, textarea') || e.toElement.isContentEditable) {
    EditableMenu.popup(e.clientX, e.clientY);
  } else {
    //EditableMenu.popup(e.clientX, e.clientY);
    DOMMenu.popup(e.clientX, e.clientY);
  }
});