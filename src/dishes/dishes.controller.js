const path = require("path");

// Use the existing dishes data
//create, read, update, and list dishes. Note that dishes cannot be deleted.
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

//GET /dishes This route will respond with a list of all existing dish data.
function list (req, res) {
    res.json({ data: dishes });
}

//POST /dishes This route will save the dish and respond with the newly created dish.
//add validation to include name, description, price, image_url in POST orders
const validateProperties = (req, res, next) => {
  const { data } = req.body;
  // check if body contains name, description, price and image_url
  const requiredProps = ['name', 'description', 'price', 'image_url'];
  
  requiredProps.forEach(prop => {
    if (!data[prop]) {
      next({
          status: 400, 
          message: `Dish must include a ${prop}`
      });
    }
    if (prop === 'price') {
      if (!Number.isInteger(data['price']) || data['price'] <= 0)
      next({
          status: 400, 
          message: `Dish must have a price that is an integer greater than 0`
      });
    }
  });
  return next();
}
const findDishId = (dishId) => {
    return dishes.find(({id}) => id===dishId)
}

//validation
function dishIdExists(req, res, next) {
    const { dishId } = req.params;
     const foundDish = dishes.find((dish) => dish.id === dishId);

    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    }

    next({
        status: 404, 
        message: `Dish does not exist: ${dishId}.`,
    })
}

const matchIdWithDishId = (req, res, next) => {
  const { dishId } = req.params;
    const { data: { id } = {} } = req.body;

  if (id && id !== dishId) {
    next({
        status: 400, 
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    })
  }
  next();
}

function read(req, res) {
     res.json({data:res.locals.dish});
}

function update(req, res, next) {
    const dish = res.locals.dish;
    const { data: { name, description, price, image_url } = {} } = req.body;

    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;

    res.json({ data: dish });
}

function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(), 
        name, 
        description, 
        price, 
        image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}



module.exports = {
    list,
    read: [dishIdExists, read],
    update: [dishIdExists, validateProperties, matchIdWithDishId, update],
    create: [
        validateProperties,
        create
    ]
}
