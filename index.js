const API = (() => {
  const URL = "http://localhost:3000";
  const getCart = () => {
    // define your method to get cart data
    return fetch(`${URL}/cart`).then((response) => response.json());
  };

  const getInventory = () => {
    // define your method to get inventory data
    return fetch(`${URL}/inventory`).then((response) => response.json());

  };

  const addToCart = (inventoryItem) => {
    // define your method to add an item to cart
    return fetch(`${URL}/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inventoryItem),
    }).then(response => response.json());
  };

  const updateCart = (id, newAmount) => {
    // define your method to update an item in cart
    return fetch(`${URL}/cart/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: newAmount }),
    }).then(response => response.json());
  };

  const deleteFromCart = (id) => {
    // define your method to delete an item in cart
    return fetch(`${URL}/cart/${id}`, {
      method: 'DELETE',
    }).then(response => response.json());
  };

  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart
      this.#onChange()
    }
    set inventory(newInventory) {
      this.#inventory = newInventory
      this.#onChange()
    }

    subscribe(cb) {
      this.#onChange = cb
    }
  }
  const {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  } = API;
  return {
    State,
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const View = (() => {
  // implement your logic for View
  inventoryContainer = document.getElementsByClassName('inventory-container')[0]
  cartContainer = document.getElementsByClassName('cart-container')[0]
  cartWrapper = document.getElementsByClassName('cart-wrapper')[0]
  inventoryList = document.getElementsByClassName('inventory-list')[0]
  cartList = document.getElementsByClassName('cart-list')[0]
  checkoutBtn = document.getElementsByClassName('checkout-btn')[0]

  function setInventoryValues(inventory){
    inventoryList.innerHTML = ''
    inventoryList.innerHTML = inventory.map(item=>
       `
      <li id="${item.id}">
        <span class="content">${item.content}</span>
          <button class="decrease">-</button>
          <span class="amount">${item.amountAdded}</span>
          <button class="increase">+</button>
          <button class="add-to-cart">Add to Cart</button>
      </li>
    `
    ).join('');
  }

  function setCartValues(cart){
    cartList.innerHTML = cart.map(item => `
      <li id="${item.id}">
        <span class="cart-content">${item.content}</span>
        <span>x</span>
        <span class="cart-amount">${item.amount}</span>
        <button class="delete-btn">Delete</button>
      </li>
    `).join('');

  }

  return {setInventoryValues, setCartValues, inventoryContainer, inventoryList, cartContainer, cartList, cartWrapper, checkoutBtn};
})();

const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const init = () => {};
  const handleUpdateAmount = () => {
    view.inventoryList.addEventListener('click', (event)=>{
      event.preventDefault()
      element = event.target
      if(element.className == 'decrease'){
        const li = event.target.closest('li');
        const amountEl = li.querySelector('.amount');
        let amount = parseInt(amountEl.textContent, 10);
        if (amount > 0){
          amountEl.textContent = --amount;  
        }

      }else if(element.className == 'increase'){
        const li = event.target.closest('li');
        const amountEl = li.querySelector('.amount');
        let amount = parseInt(amountEl.textContent, 10);
        amountEl.textContent = ++amount;
      }else if(element.className == 'add-to-cart'){
        const li = event.target.closest('li');
        const amountEl = li.querySelector('.amount');
        const amount = parseInt(amountEl.textContent, 10);
        const id = li.id;
        if (amount > 0){
          handleAddToCart(id, amount)
        }
      }
    })
  };


  const handleAddToCart = (id, amount) => {
    state.inventory.forEach(element => {
      if(element.id == id){
        element.amountAdded = amount
      }
    });
    const item = state.inventory.find(item => item.id == id);
    const cartItem = state.cart.find(item => item.id == id);

    if(cartItem){
      const newAmount = cartItem.amount + amount;
      model.updateCart(id, newAmount).then(() => {
        state.cart = state.cart.map(item =>
          item.id == id ? { ...item, amount: newAmount } : item
        );
      });
    }else {
      model.addToCart(
        { 
          id: item.id, 
          content: item.content, 
          amount: amount 

        }).then(newItem => {
        state.cart = [...state.cart, newItem];
      });

    }
  };

  const handleDelete = () => {
    view.cartContainer.addEventListener('click', ()=>{
      element = event.target
      if(element.className == 'delete-btn'){
        const id = element.parentElement.getAttribute('id')
        model.deleteFromCart(id).then(()=>{
          return model.getCart()
        }).then((data)=>{
          state.cart = data
        })
      }
    })
  };

  const handleCheckout = () => {
    view.checkoutBtn.addEventListener('click', ()=>{
      model.checkout().then(() => {
        state.cart = [];
      });
    })

  };

  const bootstrap = () => {
    state.subscribe(()=>{
      view.setInventoryValues(state.inventory)
      view.setCartValues(state.cart)
    })
    model.getCart().then((data)=>{
      state.cart = data
    })
    model.getInventory().then((data)=>{
      data.forEach(element => {
        element.amountAdded = 0
      });
      state.inventory = data
    })
    handleUpdateAmount()
    handleDelete()
    handleCheckout()
  };
  return {
    bootstrap,
  };
})(Model, View);

Controller.bootstrap();
