const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const Item = {
  init: function(title, day, month, year, description) {
    this.title = title;
    this.day = day;
    this.month = month;
    this.year = year;
    this.description = description;
    this.id = App.getRandomId();
    this.complete = false;
    return this;
  }
}

let App = {
  $modal: $('.modal'),
  lastId: 0,
  getTodoList: function() {
    this.list = JSON.parse(localStorage.getItem('items')) || [];
    return this.list.sort(function(a,b){
      if (a.complete === false && b.complete === true) {
        return -1;
      } else if ( a.complete === true && b.complete === false) {
        return 1;
      } else {
        return 0;
      }
    });
  },
  saveTodoList: function() {
   localStorage.setItem('items', JSON.stringify(this.list));
  },
  toggleForm: function(e) {
    if ($('.modal:hidden').length) {
      this.$modal.fadeIn();
    } else if (e.target === e.currentTarget) {
      this.$modal.fadeOut();
      setTimeout(function() {
        this.resetForm();
      }.bind(this), 500);
    }
  },
  resetForm: function() {
    $('form').get(0).reset();
  },
  getRandomId: function() {
    let id = Math.floor(Math.random()* 100);

    let ids = this.list.map(function(item) {
      return item.id;
    });

    return ids.indexOf(id) >= 0 ? this.getRandomId : id;
  },
  updateItemStatus: function() {
   if (this.list[this.currentItemIndex].complete) {
    this.list[this.currentItemIndex].complete = false;
   } else {
    this.list[this.currentItemIndex].complete = true;
   }
   this.saveTodoList();
  },
  handleCheckbox: function(e) {
    let $checkbox = $(e.target).find("input[type=checkbox]");
    if ($checkbox.prop("checked")) {
      $checkbox.prop("checked", false);
    } else {
     $checkbox.prop("checked", true);
    }
    this.updateItemStatus();
    this.render();
  },
  deleteItem: function() {
    this.currentItemLi.remove();
    this.list.splice(this.currentItemIndex, 1);
    this.saveTodoList();
  },
  handleItemClick: function(e) {
    let targetName = e.target.tagName;
    this.currentItemLi = $(e.target).closest(".item");
    this.currentItemId = this.currentItemLi.data("id");
    this.currentItem = this.list.find(function(item) {
      return item.id === this.currentItemId;
    }.bind(this));
    this.currentItemIndex = this.list.indexOf(this.currentItem);

    if (targetName === 'LABEL') {
      this.setFormData();
      this.toggleForm(e);
    } else if  (targetName === "IMG") {
      let $target = $(e.target);
      this.deleteItem();
      this.render();
    } else if (e.target.className === 'add') {
      this.toggleForm(e);
    } else if (targetName === 'INPUT' || targetName === "DIV"){
       this.handleCheckbox(e);
    }
  },
  getFormData: function() {
    let inputs = $('form').get(0).elements;

    function parseMonth(month) {
      let monthNo = MONTHS.indexOf(month) + 1;
      if (monthNo < 10) {
        return `0${monthNo}`;
      } else {
        return monthNo;
      }
    }

    let data = {
      title: inputs.title.value,
      day: inputs.day.value,
      month: parseMonth(inputs.month.value),
      year: inputs.year.value,
      description: inputs.description.value
    }

    return data;
  },
  setFormData: function() {
    let inputs = $('form').get(0).elements;


    inputs.title.value = this.currentItem.title;
    inputs.day.value = this.currentItem.day;
    inputs.month.value = MONTHS[+this.currentItem.month - 1];
    inputs.year.value = this.currentItem.year;
    inputs.description.value = this.currentItem.description;
  },
  createItem: function() {
    let data = this.getFormData();
    let item =  Object.create(Item).init(data.title, data.day, data.month, data.year, data.description);
    this.list.push(item);
    this.saveTodoList();
  },
  updateItem: function() {
    let data = this.getFormData();
    let current = this.list[this.currentItemIndex];

    current.title = data.title;
    current.day = data.day;
    current.month = data.month;
    current.year = data.year;
    current.description = data.description;

    this.saveTodoList();
  },
  handleSave: function(e) {
    this.currentItem ? this.updateItem() : this.createItem();
    this.render();
    this.toggleForm(e);
  },
  handleFormButtons: function(e) {
    e.preventDefault();
    let target = e.target;

    if (target.innerText === "Save") {
      this.handleSave(e);
    } else {
      this.handleCheckbox(e);
      this.toggleForm(e);
    }
  },
  bindEvents: function() {
    $(".modal-overlay").on("click", this.toggleForm.bind(this));
    $("form button").on("click", this.handleFormButtons.bind(this));
    $("ul").on("click", this.handleItemClick.bind(this));
  },
  render: function() {
    let todos = {
      items: this.getTodoList()
    };
    if (todos.items.length !== 0) {
      $(".item").remove();
      let item = this.itemTemplate(todos);
      $("#todo_list").append(item);
    }
    this.renderHeader();
  },
  renderHeader: function() {
    let arg = arguments[0];
    let headerTitle;
    let counter;
    if (arg) {
      headerTitle = arg.innerText;
    } else {
      headerTitle = "All Todos";
      counter = this.list.length;
    }
    $('header h2').text(headerTitle);
    $('.task_counter').text(counter);
  },
  createTemplates: function() {
    let item = $("#item-template").html();
    this.itemTemplate = Handlebars.compile(item);
  },
  init: function() {
    this.createTemplates();
    this.render();
    this.bindEvents();
  }
};

App.init();