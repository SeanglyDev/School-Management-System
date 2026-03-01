// src/routes/classRoute.js
const express = require("express");
const router = express.Router();
const { createClass,getClasses,getClassById,deleteClass,updateClass} = require("../controller/classController");

router.get("/", getClasses);
router.get("/:id",getClassById);
router.post("/",createClass);
router.put("/:id", updateClass);
router.delete("/:id",deleteClass);

module.exports = router;
