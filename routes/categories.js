const {Category} = require('../models/category');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
};
        
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error('invalid image type');
    if (isValid) {
        uploadError = null;
                }
        cb(uploadError, 'public/uploads'); 
    },
        
    filename: function (req, file, cb) {
    const fileName = file.originalname.split(' ').join('-');
    const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);
            },
});

const uploadOptions = multer({ storage: storage });

router.get(`/`, async (req, res) =>{
    const categoryList = await Category.find();

        if(!categoryList) {
            res.status(500).json({success: false})
            } 
            res.status(200).send(categoryList);
        })

router.get('/:id', async(req,res)=>{
    const category = await Category.findById(req.params.id);

        if(!category) {
            res.status(500).json({message: 'The category with the given ID was not found.'})
        } 
            res.status(200).send(category);
})

router.post(`/`, uploadOptions.array('image',10),async (req,res)=>{
    const files = req.files;
    if (!files) {
        return res.status(400).send('No images in the request');
    }
    //para sa pinakaimage
    let imagePath = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    // Map uploaded files to their paths
    files.forEach(file => {
        imagePath.push(`${basePath}${file.filename}`);
    });

    let category = new Category({
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color,
        image: imagePath
    })
    
    category = await category.save();

    if(!category)
        return res.status(400).send('the category cannot be created!')
        
    res.send(category);
})

router.put('/:id',uploadOptions.array('image',10),async (req, res)=> {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id');
    }

    let imagePath = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    const files = req.files;
    if (files && files.length > 0) {
        files.forEach(file => {
            imagePath.push(`${basePath}${file.filename}`);
        });
    } else {
        imagePath = product.images;
    }

    const category = await Category.findByIdAndUpdate(
        req.params.id,
            {
                name: req.body.name,
                icon: req.body.icon || category.icon,
                color: req.body.color,
                image: imagePath
            },
                { new: true}
            )
        
            if(!category)
            return res.status(400).send('the category cannot be created!')
        
            res.send(category);
        })

router.delete('/:id', (req, res)=>{

    Category.findByIdAndDelete(req.params.id).then(category =>{
        if(category) {
            return res.status(200).json({success: true, message: 'the category is deleted!'})
        } else {
            return res.status(404).json({success: false , message: "category not found!"})
        }
            
        }).catch(err=>{
            return res.status(500).json({success: false, error: err}) 
        })
})

module.exports =router;