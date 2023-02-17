const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function list (req, res) {
  res.json({ data: orders });
}

const validateProperties = (req, res, next) => {
  const { data } = req.body;
  const requiredProps = ['deliverTo', 'mobileNumber', 'dishes'];
  
  requiredProps.forEach(prop => {
    if (!data[prop]) {
      next({
          status: 400, 
          message: `Order must include a ${prop}`
      });
    }
    if (prop === 'dishes') {
      // check if data['dishes'] is an array OR has length > 0 || 
      if (data[prop].length === 0 || !Array.isArray(data[prop])) {
          next({
              status: 400, 
              message: 'Order must include at least one dish'
          });
      }
      // check if each dish contains quantity
      data[prop].forEach((dish, index) => {
        if (!dish['quantity'] || !Number.isInteger(dish['quantity']) || dish['quantity'] <= 0) {
          next({
              status: 400, 
              message: `Dish ${index} must have a quantity that is an integer greater than 0`
          });
        }
      })
    }
  })
  return next();
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;

    const order = {
        id: nextId(), 
        deliverTo, 
        mobileNumber, 
        status, 
        dishes
    };
    orders.push(order);
    res.status(201).json({ data: order });
}

const foundOrder = (orderId) => {
    return orders.find(({id}) => id===orderId);
}

function orderIdExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id == orderId);

    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404, 
        message: `Order does not exist: ${orderId}.`,
    })
}

function read(req, res) {
     res.json({data:res.locals.order});
}

function validateId(req, res, next) {
    const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const { orderId } = req.params;
//     console.log(orderId)
    if (!req.body.data.id || req.body.data.id === "") {
      return next();
    }
    if (req.body.data.id != res.locals.order.id) {
      next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
      })
    }
    else {
      return next();
    }
  
}

function validateStatus(req, res, next) {
    const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    if (!status || status === "" || status === "invalid") {
      return next({
        status: 400,
        message: "Order must have a status of pending, preparing, out-for-delivery, delivered",
      });
    }
    else if (status === "delivered") {
      next({
        status: 400,
        message: "A delivered order cannot be changed",
      })
    }
    else {
      return next();
    }
}


function update(req, res, next) {
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    
    order.id = res.locals.order.id;
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;

    res.json({ data: order });
}

function isPending(req, res, next) {
    const { status } = res.locals.order;
    if (status !== "pending") {
        return next({
            status: 400, 
            message: "An order cannot be deleted unless it is pending.",
        })
    }
    next();
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === Number(orderId));
  // `splice()` returns an array of the deleted elements, even if it is one element
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
    list,
    create: [
      validateProperties,
      create,
    ],
    read: [
      orderIdExists, 
      read,
    ],
    update: [orderIdExists, validateProperties, validateId, validateStatus, update],
    destroy: [
      orderIdExists, 
      isPending,
      destroy,
    ]
}

