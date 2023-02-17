// TODO: Implement the /orders routes needed to make the tests pass
const router = require("express").Router();
const controller = require("./orders.controller");

// create, read, update, delete, and list

router
    .route("/")
    .get(controller.list)
    .post(controller.create);

router 
    .route("/:orderId")
    .get(controller.read)
    .delete(controller.destroy)
    .put(controller.update)
//     .all(methodNotAllowed);


module.exports = router;
