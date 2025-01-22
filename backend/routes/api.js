import express from 'express';

const router = express.Router();

//Placeholder test
router.get('/', (req, res) => {
    res.json({ message: 'API is running!' })
});

//User routes
router.post('/users', (req, res) => [
    res.status(201).json({ message: 'User created!' })
]);

router.post('/users/login', (req, res) => {
    res.status(200).json({ message: 'User logged in!' })
});

//Tour routes
router.post('/tours', (req, res) => {
    res.status(201).json({ message: 'Tour created!' })
});

export default router;