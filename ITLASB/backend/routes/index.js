const express = require('express');
const router  = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { register, login } = require('../controllers/authController');
const { getAllDrivers, addDriver, deleteDriver } = require('../controllers/driverController');
const { getAllTrucks, addTruck, deleteTruck } = require('../controllers/truckController');
const { createWork, getMyWork, getAllWork, getWorkById } = require('../controllers/workController');

// Auth
router.post('/auth/register', register);
router.post('/auth/login',    login);

// Drivers (admin read, admin write)
router.get('/drivers',          authMiddleware, getAllDrivers);
router.post('/drivers',         authMiddleware, adminOnly, addDriver);
router.delete('/drivers/:id',   authMiddleware, adminOnly, deleteDriver);

// Trucks
router.get('/trucks',           authMiddleware, getAllTrucks);
router.post('/trucks',          authMiddleware, adminOnly, addTruck);
router.delete('/trucks/:id',    authMiddleware, adminOnly, deleteTruck);

// Work
router.post('/work',            authMiddleware, createWork);
router.get('/work',             authMiddleware, adminOnly, getAllWork);
router.get('/work/my',          authMiddleware, getMyWork);
router.get('/work/:id',         authMiddleware, getWorkById);

module.exports = router;
