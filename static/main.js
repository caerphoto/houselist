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
    index: Number
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
    nextItemId: 0
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
    }
  },
  watch: {
    items: function () {
      var xhr = new XMLHttpRequest();
      var _this = this;

      xhr.addEventListener('load', function () {
        _this.saving = false;
        _this.saved = this.reponse < 300;
      });

      xhr.open('POST', '/save');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(this.items));
    }
  },
  beforeMount: function () {
    if (window.initialListData) {
      [].push.apply(this.items, window.initialListData);
    }
  },
  mounted: function () {
    this.$refs.newTextInput.focus();
  }
});
