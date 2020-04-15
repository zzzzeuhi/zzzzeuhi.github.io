(function() {
    (function($) {
      return $.widget("salsita.clipthru", {
        options: {
          collisionTarget: null,
          keepClonesInHTML: false,
          removeAttrOnClone: ['id'],
          blockSource: null,
          maskOriginal: true,
          updateOnScroll: true,
          updateOnResize: true,
          updateOnZoom: true,
          updateOnCSSTransitionEnd: false,
          autoUpdate: false,
          autoUpdateInterval: 100,
          debug: false
        },
        _create: function() {
          this.dataAttribute = 'jq-clipthru';
          this.overlayOffset = null;
          if (this.options.collisionTarget) {
            this.collisionTarget = $(this.element.find(this.options.collisionTarget).get(0));
          } else {
            this.collisionTarget = this.element;
          }
          this.collisionTargetOffset = null;
          this.allBlocks = null;
          this.allClones = null;
          this.collidingBlocks = [];
          this.svgMaskInitialized = false;
          return this._initWidget();
        },
        _initWidget: function() {
          var _self;
          _self = this;
          this._getAllBlocks();
          if (this.allBlocks.length > 0) {
            this._logMessage("" + this.allBlocks.length + " blocks found", this.allBlocks);
            this.collisionTarget.addClass("" + this.dataAttribute + "-origin");
            this._addIdToBlocks();
            this._attachListeners();
            this._createOverlayClones();
            this.refresh();
            clearInterval(this.autoUpdateTimer != null);
            if (this.options.autoUpdate) {
              return this.autoUpdateTimer = setInterval((function() {
                return _self.refresh();
              }), this.options.autoUpdateInterval);
            }
          } else {
            return this._logMessage('no blocks found');
          }
        },
        _triggerEvent: function(name, data) {
          this.element.trigger(name, [data]);
          return this._logMessage(name, data);
        },
        _logMessage: function(name, args) {
          if (this.options.debug) {
            return console.debug("" + this.dataAttribute + ": " + name, args);
          }
        },
        _getAllBlocks: function() {
          var block, blocks, cls, _ref, _results;
          if (this.options.blockSource) {
            _ref = this.options.blockSource;
            _results = [];
            for (cls in _ref) {
              blocks = _ref[cls];
              _results.push((function() {
                var _i, _len, _results1;
                _results1 = [];
                for (_i = 0, _len = blocks.length; _i < _len; _i++) {
                  block = blocks[_i];
                  $(block).data(this.dataAttribute, cls);
                  if (this.allBlocks) {
                    _results1.push(this.allBlocks = this.allBlocks.add($(block)));
                  } else {
                    _results1.push(this.allBlocks = $(block));
                  }
                }
                return _results1;
              }).call(this));
            }
            return _results;
          } else {
            return this.allBlocks = $("[data-" + this.dataAttribute + "]");
          }
        },
        _getOverlayOffset: function() {
          this.overlayOffset = this.element.get(0).getBoundingClientRect();
          return this.collisionTargetOffset = this.collisionTarget.get(0).getBoundingClientRect();
        },
        _addIdToBlocks: function() {
          var i, _self;
          i = 0;
          _self = this;
          return this.allBlocks.each(function() {
            $(this).data("" + _self.dataAttribute + "-id", i);
            return i++;
          });
        },
        _createOverlayClones: function() {
          var _self;
          _self = this;
          this.allBlocks.each(function() {
            var attr, clone, _i, _len, _ref;
            clone = _self.element.clone();
            if (_self.options.removeAttrOnClone) {
              _ref = _self.options.removeAttrOnClone;
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                attr = _ref[_i];
                clone.removeAttr(attr);
              }
            }
            clone.addClass("" + _self.dataAttribute + "-clone");
            clone.addClass($(this).data(_self.dataAttribute));
            clone.data("" + _self.dataAttribute + "-id", $(this).data("" + _self.dataAttribute + "-id"));
            if (_self.allClones) {
              return _self.allClones = _self.allClones.add(clone);
            } else {
              return _self.allClones = clone;
            }
          });
          if (this.options.keepClonesInHTML) {
            this.allClones.insertAfter(this.element);
          }
          return this._triggerEvent("clonesCreated." + this.dataAttribute, this.allClones);
        },
        _updateOverlayClones: function() {
          var _self;
          _self = this;
          this.allClones.each(function() {
            var id;
            id = $(this).data("" + _self.dataAttribute + "-id");
            if (_self.collidingBlocks.hasOwnProperty(id)) {
              if (_self.options.keepClonesInHTML) {
                $(this).css({
                  display: _self.element.css('display')
                });
              } else {
                if (!document.body.contains(this)) {
                  $(this).insertAfter(_self.element);
                }
              }
              _self._clipOverlayClone(this, _self._getCollisionArea(_self.collidingBlocks[id]));
              if (_self.options.maskOriginal) {
                return _self._manageOriginMask();
              }
            } else {
              if (_self.options.keepClonesInHTML) {
                return $(this).css({
                  display: 'none'
                });
              } else {
                return $(this).detach();
              }
            }
          });
          if (this.collidingBlocks.length === 0) {
            return this.element.css({
              'clip': 'rect(auto auto auto auto)'
            });
          }
        },
        _getCollisionArea: function(blockOffset) {
          var clipOffset;
          clipOffset = [];
          clipOffset.push(this.overlayOffset.height - (this.overlayOffset.bottom - blockOffset.top));
          clipOffset.push(blockOffset.right - this.overlayOffset.left);
          clipOffset.push(blockOffset.bottom - this.overlayOffset.top);
          clipOffset.push(this.overlayOffset.width - (this.overlayOffset.right - blockOffset.left));
          return clipOffset;
        },
        _getRelativeCollisionArea: function(bl, cl) {
          var blBottom, blRight, clBottom, clRight, obj, objHeight, objWidth;
          obj = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
          };
          if (bl.left > cl.left) {
            obj.x = bl.left - cl.left;
          }
          if (bl.top > cl.top) {
            obj.y = bl.top - cl.top;
          }
          objWidth = 0;
          blRight = bl.left + bl.width;
          clRight = cl.left + cl.width;
          if (blRight < clRight) {
            objWidth = clRight - blRight;
          }
          obj.width = cl.width - obj.x - objWidth;
          objHeight = 0;
          blBottom = bl.top + bl.height;
          clBottom = cl.top + cl.height;
          if (blBottom < clBottom) {
            objHeight = clBottom - blBottom;
          }
          obj.height = cl.height - obj.y - objHeight;
          return obj;
        },
        _getCollidingBlocks: function() {
          var _self;
          _self = this;
          this.collidingBlocksOld = this.collidingBlocks;
          this.collidingBlocks = [];
          return this.allBlocks.each(function() {
            var blockOffset, delayEvent, wasCollidedBefore;
            wasCollidedBefore = _self.collidingBlocksOld.hasOwnProperty($(this).data("" + _self.dataAttribute + "-id"));
            blockOffset = this.getBoundingClientRect();
            if ((blockOffset.bottom >= _self.collisionTargetOffset.top) && (blockOffset.top <= _self.collisionTargetOffset.bottom) && (blockOffset.left <= _self.collisionTargetOffset.right) && (blockOffset.right >= _self.collisionTargetOffset.left)) {
              _self.collidingBlocks[$(this).data("" + _self.dataAttribute + "-id")] = blockOffset;
              if (!wasCollidedBefore) {
                delayEvent = function() {
                  return _self._triggerEvent("collisionStart." + _self.dataAttribute, this);
                };
                return setTimeout(delayEvent, 0);
              }
            } else if (wasCollidedBefore) {
              delayEvent = function() {
                return _self._triggerEvent("collisionEnd." + _self.dataAttribute, this);
              };
              return setTimeout(delayEvent, 0);
            }
          });
        },
        _clipOverlayClone: function(clone, offset) {
          return $(clone).css({
            'clip': "rect(" + offset[0] + "px " + offset[1] + "px " + offset[2] + "px " + offset[3] + "px)"
          });
        },
        _clipOverlayOriginal: function(offset) {
          return this.element.css({
            'clip': "rect(" + offset[0] + "px auto " + offset[1] + "px auto)"
          });
        },
        _manageOriginMask: function() {
          var manageSVGObject, updateSVGProperties, _self;
          _self = this;
          manageSVGObject = function() {
            var block, collisionMask, i, maskTemplate, _i, _len, _ref;
            _self.element.css({
              'mask': 'none'
            });
            $("#" + _self.dataAttribute + "-origin-mask-wrapper").remove();
            if (_self.collidingBlocks.length > 0) {
              collisionMask = '';
              _ref = _self.collidingBlocks;
              for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
                block = _ref[i];
                if (_self.collidingBlocks.hasOwnProperty(i)) {
                  collisionMask = collisionMask + ("<rect                   id='" + _self.dataAttribute + "-origin-mask-rect-" + i + "'                   x='0'                   y='0'                   width='0'                   height='0'                   fill='black'/>");
                }
              }
              maskTemplate = $("<svg id='" + _self.dataAttribute + "-origin-mask-wrapper' height='0' style='position: absolute; z-index: -1;'>                              <defs>                                <mask id='" + _self.dataAttribute + "-origin-mask'>                                  <rect id='" + _self.dataAttribute + "-origin-mask-fill' x='0' y='0' width='0' height='0' fill='white' />                                  " + collisionMask + "                                </mask>                              </defs>                            </svg>");
              $('body').append(maskTemplate);
              return _self.element.css({
                'mask': "url(#" + _self.dataAttribute + "-origin-mask)"
              });
            }
          };
          updateSVGProperties = function() {
            var block, i, maskDimensions, maskFill, maskRect, _i, _len, _ref, _results;
            maskFill = $("#" + _self.dataAttribute + "-origin-mask-fill");
            maskFill.attr('width', _self.collisionTargetOffset.width);
            maskFill.attr('height', _self.collisionTargetOffset.height);
            _ref = _self.collidingBlocks;
            _results = [];
            for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
              block = _ref[i];
              if (_self.collidingBlocks.hasOwnProperty(i)) {
                maskRect = $("#" + _self.dataAttribute + "-origin-mask-rect-" + i);
                maskDimensions = _self._getRelativeCollisionArea(block, _self.collisionTargetOffset);
                maskRect.attr('x', maskDimensions.x);
                maskRect.attr('y', maskDimensions.y);
                maskRect.attr('width', maskDimensions.width);
                _results.push(maskRect.attr('height', maskDimensions.height));
              } else {
                _results.push(void 0);
              }
            }
            return _results;
          };
          if (this.svgMaskInitialized) {
            return updateSVGProperties();
          } else {
            manageSVGObject();
            this.element.on("collisionStart." + _self.dataAttribute + " collisionEnd." + _self.dataAttribute, function(e) {
              manageSVGObject();
              return updateSVGProperties();
            });
            return this.svgMaskInitialized = true;
          }
        },
        _attachListeners: function() {
          var _self;
          _self = this;
          $(window).on("" + (this.options.updateOnResize ? 'resize.' + this.dataAttribute : void 0) + " " + (this.options.updateOnScroll ? 'scroll.' + this.dataAttribute : void 0), function() {
            return _self.refresh();
          });
          if (this.options.updateOnCSSTransitionEnd) {
            return this.element.on('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', function(event) {
              if (event.originalEvent.propertyName === _self.options.updateOnCSSTransitionEnd) {
                return _self.refresh();
              }
            });
          }
        },
        refresh: function() {
          this._getOverlayOffset();
          this._getCollidingBlocks();
          return this._updateOverlayClones();
        },
        _destroy: function() {
          $(window).off("resize." + this.dataAttribute + " scroll." + this.dataAttribute);
          this.element.off();
          clearInterval(this.autoUpdateTimer);
          this.element.css({
            'clip': 'auto auto auto auto'
          });
          this.allClones.remove();
          this.allBlocks = null;
          this.allClones = null;
          this.overlayOffset = null;
          this.collisionTarget = null;
          this.collisionTargetOffset = null;
          this.collidingBlocks = null;
          return this.collidingBlocksOld = null;
        }
      });
    })(jQuery);
  
  }).call(this);