import express from 'express';
import router from './routes/bookingRoutes.js';

const app = express();
app.use('/api/bookings', router);

function printRoutes(route, prefix = '') {
    if (route.stack) {
        route.stack.forEach(layer => printRoutes(layer, prefix + (route.path || '')));
    } else if (route.route) {
        const methods = Object.keys(route.route.methods).join(',').toUpperCase();
        console.log(`${methods} ${prefix}${route.route.path}`);
    } else if (route.name === 'router') {
        route.handle.stack.forEach(layer => printRoutes(layer, prefix + (route.regexp.source.replace('\\/?(?=\\/|$)', '').replace('^', ''))));
    }
}

console.log('--- All Registered Routes ---');
app._router.stack.forEach(layer => {
    if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
        console.log(`${methods} ${layer.route.path}`);
    } else if (layer.name === 'router') {
        printRoutes(layer);
    }
});
console.log('-----------------------------');
process.exit(0);
