const express = require("express");
const mongoose = require("mongoose");
const birthday = require("./models/birthday");


const app = express();

const mongodbConnectLink="mongodb+srv://swarajrupadhyay:EupyKwXaBs4@clusterbirthday.9jailnj.mongodb.net/birthday_database?retryWrites=true&w=majority&appName=ClusterBirthday";
mongoose.connect(mongodbConnectLink)
 .then(result =>  console.log("connected to the database"))
 .catch(error => console.log(error));

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));

app.listen(3000);

app.get('/', (req,res) => {
    birthday.find().sort({createdAt: -1})
    .then(result => {
        res.render("index", {birthdays: result});
    })
    .catch(error => console.log(error));
})

app.get('/create', (req,res)=> {
    res.render("create");
})

app.post('/create', (req,res)=>{
    const DOB = req.body.birthdayDate;
    const date = new Date(DOB);
   
    
    const newBirthday = new birthday({
        person: req.body.person,
        birthdayDate: date
    });
     
    newBirthday.save()
    .then(result => {
        res.redirect('/');
    })
    .catch(err => console.log(err));
})

app.delete('/birthday/:id', (req,res) => {
    const id= req.params.id;

    birthday.findByIdAndDelete(id)
    .then(response => {
        res.json({redirect: "/"});
    })
    .catch(err => console.log(err));
})

app.get('/update/:id', (req,res) => {
    const id=req.params.id;

    birthday.findById(id)
    .then(result => {
        const birthdayDate = result.birthdayDate;
        const dateOnly = birthdayDate.toLocaleDateString();
        res.render("update", {birthday: result , birthdayDate: dateOnly});
    })
   .catch(err =>  console.log(err));
})

app.post('/update/:id', (req,res) => {
    const id= req.params.id;
    const DOB = req.body.presentBirthdayDate;
    const date = new Date(DOB);

    birthday.findByIdAndUpdate(id, { birthdayDate: date}, { new:true , runValidators:true})
    .then(result=> {
       res.redirect('/');
    })
    .catch(err => console.log(err));
})

app.get('/search', (req,res) =>{
    res.render("search");
})

app.post('/search', (req,res) => {
    birthday.findOne({person:"Swaraj Upadhyay"})
    .then(result => {
        res.redirect(`/search/${result._id}`)
    })
})

app.get("/search/:id",(req,res)=> {
    const id = req.params.id;
    birthday.findById(id)
    .then(result => {
        const DOB = result.birthdayDate;
        const onlyDate = DOB.toLocaleDateString();
        res.render("searched", {birthday:result , birthdayDate: onlyDate});
    })
    .catch(err => console.log(err));
})

app.get("/closest_b'day", (req,res) => {
    const currentDate = new Date();
    birthday.find()
    .then(results => {
        let collectedDates = [];
        let counterMonth = [];
        let minMonth = Infinity;
        results.forEach(result => {
            const DOB =  result.birthdayDate;
            if(Math.abs(currentDate.getMonth() - DOB.getMonth()) < minMonth)
            {
                minMonth = Math.abs(currentDate.getMonth() - DOB.getMonth());
                counterMonth = [];
                collectedDates = [];
                counterMonth.push(DOB.getMonth() + 1);
                collectedDates.push(DOB);
            }
            else if(Math.abs(currentDate.getMonth() - DOB.getMonth()) === minMonth)
            {
                counterMonth.push(DOB.getMonth() + 1);
                collectedDates.push(DOB);
            }
        });
        if(counterMonth.length === 1)
        {
            const closestFoundBirthday = collectedDates[0];
            birthday.find({birthdayDate: closestFoundBirthday})
            .then(result => {
                res.render("closest", {birthdays: result});
            })
            .catch(error => console.log(error));
        }
        else if(counterMonth.length > 1)
        {
            if(counterMonth[0] === (currentDate.getMonth() + 1) )
            {
                let minDay = Infinity
                let counter = [];
                collectedDates.forEach(collectedDate => {
                    if(collectedDate.getDate() - currentDate.getDate() > 0)
                    {
                        if(collectedDate.getDate() - currentDate.getDate() < minDay)
                        {
                            minDay = collectedDate.getDate() - currentDate.getDate();
                            counter=[];
                            counter.push(collectedDate);
                        }
                        else if(collectedDate.getDate() - currentDate.getDate() === minDay)
                        {
                            counter.push(collectedDate);
                        }
                    }
                })
                let foundDates = [];
                const promises = counter.map(counterDate => {
                return birthday.findOne({ birthdayDate: counterDate })
                    .then(result => {
                    foundDates.push(result);
                    })
                    .catch(error => console.log(error));
                });

                Promise.all(promises)
                .then(() => {
                    res.render("closest", {birthdays: foundDates});
                    console.log("page rendered same month", counterMonth, counterMonth.length);
                })
                .catch(error => console.log(error));
            }
            else{
                let minDay = Infinity
                let counter = [];
                collectedDates.forEach(collectedDate => {
                        if(collectedDate.getDate() - 1 < minDay)
                        {
                            minDay = collectedDate.getDate() -1;
                            counter=[];
                            counter.push(collectedDate);
                        }
                        else if(collectedDate.getDate() - 1 === minDay)
                        {
                            counter.push(collectedDate);
                        }
                    })
                let foundDates = [];
                const promises = counter.map(counterDate => {
                return birthday.findOne({ birthdayDate: counterDate })
                    .then(result => {
                    foundDates.push(result);
                    })
                    .catch(error => console.log(error));
                });
    
                Promise.all(promises)
                .then(() => {
                    res.render("closest", {birthdays: foundDates});
                    console.log("page rendered")
                })
                .catch(error => console.log(error));
            }
        }
    })
    .catch(err => console.log(err));
})