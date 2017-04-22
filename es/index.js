var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _class, _temp2;

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import animateScroll from './animateScroll';
import SizeAndPositionManager from './SizeAndPositionManager';
import { ALIGN_CENTER, ALIGN_END, ALIGN_START, DIRECTION_VERTICAL, DIRECTION_HORIZONTAL, positionProp, scrollProp, sizeProp } from './constants';

var STYLE_WRAPPER = { overflow: 'auto', willChange: 'transform', WebkitOverflowScrolling: 'touch' };
var STYLE_INNER = { position: 'relative', overflow: 'hidden', width: '100%', minHeight: '100%' };
var STYLE_ITEM = { position: 'absolute', left: 0, width: '100%' };

var VirtualList = (_temp2 = _class = function (_PureComponent) {
  _inherits(VirtualList, _PureComponent);

  function VirtualList() {
    var _temp, _this, _ret;

    _classCallCheck(this, VirtualList);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, _PureComponent.call.apply(_PureComponent, [this].concat(args))), _this), _this.sizeAndPositionManager = new SizeAndPositionManager({
      itemCount: _this.props.itemCount,
      itemSizeGetter: function itemSizeGetter(_ref) {
        var index = _ref.index;
        return _this.getSize(index);
      },
      estimatedItemSize: _this.getEstimatedItemSize()
    }), _this.state = {
      offset: _this.props.scrollOffset || _this.props.scrollToIndex != null && _this.getOffsetForIndex(_this.props.scrollToIndex) || 0
    }, _this.pauseScroll = false, _this._styleCache = {}, _this._getRef = function (node) {
      _this.rootNode = node;
    }, _this.handleScroll = function (e) {
      var onScroll = _this.props.onScroll;

      var offset = _this.getNodeOffset();

      _this.setState({ offset: offset });

      if (typeof onScroll === 'function') {
        onScroll(offset, e);
      }
    }, _this.handleWheel = function (e) {
      var offset = _this.getNodeOffset();
      var size = _this.sizeAndPositionManager.getTotalSize();
      var height = _this.props.height;

      if (size < height || offset + height >= size) {
        _this.pauseScroll = false;
      } else if (e.deltaY < 0) {
        // Only pause for scroll up
        if (_this.lastScroll) _this.lastScroll.cancel();
        _this.pauseScroll = true;
      }
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  VirtualList.prototype.componentDidMount = function componentDidMount() {
    var _props = this.props,
        scrollOffset = _props.scrollOffset,
        scrollToIndex = _props.scrollToIndex;


    if (scrollOffset != null) {
      this.scrollTo(scrollOffset);
    } else if (scrollToIndex != null) {
      this.scrollTo(this.getOffsetForIndex(scrollToIndex));
    }
  };

  VirtualList.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
    var _props2 = this.props,
        estimatedItemSize = _props2.estimatedItemSize,
        itemCount = _props2.itemCount,
        itemSize = _props2.itemSize,
        scrollOffset = _props2.scrollOffset,
        scrollToAlignment = _props2.scrollToAlignment,
        scrollToIndex = _props2.scrollToIndex;

    var scrollPropsHaveChanged = nextProps.scrollToIndex !== scrollToIndex || nextProps.scrollToAlignment !== scrollToAlignment;
    var itemPropsHaveChanged = nextProps.itemCount !== itemCount || nextProps.itemSize !== itemSize || nextProps.estimatedItemSize !== estimatedItemSize;

    if (nextProps.itemCount !== itemCount || nextProps.estimatedItemSize !== estimatedItemSize) {
      this.sizeAndPositionManager.updateConfig({
        itemCount: nextProps.itemCount,
        estimatedItemSize: this.getEstimatedItemSize(nextProps)
      });
    }

    if (itemPropsHaveChanged) {
      this.recomputeSizes();
    }

    if (nextProps.scrollOffset !== scrollOffset) {
      this.setOffset(nextProps.scrollOffset);
    } else if (scrollPropsHaveChanged || nextProps.scrollToIndex && itemPropsHaveChanged) {
      this.setOffset(this.getOffsetForIndex(nextProps.scrollToIndex, nextProps.scrollToAlignment, nextProps.itemCount));
    }
  };

  VirtualList.prototype.componentDidUpdate = function componentDidUpdate(nextProps, nextState) {
    var offset = this.state.offset;


    if (nextState.offset !== offset) {
      this.scrollTo(offset);
    }
  };

  VirtualList.prototype.getEstimatedItemSize = function getEstimatedItemSize() {
    var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.props;

    return props.estimatedItemSize || typeof props.itemSize === "number" && props.itemSize || 50;
  };

  VirtualList.prototype.setOffset = function setOffset(offset) {
    if (this.pauseScroll) return;

    this.setState({ offset: offset });
  };

  VirtualList.prototype.setPauseScroll = function setPauseScroll(pause) {
    this.pauseScroll = pause;
  };

  VirtualList.prototype.getNodeOffset = function getNodeOffset() {
    var scrollDirection = this.props.scrollDirection;

    return this.rootNode[scrollProp[scrollDirection]];
  };

  VirtualList.prototype.scrollTo = function scrollTo(value) {
    if (this.pauseScroll) return;

    var _props3 = this.props,
        scrollDirection = _props3.scrollDirection,
        animate = _props3.animate,
        animationDuration = _props3.animationDuration;

    var currentScroll = this.rootNode[scrollProp[scrollDirection]];

    if (currentScroll === value) return;

    if (!animate) {
      this.rootNode[scrollProp[scrollDirection]] = value;
      return;
    }

    // Animate scroll offset
    if (this.lastScroll) this.lastScroll.cancel();
    this.lastScroll = animateScroll(this.rootNode, value, animationDuration);
  };

  VirtualList.prototype.getOffsetForIndex = function getOffsetForIndex(index) {
    var scrollToAlignment = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.props.scrollToAlignment;
    var itemCount = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.props.itemCount;
    var scrollDirection = this.props.scrollDirection;


    if (index < 0 || index >= itemCount) {
      index = 0;
    }

    return this.sizeAndPositionManager.getUpdatedOffsetForIndex({
      align: scrollToAlignment,
      containerSize: this.props[sizeProp[scrollDirection]],
      targetIndex: index
    });
  };

  VirtualList.prototype.getSize = function getSize(index) {
    var itemSize = this.props.itemSize;


    if (typeof itemSize === 'function') {
      return itemSize(index);
    }

    return Array.isArray(itemSize) ? itemSize[index] : itemSize;
  };

  VirtualList.prototype.getStyle = function getStyle(index) {
    var _extends2;

    var style = this._styleCache[index];
    if (style) {
      return style;
    }

    var scrollDirection = this.props.scrollDirection;

    var _sizeAndPositionManag = this.sizeAndPositionManager.getSizeAndPositionForIndex(index),
        size = _sizeAndPositionManag.size,
        offset = _sizeAndPositionManag.offset;

    return this._styleCache[index] = _extends({}, STYLE_ITEM, (_extends2 = {}, _extends2[sizeProp[scrollDirection]] = size, _extends2.transform = positionProp[scrollDirection] + '(' + offset + 'px)', _extends2));
  };

  VirtualList.prototype.recomputeSizes = function recomputeSizes() {
    var startIndex = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

    this._styleCache = {};
    this.sizeAndPositionManager.resetItem(startIndex);
  };

  VirtualList.prototype.render = function render() {
    var _extends3;

    /* eslint-disable no-unused-vars */
    var _props4 = this.props,
        estimatedItemSize = _props4.estimatedItemSize,
        height = _props4.height,
        overscanCount = _props4.overscanCount,
        renderItem = _props4.renderItem,
        itemCount = _props4.itemCount,
        itemSize = _props4.itemSize,
        scrollDirection = _props4.scrollDirection,
        scrollOffset = _props4.scrollOffset,
        scrollToIndex = _props4.scrollToIndex,
        scrollToAlignment = _props4.scrollToAlignment,
        style = _props4.style,
        width = _props4.width,
        displayBottomUpwards = _props4.displayBottomUpwards,
        animate = _props4.animate,
        animationDuration = _props4.animationDuration,
        props = _objectWithoutProperties(_props4, ['estimatedItemSize', 'height', 'overscanCount', 'renderItem', 'itemCount', 'itemSize', 'scrollDirection', 'scrollOffset', 'scrollToIndex', 'scrollToAlignment', 'style', 'width', 'displayBottomUpwards', 'animate', 'animationDuration']);

    var offset = this.state.offset;

    var _sizeAndPositionManag2 = this.sizeAndPositionManager.getVisibleRange({
      containerSize: this.props[sizeProp[scrollDirection]],
      offset: offset,
      overscanCount: overscanCount
    }),
        start = _sizeAndPositionManag2.start,
        stop = _sizeAndPositionManag2.stop;

    var totalSize = this.sizeAndPositionManager.getTotalSize();

    var wrapperStyle = _extends({}, STYLE_WRAPPER, style, { width: width, height: height });
    var innerStyle = _extends({}, STYLE_INNER, (_extends3 = {}, _extends3[sizeProp[scrollDirection]] = totalSize, _extends3));

    var items = [];

    for (var index = start; index <= stop; index++) {
      items.push(renderItem({
        index: index,
        style: this.getStyle(index)
      }));
    }

    if (displayBottomUpwards) {
      wrapperStyle.maxHeight = height;
      delete wrapperStyle.height;

      innerStyle.minHeight = '0';

      // Transition height up until it maxes out
      if (animate && totalSize < height) innerStyle.transition = 'height ' + animationDuration / 1000 + 's ease';
    }

    return React.createElement(
      'div',
      _extends({
        ref: this._getRef
      }, props, {
        onScroll: this.handleScroll,
        onWheel: this.handleWheel,
        style: wrapperStyle
      }),
      React.createElement(
        'div',
        {
          style: innerStyle
        },
        items
      )
    );
  };

  return VirtualList;
}(PureComponent), _class.defaultProps = {
  overscanCount: 3,
  scrollDirection: DIRECTION_VERTICAL,
  width: '100%',
  animationDuration: 200
}, _temp2);
export { VirtualList as default };
process.env.NODE_ENV !== "production" ? VirtualList.propTypes = {
  estimatedItemSize: PropTypes.number,
  height: PropTypes.number.isRequired,
  itemCount: PropTypes.number.isRequired,
  itemSize: PropTypes.oneOfType([PropTypes.number, PropTypes.array, PropTypes.func]).isRequired,
  overscanCount: PropTypes.number,
  renderItem: PropTypes.func.isRequired,
  scrollOffset: PropTypes.number,
  scrollToIndex: PropTypes.number,
  scrollToAlignment: PropTypes.oneOf([ALIGN_START, ALIGN_CENTER, ALIGN_END]),
  scrollDirection: PropTypes.oneOf([DIRECTION_HORIZONTAL, DIRECTION_VERTICAL]).isRequired,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  displayBottomUpwards: PropTypes.bool,
  animate: PropTypes.bool,
  animationDuration: PropTypes.number
} : void 0;