const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const Item = {
  dueDate: function() {
    if (this.month === "Month" || this.year === "Year") {
      return "No due date";
    } else {
      return `${this.month}/${this.year}`;
    }
  },
  init: function(title, day, month, year, description) {
    this.title = title;
    this.day = day;
    this.month = month;
    this.year = year;
    this.dueDate = this.dueDate();
    this.description = description;
    this.id = App.getRandomId();
    this.complete = false;
    return this;
  }
};

const Category = {
  init: function(dueDate) {
    this.dueDate = dueDate;
    this.counter = 1;
    return this;
  }
};

let App = {
  $modal: $('.modal'),
  getTodoList: function() {
    this.list = JSON.parse(localStorage.getItem('items')) || [];

    if (this.filterCompleted().length) {
      return this.list.sort(function(a,b){
        if (a.complete === false && b.complete === true) {
          return -1;
        } else if ( a.complete === true && b.complete === false) {
          return 1;
        } else {
          return 0;
        }
      });
    } else {
      return this.list;
    }
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
    this.getCurrentCategory(this.currentCategory.dueDate);
    this.renderCompleted();
    this.renderList(this.currentCategoryItems);
    this.renderHeaders(this.currentCategory);
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

      if (!this.checkCategoryComplete(this.currentCategory)) {
        this.renderList();
      }

      this.renderCategories();
      this.renderCompleted();
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
  createNewCategory: function(item) {
    return Object.create(Category).init(item.dueDate);
  },
  checkCategoryComplete: function(category) {
    let items = this.filterByCategory(category);

    return items.every(function(item) {
      return item.complete;
    });
  },
  updateCategories: function() {
    let storage = JSON.parse(localStorage.getItem('items'));
    let categories = [];
    storage.forEach(function(item) {
      if (categories.length) {
        let found = false;
        for (let i=0; i < categories.length; i++) {
          if (categories[i].dueDate === item.dueDate) {
            categories[i].counter += 1;
            found = true;
            break;
          }
        }
        if (!found) {
          categories.push(this.createNewCategory(item));
        }
      } else {
          categories.push(this.createNewCategory(item));
      }
    }.bind(this));
    this.categories = categories;
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
    current.dueDate = Item.dueDate.call(current);

    this.saveTodoList();
  },
  handleSave: function(e) {
    this.currentItem ? this.updateItem() : this.createItem();
    this.renderList();
    this.renderCategories();
    this.renderHeaders();
    this.renderCompleted();
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
  filterByCategory: function(category) {
    let filtered = this.getTodoList().filter(function(item){
      return item.dueDate === category;
    });

    return filtered;
  },
  filterCompleted: function() {
    return this.list.filter(function(item) {
      return item.complete;
    });
  },
  getCurrentCategory: function() {
    let categoryTitle = arguments[0] || "All Todos";
    let list = this.getTodoList();

    switch (categoryTitle) {
      case "All Todos":
        this.currentCategory = categoryTitle;
        this.currentCategoryItems = list;
        break;
      case "Completed":
        this.currentCategory = categoryTitle;
        this.currentCategoryItems = this.filterCompleted();
        break;
      default:
        this.currentCategory = this.categories.find(function(category) {
          return category.dueDate === categoryTitle;
        });

        this.currentCategoryItems = list.filter(function(item) {
          return item.dueDate === this.currentCategory.dueDate;
        }.bind(this));
        break;
    }
  },
  handleCategoryClick: function(e) {
    e.preventDefault();
    let categoryTitle = $(e.currentTarget).find("a").text() || $(e.currentTarget).find('h2').text();

    this.getCurrentCategory(categoryTitle);
    let filtered = this.currentCategoryItems;
    filtered.length ? this.renderList(filtered) : $(".item").remove();
    this.renderHeaders(this.currentCategory);

    $("nav").find(".active").removeClass("active");
    $(e.currentTarget).addClass("active");
  },
  renderList: function() {
    let todos;
    if (arguments.length) {
      todos = {
        items: arguments[0]
      };
    } else {
      todos = {
        items: this.getTodoList()
      };
    }

    if (todos.items.length !== 0) {
      $(".item").remove();
      let item = this.itemTemplate(todos);
      $("#todo_list").append(item);
    }
  },
  renderCompleted: function() {
    let completed = [];
    this.categories.forEach(function(category) {
      if (this.checkCategoryComplete(category.dueDate)) {
        completed.push(category);
      }
    }.bind(this));

    let categories = {
      categories: completed
    };

    $(".nav__completed ul li").remove();
    let category = this.categoryTemplate(categories);
    $(".nav__completed ul").append(category);
  },
  renderCategories: function() {
    this.updateCategories();
    let categories = {
      categories: this.categories
    };
    $(".nav__all ul li").remove();
    let category = this.categoryTemplate(categories);
    $(".nav__all ul").append(category);
  },
  renderHeaders: function() {
    let arg = arguments[0];
    let headerTitle;
    let counter;
    let completeCounter = this.filterCompleted().length;
    if (typeof(arg) === "object") {
      headerTitle = arg.dueDate;
      counter = arg.counter;
    } else if ( arg === "Completed") {
      headerTitle = arg;
      counter = completeCounter;
    } else {
      headerTitle = arg || "All Todos";
      counter = this.list.length;
      $('.nav__all header .task_counter').text(counter);
    }
    $('main header h2').text(headerTitle);
    $('main header .task_counter').text(counter);
    $('.nav__completed header .task_counter').text(completeCounter);
  },
  createTemplates: function() {
    let item = $("#item-template").html();
    let category = $("#category-template").html();
    this.itemTemplate = Handlebars.compile(item);
    this.categoryTemplate = Handlebars.compile(category);
  },
  bindEvents: function() {
    $(".modal-overlay").on("click", this.toggleForm.bind(this));
    $("form button").on("click", this.handleFormButtons.bind(this));
    $("#todo_list").on("click", this.handleItemClick.bind(this));
    $("nav").on("click", "li, header", this.handleCategoryClick.bind(this));
  },
  init: function() {
    this.createTemplates();
    this.updateCategories();
    this.renderList();
    this.renderCategories();
    this.renderCompleted();
    this.renderHeaders();
    this.getCurrentCategory();
    this.bindEvents();
  }
};

App.init();