import express from 'express';
import router from './routes/bookingRoutes.js';

const app = express();
app.use('/api/bookings', router);

console.log('Registered Routes for /api/bookings:');
app._router.stack.forEach(layer => {
    if (layer.route) {
        console.log(`${Object.keys(layer.route.methods).join(',').toUpperCase()} ${layer.route.path}`);
    } else if (layer.name === 'router') {
        layer.handle.stack.forEach(subLayer => {
            if (subLayer.route) {
                console.log(`${Object.keys(subLayer.route.methods).join(',').toUpperCase()} ${subLayer.route.path}`);
            }
        });
    }
});
