const mongoose = require("mongoose");
const subjectModel = require("../models/subjectModel");

// getSubject
const getSubject = async (req, res) => {
    try{
        const subject = await subjectModel.find().sort({name:1});
        return res.status(200).json(subject);
    }
    catch (error) {
        res.status(500).json({message: error + "subject get controller is error "});
    }
};
const getSubjectById = async (req, res) => {
   try {
       const {id} = req.params.id;
       const subjectId = await subjectModel.findById(id);
       if(!subjectId){
           res.status(404).json(subjectId);
       }
   }
   catch (error) {
        res.status(500).json({message: error + "subject getById controller is error "});
   }
};
const createSubject = async (req, res) => {
   try{
       const {name,code,description} = req.body;
       if(!name && !code){
           res.status(400).json({message:"name is required"});
       }
       const newSubject = subjectModel.create({name,code,description});
       res.status(200).json(newSubject);
   }
   catch (error) {
        res.status(500).json({message: error + "subject create controller is error "});
   }
};
const updateSubject = async (req, res) => {
   try{
       const updateSubject = await subjectModel.updateOne(req.paramas.id,req.body,{new: true});
       if(!updateSubject) res.status(404).json({message:"not found"});
       res.status(200).json(updateSubject);
   }
   catch (error) {
        res.status(500).json({message: error + "subject update controller is error "});
   }
}
const deleteSubject = async (req, res) => {
    try{
        const deleteSubject = await subjectModel.findByIdAndDelete(req.params.id);
        if(!deleteSubject) res.status(404).json({message:"not found"});
        res.status(200).json({message:"message deleted successfully"});

    }
    catch (error) {
        res.status(500).json({message: error + "subject delete controller is error "});
    }
}

module.exports = {
    getSubject,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
}