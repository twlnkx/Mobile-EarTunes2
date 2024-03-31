const express = require('express');
const router = express.Router();
const {Product} = require('../models/product');
const {Category} = require('../models/category')
const mongoose = require('mongoose');
const multer = require('multer');

//mimetype inicates the format of a file
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


router.get(`/`, async (req, res) => {
    let filter = {};
    if (req.query.categories) {
        filter = { category: req.query.categories.split(',') };
    }

    const productList = await Product.find(filter).populate('category');

    if (!productList) {
        res.status(500).json({ success: false });
    }
    res.send(productList);
});


router.get(`/:id`, async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category');

    if (!product) {
        res.status(500).json({ success: false });
    }
    res.send(product);
});

router.post(`/`, uploadOptions.array('image', 10), async (req, res) => {
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

    const product = new Product({
        name: req.body.name,
        description: req.body.description,
        image: imagePath, //"http://localhost:3000/public/upload/image-2323232"
        // images: imagesPaths,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    });

    try {
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (err) {
        res.status(500).json({
            error: err,
            success: false
        });
    }
});


router.delete('/:id', (req, res) => {
    Product.findByIdAndDelete(req.params.id)
        .then((Product) => {
            if (Product) {
                return res
                    .status(200)
                    .json({
                        success: true,
                        message: 'the product is deleted!',
                    });
            } else {
                return res
                    .status(404)
                    .json({ success: false, message: 'product not found!' });
            }
        })
        .catch((err) => {
            return res.status(500).json({ success: false, error: err });
        });
});

router.put('/:id', uploadOptions.array('image', 10),async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id');
    }
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category');

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).send('Invalid Product!');

    
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
    


    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            image: imagePath,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
        },
        { new: true }
    );

    if (!updatedProduct)
        return res.status(500).send('the product cannot be updated!');

    res.send(updatedProduct);
});


//count
router.get(`/get/count`, async (req, res) => {
    const productCount = await Product.countDocuments();

    if (!productCount) {
        res.status(500).json({ success: false });
    }
    res.send({
        productCount: productCount,
    });
});

router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0;
    const products = await Product.find({ isFeatured: true }).limit(+count);

    if (!products) {
        res.status(500).json({ success: false });
    }
    res.send(products);
});


//multiple image upload for gallery
// router.put(
//     '/gallery-images/:id',
//     uploadOptions.array('images', 10),
//     async (req, res) => { 
//         if (!mongoose.isValidObjectId(req.params.id)) {
//             return res.status(400).send('Invalid Product Id');
//         }
//         const files = req.files;
//         let imagesPaths = [];
//         const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

//         if (files) {
//             files.map((file) => {
//                 imagesPaths.push(`${basePath}${file.filename}`);
//             });
//         }

//         const product = await Product.findByIdAndUpdate(
//             req.params.id,
//             {
//                 images: imagesPaths,
//             },
//             { new: true }
//         );

//         if (!product)
//             return res.status(500).send('the gallery cannot be updated!');

//         res.send(product);
//     }
// );

module.exports = router;