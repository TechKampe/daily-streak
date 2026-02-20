// Cozy Dombyto — Inventory panel (bottom of screen)
(function () {

  var TAB_H = 44;
  var ITEM_SIZE = 48;
  var ITEM_SPACING = 72;
  var SCROLL_PAD = 24;
  var DRAG_THRESHOLD = 12; // px before deciding scroll vs item-drag
  var PANEL_COLOR = 0xf5e1d0;
  var TAB_ACTIVE = 0xe8917a;
  var TAB_INACTIVE = 0xd4a99a;

  window.Inventory = function (scene, x, y, width, height) {
    this.scene = scene;
    this.px = x;
    this.py = y;
    this.pw = width;
    this.ph = height;
    this.activeTab = window.GameState.activeTab;

    this.tabBGs = [];
    this.tabLabels = [];
    this.itemEmojis = [];
    this.scrollOffset = 0;

    // Pointer state: idle → pending → scrolling | dragging
    this.gestureState = 'idle'; // idle | pending | scrolling | dragging
    this.pointerStartX = 0;
    this.pointerStartY = 0;
    this.scrollStartOffset = 0;
    this.pendingItemDef = null;

    this._drawBackground();
    this._buildTabs();
    this._buildScrollArea();
    this.refreshItems();
    this._setupInput();
  };

  var proto = Inventory.prototype;

  proto._drawBackground = function () {
    this.panelBg = this.scene.add.rectangle(
      this.px + this.pw / 2, this.py + this.ph / 2,
      this.pw, this.ph, PANEL_COLOR, 0.95
    ).setDepth(99);

    this.topBorder = this.scene.add.rectangle(
      this.px + this.pw / 2, this.py, this.pw, 2, 0xe8917a, 0.6
    ).setDepth(99);
  };

  proto._buildTabs = function () {
    var tabs = window.INVENTORY_TABS;
    var tabW = this.pw / tabs.length;
    var tabY = this.py + TAB_H / 2 + 6;
    var self = this;

    for (var i = 0; i < tabs.length; i++) {
      (function (tab, index) {
        var tx = self.px + tabW * index + tabW / 2;

        var bg = self.scene.add.rectangle(tx, tabY, tabW - 6, TAB_H - 10, TAB_INACTIVE, 1)
          .setInteractive({ useHandCursor: true })
          .setDepth(101);
        bg.setStrokeStyle(1, 0xc48878, 0.4);

        var label = self.scene.add.text(tx, tabY, tab.label, {
          fontSize: '13px', fontFamily: '"Baloo 2", cursive', color: '#3d2b1f',
          align: 'center'
        }).setOrigin(0.5, 0.5).setDepth(102);

        bg.on('pointerdown', function () {
          self.switchTab(tab.id);
        });

        self.tabBGs.push(bg);
        self.tabLabels.push(label);
      })(tabs[i], i);
    }
    this._updateTabHighlights();
  };

  proto.switchTab = function (tabId) {
    this.activeTab = tabId;
    window.GameState.activeTab = tabId;
    this._updateTabHighlights();
    this.refreshItems();
  };

  proto._updateTabHighlights = function () {
    var tabs = window.INVENTORY_TABS;
    for (var i = 0; i < tabs.length; i++) {
      var isActive = tabs[i].id === this.activeTab;
      this.tabBGs[i].setFillStyle(isActive ? TAB_ACTIVE : TAB_INACTIVE, 1);
    }
  };

  proto._buildScrollArea = function () {
    this.scrollY = this.py + TAB_H + 10;
    this.scrollH = this.ph - TAB_H - 14;

    var maskGfx = this.scene.make.graphics({ add: false });
    maskGfx.fillRect(this.px, this.scrollY, this.pw, this.scrollH);
    this.scrollMask = maskGfx.createGeometryMask();
  };

  proto._setupInput = function () {
    var self = this;

    this.scene.input.on('pointerdown', function (pointer) {
      // Only handle if pointer is in the scroll item area
      if (pointer.y < self.scrollY || pointer.y > self.scrollY + self.scrollH) return;
      // Don't interfere with an active drag
      if (self.scene.activeDrag) return;

      self.gestureState = 'pending';
      self.pointerStartX = pointer.x;
      self.pointerStartY = pointer.y;
      self.scrollStartOffset = self.scrollOffset;
      self.pendingItemDef = self._getItemAtPointer(pointer.x, pointer.y);
    });

    this.scene.input.on('pointermove', function (pointer) {
      if (self.gestureState === 'idle') return;

      var dx = pointer.x - self.pointerStartX;
      var dy = pointer.y - self.pointerStartY;

      if (self.gestureState === 'pending') {
        // Decide: horizontal movement = scroll, vertical (upward) = item drag
        if (Math.abs(dx) > DRAG_THRESHOLD) {
          self.gestureState = 'scrolling';
        } else if (dy < -DRAG_THRESHOLD && self.pendingItemDef) {
          // Dragging upward → start item drag
          self.gestureState = 'dragging';
          if (self.scene.startItemDrag) {
            self.scene.startItemDrag(self.pendingItemDef, pointer);
          }
          return;
        } else if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD * 2) {
          // Moved enough but mostly horizontal — scroll
          self.gestureState = 'scrolling';
        }
      }

      if (self.gestureState === 'scrolling') {
        self.scrollOffset = self.scrollStartOffset + dx;
        self._clampScroll();
        self._positionItems();
      }
    });

    this.scene.input.on('pointerup', function (pointer) {
      if (self.gestureState === 'idle') return;
      self.gestureState = 'idle';
      self.pendingItemDef = null;
    });
  };

  proto._getItemAtPointer = function (px, py) {
    for (var i = 0; i < this.itemEmojis.length; i++) {
      var ct = this.itemEmojis[i];
      var halfW = ITEM_SPACING / 2;
      if (px >= ct.x - halfW && px <= ct.x + halfW) {
        return ct.getData('itemDef');
      }
    }
    return null;
  };

  proto.refreshItems = function () {
    for (var i = 0; i < this.itemEmojis.length; i++) {
      this.itemEmojis[i].destroy();
    }
    this.itemEmojis = [];
    this.scrollOffset = 0;

    var items = window.GameState.inventory[this.activeTab] || [];
    var centerY = this.scrollY + this.scrollH / 2;

    for (var j = 0; j < items.length; j++) {
      var def = items[j];
      var baseX = this.px + SCROLL_PAD + j * ITEM_SPACING + ITEM_SPACING / 2;

      var ct = this.scene.add.container(baseX, centerY).setDepth(103);

      var emoji = this.scene.add.text(0, -10, def.emoji, {
        fontSize: ITEM_SIZE + 'px',
        padding: { x: 4, y: 4 }
      }).setOrigin(0.5, 0.5);

      var label = this.scene.add.text(0, ITEM_SIZE / 2, def.label, {
        fontSize: '9px', fontFamily: '"Baloo 2", cursive', color: '#6b4c3b',
        align: 'center'
      }).setOrigin(0.5, 0);

      ct.add([emoji, label]);
      ct.setData('itemDef', def);
      ct.setData('baseX', baseX);
      ct.setMask(this.scrollMask);

      this.itemEmojis.push(ct);
    }

    this._clampScroll();
    this._positionItems();
  };

  proto._clampScroll = function () {
    var totalW = this.itemEmojis.length * ITEM_SPACING + SCROLL_PAD * 2;
    var maxScroll = 0;
    var minScroll = Math.min(0, this.pw - totalW);
    this.scrollOffset = Math.max(minScroll, Math.min(maxScroll, this.scrollOffset));
  };

  proto._positionItems = function () {
    for (var i = 0; i < this.itemEmojis.length; i++) {
      var baseX = this.itemEmojis[i].getData('baseX');
      this.itemEmojis[i].x = baseX + this.scrollOffset;
    }
  };

  proto.destroy = function () {
    for (var i = 0; i < this.itemEmojis.length; i++) {
      this.itemEmojis[i].destroy();
    }
    for (var j = 0; j < this.tabBGs.length; j++) {
      this.tabBGs[j].destroy();
      this.tabLabels[j].destroy();
    }
    if (this.panelBg) this.panelBg.destroy();
    if (this.topBorder) this.topBorder.destroy();
  };

})();
