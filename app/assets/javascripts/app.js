/**
 * Tiny little kanban board in vanilla JS
 * Might not work effectively on older browsers
 * Uses HTML5 Drag API
 * `webkitMatchesSelector` might not support older engines
 *
 * @author: Elton Jain
*/

var temp;

$( document ).ready(function() {
  $("#boardName")[0].style.width = ($("#boardName")[0].value.length + 1) + 'em';
  $("#subtitle")[0].style.width = ($("#subtitle")[0].value.length + 1) * 12 + 'px';
});

function showEdit(cardId) {
  var currentCard = document.getElementById(cardId).childNodes[1];
  var detail = "showCardDetail";
  var undetail = "hiddenCardDetail";
  if(currentCard.classList.contains(undetail)) {
    var detailedCard = document.getElementsByClassName(detail);
    if(detailedCard.length !=0) {
      detailedCard[0].classList.add(undetail);
      detailedCard[0].classList.remove(detail);
    }
    currentCard.classList.remove(undetail);
    currentCard.classList.add(detail);
    temp = $("#" + cardId )[0].childNodes[1].childNodes[1].value;

  } else {
    currentCard.classList.remove(detail);
    currentCard.classList.add(undetail);
  }
}

function checkClose(listIdstr) {
  var listId = parseInt(listIdstr.slice(5));

  if (getList({_id:listId}).cards==0 && listId != 1)
    document.getElementById("close" + listIdstr).style.display = "initial";
  else
    document.getElementById("close" + listIdstr).style.display = "none";
}
function closeCard(cardId) {
  id = parseInt( cardId.slice(5));
  $.ajax( {
    type: "DELETE",
    url: "/cards/" + id + ".json",
    beforeSend: function(xhr) {xhr.setRequestHeader('X-CSRF-Token', $('meta[name="csrf-token"]').attr('content'))},
    // data: {
    //   "list": {"id" : listId }
    //   },
    success: function(msg){
      // alert();
      current=document.getElementById(cardId);
      current.parentNode.removeChild(current);
      var cardIdtoNo = parseInt(cardId.slice(5));
      var card = getTodo({_id: cardIdtoNo});
      var idx = todos.indexOf(card);
      todos.splice(idx,1);
      --getList({_id: card.listID}).cards;
      updateCardCounts();
      curListID = "list_" + card.listID;
      checkClose(curListID);
      return false;
    }
  });
}

function closeList(listId) {
  var id = parseInt(listId.slice(5));
  $.ajax( {
    type: "DELETE",
    url: "/lists/" + id + ".json",
    beforeSend: function(xhr) {xhr.setRequestHeader('X-CSRF-Token', $('meta[name="csrf-token"]').attr('content'))},
    // data: {
    //   "list": {"id" : listId }
    //   },
    success: function(msg){
      current=document.getElementById(listId);
      current.parentNode.removeChild(current);
    }
  });
}

// Cache common DOM
var UI = {
    elBoard: document.getElementById('board'),
    elTotalCardCount: document.getElementById('totalCards'),
    elCardPlaceholder: null,
  },
  lists = [],
  todos = [],
  isDragging = false,
  _listCounter = 0, // To hold last ID/index to avoid .length based index
  _cardCounter = 0; // To hold last ID/index to avoid .length based index

// Live binding event listener (like jQuery's .on)
function live(eventType, selector, callback) {
  document.addEventListener(eventType, function (e) {
    if (e.target.webkitMatchesSelector(selector)) {
      callback.call(e.target, e);
    }
  }, false);
}


// Draggable Cards
live('dragstart', '.list, .list .card, .uniqueId img', function (e) {
  console.log(e);
  console.log(e.dataTransfer);
  console.log(e.target.classList);
  isDragging = true;
  // e = e.parentNode;
  e.dataTransfer.setData('text/plain', e.target.dataset.id);
  e.dataTransfer.dropEffect = "copy";
  e.target.classList.add('dragging');
});
live('dragend', '.list, .list .card', function (e) {
  this.classList.remove('dragging');
  UI.elCardPlaceholder && UI.elCardPlaceholder.remove();
  UI.elCardPlaceholder = null;
  isDragging = false;
});

// Dropzone
live('dragover', '.list, .list .card, .list .card-placeholder', function (e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  if(this.className === "list") { // List
    this.appendChild(getCardPlaceholder());
  } else if(this.className.indexOf('card') !== -1) { // Card
    this.parentNode.insertBefore(getCardPlaceholder(), this);
  }
});

function updateCard(cardId, cardData) {
  $.ajax( {
    type: "PUT",
    url: "../cards/" + cardId + ".json",
    beforeSend: function(xhr) {xhr.setRequestHeader('X-CSRF-Token', $('meta[name="csrf-token"]').attr('content'))},
    data: {
        card: cardData
      },
    success: function(msg){
      return true;
    }
  });
}

function updateCardElement(cardId, isupdate) {
  cardIdtag = "#todo_" + cardId;
  if(isupdate == 1) {
    var name = $(cardIdtag)[0].childNodes[0].childNodes[1].value;
    var listid = parseInt($(cardIdtag)[0].parentNode.id.slice(5));
    var content = $(cardIdtag)[0].childNodes[1].childNodes[1].value;
    updateCard(cardId, {name: name, list_id: listid, content: content});
    getTodo({_id: cardId}).name = name;
    getTodo({_id: cardId}).list_id = listid;
    getTodo({_id: cardId}).content = content;
  } else {
    // content = temp;
    $(cardIdtag)[0].childNodes[1].childNodes[1].value = temp;
  }
  showEdit("todo_" + cardId);
}


live('drop', '.list, .list .card-placeholder', function (e) {
  e.preventDefault();
  if(!isDragging) return false;
  var todo_id = +e.dataTransfer.getData('text');
  var todo = getTodo({_id: todo_id});
  var newListID = null; 
  if(this.className === 'list') { // Dropped on List
    newListID = this.dataset.id;
    this.appendChild(todo.dom);
  } else { // Dropped on Card Placeholder
    newListID = this.parentNode.dataset.id;
    this.parentNode.replaceChild(todo.dom, this);
  }   

  // console.log(todo_id);
  var success = updateCard(todo_id,{name:todo.name, content: todo.content, list_id: newListID});
  moveCard(todo_id, +newListID);

  
});


function createCard(carddata, index) {
  var name = carddata.name;
  var listID = carddata.list_id;
  if(!name || name === '') return false;
  var newCardId = carddata.id;
  var card = document.createElement("div");
  var list = getList({_id: listID});
  var text = carddata.content;
  card.draggable = true;
  card.dataset.id = newCardId;
  card.dataset.listId = listID;
  card.id = 'todo_' + newCardId;
  card.className = 'card';
  // card.innerHTML = text.trim();
  card.innerHTML = "<div class=\"cardHead\">" +
                   "  <input type=\"text\" class=\"cardName\" onchange=\"updateCardElement("+ newCardId + ", 1" + ")\" value=\""+name.trim() + "\">" +
                   "  <div class=\"uniqueId\" id=\"uniqueCard" + newCardId + "\">" + 
                   "    <label id=\"uniqueCardId" + newCardId + "\">INC" + ('0000' + newCardId).slice(-4) + "</label>" + 
                   "    <img src=\"/assets/draggable\" >" + 
                   "  </div>" + 
                   "  <img src='/assets/moredetailicon' class=\"cardIcons\" onclick=\"showEdit(\'" + card.id + "\')\" />" +
                   "  <img src='/assets/closeicon' id='close' onclick='closeCard(\"" +card.id + "\")' />" + 
                   "</div>" +
                   "<div class=\"hiddenCardDetail\">" +
                   "  <textarea id='text' rows='10' cols='30'>" + text + "</textarea>" +
                   "  <div class=\"cardFooter\">" + 
                   "    <button onclick=\"updateCardElement(" + newCardId + ", 0" +")\">Cancel</button>" +
                   "    <button onclick=\"updateCardElement(" + newCardId + ", 1" + ")\">Save</button>" +
                   "  </div>" + 
                   "</div>";
  var todo = {
    _id: newCardId,
    listID: listID,
    name: name,
    content: text,
    dom: card,
    index: index || list.cards+1 // Relative to list
  };
  todos.push(todo);
  
  // Update card count in list
  ++list.cards;
  checkClose("list_" + listID);
  return card;
}


function addTodo(data, index, updateCounters) {
  var listID = data.list_id;
  var text = data.name;
  if(!text) return false;
  var list = document.getElementById('list_'+listID);
  var card = createCard(data, index);
  if(index) {
    list.insertBefore(card, list.children[index]);
  } else {
    list.appendChild(card);
  }
  // Don't update DOM if said so
  if(updateCounters !== false) updateCardCounts();
}

function updateListTitle(listId) {
  var idlist = "#list_" + listId;
  name = $(idlist)[0].childNodes[0].childNodes[0].value;
  getList({_id: listId}).name = name;
  $.ajax({ url: '/lists/'+listId + ".json",
    type: 'PUT',
    beforeSend: function(xhr) {xhr.setRequestHeader('X-CSRF-Token', $('meta[name="csrf-token"]').attr('content'))},
    data: { 
      list: {
        "name": name,
      }
    },
    success: function(result) {
    }
  });
}
function updateBoardName() {
  var name = $("#boardName")[0].value;
  var subtitle = $("#subtitle")[0].value;
  $.ajax({ url: '/boards/1.json',
    type: 'PUT',
    beforeSend: function(xhr) {xhr.setRequestHeader('X-CSRF-Token', $('meta[name="csrf-token"]').attr('content'))},
    data: { 
      board: {
        "name": name,
        "subtitle": subtitle,
      }
    },
    success: function(result) {
    }
  });
}

function updatesubtitle() {
  var name = $("#boardName")[0].value;
  var subtitle = $("#subtitle")[0].value;
  $.ajax({ url: '/boards/1.json',
    type: 'PUT',
    beforeSend: function(xhr) {xhr.setRequestHeader('X-CSRF-Token', $('meta[name="csrf-token"]').attr('content'))},
    data: { 
      board: {
        "name": name,
        "subtitle": subtitle,
      }
    },
    success: function(result) {
    }
  });
}

function addList(listdata) {
  var name = listdata.name;
  if(!name || name === '') return false;
  name = name.trim();
  var newListID = listdata.id;
  var list = document.createElement("div");
  var heading = document.createElement("div");
  var listname = document.createElement("input");
  var listCounter = document.createElement("span");
  
  
  list.dataset.id = newListID;
  list.id = 'list_'+newListID;
  list.className = "list";
  list.appendChild(heading);
  heading.appendChild(listname);
  heading.appendChild(listCounter);
  heading.className = "listheading";

  listname.className = "listname";
  listname.setAttribute("onchange", "updateListTitle(" + newListID + ")");
  // listname.onchange = "alert()";
  listname.value = name;
  listCounter.className = "listcounter";
  listCounter.innerHTML = 0;
  
  lists.push({
    _id: newListID,
    name: name,
    cards: 0,
    elCounter: listCounter
  });
  
  var closeListStr = "<img src='/assets/closeicon' id='close" + list.id + "' class=\"closeList\" onclick=\"closeList(\'" + list.id + "\')\" />";
  // , parser = new DOMParser()
  // , closeList = parser.parseFromString(closeListStr, "text/html");
  // console.log(closeList);
  list.insertAdjacentHTML( 'beforeend', closeListStr );
    // appendChild(closeList.firstChild);

  UI.elBoard.append(list);
}

function getList (obj) {
  return _.find(lists, obj);
}

function getTodo (obj) {
  return _.find(todos, obj);
}

// Update Card Counts
// Updating DOM objects that are cached for performance
function updateCardCounts (listArray) {
  UI.elTotalCardCount.innerHTML = 'Total Incidents: '+todos.length;
  lists.map(function (list) {
    list.elCounter.innerHTML = list.cards;
  })
}

function moveCard(cardId, newListId, index) {
  if(!cardId) return false;
  try {
    var card = getTodo({_id: cardId});
    if(card.listID !== newListId) { // If different list
      --getList({_id: card.listID}).cards;
      checkClose("list_" + card.listID);
      card.listID = newListId;
      ++getList({_id: newListId}).cards;
      updateCardCounts();
      checkClose("list_"+ newListId);
    }
  
    if(index){
      card.index = index;
    }
    
  } catch (e) {
    console.log(e.message)
  }
}

live('submit', '#frmAddTodo', function (e) {
  e.preventDefault();
  var cardname = this.todo_text.value;
  if(!cardname || cardname === '') return false;
  $.ajax({ url: '/cards.json',
    type: 'POST',
    beforeSend: function(xhr) {xhr.setRequestHeader('X-CSRF-Token', $('meta[name="csrf-token"]').attr('content'))},
    data: {
      card: {
        "name": cardname,
        "content": "",
        "list_id": colLists[0].id
      }
    },
    success: function(result) {
      addTodo(result);
    }
  });
  this.reset();
  return false;
});
live('submit', '#frmAddList', function (e) {
  e.preventDefault();
  var name = _.trim(this.list_name.value);
  if(!name || name === '') return false;

  $.ajax({ 
    url: '/lists.json',
    type: 'POST',
    beforeSend: function(xhr) {xhr.setRequestHeader('X-CSRF-Token', $('meta[name="csrf-token"]').attr('content'))},
    data: {
      list: {
        "name": name,
      }
    },
    success: function(result) {
      addList(result);
    }
  });
  this.reset();
  return false;
});

function getCardPlaceholder () {
  if(!UI.elCardPlaceholder) { // Create if not exists
    UI.elCardPlaceholder = document.createElement('div');
    UI.elCardPlaceholder.className = "card-placeholder";
  }
  return UI.elCardPlaceholder;
}

function init () {
  // Seeding
  // console.log(colLists);
  // console.log(colLists.sort(function(a, b) {
  //   return a.id - b.id;
  // }));

  colLists.forEach(function(data) {
    addList(data);
    checkClose("list_" + data.id);
  });
  // console.log(dbcards);
  dbcards.forEach( function(data) {
    addTodo(data, null, false);
  });
  // addTodo('Card 1', colLists[0].id, null, false);
  // addTodo('Card 2', colLists[0].id, null, false);
  // addTodo('Card 3', colLists[0].id, null, false);
  // addTodo('Card 4', colLists[0].id, null, false);

  updateCardCounts();
  
  // moveCard(2, 1, 3);
}
$("#boardName").keypress(
  function () {
    this.style.width = (this.value.length + 1) + 'em';
    document.title = this.value;
  }
  );
$("#subtitle").keypress(
  function () {
    this.style.width = (this.value.length + 1) * 12 + 'px';
    document.title = this.value;
  }
  );

document.addEventListener("DOMContentLoaded", function() {
  init();
});

function reset_app() {
  var answer=confirm('Are you sure? This will remove all entries and logs');
  if(answer){
    $.ajax( {
      type: "DELETE",
      url: "settings/reset_app",
      beforeSend: function(xhr) {xhr.setRequestHeader('X-CSRF-Token', $('meta[name="csrf-token"]').attr('content'))},
      success: function(msg){
        // window.location.reload(true);
        location.reload();
      }
    });
  }
}
