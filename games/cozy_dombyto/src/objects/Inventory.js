// Cozy Dombyto — Inventory panel (right side, vertical layout for landscape)
(function () {

  var TAB_H = 36;
  var ITEM_SIZE = 40;
  var ITEM_COLS = 3;         // items per row in the grid
  var ITEM_CELL_W = 90;
  var ITEM_CELL_H = 72;
  var SCROLL_PAD = 8;
  var DRAG_THRESHOLD = 12;
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
    this.gestureState = 'idle';
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

    // Left border
    this.leftBorder = this.scene.add.rectangle(
      this.px, this.py + this.ph / 2, 2, this.ph, 0xe8917a, 0.6
    ).setDepth(99);
  };

  proto._buildTabs = function () {
    var tabs = window.INVENTORY_TABS;
    var tabW = this.pw / tabs.length;
    var tabY = this.py + TAB_H / 2 + 4;
    var self = this;

    for (var i = 0; i < tabs.length; i++) {
      (function (tab, index) {
        var tx = self.px + tabW * index + tabW / 2;

        var bg = self.scene.add.rectangle(tx, tabY, tabW - 4, TAB_H - 6, TAB_INACTIVE, 1)
          .setInteractive({ useHandCursor: true })
          .setDepth(101);
        bg.setStrokeStyle(1, 0xc48878, 0.4);

        var label = self.scene.add.text(tx, tabY, tab.label, {
          fontSize: '11px', fontFamily: '"Baloo 2", cursive', color: '#3d2b1f',
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
    this.scrollY = this.py + TAB_H + 8;
    this.scrollH = this.ph - TAB_H - 12;

    var maskGfx = this.scene.make.graphics({ add: false });
    maskGfx.fillRect(this.px, this.scrollY, this.pw, this.scrollH);
    this.scrollMask = maskGfx.createGeometryMask();
  };

  proto._setupInput = function () {
    var self = this;

    this.scene.input.on('pointerdown', function (pointer) {
      // Only handle if pointer is in the scroll item area
      if (pointer.x < self.px || pointer.x > self.px + self.pw) return;
      if (pointer.y < self.scrollY || pointer.y > self.scrollY + self.scrollH) return;
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
        // Decide: vertical movement = scroll, horizontal (leftward) = item drag
        if (Math.abs(dy) > DRAG_THRESHOLD) {
          self.gestureState = 'scrolling';
        } else if (dx < -DRAG_THRESHOLD && self.pendingItemDef) {
          // Dragging leftward → start item drag
          self.gestureState = 'dragging';
          if (self.scene.startItemDrag) {
            self.scene.startItemDrag(self.pendingItemDef, pointer);
          }
          return;
        } else if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD * 2) {
          self.gestureState = 'scrolling';
        }
      }

      if (self.gestureState === 'scrolling') {
        self.scrollOffset = self.scrollStartOffset + dy;
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
      var halfW = ITEM_CELL_W / 2;
      var halfH = ITEM_CELL_H / 2;
      if (px >= ct.x - halfW && px <= ct.x + halfW &&
          py >= ct.y - halfH && py <= ct.y + halfH) {
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

    for (var j = 0; j < items.length; j++) {
      var def = items[j];
      var gridCol = j % ITEM_COLS;
      var gridRow = Math.floor(j / ITEM_COLS);

      var baseX = this.px + SCROLL_PAD + gridCol * ITEM_CELL_W + ITEM_CELL_W / 2;
      var baseY = this.scrollY + SCROLL_PAD + gridRow * ITEM_CELL_H + ITEM_CELL_H / 2;

      var ct = this.scene.add.container(baseX, baseY).setDepth(103);

      var emoji = this.scene.add.text(0, -8, def.emoji, {
        fontSize: ITEM_SIZE + 'px',
        padding: { x: 2, y: 2 }
      }).setOrigin(0.5, 0.5);

      var label = this.scene.add.text(0, ITEM_SIZE / 2 - 4, def.label, {
        fontSize: '8px', fontFamily: '"Baloo 2", cursive', color: '#6b4c3b',
        align: 'center', wordWrap: { width: ITEM_CELL_W - 8 }
      }).setOrigin(0.5, 0);

      ct.add([emoji, label]);
      ct.setData('itemDef', def);
      ct.setData('baseX', baseX);
      ct.setData('baseY', baseY);
      ct.setMask(this.scrollMask);

      this.itemEmojis.push(ct);
    }

    this._clampScroll();
    this._positionItems();
  };

  proto._clampScroll = function () {
    var totalRows = Math.ceil(this.itemEmojis.length / ITEM_COLS);
    var totalH = totalRows * ITEM_CELL_H + SCROLL_PAD * 2;
    var maxScroll = 0;
    var minScroll = Math.min(0, this.scrollH - totalH);
    this.scrollOffset = Math.max(minScroll, Math.min(maxScroll, this.scrollOffset));
  };

  proto._positionItems = function () {
    for (var i = 0; i < this.itemEmojis.length; i++) {
      var baseY = this.itemEmojis[i].getData('baseY');
      this.itemEmojis[i].y = baseY + this.scrollOffset;
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
    if (this.leftBorder) this.leftBorder.destroy();
  };

})();
