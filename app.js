const express = require('express');
const app = express();
const path = require('path');

const viewrdr = path.join(__dirname, 'views');
const scriptdir = path.join(__dirname, 'scripts');
const imagesdir = path.join(__dirname, 'images');
const port = 5002;

//Views
app.get('/', (req, res)=>{
    res.sendFile(path.join(viewrdr, 'index.html'));
})

app.get('/login', (req, res)=>{
    res.sendFile(path.join(viewrdr, 'login.html'));
})

app.get('/register', (req, res)=>{
    res.sendFile(path.join(viewrdr, 'register.html'));
})

app.get('/terminallocation', (req, res)=>{
    res.sendFile(path.join(viewrdr, 'selecterminallocation.html'));
})
app.get('/dashboard', (req, res)=>{
    res.sendFile(path.join(viewrdr, 'dashboard.html'));
})
app.get('/analytics', (req, res)=>{
    res.sendFile(path.join(viewrdr, 'analytics.html'));
})

app.get('/tracker', (req, res)=>{
    res.sendFile(path.join(viewrdr, 'bustrack.html'));
})

app.get('/reservations', (req, res)=>{
    res.sendFile(path.join(viewrdr, 'reservation.html'));
})
app.get('/systemlogs', (req, res)=>{
    res.sendFile(path.join(viewrdr, 'logs.html'));
})
app.get('/notifications', (req, res)=>{
    res.sendFile(path.join(viewrdr, 'notifications.html'));
})
app.get('/busadding', (req, res)=>{
    res.sendFile(path.join(viewrdr, 'scheduling.html'));
})
app.get('/destinations', (req, res)=>{
    res.sendFile(path.join(viewrdr, 'destinations.html'));
})

//Scripts

app.get('/loginchecker', (req, res)=>{
    res.sendFile(path.join(scriptdir, 'loginchecker.js'));
})
app.get('/loginscript', (req, res)=>{
    res.sendFile(path.join(scriptdir, 'login.js'));
})

app.get('/fleet', (req, res)=>{
    res.sendFile(path.join(scriptdir, 'fleet.js'));
})

app.get('/registerscript', (req, res)=>{
    res.sendFile(path.join(scriptdir, 'signup.js'));
})

app.get('/terminalselectjs', (req, res)=>{
    res.sendFile(path.join(scriptdir, 'terminalselection.js'));
})
app.get('/dashboardjs', (req, res)=>{
    res.sendFile(path.join(scriptdir, 'dashboarddata.js'));
})
app.get('/auth', (req, res)=>{
    res.sendFile(path.join(scriptdir, 'auth.js'));
})
app.get('/analyticsjs', (req, res)=>{
    res.sendFile(path.join(scriptdir, 'analytics.js'));
})

app.get('/model', (req, res)=>{
    res.sendFile(path.join(scriptdir, 'model.js'));
})

app.get('/notificationsjs', (req, res)=>{
    res.sendFile(path.join(scriptdir, 'notifications.js'));
})

app.get('/reservationsjs', (req, res)=>{
    res.sendFile(path.join(scriptdir, 'reservations.js'));
})

app.get('/busesjs', (req, res)=>{
    res.sendFile(path.join(scriptdir, 'buses.js'));
})

app.get('/addingdestinations', (req, res)=>{
    res.sendFile(path.join(scriptdir, 'addingdestinations.js'));
})

//images
app.get('/bg', (req, res)=>{
    res.sendFile(path.join(imagesdir, 'bg.png'));
})
app.get('/bus', (req, res)=>{
    res.sendFile(path.join(imagesdir, 'bus.png'));
})
app.get('/counter', (req, res)=>{
    res.sendFile(path.join(imagesdir, 'counter.png'));
})
app.get('/landing', (req, res)=>{
    res.sendFile(path.join(imagesdir, 'landing.png'));
})
app.get('/logo', (req, res)=>{
    res.sendFile(path.join(imagesdir, 'logo.png'));
})
app.get('/logo1', (req, res)=>{
    res.sendFile(path.join(imagesdir, 'logo1.png'));
})
app.get('/newlogo', (req, res)=>{
    res.sendFile(path.join(imagesdir, 'newlogo.png'));
})
app.get('/movingbus', (req, res)=>{
    res.sendFile(path.join(imagesdir, 'iconr.png'));
})
app.get('/parkb', (req, res)=>{
    res.sendFile(path.join(imagesdir, 'iconb.png'));
})
app.get('/bicon', (req, res)=>{
    res.sendFile(path.join(imagesdir, 'bus_icon.png'));
})
app.get('/conicon', (req, res)=>{
    res.sendFile(path.join(imagesdir, 'conductor_icon.jpg'));
})
app.get('/destinationsbg', (req, res)=>{
    res.sendFile(path.join(imagesdir, 'destinationsbg.jpg'));
})
// app.get('/bicon', (req, res)=>{
//     res.sendFile(path.join(imagesdir, 'bus_icon.png'));
// })
//server
app.listen(port, ()=>{
    console.log("Server is listening in http://localhost:5002/")
})