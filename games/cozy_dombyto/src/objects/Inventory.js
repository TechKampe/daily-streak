// Cozy Dombyto — Inventory panel (right side, compact 2×4 grid)
(function () {

  var TAB_H = 56;
  var ITEM_SIZE = 72;
  var ITEM_COLS = 2;
  var ITEM_CELL_W = 180;
  var ITEM_CELL_H = 160;
  var SCROLL_PAD = 35;
  var DRAG_THRESHOLD = 24;
  var PANEL_COLOR = 0xf0e6d2;

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

    this.gestureState = 'idle';
    this.pointerStartX = 0;
    this.pointerStartY = 0;
    this.scrollStartOffset = 0;
    this.pendingItemDef = null;

    // Compute cell size to fit panel width
    ITEM_CELL_W = Math.floor((this.pw - SCROLL_PAD * 2) / ITEM_COLS);

    this._drawBackground();
    this._buildTabs();
    this._buildScrollArea();
    this.refreshItems();
    this._setupInput();
  };

  var proto = Inventory.prototype;

  proto._drawBackground = function () {
    // Outer blue rounded rect — wraps the entire inventory
    var pad = 6;
    var r = 16;
    this.panelGfx = this.scene.add.graphics().setDepth(99);
    var g = this.panelGfx;
    // Outer leather border
    g.fillStyle(0xb0623a, 1);
    g.fillRoundedRect(this.px + pad, this.py, this.pw - pad * 2, this.ph, r);
    // Stitching line
    g.lineStyle(2, 0xd4926a, 0.7);
    g.strokeRoundedRect(this.px + pad + 6, this.py + 6, this.pw - pad * 2 - 12, this.ph - 12, r - 4);
  };

  proto._buildTabs = function () {
    var tabs = window.INVENTORY_TABS;
    var colCount = 2;
    var rowCount = Math.ceil(tabs.length / colCount);
    var tabCellW = this.pw / colCount;
    var tabRowH = TAB_H;
    var self = this;

    for (var i = 0; i < tabs.length; i++) {
      (function (tab, index) {
        var tc = index % colCount;
        var tr = Math.floor(index / colCount);
        var cx = self.px + tc * tabCellW + tabCellW / 2;
        var cy = self.py + tr * tabRowH + tabRowH / 2 + 4;

        // Button image as background — stretch to fit
        var btnImg = self.scene.add.image(cx, cy, 'ui_button').setDepth(101);
        var scaleX = (tabCellW - 24) / btnImg.width;
        var scaleY = (tabRowH - 14) / btnImg.height;
        btnImg.setScale(scaleX, scaleY);
        btnImg.setInteractive({ useHandCursor: true });
        btnImg.on('pointerdown', function () {
          self.switchTab(tab.id);
        });

        var label = self.scene.add.text(cx, cy, tab.label, {
          fontSize: '18px', fontFamily: '"Baloo 2", cursive', color: '#ffffff',
          fontStyle: 'bold', align: 'center',
          stroke: '#2a5a1a', strokeThickness: 3
        }).setOrigin(0.5, 0.5).setDepth(102);

        self.tabBGs.push(btnImg);
        self.tabLabels.push(label);
      })(tabs[i], i);
    }

    this._tabTotalH = rowCount * tabRowH + 8;
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
      this.tabBGs[i].setAlpha(isActive ? 1.0 : 0.7);
      this.tabBGs[i].setTint(isActive ? 0xffffff : 0xc8a870);
      this.tabLabels[i].setColor(isActive ? '#ffffff' : '#5a4a3a');
      this.tabLabels[i].setStroke(isActive ? '#2a5a1a' : 'transparent', isActive ? 3 : 0);
    }
  };

  proto._buildScrollArea = function () {
    this.scrollY = this.py + this._tabTotalH;
    this.scrollH = this.ph - this._tabTotalH - 8;

    // Inner navy rect — content area below tabs
    var inPad = 12;
    this.contentGfx = this.scene.add.graphics().setDepth(100);
    this.contentGfx.fillStyle(0xf0dcc0, 1);
    this.contentGfx.fillRoundedRect(
      this.px + inPad, this.scrollY,
      this.pw - inPad * 2, this.scrollH,
      12
    );

    var maskGfx = this.scene.make.graphics({ add: false });
    maskGfx.fillRect(this.px, this.scrollY, this.pw, this.scrollH);
    this.scrollMask = maskGfx.createGeometryMask();
  };

  proto._setupInput = function () {
    var self = this;

    this.scene.input.on('pointerdown', function (pointer) {
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
        var absDx = Math.abs(dx);
        var absDy = Math.abs(dy);
        var pastThreshold = absDx > DRAG_THRESHOLD || absDy > DRAG_THRESHOLD;

        if (pastThreshold) {
          // If item under pointer and moving left (or mostly horizontal), drag it
          if (self.pendingItemDef && dx < -DRAG_THRESHOLD / 2 && absDx >= absDy) {
            self.gestureState = 'dragging';
            if (self.scene.startItemDrag) {
              self.scene.startItemDrag(self.pendingItemDef, pointer);
            }
            return;
          }
          // Otherwise scroll
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
    // Exact cell hit first
    for (var i = 0; i < this.itemEmojis.length; i++) {
      var ct = this.itemEmojis[i];
      var halfW = ITEM_CELL_W / 2;
      var halfH = ITEM_CELL_H / 2;
      if (px >= ct.x - halfW && px <= ct.x + halfW &&
          py >= ct.y - halfH && py <= ct.y + halfH) {
        return ct.getData('itemDef');
      }
    }
    // Fallback: pick nearest item (helps when only 1-2 items left)
    var bestDist = Infinity;
    var bestDef = null;
    for (var j = 0; j < this.itemEmojis.length; j++) {
      var c = this.itemEmojis[j];
      var dx = px - c.x;
      var dy = py - c.y;
      var dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestDef = c.getData('itemDef');
      }
    }
    return bestDef;
  };

  proto.refreshItems = function () {
    for (var i = 0; i < this.itemEmojis.length; i++) {
      this.itemEmojis[i].destroy();
    }
    this.itemEmojis = [];
    this.scrollOffset = 0;

    var items = window.GameState.inventory[this.activeTab] || [];
    var centerX = this.px + this.pw / 2;

    for (var j = 0; j < items.length; j++) {
      var def = items[j];
      var gridCol = j % ITEM_COLS;
      var gridRow = Math.floor(j / ITEM_COLS);

      var baseX = centerX - (ITEM_COLS * ITEM_CELL_W) / 2 + gridCol * ITEM_CELL_W + ITEM_CELL_W / 2;
      var baseY = this.scrollY + SCROLL_PAD + gridRow * ITEM_CELL_H + ITEM_CELL_H / 2;

      var ct = this.scene.add.container(baseX, baseY).setDepth(103);

      var isFurniture = def.gridW !== undefined;
      var emojiY = isFurniture ? -10 : -24;
      var emojiScale = isFurniture ? 0.50 : 0.65;
      var emoji = this.scene.add.image(0, emojiY, 'item_' + def.id).setScale(emojiScale);

      var labelY = def.gridW !== undefined ? ITEM_SIZE / 2 + 16 : ITEM_SIZE / 2 - 4;
      var label = this.scene.add.text(0, labelY, def.label, {
        fontSize: '24px', fontFamily: '"Baloo 2", cursive', color: '#5a4a3a',
        align: 'center', wordWrap: { width: ITEM_CELL_W - 12 }
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
    if (this.panelGfx) this.panelGfx.destroy();
    if (this.contentGfx) this.contentGfx.destroy();
  };

})();
