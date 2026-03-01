const {getSubject,
    getSubjectById,
    createSubject,
    deleteSubject,
    updateSubject} = require("../controller/SubjectController")
const express = require("express");
const router = express.Router();

router.get("/",getSubject);
router.get("/subject/:id",getSubjectById);
router.post("/",createSubject);
router.delete("/:id",deleteSubject);
router.put("/:id",updateSubject);
router.delete("/:id",deleteSubject);

module.exports = router;