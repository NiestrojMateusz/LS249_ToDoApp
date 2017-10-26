/*jshint esversion: 6 */
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const Item = {
  dueDate: function() {
    if (this.month === "Month" || this.year === "Year") {
      return "No due date";
    } else {

      return `${this.month}/${this.year.slice(2)}`;
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
  init: function(dueDate, completed) {
    this.dueDate = dueDate;
    this.counter = 1;
    this.counterCompleted = function() {
      if (completed) {
        return 1;
      } else {
        return 0;
      }
    }();
    this.renderCompleted = false;
    return this;
  }
};

const App = {
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
    this.updateCategories();
    this.getCurrentCategory(this.currentCategory.dueDate || this.currentCategory);
    this.renderCompleted();
    if (this.currentCategoryTree === "Completed" && !$(".nav__completed ul").children().length){
      this.renderList([]);
    } else {
      this.renderList(this.currentCategoryItems);
    }
    this.renderHeaders(this.currentCategory);
  },
  deleteItem: function() {
    this.currentItemLi.remove();
    this.currentCategory.counter -= 1;
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
    } else if  (targetName === "IMG" || $(e.target).hasClass('thrash')) {
        let $target = $(e.target);
        this.deleteItem();

        this.renderCategories();
        this.renderCompleted();
        this.renderHeaders(this.currentCategory);
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
    };

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
    return Object.create(Category).init(item.dueDate, item.complete);
  },
  checkCategoryComplete: function(category) {
    let items = this.filterByCategory(category);

    return items.every(function(item) {
      return item.complete;
    });
  },
  updateCategories: function() {
    let storage = JSON.parse(localStorage.getItem('items')) || [];
    let categories = [];
    storage.forEach(function(item) {
      if (categories.length) {
        let found = false;
        for (let i=0; i < categories.length; i++) {
          if (categories[i].dueDate === item.dueDate) {
            categories[i].counter += 1;
            if (item.complete) {
              categories[i].counterCompleted +=1;
            }
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
    $("nav").find(".active").removeClass("active");
    $('.nav__all header').addClass("active");
  },
  handleFormButtons: function(e) {
    e.preventDefault();
    let target = e.target;

    if (target.innerText === "Save") {
      this.handleSave(e);
    } else {
      if (this.list[this.currentItemIndex] && this.list[this.currentItemIndex].complete) {
        alert("Already marked as complete");
      } else if (!this.currentItem) {
        alert("Cannot mark as complete as item has not been created yet!");
      } else {
        this.handleCheckbox(e);
      }
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

        if (this.currentCategoryTree === "Completed") {
          this.currentCategoryItems = this.currentCategoryItems.filter(function(item) {
            return item.complete;
          }.bind(this));
        }

        break;
    }
  },
  handleCategoryClick: function(e) {
    e.preventDefault();
    let categoryTitle = $(e.currentTarget).find("a").text() || $(e.currentTarget).find('h2').text();

    // check if click was on completed categories and set result as currentCategory tree
    if ($(e.currentTarget).closest("section").hasClass("nav__completed")) {
      this.currentCategoryTree = "Completed";
    } else {
      this.currentCategoryTree = "All todos";
    }
    // get the category title and filtered all the elements form that category
    this.getCurrentCategory(categoryTitle);
    let filtered = this.currentCategoryItems;
    // if click was on completed category filter above item for only completed items
    if (this.currentCategoryTree === "Completed") {
      filtered = filtered.filter(function(item) {
        return item.complete;
      });
    }

    filtered.length ? this.renderList(filtered) : $(".item").remove();
    this.renderHeaders(this.currentCategory);

    $("nav").find(".active").removeClass("active");
    $("nav .task_counter").removeClass("task_counter--active");
    $(e.currentTarget).addClass("active");
    $(e.currentTarget).children('.task_counter').addClass('task_counter--active');
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
    } else {
      $(".item").remove();
    }
  },
  renderCompleted: function() {
    let completedCategories = [];
    let completedItems = this.filterCompleted().map(function(item){
      return item.dueDate;
    });

    completedItems.forEach(function(item) {
      for (let i=0; i < this.categories.length; i++) {
        if (this.categories[i].dueDate === item && !completedCategories.includes(this.categories[i])) {
          this.categories[i].renderCompleted = true;
          completedCategories.push(this.categories[i]);
        }
      }
    }.bind(this));

    let categories = {
      categories: completedCategories
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
    let navAllCounter = this.list.length;
    let completeCounter = this.filterCompleted().length;
    if (typeof(arg) === "object") {
      headerTitle = arg.dueDate;
    } else if ( arg === "Completed") {
      headerTitle = arg;
    } else {
      headerTitle = arg || "All Todos";
      $('.nav__all header .task_counter').text(counter);
    }
    counter = $('#todo_list').children('.item').length;
    $('.nav__all header .task_counter').text(navAllCounter);
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