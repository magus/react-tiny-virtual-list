import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import animateScroll from './animateScroll';
import SizeAndPositionManager from './SizeAndPositionManager';
import {
  ALIGN_CENTER,
  ALIGN_END,
  ALIGN_START,
  DIRECTION_VERTICAL,
  DIRECTION_HORIZONTAL,
  positionProp,
  scrollProp,
  sizeProp,
} from './constants';

const STYLE_WRAPPER = {overflow: 'auto', willChange: 'transform', WebkitOverflowScrolling: 'touch'};
const STYLE_INNER = {position: 'relative', overflow: 'hidden', width: '100%', minHeight: '100%'};
const STYLE_ITEM = {position: 'absolute', left: 0, width: '100%'};

export default class VirtualList extends PureComponent {
  static defaultProps = {
    overscanCount: 3,
    scrollDirection: DIRECTION_VERTICAL,
    width: '100%',
  };

  static propTypes = {
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
  }

  sizeAndPositionManager = new SizeAndPositionManager({
    itemCount: this.props.itemCount,
    itemSizeGetter: ({index}) => this.getSize(index),
    estimatedItemSize: this.getEstimatedItemSize(),
  });

  state = {
    offset: (
      this.props.scrollOffset ||
      this.props.scrollToIndex != null && this.getOffsetForIndex(this.props.scrollToIndex) ||
      0
    ),
  };

  pauseScroll = false;

  _styleCache = {};

  _getRef = node => {
    this.rootNode = node;
  };

  componentDidMount() {
    const {scrollOffset, scrollToIndex} = this.props;

    if (scrollOffset != null) {
      this.scrollTo(scrollOffset);
    } else if (scrollToIndex != null) {
      this.scrollTo(this.getOffsetForIndex(scrollToIndex));
    }
  }

  componentWillReceiveProps(nextProps) {
    const {
      estimatedItemSize,
      itemCount,
      itemSize,
      scrollOffset,
      scrollToAlignment,
      scrollToIndex,
    } = this.props;
    const scrollPropsHaveChanged = (
      nextProps.scrollToIndex !== scrollToIndex ||
      nextProps.scrollToAlignment !== scrollToAlignment
    );
    const itemPropsHaveChanged = (
      nextProps.itemCount !== itemCount ||
      nextProps.itemSize !== itemSize ||
      nextProps.estimatedItemSize !== estimatedItemSize
    );

    if (
      nextProps.itemCount !== itemCount ||
      nextProps.estimatedItemSize !== estimatedItemSize
    ) {
      this.sizeAndPositionManager.updateConfig({
        itemCount: nextProps.itemCount,
        estimatedItemSize: this.getEstimatedItemSize(nextProps),
      });
    }

    if (itemPropsHaveChanged) {
      this.recomputeSizes();
    }

    if (nextProps.scrollOffset !== scrollOffset) {
      this.setOffset(nextProps.scrollOffset);
    } else if (
      scrollPropsHaveChanged ||
      nextProps.scrollToIndex && itemPropsHaveChanged
    ) {
      this.setOffset(this.getOffsetForIndex(nextProps.scrollToIndex, nextProps.scrollToAlignment, nextProps.itemCount));
    }
  }

  componentDidUpdate(nextProps, nextState) {
    const {offset} = this.state;

    if (nextState.offset !== offset) {
      this.scrollTo(offset);
    }
  }

  handleScroll = e => {
    const {onScroll} = this.props;
    const offset = this.getNodeOffset();

    this.setState({offset});

    if (typeof onScroll === 'function') {
      onScroll(offset, e);
    }
  };

  handleWheel = e => {
    const offset = this.getNodeOffset();
    const size = this.sizeAndPositionManager.getTotalSize();
    const height = this.props.height;

    if (size < height || offset + height >= size) {
      this.pauseScroll = false;
    } else if (e.deltaY < 0) {
      // Only pause for scroll up
      if (this.lastScroll) this.lastScroll.cancel();
      this.pauseScroll = true;
    }
  };

  getEstimatedItemSize(props = this.props) {
    return props.estimatedItemSize || typeof props.itemSize === "number" && props.itemSize || 50;
  }

  setOffset(offset) {
    if (this.pauseScroll) return;

    this.setState({ offset: offset });
  }

  setPauseScroll(pause) {
    this.pauseScroll = pause;
  }

  getNodeOffset() {
    const {scrollDirection} = this.props;
    return this.rootNode[scrollProp[scrollDirection]];
  }

  scrollTo(value) {
    if (this.pauseScroll) return;

    const { scrollDirection, animate } = this.props;
    const currentScroll = this.rootNode[scrollProp[scrollDirection]];

    if (currentScroll === value) return;

    if (!animate) {
      this.rootNode[scrollProp[scrollDirection]] = value;
      return;
    }

    // Animate scroll offset
    if (this.lastScroll) this.lastScroll.cancel();
    this.lastScroll = animateScroll(this.rootNode, value, 1000);

  }

  getOffsetForIndex(index, scrollToAlignment = this.props.scrollToAlignment, itemCount = this.props.itemCount) {
    const {scrollDirection} = this.props;

    if (index < 0 || index >= itemCount) {
      index = 0;
    }

    return this.sizeAndPositionManager.getUpdatedOffsetForIndex({
      align: scrollToAlignment,
      containerSize: this.props[sizeProp[scrollDirection]],
      targetIndex: index,
    });
  }

  getSize(index) {
    const {itemSize} = this.props;

    if (typeof itemSize === 'function') { return itemSize(index); }

    return Array.isArray(itemSize) ? itemSize[index] : itemSize;
  }

  getStyle(index) {
    const style = this._styleCache[index];
    if (style) { return style; }

    const {scrollDirection} = this.props;
    const {size, offset} = this.sizeAndPositionManager.getSizeAndPositionForIndex(index);

    return this._styleCache[index] = {
      ...STYLE_ITEM,
      [sizeProp[scrollDirection]]: size,
      transform: `${positionProp[scrollDirection]}(${offset}px)`,
    };
  }

  recomputeSizes(startIndex = 0) {
    this._styleCache = {};
    this.sizeAndPositionManager.resetItem(startIndex);
  }

  render() {
    /* eslint-disable no-unused-vars */
    const {
      estimatedItemSize,
      height,
      overscanCount,
      renderItem,
      itemCount,
      itemSize,
      scrollDirection,
      scrollOffset,
      scrollToIndex,
      scrollToAlignment,
      style,
      width,
      displayBottomUpwards,
      animate,
      ...props
    } = this.props;
    const {offset} = this.state;
    const {start, stop} = this.sizeAndPositionManager.getVisibleRange({
      containerSize: this.props[sizeProp[scrollDirection]],
      offset,
      overscanCount,
    });

    const totalSize = this.sizeAndPositionManager.getTotalSize();

    const wrapperStyle = {...STYLE_WRAPPER, ...style, width, height };
    const innerStyle = {
      ...STYLE_INNER,
      [sizeProp[scrollDirection]]: totalSize,
    };

    const items = [];

    for (let index = start; index <= stop; index++) {
      items.push(renderItem({
        index,
        style: this.getStyle(index),
      }));
    }

    if (displayBottomUpwards) {
      wrapperStyle.maxHeight = height;
      delete wrapperStyle.height;

      innerStyle.minHeight = '0';

      // Transition height up until it maxes out
      if (animate && totalSize < height) innerStyle.transition = 'height 1s ease';
    }

    return (
      <div
        ref={this._getRef}
        {...props}
        onScroll={this.handleScroll}
        onWheel={this.handleWheel}
        style={wrapperStyle}
      >
        <div
          style={innerStyle}
        >
          {items}
        </div>
      </div>
    );
  }
}
