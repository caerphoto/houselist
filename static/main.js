/*global Vue */
function formatNumber(num) {
  var sNum;

  if (!num) {
    return;
  }

  // Reverse string, so digits can be grouped properly.
  sNum = Math.round(num).toString().split('').reverse().join('');

  sNum = sNum
    .replace(/(\d\d\d)/g, '$1,')
    .replace(/,$/, '')
    .replace(/,/g, ',');

  // Return string to its proper order.
  return sNum.split('').reverse().join('');
}

Vue.component('todo-item', {
  props: {
    text: String,
    cost: Number,
    index: Number,
    isDragging: Boolean,
    isDraggingOver: Boolean,
    isDraggingOverTop: Boolean
  },
  template: '#todo-item',
  delimiters: ['<$', '$>'],
  data: function () {
    return {
      isEditorVisible: false,
      newText: this.text,
      newCost: this.cost
    };
  },
  computed: {
    formattedCost: function () {
      return formatNumber(this.cost);
    }
  },
  watch: {
    text: function () { this.newText = this.text; },
    cost: function () { this.newCost = this.cost; }
  },
  methods: {
    showEditor: function () {
      this.isEditorVisible = true;
      this.$nextTick(function () {
        this.$refs.text.focus();
      });
    },
    hideAndApply: function () {
      this.isEditorVisible = false;
      this.$emit('update-item', {
        text: this.newText,
        cost: this.newCost
      });
    },
    startDragging: function (event) {
      this.$emit('start-dragging', event);
    },
    doDrag: function (event) {
      var el = event.currentTarget;
      var upperHalf;
      var elRect = el.getBoundingClientRect();
      var y = event.clientY - elRect.top;
      if (!el) return;
      upperHalf = (y / el.offsetHeight) <= 0.5;
      this.$emit('dragging-over', upperHalf);
    }
  }
});

var app = new Vue({
  el: '#app',
  delimiters: ['<$', '$>'],
  data: {
    saving: false,
    saved: false,
    newItemText: '',
    newItemCost: 0,
    items: [],
    previousItems: [],
    nextItemId: 0,
    draggingIndex: -1,
    draggingOverIndex: -1
  },
  computed: {
    totalCost: function () {
      if (this.items.length === 0) {
        return 0;
      }
      return formatNumber(this.items.reduce(function (sum, item) {
        return sum + item.cost;
      }, 0));
    }
  },
  methods: {
    addNewItem: function () {
      this.nextItemId += 1;
      this.items.push({
        id: this.nextItemId,
        text: this.newItemText,
        cost: this.newItemCost
      });

      this.newItemText = '';
      this.newItemCost = 0;

      this.$refs.newTextInput.focus();
    },
    updateItem: function (index, newItem) {
      newItem.id = this.items[index].id;
      this.items.splice(index, 1, newItem);
    },
    removeItem: function (index) {
      this.items.splice(index, 1);
    },
    getMinimalItems: function () {
      return this.items.map(function (item) {
        return {
          text: item.text,
          cost: item.cost
        };
      });
    },
    saveItems: function () {
      var xhr = new XMLHttpRequest();
      var _this = this;

      xhr.addEventListener('load', function () {
        _this.saving = false;
        _this.saved = this.reponse < 300;
      });

      xhr.open('POST', '/save');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(this.getMinimalItems()));
    },
    startDragging: function (index, event) {
      this.draggingIndex = index;
      event.preventDefault();
    },
    stopDragging: function (newIndex, top) {
      var oldIndex = this.draggingIndex;

      if (oldIndex === -1) return;

      if (!top) newIndex += 1;
      if (newIndex > this.items.length) newIndex -= 1;

      this.items.splice(newIndex, 0, this.items[oldIndex]);
      if (newIndex > oldIndex) {
        this.items.splice(oldIndex, 1);
      } else {
        this.items.splice(oldIndex + 1, 1);
      }

      this.draggingIndex = -1;
    },
    draggingOver: function (index, upperHalf) {
      var item = this.items[index];
      this.draggingOverIndex = index;

      item.draggingTop = upperHalf;
      this.$set(this.items, index, item);
    }
  },
  watch: {
    items: function () {
      var newItems;
      var previousItems = this.previousItems;
      var noChange;

      // Only save if important fields have changed.
      newItems = this.getMinimalItems();
      noChange = newItems.length === previousItems.length &&
        newItems.every(function (item, index) {
          return item.text === previousItems[index].text &&
            item.cost === previousItems[index].cost;
        });
      if (noChange) return;
      this.saveItems();
      this.previousItems = newItems;
    }
  },
  beforeMount: function () {
    if (window.initialListData) {
      var nextItemId = this.nextItemId;

      window.initialListData.forEach(function (item) {
        nextItemId = Math.max(item.id, nextItemId + 1);
      }.bind(this));

      this.nextItemId = nextItemId;

      [].push.apply(this.items, window.initialListData);
      this.previousItems = this.getMinimalItems();
    }
  },
  mounted: function () {
    this.$refs.newTextInput.focus();
    document.addEventListener('mouseup', function () {
      this.draggingIndex = -1;
    }.bind(this));
  }
});
